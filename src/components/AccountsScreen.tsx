import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  X, 
  Plus, 
  Sparkles, 
  KeyRound, 
  QrCode, 
  Clock,
  Layers,
  SlidersHorizontal
} from 'lucide-react';
import { TOTPAccount, AccentColor } from '../types';
import { AccountCard } from './AccountCard';
import { getRemainingPeriodInfo } from '../utils/totp';
import { ACCENT_THEMES } from '../utils/theme';
import { playHapticSound } from '../utils/audio';

interface AccountsScreenProps {
  accounts: TOTPAccount[];
  accent: AccentColor;
  hapticEnabled: boolean;
  hideByDefault: boolean;
  onOpenAddModal: () => void;
  onDeleteAccount: (id: string) => void;
  onLoadDemoAccounts: () => void;
  onCopyNotice: (msg: string) => void;
  isFabVisible: boolean;
  onOpenSettings: () => void;
}

export const AccountsScreen: React.FC<AccountsScreenProps> = ({
  accounts,
  accent,
  hapticEnabled,
  hideByDefault,
  onOpenAddModal,
  onDeleteAccount,
  onLoadDemoAccounts,
  onCopyNotice,
  isFabVisible,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [masterRemaining, setMasterRemaining] = useState(30);
  const [masterProgress, setMasterProgress] = useState(100);

  const theme = ACCENT_THEMES[accent];

  // Master 30s cycle tracker for the top bar indicator
  useEffect(() => {
    let isMounted = true;
    const tick = () => {
      const { remaining, progress } = getRemainingPeriodInfo(30);
      if (isMounted) {
        setMasterRemaining(remaining);
        setMasterProgress(progress);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Filter accounts by search query
  const filteredAccounts = accounts.filter((acc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      acc.issuer.toLowerCase().includes(q) ||
      acc.account.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 pb-24">
      {/* Top Header Card */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>VESDI Auth</span>
          </h1>
          <p className="text-xs text-slate-400">
            {accounts.length} active {accounts.length === 1 ? 'credential' : 'credentials'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Global Cycle Indicator */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm">
            <div className="relative w-5 h-5 flex items-center justify-center">
              <svg className="w-5 h-5 -rotate-90">
                <circle
                  cx="10"
                  cy="10"
                  r="7"
                  className="stroke-slate-800"
                  strokeWidth="2"
                  fill="transparent"
                />
                <circle
                  cx="10"
                  cy="10"
                  r="7"
                  stroke={masterRemaining <= 5 ? '#f43f5e' : theme.hex}
                  strokeWidth="2"
                  strokeDasharray={2 * Math.PI * 7}
                  strokeDashoffset={2 * Math.PI * 7 * (1 - masterProgress / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
            </div>
            <span className="text-xs font-bold font-code text-slate-300">
              {masterRemaining}s
            </span>
          </div>

          {/* Settings & Export Button */}
          <button
            type="button"
            onClick={() => {
              playHapticSound(hapticEnabled);
              onOpenSettings();
            }}
            className="min-h-[44px] min-w-[44px] rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800/80 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-sm"
            title="Settings & Export"
            aria-label="Settings and Export"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Search Input Bar (Shown when accounts exist) */}
      {accounts.length > 0 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search accounts or issuers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
          />
          <div className="absolute left-3.5 top-3 text-slate-500 pointer-events-none">
            <Search size={16} />
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 w-6 h-6 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {/* Accounts List / Empty State */}
      {accounts.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl bg-slate-900/70 border border-dashed border-slate-800 p-8 text-center space-y-4 my-6">
          <div className={`w-16 h-16 rounded-3xl ${theme.bgLightClass} mx-auto flex items-center justify-center shadow-inner`}>
            <KeyRound size={28} className={theme.textClass} />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white tracking-tight">No Accounts Added Yet</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Add TOTP two-factor authentication accounts by scanning a QR code or entering a secret key manually.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                playHapticSound(hapticEnabled);
                onOpenAddModal();
              }}
              className={`w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-2xl ${theme.bgClass} text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95`}
            >
              <Plus size={16} />
              <span>Add First Account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playHapticSound(hapticEnabled);
                onLoadDemoAccounts();
              }}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
            >
              <Sparkles size={14} className="text-amber-400" />
              <span>Load Demo Keys</span>
            </button>
          </div>
        </div>
      ) : filteredAccounts.length === 0 ? (
        /* Search Not Found State */
        <div className="rounded-3xl bg-slate-900/40 border border-slate-800/80 p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-300">No accounts match "{searchQuery}"</p>
          <p className="text-xs text-slate-500">Check your spelling or clear the search filter.</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs text-orange-400 font-medium underline mt-1"
          >
            Clear Search
          </button>
        </div>
      ) : (
        /* Accounts Grid / Cards */
        <div className="space-y-3">
          {filteredAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              accent={accent}
              hapticEnabled={hapticEnabled}
              hideByDefault={hideByDefault}
              onDelete={onDeleteAccount}
              onCopyNotice={onCopyNotice}
            />
          ))}
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      {/* Scroll-aware: automatically translates down and hides when scrolling down */}
      <div 
        className={`fixed right-5 md:right-[calc(50vw-13rem)] bottom-6 z-40 transition-all duration-300 ease-out transform ${
          isFabVisible 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-24 opacity-0 scale-90 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            playHapticSound(hapticEnabled);
            onOpenAddModal();
          }}
          className={`h-14 w-14 rounded-full ${theme.bgClass} text-white flex items-center justify-center shadow-xl ${theme.shadowClass} hover:scale-105 active:scale-90 transition-all duration-150 focus:outline-none focus:ring-4 ${theme.ringClass}`}
          aria-label="Add TOTP Account"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
