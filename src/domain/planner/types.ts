export type GoalType = 'financial' | 'health' | 'education' | 'productivity' | 'personal';
export type GoalStatus = 'active' | 'paused' | 'completed' | 'archived';
export type MetricKind = 'none' | 'amount' | 'weight' | 'count' | 'duration' | 'custom';
export type FinanceMode = 'save' | 'spend' | 'debt_close';
export type GoalDirection = 'increase' | 'decrease' | 'neutral';

export type GoalProgressSource = 'manual' | 'task' | 'habit' | 'finance';

export interface GoalCheckIn {
  id: string;
  goalId: string;
  value: number;
  note?: string;
  sourceType: GoalProgressSource;
  sourceId?: string;
  dateKey?: string;
  createdAt: string;
}

export interface GoalStats {
  financialProgressPercent?: number;
  habitsProgressPercent?: number;
  tasksProgressPercent?: number;
  focusMinutesLast30?: number;
}

export interface GoalMilestone {
  id: string;
  title: string;
  description?: string;
  targetPercent: number;
  dueDate?: string;
  completedAt?: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  goalType: GoalType;
  status: GoalStatus;
  metricType: MetricKind;
  unit?: string;
  initialValue?: number;
  targetValue?: number;
  progressTargetValue?: number;
  currentValue?: number;
  checkIns?: GoalCheckIn[];
  direction?: GoalDirection;
  financeMode?: FinanceMode;
  currency?: string;
  linkedBudgetId?: string;
  linkedHabitIds?: string[];
  linkedTaskIds?: string[];
  linkedDebtId?: string;
  financeContributionIds?: string[];
  startDate?: string;
  targetDate?: string;
  completedDate?: string;
  progressPercent: number;
  stats: GoalStats;
  milestones?: GoalMilestone[];
  isPending?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type HabitStatus = 'active' | 'paused' | 'archived';
export type HabitType = 'health' | 'finance' | 'productivity' | 'education' | 'personal' | 'custom';
export type Frequency = 'daily' | 'weekly' | 'custom';
export type CompletionMode = 'boolean' | 'numeric';

export type HabitFinanceRule =
  | { type: 'no_spend_in_categories'; categoryIds: string[] }
  | { type: 'spend_in_categories'; categoryIds: string[]; minAmount?: number; currency?: string }
  | { type: 'has_any_transactions'; accountIds?: string[] }
  | { type: 'daily_spend_under'; amount: number; currency: string };

export type HabitCompletionStatus = 'done' | 'miss';

export type HabitCompletionEntry = {
  status: HabitCompletionStatus;
  value?: number;
};

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  iconId?: string;
  habitType: HabitType;
  status: HabitStatus;
  goalId?: string;
  linkedGoalIds?: string[];
  frequency: Frequency;
  daysOfWeek?: number[];
  timesPerWeek?: number;
  timeOfDay?: string;
  completionMode: CompletionMode;
  targetPerDay?: number;
  unit?: string;
  financeRule?: HabitFinanceRule;
  challengeLengthDays?: number;
  streakCurrent: number;
  streakBest: number;
  completionRate30d: number;
  completionHistory?: Record<string, HabitCompletionEntry>;
  isPending?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus =
  | 'inbox'
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'canceled'
  | 'moved'
  | 'overdue'
  | 'active'
  | 'archived'
  | 'deleted';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskFinanceLink = 'record_expenses' | 'pay_debt' | 'review_budget' | 'transfer_money' | 'none';

export interface TaskChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  status: 'pending' | 'met';
}

export interface TaskFocusMeta {
  isActive: boolean;
  startedAt?: string;
  lastSessionEndedAt?: string;
  lastResult?: 'done' | 'move';
  technique?: string;
  durationMinutes?: number;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  goalId?: string;
  habitId?: string;
  progressValue?: number;
  progressUnit?: string;
  financeLink?: TaskFinanceLink;
  dueDate?: string;
  startDate?: string;
  timeOfDay?: string;
  estimatedMinutes?: number;
  needFocus?: boolean;
  energyLevel?: 1 | 2 | 3;
  checklist?: TaskChecklistItem[];
  dependencies?: TaskDependency[];
  lastFocusSessionId?: string;
  focusTotalMinutes?: number;
  context?: string;
  notes?: string;
  isPending?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FocusStatus = 'in_progress' | 'completed' | 'canceled' | 'paused';

export interface FocusSession {
  id: string;
  userId: string;
  taskId?: string;
  goalId?: string;
  plannedMinutes: number;
  actualMinutes?: number;
  status: FocusStatus;
  startedAt: string;
  endedAt?: string;
  interruptionsCount?: number;
  notes?: string;
  isPending?: boolean;
  createdAt: string;
  updatedAt: string;
}
