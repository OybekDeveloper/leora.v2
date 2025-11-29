import { create } from 'zustand';

export type SelectableEntityType = 'task' | 'goal' | 'habit' | 'budget';

type SelectionState = {
  isSelectionMode: boolean;
  selectedIds: string[];
  entityType: SelectableEntityType | null;
  isHistoryMode: boolean; // true when selecting from delete history

  enterSelectionMode: (entityType: SelectableEntityType, isHistory?: boolean) => void;
  exitSelectionMode: () => void;
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
  isSelected: (id: string) => boolean;
  getSelectedCount: () => number;
};

export const useSelectionStore = create<SelectionState>((set, get) => ({
  isSelectionMode: false,
  selectedIds: [],
  entityType: null,
  isHistoryMode: false,

  enterSelectionMode: (entityType, isHistory = false) =>
    set({
      isSelectionMode: true,
      entityType,
      isHistoryMode: isHistory,
      selectedIds: [],
    }),

  exitSelectionMode: () =>
    set({
      isSelectionMode: false,
      selectedIds: [],
      entityType: null,
      isHistoryMode: false,
    }),

  toggleSelection: (id) =>
    set((state) => {
      const isCurrentlySelected = state.selectedIds.includes(id);
      return {
        selectedIds: isCurrentlySelected
          ? state.selectedIds.filter((selectedId) => selectedId !== id)
          : [...state.selectedIds, id],
      };
    }),

  selectAll: (ids) =>
    set({
      selectedIds: ids,
    }),

  deselectAll: () =>
    set({
      selectedIds: [],
    }),

  isSelected: (id) => get().selectedIds.includes(id),

  getSelectedCount: () => get().selectedIds.length,
}));
