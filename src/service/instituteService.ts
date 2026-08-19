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
};

function getLocal<T>(key: string, defaultData: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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

export const authService = {
  async signInWithGoogle(): Promise<AppUser> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    return mapFirebaseUser(result.user)!;
  },

  async signOut(): Promise<void> {
    await signOut(auth);
  },

  onAuthStateChanged(callback: (user: AppUser | null) => void): Unsubscribe {
    return onAuthStateChanged(auth, (firebaseUser) => {
      callback(mapFirebaseUser(firebaseUser));
    });
  },

  getCurrentUser(): AppUser | null {
    return mapFirebaseUser(auth.currentUser);
  }
};

export const instituteService = {
  // --- SEED DATABASE IF EMPTY ---
  async seedInitialDataIfEmpty(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'majors'));
      if (snap.empty) {
        console.log('Seeding initial International Chinese Education and Teachers Institute database...');
        const batch = writeBatch(db);

        // Seed majors
        for (const m of INITIAL_MAJORS) {
          batch.set(doc(db, 'majors', m.id), m);
        }
        // Seed classes
        for (const c of INITIAL_CLASSES) {
          batch.set(doc(db, 'classes', c.id), c);
        }
        // Seed teachers
        for (const t of INITIAL_TEACHERS) {
          batch.set(doc(db, 'teachers', t.id), t);
        }
        // Seed students
        for (const s of INITIAL_STUDENTS) {
          batch.set(doc(db, 'students', s.id), s);
        }
        // Seed attendance
        for (const a of INITIAL_ATTENDANCE) {
          batch.set(doc(db, 'attendance', a.id), a);
        }

        await batch.commit();
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

    return onSnapshot(
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
        }
      },
      (err) => {
        console.warn('Majors snapshot error (using local cache):', err);
      }
    );
  },

  async saveMajor(major: Major): Promise<void> {
    const local = getLocal<Major>(LS_KEYS.MAJORS, INITIAL_MAJORS);
    const idx = local.findIndex((m) => m.id === major.id);
    if (idx >= 0) local[idx] = major;
    else local.push(major);
    setLocal(LS_KEYS.MAJORS, local);

    try {
      await setDoc(doc(db, 'majors', major.id), major);
    } catch (e) {
      console.warn('Error saving major to Firestore:', e);
    }
  },

  async deleteMajor(id: string): Promise<void> {
    const local = getLocal<Major>(LS_KEYS.MAJORS, INITIAL_MAJORS).filter((m) => m.id !== id);
    setLocal(LS_KEYS.MAJORS, local);

    try {
      await deleteDoc(doc(db, 'majors', id));
    } catch (e) {
      console.warn('Error deleting major:', e);
    }
  },

  // --- CLASSES ---
  subscribeClasses(callback: (data: Classroom[]) => void): Unsubscribe {
    const local = getLocal<Classroom>(LS_KEYS.CLASSES, INITIAL_CLASSES);
    callback(local);

    return onSnapshot(
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
        }
      },
      (err) => {
        console.warn('Classes snapshot error:', err);
      }
    );
  },

  async saveClass(cls: Classroom): Promise<void> {
    const local = getLocal<Classroom>(LS_KEYS.CLASSES, INITIAL_CLASSES);
    const idx = local.findIndex((c) => c.id === cls.id);
    if (idx >= 0) local[idx] = cls;
    else local.push(cls);
    setLocal(LS_KEYS.CLASSES, local);

    try {
      await setDoc(doc(db, 'classes', cls.id), cls);
    } catch (e) {
      console.warn('Error saving class:', e);
    }
  },

  async deleteClass(id: string): Promise<void> {
    const local = getLocal<Classroom>(LS_KEYS.CLASSES, INITIAL_CLASSES).filter((c) => c.id !== id);
    setLocal(LS_KEYS.CLASSES, local);

    try {
      await deleteDoc(doc(db, 'classes', id));
    } catch (e) {
      console.warn('Error deleting class:', e);
    }
  },

  // --- TEACHERS ---
  subscribeTeachers(callback: (data: Teacher[]) => void): Unsubscribe {
    const local = getLocal<Teacher>(LS_KEYS.TEACHERS, INITIAL_TEACHERS);
    callback(local);

    return onSnapshot(
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
        } else {
          setLocal(LS_KEYS.TEACHERS, []);
          callback([]);
        }
      },
      (err) => {
        console.warn('Teachers snapshot error:', err);
      }
    );
  },

  async saveTeacher(teacher: Teacher): Promise<void> {
    const local = getLocal<Teacher>(LS_KEYS.TEACHERS, INITIAL_TEACHERS);
    const idx = local.findIndex((t) => t.id === teacher.id);
    if (idx >= 0) local[idx] = teacher;
    else local.push(teacher);
    setLocal(LS_KEYS.TEACHERS, local);

    try {
      await setDoc(doc(db, 'teachers', teacher.id), teacher);
    } catch (e) {
      console.warn('Error saving teacher:', e);
    }
  },

  async saveTeachersBulk(teachers: Teacher[]): Promise<void> {
    const local = getLocal<Teacher>(LS_KEYS.TEACHERS, INITIAL_TEACHERS);
    const map = new Map(local.map((t) => [t.id, t]));
    for (const t of teachers) map.set(t.id, t);
    const merged = Array.from(map.values());
    setLocal(LS_KEYS.TEACHERS, merged);

    try {
      const batch = writeBatch(db);
      for (const t of teachers) {
        batch.set(doc(db, 'teachers', t.id), t);
      }
      await batch.commit();
    } catch (e) {
      console.warn('Error saving bulk teachers:', e);
    }
  },

  async deleteTeacher(id: string): Promise<void> {
    const local = getLocal<Teacher>(LS_KEYS.TEACHERS, INITIAL_TEACHERS).filter((t) => t.id !== id);
    setLocal(LS_KEYS.TEACHERS, local);

    try {
      await deleteDoc(doc(db, 'teachers', id));
    } catch (e) {
      console.warn('Error deleting teacher:', e);
    }
  },

  async deleteAllTeachers(): Promise<void> {
    setLocal(LS_KEYS.TEACHERS, []);

    try {
      const snap = await getDocs(collection(db, 'teachers'));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (e) {
      console.warn('Error deleting all teachers:', e);
    }
  },

  // --- STUDENTS ---
  subscribeStudents(callback: (data: Student[]) => void): Unsubscribe {
    const local = getLocal<Student>(LS_KEYS.STUDENTS, INITIAL_STUDENTS);
    callback(local);

    return onSnapshot(
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
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString()
            } as Student;
          });
          setLocal(LS_KEYS.STUDENTS, list);
          callback(list);
        } else {
          // Empty snapshot means collection was cleared
          setLocal(LS_KEYS.STUDENTS, []);
          callback([]);
        }
      },
      (err) => {
        console.warn('Students snapshot error:', err);
      }
    );
  },

  async saveStudent(student: Student): Promise<void> {
    const local = getLocal<Student>(LS_KEYS.STUDENTS, INITIAL_STUDENTS);
    const idx = local.findIndex((s) => s.id === student.id);
    if (idx >= 0) local[idx] = student;
    else local.push(student);
    setLocal(LS_KEYS.STUDENTS, local);

    try {
      await setDoc(doc(db, 'students', student.id), student);
    } catch (e) {
      console.warn('Error saving student:', e);
    }
  },

  async saveStudentsBulk(students: Student[]): Promise<void> {
    const local = getLocal<Student>(LS_KEYS.STUDENTS, INITIAL_STUDENTS);
    const map = new Map(local.map((s) => [s.id, s]));
    for (const s of students) map.set(s.id, s);
    const merged = Array.from(map.values());
    setLocal(LS_KEYS.STUDENTS, merged);

    try {
      const batch = writeBatch(db);
      for (const s of students) {
        batch.set(doc(db, 'students', s.id), s);
      }
      await batch.commit();
    } catch (e) {
      console.warn('Error saving bulk students:', e);
    }
  },

  async deleteStudent(id: string): Promise<void> {
    const local = getLocal<Student>(LS_KEYS.STUDENTS, INITIAL_STUDENTS).filter((s) => s.id !== id);
    setLocal(LS_KEYS.STUDENTS, local);

    try {
      await deleteDoc(doc(db, 'students', id));
    } catch (e) {
      console.warn('Error deleting student:', e);
    }
  },

  async deleteAllStudents(): Promise<void> {
    setLocal(LS_KEYS.STUDENTS, []);

    try {
      const snap = await getDocs(collection(db, 'students'));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (e) {
      console.warn('Error deleting all students:', e);
    }
  },

  // --- ATTENDANCE ---
  subscribeAttendance(callback: (data: AttendanceRecord[]) => void): Unsubscribe {
    const local = getLocal<AttendanceRecord>(LS_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    callback(local);

    return onSnapshot(
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
        }
      },
      (err) => {
        console.warn('Attendance snapshot error:', err);
      }
    );
  },

  async saveAttendanceBatch(records: AttendanceRecord[]): Promise<void> {
    const local = getLocal<AttendanceRecord>(LS_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    const map = new Map(local.map((r) => [r.id, r]));
    for (const r of records) map.set(r.id, r);
    const merged = Array.from(map.values());
    setLocal(LS_KEYS.ATTENDANCE, merged);

    try {
      const batch = writeBatch(db);
      for (const r of records) {
        batch.set(doc(db, 'attendance', r.id), r);
      }
      await batch.commit();
    } catch (e) {
      console.warn('Error batch saving attendance:', e);
    }
  },

  // --- TEACHER ATTENDANCE ---
  subscribeTeacherAttendance(callback: (data: TeacherAttendance[]) => void): Unsubscribe {
    const local = getLocal<TeacherAttendance>(LS_KEYS.TEACHER_ATT, []);
    callback(local);

    return onSnapshot(
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
        }
      },
      (err) => {
        console.warn('Teacher attendance snapshot error:', err);
      }
    );
  },

  async saveTeacherAttendanceBatch(records: TeacherAttendance[]): Promise<void> {
    const local = getLocal<TeacherAttendance>(LS_KEYS.TEACHER_ATT, []);
    const map = new Map(local.map((r) => [r.id, r]));
    for (const r of records) map.set(r.id, r);
    const merged = Array.from(map.values());
    setLocal(LS_KEYS.TEACHER_ATT, merged);

    try {
      const batch = writeBatch(db);
      for (const r of records) {
        batch.set(doc(db, 'teacher_attendance', r.id), r);
      }
      await batch.commit();
    } catch (e) {
      console.warn('Error batch saving teacher attendance:', e);
    }
  }
};
