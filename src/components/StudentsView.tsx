import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  Edit2,
  Trash2,
  Sun,
  Sunset,
  Moon,
  Calendar,
  X,
  CheckCircle,
  Phone,
  BookOpen,
  GraduationCap,
  Eye,
  Lock
} from 'lucide-react';
import { Student, Classroom, Major, ShiftType, AcademicYearType, StudentStatus } from '../types';
import { instituteService } from '../service/instituteService';
import {
  exportStudentsToExcel,
  downloadStudentTemplate,
  parseStudentExcel,
  getShiftLabel,
  getStatusLabel
} from '../utils/exportUtils';

interface StudentsViewProps {
  students: Student[];
  classes: Classroom[];
  majors: Major[];
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  isReadOnly?: boolean;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  classes,
  majors,
  isAddModalOpen = false,
  onCloseAddModal,
  showToast,
  isReadOnly = false
}) => {
  const [search, setSearch] = useState('');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMajor, setSelectedMajor] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpen);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Form states
  const [formStudentCode, setFormStudentCode] = useState('');
  const [formNameKhmer, setFormNameKhmer] = useState('');
  const [formNameLatin, setFormNameLatin] = useState('');
  const [formNameChinese, setFormNameChinese] = useState('');
  const [formGender, setFormGender] = useState<'male' | 'female'>('female');
  const [formDob, setFormDob] = useState('2004-01-01');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMajorId, setFormMajorId] = useState(majors[0]?.id || 'maj_pedagogy');
  const [formClassId, setFormClassId] = useState(classes[0]?.id || '');
  const [formShift, setFormShift] = useState<ShiftType>('morning');
  const [formYear, setFormYear] = useState<AcademicYearType>('Year 1');
  const [formStatus, setFormStatus] = useState<StudentStatus>('active');
  const [formGuardianPhone, setFormGuardianPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');

  // Sync external prop if passed
  React.useEffect(() => {
    if (isAddModalOpen) {
      openAddModal();
    }
  }, [isAddModalOpen]);

  const openAddModal = () => {
    setEditingStudent(null);
    setFormStudentCode(`ICI-2025-${String(students.length + 1).padStart(3, '0')}`);
    setFormNameKhmer('');
    setFormNameLatin('');
    setFormNameChinese('');
    setFormGender('female');
    setFormDob('2004-01-01');
    setFormPhone('');
    setFormEmail('');
    setFormMajorId(majors[0]?.id || 'maj_pedagogy');
    setFormClassId(classes[0]?.id || '');
    setFormShift('morning');
    setFormYear('Year 1');
    setFormStatus('active');
    setFormGuardianPhone('');
    setFormAddress('');
    setIsModalOpen(true);
  };

  const openEditModal = (stu: Student) => {
    setEditingStudent(stu);
    setFormStudentCode(stu.studentCode);
    setFormNameKhmer(stu.nameKhmer);
    setFormNameLatin(stu.nameLatin);
    setFormNameChinese(stu.nameChinese || '');
    setFormGender(stu.gender);
    setFormDob(stu.dob || '2004-01-01');
    setFormPhone(stu.phone || '');
    setFormEmail(stu.email || '');
    setFormMajorId(stu.majorId);
    setFormClassId(stu.classId);
    setFormShift(stu.shift);
    setFormYear(stu.year);
    setFormStatus(stu.status);
    setFormGuardianPhone(stu.guardianPhone || '');
    setFormAddress(stu.address || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    if (onCloseAddModal) onCloseAddModal();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedShift('all');
    setSelectedClass('all');
    setSelectedYear('all');
    setSelectedMajor('all');
    setSelectedStatus('all');
  };

  const activeFiltersCount = [
    search.trim() !== '',
    selectedShift !== 'all',
    selectedClass !== 'all',
    selectedYear !== 'all',
    selectedMajor !== 'all',
    selectedStatus !== 'all'
  ].filter(Boolean).length;

  const handleDeleteAllStudents = async () => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចលុបទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    setIsDeletingAll(true);
    try {
      await instituteService.deleteAllStudents();
      showToast('បានលុបទិន្នន័យនិស្សិតទាំងអស់ដោយជោគជ័យ!', 'success');
      setIsDeleteAllModalOpen(false);
    } catch (e) {
      showToast('មិនអាចលុបទិន្នន័យបានទេ', 'error');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចបង្កើត ឬកែប្រែទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    if (!formNameKhmer.trim()) {
      showToast('សូមបញ្ចូលឈ្មោះខ្មែររបស់និស្សិត!', 'error');
      return;
    }

    const selectedMaj = majors.find((m) => m.id === formMajorId);
    const selectedCls = classes.find((c) => c.id === formClassId);

    const studentData: Student = {
      id: editingStudent ? editingStudent.id : `stu_${Date.now()}`,
      studentCode: formStudentCode || `CPI-${Date.now()}`,
      nameKhmer: formNameKhmer.trim(),
      nameLatin: formNameLatin.trim(),
      nameChinese: formNameChinese.trim() || undefined,
      gender: formGender,
      dob: formDob,
      phone: formPhone.trim(),
      email: formEmail.trim() || undefined,
      majorId: formMajorId,
      majorName: selectedMaj?.nameKhmer || 'គរុកោសល្យភាសាចិន',
      classId: formClassId,
      className: selectedCls?.name || 'ថ្នាក់ទូទៅ',
      shift: formShift,
      year: formYear,
      status: formStatus,
      guardianPhone: formGuardianPhone.trim() || undefined,
      address: formAddress.trim() || undefined,
      createdAt: editingStudent ? editingStudent.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await instituteService.saveStudent(studentData);
      showToast(
        editingStudent ? 'បានកែប្រែព័ត៌មាននិស្សិតជោគជ័យ!' : 'បានបញ្ចូលនិស្សិតថ្មីជោគជ័យ!',
        'success'
      );
      closeModal();
    } catch (err: any) {
      showToast('មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ', 'error');
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចលុបទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    if (window.confirm(`តើអ្នកពិតជាចង់លុបនិស្សិត "${name}" មែនទេ?`)) {
      try {
        await instituteService.deleteStudent(id);
        showToast('បានលុបនិស្សិតជោគជ័យ!', 'info');
      } catch (e) {
        showToast('មិនអាចលុបបានទេ', 'error');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាច Import ទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const parsed = await parseStudentExcel(file);
      if (parsed.length === 0) {
        showToast('មិនមានទិន្នន័យនិស្សិតក្នុងឯកសារ Excel ទេ!', 'error');
        return;
      }

      const defaultMajor = majors[0];
      const defaultClass = classes[0];

      const fullStudents: Student[] = parsed.map((p, index) => {
        // Resolve Major from Excel row or fallback
        let matchedMajor = defaultMajor;
        if (p.majorName) {
          const rawMajor = (p.majorName || '').toLowerCase().trim();
          const found = majors.find(
            (m) =>
              m.id.toLowerCase() === rawMajor ||
              m.nameKhmer.toLowerCase().includes(rawMajor) ||
              rawMajor.includes(m.nameKhmer.toLowerCase()) ||
              (m.nameLatin && m.nameLatin.toLowerCase().includes(rawMajor)) ||
              (m.code && m.code.toLowerCase() === rawMajor)
          );
          if (found) matchedMajor = found;
        }

        // Resolve Classroom from Excel row or fallback
        let matchedClass = defaultClass;
        if (p.className) {
          const rawClass = (p.className || '').toLowerCase().trim();
          const found = classes.find(
            (c) =>
              c.id.toLowerCase() === rawClass ||
              c.name.toLowerCase().includes(rawClass) ||
              rawClass.includes(c.name.toLowerCase()) ||
              (c.classCode && c.classCode.toLowerCase() === rawClass)
          );
          if (found) matchedClass = found;
        }

        return {
          id: `stu_imp_${Date.now()}_${index}`,
          studentCode: p.studentCode || `ICI-2025-${String(students.length + index + 1).padStart(3, '0')}`,
          nameKhmer: p.nameKhmer || 'និស្សិត',
          nameLatin: p.nameLatin || '',
          nameChinese: p.nameChinese || undefined,
          gender: p.gender || 'female',
          dob: p.dob || '2004-01-01',
          phone: p.phone || '',
          email: p.email || undefined,
          majorId: matchedMajor?.id || 'maj_pedagogy',
          majorName: matchedMajor?.nameKhmer || 'គរុកោសល្យភាសាចិន',
          classId: matchedClass?.id || (classes[0]?.id || ''),
          className: matchedClass?.name || 'ថ្នាក់ឆ្នាំទី១',
          shift: p.shift || 'morning',
          year: p.year || 'Year 1',
          status: p.status || 'active',
          guardianPhone: p.guardianPhone || undefined,
          address: p.address || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      await instituteService.saveStudentsBulk(fullStudents);
      showToast(`បានបញ្ចូលនិស្សិតចំនួន ${fullStudents.length} នាក់ពី Excel ដោយជោគជ័យ!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('ទម្រង់ឯកសារ Excel មិនត្រឹមត្រូវ', 'error');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Shift filter
      if (selectedShift !== 'all') {
        const studentShift = (s.shift || '').toLowerCase();
        if (studentShift !== selectedShift.toLowerCase()) return false;
      }

      // 2. Class filter (match by ID or class name)
      if (selectedClass !== 'all') {
        const targetClass = classes.find((c) => c.id === selectedClass);
        const matchesId = s.classId === selectedClass;
        const matchesName = targetClass && s.className === targetClass.name;
        const matchesDirectName = s.className === selectedClass;
        if (!matchesId && !matchesName && !matchesDirectName) return false;
      }

      // 3. Major filter (match by ID or major name)
      if (selectedMajor !== 'all') {
        const targetMajor = majors.find((m) => m.id === selectedMajor);
        const matchesId = s.majorId === selectedMajor;
        const matchesName = targetMajor && (s.majorName === targetMajor.nameKhmer || s.majorName === targetMajor.nameLatin);
        const matchesDirectName = s.majorName === selectedMajor;
        if (!matchesId && !matchesName && !matchesDirectName) return false;
      }

      // 4. Academic Year filter
      if (selectedYear !== 'all') {
        const studentYear = (s.year || '').toLowerCase();
        const targetYear = selectedYear.toLowerCase();
        if (!studentYear.includes(targetYear) && studentYear !== targetYear) return false;
      }

      // 5. Status filter
      if (selectedStatus !== 'all') {
        if (s.status !== selectedStatus) return false;
      }

      // 6. Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchCode = (s.studentCode || '').toLowerCase().includes(q);
        const matchKhmer = (s.nameKhmer || '').toLowerCase().includes(q);
        const matchLatin = (s.nameLatin || '').toLowerCase().includes(q);
        const matchChinese = (s.nameChinese || '').toLowerCase().includes(q);
        const matchPhone = (s.phone || '').toLowerCase().includes(q);
        const matchGuardian = (s.guardianPhone || '').toLowerCase().includes(q);
        const matchClass = (s.className || '').toLowerCase().includes(q);
        const matchMajor = (s.majorName || '').toLowerCase().includes(q);

        if (!matchCode && !matchKhmer && !matchLatin && !matchChinese && !matchPhone && !matchGuardian && !matchClass && !matchMajor) {
          return false;
        }
      }

      return true;
    });
  }, [students, classes, majors, selectedShift, selectedClass, selectedMajor, selectedYear, selectedStatus, search]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#131f1a] rounded-3xl p-6 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
              <Users className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </span>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              បញ្ជីរាយនាមនិស្សិត (Students Directory)
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            ទិន្នន័យសរុប {students.length} នាក់ • កំពុងបង្ហាញតាមតម្រង: {filteredStudents.length} នាក់
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Delete All Data - Hidden in Guest mode */}
          {!isReadOnly && (
            <button
              onClick={() => setIsDeleteAllModalOpen(true)}
              disabled={students.length === 0}
              title="លុបទិន្នន័យនិស្សិតទាំងអស់"
              className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>លុបទិន្នន័យទាំងអស់ (Delete All)</span>
            </button>
          )}

          {!isReadOnly ? (
            <label className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
              <span>{isImporting ? 'កំពុង Import...' : 'Import Excel'}</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isImporting}
              />
            </label>
          ) : null}

          <button
            onClick={() => exportStudentsToExcel(filteredStudents)}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export Excel ({filteredStudents.length})</span>
          </button>

          <button
            onClick={downloadStudentTemplate}
            title="ទាញយកគំរូ Excel"
            className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>

          {!isReadOnly ? (
            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ បន្ថែមនិស្សិតថ្មី</span>
            </button>
          ) : (
            <div className="px-3 py-2 rounded-xl bg-amber-100 dark:bg-amber-950/50 border border-amber-300/50 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 font-bold text-xs inline-flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>របៀបភ្ញៀវ (Read-Only)</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters & Search Control */}
      <div className="bg-white dark:bg-[#131f1a] rounded-2xl p-4 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2 md:col-span-3 lg:col-span-2">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ស្វែងរកតាមឈ្មោះ, អត្តលេខ, ទូរសព្ទ..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Major Filter */}
          <div>
            <select
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-700 dark:text-zinc-200 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
            >
              <option value="all">ជំនាញទាំងអស់ (All Majors)</option>
              {majors.map((m) => (
                <option key={m.id} value={m.id} className="dark:bg-[#131f1a]">
                  {m.nameKhmer}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-700 dark:text-zinc-200 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
            >
              <option value="all">ថ្នាក់ទាំងអស់ (All Classes)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id} className="dark:bg-[#131f1a]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Shift Filter */}
          <div>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-700 dark:text-zinc-200 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
            >
              <option value="all">វេនទាំងអស់ (All Shifts)</option>
              <option value="morning">វេនព្រឹក (Morning)</option>
              <option value="afternoon">វេនរសៀល (Afternoon)</option>
              <option value="evening">វេនយប់ (Evening)</option>
              <option value="weekend">ចុងសប្តាហ៍ (Weekend)</option>
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-700 dark:text-zinc-200 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
            >
              <option value="all">ឆ្នាំទាំងអស់ (All Years)</option>
              <option value="Year 1">ឆ្នាំទី១ (Year 1)</option>
              <option value="Year 2">ឆ្នាំទី២ (Year 2)</option>
              <option value="Year 3">ឆ្នាំទី៣ (Year 3)</option>
              <option value="Year 4">ឆ្នាំទី៤ (Year 4)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-700 dark:text-zinc-200 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
            >
              <option value="all">ស្ថានភាពទាំងអស់ (All Status)</option>
              <option value="active">កំពុងរៀន (Active)</option>
              <option value="suspended">ព្យួរការសិក្សា (Suspended)</option>
              <option value="dropped">បោះបង់ (Dropped)</option>
              <option value="graduated">បញ្ចប់ការសិក្សា (Graduated)</option>
            </select>
          </div>
        </div>

        {/* Active Filters Bar & Reset */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                តម្រងសកម្ម: <strong className="font-semibold">{activeFiltersCount}</strong> លក្ខខណ្ឌ (រកឃើញ {filteredStudents.length} នាក់)
              </span>
            </div>
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <X className="w-3 h-3" />
              <span>សម្អាតតម្រងទាំងអស់ (Reset)</span>
            </button>
          </div>
        )}
      </div>

      {/* Student Table */}
      <div className="bg-white dark:bg-[#131f1a] rounded-3xl border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-[#182620] border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">អត្តលេខ & រូបថត</th>
                <th className="py-3.5 px-4">ឈ្មោះនិស្សិត (ខ្មែរ / Latin / Chinese)</th>
                <th className="py-3.5 px-4">ភេទ & ថ្ងៃកំណើត</th>
                <th className="py-3.5 px-4">ថ្នាក់ & ជំនាញ</th>
                <th className="py-3.5 px-4">វេន & ឆ្នាំ</th>
                <th className="py-3.5 px-4">ទូរសព្ទ / អាណាព្យាបាល</th>
                <th className="py-3.5 px-4">ស្ថានភាព</th>
                <th className="py-3.5 px-4 text-right">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    <Users className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                    <p className="font-semibold text-zinc-600 dark:text-zinc-300">ពុំមានទិន្នន័យនិស្សិតទេ</p>
                    <p className="text-[11px]">សូមសាកល្បងផ្លាស់ប្តូរលក្ខខណ្ឌ Filter ឬបន្ថែមនិស្សិតថ្មី</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu) => (
                  <tr key={stu.id} className="hover:bg-emerald-50/40 dark:hover:bg-[#182620]/60 transition-colors">
                    {/* Student ID & Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            stu.gender === 'female'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {(stu.nameKhmer || stu.nameLatin || 'S').charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">{stu.studentCode}</div>
                        </div>
                      </div>
                    </td>

                    {/* Names */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{stu.nameKhmer}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{stu.nameLatin}</div>
                      {stu.nameChinese && (
                        <div className="text-[10px] text-emerald-800 dark:text-emerald-400 font-semibold">{stu.nameChinese}</div>
                      )}
                    </td>

                    {/* Gender & DOB */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-800 dark:text-zinc-200">
                        {stu.gender === 'female' ? 'ស្រី (Female)' : 'ប្រុស (Male)'}
                      </div>
                      <div className="text-[11px] text-zinc-400">{stu.dob || '-'}</div>
                    </td>

                    {/* Class & Major */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{stu.className}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{stu.majorName}</div>
                    </td>

                    {/* Shift & Year */}
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1 font-semibold text-emerald-900 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 px-2 py-0.5 rounded-md text-[10.5px]">
                        {stu.shift === 'morning' && <Sun className="w-3 h-3 text-amber-500" />}
                        {stu.shift === 'afternoon' && <Sunset className="w-3 h-3 text-orange-500" />}
                        {stu.shift === 'evening' && <Moon className="w-3 h-3 text-indigo-500" />}
                        {stu.shift === 'weekend' && <Calendar className="w-3 h-3 text-teal-500" />}
                        <span>{getShiftLabel(stu.shift)}</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{stu.year}</div>
                    </td>

                    {/* Phone / Contact */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-zinc-400" />
                        <span>{stu.phone || '-'}</span>
                      </div>
                      {stu.guardianPhone && (
                        <div className="text-[10px] text-zinc-400">អាណាព្យាបាល: {stu.guardianPhone}</div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          stu.status === 'active'
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                            : stu.status === 'suspended'
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                            : stu.status === 'graduated'
                            ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {getStatusLabel(stu.status)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {isReadOnly ? (
                          <button
                            onClick={() => openEditModal(stu)}
                            title="ពិនិត្យមើលព័ត៌មានលម្អិត"
                            className="px-2.5 py-1 rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-semibold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ពិនិត្យមើល</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => openEditModal(stu)}
                              title="កែប្រែ"
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(stu.id, stu.nameKhmer)}
                              title="លុប"
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#131f1a] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-emerald-900/10 dark:border-emerald-800/30 space-y-5 animate-in fade-in zoom-in duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                      {isReadOnly ? 'ព័ត៌មានលម្អិតនិស្សិត (Student Profile)' : editingStudent ? 'កែប្រែព័ត៌មាននិស្សិត' : 'ចុះឈ្មោះនិស្សិតថ្មី (New Student)'}
                    </h3>
                    {isReadOnly && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                        Read-Only
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    វិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់ (International Chinese Education and Teachers Institute)
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    អត្តលេខនិស្សិត (Student ID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formStudentCode}
                    onChange={(e) => setFormStudentCode(e.target.value)}
                    placeholder="CPI-2025-001"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ឈ្មោះខ្មែរ (Name Khmer) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNameKhmer}
                    onChange={(e) => setFormNameKhmer(e.target.value)}
                    placeholder="ឧ. ជា សុខនីកា"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    អក្សរឡាតាំង (Name Latin)
                  </label>
                  <input
                    type="text"
                    value={formNameLatin}
                    onChange={(e) => setFormNameLatin(e.target.value)}
                    placeholder="e.g. Chea Soknika"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ឈ្មោះជាភាសាចិន (Chinese Name)
                  </label>
                  <input
                    type="text"
                    value={formNameChinese}
                    onChange={(e) => setFormNameChinese(e.target.value)}
                    placeholder="ឧ. 谢淑妮"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">ភេទ (Gender)</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer font-medium"
                  >
                    <option value="female">ស្រី (Female)</option>
                    <option value="male">ប្រុស (Male)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ថ្ងៃខែឆ្នាំកំណើត (DOB)
                  </label>
                  <input
                    type="date"
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ជំនាញសិក្សា (Major)
                  </label>
                  <select
                    value={formMajorId}
                    onChange={(e) => setFormMajorId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer font-medium"
                  >
                    {majors.map((m) => (
                      <option key={m.id} value={m.id} className="dark:bg-[#131f1a]">
                        {m.nameKhmer} ({m.nameLatin})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ថ្នាក់រៀន (Class)
                  </label>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer font-medium"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id} className="dark:bg-[#131f1a]">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    វេនសិក្សា (Shift)
                  </label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value as ShiftType)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer font-medium"
                  >
                    <option value="morning">វេនព្រឹក (Morning 07:30-11:00)</option>
                    <option value="afternoon">វេនរសៀល (Afternoon 13:30-17:00)</option>
                    <option value="evening">វេនយប់ (Evening 17:30-20:30)</option>
                    <option value="weekend">ចុងសប្តាហ៍ (Weekend)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    កម្រិតឆ្នាំសិក្សា (Year)
                  </label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value as AcademicYearType)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer font-medium"
                  >
                    <option value="Year 1">ឆ្នាំទី១ (Year 1)</option>
                    <option value="Year 2">ឆ្នាំទី២ (Year 2)</option>
                    <option value="Year 3">ឆ្នាំទី៣ (Year 3)</option>
                    <option value="Year 4">ឆ្នាំទី៤ (Year 4)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">លេខទូរសព្ទ (Phone)</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="012 345 678"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    លេខអាណាព្យាបាល (Guardian Phone)
                  </label>
                  <input
                    type="text"
                    value={formGuardianPhone}
                    onChange={(e) => setFormGuardianPhone(e.target.value)}
                    placeholder="098 765 432"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">អាសយដ្ឋាន (Address)</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="រាជធានីភ្នំពេញ"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold cursor-pointer"
                >
                  {isReadOnly ? 'បិទ (Close)' : 'បោះបង់ (Cancel)'}
                </button>
                {!isReadOnly && (
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs cursor-pointer"
                  >
                    {editingStudent ? 'រក្សាទុកការកែប្រែ' : 'ចុះឈ្មោះនិស្សិត'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131f1a] rounded-3xl p-6 max-w-md w-full border border-rose-100 dark:border-rose-900/30 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                តើអ្នកពិតជាចង់លុបទិន្នន័យនិស្សិតទាំងអស់មែនទេ?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                សកម្មភាពនេះនឹងលុបទិន្នន័យនិស្សិតទាំងអស់ចំនួន <strong className="text-rose-600 dark:text-rose-400 font-bold">{students.length} នាក់</strong> ចេញពីប្រព័ន្ធជាអចិន្ត្រៃយ៍ ហើយមិនអាចត្រឡប់ក្រោយបានឡើយ។
              </p>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-2xl p-3 text-xs text-rose-800 dark:text-rose-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <span>⚠️ ការព្រមាន (Warning):</span>
              </p>
              <p className="text-[11px] leading-relaxed">
                ទិន្នន័យទាំងអស់នៅក្នុងមូលដ្ឋានទិន្នន័យ (Cloud Firestore) នឹងត្រូវលុបចោលទាំងស្រុង។ សូមប្រាកដថាអ្នកបាន Export Excel រួចរាល់មុននឹងធ្វើការលុប។
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                disabled={isDeletingAll}
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                បោះបង់ (Cancel)
              </button>
              <button
                type="button"
                onClick={handleDeleteAllStudents}
                disabled={isDeletingAll}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isDeletingAll ? (
                  <span>កំពុងលុប...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>លុបទាំងអស់ (Confirm Delete)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
