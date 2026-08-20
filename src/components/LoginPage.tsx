import React, { useState } from 'react';
import {
  LogIn,
  Lock,
  User,
  GraduationCap,
  Sparkles,
  AlertCircle,
  Sun,
  Moon,
  BookOpen,
  Users,
  CalendarCheck,
  ArrowRight
} from 'lucide-react';
import { AppUser } from '../types';
import { authService } from '../service/instituteService';

interface LoginPageProps {
  onSuccess: (user: AppUser) => void;
  onContinueAsGuest: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onContinueAsGuest,
  showToast,
  isDarkMode,
  onToggleDarkMode
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('សូមបំពេញឈ្មោះអ្នកប្រើប្រាស់ និងពាក្យសម្ងាត់');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (username.trim() !== 'Admin' || password !== 'admin123') {
        throw new Error('INVALID_CREDENTIALS');
      }

      const user = authService.signInQuick(
        'គណៈគ្រប់គ្រងវិទ្យាស្ថាន (Administrator)',
        'Admin',
        'admin@ici.edu.kh'
      );
      showToast('បានចូលគណនីដោយជោគជ័យ!', 'success');
      onSuccess(user);
    } catch (err: any) {
      console.error('Password Login Error:', err);
      const msg = 'ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ!';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8f6] dark:bg-[#0a110e] text-zinc-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-emerald-600 selection:text-white transition-colors">
      {/* Top Header Bar */}
      <header className="px-4 sm:px-8 py-4 flex items-center justify-between border-b border-emerald-900/10 dark:border-emerald-800/30 bg-white/70 dark:bg-[#0f1b15]/70 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-emerald-200 flex items-center justify-center font-black shadow-md border border-emerald-700/50">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base leading-tight text-emerald-950 dark:text-emerald-300">
              វិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              International Chinese Education & Teachers Institute
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'ប្តូរទៅ Light Mode' : 'ប្តូរទៅ Dark Mode'}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Card - Informational */}
          <div className="lg:col-span-5 space-y-6 hidden lg:block">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>ប្រព័ន្ធគ្រប់គ្រងឌីជីថលជំនាន់ថ្មី</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-emerald-950 dark:text-emerald-200 leading-tight">
                ប្រព័ន្ធគ្រប់គ្រងនិស្សិត និងវត្តមានគរុកោសល្យ
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                គ្រប់គ្រងទិន្នន័យនិស្សិត សាស្ត្រាចារ្យ បន្ទប់រៀន វេនសិក្សា និងការកត់ត្រាវត្តមានប្រចាំថ្ងៃប្រកបដោយប្រសិទ្ធភាព និងសុវត្ថិភាពខ្ពស់។
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-[#122019] border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-200">គ្រប់គ្រងបញ្ជីនិស្សិត និងសាស្ត្រាចារ្យ</h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Import / Export Excel ពេញលេញ</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-[#122019] border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-200">កត់ត្រាវត្តមានឌីជីថលប្រចាំថ្ងៃ</h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">តាមដានអវត្តមាន និងស្ថិតិស្វ័យប្រវត្តិ</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-[#122019] border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-200">គ្រប់គ្រងថ្នាក់ វេន និងឯកទេស</h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">បែងចែកតាមកាលវិភាគច្បាស់លាស់</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Login Box */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-[#121e18] rounded-3xl border border-emerald-900/15 dark:border-emerald-800/40 shadow-xl overflow-hidden">
              {/* Form Header */}
              <div className="bg-gradient-to-r from-emerald-850 to-emerald-900 dark:from-emerald-950 dark:to-[#0f1e17] p-6 text-white text-center border-b border-emerald-700/40">
                <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mx-auto mb-2 text-emerald-300 shadow-sm">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg tracking-wide">
                  ផ្ទាំងចូលប្រើប្រាស់ប្រព័ន្ធ (System Login)
                </h3>
                <p className="text-xs text-emerald-200/90 mt-1">
                  សូមជ្រើសរើសវិធីសាស្ត្រចូលប្រើប្រាស់ខាងក្រោម
                </p>
              </div>

              <div className="border-b border-zinc-100 dark:border-zinc-800 px-6 py-3 bg-zinc-50 dark:bg-[#0d1612] text-center">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 inline-flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  ឈ្មោះអ្នកប្រើប្រាស់ និងពាក្យសម្ងាត់ (Username &amp; Password)
                </span>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <div className="leading-relaxed font-medium">
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* Tab Contents */}
              <div className="p-6">
                {/*
                {false && (
                  <div className="space-y-3">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                      ចុចលើតួនាទីណាមួយខាងក្រោមដើម្បីចូលប្រើប្រព័ន្ធភ្លាមៗដោយពុំចាំបាច់វាយពាក្យសម្ងាត់៖
                    </p>

                    { /* Admin * / }
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickLogin(
                          'Admin',
                          'គណៈគ្រប់គ្រងវិទ្យាស្ថាន (Administrator)',
                          'admin@ici.edu.kh'
                        )
                      }
                      className="w-full p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50 text-left flex items-center justify-between transition-all cursor-pointer group shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-900 dark:group-hover:text-emerald-300">
                            គណៈគ្រប់គ្រង (Director / Admin)
                          </h4>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            សិទ្ធិគ្រប់គ្រងពេញលេញលើទិន្នន័យ និងការបម្រុងទុក (Cloud Backup)
                          </p>
                        </div>
                      </div>
                      <LogIn className="w-4 h-4 text-emerald-700 dark:text-emerald-400 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </button>

                    { /* Teacher / Faculty * / }
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickLogin(
                          'Faculty Teacher',
                          'សាស្ត្រាចារ្យ Long Sokha',
                          'sokha.long@ici.edu.kh'
                        )
                      }
                      className="w-full p-3.5 rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 text-left flex items-center justify-between transition-all cursor-pointer group shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-blue-900 dark:group-hover:text-blue-300">
                            សាស្ត្រាចារ្យ / គ្រូបង្រៀន (Faculty Teacher)
                          </h4>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            កត់ត្រាវត្តមាននិស្សិត គ្រប់គ្រងបន្ទប់រៀន និងបញ្ជីឈ្មោះ
                          </p>
                        </div>
                      </div>
                      <LogIn className="w-4 h-4 text-blue-700 dark:text-blue-400 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </button>

                    { /* Registrar Staff * / }
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickLogin(
                          'Registrar',
                          'មន្ត្រីកត់ត្រាវត្តមាន (Registrar Officer)',
                          'registrar@ici.edu.kh'
                        )
                      }
                      className="w-full p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-900/50 text-left flex items-center justify-between transition-all cursor-pointer group shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-amber-900 dark:group-hover:text-amber-300">
                            មន្ត្រីកត់ត្រា និងវត្តមាន (Registrar Staff)
                          </h4>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            កត់ត្រាវត្តមានគ្រូ-និស្សិត និងតាមដានរបាយការណ៍
                          </p>
                        </div>
                      </div>
                      <LogIn className="w-4 h-4 text-amber-700 dark:text-amber-400 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                )}

                { /* Google login * / }
                {false && (
                  <div className="space-y-4 text-center py-2">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      ចូលប្រើប្រាស់ដោយផ្ទាល់ជាមួយគណនី Google ឬ Gmail ផ្លូវការរបស់អ្នកដើម្បីធ្វើសមកាលកម្មទិន្នន័យលើ Cloud
                    </p>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="w-full py-3.5 px-4 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 font-bold text-xs border border-zinc-300 dark:border-zinc-700 shadow-sm flex items-center justify-center gap-3 transition-all cursor-pointer hover:border-zinc-400 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>{isLoading ? 'កំពុងភ្ជាប់ Google...' : 'បន្តជាមួយ Google (Sign in with Google)'}</span>
                    </button>

                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-3.5 text-left space-y-1">
                      <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                        <span>សុវត្ថិភាពខ្ពស់ និងរហ័ស</span>
                      </p>
                      <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/80 leading-relaxed">
                        ប្រសិនបើ Browser បិទ Popup លើ preview អ្នកអាចប្រើផ្ទាំង <strong>"ចូលរហ័ស (Quick)"</strong> ដើម្បីចូលប្រើភ្លាមៗ។
                      </p>
                    </div>
                  </div>
                )}

                */}

                {/* USERNAME / PASSWORD */}
                {true && (
                  <form onSubmit={handlePasswordLogin} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        ឈ្មោះអ្នកប្រើប្រាស់ (Username) *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          autoComplete="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Admin"
                          className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:bg-white dark:focus:bg-zinc-950 focus:border-emerald-500 outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        ពាក្យសម្ងាត់ (Password) *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          required
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:bg-white dark:focus:bg-zinc-950 focus:border-emerald-500 outline-hidden"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>
                        {isLoading
                          ? 'កំពុងដំណើរការ...'
                          : 'ចូលគណនី (Sign In)'}
                      </span>
                    </button>
                  </form>
                )}

                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl">
                    <div className="text-left">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        <span>ចូលមើលជាភ្ញៀវ (Explore as Guest)</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                          Read-Only
                        </span>
                      </div>
                      <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        ត្រឹមតែពិនិត្យមើលព័ត៌មាន និងរបាយការណ៍ (បិទមុខងារបង្កើត កែ និងលុប)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onContinueAsGuest}
                      className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                    >
                      <span>ចូលទស្សនា (Explore)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-900/10 dark:border-emerald-800/30 py-4 bg-white/70 dark:bg-[#0f1b15]/70 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-emerald-900 dark:text-emerald-300">
            វិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់ &bull; International Chinese Education and Teachers Institute
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            ប្រព័ន្ធគ្រប់គ្រងនិស្សិត ថ្នាក់រៀន វេនសិក្សា និងវត្តមានឌីជីថល &bull; រក្សាសិទ្ធិគ្រប់យ៉ាង ២០២៥-២០២៦
          </p>
        </div>
      </footer>
    </div>
  );
};
