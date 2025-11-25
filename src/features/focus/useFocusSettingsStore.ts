import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  DEFAULT_LOCKS,
  DEFAULT_MOTIVATION,
  DEFAULT_TOGGLES,
  FocusStats,
  LockId,
  MotivationId,
  TECHNIQUES,
  TechniqueKey,
  ToggleId,
} from './types';
import { mmkvStorageAdapter } from '@/utils/storage';

interface FocusSettingsStore {
  toggles: Record<ToggleId, boolean>;
  motivation: Record<MotivationId, boolean>;
  locks: Record<LockId, boolean>;
  techniqueKey: TechniqueKey;
  workMinutes: number;
  breakMinutes: number;
  sessionsUntilBigBreak: number;
  bigBreakMinutes: number;
  stats: FocusStats;
  toggleSetting: (id: ToggleId) => void;
  toggleMotivation: (id: MotivationId) => void;
  toggleLock: (id: LockId) => void;
  setTechnique: (key: TechniqueKey) => void;
  setWorkMinutes: (minutes: number) => void;
  setBreakMinutes: (minutes: number) => void;
  setSessionsUntilBigBreak: (count: number) => void;
  setBigBreakMinutes: (minutes: number) => void;
  recordSession: (focusSeconds: number, completed: boolean) => void;
  resetSettings: () => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const createDefaults = () => ({
  toggles: { ...DEFAULT_TOGGLES },
  motivation: { ...DEFAULT_MOTIVATION },
  locks: { ...DEFAULT_LOCKS },
  techniqueKey: TECHNIQUES[0].key,
  workMinutes: TECHNIQUES[0].workMinutes,
  breakMinutes: TECHNIQUES[0].breakMinutes,
  sessionsUntilBigBreak: 4,
  bigBreakMinutes: 15,
  stats: { focusSeconds: 0, sessionsCompleted: 0, sessionsSkipped: 0 } as FocusStats,
});

export const useFocusSettingsStore = create<FocusSettingsStore>()(
  persist(
    (set) => ({
      ...createDefaults(),
      toggleSetting: (id) =>
        set((state) => ({
          toggles: { ...state.toggles, [id]: !state.toggles[id] },
        })),
      toggleMotivation: (id) =>
        set((state) => ({
          motivation: { ...state.motivation, [id]: !state.motivation[id] },
        })),
      toggleLock: (id) =>
        set((state) => ({
          locks: { ...state.locks, [id]: !state.locks[id] },
        })),
      setTechnique: (key) => {
        const technique = TECHNIQUES.find((item) => item.key === key) ?? TECHNIQUES[0];
        set({
          techniqueKey: technique.key,
          workMinutes: technique.workMinutes,
          breakMinutes: technique.breakMinutes,
        });
      },
      setWorkMinutes: (minutes) => set({ workMinutes: clamp(minutes, 1, 24 * 60) }),
      setBreakMinutes: (minutes) => set({ breakMinutes: clamp(minutes, 0, 24 * 60) }),
      setSessionsUntilBigBreak: (count) => set({ sessionsUntilBigBreak: clamp(count, 1, 12) }),
      setBigBreakMinutes: (minutes) => set({ bigBreakMinutes: clamp(minutes, 1, 24 * 60) }),
      recordSession: (focusSeconds, completed) =>
        set((state) => ({
          stats: {
            focusSeconds: state.stats.focusSeconds + focusSeconds,
            sessionsCompleted: state.stats.sessionsCompleted + (completed ? 1 : 0),
            sessionsSkipped: state.stats.sessionsSkipped + (completed ? 0 : 1),
          },
        })),
      resetSettings: () => set(createDefaults()),
    }),
    {
      name: 'focus-settings-store',
      version: 2,
      storage: createJSONStorage(() => mmkvStorageAdapter),
      migrate: (persistedState, version) => {
        if (!persistedState) return persistedState as FocusSettingsStore | undefined;
        if (version < 2) {
          const previous = persistedState as FocusSettingsStore;
          return {
            ...previous,
            toggles: {
              ...previous.toggles,
              dynamicIsland: true,
            },
          };
        }
        return persistedState as FocusSettingsStore;
      },
    },
  ),
);
