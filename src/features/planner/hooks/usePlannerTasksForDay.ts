import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import type { Habit, Task } from '@/domain/planner/types';
import { mapDomainTaskToPlannerTask, mapHistoryEntryToPlannerTask, type PlannerTaskCard } from '@/features/planner/taskAdapters';
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

const isHabitDueOnDate = (habit: Habit, normalizedDay: Date) => {
  if (habit.status !== 'active') return false;
  const dayOfWeek = normalizedDay.getDay();
  if (habit.daysOfWeek && habit.daysOfWeek.length > 0) {
    return habit.daysOfWeek.includes(dayOfWeek);
  }
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'weekly') return true;
  return true;
};

export const usePlannerTasksForDay = (expandedMap: Record<string, boolean>) => {
  const { tasks, habits, taskHistory } = usePlannerDomainStore(
    useShallow((state) => ({
      tasks: state.tasks,
      habits: state.habits,
      taskHistory: state.taskHistory,
    })),
  );
  const selectedDay = useSelectedDayStore((state) => state.selectedDate);
  const normalizedDay = useMemo(() => startOfDay(selectedDay ?? new Date()), [selectedDay]);
  const dayStart = normalizedDay.getTime();
  const dayEnd = dayStart + DAY_MS;

  const activeTasks = useMemo(
    () => tasks.filter((task) => ACTIVE_TASK_STATUSES.has(task.status)),
    [tasks],
  );

  const plannerTasks = useMemo(
    () => activeTasks.map((task) => mapDomainTaskToPlannerTask(task, { expandedMap })),
    [activeTasks, expandedMap],
  );

  const tasksForDay = useMemo(
    () =>
      plannerTasks.filter((task) => {
        // Only include tasks that have a due date matching the selected day
        if (task.dueAt == null) return false;
        return task.dueAt >= dayStart && task.dueAt < dayEnd;
      }),
    [dayEnd, dayStart, plannerTasks],
  );

  const groupedTasks: GroupedTasks = useMemo(() => {
    const base: GroupedTasks = { morning: [], afternoon: [], evening: [] };
    tasksForDay.forEach((task) => {
      base[task.section].push(task);
    });
    return base;
  }, [tasksForDay]);

  const historyTasks = useMemo(() => {
    const entriesForDay = taskHistory.filter((entry) => {
      const ts = new Date(entry.timestamp).getTime();
      return Number.isFinite(ts) && ts >= dayStart && ts < dayEnd;
    });
    return entriesForDay
      .map((entry) => mapHistoryEntryToPlannerTask(entry, expandedMap))
      .sort(
        (a, b) =>
          (b.deletedAt ?? b.updatedAt ?? b.createdAt ?? 0) - (a.deletedAt ?? a.updatedAt ?? a.createdAt ?? 0),
      );
  }, [dayEnd, dayStart, expandedMap, taskHistory]);

  const habitsDueToday = useMemo(
    () => habits.filter((habit) => isHabitDueOnDate(habit, normalizedDay)).length,
    [habits, normalizedDay],
  );

  const goalsForDay = useMemo(() => {
    const goalIds = new Set<string>();
    tasksForDay.forEach((task) => {
      if (task.goalId) {
        goalIds.add(task.goalId);
      }
    });
    habits.forEach((habit) => {
      if (!isHabitDueOnDate(habit, normalizedDay)) {
        return;
      }
      if (habit.goalId) {
        goalIds.add(habit.goalId);
      }
      habit.linkedGoalIds?.forEach((id) => goalIds.add(id));
    });
    return goalIds;
  }, [habits, normalizedDay, tasksForDay]);

  const summaryCounts: SummaryCounts = useMemo(
    () => ({
      tasks: tasksForDay.length,
      habits: habitsDueToday,
      goals: goalsForDay.size,
    }),
    [goalsForDay.size, habitsDueToday, tasksForDay.length],
  );

  // Calculate progress stats for the selected day
  const progressStats: ProgressStats = useMemo(() => {
    const dayKey = normalizedDay.toISOString().split('T')[0]!;

    // Task progress: completed / total for the day
    const tasksTotal = tasksForDay.length;
    const tasksCompleted = tasksForDay.filter((t) => t.status === 'completed').length;
    const tasksProgress = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

    // Habit progress: completed / due for the day
    const habitsDueForDay = habits.filter((habit) => isHabitDueOnDate(habit, normalizedDay));
    const habitsTotal = habitsDueForDay.length;
    const habitsCompleted = habitsDueForDay.filter((habit) => {
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
  }, [habits, normalizedDay, tasksForDay]);

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
