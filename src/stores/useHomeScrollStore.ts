import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorageAdapter } from '@/utils/storage';

interface HomeScrollState {
  scrollY: number;
  setScrollY: (value: number) => void;
}

const createHomeScrollStore: StateCreator<HomeScrollState> = (set) => ({
  scrollY: 0,
  setScrollY: (value) => set({ scrollY: value }),
});

export const useHomeScrollStore = create<HomeScrollState>()(
  persist(createHomeScrollStore, {
    name: 'home-scroll-storage',
    storage: createJSONStorage(() => mmkvStorageAdapter),
  })
);
