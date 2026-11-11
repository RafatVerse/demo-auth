import React, { useState, useEffect } from 'react';
import { Copy, Check, Trash2, Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react';
import { TOTPAccount, AccentColor } from '../types';
import { generateTOTP, getRemainingPeriodInfo, formatCode } from '../utils/totp';
import { getBrandMeta } from '../utils/brandIcons';
import { playHapticSound, playSuccessSound } from '../utils/audio';
import { ACCENT_THEMES } from '../utils/theme';

interface AccountCardProps {
  account: TOTPAccount;
  accent: AccentColor;
  hapticEnabled: boolean;
  hideByDefault: boolean;
  onDelete: (id: string) => void;
  onCopyNotice: (text: string) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  accent,
  hapticEnabled,
  hideByDefault,
  onDelete,
  onCopyNotice,
}) => {
  const [code, setCode] = useState<string>('------');
  const [remaining, setRemaining] = useState<number>(30);
  const [progress, setProgress] = useState<number>(100);
  const [isCopied, setIsCopied] = useState(false);
  const [isRevealed, setIsRevealed] = useState(!hideByDefault);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const theme = ACCENT_THEMES[accent];
  const brand = getBrandMeta(account.issuer);

  // Re-sync when hideByDefault changes
  useEffect(() => {
    setIsRevealed(!hideByDefault);
  }, [hideByDefault]);

  // Update TOTP code and countdown
  useEffect(() => {
    let isMounted = true;

    const update = async () => {
      const { remaining: rem, progress: prog } = getRemainingPeriodInfo(account.period);
      if (!isMounted) return;
      setRemaining(rem);
      setProgress(prog);

      // Generate TOTP
      const newCode = await generateTOTP(
        account.secret,
        account.algorithm,
        account.digits,
        account.period
      );
      if (isMounted) {
        setCode(newCode);
      }
    };

    update();
    // Update every second
    const interval = setInterval(update, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [account.secret, account.algorithm, account.digits, account.period]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (code === '------') return;
    
    // Copy code without whitespace for instant paste
    navigator.clipboard.writeText(code);
    playSuccessSound(hapticEnabled);
    setIsCopied(true);
    onCopyNotice(`Copied code for ${account.issuer}`);

    setTimeout(() => {
      setIsCopied(false);
    }, 1800);
  };

  // Determine timer ring color based on urgency
  let ringStrokeColor = theme.hex;
  if (remaining <= 4) {
    ringStrokeColor = '#F43F5E'; // Rose / Danger
  } else if (remaining <= 8) {
    ringStrokeColor = '#F59E0B'; // Amber / Warning
  }

  // SVG circle calculation
  const circleRadius = 14;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <>
      <div 
        className="group relative rounded-3xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800/80 p-4 transition-all duration-200 shadow-sm active:scale-[0.99] select-none"
        onClick={() => {
          if (!isRevealed) {
            playHapticSound(hapticEnabled);
            setIsRevealed(true);
          }
        }}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: Brand Icon + Issuer/Account info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-inner"
              style={{
                backgroundColor: account.color || brand.color,
                color: brand.textColor,
              }}
            >
              {brand.tag}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-white truncate tracking-tight">
                  {account.issuer || 'Authentication'}
                </h4>
                {account.digits === 8 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-400 font-mono">
                    8d
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">
                {account.account || 'Account'}
              </p>
            </div>
          </div>

          {/* Right: Circular 30s Countdown Timer */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg className="w-8 h-8 -rotate-90">
                {/* Background Track */}
                <circle
                  cx="16"
                  cy="16"
                  r={circleRadius}
                  className="stroke-slate-800"
                  strokeWidth="2.5"
                  fill="transparent"
                />
                {/* Dynamic Remaining Ring */}
                <circle
                  cx="16"
                  cy="16"
                  r={circleRadius}
                  stroke={ringStrokeColor}
                  strokeWidth="2.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <span className={`absolute text-[10px] font-bold font-code ${remaining <= 5 ? 'text-rose-400' : 'text-slate-400'}`}>
                {remaining}
              </span>
            </div>

            {/* Quick Actions Menu Trigger */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playHapticSound(hapticEnabled);
                setShowDetailsModal(true);
              }}
              className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-500 hover:text-slate-300 flex items-center justify-center transition-colors"
              title="Account Details"
            >
              <KeyRound size={15} />
            </button>
          </div>
        </div>

        {/* Code Bar Container */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isRevealed ? (
              <span 
                className={`text-2xl sm:text-3xl font-extrabold tracking-wider font-code transition-colors ${
                  remaining <= 4 ? 'text-rose-400' : theme.textClass
                }`}
              >
                {formatCode(code)}
              </span>
            ) : (
              <span className="text-2xl sm:text-3xl font-extrabold tracking-widest text-slate-600 font-code">
                ••••••
              </span>
            )}

            {hideByDefault && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playHapticSound(hapticEnabled);
                  setIsRevealed(!isRevealed);
                }}
                className="text-slate-500 hover:text-slate-300 p-1"
                title={isRevealed ? 'Hide Code' : 'Reveal Code'}
              >
                {isRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            )}
          </div>

          {/* iOS 1-Tap Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-95 ${
              isCopied
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 hover:text-white'
            }`}
          >
            {isCopied ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Account Info & Secret Details Modal */}
      {showDetailsModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setShowDetailsModal(false)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm text-white"
                style={{ backgroundColor: account.color || brand.color }}
              >
                {brand.tag}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base text-white truncate">{account.issuer}</h3>
                <p className="text-xs text-slate-400 truncate">{account.account}</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Secret Key:</span>
                <span className="font-code font-medium text-slate-200 select-all break-all">
                  {account.secret}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
                <div>
                  <span className="block text-slate-500">Period</span>
                  <span className="text-slate-200 font-medium">{account.period}s</span>
                </div>
                <div>
                  <span className="block text-slate-500">Algorithm</span>
                  <span className="text-slate-200 font-medium">{account.algorithm}</span>
                </div>
                <div>
                  <span className="block text-slate-500">Digits</span>
                  <span className="text-slate-200 font-medium">{account.digits}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  playHapticSound(hapticEnabled);
                  setShowDetailsModal(false);
                  setShowDeleteConfirm(true);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playHapticSound(hapticEnabled);
                  setShowDetailsModal(false);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <Trash2 size={20} />
            </div>
            <h3 className="font-bold text-base text-white">Delete Account?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-200">{account.issuer}</strong> ({account.account})? You will no longer be able to generate 2FA login codes for this service from VESDI Auth.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  playHapticSound(hapticEnabled);
                  onDelete(account.id);
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
