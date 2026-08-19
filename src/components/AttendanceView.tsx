import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileSpreadsheet,
  Save,
  Sun,
  Sunset,
  Moon,
  Users,
  Search,
  Filter,
  Check
} from 'lucide-react';
import { Student, Classroom, AttendanceRecord, AttendanceStatus, ShiftType } from '../types';
import { instituteService } from '../service/instituteService';
import { exportAttendanceToExcel, getShiftLabel, getAttendanceLabel } from '../utils/exportUtils';

interface AttendanceViewProps {
  students: Student[];
  classes: Classroom[];
  attendance: AttendanceRecord[];
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  classes,
  attendance,
  showToast
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes[0]?.id || ''
  );
  const [search, setSearch] = useState('');

  // Local editing state for attendance on this date & class
  // key: studentId -> { status: AttendanceStatus, note?: string }
  const [attendanceDraft, setAttendanceDraft] = useState<
    Record<string, { status: AttendanceStatus; note: string }>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  // Students belonging to selected class
  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter((s) => s.classId === selectedClassId && s.status === 'active');
  }, [students, selectedClassId]);

  // Load existing attendance records for the selectedDate & selectedClassId
  React.useEffect(() => {
    if (!selectedClassId) return;

    const existingForDay = attendance.filter(
      (a) => a.date === selectedDate && a.classId === selectedClassId
    );

    const draftMap: Record<string, { status: AttendanceStatus; note: string }> = {};

    classStudents.forEach((stu) => {
      const match = existingForDay.find((r) => r.studentId === stu.id);
      if (match) {
        draftMap[stu.id] = {
          status: match.status,
          note: match.note || ''
        };
      } else {
        // Default to present if not marked yet
        draftMap[stu.id] = {
          status: 'present',
          note: ''
        };
      }
    });

    setAttendanceDraft(draftMap);
  }, [selectedDate, selectedClassId, classStudents, attendance]);

  // Update single student attendance status
  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceDraft((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  // Update note
  const handleSetNote = (studentId: string, note: string) => {
    setAttendanceDraft((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note
      }
    }));
  };

  // Mark all students as present
  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; note: string }> = {};
    classStudents.forEach((stu) => {
      updated[stu.id] = {
        status: 'present',
        note: attendanceDraft[stu.id]?.note || ''
      };
    });
    setAttendanceDraft(updated);
    showToast('បានកំណត់វត្តមាន (Present) សម្រាប់និស្សិតទាំងអស់!', 'info');
  };

  // Save attendance batch to Firestore / service
  const handleSaveAttendance = async () => {
    if (!selectedClass) return;
    setIsSaving(true);

    try {
      const recordsToSave: AttendanceRecord[] = classStudents.map((stu) => {
        const draft = attendanceDraft[stu.id] || { status: 'present', note: '' };
        return {
          id: `att_${selectedDate}_${selectedClass.id}_${stu.id}`,
          date: selectedDate,
          classId: selectedClass.id,
          shift: selectedClass.shift,
          studentId: stu.id,
          studentName: stu.nameKhmer,
          status: draft.status,
          note: draft.note.trim() || undefined,
          createdAt: new Date().toISOString()
        };
      });

      await instituteService.saveAttendanceBatch(recordsToSave);
      showToast('បានរក្សាទុកវត្តមានប្រចាំថ្ងៃដោយជោគជ័យ!', 'success');
    } catch (e) {
      console.error(e);
      showToast('បរាជ័យក្នុងការរក្សាទុកវត្តមាន', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Export today's attendance
  const handleExportAttendance = () => {
    if (!selectedClass) return;
    const currentRecords: AttendanceRecord[] = classStudents.map((stu) => {
      const draft = attendanceDraft[stu.id] || { status: 'present', note: '' };
      return {
        id: `att_${selectedDate}_${selectedClass.id}_${stu.id}`,
        date: selectedDate,
        classId: selectedClass.id,
        shift: selectedClass.shift,
        studentId: stu.id,
        studentName: stu.nameKhmer,
        status: draft.status,
        note: draft.note.trim() || undefined,
        createdAt: new Date().toISOString()
      };
    });
    exportAttendanceToExcel(currentRecords, selectedClass.name, selectedDate);
  };

  // Filtered by local search query
  const filteredClassStudents = useMemo(() => {
    if (!search.trim()) return classStudents;
    const q = search.toLowerCase();
    return classStudents.filter(
      (s) =>
        (s.nameKhmer || '').toLowerCase().includes(q) ||
        (s.studentCode || '').toLowerCase().includes(q) ||
        (s.nameLatin || '').toLowerCase().includes(q)
    );
  }, [classStudents, search]);

  // Daily statistics for current class
  const presentCount = Object.values(attendanceDraft).filter((v) => v.status === 'present').length;
  const permissionCount = Object.values(attendanceDraft).filter((v) => v.status === 'permission').length;
  const absentCount = Object.values(attendanceDraft).filter((v) => v.status === 'absent').length;
  const lateCount = Object.values(attendanceDraft).filter((v) => v.status === 'late').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#131f1a] rounded-3xl p-6 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
              <CalendarCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </span>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              កត់ត្រាវត្តមាននិស្សិត (Attendance Workspace)
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            កត់ត្រាវត្តមានប្រចាំថ្ងៃ និងតាមដានច្បាប់ឈប់របស់និស្សិតតាមថ្នាក់ និងវេនសិក្សា
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleMarkAllPresent}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>វត្តមានទាំងអស់ (All Present)</span>
          </button>

          <button
            onClick={handleExportAttendance}
            className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកវត្តមាន'}</span>
          </button>
        </div>
      </div>

      {/* Select Class & Date Controls */}
      <div className="bg-white dark:bg-[#131f1a] rounded-2xl p-4 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Class Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              ជ្រើសរើសថ្នាក់រៀន (Classroom)
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-800 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id} className="dark:bg-[#131f1a]">
                  {c.name} ({getShiftLabel(c.shift)}) - {c.room}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              កាលបរិច្ឆេទ (Attendance Date)
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-800 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-mono"
            />
          </div>

          {/* Local Search */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              ស្វែងរកឈ្មោះនិស្សិតក្នុងថ្នាក់
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ឈ្មោះ ឬ អត្តលេខ..."
                className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Selected Class info badge & Stat counters */}
        {selectedClass && (
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-800 dark:text-zinc-100">{selectedClass.name}</span>
              <span className="text-zinc-400">•</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{selectedClass.majorName}</span>
              <span className="text-zinc-400">•</span>
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">{selectedClass.room}</span>
            </div>

            {/* Quick Stat Pills */}
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                វត្តមាន (P): {presentCount}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                សុំច្បាប់ (E): {permissionCount}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-bold text-[11px]">
                អវត្តមាន (A): {absentCount}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-bold text-[11px]">
                មកយឺត (L): {lateCount}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Attendance Table */}
      <div className="bg-white dark:bg-[#131f1a] rounded-3xl border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-[#182620] border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">ល.រ</th>
                <th className="py-3 px-4">អត្តលេខ</th>
                <th className="py-3 px-4">ឈ្មោះនិស្សិត (Khmer / Latin)</th>
                <th className="py-3 px-4 text-center">ស្ថានភាពវត្តមាន (Status)</th>
                <th className="py-3 px-4">កំណត់ចំណាំ / មូលហេតុសុំច្បាប់ (Notes)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredClassStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400">
                    <Users className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                    <p className="font-semibold text-zinc-600 dark:text-zinc-300">ពុំមាននិស្សិតក្នុងថ្នាក់នេះទេ</p>
                    <p className="text-[11px]">សូមជ្រើសរើសថ្នាក់រៀនផ្សេង ឬបញ្ចូលនិស្សិតថ្មីទៅក្នុងថ្នាក់នេះ</p>
                  </td>
                </tr>
              ) : (
                filteredClassStudents.map((stu, index) => {
                  const draft = attendanceDraft[stu.id] || { status: 'present', note: '' };
                  return (
                    <tr key={stu.id} className="hover:bg-zinc-50/80 dark:hover:bg-[#182620]/60 transition-colors">
                      {/* Index */}
                      <td className="py-3 px-4 text-center font-bold text-zinc-400">
                        {index + 1}
                      </td>

                      {/* Student Code */}
                      <td className="py-3 px-4 font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                        {stu.studentCode}
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">{stu.nameKhmer}</div>
                        <div className="text-[11px] text-zinc-400 font-medium">
                          {stu.nameLatin} {stu.nameChinese && `• ${stu.nameChinese}`}
                        </div>
                      </td>

                      {/* Attendance Toggle Buttons */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Present Button */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(stu.id, 'present')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                              draft.status === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>វត្តមាន</span>
                          </button>

                          {/* Permission Button */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(stu.id, 'permission')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                              draft.status === 'permission'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-700 dark:hover:text-amber-300'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>សុំច្បាប់</span>
                          </button>

                          {/* Absent Button */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(stu.id, 'absent')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                              draft.status === 'absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-300'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>អវត្តមាន</span>
                          </button>

                          {/* Late Button */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(stu.id, 'late')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                              draft.status === 'late'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-300'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>យឺត</span>
                          </button>
                        </div>
                      </td>

                      {/* Note Input */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={draft.note}
                          onChange={(e) => handleSetNote(stu.id, e.target.value)}
                          placeholder="មូលហេតុ (ឧ. មានធុរៈគ្រួសារ, ឈឺ...)"
                          className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-xs text-zinc-800 dark:text-zinc-200 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden"
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
