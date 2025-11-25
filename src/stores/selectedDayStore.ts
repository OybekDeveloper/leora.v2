import { create } from 'zustand';

import { startOfDay } from '@/utils/calendar';

type SelectedDayState = {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
};

export const useSelectedDayStore = create<SelectedDayState>((set) => ({
  selectedDate: startOfDay(new Date()),
  setSelectedDate: (date: Date) => set({ selectedDate: startOfDay(date) }),
}));
