export type ShiftType = 'morning' | 'afternoon' | 'evening' | 'weekend';
export type AcademicYearType = 'Year 1' | 'Year 2' | 'Year 3' | 'Year 4';
export type StudentStatus = 'active' | 'suspended' | 'dropped' | 'graduated';
export type AttendanceStatus = 'present' | 'permission' | 'absent' | 'late';
export type TeacherAttendanceStatus = 'present' | 'permission' | 'absent' | 'substituted';
export type TeacherStatus = 'active' | 'on_leave' | 'resigned';

export interface Major {
  id: string;
  code: string;
  nameKhmer: string;
  nameLatin: string;
  description?: string;
  totalYears: number;
}

export interface Classroom {
  id: string;
  classCode: string;
  name: string;
  majorId: string;
  majorName: string;
  year: AcademicYearType;
  shift: ShiftType;
  room: string;
  academicYear: string; // e.g. "2025-2026"
  teacherId?: string;
  teacherName?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  studentCode: string;
  nameKhmer: string;
  nameLatin: string;
  nameChinese?: string;
  gender: 'male' | 'female';
  dob: string;
  phone: string;
  email?: string;
  majorId: string;
  majorName: string;
  classId: string;
  className: string;
  shift: ShiftType;
  year: AcademicYearType;
  status: StudentStatus;
  photoUrl?: string;
  address?: string;
  guardianPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Teacher {
  id: string;
  teacherCode: string;
  nameKhmer: string;
  nameLatin: string;
  gender: 'male' | 'female';
  phone: string;
  email?: string;
  subjects: string;
  shift?: ShiftType | string;
  status: TeacherStatus;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  shift: ShiftType;
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  note?: string;
  recordedBy?: string;
  createdAt: string;
}

export interface TeacherAttendance {
  id: string;
  date: string; // YYYY-MM-DD
  teacherId: string;
  teacherName: string;
  shift: ShiftType;
  subject: string;
  room?: string;
  status: TeacherAttendanceStatus;
  note?: string;
  recordedBy?: string;
  createdAt: string;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: string;
  isAnonymous?: boolean;
}

export type ActiveTab = 
  | 'dashboard'
  | 'students'
  | 'attendance'
  | 'teachers'
  | 'teacher_attendance'
  | 'classes'
  | 'majors'
  | 'reports';

export interface AttendanceStats {
  totalRecords: number;
  present: number;
  permission: number;
  absent: number;
  late: number;
  rate: number;
}
