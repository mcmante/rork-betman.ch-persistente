import { useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { translations, Language } from '@/constants/i18n';
import { ThemeColors, ThemeMode, lightTheme, darkTheme } from '@/constants/theme';
import { setAuthToken } from '@/lib/trpc';

interface UserData {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'PLAYER' | 'CONFIG';
  preferredLanguage: Language;
  preferredTheme: ThemeMode;
  favoriteTeamId: string | null;
}

interface AppContextValue {
  user: UserData | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  language: Language;
  themeMode: ThemeMode;
  theme: ThemeColors;
  isDark: boolean;
  t: typeof translations.en | typeof translations.it;
  selectedTournamentId: string | null;
  login: (token: string, user: UserData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: UserData) => void;
  setLanguage: (lang: Language) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setSelectedTournament: (id: string | null) => void;
}

const STORAGE_KEYS = {
  TOKEN: 'betman_token',
  USER: 'betman_user',
  LANGUAGE: 'betman_language',
  THEME: 'betman_theme',
  TOURNAMENT: 'betman_tournament',
};

export const [AppProvider, useApp] = createContextHook<AppContextValue>(() => {
  const systemColorScheme = useColorScheme();
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguageState] = useState<Language>('en');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const [storedToken, storedUser, storedLang, storedTheme, storedTournament] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
          AsyncStorage.getItem(STORAGE_KEYS.THEME),
          AsyncStorage.getItem(STORAGE_KEYS.TOURNAMENT),
        ]);

        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser) as UserData;
          setToken(storedToken);
          setUser(userData);
          setAuthToken(storedToken);
          setLanguageState(userData.preferredLanguage || 'en');
          setThemeModeState(userData.preferredTheme || 'system');
        } else {
          if (storedLang) setLanguageState(storedLang as Language);
          if (storedTheme) setThemeModeState(storedTheme as ThemeMode);
        }

        if (storedTournament) setSelectedTournamentId(storedTournament);
      } catch (error) {
        console.log('Error loading stored data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredData();
  }, []);

  const login = useCallback(async (newToken: string, userData: UserData) => {
    setToken(newToken);
    setUser(userData);
    setAuthToken(newToken);
    setLanguageState(userData.preferredLanguage);
    setThemeModeState(userData.preferredTheme);
    
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN, newToken),
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData)),
    ]);
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.USER),
    ]);
  }, []);

  const updateUser = useCallback((userData: UserData) => {
    setUser(userData);
    AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, mode);
  }, []);

  const setSelectedTournament = useCallback((id: string | null) => {
    setSelectedTournamentId(id);
    if (id) {
      AsyncStorage.setItem(STORAGE_KEYS.TOURNAMENT, id);
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.TOURNAMENT);
    }
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const theme = useMemo(() => (isDark ? darkTheme : lightTheme), [isDark]);
  const t = useMemo(() => translations[language], [language]);

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    language,
    themeMode,
    theme,
    isDark,
    t,
    selectedTournamentId,
    login,
    logout,
    updateUser,
    setLanguage,
    setThemeMode,
    setSelectedTournament,
  };
});
