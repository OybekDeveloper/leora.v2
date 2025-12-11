import { create } from 'zustand';
import { startOfDay } from '@/utils/calendar';

/**
 * Finance uchun sana tanlash store'i
 * - selectedDate: null = barcha datalar ko'rinadi
 * - selectedDate: Date = faqat o'sha sana uchun filter
 * - Persist yo'q (app restart'da null bo'ladi)
 */
interface FinanceDateState {
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  clearSelectedDate: () => void;
}

export const useFinanceDateStore = create<FinanceDateState>((set) => ({
  selectedDate: null,
  setSelectedDate: (date) =>
    set({ selectedDate: date ? startOfDay(date) : null }),
  clearSelectedDate: () => set({ selectedDate: null }),
}));
