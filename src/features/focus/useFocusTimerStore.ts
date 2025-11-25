import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorageAdapter } from '@/utils/storage';

export type FocusTimerState = 'ready' | 'running' | 'paused';

interface FocusTimerStore {
  totalSeconds: number;
  elapsedSeconds: number;
  accumulatedSeconds: number;
  timerState: FocusTimerState;
  startedAt: number | null;
  resumeAnchor: number | null;
  start: (now?: number) => void;
  pause: (now?: number) => void;
  resume: (now?: number) => void;
  reset: (nextTotalSeconds?: number) => void;
  syncElapsed: (now?: number) => number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const useFocusTimerStore = create<FocusTimerStore>()(
  persist(
    (set, get) => {
      let ticker: ReturnType<typeof setInterval> | null = null;

      const stopTicker = () => {
        if (ticker) {
          clearInterval(ticker);
          ticker = null;
        }
      };

      const startTicker = () => {
        if (ticker) return;
        ticker = setInterval(() => {
          const state = get();
          if (state.timerState !== 'running' || state.resumeAnchor == null) {
            if (state.timerState !== 'running') stopTicker();
            return;
          }

          const now = Date.now();
          const delta = Math.max(0, Math.floor((now - state.resumeAnchor) / 1000));
          const next = clamp(state.accumulatedSeconds + delta, 0, state.totalSeconds);

          if (next >= state.totalSeconds) {
            stopTicker();
            set({
              timerState: 'ready',
              elapsedSeconds: state.totalSeconds,
              accumulatedSeconds: state.totalSeconds,
              resumeAnchor: null,
            });
            return;
          }

          if (next !== state.elapsedSeconds) {
            set({ elapsedSeconds: next });
          }
        }, 1000);
      };

      return {
        totalSeconds: 25 * 60,
        elapsedSeconds: 0,
        accumulatedSeconds: 0,
        timerState: 'ready',
        startedAt: null,
        resumeAnchor: null,
        start: (now = Date.now()) => {
          const total = Math.max(1, get().totalSeconds);
          set({
            timerState: 'running',
            startedAt: now,
            resumeAnchor: now,
            elapsedSeconds: 0,
            accumulatedSeconds: 0,
            totalSeconds: total,
          });
          startTicker();
        },
        pause: (now = Date.now()) => {
          const state = get();
          if (state.timerState !== 'running' || state.resumeAnchor == null) return;
          const delta = Math.max(0, Math.floor((now - state.resumeAnchor) / 1000));
          const next = clamp(state.accumulatedSeconds + delta, 0, state.totalSeconds);
          set({
            timerState: 'paused',
            elapsedSeconds: next,
            accumulatedSeconds: next,
            resumeAnchor: null,
          });
          stopTicker();
        },
        resume: (now = Date.now()) => {
          const state = get();
          if (state.timerState !== 'paused') return;
          set({
            timerState: 'running',
            resumeAnchor: now,
            startedAt: state.startedAt ?? now,
          });
          startTicker();
        },
        reset: (nextTotalSeconds) => {
          const total = nextTotalSeconds ?? get().totalSeconds;
          set({
            totalSeconds: Math.max(1, total),
            elapsedSeconds: 0,
            accumulatedSeconds: 0,
            timerState: 'ready',
            startedAt: null,
            resumeAnchor: null,
          });
          stopTicker();
        },
        syncElapsed: (now = Date.now()) => {
          const state = get();
          if (state.timerState !== 'running' || state.resumeAnchor == null) {
            return state.elapsedSeconds;
          }
          const delta = Math.max(0, Math.floor((now - state.resumeAnchor) / 1000));
          const next = clamp(state.accumulatedSeconds + delta, 0, state.totalSeconds);

          if (next >= state.totalSeconds) {
            set({
              timerState: 'ready',
              elapsedSeconds: state.totalSeconds,
              accumulatedSeconds: state.totalSeconds,
              resumeAnchor: null,
            });
            stopTicker();
            return state.totalSeconds;
          }

          if (next !== state.elapsedSeconds) {
            set({ elapsedSeconds: next });
          }

          return next;
        },
      };
    },
    {
      name: 'focus-timer-store',
      version: 1,
      storage: createJSONStorage(() => mmkvStorageAdapter),
    },
  ),
);
