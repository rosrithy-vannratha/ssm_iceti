import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import {
  Student,
  Teacher,
  Classroom,
  Major,
  AttendanceRecord,
  TeacherAttendance,
  AppUser,
  ShiftType
} from '../types';
import {
  INITIAL_MAJORS,
  INITIAL_CLASSES,
  INITIAL_TEACHERS,
  INITIAL_STUDENTS,
  INITIAL_ATTENDANCE
} from '../data/initialData';

// Local storage backup keys for seamless offline / instant preview
const LS_KEYS = {
  STUDENTS: 'cpi_students_data_v2',
  TEACHERS: 'cpi_teachers_data_v2',
  CLASSES: 'cpi_classes_data_v2',
  MAJORS: 'cpi_majors_data_v2',
  ATTENDANCE: 'cpi_attendance_data_v2',
  TEACHER_ATT: 'cpi_teacher_attendance_data_v2',
  APP_USER: 'cpi_app_user_v2',
};

function getLocal<T>(key: string, defaultData: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      // Only fall back to seed data when nothing has been saved yet.
      // A legitimately empty array (e.g. user deleted everything) must
      // NOT be replaced by the defaults.
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading local cache:', e);
  }
  return defaultData;
}

function setLocal<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Error writing local cache:', e);
  }
}

// --- Instant local UI updates, independent of Firestore ---
// Edit/delete/save must be reflected on screen immediately, even if the
// Firestore write is slow, blocked, or fails silently. Firestore is treated
// as a background sync target, not the source of truth for the live UI.
const localListeners: Record<string, Set<(data: any[]) => void>> = {};

function registerLocalListener(key: string, cb: (data: any[]) => void): () => void {
  if (!localListeners[key]) localListeners[key] = new Set();
  localListeners[key].add(cb);
  return () => localListeners[key]?.delete(cb);
}

function notifyLocal<T>(key: string, data: T[]): void {
  localListeners[key]?.forEach((cb) => cb(data));
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface SyncInfo {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  message?: string;
}

let currentSyncInfo: SyncInfo = {
  status: 'synced',
  lastSyncedAt: new Date(),
  message: 'Real-time cloud sync active'
};

const syncListeners = new Set<(info: SyncInfo) => void>();

export function updateSyncStatus(status: SyncStatus, message?: string) {
  currentSyncInfo = {
    status,
    lastSyncedAt: status === 'synced' ? new Date() : currentSyncInfo.lastSyncedAt,
    message
  };
  syncListeners.forEach((cb) => cb(currentSyncInfo));
}

export function subscribeSyncInfo(cb: (info: SyncInfo) => void): () => void {
  cb(currentSyncInfo);
  syncListeners.add(cb);
  return () => syncListeners.delete(cb);
}

/**
 * Recursively removes all keys with `undefined` values from an object.
 * Firestore throws a fatal error if any field is undefined.
 */
export function sanitizeDoc<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (obj === null || obj === undefined) return {};
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        clean[key] = sanitizeDoc(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean;
}

/**
 * Commits items to Firestore in batches of up to 400 documents (limit is 500)
 */
async function commitInChunks(
  dbInstance: any,
  collectionName: string,
  items: Array<{ id: string; [k: string]: any }>
): Promise<void> {
  const CHUNK_SIZE = 400;
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(dbInstance);
    for (const item of chunk) {
      batch.set(doc(dbInstance, collectionName, item.id), sanitizeDoc(item));
    }
    await batch.commit();
  }
}

/**
 * Deletes Firestore documents in chunks of 400 documents
 */
async function deleteDocsInChunks(
  dbInstance: any,
  docs: Array<{ ref: any }>
): Promise<void> {
  const CHUNK_SIZE = 400;
  for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
    const chunk = docs.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(dbInstance);
    for (const d of chunk) {
      batch.delete(d.ref);
    }
    await batch.commit();
  }
}

// Convert Firebase User to AppUser
export function mapFirebaseUser(user: FirebaseUser | null): AppUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    photoURL: user.photoURL,
  };
}

// Custom event dispatcher for local auth state changes
function dispatchAuthChange(user: AppUser | null) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cpi_auth_change', { detail: user }));
  }
}

export const authService = {
  async signInWithGoogle(): Promise<AppUser> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const appUser = mapFirebaseUser(result.user)!;
      localStorage.setItem(LS_KEYS.APP_USER, JSON.stringify(appUser));
      dispatchAuthChange(appUser);
      return appUser;
    } catch (err: any) {
      console.error('Google popup sign in error:', err);
      // Fallback if popup blocked
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/unauthorized-domain') {
        const fallbackUser: AppUser = {
          uid: `google_fallback_${Date.now()}`,
          email: 'user@cpi.edu.kh',
          displayName: 'គណនី Google (Local Profile)',
          photoURL: null,
        };
        localStorage.setItem(LS_KEYS.APP_USER, JSON.stringify(fallbackUser));
        dispatchAuthChange(fallbackUser);
        return fallbackUser;
      }
      throw err;
    }
  },

  async signInWithEmail(email: string, pass: string): Promise<AppUser> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      const appUser = mapFirebaseUser(result.user)!;
      localStorage.setItem(LS_KEYS.APP_USER, JSON.stringify(appUser));
      dispatchAuthChange(appUser);
      return appUser;
    } catch (err: any) {
      console.warn('Firebase email auth error, attempting local auth fallback:', err);
      // If Firebase email provider is not active or offline, create a local session
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/network-request-failed' ||
        err.code === 'auth/configuration-not-found'
      ) {
        const appUser: AppUser = {
          uid: `usr_${Date.now()}`,
          email: email,
          displayName: email.split('@')[0],
          photoURL: null
        };
        localStorage.setItem(LS_KEYS.APP_USER, JSON.stringify(appUser));
        dispatchAuthChange(appUser);
        return appUser;
      }
      throw err;
    }
  },

  async signUpWithEmail(email: string, pass: string, name: string): Promise<AppUser> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      if (result.user && name) {
        try {
          await updateProfile(result.user, { displayName: name });
        } catch (e) {
          console.warn('Could not update display name:', e);
        }
      }
      const appUser: AppUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: name || result.user.displayName || email.split('@')[0],
        photoURL: result.user.photoURL,
      };
      localStorage.setItem(LS_KEYS.APP_USER, JSON.stringify(appUser));
      dispatchAuthChange(appUser);
      return appUser;
    } catch (err: any) {
      console.warn('Firebase email signup error, creating local account:', err);
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/network-request-failed' ||
        err.code === 'auth/configuration-not-found'
      ) {
        const appUser: AppUser = {
          uid: `usr_local_${Date.now()}`,
          email: email,
          displayName: name || email.split('@')[0],
          photoURL: null,
        };
        localStorage.setItem(LS_KEYS.APP_USER, JSON.stringify(appUser));
        dispatchAuthChange(appUser);
        return appUser;
      }
      throw err;
    }
  },

  signInQuick(displayName: string, role: string, email: string): AppUser {
    const appUser: AppUser = {
      uid: `quick_${role.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
      email: email,
      displayName: displayName,
      photoURL: null,
      role: role
    };
    localStorage.setItem(LS_KEYS.APP_USER, JSON.stringify(appUser));
    dispatchAuthChange(appUser);
    return appUser;
  },

  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signOut warning:', e);
    } finally {
      localStorage.removeItem(LS_KEYS.APP_USER);
      dispatchAuthChange(null);
    }
  },

  onAuthStateChanged(callback: (user: AppUser | null) => void): Unsubscribe {
    // 1. Initial check from localStorage or Firebase
    const rawLocal = localStorage.getItem(LS_KEYS.APP_USER);
    if (rawLocal) {
      try {
        const parsed = JSON.parse(rawLocal);
        if (parsed && parsed.uid) {
          callback(parsed);
        }
      } catch (e) {
        console.warn('Error parsing local user:', e);
      }
    }

    // 2. Listen to custom event for instantaneous local updates
    const handleLocalAuthEvent = (e: Event) => {
      const customEvent = e as CustomEvent<AppUser | null>;
      callback(customEvent.detail);
    };
    window.addEventListener('cpi_auth_change', handleLocalAuthEvent);

    // 3. Listen to Firebase auth state
    const fbUnsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const mapped = mapFirebaseUser(firebaseUser);
        localStorage.setItem(LS_KEYS.APP_USER, JSON.stringify(mapped));
        callback(mapped);
      } else {
        const local = localStorage.getItem(LS_KEYS.APP_USER);
        if (local) {
          try {
            callback(JSON.parse(local));
          } catch {
            callback(null);
          }
        } else {
          callback(null);
        }
      }
    });

    return () => {
      window.removeEventListener('cpi_auth_change', handleLocalAuthEvent);
      fbUnsub();
    };
  },

  getCurrentUser(): AppUser | null {
    if (auth.currentUser) {
      return mapFirebaseUser(auth.currentUser);
    }
    const raw = localStorage.getItem(LS_KEYS.APP_USER);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  }
};

export const instituteService = {
  // --- SEED DATABASE IF EMPTY ---
  async seedInitialDataIfEmpty(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'majors'));
      if (snap.empty) {
        console.log('Seeding initial International Chinese Education and Teachers Institute database...');
        await commitInChunks(db, 'majors', INITIAL_MAJORS);
        await commitInChunks(db, 'classes', INITIAL_CLASSES);
        await commitInChunks(db, 'teachers', INITIAL_TEACHERS);
        await commitInChunks(db, 'students', INITIAL_STUDENTS);
        await commitInChunks(db, 'attendance', INITIAL_ATTENDANCE);
        console.log('Seed completed successfully!');
      }
    } catch (e) {
      console.warn('Firestore seeding check (using local fallback if unauthenticated):', e);
    }
  },

  // --- MAJORS ---
  subscribeMajors(callback: (data: Major[]) => void): Unsubscribe {
    const local = getLocal<Major>(LS_KEYS.MAJORS, INITIAL_MAJORS);
    callback(local);

    const unregisterLocal = registerLocalListener(LS_KEYS.MAJORS, callback as (data: any[]) => void);

    const unsubFirestore = onSnapshot(
      collection(db, 'majors'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              nameKhmer: data.nameKhmer || 'ជំនាញភាសាចិន',
              nameLatin: data.nameLatin || '',
              code: data.code || 'CH-01',
              description: data.description || '',
              totalYears: typeof data.totalYears === 'number' ? data.totalYears : (data.durationYears || 4)
            } as Major;
          });
          setLocal(LS_KEYS.MAJORS, list);
          callback(list);
          updateSyncStatus('synced', 'Majors synced in real-time');
        } else {
          const currentLocal = getLocal<Major>(LS_KEYS.MAJORS, []);
          if (currentLocal && currentLocal.length > 0) {
            commitInChunks(db, 'majors', currentLocal).catch(() => {});
            callback(currentLocal);
          }
          updateSyncStatus('synced');
        }
      },
      (err) => {
        console.warn('Majors snapshot error (using local cache):', err);
        const currentLocal = getLocal<Major>(LS_KEYS.MAJORS, INITIAL_MAJORS);
        callback(currentLocal);
        updateSyncStatus('offline', 'Using local cache (Majors)');
      }
    );

    return () => {
      unregisterLocal();
      unsubFirestore();
    };
  },

  async saveMajor(major: Major): Promise<void> {
    const local = getLocal<Major>(LS_KEYS.MAJORS, INITIAL_MAJORS);
    const idx = local.findIndex((m) => m.id === major.id);
    if (idx >= 0) local[idx] = major;
    else local.push(major);
    setLocal(LS_KEYS.MAJORS, local);
    notifyLocal(LS_KEYS.MAJORS, local);
    updateSyncStatus('syncing', 'Saving major to cloud...');

    try {
      await setDoc(doc(db, 'majors', major.id), sanitizeDoc(major));
      updateSyncStatus('synced', 'Major saved');
    } catch (e: any) {
      console.warn('Error saving major to Firestore:', e);
      updateSyncStatus('error', e?.message || 'Error saving major');
    }
  },

  async deleteMajor(id: string): Promise<void> {
    const local = getLocal<Major>(LS_KEYS.MAJORS, INITIAL_MAJORS).filter((m) => m.id !== id);
    setLocal(LS_KEYS.MAJORS, local);
    notifyLocal(LS_KEYS.MAJORS, local);
    updateSyncStatus('syncing', 'Deleting major...');

    try {
      await deleteDoc(doc(db, 'majors', id));
      updateSyncStatus('synced', 'Major deleted');
    } catch (e: any) {
      console.warn('Error deleting major:', e);
      updateSyncStatus('error', e?.message || 'Error deleting major');
    }
  },

  // --- CLASSES ---
  subscribeClasses(callback: (data: Classroom[]) => void): Unsubscribe {
    const local = getLocal<Classroom>(LS_KEYS.CLASSES, INITIAL_CLASSES);
    callback(local);

    const unregisterLocal = registerLocalListener(LS_KEYS.CLASSES, callback as (data: any[]) => void);

    const unsubFirestore = onSnapshot(
      collection(db, 'classes'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              classCode: data.classCode || data.code || 'CLS-01',
              name: data.name || 'ថ្នាក់រៀន',
              majorId: data.majorId || 'maj_pedagogy',
              majorName: data.majorName || 'គរុកោសល្យភាសាចិន',
              year: data.year || 'Year 1',
              shift: data.shift || 'morning',
              room: data.room || data.roomNumber || 'បន្ទប់ A101',
              academicYear: data.academicYear || '2025-2026',
              teacherId: data.teacherId || undefined,
              teacherName: data.teacherName || undefined,
              createdAt: data.createdAt || new Date().toISOString()
            } as Classroom;
          });
          setLocal(LS_KEYS.CLASSES, list);
          callback(list);
          updateSyncStatus('synced', 'Classes synced in real-time');
        } else {
          const currentLocal = getLocal<Classroom>(LS_KEYS.CLASSES, []);
          if (currentLocal && currentLocal.length > 0) {
            commitInChunks(db, 'classes', currentLocal).catch(() => {});
            callback(currentLocal);
          }
          updateSyncStatus('synced');
        }
      },
      (err) => {
        console.warn('Classes snapshot error (using local cache):', err);
        const currentLocal = getLocal<Classroom>(LS_KEYS.CLASSES, INITIAL_CLASSES);
        callback(currentLocal);
        updateSyncStatus('offline', 'Using local cache (Classes)');
      }
    );

    return () => {
      unregisterLocal();
      unsubFirestore();
    };
  },

  async saveClass(cls: Classroom): Promise<void> {
    const local = getLocal<Classroom>(LS_KEYS.CLASSES, INITIAL_CLASSES);
    const idx = local.findIndex((c) => c.id === cls.id);
    if (idx >= 0) local[idx] = cls;
    else local.push(cls);
    setLocal(LS_KEYS.CLASSES, local);
    notifyLocal(LS_KEYS.CLASSES, local);
    updateSyncStatus('syncing', 'Saving class to cloud...');

    try {
      await setDoc(doc(db, 'classes', cls.id), sanitizeDoc(cls));
      updateSyncStatus('synced', 'Class saved');
    } catch (e: any) {
      console.warn('Error saving class:', e);
      updateSyncStatus('error', e?.message || 'Error saving class');
    }
  },

  async deleteClass(id: string): Promise<void> {
    const local = getLocal<Classroom>(LS_KEYS.CLASSES, INITIAL_CLASSES).filter((c) => c.id !== id);
    setLocal(LS_KEYS.CLASSES, local);
    notifyLocal(LS_KEYS.CLASSES, local);
    updateSyncStatus('syncing', 'Deleting class...');

    try {
      await deleteDoc(doc(db, 'classes', id));
      updateSyncStatus('synced', 'Class deleted');
    } catch (e: any) {
      console.warn('Error deleting class:', e);
      updateSyncStatus('error', e?.message || 'Error deleting class');
    }
  },

  // --- TEACHERS ---
  subscribeTeachers(callback: (data: Teacher[]) => void): Unsubscribe {
    const local = getLocal<Teacher>(LS_KEYS.TEACHERS, INITIAL_TEACHERS);
    callback(local);

    const unregisterLocal = registerLocalListener(LS_KEYS.TEACHERS, callback as (data: any[]) => void);

    const unsubFirestore = onSnapshot(
      collection(db, 'teachers'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              teacherCode: data.teacherCode || 'TCH-000',
              nameKhmer: data.nameKhmer || data.nameLatin || 'សាស្ត្រាចារ្យ',
              nameLatin: data.nameLatin || '',
              gender: data.gender || 'male',
              phone: data.phone || '',
              email: data.email || '',
              subjects: data.subjects || 'ភាសាចិន',
              shift: data.shift || 'morning',
              status: data.status || 'active',
              createdAt: data.createdAt || new Date().toISOString()
            } as Teacher;
          });
          setLocal(LS_KEYS.TEACHERS, list);
          callback(list);
          updateSyncStatus('synced', 'Teachers synced in real-time');
        } else {
          // If Firestore is empty, check if we have local teachers.
          // If so, preserve local data and back-sync to Firestore!
          const currentLocal = getLocal<Teacher>(LS_KEYS.TEACHERS, []);
          if (currentLocal && currentLocal.length > 0) {
            commitInChunks(db, 'teachers', currentLocal).catch(() => {});
            callback(currentLocal);
          } else {
            setLocal(LS_KEYS.TEACHERS, []);
            callback([]);
          }
          updateSyncStatus('synced');
        }
      },
      (err) => {
        console.warn('Teachers snapshot error (using local cache):', err);
        const currentLocal = getLocal<Teacher>(LS_KEYS.TEACHERS, INITIAL_TEACHERS);
        callback(currentLocal);
        updateSyncStatus('offline', 'Using local cache (Teachers)');
      }
    );

    return () => {
      unregisterLocal();
      unsubFirestore();
    };
  },

  async saveTeacher(teacher: Teacher): Promise<void> {
    const local = getLocal<Teacher>(LS_KEYS.TEACHERS, INITIAL_TEACHERS);
    const idx = local.findIndex((t) => t.id === teacher.id);
    if (idx >= 0) local[idx] = teacher;
    else local.push(teacher);
    setLocal(LS_KEYS.TEACHERS, local);
    notifyLocal(LS_KEYS.TEACHERS, local);
    updateSyncStatus('syncing', 'Saving faculty member...');

    try {
      await setDoc(doc(db, 'teachers', teacher.id), sanitizeDoc(teacher));
      updateSyncStatus('synced', 'Teacher saved');
    } catch (e: any) {
      console.warn('Error saving teacher:', e);
      updateSyncStatus('error', e?.message || 'Error saving teacher');
    }
  },

  async saveTeachersBulk(teachers: Teacher[]): Promise<void> {
    const local = getLocal<Teacher>(LS_KEYS.TEACHERS, INITIAL_TEACHERS);
    const map = new Map(local.map((t) => [t.id, t]));
    for (const t of teachers) map.set(t.id, t);
    const merged = Array.from(map.values());
    setLocal(LS_KEYS.TEACHERS, merged);
    notifyLocal(LS_KEYS.TEACHERS, merged);
    updateSyncStatus('syncing', `Uploading ${teachers.length} teachers to cloud...`);

    try {
      await commitInChunks(db, 'teachers', merged);
      updateSyncStatus('synced', `${teachers.length} teachers synced to cloud`);
    } catch (e: any) {
      console.warn('Error saving bulk teachers:', e);
      updateSyncStatus('error', e?.message || 'Error syncing teachers');
    }
  },

  async deleteTeacher(id: string): Promise<void> {
    const local = getLocal<Teacher>(LS_KEYS.TEACHERS, INITIAL_TEACHERS).filter((t) => t.id !== id);
    setLocal(LS_KEYS.TEACHERS, local);
    notifyLocal(LS_KEYS.TEACHERS, local);
    updateSyncStatus('syncing', 'Deleting teacher...');

    try {
      await deleteDoc(doc(db, 'teachers', id));
      updateSyncStatus('synced', 'Teacher deleted');
    } catch (e: any) {
      console.warn('Error deleting teacher:', e);
      updateSyncStatus('error', e?.message || 'Error deleting teacher');
    }
  },

  async deleteAllTeachers(): Promise<void> {
    setLocal(LS_KEYS.TEACHERS, []);
    notifyLocal(LS_KEYS.TEACHERS, []);
    updateSyncStatus('syncing', 'Clearing all teachers...');

    try {
      const snap = await getDocs(collection(db, 'teachers'));
      if (!snap.empty) {
        await deleteDocsInChunks(db, snap.docs);
      }
      updateSyncStatus('synced', 'All teachers deleted');
    } catch (e: any) {
      console.warn('Error deleting all teachers:', e);
      updateSyncStatus('error', e?.message || 'Error clearing teachers');
    }
  },

  // --- STUDENTS ---
  subscribeStudents(callback: (data: Student[]) => void): Unsubscribe {
    const local = getLocal<Student>(LS_KEYS.STUDENTS, INITIAL_STUDENTS);
    callback(local);

    const unregisterLocal = registerLocalListener(LS_KEYS.STUDENTS, callback as (data: any[]) => void);

    const unsubFirestore = onSnapshot(
      collection(db, 'students'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              studentCode: data.studentCode || 'CPI-000',
              nameKhmer: data.nameKhmer || data.nameLatin || 'និស្សិត',
              nameLatin: data.nameLatin || '',
              nameChinese: data.nameChinese || undefined,
              gender: data.gender || 'female',
              dob: data.dob || '',
              phone: data.phone || '',
              email: data.email || undefined,
              majorId: data.majorId || 'maj_pedagogy',
              majorName: data.majorName || 'គរុកោសល្យភាសាចិន',
              classId: data.classId || '',
              className: data.className || 'ថ្នាក់ទូទៅ',
              shift: data.shift || 'morning',
              year: data.year || 'Year 1',
              status: data.status || 'active',
              guardianPhone: data.guardianPhone || undefined,
              address: data.address || undefined,
              photoUrl: data.photoUrl || undefined,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString()
            } as Student;
          });
          setLocal(LS_KEYS.STUDENTS, list);
          callback(list);
          updateSyncStatus('synced', 'Students synced in real-time');
        } else {
          // If Firestore is empty, check if we have local students.
          // If so, preserve local data and back-sync to Firestore!
          const currentLocal = getLocal<Student>(LS_KEYS.STUDENTS, []);
          if (currentLocal && currentLocal.length > 0) {
            commitInChunks(db, 'students', currentLocal).catch(() => {});
            callback(currentLocal);
          } else {
            setLocal(LS_KEYS.STUDENTS, []);
            callback([]);
          }
          updateSyncStatus('synced');
        }
      },
      (err) => {
        console.warn('Students snapshot error (using local cache):', err);
        const currentLocal = getLocal<Student>(LS_KEYS.STUDENTS, INITIAL_STUDENTS);
        callback(currentLocal);
        updateSyncStatus('offline', 'Using local cache (Students)');
      }
    );

    return () => {
      unregisterLocal();
      unsubFirestore();
    };
  },

  async saveStudent(student: Student): Promise<void> {
    const local = getLocal<Student>(LS_KEYS.STUDENTS, INITIAL_STUDENTS);
    const idx = local.findIndex((s) => s.id === student.id);
    if (idx >= 0) local[idx] = student;
    else local.push(student);
    setLocal(LS_KEYS.STUDENTS, local);
    notifyLocal(LS_KEYS.STUDENTS, local);
    updateSyncStatus('syncing', 'Saving student to cloud...');

    try {
      await setDoc(doc(db, 'students', student.id), sanitizeDoc(student));
      updateSyncStatus('synced', 'Student saved');
    } catch (e: any) {
      console.warn('Error saving student:', e);
      updateSyncStatus('error', e?.message || 'Error saving student');
    }
  },

  async saveStudentsBulk(students: Student[]): Promise<void> {
    const local = getLocal<Student>(LS_KEYS.STUDENTS, INITIAL_STUDENTS);
    const map = new Map(local.map((s) => [s.id, s]));
    for (const s of students) map.set(s.id, s);
    const merged = Array.from(map.values());
    setLocal(LS_KEYS.STUDENTS, merged);
    notifyLocal(LS_KEYS.STUDENTS, merged);
    updateSyncStatus('syncing', `Uploading ${students.length} students to cloud...`);

    try {
      await commitInChunks(db, 'students', merged);
      updateSyncStatus('synced', `${students.length} students synced in cloud`);
    } catch (e: any) {
      console.warn('Error saving bulk students:', e);
      updateSyncStatus('error', e?.message || 'Error syncing bulk students');
    }
  },

  async deleteStudent(id: string): Promise<void> {
    const local = getLocal<Student>(LS_KEYS.STUDENTS, INITIAL_STUDENTS).filter((s) => s.id !== id);
    setLocal(LS_KEYS.STUDENTS, local);
    notifyLocal(LS_KEYS.STUDENTS, local);
    updateSyncStatus('syncing', 'Deleting student...');

    try {
      await deleteDoc(doc(db, 'students', id));
      updateSyncStatus('synced', 'Student deleted');
    } catch (e: any) {
      console.warn('Error deleting student:', e);
      updateSyncStatus('error', e?.message || 'Error deleting student');
    }
  },

  async deleteAllStudents(): Promise<void> {
    setLocal(LS_KEYS.STUDENTS, []);
    notifyLocal(LS_KEYS.STUDENTS, []);
    updateSyncStatus('syncing', 'Clearing all students...');

    try {
      const snap = await getDocs(collection(db, 'students'));
      if (!snap.empty) {
        await deleteDocsInChunks(db, snap.docs);
      }
      updateSyncStatus('synced', 'All students deleted');
    } catch (e: any) {
      console.warn('Error deleting all students:', e);
      updateSyncStatus('error', e?.message || 'Error clearing students');
    }
  },

  // --- ATTENDANCE ---
  subscribeAttendance(callback: (data: AttendanceRecord[]) => void): Unsubscribe {
    const local = getLocal<AttendanceRecord>(LS_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    callback(local);

    const unregisterLocal = registerLocalListener(LS_KEYS.ATTENDANCE, callback as (data: any[]) => void);

    const unsubFirestore = onSnapshot(
      collection(db, 'attendance'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              date: data.date || new Date().toISOString().split('T')[0],
              classId: data.classId || '',
              shift: data.shift || 'morning',
              studentId: data.studentId || '',
              studentName: data.studentName || 'និស្សិត',
              status: data.status || 'present',
              note: data.note || undefined,
              createdAt: data.createdAt || new Date().toISOString()
            } as AttendanceRecord;
          });
          setLocal(LS_KEYS.ATTENDANCE, list);
          callback(list);
          updateSyncStatus('synced', 'Attendance synced in real-time');
        } else {
          const currentLocal = getLocal<AttendanceRecord>(LS_KEYS.ATTENDANCE, []);
          if (currentLocal && currentLocal.length > 0) {
            commitInChunks(db, 'attendance', currentLocal).catch(() => {});
            callback(currentLocal);
          }
          updateSyncStatus('synced');
        }
      },
      (err) => {
        console.warn('Attendance snapshot error (using local cache):', err);
        const currentLocal = getLocal<AttendanceRecord>(LS_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
        callback(currentLocal);
        updateSyncStatus('offline', 'Using local cache (Attendance)');
      }
    );

    return () => {
      unregisterLocal();
      unsubFirestore();
    };
  },

  async saveAttendanceBatch(records: AttendanceRecord[]): Promise<void> {
    const local = getLocal<AttendanceRecord>(LS_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    const map = new Map(local.map((r) => [r.id, r]));
    for (const r of records) map.set(r.id, r);
    const merged = Array.from(map.values());
    setLocal(LS_KEYS.ATTENDANCE, merged);
    notifyLocal(LS_KEYS.ATTENDANCE, merged);
    updateSyncStatus('syncing', `Saving ${records.length} attendance records...`);

    try {
      await commitInChunks(db, 'attendance', merged);
      updateSyncStatus('synced', 'Attendance records saved');
    } catch (e: any) {
      console.warn('Error batch saving attendance:', e);
      updateSyncStatus('error', e?.message || 'Error saving attendance');
    }
  },

  // --- TEACHER ATTENDANCE ---
  subscribeTeacherAttendance(callback: (data: TeacherAttendance[]) => void): Unsubscribe {
    const local = getLocal<TeacherAttendance>(LS_KEYS.TEACHER_ATT, []);
    callback(local);

    const unregisterLocal = registerLocalListener(LS_KEYS.TEACHER_ATT, callback as (data: any[]) => void);

    const unsubFirestore = onSnapshot(
      collection(db, 'teacher_attendance'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              date: data.date || new Date().toISOString().split('T')[0],
              teacherId: data.teacherId || '',
              teacherName: data.teacherName || 'សាស្ត្រាចារ្យ',
              shift: data.shift || 'morning',
              subject: data.subject || 'ភាសាចិន',
              status: data.status || 'present',
              note: data.note || undefined,
              createdAt: data.createdAt || new Date().toISOString()
            } as TeacherAttendance;
          });
          setLocal(LS_KEYS.TEACHER_ATT, list);
          callback(list);
          updateSyncStatus('synced', 'Teacher attendance synced in real-time');
        } else {
          const currentLocal = getLocal<TeacherAttendance>(LS_KEYS.TEACHER_ATT, []);
          if (currentLocal && currentLocal.length > 0) {
            commitInChunks(db, 'teacher_attendance', currentLocal).catch(() => {});
            callback(currentLocal);
          }
          updateSyncStatus('synced');
        }
      },
      (err) => {
        console.warn('Teacher attendance snapshot error (using local cache):', err);
        const currentLocal = getLocal<TeacherAttendance>(LS_KEYS.TEACHER_ATT, []);
        callback(currentLocal);
        updateSyncStatus('offline', 'Using local cache (Teacher Attendance)');
      }
    );

    return () => {
      unregisterLocal();
      unsubFirestore();
    };
  },

  async saveTeacherAttendanceBatch(records: TeacherAttendance[]): Promise<void> {
    const local = getLocal<TeacherAttendance>(LS_KEYS.TEACHER_ATT, []);
    const map = new Map(local.map((r) => [r.id, r]));
    for (const r of records) map.set(r.id, r);
    const merged = Array.from(map.values());
    setLocal(LS_KEYS.TEACHER_ATT, merged);
    notifyLocal(LS_KEYS.TEACHER_ATT, merged);
    updateSyncStatus('syncing', `Saving ${records.length} faculty attendance records...`);

    try {
      await commitInChunks(db, 'teacher_attendance', merged);
      updateSyncStatus('synced', 'Faculty attendance saved');
    } catch (e: any) {
      console.warn('Error batch saving teacher attendance:', e);
      updateSyncStatus('error', e?.message || 'Error saving teacher attendance');
    }
  },

  // --- FORCE RE-SYNC ALL DATA FROM FIRESTORE ---
  async forceSyncAll(): Promise<{ success: boolean; message: string }> {
    updateSyncStatus('syncing', 'Refreshing real-time data from Cloud Firestore...');
    try {
      const [majorsSnap, classesSnap, teachersSnap, studentsSnap, attSnap, teacherAttSnap] = await Promise.all([
        getDocs(collection(db, 'majors')),
        getDocs(collection(db, 'classes')),
        getDocs(collection(db, 'teachers')),
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'attendance')),
        getDocs(collection(db, 'teacher_attendance'))
      ]);

      if (!majorsSnap.empty) {
        const list = majorsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Major);
        setLocal(LS_KEYS.MAJORS, list);
        notifyLocal(LS_KEYS.MAJORS, list);
      }
      if (!classesSnap.empty) {
        const list = classesSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Classroom);
        setLocal(LS_KEYS.CLASSES, list);
        notifyLocal(LS_KEYS.CLASSES, list);
      }
      if (!teachersSnap.empty) {
        const list = teachersSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Teacher);
        setLocal(LS_KEYS.TEACHERS, list);
        notifyLocal(LS_KEYS.TEACHERS, list);
      }
      if (!studentsSnap.empty) {
        const list = studentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Student);
        setLocal(LS_KEYS.STUDENTS, list);
        notifyLocal(LS_KEYS.STUDENTS, list);
      }
      if (!attSnap.empty) {
        const list = attSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as AttendanceRecord);
        setLocal(LS_KEYS.ATTENDANCE, list);
        notifyLocal(LS_KEYS.ATTENDANCE, list);
      }
      if (!teacherAttSnap.empty) {
        const list = teacherAttSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as TeacherAttendance);
        setLocal(LS_KEYS.TEACHER_ATT, list);
        notifyLocal(LS_KEYS.TEACHER_ATT, list);
      }

      updateSyncStatus('synced', 'Synchronized successfully with Cloud Firestore');
      return { success: true, message: 'ទិន្នន័យត្រូវបានទាញយក និងធ្វើសមកាលកម្មរួចរាល់' };
    } catch (err: any) {
      console.warn('Force sync error:', err);
      updateSyncStatus('error', err?.message || 'Sync failed');
      return { success: false, message: 'មិនអាចភ្ជាប់ទៅកាន់ Cloud បានទេ: ' + (err?.message || '') };
    }
  },

  // --- CLOUD & LOCAL BACKUP ENGINE ---
  async createCloudBackup(user: AppUser | null): Promise<string> {
    const students = getLocal<Student>(LS_KEYS.STUDENTS, INITIAL_STUDENTS);
    const teachers = getLocal<Teacher>(LS_KEYS.TEACHERS, INITIAL_TEACHERS);
    const classes = getLocal<Classroom>(LS_KEYS.CLASSES, INITIAL_CLASSES);
    const majors = getLocal<Major>(LS_KEYS.MAJORS, INITIAL_MAJORS);
    const attendance = getLocal<AttendanceRecord>(LS_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    const teacherAttendance = getLocal<TeacherAttendance>(LS_KEYS.TEACHER_ATT, []);

    const backupId = `backup_${Date.now()}`;
    const backupPayload = {
      id: backupId,
      timestamp: new Date().toISOString(),
      createdBy: user?.displayName || user?.email || 'អ្នកគ្រប់គ្រង (Admin)',
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalClasses: classes.length,
      totalMajors: majors.length,
      totalAttendance: attendance.length,
      totalTeacherAttendance: teacherAttendance.length,
      data: JSON.stringify({
        students,
        teachers,
        classes,
        majors,
        attendance,
        teacherAttendance
      })
    };

    // Save to Firestore
    try {
      await setDoc(doc(db, 'backups', backupId), backupPayload);
    } catch (e) {
      console.warn('Error uploading cloud backup to Firestore:', e);
    }

    // Also store latest snapshot in localStorage backup list
    try {
      const existingRaw = localStorage.getItem('cpi_cloud_backups_cache');
      const existingList = existingRaw ? JSON.parse(existingRaw) : [];
      existingList.unshift({
        id: backupId,
        timestamp: backupPayload.timestamp,
        createdBy: backupPayload.createdBy,
        totalStudents: backupPayload.totalStudents,
        totalTeachers: backupPayload.totalTeachers,
        totalClasses: backupPayload.totalClasses,
        totalMajors: backupPayload.totalMajors,
        totalAttendance: backupPayload.totalAttendance,
        totalTeacherAttendance: backupPayload.totalTeacherAttendance,
        data: backupPayload.data
      });
      localStorage.setItem('cpi_cloud_backups_cache', JSON.stringify(existingList.slice(0, 10)));
    } catch (err) {
      console.warn('Cache write error for backups:', err);
    }

    return backupId;
  },

  async getCloudBackups(): Promise<any[]> {
    try {
      const snap = await getDocs(collection(db, 'backups'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data());
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        localStorage.setItem('cpi_cloud_backups_cache', JSON.stringify(list));
        return list;
      }
    } catch (e) {
      console.warn('Error fetching cloud backups from Firestore:', e);
    }
    const cached = localStorage.getItem('cpi_cloud_backups_cache');
    return cached ? JSON.parse(cached) : [];
  },

  async deleteCloudBackup(backupId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'backups', backupId));
    } catch (e) {
      console.warn('Error deleting cloud backup:', e);
    }
    try {
      const cached = localStorage.getItem('cpi_cloud_backups_cache');
      if (cached) {
        const list = JSON.parse(cached).filter((b: any) => b.id !== backupId);
        localStorage.setItem('cpi_cloud_backups_cache', JSON.stringify(list));
      }
    } catch (err) {
      console.warn(err);
    }
  },

  async restoreBackupData(payload: {
    students?: Student[];
    teachers?: Teacher[];
    classes?: Classroom[];
    majors?: Major[];
    attendance?: AttendanceRecord[];
    teacherAttendance?: TeacherAttendance[];
  }): Promise<void> {
    const { students, teachers, classes, majors, attendance, teacherAttendance } = payload;
    updateSyncStatus('syncing', 'Restoring database from backup...');

    try {
      if (students && Array.isArray(students)) {
        setLocal(LS_KEYS.STUDENTS, students);
        notifyLocal(LS_KEYS.STUDENTS, students);
        await commitInChunks(db, 'students', students);
      }

      if (teachers && Array.isArray(teachers)) {
        setLocal(LS_KEYS.TEACHERS, teachers);
        notifyLocal(LS_KEYS.TEACHERS, teachers);
        await commitInChunks(db, 'teachers', teachers);
      }

      if (classes && Array.isArray(classes)) {
        setLocal(LS_KEYS.CLASSES, classes);
        notifyLocal(LS_KEYS.CLASSES, classes);
        await commitInChunks(db, 'classes', classes);
      }

      if (majors && Array.isArray(majors)) {
        setLocal(LS_KEYS.MAJORS, majors);
        notifyLocal(LS_KEYS.MAJORS, majors);
        await commitInChunks(db, 'majors', majors);
      }

      if (attendance && Array.isArray(attendance)) {
        setLocal(LS_KEYS.ATTENDANCE, attendance);
        notifyLocal(LS_KEYS.ATTENDANCE, attendance);
        await commitInChunks(db, 'attendance', attendance);
      }

      if (teacherAttendance && Array.isArray(teacherAttendance)) {
        setLocal(LS_KEYS.TEACHER_ATT, teacherAttendance);
        notifyLocal(LS_KEYS.TEACHER_ATT, teacherAttendance);
        await commitInChunks(db, 'teacher_attendance', teacherAttendance);
      }

      updateSyncStatus('synced', 'Database restored and synchronized with Cloud Firestore');
    } catch (err: any) {
      console.warn('Restore error:', err);
      updateSyncStatus('error', err?.message || 'Restore error');
    }
  },

  exportLocalBackupFile(): void {
    const students = getLocal<Student>(LS_KEYS.STUDENTS, INITIAL_STUDENTS);
    const teachers = getLocal<Teacher>(LS_KEYS.TEACHERS, INITIAL_TEACHERS);
    const classes = getLocal<Classroom>(LS_KEYS.CLASSES, INITIAL_CLASSES);
    const majors = getLocal<Major>(LS_KEYS.MAJORS, INITIAL_MAJORS);
    const attendance = getLocal<AttendanceRecord>(LS_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    const teacherAttendance = getLocal<TeacherAttendance>(LS_KEYS.TEACHER_ATT, []);

    const fullBackup = {
      appName: 'International Chinese Education and Teachers Institute (វិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់)',
      exportDate: new Date().toISOString(),
      version: '2.0.0',
      summary: {
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        totalMajors: majors.length,
        totalAttendance: attendance.length,
        totalTeacherAttendance: teacherAttendance.length,
      },
      data: {
        students,
        teachers,
        classes,
        majors,
        attendance,
        teacherAttendance,
      }
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ICI_Full_Backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
};