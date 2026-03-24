import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type InstanceStore = {
  activeInstanceUrl: string | null;
  lastUsedInstanceUrl: string | null;
  recentInstanceUrls: string[];
  setActiveInstance: (instanceUrl: string) => void;
  clearActiveInstance: () => void;
};

export const useInstanceStore = create<InstanceStore>()(
  persist(
    (set) => ({
      activeInstanceUrl: null,
      lastUsedInstanceUrl: null,
      recentInstanceUrls: [],
      setActiveInstance: (instanceUrl) =>
        set((state) => ({
          activeInstanceUrl: instanceUrl,
          lastUsedInstanceUrl: instanceUrl,
          recentInstanceUrls: [instanceUrl, ...state.recentInstanceUrls.filter((value) => value !== instanceUrl)].slice(
            0,
            5,
          ),
        })),
      clearActiveInstance: () =>
        set({
          activeInstanceUrl: null,
        }),
    }),
    {
      name: 'fedisuite.instance-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
