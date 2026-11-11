/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { TOTPAccount, AppSettings } from './types';
import { 
  getStoredAccounts, 
  saveStoredAccounts, 
  getStoredSettings, 
  saveStoredSettings, 
  SAMPLE_ACCOUNTS 
} from './utils/storage';
import { AccountsScreen } from './components/AccountsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { AddAccountModal } from './components/AddAccountModal';
import { ACCENT_THEMES } from './utils/theme';

export default function App() {
  const [accounts, setAccounts] = useState<TOTPAccount[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const loaded = getStoredSettings();
    // Default to orange if previous was blue
    if (!loaded.accentColor || loaded.accentColor === 'blue') {
      return { ...loaded, accentColor: 'orange' };
    }
    return loaded;
  });
  const [activeTab, setActiveTab] = useState<'accounts' | 'settings'>('accounts');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFabVisible, setIsFabVisible] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const lastScrollTopRef = useRef<number>(0);
  const toastTimeoutRef = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Initialize accounts from localStorage
  useEffect(() => {
    const loadedAccounts = getStoredAccounts();
    setAccounts(loadedAccounts);
  }, []);

  // Save accounts when changed
  useEffect(() => {
    saveStoredAccounts(accounts);
  }, [accounts]);

  // Save settings when changed
  useEffect(() => {
    saveStoredSettings(settings);
    // Apply dark class to documentElement
    if (settings.themeMode === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [settings]);

  // Show Toast notice
  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Scroll listener for 60fps show/hide FAB
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    const delta = currentScrollTop - lastScrollTopRef.current;

    if (delta > 8 && currentScrollTop > 30) {
      // Scrolling down -> hide FAB
      if (isFabVisible) setIsFabVisible(false);
    } else if (delta < -8 || currentScrollTop <= 20) {
      // Scrolling up or near top -> show FAB
      if (!isFabVisible) setIsFabVisible(true);
    }
    lastScrollTopRef.current = currentScrollTop;
  };

  // Add new account
  const handleAddAccount = (newAccountData: Omit<TOTPAccount, 'id' | 'createdAt'>) => {
    const newAccount: TOTPAccount = {
      ...newAccountData,
      id: `totp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };
    const updated = [newAccount, ...accounts];
    setAccounts(updated);
    showToast(`Added ${newAccount.issuer} (${newAccount.account})`);
  };

  // Delete account
  const handleDeleteAccount = (id: string) => {
    const target = accounts.find((a) => a.id === id);
    const updated = accounts.filter((a) => a.id !== id);
    setAccounts(updated);
    showToast(`Removed ${target?.issuer || 'account'}`);
  };

  // Load sample demo accounts
  const handleLoadDemoAccounts = () => {
    const existingSecrets = new Set(accounts.map((a) => a.secret.toUpperCase()));
    const toAdd = SAMPLE_ACCOUNTS.filter((s) => !existingSecrets.has(s.secret.toUpperCase()));

    if (toAdd.length === 0) {
      showToast('Sample accounts are already added!');
      return;
    }

    const updated = [...toAdd, ...accounts];
    setAccounts(updated);
    showToast(`Loaded ${toAdd.length} demo test accounts!`);
  };

  // Clear all accounts
  const handleClearAll = () => {
    setAccounts([]);
    showToast('All accounts cleared.');
  };

  // Import accounts
  const handleImportAccounts = (imported: TOTPAccount[]) => {
    setAccounts(imported);
  };

  // Update settings
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const theme = ACCENT_THEMES[settings.accentColor];

  return (
    <div className="h-[100dvh] w-full bg-slate-950 flex justify-center text-slate-100 font-sans selection:bg-orange-500/30 selection:text-orange-200 overflow-hidden">
      {/* Mobile-first Shell: seamless on phones, elegant card container on desktop */}
      <div className="w-full max-w-md h-full flex flex-col bg-slate-950 relative border-x border-slate-900/60 shadow-2xl overflow-hidden">
        
        {/* Scrollable Main Screen Body */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 pt-3 pb-6 no-scrollbar touch-pan-y"
        >
          {activeTab === 'accounts' ? (
            <AccountsScreen
              accounts={accounts}
              accent={settings.accentColor}
              hapticEnabled={settings.hapticFeedback}
              hideByDefault={settings.hideCodesByDefault}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onDeleteAccount={handleDeleteAccount}
              onLoadDemoAccounts={handleLoadDemoAccounts}
              onCopyNotice={showToast}
              isFabVisible={isFabVisible}
              onOpenSettings={() => {
                setActiveTab('settings');
                // Reset scroll position to top when switching screens
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollTop = 0;
                }
              }}
            />
          ) : (
            <SettingsScreen
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              accounts={accounts}
              onImportAccounts={handleImportAccounts}
              onLoadSamples={handleLoadDemoAccounts}
              onClearAllAccounts={handleClearAll}
              onShowNotice={showToast}
              onBack={() => {
                setActiveTab('accounts');
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollTop = 0;
                }
              }}
            />
          )}
        </div>

        {/* Add Account Modal (QR Scanner & Manual Entry) */}
        <AddAccountModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddAccount={handleAddAccount}
          accent={settings.accentColor}
          hapticEnabled={settings.hapticFeedback}
        />

        {/* Native Toast Alert */}
        {toastMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-xs px-4 py-2.5 rounded-full bg-slate-900/95 border border-slate-700/80 text-white text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-150 pointer-events-none">
            <div className={`w-2 h-2 rounded-full ${theme.bgClass}`} />
            <span className="truncate">{toastMessage}</span>
          </div>
        )}

      </div>
    </div>
  );
}
