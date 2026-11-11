import { AppSettings, TOTPAccount } from '../types';

const ACCOUNTS_STORAGE_KEY = 'vesdi_auth_accounts_v1';
const SETTINGS_STORAGE_KEY = 'vesdi_auth_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  accentColor: 'orange',
  themeMode: 'dark',
  hapticFeedback: true,
  hideCodesByDefault: false,
};

export const SAMPLE_ACCOUNTS: TOTPAccount[] = [
  {
    id: 'sample-google',
    issuer: 'Google',
    account: 'alex.dev@gmail.com',
    secret: 'JBSWY3DPEHPK3PXP', // Standard RFC test key
    algorithm: 'SHA-1',
    digits: 6,
    period: 30,
    color: '#4285F4',
    createdAt: Date.now() - 3600000 * 24,
  },
  {
    id: 'sample-github',
    issuer: 'GitHub',
    account: 'alex-developer',
    secret: 'HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ',
    algorithm: 'SHA-1',
    digits: 6,
    period: 30,
    color: '#6e5494',
    createdAt: Date.now() - 3600000 * 12,
  },
  {
    id: 'sample-discord',
    issuer: 'Discord',
    account: 'VesdiUser#1337',
    secret: 'MZXW6YTBOI======',
    algorithm: 'SHA-1',
    digits: 6,
    period: 30,
    color: '#5865F2',
    createdAt: Date.now() - 3600000 * 4,
  },
];

export function getStoredAccounts(): TOTPAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    console.error('Failed to load accounts from localStorage', e);
    return [];
  }
}

export function saveStoredAccounts(accounts: TOTPAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save accounts to localStorage', e);
  }
}

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load settings', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

/**
 * Exports all accounts as plain JSON string (No password required, as requested)
 */
export function exportAccountsJson(accounts: TOTPAccount[]): string {
  const exportPayload = {
    app: 'VESDI Auth',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    accountCount: accounts.length,
    accounts: accounts.map(acc => ({
      id: acc.id,
      issuer: acc.issuer,
      account: acc.account,
      secret: acc.secret,
      algorithm: acc.algorithm,
      digits: acc.digits,
      period: acc.period,
      color: acc.color,
      createdAt: acc.createdAt,
    })),
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Triggers a native file download in the browser
 */
export function downloadBackupFile(accounts: TOTPAccount[]): void {
  const json = exportAccountsJson(accounts);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `VESDI_Auth_Backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports accounts from an exported JSON string
 */
export function importAccountsJson(jsonStr: string, existingAccounts: TOTPAccount[]): { imported: number; updated: TOTPAccount[] } {
  const parsed = JSON.parse(jsonStr);
  let incoming: any[] = [];

  if (Array.isArray(parsed)) {
    incoming = parsed;
  } else if (parsed && Array.isArray(parsed.accounts)) {
    incoming = parsed.accounts;
  } else {
    throw new Error('Unrecognized backup format. Please select a valid VESDI Auth backup file.');
  }

  const existingMap = new Map(existingAccounts.map(a => [a.secret.toUpperCase().replace(/\s/g, ''), a]));
  let importedCount = 0;
  const resultList = [...existingAccounts];

  for (const item of incoming) {
    if (!item.secret || typeof item.secret !== 'string') continue;
    const cleanSecret = item.secret.toUpperCase().replace(/\s/g, '');
    if (!cleanSecret) continue;

    if (!existingMap.has(cleanSecret)) {
      const newAcc: TOTPAccount = {
        id: item.id || `acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        issuer: item.issuer || 'Unknown Service',
        account: item.account || 'Account',
        secret: cleanSecret,
        algorithm: item.algorithm === 'SHA-256' ? 'SHA-256' : item.algorithm === 'SHA-512' ? 'SHA-512' : 'SHA-1',
        digits: Number(item.digits) === 8 ? 8 : 6,
        period: Number(item.period) > 0 ? Number(item.period) : 30,
        color: item.color,
        createdAt: item.createdAt || Date.now(),
      };
      resultList.push(newAcc);
      existingMap.set(cleanSecret, newAcc);
      importedCount++;
    }
  }

  return { imported: importedCount, updated: resultList };
}
