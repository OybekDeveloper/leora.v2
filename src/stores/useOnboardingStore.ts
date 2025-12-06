import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingStore {
  hasSeenOnboarding: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,

      completeOnboarding: () => {
        set({ hasSeenOnboarding: true });
      },

      resetOnboarding: () => {
        set({ hasSeenOnboarding: false });
      },
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
