import React, { useState } from 'react';
import {
  X,
  LogIn,
  Mail,
  Lock,
  User,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { AppUser } from '../types';
import { authService } from '../service/instituteService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AppUser) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<'google' | 'email' | 'quick'>('google');
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await authService.signInWithGoogle();
      onSuccess(user);
      onClose();
    } catch (err: any) {
      console.error('Google Sign-in Error:', err);
      let msg = 'មិនអាចចូលគណនីជាមួយ Google បានទេ';
      if (err.code === 'auth/popup-blocked') {
        msg = 'Browser បានបិទផ្ទាំង Popup (Popup Blocked)។ សូមអនុញ្ញាត Popups សម្រាប់គេហទំព័រនេះ ឬប្រើការចូលរហ័ស (Quick Login)។';
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = 'Domain នេះមិនទាន់ត្រូវបានបញ្ចូលក្នុង Firebase Authorized Domains ទេ។ សូមប្រើ Quick Access ឬ Email Login។';
      } else if (err.code === 'auth/popup-closed-by-user') {
        msg = 'ផ្ទាំងចូលគណនីត្រូវបានបិទមុនពេលបញ្ចប់។';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('សូមបំពេញអ៊ីមែល និងពាក្យសម្ងាត់');
      return;
    }
    if (isRegister && !displayName.trim()) {
      setErrorMessage('សូមបញ្ចូលឈ្មោះពេញរបស់អ្នក');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      let user: AppUser;
      if (isRegister) {
        user = await authService.signUpWithEmail(email.trim(), password, displayName.trim());
        showToast('បានបង្កើតគណនី និងចូលដោយជោគជ័យ!', 'success');
      } else {
        user = await authService.signInWithEmail(email.trim(), password);
        showToast('បានចូលគណនីដោយជោគជ័យ!', 'success');
      }
      onSuccess(user);
      onClose();
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      let msg = err.message || 'ការផ្ទៀងផ្ទាត់អ៊ីមែលបានបរាជ័យ';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ!';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'អ៊ីមែលនេះមានគណនីរួចហើយ សូមជ្រើសរើស "ចូលគណនី"!';
      }
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (role: string, name: string, userEmail: string) => {
    setIsLoading(true);
    try {
      const user = authService.signInQuick(name, role, userEmail);
      showToast(`សូមស្វាគមន៍, ${name}! (${role})`, 'success');
      onSuccess(user);
      onClose();
    } catch (err: any) {
      showToast('មិនអាចចូលគណនីបានទេ', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full border border-emerald-900/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-emerald-850 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mx-auto mb-2 text-emerald-300 shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base tracking-wide">
            ចូលប្រើប្រព័ន្ធវិទ្យាស្ថាន
          </h3>
          <p className="text-xs text-emerald-200/90 mt-0.5">
            International Chinese Education & Teachers Institute
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 border-b border-zinc-100 p-1.5 bg-zinc-50/80">
          <button
            type="button"
            onClick={() => {
              setActiveTab('google');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'google'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Google Login
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('email');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'email'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            អ៊ីមែល (Email)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('quick');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'quick'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            ចូលរហ័ស (Quick)
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="leading-relaxed">
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        <div className="p-6">
          {/* TAB 1: GOOGLE LOGIN */}
          {activeTab === 'google' && (
            <div className="space-y-4 text-center">
              <p className="text-xs text-zinc-600">
                ចូលប្រើប្រាស់ដោយផ្ទាល់ជាមួយគណនី Google ឬ Gmail របស់អ្នកដើម្បីធ្វើសមកាលកម្មទិន្នន័យលើ Cloud
              </p>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-zinc-50 text-zinc-800 font-bold text-xs border border-zinc-300 shadow-sm flex items-center justify-center gap-3 transition-all cursor-pointer hover:border-zinc-400 disabled:opacity-50"
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

              <div className="bg-emerald-50/80 border border-emerald-200/70 rounded-2xl p-3 text-left space-y-1">
                <p className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>សុវត្ថិភាពខ្ពស់ និងរហ័ស</span>
                </p>
                <p className="text-[10.5px] text-emerald-800/90 leading-relaxed">
                  ប្រសិនបើ Browser បិទផ្ទាំង Popup សូមជ្រើសរើសផ្ទាំង <strong>"ចូលរហ័ស (Quick)"</strong> ដើម្បីចូលប្រើភ្លាមៗដោយពុំចាំបាច់រង់ចាំ។
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: EMAIL & PASSWORD */}
          {activeTab === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {isRegister && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    ឈ្មោះពេញ (Full Name) *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="ឧ. សុខ ចាន់ថា"
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:bg-white focus:border-emerald-500 outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  អ៊ីមែល (Email) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@cpi.edu.kh ឬ gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:bg-white focus:border-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  ពាក្យសម្ងាត់ (Password) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:bg-white focus:border-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading
                  ? 'កំពុងដំណើរការ...'
                  : isRegister
                  ? 'ចុះឈ្មោះ និងចូលប្រព័ន្ធ (Sign Up)'
                  : 'ចូលគណនី (Sign In)'}
              </button>

              <div className="text-center pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setErrorMessage(null);
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                >
                  {isRegister
                    ? 'មានគណនីរួចហើយ? ចូលគណនីនៅទីនេះ'
                    : 'មិនទាន់មានគណនី? ចុចទីនេះដើម្បីចុះឈ្មោះថ្មី'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: QUICK ACCESS (ONE-CLICK LOGIN) */}
          {activeTab === 'quick' && (
            <div className="space-y-2.5">
              <p className="text-xs text-zinc-600 mb-3">
                ជ្រើសរើសតួនាទីដើម្បីចូលប្រើប្រព័ន្ធភ្លាមៗដោយមិនចាំបាច់បំពេញពាក្យសម្ងាត់៖
              </p>

              {/* Administrator */}
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin(
                    'Admin',
                    'គណៈគ្រប់គ្រងវិទ្យាស្ថាន (Administrator)',
                    'admin@ici.edu.kh'
                  )
                }
                className="w-full p-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-zinc-900 group-hover:text-emerald-900">
                      គណៈគ្រប់គ្រង (Admin)
                    </h4>
                    <p className="text-[10.5px] text-zinc-500">
                      សិទ្ធិពេញលេញលើការគ្រប់គ្រង និងទិន្នន័យ
                    </p>
                  </div>
                </div>
                <LogIn className="w-4 h-4 text-emerald-700 opacity-70 group-hover:opacity-100" />
              </button>

              {/* Faculty / Teacher */}
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin(
                    'Faculty Teacher',
                    'សាស្ត្រាចារ្យ Long Sokha',
                    'sokha.long@ici.edu.kh'
                  )
                }
                className="w-full p-3 rounded-2xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-zinc-900 group-hover:text-blue-900">
                      សាស្ត្រាចារ្យ (Faculty / Teacher)
                    </h4>
                    <p className="text-[10.5px] text-zinc-500">
                      កត់ត្រាវត្តមាន គ្រប់គ្រងថ្នាក់ និងមើលបញ្ជីនិស្សិត
                    </p>
                  </div>
                </div>
                <LogIn className="w-4 h-4 text-blue-700 opacity-70 group-hover:opacity-100" />
              </button>

              {/* Registrar / Staff */}
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin(
                    'Registrar',
                    'មន្ត្រីកត់ត្រាវត្តមាន (Registrar Staff)',
                    'attendance@ici.edu.kh'
                  )
                }
                className="w-full p-3 rounded-2xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-zinc-900 group-hover:text-amber-900">
                      មន្ត្រីកត់ត្រា (Registrar)
                    </h4>
                    <p className="text-[10.5px] text-zinc-500">
                      កត់ត្រាវត្តមានប្រចាំថ្ងៃ និងតាមដានរបាយការណ៍
                    </p>
                  </div>
                </div>
                <LogIn className="w-4 h-4 text-amber-700 opacity-70 group-hover:opacity-100" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
