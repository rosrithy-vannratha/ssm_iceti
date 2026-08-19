import * as XLSX from 'xlsx';
import { Student, Teacher, AttendanceRecord } from '../types';

export function exportStudentsToExcel(students: Student[], filename = 'student_list'): void {
  const formattedData = students.map((s, index) => ({
    'ល.រ (No)': index + 1,
    'អត្តលេខ (ID)': s.studentCode,
    'គោត្តនាម-នាម (Khmer)': s.nameKhmer,
    'អក្សរឡាតាំង (Latin)': s.nameLatin,
    'ឈ្មោះចិន (Chinese)': s.nameChinese || '-',
    'ភេទ (Gender)': s.gender === 'female' ? 'ស្រី (F)' : 'ប្រុស (M)',
    'ថ្ងៃខែឆ្នាំកំណើត (DOB)': s.dob || '-',
    'លេខទូរស័ព្ទ (Phone)': s.phone || '-',
    'ជំនាញ (Major)': s.majorName,
    'ថ្នាក់ (Class)': s.className,
    'វេនសិក្សា (Shift)': getShiftLabel(s.shift),
    'ឆ្នាំសិក្សា (Year)': s.year,
    'ស្ថានភាព (Status)': getStatusLabel(s.status),
    'លេខអាណាព្យាបាល (Guardian)': s.guardianPhone || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function downloadStudentTemplate(): void {
  const templateData = [
    {
      'Student Code': 'ICI-2025-101',
      'Name Khmer': 'សាន វិចិត្រ',
      'Name Latin': 'San Vichetr',
      'Name Chinese': '桑维切',
      'Gender': 'male', // male / female
      'Date of Birth': '2004-01-15',
      'Phone': '012345678',
      'Shift': 'morning', // morning, afternoon, evening, weekend
      'Year': 'Year 1', // Year 1, Year 2, Year 3, Year 4
      'Guardian Phone': '098765432'
    },
    {
      'Student Code': 'ICI-2025-102',
      'Name Khmer': 'ហែម ចិន្តា',
      'Name Latin': 'Hem Chenda',
      'Name Chinese': '韩贞达',
      'Gender': 'female',
      'Date of Birth': '2004-06-20',
      'Phone': '098112233',
      'Shift': 'evening',
      'Year': 'Year 1',
      'Guardian Phone': '011223344'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
  XLSX.writeFile(workbook, 'ICI_Student_Import_Template.xlsx');
}

export function exportAttendanceToExcel(records: AttendanceRecord[], className: string, date: string): void {
  const formattedData = records.map((r, index) => ({
    'ល.រ (No)': index + 1,
    'កាលបរិច្ឆេទ (Date)': r.date,
    'ឈ្មោះនិស្សិត (Name)': r.studentName,
    'វេន (Shift)': getShiftLabel(r.shift),
    'ស្ថានភាពវត្តមាន (Status)': getAttendanceLabel(r.status),
    'សម្គាល់ (Notes)': r.note || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
  XLSX.writeFile(workbook, `Attendance_${className.replace(/\s+/g, '_')}_${date}.xlsx`);
}

export function exportTeachersToExcel(teachers: Teacher[], filename = 'teacher_faculty_list'): void {
  const formattedData = teachers.map((t, index) => ({
    'ល.រ (No)': index + 1,
    'អត្តលេខ (ID)': t.teacherCode,
    'គោត្តនាម-នាម (Khmer)': t.nameKhmer,
    'អក្សរឡាតាំង (Latin)': t.nameLatin,
    'ភេទ (Gender)': t.gender === 'female' ? 'ស្រី (F)' : 'ប្រុស (M)',
    'លេខទូរស័ព្ទ (Phone)': t.phone || '-',
    'អ៊ីមែល (Email)': t.email || '-',
    'មុខវិជ្ជាបង្រៀន (Subjects)': t.subjects,
    'វេនបង្រៀន (Shift)': getShiftLabel(String(t.shift || 'morning')),
    'ស្ថានភាព (Status)': getTeacherStatusLabel(t.status),
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Faculty');
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function downloadTeacherTemplate(): void {
  const templateData = [
    {
      'Teacher Code': 'ICI-TCH-001',
      'Name Khmer': 'សាស្ត្រាចារ្យ ឡុង សុខា',
      'Name Latin': 'Long Sokha',
      'Gender': 'male', // male / female
      'Phone': '012345678',
      'Email': 'longsokha@ici.edu.kh',
      'Subjects': 'គរុកោសល្យទូទៅ, វេយ្យាករណ៍ភាសាចិន',
      'Shift': 'morning', // morning, afternoon, evening, weekend
      'Status': 'active' // active, on_leave, resigned
    },
    {
      'Teacher Code': 'ICI-TCH-002',
      'Name Khmer': 'សាស្ត្រាចារ្យ ចេង វ៉ាន់នី',
      'Name Latin': 'Cheng Vanny',
      'Gender': 'female',
      'Phone': '098112233',
      'Email': 'chengvanny@ici.edu.kh',
      'Subjects': 'វិធីសាស្ត្របង្រៀនភាសាចិន (Pedagogy Methodology)',
      'Shift': 'evening',
      'Status': 'active'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'FacultyTemplate');
  XLSX.writeFile(workbook, 'ICI_Faculty_Import_Template.xlsx');
}

export function parseTeacherExcel(file: File): Promise<Partial<Teacher>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawJson: any[] = XLSX.utils.sheet_to_json(firstSheet);

        const parsedTeachers: Partial<Teacher>[] = rawJson.map((row) => ({
          teacherCode: String(row['Teacher Code'] || row['អត្តលេខ'] || `ICI-TCH-${Date.now().toString().slice(-4)}`),
          nameKhmer: String(row['Name Khmer'] || row['ឈ្មោះខ្មែរ'] || row['គោត្តនាម-នាម'] || ''),
          nameLatin: String(row['Name Latin'] || row['អក្សរឡាតាំង'] || ''),
          gender: String(row['Gender'] || row['ភេទ'] || '').toLowerCase().includes('f') || String(row['Gender'] || row['ភេទ'] || '').includes('ស្រី') ? 'female' : 'male',
          phone: String(row['Phone'] || row['លេខទូរស័ព្ទ'] || ''),
          email: String(row['Email'] || row['អ៊ីមែល'] || ''),
          subjects: String(row['Subjects'] || row['មុខវិជ្ជា'] || row['មុខវិជ្ជាបង្រៀន'] || 'ភាសាចិន'),
          shift: parseShift(row['Shift'] || row['វេន'] || row['វេនបង្រៀន']),
          status: parseTeacherStatus(row['Status'] || row['ស្ថានភាព'])
        }));

        resolve(parsedTeachers.filter((t) => Boolean(t.nameKhmer)));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function getTeacherStatusLabel(status: string): string {
  switch (status) {
    case 'active': return 'កំពុងបង្រៀន (Active)';
    case 'on_leave': return 'សុំច្បាប់សម្រាក (On Leave)';
    case 'resigned': return 'ឈប់បង្រៀន (Resigned)';
    default: return status || 'កំពុងបង្រៀន';
  }
}

function parseTeacherStatus(val: any): 'active' | 'on_leave' | 'resigned' {
  const str = String(val || '').toLowerCase();
  if (str.includes('leave') || str.includes('សម្រាក')) return 'on_leave';
  if (str.includes('resign') || str.includes('ឈប់')) return 'resigned';
  return 'active';
}

export function parseStudentExcel(file: File): Promise<Partial<Student>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawJson: any[] = XLSX.utils.sheet_to_json(firstSheet);

        const parsedStudents: Partial<Student>[] = rawJson.map((row) => ({
          studentCode: String(row['Student Code'] || row['អត្តលេខ'] || `CPI-${Date.now()}`),
          nameKhmer: String(row['Name Khmer'] || row['ឈ្មោះខ្មែរ'] || row['គោត្តនាម-នាម'] || ''),
          nameLatin: String(row['Name Latin'] || row['អក្សរឡាតាំង'] || ''),
          nameChinese: String(row['Name Chinese'] || row['ឈ្មោះចិន'] || ''),
          gender: String(row['Gender'] || row['ភេទ'] || '').toLowerCase().includes('f') || String(row['Gender'] || row['ភេទ'] || '').includes('ស្រី') ? 'female' : 'male',
          dob: String(row['Date of Birth'] || row['ថ្ងៃខែឆ្នាំកំណើត'] || '2004-01-01'),
          phone: String(row['Phone'] || row['លេខទូរស័ព្ទ'] || ''),
          shift: parseShift(row['Shift'] || row['វេន'] || row['វេនសិក្សា']),
          year: parseYear(row['Year'] || row['ឆ្នាំសិក្សា']),
          guardianPhone: String(row['Guardian Phone'] || row['លេខអាណាព្យាបាល'] || ''),
          status: 'active'
        }));

        resolve(parsedStudents.filter((s) => Boolean(s.nameKhmer)));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function getShiftLabel(shift: string): string {
  switch (shift) {
    case 'morning': return 'ព្រឹក (Morning)';
    case 'afternoon': return 'រសៀល (Afternoon)';
    case 'evening': return 'យប់ (Evening)';
    case 'weekend': return 'ចុងសប្តាហ៍ (Weekend)';
    default: return shift || 'ព្រឹក';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'active': return 'កំពុងរៀន (Active)';
    case 'suspended': return 'ព្យួរការសិក្សា (Suspended)';
    case 'dropped': return 'បោះបង់ការសិក្សា (Dropped)';
    case 'graduated': return 'បញ្ចប់ការសិក្សា (Graduated)';
    default: return status;
  }
}

export function getAttendanceLabel(status: string): string {
  switch (status) {
    case 'present': return 'វត្តមាន (P)';
    case 'permission': return 'សុំច្បាប់ (E)';
    case 'absent': return 'អវត្តមាន (A)';
    case 'late': return 'មកយឺត (L)';
    default: return status;
  }
}

function parseShift(val: any): 'morning' | 'afternoon' | 'evening' | 'weekend' {
  const str = String(val || '').toLowerCase();
  if (str.includes('afternoon') || str.includes('រសៀល')) return 'afternoon';
  if (str.includes('evening') || str.includes('night') || str.includes('យប់')) return 'evening';
  if (str.includes('weekend') || str.includes('ចុងសប្តាហ៍')) return 'weekend';
  return 'morning';
}

function parseYear(val: any): 'Year 1' | 'Year 2' | 'Year 3' | 'Year 4' {
  const str = String(val || '').toLowerCase();
  if (str.includes('2') || str.includes('២')) return 'Year 2';
  if (str.includes('3') || str.includes('៣')) return 'Year 3';
  if (str.includes('4') || str.includes('៤')) return 'Year 4';
  return 'Year 1';
}
