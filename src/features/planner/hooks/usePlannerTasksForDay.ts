import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import type { Habit, Task } from '@/domain/planner/types';
import { mapDomainTaskToPlannerTask, type PlannerTaskCard } from '@/features/planner/taskAdapters';
import type { PlannerTaskSection } from '@/types/planner';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { useSelectedDayStore } from '@/stores/selectedDayStore';
import { startOfDay } from '@/utils/calendar';

const DAY_MS = 24 * 60 * 60 * 1000;

type SummaryCounts = {
  tasks: number;
  habits: number;
  goals: number;
};

type ProgressStats = {
  tasksTotal: number;
  tasksCompleted: number;
  tasksProgress: number;
  habitsTotal: number;
  habitsCompleted: number;
  habitsProgress: number;
};

type GroupedTasks = Record<PlannerTaskSection, PlannerTaskCard[]>;

const ACTIVE_TASK_STATUSES = new Set<Task['status']>([
  'active',
  'in_progress',
  'planned',
  'overdue',
  'inbox',
  'completed',
]);

const isTaskVisible = (task: Task): boolean => {
  if (task.showStatus === 'deleted' || task.showStatus === 'archived') {
    return false;
  }
  return ACTIVE_TASK_STATUSES.has(task.status);
};

const isHabitVisibleOnDate = (habit: Habit, dayStart: number) => {
  if (habit.showStatus === 'archived' || habit.showStatus === 'deleted') return false;
  const createdAtDay = startOfDay(new Date(habit.createdAt)).getTime();
  return createdAtDay <= dayStart;
};

export const usePlannerTasksForDay = (expandedMap: Record<string, boolean>) => {
  const { tasks, habits } = usePlannerDomainStore(
    useShallow((state) => ({
      tasks: state.tasks,
      habits: state.habits,
    })),
  );
  const selectedDay = useSelectedDayStore((state) => state.selectedDate);
  const normalizedDay = useMemo(() => startOfDay(selectedDay ?? new Date()), [selectedDay]);
  const dayStart = normalizedDay.getTime();
  const dayEnd = dayStart + DAY_MS;

  const activeTasks = useMemo(
    () => tasks.filter(isTaskVisible),
    [tasks],
  );

  const plannerTasks = useMemo(
    () => activeTasks.map((task) => mapDomainTaskToPlannerTask(task, { expandedMap })),
    [activeTasks, expandedMap],
  );

  const tasksForDay = useMemo(
    () =>
      plannerTasks.filter((task) => {
        const createdAtTs = task.createdAt ?? 0;
        const createdAtDay = startOfDay(new Date(createdAtTs)).getTime();
        return createdAtDay <= dayStart;
      }),
    [dayStart, plannerTasks],
  );

  const groupedTasks: GroupedTasks = useMemo(() => {
    const base: GroupedTasks = { morning: [], afternoon: [], evening: [] };
    tasksForDay.forEach((task) => {
      base[task.section].push(task);
    });
    return base;
  }, [tasksForDay]);

  const archivedTasks = useMemo(
    () => tasks.filter((task) => task.showStatus === 'archived'),
    [tasks],
  );

  // Filter history tasks by createdAt date (show tasks created on or before the selected day)
  const historyTasks = useMemo(() => {
    return archivedTasks
      .filter((task) => {
        // Filter by createdAt - show tasks created on or before the selected day
        const createdAtTs = new Date(task.createdAt).getTime();
        const createdAtDay = startOfDay(new Date(createdAtTs)).getTime();
        return createdAtDay <= dayStart;
      })
      .map((task) => {
        const updatedAtTs = new Date(task.updatedAt).getTime();
        return mapDomainTaskToPlannerTask(task, {
          expandedMap,
          deletedAt: updatedAtTs,
        });
      })
      .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));
  }, [archivedTasks, dayStart, expandedMap]);

  const habitsForDay = useMemo(
    () => habits.filter((habit) => isHabitVisibleOnDate(habit, dayStart)),
    [habits, dayStart],
  );

  const goalsForDay = useMemo(() => {
    const goalIds = new Set<string>();
    tasksForDay.forEach((task) => {
      if (task.goalId) {
        goalIds.add(task.goalId);
      }
    });
    habitsForDay.forEach((habit) => {
      if (habit.goalId) {
        goalIds.add(habit.goalId);
      }
      habit.linkedGoalIds?.forEach((id) => goalIds.add(id));
    });
    return goalIds;
  }, [habitsForDay, tasksForDay]);

  const summaryCounts: SummaryCounts = useMemo(
    () => ({
      tasks: tasksForDay.length,
      habits: habitsForDay.length,
      goals: goalsForDay.size,
    }),
    [goalsForDay.size, habitsForDay.length, tasksForDay.length],
  );

  const progressStats: ProgressStats = useMemo(() => {
    const dayKey = normalizedDay.toISOString().split('T')[0]!;
    const tasksTotal = tasksForDay.length;
    const tasksCompleted = tasksForDay.filter((t) => t.status === 'completed').length;
    const tasksProgress = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
    const habitsTotal = habitsForDay.length;
    const habitsCompleted = habitsForDay.filter((habit) => {
      if (!habit.completionHistory) return false;
      const entry = habit.completionHistory[dayKey];
      const status = typeof entry === 'string' ? entry : entry?.status;
      return status === 'done';
    }).length;
    const habitsProgress = habitsTotal > 0 ? Math.round((habitsCompleted / habitsTotal) * 100) : 0;

    return {
      tasksTotal,
      tasksCompleted,
      tasksProgress,
      habitsTotal,
      habitsCompleted,
      habitsProgress,
    };
  }, [habitsForDay, normalizedDay, tasksForDay]);

  return {
    normalizedDay,
    dayStart,
    dayEnd,
    groupedTasks,
    tasksForDay,
    historyTasks,
    summaryCounts,
    progressStats,
  };
};
