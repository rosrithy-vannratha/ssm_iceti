import React from 'react';
import {
  GraduationCap,
  Users,
  CalendarCheck,
  UserCheck,
  Layers,
  BookOpen,
  BarChart3,
  LogOut,
  LogIn,
  CloudCheck,
  Sparkles,
  Sun,
  Sunset,
  Moon,
  Calendar
} from 'lucide-react';
import { ActiveTab, AppUser } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: AppUser | null;
  onLogin: () => void;
  onLogout: () => void;
  totalStudents: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogin,
  onLogout,
  totalStudents
}) => {
  const tabs = [
    { id: 'dashboard', labelKh: 'ផ្ទាំងគ្រប់គ្រង', labelEn: 'Dashboard', icon: BarChart3 },
    { id: 'students', labelKh: 'និស្សិត', labelEn: 'Students', icon: Users, badge: totalStudents },
    { id: 'attendance', labelKh: 'កត់ត្រាវត្តមាន', labelEn: 'Attendance', icon: CalendarCheck },
    { id: 'teachers', labelKh: 'សាស្ត្រាចារ្យ', labelEn: 'Teachers', icon: UserCheck },
    { id: 'teacher_attendance', labelKh: 'វត្តមានគ្រូ', labelEn: 'Faculty Att.', icon: CalendarCheck },
    { id: 'classes', labelKh: 'ថ្នាក់រៀន', labelEn: 'Classes', icon: Layers },
    { id: 'majors', labelKh: 'ជំនាញ', labelEn: 'Majors', icon: BookOpen },
    { id: 'reports', labelKh: 'របាយការណ៍ & AI', labelEn: 'Reports & AI', icon: Sparkles },
  ];

  return (
    <header className="bg-white border-b border-emerald-900/10 sticky top-0 z-40 shadow-xs">
      {/* Top Banner */}
      <div className="bg-emerald-850 text-white px-4 py-2 border-b border-emerald-700/50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-emerald-300 font-bold border border-white/15 shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white flex items-center gap-2">
                <span>វិទ្យាស្ថានគរុកោសល្យភាសាចិន</span>
                <span className="text-[11px] font-normal text-emerald-200/90 hidden md:inline">| Chinese Pedagogical Institute</span>
              </h1>
              <p className="text-[10.5px] text-emerald-200/80 hidden sm:block">
                ប្រព័ន្ធគ្រប់គ្រងនិស្សិត ថ្នាក់រៀន វេនសិក្សា និងកត់ត្រាវត្តមានឆ្លាតវៃ
              </p>
            </div>
          </div>

          {/* Quick Shift Badges & User Status */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="hidden lg:flex items-center gap-1.5 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-700/40 text-[11px]">
              <span className="text-emerald-300 flex items-center gap-1"><Sun className="w-3 h-3 text-amber-300" /> ព្រឹក</span>
              <span className="text-emerald-500">•</span>
              <span className="text-emerald-300 flex items-center gap-1"><Sunset className="w-3 h-3 text-orange-300" /> រសៀល</span>
              <span className="text-emerald-500">•</span>
              <span className="text-emerald-300 flex items-center gap-1"><Moon className="w-3 h-3 text-indigo-300" /> យប់</span>
              <span className="text-emerald-500">•</span>
              <span className="text-emerald-300 flex items-center gap-1"><Calendar className="w-3 h-3 text-teal-300" /> ចុងសប្តាហ៍</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[11px] bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded-md border border-emerald-700/30">
                <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Cloud Sync</span>
              </div>

              {user ? (
                <div className="flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded-full border border-white/20">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full object-cover border border-white/40"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center">
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-white text-xs font-medium max-w-[100px] truncate hidden md:inline">
                    {user.displayName || user.email}
                  </span>
                  <button
                    onClick={onLogout}
                    title="ចាកចេញ (Sign Out)"
                    className="text-emerald-200 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onLogin}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-emerald-900 font-semibold text-xs hover:bg-emerald-50 transition-all shadow-xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ចូលគណនី (Sign in)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/20'
                    : 'text-zinc-600 hover:text-emerald-800 hover:bg-emerald-50/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                <div className="flex flex-col text-left leading-tight">
                  <span className="font-bold">{tab.labelKh}</span>
                  <span className={`text-[9.5px] font-normal ${isActive ? 'text-emerald-100' : 'text-zinc-400'}`}>
                    {tab.labelEn}
                  </span>
                </div>
                {typeof tab.badge === 'number' && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
