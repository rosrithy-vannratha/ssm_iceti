import * as XLSX from 'xlsx';
import { Student, Teacher, Classroom, Major, AttendanceRecord, ShiftType, AcademicYearType, StudentStatus, TeacherStatus } from '../types';

// Helper: Normalize string for matching (strip spaces, punctuation, lowercase)
function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .replace(/[\s\(\)\[\]\-_:.,\/\\–—]/g, '')
    .trim();
}

// Helper: Get value from row by checking a list of possible aliases
function getRowValue(row: Record<string, any>, aliases: string[]): any {
  const rowKeys = Object.keys(row);
  const normalizedRowKeyMap = new Map<string, string>();
  for (const k of rowKeys) {
    normalizedRowKeyMap.set(normalizeKey(k), k);
  }

  // 1. Direct match with aliases
  for (const alias of aliases) {
    const normAlias = normalizeKey(alias);
    if (normalizedRowKeyMap.has(normAlias)) {
      const originalKey = normalizedRowKeyMap.get(normAlias)!;
      const val = row[originalKey];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return val;
      }
    }
  }

  // 2. Partial substring match with aliases
  for (const [normKey, originalKey] of normalizedRowKeyMap.entries()) {
    for (const alias of aliases) {
      const normAlias = normalizeKey(alias);
      if (normKey.includes(normAlias) || normAlias.includes(normKey)) {
        const val = row[originalKey];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          return val;
        }
      }
    }
  }

  return undefined;
}

// Convert Excel dates, serial numbers, or various string formats to standard YYYY-MM-DD
export function parseExcelDate(val: any, fallback = '2004-01-01'): string {
  if (!val) return fallback;

  // 1. Already a JS Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }

  // 2. Excel numeric serial date (e.g. 38000)
  if (typeof val === 'number') {
    try {
      const parsedDate = XLSX.SSF.parse_date_code(val);
      if (parsedDate) {
        const y = parsedDate.y;
        const m = String(parsedDate.m).padStart(2, '0');
        const d = String(parsedDate.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch (e) {
      console.warn('Could not parse numeric Excel date code:', val);
    }
  }

  const str = String(val).trim();
  if (!str || str === '-') return fallback;

  // 3. String formatted as YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\-\/\.](0?[1-9]|1[0-2])[\-\/\.](0?[1-9]|[12]\d|3[01])$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = String(ymdMatch[2]).padStart(2, '0');
    const d = String(ymdMatch[3]).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 4. String formatted as DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(0?[1-9]|[12]\d|3[01])[\-\/\.](0?[1-9]|1[0-2])[\-\/\.](\d{4})$/);
  if (dmyMatch) {
    const d = String(dmyMatch[1]).padStart(2, '0');
    const m = String(dmyMatch[2]).padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // 5. Native JS Date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return fallback;
}

export function parseGender(val: any): 'female' | 'male' {
  const str = String(val || '').toLowerCase().trim();
  if (
    str.includes('female') ||
    str.includes('ស្រី') ||
    str.includes('女') ||
    str === 'f' ||
    str === 'w' ||
    str.startsWith('f')
  ) {
    return 'female';
  }
  return 'male';
}

export function parseShift(val: any): ShiftType {
  const str = String(val || '').toLowerCase().trim();
  if (str.includes('afternoon') || str.includes('រសៀល') || str.includes('pm')) return 'afternoon';
  if (str.includes('evening') || str.includes('night') || str.includes('យប់') || str.includes('ល្ងាច')) return 'evening';
  if (str.includes('weekend') || str.includes('ចុងសប្តាហ៍') || str.includes('សៅរ៍') || str.includes('អាទិត្យ')) return 'weekend';
  return 'morning';
}

export function parseYear(val: any): AcademicYearType {
  const str = String(val || '').toLowerCase().trim();
  if (str.includes('4') || str.includes('៤') || str.includes('year4') || str.includes('ទី៤')) return 'Year 4';
  if (str.includes('3') || str.includes('៣') || str.includes('year3') || str.includes('ទី៣')) return 'Year 3';
  if (str.includes('2') || str.includes('២') || str.includes('year2') || str.includes('ទី២')) return 'Year 2';
  return 'Year 1';
}

export function parseStudentStatus(val: any): StudentStatus {
  const str = String(val || '').toLowerCase().trim();
  if (str.includes('suspend') || str.includes('ព្យួរ')) return 'suspended';
  if (str.includes('drop') || str.includes('បោះបង់')) return 'dropped';
  if (str.includes('graduat') || str.includes('បញ្ចប់')) return 'graduated';
  return 'active';
}

export function parseTeacherStatus(val: any): TeacherStatus {
  const str = String(val || '').toLowerCase().trim();
  if (str.includes('leave') || str.includes('សម្រាក') || str.includes('ច្បាប់')) return 'on_leave';
  if (str.includes('resign') || str.includes('ឈប់') || str.includes('លាលែង')) return 'resigned';
  return 'active';
}

// Parse Student Excel File
export function parseStudentExcel(file: File): Promise<Partial<Student>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          resolve([]);
          return;
        }

        const parsedStudents: Partial<Student>[] = rawJson.map((row, index) => {
          // Khmer Name aliases
          const nameKhmer = String(
            getRowValue(row, [
              'គោត្តនាម-នាម (Khmer)',
              'គោត្តនាម-នាម',
              'ឈ្មោះខ្មែរ',
              'ឈ្មោះ (Khmer)',
              'ឈ្មោះនិស្សិត',
              'ឈ្មោះសិស្ស',
              'Name Khmer',
              'Khmer Name',
              'Full Name (Khmer)',
              'ឈ្មោះ'
            ]) || ''
          ).trim();

          // Latin Name aliases
          const nameLatin = String(
            getRowValue(row, [
              'អក្សរឡាតាំង (Latin)',
              'អក្សរឡាតាំង',
              'ឈ្មោះឡាតាំង',
              'ឈ្មោះជាអក្សរឡាតាំង',
              'Name Latin',
              'Latin Name',
              'English Name',
              'Full Name (Latin)',
              'Name'
            ]) || ''
          ).trim();

          // Chinese Name aliases
          const nameChinese = String(
            getRowValue(row, [
              'ឈ្មោះចិន (Chinese)',
              'ឈ្មោះចិន',
              'ឈ្មោះជាភាសាចិន',
              'Name Chinese',
              'Chinese Name',
              '中文名'
            ]) || ''
          ).trim();

          // Student Code aliases
          const studentCode = String(
            getRowValue(row, [
              'អត្តលេខ (ID)',
              'អត្តលេខ',
              'អត្តលេខនិស្សិត',
              'Student Code',
              'Student ID',
              'Code',
              'ID'
            ]) || `CPI-IMP-${Date.now().toString().slice(-4)}-${index + 1}`
          ).trim();

          // Gender aliases
          const genderRaw = getRowValue(row, ['ភេទ (Gender)', 'ភេទ', 'Gender', 'Sex']);
          const gender = parseGender(genderRaw);

          // Date of Birth aliases
          const dobRaw = getRowValue(row, [
            'ថ្ងៃខែឆ្នាំកំណើត (DOB)',
            'ថ្ងៃខែឆ្នាំកំណើត',
            'ថ្ងៃកំណើត',
            'Date of Birth',
            'DOB',
            'Birth Date',
            'BirthDate'
          ]);
          const dob = parseExcelDate(dobRaw, '2004-01-01');

          // Phone aliases
          const phone = String(
            getRowValue(row, [
              'លេខទូរស័ព្ទ (Phone)',
              'លេខទូរសព្ទ (Phone)',
              'លេខទូរស័ព្ទ',
              'លេខទូរសព្ទ',
              'ទូរស័ព្ទ',
              'ទូរសព្ទ',
              'Phone',
              'Phone Number',
              'Tel',
              'Telephone',
              'Mobile'
            ]) || ''
          ).trim();

          // Email aliases
          const email = String(
            getRowValue(row, ['អ៊ីមែល (Email)', 'អ៊ីមែល', 'Email', 'E-mail', 'Mail']) || ''
          ).trim();

          // Shift aliases
          const shiftRaw = getRowValue(row, ['វេនសិក្សា (Shift)', 'វេនសិក្សា', 'វេន', 'Shift', 'Study Shift']);
          const shift = parseShift(shiftRaw);

          // Year aliases
          const yearRaw = getRowValue(row, ['ឆ្នាំសិក្សា (Year)', 'ឆ្នាំសិក្សា', 'ឆ្នាំ', 'Year', 'Academic Year', 'Level']);
          const year = parseYear(yearRaw);

          // Status aliases
          const statusRaw = getRowValue(row, ['ស្ថានភាព (Status)', 'ស្ថានភាព', 'Status', 'Student Status']);
          const status = parseStudentStatus(statusRaw);

          // Guardian Phone aliases
          const guardianPhone = String(
            getRowValue(row, [
              'លេខអាណាព្យាបាល (Guardian)',
              'លេខអាណាព្យាបាល',
              'អាណាព្យាបាល',
              'Guardian Phone',
              'Parent Phone',
              'Emergency Phone',
              'Guardian'
            ]) || ''
          ).trim();

          // Major aliases
          const majorName = String(
            getRowValue(row, ['ជំនាញ (Major)', 'ជំនាញ', 'ដេប៉ាតឺម៉ង់', 'Major', 'Major Name', 'Department']) || ''
          ).trim();

          // Class aliases
          const className = String(
            getRowValue(row, ['ថ្នាក់ (Class)', 'ថ្នាក់', 'ថ្នាក់រៀន', 'Class', 'Class Name', 'Classroom', 'Room']) || ''
          ).trim();

          // Address aliases
          const address = String(
            getRowValue(row, ['អាសយដ្ឋាន (Address)', 'អាសយដ្ឋាន', 'ទីលំនៅ', 'Address', 'Location']) || ''
          ).trim();

          return {
            studentCode,
            nameKhmer: nameKhmer || nameLatin || `និស្សិតទី ${index + 1}`,
            nameLatin: nameLatin || nameKhmer,
            nameChinese: nameChinese || undefined,
            gender,
            dob,
            phone,
            email: email || undefined,
            shift,
            year,
            status,
            guardianPhone: guardianPhone || undefined,
            address: address || undefined,
            majorName: majorName || undefined,
            className: className || undefined
          };
        });

        // Filter out completely empty rows
        resolve(parsedStudents.filter((s) => Boolean(s.nameKhmer && s.nameKhmer !== '-')));
      } catch (err) {
        console.error('Error parsing student Excel:', err);
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// Parse Teacher / Faculty Excel File
export function parseTeacherExcel(file: File): Promise<Partial<Teacher>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          resolve([]);
          return;
        }

        const parsedTeachers: Partial<Teacher>[] = rawJson.map((row, index) => {
          // Khmer Name aliases
          const nameKhmer = String(
            getRowValue(row, [
              'គោត្តនាម-នាម (Khmer)',
              'គោត្តនាម-នាម',
              'ឈ្មោះខ្មែរ',
              'ឈ្មោះសាស្ត្រាចារ្យ',
              'ឈ្មោះគ្រូ',
              'Name Khmer',
              'Khmer Name',
              'Full Name (Khmer)',
              'ឈ្មោះ'
            ]) || ''
          ).trim();

          // Latin Name aliases
          const nameLatin = String(
            getRowValue(row, [
              'អក្សរឡាតាំង (Latin)',
              'អក្សរឡាតាំង',
              'ឈ្មោះឡាតាំង',
              'Name Latin',
              'Latin Name',
              'English Name',
              'Full Name (Latin)',
              'Name'
            ]) || ''
          ).trim();

          // Teacher Code aliases
          const teacherCode = String(
            getRowValue(row, [
              'អត្តលេខ (ID)',
              'អត្តលេខ',
              'អត្តលេខសាស្ត្រាចារ្យ',
              'Teacher Code',
              'Teacher ID',
              'ID',
              'Code'
            ]) || `ICI-TCH-${Date.now().toString().slice(-4)}-${index + 1}`
          ).trim();

          // Gender aliases
          const genderRaw = getRowValue(row, ['ភេទ (Gender)', 'ភេទ', 'Gender', 'Sex']);
          const gender = parseGender(genderRaw);

          // Phone aliases
          const phone = String(
            getRowValue(row, [
              'លេខទូរស័ព្ទ (Phone)',
              'លេខទូរសព្ទ (Phone)',
              'លេខទូរស័ព្ទ',
              'លេខទូរសព្ទ',
              'ទូរស័ព្ទ',
              'ទូរសព្ទ',
              'Phone',
              'Phone Number',
              'Tel',
              'Telephone',
              'Mobile'
            ]) || ''
          ).trim();

          // Email aliases
          const email = String(
            getRowValue(row, ['អ៊ីមែល (Email)', 'អ៊ីមែល', 'Email', 'E-mail', 'Mail']) || ''
          ).trim();

          // Subjects aliases
          const subjects = String(
            getRowValue(row, [
              'មុខវិជ្ជាបង្រៀន (Subjects)',
              'មុខវិជ្ជាបង្រៀន',
              'មុខវិជ្ជា',
              'Subjects',
              'Subject',
              'Teaching Subject',
              'Course'
            ]) || 'ភាសាចិន'
          ).trim();

          // Shift aliases
          const shiftRaw = getRowValue(row, ['វេនបង្រៀន (Shift)', 'វេនបង្រៀន', 'វេន', 'Shift', 'Teaching Shift']);
          const shift = parseShift(shiftRaw);

          // Status aliases
          const statusRaw = getRowValue(row, ['ស្ថានភាព (Status)', 'ស្ថានភាព', 'Status', 'Teacher Status']);
          const status = parseTeacherStatus(statusRaw);

          return {
            teacherCode,
            nameKhmer: nameKhmer || nameLatin || `សាស្ត្រាចារ្យទី ${index + 1}`,
            nameLatin: nameLatin || nameKhmer,
            gender,
            phone,
            email: email || undefined,
            subjects: subjects || 'ភាសាចិន',
            shift,
            status
          };
        });

        resolve(parsedTeachers.filter((t) => Boolean(t.nameKhmer && t.nameKhmer !== '-')));
      } catch (err) {
        console.error('Error parsing teacher Excel:', err);
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export function exportStudentsToExcel(students: Student[], filename = 'student_list'): void {
  const formattedData = students.map((s, index) => ({
    'ល.រ (No)': index + 1,
    'អត្តលេខ (ID)': s.studentCode,
    'គោត្តនាម-នាម (Khmer)': s.nameKhmer,
    'អក្សរឡាតាំង (Latin)': s.nameLatin,
    'ឈ្មោះចិន (Chinese)': s.nameChinese || '-',
    'ភេទ (Gender)': s.gender === 'female' ? 'ស្រី (F)' : 'ប្រុស (M)',
    'ថ្ងៃខែឆ្នាំកំណើត (DOB)': s.dob || '-',
    'លេខទូរសព្ទ (Phone)': s.phone || '-',
    'ជំនាញ (Major)': s.majorName,
    'ថ្នាក់ (Class)': s.className,
    'វេនសិក្សា (Shift)': getShiftLabel(s.shift),
    'ឆ្នាំសិក្សា (Year)': s.year,
    'ស្ថានភាព (Status)': getStatusLabel(s.status),
    'លេខអាណាព្យាបាល (Guardian)': s.guardianPhone || '-',
    'អាសយដ្ឋាន (Address)': s.address || '-',
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
      'Gender': 'male',
      'Date of Birth': '2004-01-15',
      'Phone': '012345678',
      'Major': 'គរុកោសល្យភាសាចិន',
      'Class': 'ថ្នាក់គរុកោសល្យ A1',
      'Shift': 'morning',
      'Year': 'Year 1',
      'Guardian Phone': '098765432',
      'Address': 'រាជធានីភ្នំពេញ'
    },
    {
      'Student Code': 'ICI-2025-102',
      'Name Khmer': 'ហែម ចិន្តា',
      'Name Latin': 'Hem Chenda',
      'Name Chinese': '韩贞达',
      'Gender': 'female',
      'Date of Birth': '2004-06-20',
      'Phone': '098112233',
      'Major': 'គរុកោសល្យភាសាចិន',
      'Class': 'ថ្នាក់គរុកោសល្យ A1',
      'Shift': 'evening',
      'Year': 'Year 1',
      'Guardian Phone': '011223344',
      'Address': 'ខេត្តកណ្តាល'
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
    'លេខទូរសព្ទ (Phone)': t.phone || '-',
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
      'Gender': 'male',
      'Phone': '012345678',
      'Email': 'longsokha@ici.edu.kh',
      'Subjects': 'គរុកោសល្យទូទៅ, វេយ្យាករណ៍ភាសាចិន',
      'Shift': 'morning',
      'Status': 'active'
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

export function getTeacherStatusLabel(status: string): string {
  switch (status) {
    case 'active': return 'កំពុងបង្រៀន (Active)';
    case 'on_leave': return 'សុំច្បាប់សម្រាក (On Leave)';
    case 'resigned': return 'ឈប់បង្រៀន (Resigned)';
    default: return status || 'កំពុងបង្រៀន';
  }
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
