import type { Goal, Habit, Task } from '@/domain/planner/types';

export interface TaskSummary {
  taskId: string;
  title: string;
  status: Task['status'];
  priority?: Task['priority'];
  dueDate?: Task['dueDate'];
  timeOfDay?: Task['timeOfDay'];
  estimatedMin?: number;
  goalId?: string;
  habitId?: string;
  financeLink?: Task['financeLink'];
  focusTotalMin: number;
  nextAction?: string;
  badges: {
    overdue: boolean;
    today: boolean;
    planned: boolean;
  };
  subtasksDone?: number;
  subtasksTotal?: number;
}

export interface GoalSummary {
  goalId: string;
  title: string;
  type: Goal['goalType'];
  unit?: string;
  currency?: string;
  target?: number;
  current?: number;
  progressPercent: number;
  deadline?: string;
  eta?: string;
  riskFlags: string[];
  milestonesDone?: number;
  milestonesTotal?: number;
  badges: {
    habitsToday?: number;
    nextTask?: string | null;
    financeLink?: string | null;
  };
  nextAction?: string;
}

export interface HabitSummary {
  habitId: string;
  title: string;
  frequency: Habit['frequency'];
  completionMode: Habit['completionMode'];
  targetPerDay?: number;
  unit?: string;
  todayStatus?: 'done' | 'remaining';
  remainingValue?: number;
  streakCurrent: number;
  streakBest: number;
  completionRate30d: number;
  goalId?: string;
  financeRule?: Habit['financeRule'];
}

export interface HomeSnapshot {
  date: string;
  rings: {
    goals: number;
    habits: number;
    productivity: number;
    finance: number;
  };
  today: {
    tasksDue: number;
    habitsDue: number;
    nextEvents: string[];
  };
  alerts: {
    atRiskGoals: string[];
    budgetRisk: string[];
    debtDue: string[];
  };
}
