import { create } from 'zustand';

export type UndoEntityType =
  | 'task'
  | 'goal'
  | 'habit'
  | 'budget'
  | 'transaction'
  | 'account'
  | 'debt';

export interface PendingDeletion<T = unknown> {
  id: string;
  entityType: UndoEntityType;
  items: T[];
  itemIds: string[];
  timestamp: number;
  timerId: ReturnType<typeof setTimeout> | null;
}

interface UndoDeleteState {
  pendingDeletion: PendingDeletion | null;
  remainingSeconds: number;
  isVisible: boolean;

  // Actions
  scheduleDeletion: <T>(
    entityType: UndoEntityType,
    items: T[],
    itemIds: string[],
    onConfirmDelete: () => void,
    timeoutSeconds?: number
  ) => void;
  undoDeletion: () => void;
  clearPending: () => void;
  setRemainingSeconds: (seconds: number) => void;
}

const UNDO_TIMEOUT_SECONDS = 5;

export const useUndoDeleteStore = create<UndoDeleteState>((set, get) => {
  let countdownInterval: ReturnType<typeof setInterval> | null = null;

  const clearCountdown = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  };

  const startCountdown = (seconds: number) => {
    clearCountdown();
    set({ remainingSeconds: seconds });

    countdownInterval = setInterval(() => {
      const current = get().remainingSeconds;
      if (current <= 1) {
        clearCountdown();
        set({ remainingSeconds: 0 });
      } else {
        set({ remainingSeconds: current - 1 });
      }
    }, 1000);
  };

  return {
    pendingDeletion: null,
    remainingSeconds: 0,
    isVisible: false,

    scheduleDeletion: <T>(
      entityType: UndoEntityType,
      items: T[],
      itemIds: string[],
      onConfirmDelete: () => void,
      timeoutSeconds = UNDO_TIMEOUT_SECONDS
    ) => {
      // Clear any existing pending deletion
      const existing = get().pendingDeletion;
      if (existing?.timerId) {
        clearTimeout(existing.timerId);
      }
      clearCountdown();

      const deletionId = `${entityType}-${Date.now()}`;

      // Set up timer for permanent deletion
      const timerId = setTimeout(() => {
        const current = get().pendingDeletion;
        if (current?.id === deletionId) {
          // Execute the permanent delete
          onConfirmDelete();
          // Clear the pending state
          clearCountdown();
          set({
            pendingDeletion: null,
            isVisible: false,
            remainingSeconds: 0,
          });
        }
      }, timeoutSeconds * 1000);

      const pendingDeletion: PendingDeletion<T> = {
        id: deletionId,
        entityType,
        items,
        itemIds,
        timestamp: Date.now(),
        timerId,
      };

      set({
        pendingDeletion: pendingDeletion as PendingDeletion,
        isVisible: true,
        remainingSeconds: timeoutSeconds,
      });

      // Start countdown
      startCountdown(timeoutSeconds);
    },

    undoDeletion: () => {
      const pending = get().pendingDeletion;
      if (pending?.timerId) {
        clearTimeout(pending.timerId);
      }
      clearCountdown();

      // The items are already in memory in pendingDeletion.items
      // The caller should restore them from there
      set({
        pendingDeletion: null,
        isVisible: false,
        remainingSeconds: 0,
      });
    },

    clearPending: () => {
      const pending = get().pendingDeletion;
      if (pending?.timerId) {
        clearTimeout(pending.timerId);
      }
      clearCountdown();

      set({
        pendingDeletion: null,
        isVisible: false,
        remainingSeconds: 0,
      });
    },

    setRemainingSeconds: (seconds) => {
      set({ remainingSeconds: seconds });
    },
  };
});

// Helper hook to get pending items of a specific type
export function usePendingDeletionIds(entityType: UndoEntityType): string[] {
  return useUndoDeleteStore((state) => {
    if (state.pendingDeletion?.entityType === entityType) {
      return state.pendingDeletion.itemIds;
    }
    return [];
  });
}
