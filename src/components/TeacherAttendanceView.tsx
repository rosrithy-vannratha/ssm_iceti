import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Save,
  UserCheck,
  Search,
  BookOpen,
  Calendar,
  Users
} from 'lucide-react';
import { Teacher, TeacherAttendance, TeacherAttendanceStatus, ShiftType } from '../types';
import { instituteService } from '../service/instituteService';
import { getShiftLabel } from '../utils/exportUtils';

interface TeacherAttendanceViewProps {
  teachers: Teacher[];
  attendance: TeacherAttendance[];
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const TeacherAttendanceView: React.FC<TeacherAttendanceViewProps> = ({
  teachers,
  attendance,
  showToast
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedShift, setSelectedShift] = useState<string>('morning');
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Draft state: teacherId -> { status, note, subject }
  const [draft, setDraft] = useState<
    Record<string, { status: TeacherAttendanceStatus; note: string; subject: string }>
  >({});

  // Active teachers
  const activeTeachers = useMemo(() => {
    return teachers.filter((t) => !t.status || t.status.toLowerCase() === 'active');
  }, [teachers]);

  // Load existing records for this date & shift
  React.useEffect(() => {
    const existing = attendance.filter(
      (a) => a.date === selectedDate && a.shift === selectedShift
    );

    const draftMap: Record<string, { status: TeacherAttendanceStatus; note: string; subject: string }> = {};

    activeTeachers.forEach((t) => {
      const match = existing.find((r) => r.teacherId === t.id);
      if (match) {
        draftMap[t.id] = {
          status: match.status,
          note: match.note || '',
          subject: match.subject || t.subjects || ''
        };
      } else {
        draftMap[t.id] = {
          status: 'present',
          note: '',
          subject: t.subjects || ''
        };
      }
    });

    setDraft(draftMap);
  }, [selectedDate, selectedShift, activeTeachers, attendance]);

  const handleSetStatus = (teacherId: string, status: TeacherAttendanceStatus) => {
    setDraft((prev) => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        status
      }
    }));
  };

  const handleSetNote = (teacherId: string, note: string) => {
    setDraft((prev) => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        note
      }
    }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: TeacherAttendanceStatus; note: string; subject: string }> = {};
    activeTeachers.forEach((t) => {
      updated[t.id] = {
        status: 'present',
        note: draft[t.id]?.note || '',
        subject: draft[t.id]?.subject || t.subjects || ''
      };
    });
    setDraft(updated);
    showToast('បានកំណត់វត្តមានសាស្ត្រាចារ្យទាំងអស់!', 'info');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const records: TeacherAttendance[] = activeTeachers.map((t) => {
        const d = draft[t.id] || { status: 'present', note: '', subject: t.subjects };
        return {
          id: `t_att_${selectedDate}_${selectedShift}_${t.id}`,
          date: selectedDate,
          teacherId: t.id,
          teacherName: t.nameKhmer,
          shift: selectedShift as ShiftType,
          subject: d.subject || t.subjects || 'ភាសាចិន',
          status: d.status,
          note: d.note.trim() || undefined,
          createdAt: new Date().toISOString()
        };
      });

      await instituteService.saveTeacherAttendanceBatch(records);
      showToast('បានរក្សាទុកវត្តមានសាស្ត្រាចារ្យដោយជោគជ័យ!', 'success');
    } catch (e) {
      showToast('បរាជ័យក្នុងការរក្សាទុក', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTeachers = activeTeachers.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (t.nameKhmer || '').toLowerCase().includes(q) ||
      (t.nameLatin || '').toLowerCase().includes(q) ||
      (t.teacherCode || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-900/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              <CalendarCheck className="w-4 h-4 text-emerald-700" />
            </span>
            <h2 className="text-xl font-bold text-zinc-900">
              កត់ត្រាវត្តមានសាស្ត្រាចារ្យ (Faculty Attendance)
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            កត់ត្រាវត្តមាន និងម៉ោងបង្រៀនរបស់គ្រូប្រចាំវេនសិក្សា
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleMarkAllPresent}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>វត្តមានទាំងអស់ (All Present)</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកវត្តមានគ្រូ'}</span>
          </button>
        </div>
      </div>

      {/* Date & Shift Selectors */}
      <div className="bg-white rounded-2xl p-4 border border-emerald-900/10 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              កាលបរិច្ឆេទ (Date)
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-500 outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              វេនបង្រៀន (Teaching Shift)
            </label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-500 outline-hidden cursor-pointer"
            >
              <option value="morning">វេនព្រឹក (Morning)</option>
              <option value="afternoon">វេនរសៀល (Afternoon)</option>
              <option value="evening">វេនយប់ (Evening)</option>
              <option value="weekend">ចុងសប្តាហ៍ (Weekend)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              ស្វែងរកសាស្ត្រាចារ្យ
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ឈ្មោះសាស្ត្រាចារ្យ..."
                className="w-full pl-8 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:bg-white focus:border-emerald-500 outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Teachers Attendance Table */}
      <div className="bg-white rounded-3xl border border-emerald-900/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">ល.រ</th>
                <th className="py-3 px-4">អត្តលេខ</th>
                <th className="py-3 px-4">ឈ្មោះសាស្ត្រាចារ្យ</th>
                <th className="py-3 px-4">មុខវិជ្ជាទទួលបន្ទុក</th>
                <th className="py-3 px-4 text-center">ស្ថានភាពវត្តមាន</th>
                <th className="py-3 px-4">សម្គាល់ / គ្រូបង្រៀនជំនួស</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <UserCheck className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="font-semibold text-zinc-600">ពុំមានទិន្នន័យសាស្ត្រាចារ្យទេ</p>
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t, index) => {
                  const d = draft[t.id] || { status: 'present', note: '', subject: t.subjects };
                  return (
                    <tr key={t.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-zinc-400">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-zinc-700">
                        {t.teacherCode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-900">{t.nameKhmer}</div>
                        <div className="text-[11px] text-zinc-400">{t.nameLatin}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-zinc-700">
                        {t.subjects || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSetStatus(t.id, 'present')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                              d.status === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-zinc-100 text-zinc-600 hover:bg-emerald-50'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>វត្តមាន</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStatus(t.id, 'permission')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                              d.status === 'permission'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-zinc-100 text-zinc-600 hover:bg-amber-50'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>សុំច្បាប់</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStatus(t.id, 'absent')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                              d.status === 'absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-zinc-100 text-zinc-600 hover:bg-rose-50'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>អវត្តមាន</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStatus(t.id, 'substituted')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                              d.status === 'substituted'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-zinc-100 text-zinc-600 hover:bg-blue-50'
                            }`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>ជំនួស</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={d.note}
                          onChange={(e) => handleSetNote(t.id, e.target.value)}
                          placeholder="សម្គាល់ / គ្រូជំនួស..."
                          className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:bg-white focus:border-emerald-500 outline-hidden"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
