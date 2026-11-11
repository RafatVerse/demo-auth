export type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-512';

export interface TOTPAccount {
  id: string;
  issuer: string;
  account: string;
  secret: string;
  algorithm: HashAlgorithm;
  digits: number;
  period: number;
  color?: string;
  createdAt: number;
}

export type AccentColor = 'orange' | 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'cyan';

export interface AppSettings {
  accentColor: AccentColor;
  themeMode: 'dark' | 'light' | 'system';
  hapticFeedback: boolean;
  hideCodesByDefault: boolean;
}
