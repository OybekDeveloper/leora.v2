import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Kategoriya bo'yicha sahifa indekslari
const FINANCE_PAGES = [0, 1, 2, 3];    // Budget, Debt, Analytics, Accounts
const PLANNER_PAGES = [4, 5, 6, 7];    // Goals, Tasks, Habits, Focus
const INSIGHT_PAGES = [8, 9, 10, 11];  // AI Analysis, Voice, Reminders, Predictions

// Har bir kategoriyadan 1 ta random tanlash
const getRandomFromCategory = (): number[] => {
  const financeIndex = FINANCE_PAGES[Math.floor(Math.random() * FINANCE_PAGES.length)];
  const plannerIndex = PLANNER_PAGES[Math.floor(Math.random() * PLANNER_PAGES.length)];
  const insightIndex = INSIGHT_PAGES[Math.floor(Math.random() * INSIGHT_PAGES.length)];
  return [financeIndex, plannerIndex, insightIndex];
};

interface OnboardingStore {
  hasSeenOnboarding: boolean;

  completeOnboarding: () => void;
  resetOnboarding: () => void;
  getCurrentPageIndices: () => number[];
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,

      completeOnboarding: () => {
        set({
          hasSeenOnboarding: true,
        });
      },

      resetOnboarding: () => {
        set({
          hasSeenOnboarding: false,
        });
      },

      // Har safar 3 ta sahifa: 1 finance, 1 planner, 1 insight
      getCurrentPageIndices: () => {
        return getRandomFromCategory();
      },
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
