/**
 * Progress Calculator Utilities
 *
 * Provides unified progress calculation logic for planner items
 * (tasks, habits, goals) to be used across the application.
 */

import type { Task, Habit, Goal } from '@/domain/planner/types';
import { startOfDay, isSameDay } from '@/utils/calendar';

const getHabitStatus = (entry?: Habit['completionHistory'] extends Record<string, infer V> ? V : never) =>
  typeof entry === 'string' ? entry : entry?.status;

/**
 * Calculate task completion progress for a given day.
 *
 * Returns 0 when there are no tasks scheduled to avoid phantom 100% scores.
 */
const isTaskExcluded = (task: Task) => task.status === 'archived' || task.status === 'deleted';

export function calculateTaskProgress(tasks: Task[], targetDate: Date = new Date()): number {
  const day = startOfDay(targetDate);

  const dayTasks = tasks.filter((task) => {
    if (isTaskExcluded(task)) return false;
    if (!task.dueDate) return false;
    const taskDate = startOfDay(new Date(task.dueDate));
    return isSameDay(taskDate, day);
  });

  if (dayTasks.length === 0) return 0;

  const completedTasks = dayTasks.filter((task) => task.status === 'completed');
  return Math.round((completedTasks.length / dayTasks.length) * 100);
}

/**
 * Calculate habit completion progress for a given day.
 *
 * Only habits that are active and scheduled for the day are counted.
 * Returns 0 when no habits are scheduled to avoid inflated values.
 */
export function calculateHabitProgress(habits: Habit[], targetDate: Date = new Date()): number {
  const day = startOfDay(targetDate);
  const weekday = day.getDay();
  const dayKey = day.toISOString().split('T')[0]!;

  const activeHabitsForDay = habits.filter((habit) => {
    if (habit.status !== 'active') return false;
    if (habit.frequency === 'weekly' && habit.daysOfWeek?.length) {
      return habit.daysOfWeek.includes(weekday);
    }
    return true;
  });

  if (activeHabitsForDay.length === 0) return 0;

  const completedHabits = activeHabitsForDay.filter((habit) => {
    if (!habit.completionHistory) return false;
    return getHabitStatus(habit.completionHistory[dayKey]) === 'done';
  });

  return Math.round((completedHabits.length / activeHabitsForDay.length) * 100);
}

/**
 * Calculate overall goal progress
 *
 * @param goals - Array of all goals
 * @returns Average progress percentage (0-100)
 */
export function calculateGoalProgress(goals: Goal[]): number {
  const activeGoals = goals.filter(goal =>
    goal.status === 'active'
  );

  if (activeGoals.length === 0) return 0;

  const totalProgress = activeGoals.reduce((sum, goal) => {
    // progressPercent is stored as 0-1, convert to 0-100
    return sum + ((goal.progressPercent || 0) * 100);
  }, 0);

  return Math.round(totalProgress / activeGoals.length);
}

/**
 * Calculate overall planner progress (combined tasks, habits, goals)
 *
 * Weighted average:
 * - Tasks: 40%
 * - Habits: 30%
 * - Goals: 30%
 *
 * @param tasks - Array of all tasks
 * @param habits - Array of all habits
 * @param goals - Array of all goals
 * @returns Overall progress percentage (0-100)
 */
export function calculateOverallProgress(
  tasks: Task[],
  habits: Habit[],
  goals: Goal[]
): number {
  const taskProgress = calculateTaskProgress(tasks);
  const habitProgress = calculateHabitProgress(habits);
  const goalProgress = calculateGoalProgress(goals);

  // Weighted average
  const overall = (taskProgress * 0.4) + (habitProgress * 0.3) + (goalProgress * 0.3);

  return Math.round(overall);
}

/**
 * Calculate progress for a specific goal based on its linked items
 *
 * @param goal - The goal to calculate progress for
 * @param tasks - All tasks (to find linked ones)
 * @param habits - All habits (to find linked ones)
 * @returns Updated progress percentage (0-100)
 */
export function calculateGoalProgressFromLinkedItems(
  goal: Goal,
  tasks: Task[],
  habits: Habit[]
): number {
  // Find linked tasks and habits
  const linkedTasks = tasks.filter(task => task.goalId === goal.id && !isTaskExcluded(task));
  const linkedHabits = habits.filter(habit => habit.goalId === goal.id);

  // If goal has no linked items, keep manual progress
  if (linkedTasks.length === 0 && linkedHabits.length === 0) {
    return goal.progressPercent || 0;
  }

  let totalWeight = 0;
  let completedWeight = 0;

  // Tasks contribute to progress
  if (linkedTasks.length > 0) {
    const completedTasks = linkedTasks.filter(task => task.status === 'completed').length;
    totalWeight += linkedTasks.length;
    completedWeight += completedTasks;
  }

  // Habits contribute to progress (based on streak)
  if (linkedHabits.length > 0) {
    linkedHabits.forEach(habit => {
      const streakProgress = Math.min((habit.streakCurrent || 0) / 30, 1); // Max 30 days
      totalWeight += 1;
      completedWeight += streakProgress;
    });
  }

  if (totalWeight === 0) return goal.progressPercent || 0;

  return Math.round((completedWeight / totalWeight) * 100);
}

/**
 * Get progress status label
 *
 * @param progress - Progress percentage (0-100)
 * @returns Status label
 */
export function getProgressStatus(progress: number): 'low' | 'medium' | 'high' | 'complete' {
  if (progress === 100) return 'complete';
  if (progress >= 70) return 'high';
  if (progress >= 40) return 'medium';
  return 'low';
}

/**
 * Get progress color based on value
 *
 * @param progress - Progress percentage (0-100)
 * @param theme - Theme colors object
 * @returns Color string
 */
export function getProgressColor(progress: number, theme: any): string {
  if (progress === 100) return theme.colors.success || theme.colors.primary;
  if (progress >= 80) return theme.colors.primary;
  if (progress >= 50) return theme.colors.warning || theme.colors.secondary;
  return theme.colors.danger || theme.colors.textSecondary;
}
