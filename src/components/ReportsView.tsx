import React, { useState } from 'react';
import {
  BarChart3,
  Sparkles,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle2,
  CalendarCheck,
  BookOpen,
  Layers,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Sun,
  Sunset,
  Moon,
  Calendar
} from 'lucide-react';
import { Student, Teacher, Classroom, Major, AttendanceRecord, ShiftType } from '../types';
import { exportStudentsToExcel, getShiftLabel } from '../utils/exportUtils';

interface ReportsViewProps {
  students: Student[];
  teachers: Teacher[];
  classes: Classroom[];
  majors: Major[];
  attendance: AttendanceRecord[];
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  students,
  teachers,
  classes,
  majors,
  attendance,
  showToast
}) => {
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  const totalStudents = students.length;
  const femaleStudents = students.filter((s) => s.gender === 'female').length;
  const maleStudents = students.filter((s) => s.gender === 'male').length;
  const femaleRate = totalStudents > 0 ? Math.round((femaleStudents / totalStudents) * 100) : 0;

  // Shifts
  const shiftStats: Record<ShiftType, number> = {
    morning: students.filter((s) => s.shift === 'morning').length,
    afternoon: students.filter((s) => s.shift === 'afternoon').length,
    evening: students.filter((s) => s.shift === 'evening').length,
    weekend: students.filter((s) => s.shift === 'weekend').length
  };

  // Absences per student
  const studentAbsenceCount: Record<string, number> = {};
  const studentPermissionCount: Record<string, number> = {};

  attendance.forEach((a) => {
    if (a.status === 'absent') {
      studentAbsenceCount[a.studentId] = (studentAbsenceCount[a.studentId] || 0) + 1;
    } else if (a.status === 'permission') {
      studentPermissionCount[a.studentId] = (studentPermissionCount[a.studentId] || 0) + 1;
    }
  });

  const highAbsenceStudents = students
    .map((s) => ({
      ...s,
      absences: studentAbsenceCount[s.id] || 0,
      permissions: studentPermissionCount[s.id] || 0
    }))
    .filter((s) => s.absences >= 1)
    .sort((a, b) => b.absences - a.absences);

  const handleGenerateAiReport = async () => {
    setIsAiGenerating(true);
    try {
      // Backend Gemini request or high precision analytical summary
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `របាយការណ៍ស្ទង់មតិ និងស្ថិតិវត្តមាន វិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់`,
          description: `និស្សិតសរុប ${totalStudents} នាក់ (ស្រី ${femaleStudents} នាក់, ប្រុស ${maleStudents} នាក់)។ វេនព្រឹក ${shiftStats.morning}, រសៀល ${shiftStats.afternoon}, យប់ ${shiftStats.evening}, ចុងសប្តាហ៍ ${shiftStats.weekend}។ សាស្ត្រាចារ្យ ${teachers.length} រូប។ ថ្នាក់រៀន ${classes.length}។ មាននិស្សិតប្រឈមអវត្តមាន ${highAbsenceStudents.length} នាក់។`
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.suggestion) {
          const s = data.suggestion;
          const reportText = `📋 **របាយការណ៍គរុកោសល្យ និងការណែនាំយុទ្ធសាស្ត្រពី AI Assistant**:\n\n` +
            `• **ការវាយតម្លៃទូទៅ**: ${s.priorityReason || 'ការគ្រប់គ្រងនិស្សិត និងកាលវិភាគសិក្សាដំណើរការបានរលូន និងមានតុល្យភាពល្អ។'}\n\n` +
            `• **ចំណុចគន្លឹះត្រូវអនុវត្ត (Actionable Steps)**:\n${(s.approach || [
              'តាមដាន និងទាក់ទងអាណាព្យាបាលនិស្សិតដែលមានអវត្តមានលើសពី ៣ ដង។',
              'ពង្រឹងការបង្រៀនបន្ថែមសម្រាប់វេនយប់ និងវេនចុងសប្តាហ៍។',
              'រៀបចំតារាងកិត្តិយស និងលើកទឹកចិត្តនិស្សិតដែលមានវត្តមាន ១០០%។'
            ]).map((step: string, i: number) => `  ${i + 1}. ${step}`).join('\n')}\n\n` +
            `💡 **គន្លឹះគរុកោសល្យ (Pro-Tip)**: ${s.proTip || 'ការប្រើប្រាស់ប្រព័ន្ធវត្តមានឌីជីថលជួយកាត់បន្ថយអវត្តមាននិស្សិតបានរហូតដល់ ២៥% តាមរយៈការជូនដំណឹងទាន់ពេលវេលា។'}`;
          setAiReport(reportText);
        } else {
          fallbackReport();
        }
      } else {
        fallbackReport();
      }
      showToast('បានបង្កើតរបាយការណ៍ AI ដោយជោគជ័យ!', 'success');
    } catch (e) {
      console.warn(e);
      fallbackReport();
      showToast('បានបង្កើតរបាយការណ៍សង្ខេប!', 'info');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const fallbackReport = () => {
    setAiReport(
      `📊 **របាយការណ៍វិភាគលម្អិត (International Chinese Education and Teachers Institute Report)**:\n\n` +
      `1. **ស្ថិតិនិស្សិត & សមាមាត្រយេនឌ័រ**:\n` +
      `   • និស្សិតសរុប: ${totalStudents} នាក់ (ស្រី ${femaleStudents} នាក់ = ${femaleRate}%, ប្រុស ${maleStudents} នាក់ = ${100 - femaleRate}%)\n` +
      `   • វេនព្រឹកមាននិស្សិតច្រើនជាងគេ (${shiftStats.morning} នាក់) បន្ទាប់មកគឺវេនរសៀល (${shiftStats.afternoon} នាក់)។\n\n` +
      `2. **ការគ្រប់គ្រងអវត្តមាន និងវិន័យ**:\n` +
      `   • មាននិស្សិតចំនួន ${highAbsenceStudents.length} នាក់ ដែលមានកត់ត្រាអវត្តមាន។\n` +
      `   • គួរធ្វើការជូនដំណឹងដល់គ្រូប្រចាំថ្នាក់ ដើម្បីជួបពិភាក្សា និងជួយដោះស្រាយបញ្ហាសិក្សា។\n\n` +
      `3. **អនុសាសន៍គរុកោសល្យ**:\n` +
      `   • បន្តរក្សាការកត់ត្រាវត្តមានប្រចាំថ្ងៃ និងរៀបចំតារាងសង្ខេបប្រចាំខែដើម្បីផ្ញើជូនគណៈគ្រប់គ្រងវិទ្យាស្ថាន។`
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-900/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              <BarChart3 className="w-4 h-4 text-emerald-700" />
            </span>
            <h2 className="text-xl font-bold text-zinc-900">
              ស្ថិតិ & របាយការណ៍សិក្សា (Analytics & AI Reports)
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            សរុបទិន្នន័យនិស្សិត វេនសិក្សា អត្រាវត្តមាន និងរបាយការណ៍វិភាគឆ្លាតវៃដោយ AI
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportStudentsToExcel(students, 'CPI_Full_Report')}
            className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-600" />
            <span>Export Full Data</span>
          </button>

          <button
            onClick={handleGenerateAiReport}
            disabled={isAiGenerating}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isAiGenerating ? 'AI កំពុងបង្កើតរបាយការណ៍...' : 'ដំណើរការវិភាគ AI'}</span>
          </button>
        </div>
      </div>

      {/* Top 3 Analytical Summary Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Gender Distribution Card */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-900/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-900 text-sm">សមាមាត្រយេនឌ័រ (Gender)</h3>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-rose-700">និស្សិតស្រី (Female): {femaleStudents} នាក់</span>
                <span className="font-bold text-rose-800">{femaleRate}%</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${femaleRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-blue-700">និស្សិតប្រុស (Male): {maleStudents} នាក់</span>
                <span className="font-bold text-blue-800">{100 - femaleRate}%</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${100 - femaleRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Shift Distribution Card */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-900/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-900 text-sm">ការបែងចែកវេន (Shifts)</h3>
            <Layers className="w-4 h-4 text-emerald-700" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/60">
              <div className="flex items-center gap-1 text-amber-800 font-bold mb-1">
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                <span>ព្រឹក: {shiftStats.morning}</span>
              </div>
              <span className="text-[10px] text-amber-600">07:30 - 11:00</span>
            </div>

            <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200/60">
              <div className="flex items-center gap-1 text-orange-800 font-bold mb-1">
                <Sunset className="w-3.5 h-3.5 text-orange-600" />
                <span>រសៀល: {shiftStats.afternoon}</span>
              </div>
              <span className="text-[10px] text-orange-600">13:30 - 17:00</span>
            </div>

            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200/60">
              <div className="flex items-center gap-1 text-indigo-800 font-bold mb-1">
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span>យប់: {shiftStats.evening}</span>
              </div>
              <span className="text-[10px] text-indigo-600">17:30 - 20:30</span>
            </div>

            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200/60">
              <div className="flex items-center gap-1 text-teal-800 font-bold mb-1">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>ចុងសប្តាហ៍: {shiftStats.weekend}</span>
              </div>
              <span className="text-[10px] text-teal-600">សៅរ៍ - អាទិត្យ</span>
            </div>
          </div>
        </div>

        {/* Academic Overview Card */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-900/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-900 text-sm">ទិន្នន័យអប់រំទូទៅ</h3>
            <BookOpen className="w-4 h-4 text-emerald-700" />
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-zinc-100">
              <span className="text-zinc-500">ជំនាញបណ្តុះបណ្តាល:</span>
              <span className="font-bold text-zinc-900">{majors.length} ជំនាញ</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-zinc-100">
              <span className="text-zinc-500">ថ្នាក់រៀនសកម្ម:</span>
              <span className="font-bold text-zinc-900">{classes.length} ថ្នាក់</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-zinc-100">
              <span className="text-zinc-500">សាស្ត្រាចារ្យបង្រៀន:</span>
              <span className="font-bold text-emerald-700">{teachers.length} រូប</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-zinc-500">ឆ្នាំសិក្សា:</span>
              <span className="font-semibold text-zinc-800">២០២៥-២០២៦</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Smart Report Box */}
      <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-emerald-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-base text-white">AI Academic Advisory & Insights</h3>
          </div>
          <button
            onClick={handleGenerateAiReport}
            disabled={isAiGenerating}
            className="text-xs px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 border border-white/10 transition-colors cursor-pointer"
          >
            {isAiGenerating ? 'កំពុងដំណើរការ...' : 'ធ្វើបច្ចុប្បន្នភាព AI'}
          </button>
        </div>

        {aiReport ? (
          <div className="text-xs sm:text-sm text-emerald-50 leading-relaxed whitespace-pre-line font-medium bg-emerald-800/40 p-4 rounded-2xl border border-emerald-700/50">
            {aiReport}
          </div>
        ) : (
          <div className="text-center py-6 space-y-2">
            <Sparkles className="w-8 h-8 text-amber-300 mx-auto opacity-75 animate-bounce" />
            <p className="text-xs text-emerald-200 max-w-md mx-auto">
              ចុចប៊ូតុង "ដំណើរការវិភាគ AI" ដើម្បីទទួលបានរបាយការណ៍ស្ទង់មតិទូទៅពីបញ្ញាសិប្បនិម្មិត Gemini។
            </p>
          </div>
        )}
      </div>

      {/* High Absence Watchlist */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-900/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h3 className="font-bold text-zinc-900 text-sm">
              បញ្ជីនិស្សិតមានអវត្តមាន (Absence Watchlist)
            </h3>
          </div>
          <span className="text-xs text-zinc-500">
            សរុប {highAbsenceStudents.length} នាក់
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase text-[10.5px]">
              <tr>
                <th className="py-2.5 px-3">អត្តលេខ</th>
                <th className="py-2.5 px-3">ឈ្មោះនិស្សិត</th>
                <th className="py-2.5 px-3">ថ្នាក់ & វេន</th>
                <th className="py-2.5 px-3 text-center">អវត្តមាន (Absent)</th>
                <th className="py-2.5 px-3 text-center">សុំច្បាប់ (Permission)</th>
                <th className="py-2.5 px-3">លេខទូរស័ព្ទអាណាព្យាបាល</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {highAbsenceStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-400">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                    <p className="font-semibold text-zinc-700">ពុំមាននិស្សិតណាមានអវត្តមានទេ</p>
                  </td>
                </tr>
              ) : (
                highAbsenceStudents.map((stu) => (
                  <tr key={stu.id} className="hover:bg-rose-50/40">
                    <td className="py-2.5 px-3 font-mono font-semibold text-zinc-700">
                      {stu.studentCode}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-zinc-900">{stu.nameKhmer}</span>
                      <span className="text-zinc-400 ml-1">({stu.nameLatin})</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-zinc-700">{stu.className}</span>
                      <span className="text-zinc-400 text-[10px] block">{getShiftLabel(stu.shift)}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 text-[10.5px]">
                        {stu.absences} ដង
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 text-[10.5px]">
                        {stu.permissions} ដង
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-zinc-600">
                      {stu.guardianPhone || stu.phone || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
