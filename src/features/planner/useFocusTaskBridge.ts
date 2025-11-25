import { create } from 'zustand';

import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';

type FocusStartOptions = {
  technique?: string;
  durationMinutes?: number;
};

type FocusBridgeState = {
  focusedTaskId?: string;
  activeSessionId?: string;
  lastCompletedTaskId?: string;
  startFocusForTask: (taskId: string, options?: FocusStartOptions) => void;
  completeFocusedTask: (outcome: 'done' | 'move') => void;
  clearFocusedTask: () => void;
};

export const usePlannerFocusBridge = create<FocusBridgeState>((set, get) => ({
  focusedTaskId: undefined,
  activeSessionId: undefined,
  lastCompletedTaskId: undefined,
  startFocusForTask: (taskId, options) => {
    const session = usePlannerDomainStore.getState().startFocus({
      taskId,
      plannedMinutes: options?.durationMinutes,
    });
    set({ focusedTaskId: taskId, activeSessionId: session.id });
  },
  completeFocusedTask: (outcome) =>
    set((state) => {
      const plannerStore = usePlannerDomainStore.getState();
      if (state.activeSessionId) {
        if (outcome === 'done') {
          plannerStore.finishFocus(state.activeSessionId);
        } else {
          plannerStore.cancelFocus(state.activeSessionId);
        }
      }
      if (state.focusedTaskId) {
        if (outcome === 'done') {
          plannerStore.completeTask(state.focusedTaskId);
        } else if (outcome === 'move') {
          const task = plannerStore.tasks.find((t) => t.id === state.focusedTaskId);
          const baseDate = task?.dueDate ? new Date(task.dueDate) : new Date();
          baseDate.setDate(baseDate.getDate() + 1);
          plannerStore.scheduleTask(state.focusedTaskId, {
            dueDate: baseDate.toISOString(),
            timeOfDay: task?.timeOfDay,
          });
        }
      }
      return {
        focusedTaskId: undefined,
        activeSessionId: undefined,
        lastCompletedTaskId: state.focusedTaskId ?? state.lastCompletedTaskId,
      };
    }),
  clearFocusedTask: () => set({ focusedTaskId: undefined, activeSessionId: undefined }),
}));
