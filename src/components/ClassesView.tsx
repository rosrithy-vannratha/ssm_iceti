import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Users,
  Sun,
  Sunset,
  Moon,
  Calendar,
  X,
  BookOpen,
  UserCheck
} from 'lucide-react';
import { Classroom, Major, Teacher, Student, ShiftType, AcademicYearType } from '../types';
import { instituteService } from '../service/instituteService';
import { getShiftLabel } from '../utils/exportUtils';

interface ClassesViewProps {
  classes: Classroom[];
  majors: Major[];
  teachers: Teacher[];
  students: Student[];
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  classes,
  majors,
  teachers,
  students,
  isAddModalOpen = false,
  onCloseAddModal,
  showToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpen);
  const [editingClass, setEditingClass] = useState<Classroom | null>(null);

  // Form fields
  const [formClassCode, setFormClassCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formMajorId, setFormMajorId] = useState(majors[0]?.id || 'maj_pedagogy');
  const [formYear, setFormYear] = useState<AcademicYearType>('Year 1');
  const [formShift, setFormShift] = useState<ShiftType>('morning');
  const [formRoom, setFormRoom] = useState('បន្ទប់ A101');
  const [formAcademicYear, setFormAcademicYear] = useState('2025-2026');
  const [formTeacherId, setFormTeacherId] = useState(teachers[0]?.id || '');

  React.useEffect(() => {
    if (isAddModalOpen) {
      openAddModal();
    }
  }, [isAddModalOpen]);

  const openAddModal = () => {
    setEditingClass(null);
    setFormClassCode(`ED-Y1-${String(classes.length + 1)}`);
    setFormName('');
    setFormMajorId(majors[0]?.id || 'maj_pedagogy');
    setFormYear('Year 1');
    setFormShift('morning');
    setFormRoom('បន្ទប់ A101');
    setFormAcademicYear('2025-2026');
    setFormTeacherId(teachers[0]?.id || '');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Classroom) => {
    setEditingClass(c);
    setFormClassCode(c.classCode);
    setFormName(c.name);
    setFormMajorId(c.majorId);
    setFormYear(c.year);
    setFormShift(c.shift);
    setFormRoom(c.room);
    setFormAcademicYear(c.academicYear);
    setFormTeacherId(c.teacherId || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClass(null);
    if (onCloseAddModal) onCloseAddModal();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('សូមបញ្ចូលឈ្មោះថ្នាក់រៀន!', 'error');
      return;
    }

    const selectedMaj = majors.find((m) => m.id === formMajorId);
    const selectedTch = teachers.find((t) => t.id === formTeacherId);

    const classData: Classroom = {
      id: editingClass ? editingClass.id : `cls_${Date.now()}`,
      classCode: formClassCode || `CLS-${Date.now()}`,
      name: formName.trim(),
      majorId: formMajorId,
      majorName: selectedMaj?.nameKhmer || 'គរុកោសល្យភាសាចិន',
      year: formYear,
      shift: formShift,
      room: formRoom.trim(),
      academicYear: formAcademicYear.trim(),
      teacherId: formTeacherId || undefined,
      teacherName: selectedTch ? `សាស្ត្រាចារ្យ ${selectedTch.nameKhmer}` : undefined,
      createdAt: editingClass ? editingClass.createdAt : new Date().toISOString()
    };

    try {
      await instituteService.saveClass(classData);
      showToast(editingClass ? 'បានកែប្រែថ្នាក់រៀនជោគជ័យ!' : 'បានបង្កើតថ្នាក់រៀនថ្មីជោគជ័យ!', 'success');
      closeModal();
    } catch (e) {
      showToast('មិនអាចរក្សាទុកថ្នាក់រៀនបានទេ', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`តើអ្នកពិតជាចង់លុបថ្នាក់ "${name}" មែនទេ?`)) {
      try {
        await instituteService.deleteClass(id);
        showToast('បានលុបថ្នាក់រៀនជោគជ័យ!', 'info');
      } catch (e) {
        showToast('មិនអាចលុបបានទេ', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-900/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              <Layers className="w-4 h-4 text-emerald-700" />
            </span>
            <h2 className="text-xl font-bold text-zinc-900">
              បញ្ជីថ្នាក់រៀន (Classrooms & Batches)
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            គ្រប់គ្រងថ្នាក់រៀនតាមវេនសិក្សា ជំនាញ បន្ទប់រៀន និងសាស្ត្រាចារ្យប្រចាំថ្នាក់
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ បង្កើតថ្នាក់រៀនថ្មី</span>
        </button>
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes.map((cls) => {
          const studentCount = students.filter((s) => s.classId === cls.id).length;
          return (
            <div
              key={cls.id}
              className="bg-white rounded-3xl p-5 border border-emerald-900/10 shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 text-sm">{cls.name}</h3>
                      <span className="font-mono text-[10.5px] text-zinc-400 font-medium">
                        {cls.classCode} • {cls.academicYear}
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                    {cls.shift === 'morning' && <Sun className="w-3 h-3 text-amber-500" />}
                    {cls.shift === 'afternoon' && <Sunset className="w-3 h-3 text-orange-500" />}
                    {cls.shift === 'evening' && <Moon className="w-3 h-3 text-indigo-500" />}
                    {cls.shift === 'weekend' && <Calendar className="w-3 h-3 text-teal-500" />}
                    <span>{getShiftLabel(cls.shift)}</span>
                  </span>
                </div>

                <div className="space-y-2 text-xs py-3 border-y border-zinc-100">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">ជំនាញ:</span>
                    <span className="font-bold text-zinc-800">{cls.majorName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">កម្រិតឆ្នាំ:</span>
                    <span className="font-semibold text-zinc-800">{cls.year}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">បន្ទប់រៀន:</span>
                    <span className="font-semibold text-zinc-800">{cls.room}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">សាស្ត្រាចារ្យ:</span>
                    <span className="font-semibold text-emerald-800">{cls.teacherName || 'មិនទាន់ចាត់តាំង'}</span>
                  </div>
                </div>
              </div>

              {/* Footer info & Actions */}
              <div className="mt-4 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-semibold">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>{studentCount} នាក់</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(cls)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cls.id, cls.name)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-900/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="font-bold text-zinc-900 text-base">
                {editingClass ? 'កែប្រែថ្នាក់រៀន' : 'បង្កើតថ្នាក់រៀនថ្មី'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">កូដថ្នាក់ (Code) *</label>
                <input
                  type="text"
                  required
                  value={formClassCode}
                  onChange={(e) => setFormClassCode(e.target.value)}
                  placeholder="ED-Y1-M1"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">ឈ្មោះថ្នាក់រៀន *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ថ្នាក់គរុកោសល្យ ឆ្នាំទី១ (ព្រឹក)"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">ជំនាញ (Major)</label>
                  <select
                    value={formMajorId}
                    onChange={(e) => setFormMajorId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-hidden cursor-pointer"
                  >
                    {majors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nameKhmer}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">កម្រិតឆ្នាំ</label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value as AcademicYearType)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-hidden cursor-pointer"
                  >
                    <option value="Year 1">ឆ្នាំទី១ (Year 1)</option>
                    <option value="Year 2">ឆ្នាំទី២ (Year 2)</option>
                    <option value="Year 3">ឆ្នាំទី៣ (Year 3)</option>
                    <option value="Year 4">ឆ្នាំទី៤ (Year 4)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">វេនសិក្សា</label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value as ShiftType)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-hidden cursor-pointer"
                  >
                    <option value="morning">វេនព្រឹក</option>
                    <option value="afternoon">វេនរសៀល</option>
                    <option value="evening">វេនយប់</option>
                    <option value="weekend">ចុងសប្តាហ៍</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">បន្ទប់រៀន (Room)</label>
                  <input
                    type="text"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="បន្ទប់ A101"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">សាស្ត្រាចារ្យទទួលបន្ទុក</label>
                <select
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-hidden cursor-pointer"
                >
                  <option value="">-- មិនទាន់ចាត់តាំង --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nameKhmer} ({t.nameLatin})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={closeModal}
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
