import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { StudentsView } from './components/StudentsView';
import { AttendanceView } from './components/AttendanceView';
import { TeachersView } from './components/TeachersView';
import { TeacherAttendanceView } from './components/TeacherAttendanceView';
import { ClassesView } from './components/ClassesView';
import { MajorsView } from './components/MajorsView';
import { ReportsView } from './components/ReportsView';
import { LoginModal } from './components/LoginModal';
import { LoginPage } from './components/LoginPage';
import { BackupModal } from './components/BackupModal';
import { instituteService, authService } from './service/instituteService';
import {
  Student,
  Teacher,
  Classroom,
  Major,
  AttendanceRecord,
  TeacherAttendance,
  AppUser,
  ActiveTab
} from './types';
import { CheckCircle2, AlertCircle, Sparkles, GraduationCap } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cpi_theme_mode');
      if (saved !== null) return saved === 'dark';
    } catch (e) {
      console.warn(e);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('cpi_theme_mode', 'dark');
      } catch (e) {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('cpi_theme_mode', 'light');
      } catch (e) {}
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Core Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendance[]>([]);

  // Modals triggered from quick action buttons
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((current) => (current?.text === text ? null : current));
    }, 3200);
  };

  // 1. Initial auth state listener & seed check
  useEffect(() => {
    const unsubAuth = authService.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });

    instituteService.seedInitialDataIfEmpty();

    return () => unsubAuth();
  }, []);

  // 2. Real-time subscriptions to Firestore collections
  useEffect(() => {
    const unsubStudents = instituteService.subscribeStudents((data) => setStudents(data));
    const unsubTeachers = instituteService.subscribeTeachers((data) => setTeachers(data));
    const unsubClasses = instituteService.subscribeClasses((data) => setClasses(data));
    const unsubMajors = instituteService.subscribeMajors((data) => setMajors(data));
    const unsubAttendance = instituteService.subscribeAttendance((data) => setAttendance(data));
    const unsubTeacherAtt = instituteService.subscribeTeacherAttendance((data) => setTeacherAttendance(data));

    return () => {
      unsubStudents();
      unsubTeachers();
      unsubClasses();
      unsubMajors();
      unsubAttendance();
      unsubTeacherAtt();
    };
  }, []);

  const handleOpenLogin = () => {
    setIsLoginModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      showToast('បានចាកចេញពីគណនីដោយជោគជ័យ', 'info');
    } catch (e) {
      console.error(e);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#f8faf8] dark:bg-[#0c1410] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-md animate-pulse">
            <GraduationCap className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">កំពុងតភ្ជាប់វិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់...</p>
        </div>
      </div>
    );
  }

  // FIRST PAGE IS LOGIN FORM IF NOT AUTHENTICATED
  if (!user) {
    return (
      <>
        <LoginPage
          onSuccess={(loggedUser) => {
            setUser(loggedUser);
          }}
          onContinueAsGuest={() => {
            setUser({
              uid: 'guest-' + Date.now(),
              displayName: 'ភ្ញៀវ (Guest)',
              email: 'guest@ici.edu.kh',
              photoURL: null,
              role: 'Guest',
              isAnonymous: true,
            });
            showToast('បានចូលមើលជាភ្ញៀវ (Guest Explorer Mode)', 'info');
          }}
          showToast={showToast}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        {/* Toast Alert */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 backdrop-blur-md ${
                toastMessage.type === 'error'
                  ? 'bg-rose-900/90 text-white border-rose-700'
                  : toastMessage.type === 'info'
                  ? 'bg-zinc-900/90 text-white border-zinc-700'
                  : 'bg-emerald-900/90 text-white border-emerald-700'
              }`}
            >
              {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
              {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-300" />}
              <span>{toastMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  const isReadOnly = user?.isAnonymous || false;

  return (
    <div className="min-h-screen bg-[#f7faf8] dark:bg-[#0c1410] text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-emerald-600 selection:text-white font-sans antialiased transition-colors">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogin={handleOpenLogin}
        onLogout={handleLogout}
        totalStudents={students.length}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenBackup={() => setIsBackupModalOpen(true)}
      />

      {/* Main App Content Router */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            students={students}
            teachers={teachers}
            classes={classes}
            majors={majors}
            attendance={attendance}
            setActiveTab={setActiveTab}
            isReadOnly={isReadOnly}
            onOpenAddStudent={() => {
              if (isReadOnly) {
                showToast('គណនីភ្ញៀវមិនអាចបន្ថែមទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
                return;
              }
              setActiveTab('students');
              setIsAddStudentOpen(true);
            }}
            onOpenAddClass={() => {
              if (isReadOnly) {
                showToast('គណនីភ្ញៀវមិនអាចបន្ថែមទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
                return;
              }
              setActiveTab('classes');
              setIsAddClassOpen(true);
            }}
          />
        )}

        {activeTab === 'students' && (
          <StudentsView
            students={students}
            classes={classes}
            majors={majors}
            isAddModalOpen={isAddStudentOpen}
            onCloseAddModal={() => setIsAddStudentOpen(false)}
            showToast={showToast}
            isReadOnly={isReadOnly}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceView
            students={students}
            classes={classes}
            attendance={attendance}
            showToast={showToast}
            isReadOnly={isReadOnly}
          />
        )}

        {activeTab === 'teachers' && (
          <TeachersView
            teachers={teachers}
            showToast={showToast}
            isReadOnly={isReadOnly}
          />
        )}

        {activeTab === 'teacher_attendance' && (
          <TeacherAttendanceView
            teachers={teachers}
            attendance={teacherAttendance}
            showToast={showToast}
            isReadOnly={isReadOnly}
          />
        )}

        {activeTab === 'classes' && (
          <ClassesView
            classes={classes}
            majors={majors}
            teachers={teachers}
            students={students}
            isAddModalOpen={isAddClassOpen}
            onCloseAddModal={() => setIsAddClassOpen(false)}
            showToast={showToast}
            isReadOnly={isReadOnly}
          />
        )}

        {activeTab === 'majors' && (
          <MajorsView
            majors={majors}
            classes={classes}
            students={students}
            showToast={showToast}
            isReadOnly={isReadOnly}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            students={students}
            teachers={teachers}
            classes={classes}
            majors={majors}
            attendance={attendance}
            showToast={showToast}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-900/10 dark:border-emerald-800/30 py-6 bg-white dark:bg-[#101c16] text-center text-xs text-zinc-500 dark:text-zinc-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-900 dark:text-emerald-300">វិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់</span>
            <span className="text-zinc-400 dark:text-zinc-500">&bull; International Chinese Education and Teachers Institute</span>
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            ប្រព័ន្ធគ្រប់គ្រងនិស្សិត ថ្នាក់រៀន វេនសិក្សា និងវត្តមានឌីជីថល &bull; រក្សាសិទ្ធិគ្រប់យ៉ាង ២០២៥-២០២៦
          </p>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          showToast(`សូមស្វាគមន៍, ${loggedUser.displayName || 'លោកគ្រូ/អ្នកគ្រូ'}!`, 'success');
        }}
        showToast={showToast}
      />

      {/* Backup & Cloud Sync Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        user={user}
        showToast={showToast}
        isReadOnly={isReadOnly}
        onRefreshData={() => {
          // Re-subscribe or state will automatically update from snapshot
        }}
      />

      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 backdrop-blur-md ${
              toastMessage.type === 'error'
                ? 'bg-rose-900/90 text-white border-rose-700'
                : toastMessage.type === 'info'
                ? 'bg-zinc-900/90 text-white border-zinc-700'
                : 'bg-emerald-900/90 text-white border-emerald-700'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-300" />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
