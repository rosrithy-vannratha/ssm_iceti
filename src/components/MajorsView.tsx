import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  GraduationCap,
  X,
  Users,
  Layers
} from 'lucide-react';
import { Major, Classroom, Student } from '../types';
import { instituteService } from '../service/instituteService';

interface MajorsViewProps {
  majors: Major[];
  classes: Classroom[];
  students: Student[];
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  isReadOnly?: boolean;
}

export const MajorsView: React.FC<MajorsViewProps> = ({
  majors,
  classes,
  students,
  showToast,
  isReadOnly = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);

  const [formCode, setFormCode] = useState('');
  const [formNameKhmer, setFormNameKhmer] = useState('');
  const [formNameLatin, setFormNameLatin] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formYears, setFormYears] = useState(4);

  const openAddModal = () => {
    if (isReadOnly) return;
    setEditingMajor(null);
    setFormCode(`MAJ-${String(majors.length + 1)}`);
    setFormNameKhmer('');
    setFormNameLatin('');
    setFormDescription('');
    setFormYears(4);
    setIsModalOpen(true);
  };

  const openEditModal = (m: Major) => {
    setEditingMajor(m);
    setFormCode(m.code);
    setFormNameKhmer(m.nameKhmer);
    setFormNameLatin(m.nameLatin);
    setFormDescription(m.description || '');
    setFormYears(m.totalYears);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចកែប្រែទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    if (!formNameKhmer.trim()) {
      showToast('សូមបញ្ចូលឈ្មោះជំនាញ!', 'error');
      return;
    }

    const data: Major = {
      id: editingMajor ? editingMajor.id : `maj_${Date.now()}`,
      code: formCode.trim() || `MAJ-${Date.now()}`,
      nameKhmer: formNameKhmer.trim(),
      nameLatin: formNameLatin.trim(),
      description: formDescription.trim() || undefined,
      totalYears: Number(formYears) || 4
    };

    try {
      await instituteService.saveMajor(data);
      showToast(editingMajor ? 'បានកែប្រែជំនាញជោគជ័យ!' : 'បានបន្ថែមជំនាញថ្មីជោគជ័យ!', 'success');
      setIsModalOpen(false);
    } catch (e) {
      showToast('មិនអាចរក្សាទុកបានទេ', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចលុបទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    if (window.confirm(`តើអ្នកពិតជាចង់លុបជំនាញ "${name}" មែនទេ?`)) {
      try {
        await instituteService.deleteMajor(id);
        showToast('បានលុបជំនាញជោគជ័យ!', 'info');
      } catch (e) {
        showToast('មិនអាចលុបបានទេ', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#131f1a] rounded-3xl p-6 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
              <BookOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </span>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              ដេប៉ាតឺម៉ង់ & ជំនាញបណ្តុះបណ្តាល (Academic Majors)
            </h2>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 font-medium">
            កម្មវិធីបណ្តុះបណ្តាល និងឯកទេសភាសាចិនថ្នាក់បរិញ្ញាបត្រ (៤ ឆ្នាំ)
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ បន្ថែមជំនាញថ្មី</span>
          </button>
        )}
      </div>

      {/* Majors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {majors.map((maj) => {
          const classCount = classes.filter((c) => c.majorId === maj.id).length;
          const studentCount = students.filter((s) => s.majorId === maj.id).length;

          return (
            <div
              key={maj.id}
              className="bg-white dark:bg-[#131f1a] rounded-3xl p-6 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-600/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                      <GraduationCap className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">{maj.nameKhmer}</h3>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{maj.nameLatin}</p>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                    {maj.code}
                  </span>
                </div>

                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed py-3 border-y border-zinc-100 dark:border-zinc-800">
                  {maj.description || 'កម្មវិធីសិក្សាស្តង់ដារវិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់'}
                </p>
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    <span>{classCount} ថ្នាក់</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{studentCount} និស្សិត</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(maj)}
                    title={isReadOnly ? 'ពិនិត្យព័ត៌មានជំនាញ' : 'កែប្រែជំនាញ'}
                    className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {!isReadOnly && (
                    <button
                      onClick={() => handleDelete(maj.id, maj.nameKhmer)}
                      className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131f1a] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-900/20 dark:border-emerald-800/50 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                  {isReadOnly ? 'ព័ត៌មានជំនាញ (Major Info)' : editingMajor ? 'កែប្រែជំនាញ' : 'បន្ថែមជំនាញថ្មី'}
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
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">កូដជំនាញ (Code) *</label>
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="EDU-CN"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-mono disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">ឈ្មោះខ្មែរ (Name Khmer) *</label>
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  value={formNameKhmer}
                  onChange={(e) => setFormNameKhmer(e.target.value)}
                  placeholder="គរុកោសល្យភាសាចិន"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">ឈ្មោះឡាតាំង (Name Latin)</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={formNameLatin}
                  onChange={(e) => setFormNameLatin(e.target.value)}
                  placeholder="Chinese Language Pedagogy"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">ការពិពណ៌នា</label>
                <textarea
                  rows={3}
                  disabled={isReadOnly}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="គោលបំណង និងការបណ្តុះបណ្តាល..."
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden resize-none disabled:opacity-75 disabled:cursor-not-allowed"
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
    </div>
  );
};
