import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  CloudUpload,
  CloudDownload,
  Download,
  Upload,
  Database,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  HardDrive,
  FileJson
} from 'lucide-react';
import { AppUser } from '../types';
import { instituteService } from '../service/instituteService';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser | null;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  onRefreshData?: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  user,
  showToast,
  onRefreshData
}) => {
  const [cloudBackups, setCloudBackups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [importingFile, setImportingFile] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCloudBackups();
    }
  }, [isOpen]);

  const loadCloudBackups = async () => {
    setIsLoading(true);
    try {
      const list = await instituteService.getCloudBackups();
      setCloudBackups(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCloudBackup = async () => {
    setIsBackingUp(true);
    try {
      await instituteService.createCloudBackup(user);
      showToast('បានរក្សាទុក Backup លើ Cloud Firestore ដោយជោគជ័យ!', 'success');
      await loadCloudBackups();
    } catch (e: any) {
      console.error(e);
      showToast('ការរក្សាទុក Backup លើ Cloud បានបរាជ័យ', 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleExportLocal = () => {
    try {
      instituteService.exportLocalBackupFile();
      showToast('បានទាញយកឯកសារ Backup (JSON) ទៅក្នុងកុំព្យូទ័រដោយជោគជ័យ', 'success');
    } catch (e: any) {
      console.error(e);
      showToast('ការទាញយក Backup បានបរាជ័យ', 'error');
    }
  };

  const handleRestoreCloud = async (b: any) => {
    const confirm = window.confirm(
      `តើអ្នកពិតជាចង់ទាញយកទិន្នន័យពី Cloud Backup (${new Date(b.timestamp).toLocaleString('km-KH')}) មកវិញមែនទេ?\n\nទិន្នន័យបច្ចុប្បន្ននឹងត្រូវបានជំនួសដោយទិន្នន័យពី Backup នេះ។`
    );
    if (!confirm) return;

    setRestoringId(b.id);
    try {
      const parsedData = typeof b.data === 'string' ? JSON.parse(b.data) : b.data;
      await instituteService.restoreBackupData(parsedData);
      showToast('បានស្តារទិន្នន័យ (Restore) ពី Cloud Backup ដោយជោគជ័យ!', 'success');
      if (onRefreshData) onRefreshData();
      onClose();
    } catch (e: any) {
      console.error(e);
      showToast('ការស្តារទិន្នន័យបានបរាជ័យ', 'error');
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeleteCloud = async (backupId: string) => {
    const confirm = window.confirm('តើអ្នកពិតជាចង់លុប Cloud Backup នេះមែនទេ?');
    if (!confirm) return;

    try {
      await instituteService.deleteCloudBackup(backupId);
      showToast('បានលុប Cloud Backup ដោយជោគជ័យ', 'info');
      setCloudBackups((prev) => prev.filter((item) => item.id !== backupId));
    } catch (e: any) {
      console.error(e);
      showToast('ការលុបបានបរាជ័យ', 'error');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingFile(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const dataObj = parsed.data || parsed;

        await instituteService.restoreBackupData(dataObj);
        showToast('បានបញ្ចូលទិន្នន័យពីឯកសារ Backup ដោយជោគជ័យ!', 'success');
        if (onRefreshData) onRefreshData();
        onClose();
      } catch (err) {
        console.error(err);
        showToast('ឯកសារ JSON មិនត្រឹមត្រូវ ឬមានកំហុសក្នុងការអាន!', 'error');
      } finally {
        setImportingFile(false);
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131f1a] rounded-3xl max-w-2xl w-full border border-emerald-900/10 dark:border-emerald-800/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-emerald-850 dark:bg-emerald-950 p-5 text-white flex items-center justify-between border-b border-emerald-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300 border border-white/15 shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                មជ្ឈមណ្ឌល Backup & Cloud Sync
              </h3>
              <p className="text-xs text-emerald-200/90">
                រក្សាទុក និងស្តារទិន្នន័យប្រព័ន្ធលើ Cloud Firestore និងក្នុងម៉ាស៊ីន (Local)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Action 1: Cloud Backup */}
            <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold text-xs mb-1">
                  <CloudUpload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>រក្សាទុក Backup លើ Cloud</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                  បង្កើតច្បាប់ចម្លងសុវត្ថិភាពនៃទិន្នន័យទាំងអស់ (និស្សិត គ្រូ ថ្នាក់ វត្តមាន) ទៅកាន់ Cloud Firestore Database។
                </p>
              </div>
              <button
                type="button"
                onClick={handleCreateCloudBackup}
                disabled={isBackingUp}
                className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>{isBackingUp ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកលើ Cloud ឥឡូវនេះ'}</span>
              </button>
            </div>

            {/* Action 2: Local JSON Backup */}
            <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold text-xs mb-1">
                  <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>ទាញយក Backup លើកុំព្យូទ័រ (Local)</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                  ទាញយកឯកសារ JSON ពេញលេញសម្រាប់រក្សាទុកលើកុំព្យូទ័រផ្ទាល់ខ្លួន ឬចម្លងទៅកាន់កុំព្យូទ័រផ្សេង។
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportLocal}
                className="w-full py-2 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>ទាញយកឯកសារ Backup (.json)</span>
              </button>
            </div>
          </div>

          {/* Local File Restore Option */}
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 bg-zinc-50 dark:bg-[#182620] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200">
                <FileJson className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  បញ្ចូលទិន្នន័យពីឯកសារ Backup ក្នុងកុំព្យូទ័រ
                </h4>
                <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400">
                  ជ្រើសរើសឯកសារ Backup .json ដើម្បីស្តារទិន្នន័យឡើងវិញ
                </p>
              </div>
            </div>
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white font-bold text-xs cursor-pointer transition-colors shadow-xs">
              <Upload className="w-3.5 h-3.5" />
              <span>{importingFile ? 'កំពុងបញ្ចូល...' : 'បញ្ចូលឯកសារ'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                disabled={importingFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Cloud Backups Snapshot List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>ប្រវត្តិ Cloud Backups លើប្រព័ន្ធ ({cloudBackups.length})</span>
              </h4>
              <button
                type="button"
                onClick={loadCloudBackups}
                disabled={isLoading}
                className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>ផ្ទុកឡើងវិញ</span>
              </button>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                កំពុងផ្ទុកបញ្ជី Cloud Backups...
              </div>
            ) : cloudBackups.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 text-center text-xs text-zinc-500 dark:text-zinc-400">
                មិនទាន់មាន Cloud Backup នៅឡើយទេ។ ចុចប៊ូតុង "រក្សាទុកលើ Cloud ឥឡូវនេះ" ខាងលើដើម្បីបង្កើត។
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {cloudBackups.map((b) => {
                  const date = new Date(b.timestamp);
                  const isRestoring = restoringId === b.id;
                  return (
                    <div
                      key={b.id}
                      className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#16231d] hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                            {date.toLocaleDateString('km-KH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })} • {date.toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded-md">
                            {b.totalStudents || 0} និស្សិត
                          </span>
                          <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded-md">
                            {b.totalTeachers || 0} គ្រូ
                          </span>
                        </div>
                        <p className="text-[10.5px] text-zinc-400 mt-0.5">
                          បង្កើតដោយ: <span className="font-medium text-zinc-600 dark:text-zinc-300">{b.createdBy || 'Admin'}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRestoreCloud(b)}
                          disabled={isRestoring}
                          className="px-2.5 py-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <CloudDownload className="w-3 h-3" />
                          <span>{isRestoring ? 'កំពុងស្តារ...' : 'Restore'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCloud(b.id)}
                          title="លុប Backup នេះ"
                          className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-[#0f1a15] border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ទិន្នន័យត្រូវបានការពារ និងធ្វើសមកាលកម្មដោយសុវត្ថិភាព</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
          >
            បិទ (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
