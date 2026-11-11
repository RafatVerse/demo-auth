import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { 
  Camera, 
  Upload, 
  Key, 
  X, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  QrCode
} from 'lucide-react';
import { TOTPAccount, HashAlgorithm, AccentColor } from '../types';
import { parseOtpAuthUri, isValidBase32 } from '../utils/totp';
import { playHapticSound, playSuccessSound } from '../utils/audio';
import { ACCENT_THEMES } from '../utils/theme';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (account: Omit<TOTPAccount, 'id' | 'createdAt'>) => void;
  accent: AccentColor;
  hapticEnabled: boolean;
}

const QUICK_SERVICES = [
  { name: 'Google', samplePrefix: 'user@gmail.com' },
  { name: 'GitHub', samplePrefix: 'username' },
  { name: 'Discord', samplePrefix: 'tag#0000' },
  { name: 'Microsoft', samplePrefix: 'user@outlook.com' },
  { name: 'Amazon AWS', samplePrefix: 'admin' },
  { name: 'Cloudflare', samplePrefix: 'team@company.com' },
];

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onAddAccount,
  accent,
  hapticEnabled,
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'manual'>('qr');
  
  // Manual Form States
  const [issuer, setIssuer] = useState('');
  const [accountName, setAccountName] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>('SHA-1');
  const [digits, setDigits] = useState<number>(6);
  const [period, setPeriod] = useState<number>(30);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Scanner States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scannedSuccess, setScannedSuccess] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const theme = ACCENT_THEMES[accent];

  // Stop camera stream
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start camera stream
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported on this device/browser');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        await videoRef.current.play();
        setCameraActive(true);
        requestScan();
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError(err.message || 'Camera permission denied. You can still upload a QR image or enter manually.');
      setCameraActive(false);
    }
  };

  // Process video frames for QR codes
  const requestScan = () => {
    const scanFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleScannedCode(code.data);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  // Handle scanned string from camera or file
  const handleScannedCode = (rawData: string) => {
    playHapticSound(hapticEnabled);
    const parsed = parseOtpAuthUri(rawData);

    if (parsed && parsed.secret) {
      playSuccessSound(hapticEnabled);
      setScannedSuccess(`Detected: ${parsed.issuer || 'Service'} (${parsed.account || 'Account'})`);
      stopCamera();

      setTimeout(() => {
        onAddAccount({
          issuer: parsed.issuer || 'Account',
          account: parsed.account || 'TOTP',
          secret: parsed.secret!,
          algorithm: parsed.algorithm || 'SHA-1',
          digits: parsed.digits || 6,
          period: parsed.period || 30,
        });
        resetAndClose();
      }, 500);
    } else {
      // Maybe raw secret? Check if valid base32
      const clean = rawData.trim().toUpperCase().replace(/[\s-]/g, '');
      if (isValidBase32(clean)) {
        playSuccessSound(hapticEnabled);
        setScannedSuccess('Valid Secret Key Detected!');
        stopCamera();
        setTimeout(() => {
          onAddAccount({
            issuer: 'Authentication',
            account: 'Scanned Key',
            secret: clean,
            algorithm: 'SHA-1',
            digits: 6,
            period: 30,
          });
          resetAndClose();
        }, 500);
      } else {
        setCameraError('Scanned QR code does not contain a valid TOTP URI or Base32 secret.');
      }
    }
  };

  // Handle image file upload (PNG/JPG QR code)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playHapticSound(hapticEnabled);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleScannedCode(code.data);
        } else {
          setCameraError('Could not find a valid QR code in this image. Please try another image or enter manually.');
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Reset modal state
  const resetAndClose = () => {
    stopCamera();
    setIssuer('');
    setAccountName('');
    setSecretKey('');
    setManualError(null);
    setScannedSuccess(null);
    setCameraError(null);
    setShowAdvanced(false);
    onClose();
  };

  // Switch camera between front and back
  const toggleFacingMode = () => {
    playHapticSound(hapticEnabled);
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Lifecycle
  useEffect(() => {
    if (isOpen && activeTab === 'qr') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  // Submit manual form
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    const cleanSecret = secretKey.toUpperCase().replace(/[\s=-]/g, '');

    if (!cleanSecret) {
      setManualError('Please enter a secret key.');
      return;
    }

    if (!isValidBase32(cleanSecret)) {
      setManualError('Invalid secret key! Must be valid Base32 (A-Z and digits 2-7).');
      return;
    }

    playSuccessSound(hapticEnabled);
    onAddAccount({
      issuer: issuer.trim() || 'Authentication',
      account: accountName.trim() || 'Account',
      secret: cleanSecret,
      algorithm,
      digits,
      period,
    });

    resetAndClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md transition-opacity">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 text-slate-100 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Grab Handle */}
        <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl ${theme.bgClass} flex items-center justify-center text-white shadow-sm`}>
              <QrCode size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Add Account</h3>
              <p className="text-xs text-slate-400">TOTP Two-Factor Authentication</p>
            </div>
          </div>
          <button
            onClick={() => {
              playHapticSound(hapticEnabled);
              resetAndClose();
            }}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors active:scale-95"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* iOS Segmented Tabs */}
        <div className="p-4 pb-2">
          <div className="p-1 bg-slate-950/90 rounded-2xl border border-slate-800/80 flex gap-1">
            <button
              type="button"
              onClick={() => {
                playHapticSound(hapticEnabled);
                setActiveTab('qr');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'qr'
                  ? `${theme.bgClass} text-white shadow-md`
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera size={15} />
              <span>Scan QR</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playHapticSound(hapticEnabled);
                setActiveTab('manual');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'manual'
                  ? `${theme.bgClass} text-white shadow-md`
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Key size={15} />
              <span>Enter Manually</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 pt-1 overflow-y-auto no-scrollbar flex-1">
          {activeTab === 'qr' ? (
            <div className="space-y-3">
              {/* Camera Scanner Viewport */}
              <div className="relative aspect-square w-full rounded-2xl bg-black overflow-hidden border border-slate-800 flex items-center justify-center">
                {/* Live video */}
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
                  autoPlay
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Viewfinder Overlays */}
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {/* Darkened mask corners */}
                    <div className="relative w-3/4 aspect-square rounded-2xl border-2 border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                      {/* Scanning laser line animation */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#38bdf8] animate-[pulse_2s_infinite]" />
                      
                      {/* Corner marks */}
                      <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />
                    </div>
                  </div>
                )}

                {/* Scanned success flash */}
                {scannedSuccess && (
                  <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20">
                    <div className="w-14 h-14 rounded-full bg-white text-emerald-600 flex items-center justify-center mb-2 shadow-lg animate-bounce">
                      <Check size={32} />
                    </div>
                    <p className="font-bold text-white text-base">{scannedSuccess}</p>
                    <p className="text-xs text-emerald-100 mt-1">Configuring TOTP credentials...</p>
                  </div>
                )}

                {/* Fallback when camera is stopped or denied */}
                {!cameraActive && !scannedSuccess && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-950/80">
                    <Camera size={40} className="text-slate-600 mb-3" />
                    <p className="text-sm font-medium text-slate-200">Point Camera at QR Code</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      {cameraError || 'Hold your camera over the QR code from Google, GitHub, Discord, etc.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        playHapticSound(hapticEnabled);
                        startCamera();
                      }}
                      className="mt-3 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw size={14} />
                      <span>Retry Camera</span>
                    </button>
                  </div>
                )}

                {/* Camera controls in-frame */}
                {cameraActive && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 active:scale-95"
                      title="Switch Camera"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Upload QR Image File Fallback */}
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    playHapticSound(hapticEnabled);
                    fileInputRef.current?.click();
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-medium text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Upload size={16} className="text-slate-400" />
                  <span>Upload QR Code Image or Screenshot</span>
                </button>
              </div>

              {cameraError && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          ) : (
            /* Manual Entry Form */
            <form onSubmit={handleManualSubmit} className="space-y-3.5">
              {/* Quick service suggestions */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Popular Services
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SERVICES.map((srv) => (
                    <button
                      key={srv.name}
                      type="button"
                      onClick={() => {
                        playHapticSound(hapticEnabled);
                        setIssuer(srv.name);
                        if (!accountName) setAccountName(srv.samplePrefix);
                      }}
                      className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all ${
                        issuer.toLowerCase() === srv.name.toLowerCase()
                          ? `${theme.bgClass} text-white border-transparent shadow-sm`
                          : 'bg-slate-800/60 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {srv.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service / Issuer Name */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Service / Issuer
                </label>
                <input
                  type="text"
                  placeholder="e.g. Google, GitHub, Binance"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Account / Username */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Account Name / Email
                </label>
                <input
                  type="text"
                  placeholder="e.g. alex@example.com or user#1234"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Secret Key Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Secret Key <span className="text-rose-400">*</span>
                  </label>
                  {secretKey.length > 0 && (
                    <span className={`text-[10px] font-medium ${isValidBase32(secretKey) ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isValidBase32(secretKey) ? '✓ Valid Base32' : '⚠ Invalid Base32 format'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. JBSWY3DPEHPK3PXP"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder:text-slate-600 text-sm font-code tracking-wider focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                  <div className="absolute right-3 top-2.5 text-slate-500 pointer-events-none">
                    <Key size={16} />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Spaces are stripped automatically. Case-insensitive Base32 letters (A-Z, 2-7).
                </p>
              </div>

              {/* Advanced Options Accordion */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 font-medium py-1"
                >
                  <SlidersHorizontal size={13} />
                  <span>Advanced Settings (Algorithm, Digits, Period)</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
                  />
                </button>

                {showAdvanced && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Digits
                        </label>
                        <select
                          value={digits}
                          onChange={(e) => setDigits(Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200"
                        >
                          <option value={6}>6 Digits</option>
                          <option value={8}>8 Digits</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Period
                        </label>
                        <select
                          value={period}
                          onChange={(e) => setPeriod(Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200"
                        >
                          <option value={30}>30 Sec</option>
                          <option value={60}>60 Sec</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Algorithm
                        </label>
                        <select
                          value={algorithm}
                          onChange={(e) => setAlgorithm(e.target.value as HashAlgorithm)}
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200"
                        >
                          <option value="SHA-1">SHA-1</option>
                          <option value="SHA-256">SHA-256</option>
                          <option value="SHA-512">SHA-512</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {manualError && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{manualError}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!secretKey.trim()}
                  className={`w-full py-3.5 px-4 rounded-2xl ${theme.bgClass} text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none`}
                >
                  <Sparkles size={16} />
                  <span>Save Account</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
