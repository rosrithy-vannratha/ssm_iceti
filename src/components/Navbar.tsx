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
  Cloud,
  Database,
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
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenBackup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogin,
  onLogout,
  totalStudents,
  isDarkMode,
  onToggleDarkMode,
  onOpenBackup
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
    <header className="bg-white dark:bg-[#101c16] border-b border-emerald-900/10 dark:border-emerald-800/30 sticky top-0 z-40 shadow-xs transition-colors">
      {/* Top Banner */}
      <div className="bg-emerald-850 dark:bg-emerald-950 text-white px-4 py-2 border-b border-emerald-700/50 dark:border-emerald-900/80">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-emerald-300 font-bold border border-white/15 shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white flex items-center gap-2">
                <span>វិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់</span>
                <span className="text-[11px] font-normal text-emerald-200/90 hidden md:inline">| International Chinese Education and Teachers Institute</span>
              </h1>
              <p className="text-[10.5px] text-emerald-200/80 hidden sm:block">
                ប្រព័ន្ធគ្រប់គ្រងនិស្សិត ថ្នាក់រៀន វេនសិក្សា និងកត់ត្រាវត្តមានឆ្លាតវៃ
              </p>
            </div>
          </div>

          {/* Quick Shift Badges & User Status */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="hidden lg:flex items-center gap-1.5 bg-emerald-950/60 dark:bg-black/40 px-2.5 py-1 rounded-full border border-emerald-700/40 text-[11px]">
              <span className="text-emerald-300 flex items-center gap-1"><Sun className="w-3 h-3 text-amber-300" /> ព្រឹក</span>
              <span className="text-emerald-500">•</span>
              <span className="text-emerald-300 flex items-center gap-1"><Sunset className="w-3 h-3 text-orange-300" /> រសៀល</span>
              <span className="text-emerald-500">•</span>
              <span className="text-emerald-300 flex items-center gap-1"><Moon className="w-3 h-3 text-indigo-300" /> យប់</span>
              <span className="text-emerald-500">•</span>
              <span className="text-emerald-300 flex items-center gap-1"><Calendar className="w-3 h-3 text-teal-300" /> ចុងសប្តាហ៍</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Cloud Backup Hub Button */}
              <button
                type="button"
                onClick={onOpenBackup}
                title="មជ្ឈមណ្ឌល Backup & Cloud Sync"
                className="flex items-center gap-1 text-[11px] font-bold bg-emerald-900/80 dark:bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 hover:text-white px-2.5 py-1 rounded-full border border-emerald-700/30 transition-all cursor-pointer shadow-xs"
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cloud & Backup</span>
              </button>

              {/* Dark / Light Mode Toggle */}
              <button
                type="button"
                onClick={onToggleDarkMode}
                title={isDarkMode ? 'ប្តូរទៅ Normal Mode (Light)' : 'ប្តូរទៅ Dark Mode'}
                className="w-7 h-7 rounded-full bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 hover:text-amber-300 flex items-center justify-center border border-emerald-700/30 transition-all cursor-pointer"
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-emerald-300" />}
              </button>

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
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-emerald-50 text-emerald-900 font-semibold text-xs hover:bg-emerald-50 dark:hover:bg-white transition-all shadow-xs cursor-pointer"
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
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-emerald-800 dark:hover:text-white hover:bg-emerald-50/70 dark:hover:bg-[#182a21]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}`} />
                <div className="flex flex-col text-left leading-tight">
                  <span className="font-bold">{tab.labelKh}</span>
                  <span className={`text-[9.5px] font-normal ${isActive ? 'text-emerald-100' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    {tab.labelEn}
                  </span>
                </div>
                {typeof tab.badge === 'number' && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-white text-emerald-800'
                        : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
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
