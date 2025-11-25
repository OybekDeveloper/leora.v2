import { create } from 'zustand';

export type FilterState = {
  category: string;
  account: string;
  type: string;
  minAmount: string;
  maxAmount: string;
  dateFrom: string;
  dateTo: string;
};

const createInitialState = (): FilterState => ({
  category: 'all',
  account: 'all',
  type: 'all',
  minAmount: '',
  maxAmount: '',
  dateFrom: '',
  dateTo: '',
});

interface TransactionFilterStore {
  filters: FilterState;
  setFilters: (next: FilterState) => void;
  resetFilters: () => void;
}

export const useTransactionFilterStore = create<TransactionFilterStore>((set) => ({
  filters: createInitialState(),
  setFilters: (next) => set({ filters: next }),
  resetFilters: () => set({ filters: createInitialState() }),
}));
