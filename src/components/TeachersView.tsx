import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Search,
  Phone,
  Mail,
  BookOpen,
  X,
  GraduationCap,
  CalendarCheck,
  FileSpreadsheet,
  Download,
  Upload,
  Filter
} from 'lucide-react';
import { Teacher, TeacherStatus, ShiftType } from '../types';
import { instituteService } from '../service/instituteService';
import {
  exportTeachersToExcel,
  downloadTeacherTemplate,
  parseTeacherExcel,
  getShiftLabel,
  getTeacherStatusLabel
} from '../utils/exportUtils';

interface TeachersViewProps {
  teachers: Teacher[];
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  isReadOnly?: boolean;
}

export const TeachersView: React.FC<TeachersViewProps> = ({
  teachers,
  showToast,
  isReadOnly = false
}) => {
  const [search, setSearch] = useState('');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Form states
  const [formTeacherCode, setFormTeacherCode] = useState('');
  const [formNameKhmer, setFormNameKhmer] = useState('');
  const [formNameLatin, setFormNameLatin] = useState('');
  const [formGender, setFormGender] = useState<'male' | 'female'>('male');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSubjects, setFormSubjects] = useState('');
  const [formShift, setFormShift] = useState('morning');
  const [formStatus, setFormStatus] = useState<TeacherStatus>('active');

  const openAddModal = () => {
    if (isReadOnly) return;
    setEditingTeacher(null);
    setFormTeacherCode(`ICI-TCH-${String(teachers.length + 1).padStart(3, '0')}`);
    setFormNameKhmer('');
    setFormNameLatin('');
    setFormGender('male');
    setFormPhone('');
    setFormEmail('');
    setFormSubjects('');
    setFormShift('morning');
    setFormStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (t: Teacher) => {
    setEditingTeacher(t);
    setFormTeacherCode(t.teacherCode);
    setFormNameKhmer(t.nameKhmer);
    setFormNameLatin(t.nameLatin);
    setFormGender(t.gender);
    setFormPhone(t.phone);
    setFormEmail(t.email || '');
    setFormSubjects(t.subjects);
    setFormShift(t.shift || 'morning');
    setFormStatus(t.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចកែប្រែទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    if (!formNameKhmer.trim()) {
      showToast('សូមបញ្ចូលឈ្មោះសាស្ត្រាចារ្យ!', 'error');
      return;
    }

    const data: Teacher = {
      id: editingTeacher ? editingTeacher.id : `tch_${Date.now()}`,
      teacherCode: formTeacherCode || `ICI-TCH-${Date.now().toString().slice(-4)}`,
      nameKhmer: formNameKhmer.trim(),
      nameLatin: formNameLatin.trim(),
      gender: formGender,
      phone: formPhone.trim(),
      email: formEmail.trim() || undefined,
      subjects: formSubjects.trim() || 'ភាសាចិន',
      shift: formShift,
      status: formStatus,
      createdAt: editingTeacher ? editingTeacher.createdAt : new Date().toISOString()
    };

    try {
      await instituteService.saveTeacher(data);
      showToast(editingTeacher ? 'បានកែប្រែព័ត៌មានសាស្ត្រាចារ្យជោគជ័យ!' : 'បានបន្ថែមសាស្ត្រាចារ្យថ្មីជោគជ័យ!', 'success');
      setIsModalOpen(false);
    } catch (e) {
      showToast('មិនអាចរក្សាទុកទិន្នន័យបានទេ', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចលុបទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    if (window.confirm(`តើអ្នកពិតជាចង់លុបសាស្ត្រាចារ្យ "${name}" មែនទេ?`)) {
      try {
        await instituteService.deleteTeacher(id);
        showToast('បានលុបសាស្ត្រាចារ្យជោគជ័យ!', 'info');
      } catch (e) {
        showToast('មិនអាចលុបបានទេ', 'error');
      }
    }
  };

  const handleDeleteAllTeachers = async () => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចលុបទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    setIsDeletingAll(true);
    try {
      await instituteService.deleteAllTeachers();
      showToast('បានលុបទិន្នន័យសាស្ត្រាចារ្យទាំងអស់ដោយជោគជ័យ!', 'success');
      setIsDeleteAllModalOpen(false);
    } catch (e) {
      showToast('មិនអាចលុបទិន្នន័យបានទេ', 'error');
    } finally {
      setIsDeletingAll(false);
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
      const parsed = await parseTeacherExcel(file);
      if (parsed.length === 0) {
        showToast('មិនមានទិន្នន័យត្រឹមត្រូវក្នុងឯកសារ Excel ទេ', 'error');
        return;
      }

      const fullTeachers: Teacher[] = parsed.map((p, idx) => ({
        id: `tch_import_${Date.now()}_${idx}`,
        teacherCode: p.teacherCode || `ICI-TCH-${String(teachers.length + idx + 1).padStart(3, '0')}`,
        nameKhmer: p.nameKhmer || 'សាស្ត្រាចារ្យ',
        nameLatin: p.nameLatin || '',
        gender: p.gender || 'male',
        phone: p.phone || '',
        email: p.email || '',
        subjects: p.subjects || 'ភាសាចិន',
        shift: p.shift || 'morning',
        status: p.status || 'active',
        createdAt: new Date().toISOString(),
      }));

      await instituteService.saveTeachersBulk(fullTeachers);
      showToast(`បានបញ្ចូលសាស្ត្រាចារ្យចំនួន ${fullTeachers.length} នាក់ពី Excel ដោយជោគជ័យ!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('ទម្រង់ឯកសារ Excel មិនត្រឹមត្រូវ', 'error');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedShift('all');
    setSelectedStatus('all');
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      // 1. Shift filter
      if (selectedShift !== 'all') {
        const teacherShift = (t.shift || '').toLowerCase();
        if (teacherShift !== selectedShift.toLowerCase()) return false;
      }

      // 2. Status filter
      if (selectedStatus !== 'all') {
        if (t.status !== selectedStatus) return false;
      }

      // 3. Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchCode = (t.teacherCode || '').toLowerCase().includes(q);
        const matchKhmer = (t.nameKhmer || '').toLowerCase().includes(q);
        const matchLatin = (t.nameLatin || '').toLowerCase().includes(q);
        const matchSubjects = (t.subjects || '').toLowerCase().includes(q);
        const matchPhone = (t.phone || '').toLowerCase().includes(q);
        const matchEmail = (t.email || '').toLowerCase().includes(q);

        if (!matchCode && !matchKhmer && !matchLatin && !matchSubjects && !matchPhone && !matchEmail) {
          return false;
        }
      }

      return true;
    });
  }, [teachers, selectedShift, selectedStatus, search]);

  const activeFiltersCount = [
    search.trim() !== '',
    selectedShift !== 'all',
    selectedStatus !== 'all'
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#131f1a] rounded-3xl p-6 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
              <UserCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </span>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              សាស្ត្រាចារ្យ & គ្រូបង្រៀន (Faculty Directory)
            </h2>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 font-medium">
            ទិន្នន័យសរុប {teachers.length} នាក់ • កំពុងបង្ហាញតាមតម្រង: {filteredTeachers.length} នាក់
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!isReadOnly && (
            <>
              {/* Delete All Data */}
              <button
                onClick={() => setIsDeleteAllModalOpen(true)}
                disabled={teachers.length === 0}
                title="លុបទិន្នន័យសាស្ត្រាចារ្យទាំងអស់"
                className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>លុបទិន្នន័យទាំងអស់ (Delete All)</span>
              </button>

              {/* Import Excel */}
              <label className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700">
                <Upload className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
                <span>{isImporting ? 'កំពុង Import...' : 'Import Excel'}</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isImporting}
                />
              </label>
            </>
          )}

          {/* Export Excel */}
          <button
            onClick={() => exportTeachersToExcel(filteredTeachers)}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export Excel ({filteredTeachers.length})</span>
          </button>

          {!isReadOnly && (
            <>
              {/* Template Download */}
              <button
                onClick={downloadTeacherTemplate}
                title="ទាញយកគំរូ Excel សម្រាប់សាស្ត្រាចារ្យ"
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Add Teacher */}
              <button
                onClick={openAddModal}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ បន្ថែមសាស្ត្រាចារ្យ</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters & Search Control */}
      <div className="bg-white dark:bg-[#131f1a] rounded-2xl p-4 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ស្វែងរកតាមឈ្មោះ, អត្តលេខ, មុខវិជ្ជា, ឬទូរស័ព្ទ..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden transition-all placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
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

          {/* Shift Filter */}
          <div>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 font-medium focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
            >
              <option value="all">វេនទាំងអស់ (All Shifts)</option>
              <option value="morning">វេនព្រឹក (Morning)</option>
              <option value="afternoon">វេនរសៀល (Afternoon)</option>
              <option value="evening">វេនយប់ (Evening)</option>
              <option value="weekend">ចុងសប្តាហ៍ (Weekend)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 font-medium focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
            >
              <option value="all">ស្ថានភាពទាំងអស់ (All Status)</option>
              <option value="active">កំពុងបង្រៀន (Active)</option>
              <option value="on_leave">សុំច្បាប់សម្រាក (On Leave)</option>
              <option value="resigned">ឈប់បង្រៀន (Resigned)</option>
            </select>
          </div>
        </div>

        {/* Active Filters Bar & Reset */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium">
              <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                តម្រងសកម្ម: <strong className="font-bold">{activeFiltersCount}</strong> លក្ខខណ្ឌ (រកឃើញ {filteredTeachers.length} នាក់)
              </span>
            </div>
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium text-xs inline-flex items-center gap-1 cursor-pointer transition-colors border border-zinc-200 dark:border-zinc-700"
            >
              <X className="w-3 h-3" />
              <span>សម្អាតតម្រងទាំងអស់ (Reset)</span>
            </button>
          </div>
        )}
      </div>

      {/* Teachers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-[#131f1a] rounded-3xl p-12 text-center text-zinc-400 border border-emerald-900/10 dark:border-emerald-800/30">
            <UserCheck className="w-8 h-8 text-zinc-400 dark:text-zinc-500 mx-auto mb-2" />
            <p className="font-bold text-zinc-700 dark:text-zinc-200">ពុំមានទិន្នន័យសាស្ត្រាចារ្យទេ</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">សូមសាកល្បងផ្លាស់ប្តូរលក្ខខណ្ឌ Filter ឬបន្ថែម/Import សាស្ត្រាចារ្យ</p>
          </div>
        ) : (
          filteredTeachers.map((t) => (
            <div
              key={t.id}
              className="bg-white dark:bg-[#131f1a] rounded-3xl p-5 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-600/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm ${
                        t.gender === 'female'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
                      }`}
                    >
                      {(t.nameKhmer || t.nameLatin || 'T').charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{t.nameKhmer}</h3>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{t.nameLatin || '-'}</p>
                      <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                        {t.teacherCode}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                      t.status === 'active'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                        : t.status === 'on_leave'
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {getTeacherStatusLabel(t.status)}
                  </span>
                </div>

                {/* Subjects & Contact */}
                <div className="space-y-2 text-xs py-3 border-y border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-start gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">មុខវិជ្ជា: </span>
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium">{t.subjects || 'មិនទាន់បញ្ជាក់'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">វេនបង្រៀន: </span>
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium">{getShiftLabel(t.shift || 'morning')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">{t.phone || '-'}</span>
                  </div>

                  {t.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-zinc-600 dark:text-zinc-400 truncate font-medium">{t.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(t)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isReadOnly ? 'មើលព័ត៌មាន' : 'កែប្រែ'}</span>
                </button>
                {!isReadOnly && (
                  <button
                    onClick={() => handleDelete(t.id, t.nameKhmer)}
                    className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131f1a] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-900/20 dark:border-emerald-800/50 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                  {isReadOnly ? 'ព័ត៌មានលម្អិតសាស្ត្រាចារ្យ (Faculty Profile)' : editingTeacher ? 'កែប្រែព័ត៌មានសាស្ត្រាចារ្យ' : 'បន្ថែមសាស្ត្រាចារ្យថ្មី'}
                </h3>
                {isReadOnly && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                    Read-Only
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">អត្តលេខគ្រូ *</label>
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  value={formTeacherCode}
                  onChange={(e) => setFormTeacherCode(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-mono disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">ឈ្មោះខ្មែរ *</label>
                  <input
                    type="text"
                    required
                    disabled={isReadOnly}
                    value={formNameKhmer}
                    onChange={(e) => setFormNameKhmer(e.target.value)}
                    placeholder="ឡុង សុខា"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">ឈ្មោះឡាតាំង</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formNameLatin}
                    onChange={(e) => setFormNameLatin(e.target.value)}
                    placeholder="Long Sokha"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">ភេទ</label>
                  <select
                    disabled={isReadOnly}
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="male">ប្រុស (Male)</option>
                    <option value="female">ស្រី (Female)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">លេខទូរស័ព្ទ *</label>
                  <input
                    type="text"
                    required
                    disabled={isReadOnly}
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="012 889 901"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">វេនបង្រៀន</label>
                  <select
                    disabled={isReadOnly}
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="morning">វេនព្រឹក (Morning)</option>
                    <option value="afternoon">វេនរសៀល (Afternoon)</option>
                    <option value="evening">វេនយប់ (Evening)</option>
                    <option value="weekend">ចុងសប្តាហ៍ (Weekend)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">ស្ថានភាព</label>
                  <select
                    disabled={isReadOnly}
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TeacherStatus)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="active">កំពុងបង្រៀន (Active)</option>
                    <option value="on_leave">សុំច្បាប់សម្រាក (On Leave)</option>
                    <option value="resigned">ឈប់បង្រៀន (Resigned)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">អ៊ីមែល (Email)</label>
                <input
                  type="email"
                  disabled={isReadOnly}
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="teacher@ici.edu.kh"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">មុខវិជ្ជាទទួលបន្ទុក</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={formSubjects}
                  onChange={(e) => setFormSubjects(e.target.value)}
                  placeholder="គរុកោសល្យទូទៅ, វេយ្យាករណ៍ភាសាចិន..."
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold cursor-pointer transition-colors border border-zinc-200 dark:border-zinc-700"
                >
                  {isReadOnly ? 'បិទ (Close)' : 'បោះបង់'}
                </button>
                {!isReadOnly && (
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer transition-colors shadow-sm"
                  >
                    រក្សាទុក
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
          <div className="bg-white dark:bg-[#131f1a] rounded-3xl p-6 max-w-md w-full border border-rose-200 dark:border-rose-900/50 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                តើអ្នកពិតជាចង់លុបទិន្នន័យសាស្ត្រាចារ្យទាំងអស់មែនទេ?
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                សកម្មភាពនេះនឹងលុបទិន្នន័យសាស្ត្រាចារ្យទាំងអស់ចំនួន <strong className="text-rose-600 dark:text-rose-400 font-bold">{teachers.length} នាក់</strong> ចេញពីប្រព័ន្ធជាអចិន្ត្រៃយ៍។
              </p>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-3 text-xs text-rose-800 dark:text-rose-200 space-y-1">
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
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700"
              >
                បោះបង់ (Cancel)
              </button>
              <button
                type="button"
                onClick={handleDeleteAllTeachers}
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
