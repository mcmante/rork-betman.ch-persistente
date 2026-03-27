export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  success: string;
  error: string;
  warning: string;
  cardBackground: string;
  inputBackground: string;
  tabBar: string;
  tabBarBorder: string;
  headerBackground: string;
  gold: string;
  silver: string;
  bronze: string;
}

export const lightTheme: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  primary: '#1E40AF',
  primaryLight: '#3B82F6',
  secondary: '#059669',
  accent: '#F59E0B',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  cardBackground: '#FFFFFF',
  inputBackground: '#F1F5F9',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  headerBackground: '#1E40AF',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

export const darkTheme: ThemeColors = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceElevated: '#334155',
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  secondary: '#10B981',
  accent: '#FBBF24',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  border: '#334155',
  borderLight: '#475569',
  success: '#34D399',
  error: '#F87171',
  warning: '#FBBF24',
  cardBackground: '#1E293B',
  inputBackground: '#334155',
  tabBar: '#1E293B',
  tabBarBorder: '#334155',
  headerBackground: '#1E293B',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};
