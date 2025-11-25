// stores/useSettingsStore.ts
import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { mmkvStorageAdapter } from '@/utils/storage';

export type SupportedLanguage = 'en' | 'ru' | 'uz' | 'ar' | 'tr';

interface SettingsStore {
  theme: 'light' | 'dark' | 'auto';
  currency: string;
  currencySymbol: string;
  language: SupportedLanguage;
  notifications: {
    enabled: boolean;
    taskReminders: boolean;
    billReminders: boolean;
    focusModeAlerts: boolean;
  };
  focusMode: {
    defaultDuration: number; // in minutes
    breakDuration: number;
    longBreakDuration: number;
    sessionsBeforeLongBreak: number;
  };
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setCurrency: (currency: string, symbol: string) => void;
  setLanguage: (language: SupportedLanguage) => void;
  updateNotificationSettings: (settings: Partial<SettingsStore['notifications']>) => void;
  updateFocusModeSettings: (settings: Partial<SettingsStore['focusMode']>) => void;
  resetToDefaults: () => void;
}

type SettingsState = Omit<
  SettingsStore,
  | 'setTheme'
  | 'setCurrency'
  | 'setLanguage'
  | 'updateNotificationSettings'
  | 'updateFocusModeSettings'
  | 'resetToDefaults'
>;

const defaultSettings: SettingsState = {
  theme: 'auto' as const,
  currency: 'USD',
  currencySymbol: '$',
  language: 'en',
  notifications: {
    enabled: true,
    taskReminders: true,
    billReminders: true,
    focusModeAlerts: true,
  },
  focusMode: {
    defaultDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
  },
};

const createSettingsStore: StateCreator<SettingsStore> = (set) => ({
  ...defaultSettings,

  setTheme: (theme) => set({ theme }),

  setCurrency: (currency, symbol) => set({ currency, currencySymbol: symbol }),

  setLanguage: (language) => set({ language }),

  updateNotificationSettings: (settings) =>
    set((state) => ({
      notifications: { ...state.notifications, ...settings },
    })),

  updateFocusModeSettings: (settings) =>
    set((state) => ({
      focusMode: { ...state.focusMode, ...settings },
    })),

  resetToDefaults: () => set(defaultSettings),
});

export const useSettingsStore = create<SettingsStore>()(
  persist(createSettingsStore, {
    name: 'settings-storage',
    storage: createJSONStorage(() => mmkvStorageAdapter),
    version: 1,
  })
);
