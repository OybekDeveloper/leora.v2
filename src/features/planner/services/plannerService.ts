import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import type { Task, TaskStatus } from '@/domain/planner/types';

const adapterSectionFromDate = (date: Date) => {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

export const plannerService = {
  createTaskFromVoice(payload: {
    title: string;
    date: Date;
    durationLabel?: string;
    context?: string;
  }): Task {
    const domainStore = usePlannerDomainStore.getState();
    const isoDate = payload.date.toISOString();
    return domainStore.createTask({
      userId: 'local-user',
      title: payload.title,
      status: 'planned',
      priority: 'medium',
      dueDate: isoDate,
      startDate: isoDate,
      timeOfDay: payload.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estimatedMinutes: payload.durationLabel ? parseInt(payload.durationLabel, 10) : undefined,
      energyLevel: 2,
      context: payload.context ?? '@voice',
    });
  },

  createHabitFromVoice(title: string, schedule?: string) {
    const domainStore = usePlannerDomainStore.getState();
    domainStore.createHabit({
      userId: 'local-user',
      title,
      habitType: 'personal',
      status: 'active',
      frequency: 'weekly',
      completionMode: 'boolean',
      daysOfWeek: schedule === 'morning' ? [1, 2, 3, 4, 5] : undefined,
    });
  },

  createGoalFromVoice(title: string, deadlineLabel?: string) {
    const domainStore = usePlannerDomainStore.getState();
    domainStore.createGoal({
      userId: 'local-user',
      title,
      goalType: 'personal',
      status: 'active',
      metricType: 'none',
      startDate: new Date().toISOString(),
      targetDate: deadlineLabel,
    });
  },

  startFocusOnTask(taskId: string) {
    const domainStore = usePlannerDomainStore.getState();
    domainStore.startFocus({ taskId, plannedMinutes: 25 });
  },

  setTaskStatus(taskId: string, status: TaskStatus) {
    const domainStore = usePlannerDomainStore.getState();
    domainStore.setTaskStatus(taskId, status);
  },
};
