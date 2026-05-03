import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AppSettingsStore = {
  language: 'de' | 'en';
  theme: 'dark' | 'light' | 'system';
  setLanguage: (language: 'de' | 'en') => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
};

export const useAppSettingsStore = create<AppSettingsStore>()(
  persist(
    (set) => ({
      language: 'de',
      theme: 'system',
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'fedisuite.app-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
