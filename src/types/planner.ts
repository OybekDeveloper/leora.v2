export type PlannerGoalId = 'dream-car' | 'emergency-fund' | 'fitness' | 'language';
export type PlannerHabitId = 'h1' | 'h2' | 'h3' | 'h4' | 'h5';
export type GoalSummaryKey = 'left' | 'pace' | 'prediction';

export type PlannerTaskStatus = 'active' | 'in_progress' | 'completed' | 'archived';
export type PlannerTaskSection = 'morning' | 'afternoon' | 'evening';
export type PlannerTaskCategoryId = 'work' | 'personal' | 'health' | 'learning' | 'errands';

export type AddTaskDateMode = 'today' | 'tomorrow' | 'pick';
export type TaskEnergyLevel = 'low' | 'medium' | 'high';
export type TaskPriorityLevel = 'low' | 'medium' | 'high';
export type TaskFinanceLink = 'record_expenses' | 'pay_debt' | 'review_budget' | 'transfer_money' | 'none';

export interface AddTaskPayload {
  title: string;
  dateMode: AddTaskDateMode;
  date?: string;
  time?: string;
  description?: string;
  project?: string;
  context?: string;
  energy: TaskEnergyLevel;
  priority: TaskPriorityLevel;
  categoryId?: PlannerTaskCategoryId;
  goalId?: string;
  financeLink?: TaskFinanceLink;
  reminderEnabled: boolean;
  remindBeforeMin?: number;
  repeatEnabled: boolean;
  repeatRule?: string;
  needFocus: boolean;
  subtasks: string[];
}

export interface PlannerTaskMetadata {
  sourcePayload?: AddTaskPayload;
  needFocus?: boolean;
}

export interface PlannerTaskFocusMeta {
  isActive: boolean;
  startedAt?: number;
  lastSessionEndedAt?: number;
  lastResult?: 'done' | 'move';
  technique?: string;
  durationMinutes?: number;
}

export interface PlannerTask {
  id: string;
  title: string;
  desc?: string;
  start: string;
  duration: string;
  context: string;
  energy: 1 | 2 | 3;
  section: PlannerTaskSection;
  status: PlannerTaskStatus;
  goalId?: PlannerGoalId;
  linkedHabitId?: PlannerHabitId;
  milestoneId?: string;
  aiNote?: string;
  projectHeart?: boolean;
  afterWork?: boolean;
  costUZS?: string;
  expanded?: boolean;
  createdAt: number;
  updatedAt?: number;
  dueAt?: number | null;
  deletedAt?: number | null;
  focusMeta?: PlannerTaskFocusMeta;
  metadata?: PlannerTaskMetadata;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  date?: Date;
  goalId?: PlannerGoalId;
}

export interface PlannerGoal {
  id: PlannerGoalId;
  title: string;
  description: string;
  type: 'financial' | 'quantitative' | 'qualitative';
  category: string;
  progress: number;
  target: number;
  current: number;
  deadline?: Date;
  milestones: Milestone[];
  linkedTaskIds: string[];
  linkedHabitIds: PlannerHabitId[];
  nextStepTaskId?: string;
}

export interface PlannerHabit {
  id: PlannerHabitId;
  name: string;
  icon: string;
  category: string;
  streak: number;
  bestStreak: number;
  completionRate: number;
  schedule: boolean[];
  reminderTime?: string;
  linkedGoalIds: PlannerGoalId[];
}

export interface PlannerDailySummary {
  dateKey: string;
  tasks: {
    total: number;
    done: number;
    overdue: number;
  };
  habits: {
    dueToday: number;
    completed: number;
  };
  goals: {
    active: number;
    nextSteps: number;
  };
}
