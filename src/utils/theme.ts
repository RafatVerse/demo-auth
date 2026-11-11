import { AccentColor } from '../types';

export interface AccentThemeConfig {
  name: string;
  hex: string;
  bgClass: string;
  bgLightClass: string;
  textClass: string;
  borderClass: string;
  ringClass: string;
  gradient: string;
  shadowClass: string;
}

export const ACCENT_THEMES: Record<AccentColor, AccentThemeConfig> = {
  orange: {
    name: 'Vibrant Orange',
    hex: '#FF6B00',
    bgClass: 'bg-orange-500',
    bgLightClass: 'bg-orange-500/15 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400',
    textClass: 'text-orange-500 dark:text-orange-400',
    borderClass: 'border-orange-500',
    ringClass: 'ring-orange-500/40',
    gradient: 'from-orange-500 to-amber-500',
    shadowClass: 'shadow-orange-500/30',
  },
  blue: {
    name: 'Classic iOS Blue',
    hex: '#007AFF',
    bgClass: 'bg-blue-600',
    bgLightClass: 'bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
    textClass: 'text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-500',
    ringClass: 'ring-blue-500/40',
    gradient: 'from-blue-600 to-indigo-600',
    shadowClass: 'shadow-blue-500/25',
  },
  indigo: {
    name: 'Electric Indigo',
    hex: '#6366F1',
    bgClass: 'bg-indigo-600',
    bgLightClass: 'bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    textClass: 'text-indigo-600 dark:text-indigo-400',
    borderClass: 'border-indigo-500',
    ringClass: 'ring-indigo-500/40',
    gradient: 'from-indigo-600 to-purple-600',
    shadowClass: 'shadow-indigo-500/25',
  },
  emerald: {
    name: 'Emerald Mint',
    hex: '#10B981',
    bgClass: 'bg-emerald-600',
    bgLightClass: 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-500',
    ringClass: 'ring-emerald-500/40',
    gradient: 'from-emerald-600 to-teal-600',
    shadowClass: 'shadow-emerald-500/25',
  },
  amber: {
    name: 'Sunset Amber',
    hex: '#F59E0B',
    bgClass: 'bg-amber-500',
    bgLightClass: 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
    textClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500',
    ringClass: 'ring-amber-500/40',
    gradient: 'from-amber-500 to-orange-600',
    shadowClass: 'shadow-amber-500/25',
  },
  rose: {
    name: 'Ruby Rose',
    hex: '#F43F5E',
    bgClass: 'bg-rose-500',
    bgLightClass: 'bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
    textClass: 'text-rose-600 dark:text-rose-400',
    borderClass: 'border-rose-500',
    ringClass: 'ring-rose-500/40',
    gradient: 'from-rose-500 to-pink-600',
    shadowClass: 'shadow-rose-500/25',
  },
  purple: {
    name: 'Cyber Purple',
    hex: '#8B5CF6',
    bgClass: 'bg-purple-600',
    bgLightClass: 'bg-purple-500/15 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
    textClass: 'text-purple-600 dark:text-purple-400',
    borderClass: 'border-purple-500',
    ringClass: 'ring-purple-500/40',
    gradient: 'from-purple-600 to-fuchsia-600',
    shadowClass: 'shadow-purple-500/25',
  },
  cyan: {
    name: 'Neon Cyan',
    hex: '#06B6D4',
    bgClass: 'bg-cyan-500',
    bgLightClass: 'bg-cyan-500/15 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
    textClass: 'text-cyan-600 dark:text-cyan-400',
    borderClass: 'border-cyan-500',
    ringClass: 'ring-cyan-500/40',
    gradient: 'from-cyan-500 to-blue-600',
    shadowClass: 'shadow-cyan-500/25',
  },
};
