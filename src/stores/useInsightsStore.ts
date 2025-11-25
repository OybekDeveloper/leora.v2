import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { mmkvStorageAdapter } from '@/utils/storage';
import type {
  Insight,
  InsightHistorySnapshot,
  InsightStatus,
} from '@/types/insights';

interface InsightsStoreState {
  insights: Insight[];
  history: InsightHistorySnapshot[];
  lastFetchedAt?: string;
  addInsights: (items: Insight[], options?: { replace?: boolean }) => void;
  upsertInsight: (item: Insight) => void;
  markInsightStatus: (id: string, status: InsightStatus) => void;
  clearExpired: (reference?: Date) => void;
  setLastFetchedAt: (isoTimestamp: string) => void;
}

const MAX_HISTORY = 200;

const createInsightsStore: StateCreator<InsightsStoreState> = (set, get) => ({
  insights: [],
  history: [],
  lastFetchedAt: undefined,

  addInsights: (items, options) =>
    set((state) => {
      const map = new Map<string, Insight>();
      const source = options?.replace ? [] : state.insights;
      source.forEach((insight) => map.set(insight.id, insight));
      items.forEach((insight) => map.set(insight.id, insight));
      return { insights: Array.from(map.values()) };
    }),

  upsertInsight: (item) =>
    set((state) => {
      const index = state.insights.findIndex((existing) => existing.id === item.id);
      if (index >= 0) {
        const next = [...state.insights];
        next[index] = item;
        return { insights: next };
      }
      return { insights: [item, ...state.insights] };
    }),

  markInsightStatus: (id, status) =>
    set((state) => {
      const snapshot: InsightHistorySnapshot = {
        id,
        status,
        date: new Date().toISOString(),
      };
      const filtered = state.history.filter((entry) => entry.id !== id);
      return {
        history: [snapshot, ...filtered].slice(0, MAX_HISTORY),
      };
    }),

  clearExpired: (reference) =>
    set((state) => {
      const now = reference ?? new Date();
      return {
        insights: state.insights.filter((insight) => {
          if (!insight.validUntil) {
            return true;
          }
          return new Date(insight.validUntil) >= now;
        }),
      };
    }),

  setLastFetchedAt: (isoTimestamp) => set({ lastFetchedAt: isoTimestamp }),
});

export const useInsightsStore = create<InsightsStoreState>()(
  persist(createInsightsStore, {
    name: 'insights-storage',
    storage: createJSONStorage(() => mmkvStorageAdapter),
    partialize: (state) => ({
      insights: state.insights,
      history: state.history,
      lastFetchedAt: state.lastFetchedAt,
    }),
  }),
);
