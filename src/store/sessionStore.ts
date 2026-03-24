import { create } from 'zustand';

import type { QueueFilter } from '../utils/post';

type SessionUser = {
  id: number;
  email: string;
  isAdmin: boolean;
};

type SessionStore = {
  isHydrating: boolean;
  token: string | null;
  user: SessionUser | null;
  language: string;
  queueFilter: QueueFilter;
  setHydrating: (isHydrating: boolean) => void;
  setSession: (input: { token: string; user: SessionUser; language?: string }) => void;
  setLanguage: (language: string) => void;
  setQueueFilter: (queueFilter: QueueFilter) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionStore>((set) => ({
  isHydrating: true,
  token: null,
  user: null,
  language: 'de',
  queueFilter: 'scheduled',
  setHydrating: (isHydrating) => set({ isHydrating }),
  setSession: ({ token, user, language }) =>
    set({
      token,
      user,
      language: language ?? 'de',
    }),
  setLanguage: (language) => set({ language }),
  setQueueFilter: (queueFilter) => set({ queueFilter }),
  clearSession: () =>
    set({
      token: null,
      user: null,
    }),
}));
