import React, { useState } from 'react';
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
  CalendarCheck
} from 'lucide-react';
import { Teacher, TeacherStatus } from '../types';
import { instituteService } from '../service/instituteService';

interface TeachersViewProps {
  teachers: Teacher[];
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const TeachersView: React.FC<TeachersViewProps> = ({ teachers, showToast }) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

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
    setEditingTeacher(null);
    setFormTeacherCode(`TCH-${String(teachers.length + 1).padStart(3, '0')}`);
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
    if (!formNameKhmer.trim()) {
      showToast('សូមបញ្ចូលឈ្មោះគ្រូ!', 'error');
      return;
    }

    const data: Teacher = {
      id: editingTeacher ? editingTeacher.id : `tch_${Date.now()}`,
      teacherCode: formTeacherCode || `TCH-${Date.now()}`,
      nameKhmer: formNameKhmer.trim(),
      nameLatin: formNameLatin.trim(),
      gender: formGender,
      phone: formPhone.trim(),
      email: formEmail.trim() || undefined,
      subjects: formSubjects.trim(),
      shift: formShift,
      status: formStatus,
      createdAt: editingTeacher ? editingTeacher.createdAt : new Date().toISOString()
    };

    try {
      await instituteService.saveTeacher(data);
      showToast(editingTeacher ? 'បានកែប្រែព័ត៌មានគ្រូជោគជ័យ!' : 'បានបន្ថែមគ្រូថ្មីជោគជ័យ!', 'success');
      setIsModalOpen(false);
    } catch (e) {
      showToast('មិនអាចរក្សាទុកទិន្នន័យបានទេ', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`តើអ្នកពិតជាចង់លុបសាស្ត្រាចារ្យ "${name}" មែនទេ?`)) {
      try {
        await instituteService.deleteTeacher(id);
        showToast('បានលុបសាស្ត្រាចារ្យជោគជ័យ!', 'info');
      } catch (e) {
        showToast('មិនអាចលុបបានទេ', 'error');
      }
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (t.nameKhmer || '').toLowerCase().includes(q) ||
      (t.nameLatin || '').toLowerCase().includes(q) ||
      (t.teacherCode || '').toLowerCase().includes(q) ||
      (t.subjects || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-900/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              <UserCheck className="w-4 h-4 text-emerald-700" />
            </span>
            <h2 className="text-xl font-bold text-zinc-900">
              សាស្ត្រាចារ្យ & គ្រូបង្រៀន (Faculty Directory)
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            គ្រប់គ្រងបញ្ជីសាស្ត្រាចារ្យ មុខវិជ្ជាទទួលបន្ទុក និងព័ត៌មានទំនាក់ទំនង
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ បន្ថែមសាស្ត្រាចារ្យ</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl p-4 border border-emerald-900/10 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ស្វែងរកតាមឈ្មោះ, អត្តលេខ, ឬមុខវិជ្ជា..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:bg-white focus:border-emerald-500 outline-hidden"
          />
        </div>
      </div>

      {/* Teachers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-3xl p-5 border border-emerald-900/10 shadow-xs hover:border-emerald-500/30 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm ${
                      t.gender === 'female'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {(t.nameKhmer || t.nameLatin || 'T').charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 text-sm">{t.nameKhmer}</h3>
                    <p className="text-xs text-zinc-500">{t.nameLatin}</p>
                    <span className="font-mono text-[10px] text-emerald-700 font-bold">
                      {t.teacherCode}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    t.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {t.status === 'active' ? 'កំពុងបង្រៀន' : 'ឈប់សម្រាក'}
                </span>
              </div>

              {/* Subjects & Contact */}
              <div className="space-y-2 text-xs py-3 border-y border-zinc-100">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-zinc-700">មុខវិជ្ជា: </span>
                    <span className="text-zinc-600">{t.subjects || 'មិនទាន់បញ្ជាក់'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="text-zinc-600">{t.phone || '-'}</span>
                </div>

                {t.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="text-zinc-500 truncate">{t.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => openEditModal(t)}
                className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>កែប្រែ</span>
              </button>
              <button
                onClick={() => handleDelete(t.id, t.nameKhmer)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-900/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="font-bold text-zinc-900 text-base">
                {editingTeacher ? 'កែប្រែព័ត៌មានសាស្ត្រាចារ្យ' : 'បន្ថែមសាស្ត្រាចារ្យថ្មី'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">អត្តលេខគ្រូ *</label>
                <input
                  type="text"
                  required
                  value={formTeacherCode}
                  onChange={(e) => setFormTeacherCode(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-hidden font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">ឈ្មោះខ្មែរ *</label>
                  <input
                    type="text"
                    required
                    value={formNameKhmer}
                    onChange={(e) => setFormNameKhmer(e.target.value)}
                    placeholder="ឡុង សុខា"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">ឈ្មោះឡាតាំង</label>
                  <input
                    type="text"
                    value={formNameLatin}
                    onChange={(e) => setFormNameLatin(e.target.value)}
                    placeholder="Long Sokha"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">ភេទ</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-hidden cursor-pointer"
                  >
                    <option value="male">ប្រុស (Male)</option>
                    <option value="female">ស្រី (Female)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">លេខទូរស័ព្ទ *</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="012 889 901"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">អ៊ីមែល (Email)</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="teacher@cpi.edu.kh"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">មុខវិជ្ជាទទួលបន្ទុក</label>
                <input
                  type="text"
                  value={formSubjects}
                  onChange={(e) => setFormSubjects(e.target.value)}
                  placeholder="វេយ្យាករណ៍ចិន, វិធីសាស្ត្របង្រៀន..."
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
                >
                  រក្សាទុក
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
