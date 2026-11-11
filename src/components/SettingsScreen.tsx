import React, { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  Copy, 
  Check, 
  Palette, 
  Volume2, 
  EyeOff, 
  ShieldCheck, 
  RotateCcw, 
  Trash2, 
  Moon, 
  Sun, 
  Smartphone,
  ExternalLink,
  Info,
  CheckCircle2,
  FileText,
  ChevronLeft
} from 'lucide-react';
import { AppSettings, AccentColor, TOTPAccount } from '../types';
import { downloadBackupFile, exportAccountsJson, importAccountsJson } from '../utils/storage';
import { ACCENT_THEMES } from '../utils/theme';
import { playHapticSound, playSuccessSound } from '../utils/audio';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  accounts: TOTPAccount[];
  onImportAccounts: (imported: TOTPAccount[]) => void;
  onLoadSamples: () => void;
  onClearAllAccounts: () => void;
  onShowNotice: (msg: string) => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  accounts,
  onImportAccounts,
  onLoadSamples,
  onClearAllAccounts,
  onShowNotice,
  onBack,
}) => {
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentTheme = ACCENT_THEMES[settings.accentColor];

  // Export to clipboard
  const handleCopyBackup = () => {
    playHapticSound(settings.hapticFeedback);
    const json = exportAccountsJson(accounts);
    navigator.clipboard.writeText(json);
    playSuccessSound(settings.hapticFeedback);
    setCopiedBackup(true);
    onShowNotice('Backup JSON copied to clipboard!');
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  // Download backup file (No password required, as requested)
  const handleDownloadBackup = () => {
    playHapticSound(settings.hapticFeedback);
    downloadBackupFile(accounts);
    playSuccessSound(settings.hapticFeedback);
    onShowNotice(`Downloaded backup with ${accounts.length} accounts!`);
  };

  // Import backup file
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playHapticSound(settings.hapticFeedback);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        const { imported, updated } = importAccountsJson(content, accounts);
        onImportAccounts(updated);
        playSuccessSound(settings.hapticFeedback);
        onShowNotice(`Successfully imported ${imported} new account(s)!`);
        setImportNotice(`Imported ${imported} accounts successfully.`);
      } catch (err: any) {
        onShowNotice('Invalid backup file. Could not import.');
        setImportNotice(err.message || 'Import failed.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-12 pt-1">
      {/* Native Mobile Top Navigation Bar */}
      <div className="sticky top-0 z-20 -mx-4 px-4 py-2.5 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            playHapticSound(settings.hapticFeedback);
            onBack();
          }}
          className={`min-h-[44px] flex items-center gap-1 text-sm font-semibold ${currentTheme.textClass} active:opacity-70 transition-opacity`}
        >
          <ChevronLeft size={22} className="-ml-1" />
          <span>Accounts</span>
        </button>
        <h2 className="text-base font-bold text-white tracking-tight">Settings & Backup</h2>
        <button
          type="button"
          onClick={() => {
            playHapticSound(settings.hapticFeedback);
            onBack();
          }}
          className={`min-h-[44px] px-2 text-sm font-semibold ${currentTheme.textClass} active:opacity-70 transition-opacity`}
        >
          Done
        </button>
      </div>

      {/* Group 1: Export & Backup (Zero password required as requested) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Export & Backup
          </span>
          <span className="text-xs font-semibold text-slate-400">
            {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
          </span>
        </div>

        <div className="rounded-3xl bg-slate-900 border border-slate-800/80 overflow-hidden divide-y divide-slate-800/60 shadow-sm">
          {/* Download JSON Button */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-2xl ${currentTheme.bgClass} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                <Download size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">Export Accounts (No Password)</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct plain JSON export for easy backup and restore. No encryption password required.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadBackup}
              disabled={accounts.length === 0}
              className={`min-h-[44px] px-4 py-2.5 rounded-2xl ${currentTheme.bgClass} hover:opacity-95 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none shrink-0`}
            >
              <Download size={14} />
              <span>Download File</span>
            </button>
          </div>

          {/* Copy Raw Backup to Clipboard */}
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                <Copy size={18} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-white">Copy Backup to Clipboard</h4>
                <p className="text-xs text-slate-400 truncate">Copies the raw JSON array string</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyBackup}
              disabled={accounts.length === 0}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors active:scale-95 disabled:opacity-40"
            >
              {copiedBackup ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          </div>

          {/* Import Backup */}
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                <Upload size={18} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-white">Import Backup File</h4>
                <p className="text-xs text-slate-400 truncate">Restore accounts from a JSON backup</p>
              </div>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileImport}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => {
                  playHapticSound(settings.hapticFeedback);
                  fileInputRef.current?.click();
                }}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors active:scale-95"
              >
                <Upload size={14} />
                <span>Select File</span>
              </button>
            </div>
          </div>
        </div>

        {importNotice && (
          <div className="px-2 pt-1 text-xs text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 size={14} />
            <span>{importNotice}</span>
          </div>
        )}
      </div>

      {/* Group 2: Accent Color Picker (User requested: "accent color change er option o rakhte paro") */}
      <div className="space-y-2">
        <div className="px-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Accent Color
          </span>
        </div>

        <div className="rounded-3xl bg-slate-900 border border-slate-800/80 p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette size={16} className={currentTheme.textClass} />
              <span className="text-sm font-semibold text-white">
                {currentTheme.name}
              </span>
            </div>
            <span className="text-xs text-slate-500 font-code uppercase">
              {currentTheme.hex}
            </span>
          </div>

          {/* Color Circles */}
          <div className="flex items-center justify-between gap-2 pt-1 overflow-x-auto no-scrollbar py-1">
            {(Object.keys(ACCENT_THEMES) as AccentColor[]).map((key) => {
              const th = ACCENT_THEMES[key];
              const isSelected = settings.accentColor === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    playHapticSound(settings.hapticFeedback);
                    onUpdateSettings({ accentColor: key });
                  }}
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
                    isSelected ? 'ring-3 ring-white ring-offset-2 ring-offset-slate-900 scale-105' : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: th.hex }}
                  title={th.name}
                >
                  {isSelected && <Check size={18} className="text-white drop-shadow-md" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Group 3: Appearance & Preferences */}
      <div className="space-y-2">
        <div className="px-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Appearance & Privacy
          </span>
        </div>

        <div className="rounded-3xl bg-slate-900 border border-slate-800/80 overflow-hidden divide-y divide-slate-800/60 shadow-sm">
          {/* Privacy Toggle: Mask codes */}
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                <EyeOff size={18} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-white">Privacy Mode</h4>
                <p className="text-xs text-slate-400">Mask 6-digit codes until tapped</p>
              </div>
            </div>

            {/* iOS Switch Toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={settings.hideCodesByDefault}
              onClick={() => {
                playHapticSound(settings.hapticFeedback);
                onUpdateSettings({ hideCodesByDefault: !settings.hideCodesByDefault });
              }}
              className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative flex items-center ${
                settings.hideCodesByDefault ? currentTheme.bgClass : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  settings.hideCodesByDefault ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Haptic & Sound Feedback Toggle */}
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                <Volume2 size={18} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-white">Tactile Feedback</h4>
                <p className="text-xs text-slate-400">iOS clicks and haptic vibration</p>
              </div>
            </div>

            {/* iOS Switch Toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={settings.hapticFeedback}
              onClick={() => {
                playHapticSound(!settings.hapticFeedback);
                onUpdateSettings({ hapticFeedback: !settings.hapticFeedback });
              }}
              className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative flex items-center ${
                settings.hapticFeedback ? currentTheme.bgClass : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  settings.hapticFeedback ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Group 4: Quick Actions & Reset */}
      <div className="space-y-2">
        <div className="px-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Account Management
          </span>
        </div>

        <div className="rounded-3xl bg-slate-900 border border-slate-800/80 overflow-hidden divide-y divide-slate-800/60 shadow-sm">
          {/* Load Sample Accounts */}
          <button
            type="button"
            onClick={() => {
              playHapticSound(settings.hapticFeedback);
              onLoadSamples();
            }}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                <RotateCcw size={18} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Load Demo Accounts</h4>
                <p className="text-xs text-slate-400">Add sample Google, GitHub & Discord test keys</p>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-medium">Add 3</span>
          </button>

          {/* Clear all accounts */}
          <button
            type="button"
            onClick={() => {
              playHapticSound(settings.hapticFeedback);
              setShowClearConfirm(true);
            }}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-rose-500/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 size={18} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-rose-400">Clear All Accounts</h4>
                <p className="text-xs text-slate-500">Permanently delete stored 2FA tokens</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* App Info Footer */}
      <div className="px-4 text-center space-y-1.5 pt-2">
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
          <ShieldCheck size={16} className={currentTheme.textClass} />
          <span>VESDI Auth · RFC 6238 Standard</span>
        </div>
        <p className="text-[11px] text-slate-500">
          All cryptographic TOTP hashes are generated client-side inside your browser sandbox. 100% offline & private.
        </p>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setShowClearConfirm(false)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <Trash2 size={20} />
            </div>
            <h3 className="font-bold text-base text-white">Reset & Clear All Accounts?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              This will remove all {accounts.length} authenticator accounts from this device. Please ensure you have exported a backup if you still need them.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  playHapticSound(settings.hapticFeedback);
                  onClearAllAccounts();
                  setShowClearConfirm(false);
                  onShowNotice('All accounts cleared.');
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md"
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
