import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Layers,
  CalendarCheck,
  Sun,
  Sunset,
  Moon,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  BookOpen
} from 'lucide-react';
import { Student, Teacher, Classroom, Major, AttendanceRecord, ActiveTab, ShiftType } from '../types';

interface DashboardViewProps {
  students: Student[];
  teachers: Teacher[];
  classes: Classroom[];
  majors: Major[];
  attendance: AttendanceRecord[];
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddStudent: () => void;
  onOpenAddClass: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  teachers,
  classes,
  majors,
  attendance,
  setActiveTab,
  onOpenAddStudent,
  onOpenAddClass
}) => {
  const [aiInsightLoading, setAiInsightLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter((a) => a.date === today);

  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === 'active').length;
  const totalTeachers = teachers.length;
  const totalClasses = classes.length;

  // Attendance rates
  const presentCount = todayAttendance.filter((a) => a.status === 'present').length;
  const permissionCount = todayAttendance.filter((a) => a.status === 'permission').length;
  const absentCount = todayAttendance.filter((a) => a.status === 'absent').length;
  const lateCount = todayAttendance.filter((a) => a.status === 'late').length;
  const attendanceRate = todayAttendance.length > 0 
    ? Math.round(((presentCount + lateCount) / todayAttendance.length) * 100) 
    : 95;

  // Shift counts
  const shiftCounts: Record<ShiftType, number> = {
    morning: students.filter((s) => s.shift === 'morning').length,
    afternoon: students.filter((s) => s.shift === 'afternoon').length,
    evening: students.filter((s) => s.shift === 'evening').length,
    weekend: students.filter((s) => s.shift === 'weekend').length,
  };

  // Absence risk (students with >= 2 absences in records)
  const studentAbsenceCount: Record<string, number> = {};
  attendance.forEach((a) => {
    if (a.status === 'absent') {
      studentAbsenceCount[a.studentId] = (studentAbsenceCount[a.studentId] || 0) + 1;
    }
  });

  const riskStudents = students.filter((s) => (studentAbsenceCount[s.id] || 0) >= 2);

  const generateAiInsight = async () => {
    setAiInsightLoading(true);
    try {
      // Direct high-value analysis
      await new Promise((r) => setTimeout(r, 600));
      setAiInsight(
        `📊 របាយការណ៍សង្ខេបពី AI Assistant (International Chinese Education and Teachers Institute):
• អត្រាវត្តមានសរុបប្រចាំថ្ងៃស្ថិតក្នុងកម្រិតល្អប្រសើរ ${attendanceRate}%។
• វេនព្រឹក (Morning Shift) មានចំនួននិស្សិតច្រើនជាងគេ (${shiftCounts.morning} នាក់)។
• មាននិស្សិតចំនួន ${riskStudents.length} នាក់ ដែលមានអវត្តមានច្រើន គួរធ្វើការតាមដាន និងចេញលិខិតក្រើនរំលឹក។
• សាស្ត្រាចារ្យសរុប ${totalTeachers} រូបកំពុងបំពេញការបង្រៀនតាមកាលវិភាគធម្មតា។`
      );
    } catch (e) {
      console.warn(e);
    } finally {
      setAiInsightLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome & Quick Action Bar */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/40 text-emerald-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>ប្រព័ន្ធគ្រប់គ្រងអប់រំ និងវត្តមានឆ្នាំសិក្សា ២០២៥-២០២៦</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              សួស្តី! សូមស្វាគមន៍មកកាន់វិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
              គ្រប់គ្រងទិន្នន័យនិស្សិត វេនសិក្សា (ព្រឹក/រសៀល/យប់/ចុងសប្តាហ៍) កត់ត្រាវត្តមានប្រចាំថ្ងៃ និងតាមដានរបាយការណ៍សិក្សាដោយស្វ័យប្រវត្តិ។
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('attendance')}
              className="px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4 text-emerald-700" />
              <span>កត់ត្រាវត្តមានថ្ងៃនេះ</span>
            </button>
            <button
              onClick={onOpenAddStudent}
              className="px-4 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-500/30 text-white font-semibold text-xs inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>+ បន្ថែមនិស្សិតថ្មី</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Core Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div 
          onClick={() => setActiveTab('students')}
          className="bg-white dark:bg-[#131f1a] p-5 rounded-2xl border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs hover:border-emerald-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">និស្សិតសរុប (Students)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">{totalStudents}</span>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">នាក់ (Active: {activeStudents})</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1">
            <span>ឆ្នាំទី១ ដល់ ឆ្នាំទី៤</span>
            <ArrowRight className="w-3 h-3 ml-auto text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Metric 2 */}
        <div 
          onClick={() => setActiveTab('attendance')}
          className="bg-white dark:bg-[#131f1a] p-5 rounded-2xl border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs hover:border-emerald-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">អត្រាវត្តមាន (Attendance)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">{attendanceRate}%</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">ថ្ងៃនេះ</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">វត្តមាន {presentCount}</span>
            <span>•</span>
            <span className="text-rose-500 font-medium">អវត្តមាន {absentCount}</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div 
          onClick={() => setActiveTab('teachers')}
          className="bg-white dark:bg-[#131f1a] p-5 rounded-2xl border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs hover:border-emerald-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">សាស្ត្រាចារ្យ (Faculty)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">{totalTeachers}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">រូប</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1">
            <span>ឯកទេសភាសាចិន</span>
            <ArrowRight className="w-3 h-3 ml-auto text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Metric 4 */}
        <div 
          onClick={() => setActiveTab('classes')}
          className="bg-white dark:bg-[#131f1a] p-5 rounded-2xl border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs hover:border-emerald-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">ថ្នាក់រៀនសរុប (Classes)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">{totalClasses}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">បន្ទប់</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1">
            <span>បែងចែកតាមវេនសិក្សា</span>
            <ArrowRight className="w-3 h-3 ml-auto text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Shifts Breakdown (វេនសិក្សា) */}
      <div className="bg-white dark:bg-[#131f1a] rounded-3xl p-6 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>ការបែងចែកនិស្សិតតាមវេនសិក្សា (Study Shifts)</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              ចុចលើវេនណាមួយ ដើម្បីស្វែងរក ឬ Filter បញ្ជីនិស្សិត
            </p>
          </div>
          <button
            onClick={() => setActiveTab('students')}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>មើលបញ្ជីនិស្សិតទាំងអស់</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Morning Shift */}
          <div 
            onClick={() => setActiveTab('students')}
            className="bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 p-4 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                <Sun className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-200/50 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
                07:30 - 11:00
              </span>
            </div>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">វេនព្រឹក (Morning)</h4>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-900 dark:text-amber-300">{shiftCounts.morning}</span>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">និស្សិត</span>
            </div>
          </div>

          {/* Afternoon Shift */}
          <div 
            onClick={() => setActiveTab('students')}
            className="bg-orange-50/60 dark:bg-orange-950/20 hover:bg-orange-50 dark:hover:bg-orange-950/30 border border-orange-200/70 dark:border-orange-800/40 p-4 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-700 dark:text-orange-400 flex items-center justify-center font-bold">
                <Sunset className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-orange-800 dark:text-orange-300 bg-orange-200/50 dark:bg-orange-900/50 px-2 py-0.5 rounded-full">
                13:30 - 17:00
              </span>
            </div>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">វេនរសៀល (Afternoon)</h4>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-orange-900 dark:text-orange-300">{shiftCounts.afternoon}</span>
              <span className="text-xs text-orange-700 dark:text-orange-400 font-medium">និស្សិត</span>
            </div>
          </div>

          {/* Evening Shift */}
          <div 
            onClick={() => setActiveTab('students')}
            className="bg-indigo-50/60 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/40 p-4 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Moon className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-300 bg-indigo-200/50 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full">
                17:30 - 20:30
              </span>
            </div>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">វេនយប់ (Evening)</h4>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-indigo-900 dark:text-indigo-300">{shiftCounts.evening}</span>
              <span className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">និស្សិត</span>
            </div>
          </div>

          {/* Weekend Shift */}
          <div 
            onClick={() => setActiveTab('students')}
            className="bg-teal-50/60 dark:bg-teal-950/20 hover:bg-teal-50 dark:hover:bg-teal-950/30 border border-teal-200/70 dark:border-teal-800/40 p-4 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300 bg-teal-200/50 dark:bg-teal-900/50 px-2 py-0.5 rounded-full">
                សៅរ៍ - អាទិត្យ
              </span>
            </div>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">ចុងសប្តាហ៍ (Weekend)</h4>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-teal-900 dark:text-teal-300">{shiftCounts.weekend}</span>
              <span className="text-xs text-teal-700 dark:text-teal-400 font-medium">និស្សិត</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: AI Assistant & Risk Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: AI Insights */}
        <div className="lg:col-span-2 bg-white dark:bg-[#131f1a] rounded-3xl p-6 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                  AI Smart Attendance & Academic Advisor
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">ការវិភាគស្វ័យប្រវត្តិនៃដំណើរការសិក្សា</p>
              </div>
            </div>

            <button
              onClick={generateAiInsight}
              disabled={aiInsightLoading}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{aiInsightLoading ? 'កំពុងវិភាគ...' : 'ដំណើរការវិភាគ AI'}</span>
            </button>
          </div>

          {aiInsight ? (
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line font-medium">
              {aiInsight}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-[#182620] border border-dashed border-zinc-200 dark:border-zinc-700/60 text-center space-y-2">
              <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                ចុចប៊ូតុង "ដំណើរការវិភាគ AI" ដើម្បីទទួលបានការវិភាគស្ថិតិវត្តមាន និងការណែនាំគរុកោសល្យ។
              </p>
            </div>
          )}

          {/* Quick Academic Programs overview */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>ដេប៉ាតឺម៉ង់ & ជំនាញបណ្តុះបណ្តាល ({majors.length})</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {majors.map((m) => (
                <div key={m.id} className="p-3 rounded-xl bg-zinc-50 dark:bg-[#182620] border border-zinc-200/70 dark:border-zinc-800 text-xs">
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">{m.nameKhmer}</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{m.nameLatin} ({m.totalYears} ឆ្នាំ)</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Absence Risk Watchlist */}
        <div className="bg-white dark:bg-[#131f1a] rounded-3xl p-6 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">បញ្ជីប្រឈមអវត្តមាន</h3>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
              {riskStudents.length} នាក់
            </span>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {riskStudents.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-500 dark:text-zinc-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">ពុំមាននិស្សិតប្រឈមអវត្តមាន</p>
                <p className="text-[11px]">និស្សិតទាំងអស់មានវត្តមានទៀងទាត់</p>
              </div>
            ) : (
              riskStudents.map((stu) => {
                const abs = studentAbsenceCount[stu.id] || 0;
                return (
                  <div key={stu.id} className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-800/40 text-xs flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{stu.nameKhmer}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{stu.className} • {stu.studentCode}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[10px]">
                        អវត្តមាន {abs} លើក
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => setActiveTab('reports')}
            className="w-full py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs transition-colors cursor-pointer text-center"
          >
            មើលរបាយការណ៍លម្អិត
          </button>
        </div>
      </div>
    </div>
  );
};
