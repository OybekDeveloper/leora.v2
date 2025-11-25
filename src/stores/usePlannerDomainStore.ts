import { create } from 'zustand';
import { BSON } from 'realm';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { FocusSession, Goal, Habit, Task, TaskDependency, TaskStatus, GoalCheckIn } from '@/domain/planner/types';
import { plannerEventBus, type PlannerEventName, type PlannerEventPayloadMap } from '@/events/plannerEventBus';
import { addDays, startOfDay } from '@/utils/calendar';
import { offlineQueueService } from '@/services/offlineQueueService';
import { mmkvStorageAdapter } from '@/utils/storage';
import { calculateGoalProgress, syncGoalMilestones } from '@/utils/goalProgress';
import { getPlannerDaoRegistry, hasPlannerDaoRegistry } from '@/database/dao/plannerDaoRegistry';
import { useFinanceDomainStore } from './useFinanceDomainStore';
import { createGoalFinanceTransaction } from '@/services/finance/financeAutoTracking';

export type PlannerHistoryItem = {
  historyId: string;
  taskId: string;
  title: string;
  status: TaskStatus;
  action: 'created' | 'completed' | 'deleted' | 'moved';
  timestamp: string;
  snapshot?: Task;
};

interface PlannerDomainState {
  goals: Goal[];
  habits: Habit[];
  tasks: Task[];
  focusSessions: FocusSession[];
  taskHistory: PlannerHistoryItem[];
  addGoalCheckIn: (payload: { goalId: string; value: number; note?: string; sourceType?: GoalCheckIn['sourceType']; sourceId?: string; dateKey?: string; createdAt?: string }) => GoalCheckIn | undefined;
  removeFinanceContribution: (sourceId: string) => void;
  createGoal: (payload: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'progressPercent' | 'stats'> & { id?: string; progressPercent?: number; stats?: Goal['stats'] }) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  setGoalStatus: (id: string, status: Goal['status']) => void;
  completeGoal: (id: string, completedDate?: string) => void;
  archiveGoal: (id: string) => void;
  pauseGoal: (id: string) => void;
  resumeGoal: (id: string) => void;
  deleteGoalPermanently: (id: string) => void;
  restartGoal: (id: string) => void;
  createHabit: (payload: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'streakCurrent' | 'streakBest' | 'completionRate30d'> & { id?: string; streakCurrent?: number; streakBest?: number; completionRate30d?: number }) => Habit;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  logHabitCompletion: (id: string, completed: boolean, options?: { date?: Date | string; clear?: boolean }) => void;
  pauseHabit: (id: string) => void;
  resumeHabit: (id: string) => void;
  archiveHabit: (id: string) => void;
  createTask: (payload: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'focusTotalMinutes'> & { id?: string; status?: TaskStatus; focusTotalMinutes?: number }) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  completeTask: (id: string, options?: { actualMinutes?: number }) => void;
  cancelTask: (id: string) => void;
  scheduleTask: (id: string, schedule: { dueDate: string; timeOfDay?: string }) => void;
  toggleTaskChecklist: (taskId: string, itemId: string) => void;
  addTaskDependency: (taskId: string, dependency: TaskDependency) => void;
  setTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;
  deleteTaskPermanently: (taskId: string) => void;
  restoreTaskFromHistory: (historyId: string) => void;
  removeHistoryEntry: (historyId: string) => void;
  createFocusSession: (payload: Omit<FocusSession, 'id' | 'status' | 'createdAt' | 'updatedAt'> & { status?: FocusSession['status'] }) => FocusSession;
  updateFocusSession: (id: string, updates: Partial<FocusSession>) => void;
  startFocus: (payload: { taskId?: string; goalId?: string; plannedMinutes?: number; notes?: string }) => FocusSession;
  pauseFocus: (sessionId: string) => void;
  resumeFocus: (sessionId: string) => void;
  finishFocus: (sessionId: string, options?: { actualMinutes?: number }) => void;
  cancelFocus: (sessionId: string) => void;
  hydrateFromRealm: (payload: Partial<Pick<PlannerDomainState, 'goals' | 'habits' | 'tasks' | 'focusSessions'>>) => void;
  reset: () => void;
}

const generateId = (_prefix: string) => new BSON.ObjectId().toHexString();

const nowIso = () => new Date().toISOString();

const isoHoursFromNow = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

const ENABLE_PLANNER_SEED_DATA = false;

const dateKeyFromDate = (date: Date) => startOfDay(date).toISOString().split('T')[0]!;
const parseDateKey = (key: string) => new Date(`${key}T00:00:00.000Z`);

const recalcHabitStatsFromHistory = (history?: Habit['completionHistory']) => {
  const map = history ?? {};
  const getStatus = (value?: Habit['completionHistory'][string]) =>
    typeof value === 'string' ? value : value?.status;

  const today = startOfDay(new Date());
  let streakCurrent = 0;
  let cursor = today;
  while (true) {
    const key = dateKeyFromDate(cursor);
    if (getStatus(map[key]) === 'done') {
      streakCurrent += 1;
      cursor = addDays(cursor, -1);
      continue;
    }
    break;
  }

  let streakBest = 0;
  let bestChain = 0;
  let prevDate: Date | null = null;
  const sortedKeys = Object.keys(map)
    .filter((key) => getStatus(map[key]) === 'done')
    .sort();
  sortedKeys.forEach((key) => {
    const date = parseDateKey(key);
    if (prevDate) {
      const expectedNext = dateKeyFromDate(addDays(prevDate, 1));
      if (expectedNext === key) {
        bestChain += 1;
      } else {
        bestChain = 1;
      }
    } else {
      bestChain = 1;
    }
    prevDate = date;
    streakBest = Math.max(streakBest, bestChain);
  });
  streakBest = Math.max(streakBest, streakCurrent);

  const windowDays = 30;
  let doneCount = 0;
  for (let i = 0; i < windowDays; i += 1) {
    const key = dateKeyFromDate(addDays(today, -i));
    if (getStatus(map[key]) === 'done') {
      doneCount += 1;
    }
  }
  const completionRate30d = Number((doneCount / windowDays).toFixed(3));

  return { streakCurrent, streakBest, completionRate30d };
};

const publishPlannerEvent = <E extends PlannerEventName>(
  event: E,
  payload: PlannerEventPayloadMap[E],
) => plannerEventBus.publish(event, payload);

/**
 * Queue offline operation if no internet connection
 */
const queueIfOffline = async (
  entityType: 'goal' | 'habit' | 'task' | 'focusSession',
  operationType: 'create' | 'update' | 'delete',
  entityId: string,
  payload: any,
) => {
  const isOnline = offlineQueueService.getIsOnline();
  if (!isOnline) {
    await offlineQueueService.enqueue({
      entityType,
      operationType,
      entityId,
      payload,
    });
  }
  return !isOnline; // Return true if operation was queued (offline)
};

const persistGoalToRealm = (goal: Goal) => {
  if (!hasPlannerDaoRegistry()) return;
  try {
    getPlannerDaoRegistry().goals.upsert(goal);
  } catch (error) {
    console.warn('[PlannerDAO] Failed to persist goal', error);
  }
};

const persistHabitToRealm = (habit: Habit) => {
  if (!hasPlannerDaoRegistry()) return habit;
  try {
    const stored = getPlannerDaoRegistry().habits.upsert(habit);
    return stored;
  } catch (error) {
    console.warn('[PlannerDAO] Failed to persist habit', error);
    return habit;
  }
};

const persistTaskToRealm = (task: Task) => {
  if (!hasPlannerDaoRegistry()) return;
  try {
    getPlannerDaoRegistry().tasks.upsert(task);
  } catch (error) {
    console.warn('[PlannerDAO] Failed to persist task', error);
  }
};

const deleteGoalFromRealm = (goalId: string) => {
  if (!hasPlannerDaoRegistry()) return;
  try {
    getPlannerDaoRegistry().goals.delete(goalId);
  } catch (error) {
    console.warn('[PlannerDAO] Failed to delete goal', error);
  }
};

const deleteHabitFromRealm = (habitId: string) => {
  if (!hasPlannerDaoRegistry()) return;
  try {
    getPlannerDaoRegistry().habits.delete(habitId);
  } catch (error) {
    console.warn('[PlannerDAO] Failed to delete habit', error);
  }
};

const deleteTaskFromRealm = (taskId: string) => {
  if (!hasPlannerDaoRegistry()) return;
  try {
    getPlannerDaoRegistry().tasks.delete(taskId);
  } catch (error) {
    console.warn('[PlannerDAO] Failed to delete task', error);
  }
};

const resolveLinkedBudget = (budgetId?: string | null) => {
  if (!budgetId) return undefined;
  const financeStore = useFinanceDomainStore.getState();
  return financeStore?.budgets.find((budget) => budget.id === budgetId);
};

const resolveLinkedBudgetForGoal = (goalId?: string, goalLinkedBudgetId?: string | null) => {
  const financeStore = useFinanceDomainStore.getState();
  if (!financeStore) return undefined;
  if (goalLinkedBudgetId) {
    const direct = financeStore.budgets.find((budget) => budget.id === goalLinkedBudgetId);
    if (direct) return direct;
  }
  if (goalId) {
    return financeStore.budgets.find((budget) => budget.linkedGoalId === goalId);
  }
  return undefined;
};

const createDefaultGoal = (params: Partial<Goal> & { id: string }): Goal => ({
  id: params.id,
  userId: 'local-user',
  title: params.title ?? params.id,
  goalType: params.goalType ?? 'personal',
  status: params.status ?? 'active',
  metricType: params.metricType ?? 'none',
  direction: params.direction ?? 'increase',
  financeMode: params.financeMode,
  currency: params.currency,
  progressPercent: params.progressPercent ?? 0,
  progressTargetValue: params.progressTargetValue,
  currentValue: params.currentValue ?? 0,
  stats: params.stats ?? {},
  milestones: params.milestones ?? [],
  checkIns: params.checkIns ?? [],
  startDate: params.startDate ?? nowIso(),
  targetDate: params.targetDate,
  createdAt: params.createdAt ?? nowIso(),
  updatedAt: params.updatedAt ?? nowIso(),
});

const SAMPLE_GOALS: Goal[] = [
  createDefaultGoal({
    id: 'dream-car',
    title: 'Dream Car',
    goalType: 'financial',
    metricType: 'amount',
    financeMode: 'save',
    currency: 'USD',
    progressPercent: 0.82,
    stats: { financialProgressPercent: 0.82 },
  }),
  createDefaultGoal({
    id: 'emergency-fund',
    title: 'Emergency Fund',
    goalType: 'financial',
    metricType: 'amount',
    financeMode: 'save',
    currency: 'USD',
    progressPercent: 0.58,
    stats: { financialProgressPercent: 0.58 },
  }),
  createDefaultGoal({
    id: 'fitness',
    title: 'Fitness Boost',
    goalType: 'health',
    metricType: 'custom',
    progressPercent: 0.44,
    stats: { tasksProgressPercent: 0.44 },
  }),
  createDefaultGoal({
    id: 'language',
    title: 'Language Mastery',
    goalType: 'education',
    metricType: 'custom',
    progressPercent: 0.68,
    stats: { habitsProgressPercent: 0.68 },
  }),
];

const DEFAULT_GOALS: Goal[] = ENABLE_PLANNER_SEED_DATA ? SAMPLE_GOALS : [];

const SAMPLE_HABITS: Habit[] = [
  {
    id: 'h1',
    userId: 'local-user',
    title: 'Morning workout',
    habitType: 'health',
    status: 'active',
    goalId: 'fitness',
    linkedGoalIds: ['fitness'],
    frequency: 'weekly',
    daysOfWeek: [1, 2, 3, 4, 5],
    completionMode: 'boolean',
    streakCurrent: 12,
    streakBest: 45,
    completionRate30d: 0.86,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'h2',
    userId: 'local-user',
    title: 'Meditation',
    habitType: 'personal',
    status: 'active',
    frequency: 'daily',
    completionMode: 'boolean',
    streakCurrent: 1,
    streakBest: 21,
    completionRate30d: 0.6,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'h3',
    userId: 'local-user',
    title: 'Language practice',
    habitType: 'education',
    status: 'active',
    goalId: 'language',
    linkedGoalIds: ['language'],
    frequency: 'weekly',
    daysOfWeek: [1, 3, 5],
    completionMode: 'timer',
    streakCurrent: 5,
    streakBest: 30,
    completionRate30d: 0.7,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'h4',
    userId: 'local-user',
    title: 'Hydration',
    habitType: 'health',
    status: 'active',
    frequency: 'daily',
    completionMode: 'chips',
    streakCurrent: 30,
    streakBest: 30,
    completionRate30d: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'h5',
    userId: 'local-user',
    title: 'Dual habit',
    habitType: 'personal',
    status: 'active',
    frequency: 'weekly',
    daysOfWeek: [0, 6],
    completionMode: 'boolean',
    linkedGoalIds: ['dream-car', 'language'],
    streakCurrent: 3,
    streakBest: 7,
    completionRate30d: 0.55,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const DEFAULT_HABITS: Habit[] = ENABLE_PLANNER_SEED_DATA ? SAMPLE_HABITS : [];

const SAMPLE_TASKS: Task[] = [
  {
    id: 'task-morning-workout',
    userId: 'local-user',
    title: 'Morning workout',
    status: 'completed',
    priority: 'medium',
    goalId: 'fitness',
    habitId: 'h1',
    dueDate: isoHoursFromNow(-6),
    startDate: isoHoursFromNow(-6),
    timeOfDay: '07:00',
    estimatedMinutes: 30,
    energyLevel: 3,
    focusTotalMinutes: 60,
    context: '@home',
    notes: 'Strength + mobility circuit',
    createdAt: isoHoursFromNow(-8),
    updatedAt: isoHoursFromNow(-6),
  },
  {
    id: 'task-check-mail',
    userId: 'local-user',
    title: 'Check the mail',
    status: 'overdue',
    priority: 'low',
    dueDate: isoHoursFromNow(-2),
    startDate: isoHoursFromNow(-2),
    timeOfDay: '09:00',
    estimatedMinutes: 15,
    energyLevel: 2,
    context: '@work',
    createdAt: isoHoursFromNow(-12),
    updatedAt: isoHoursFromNow(-2),
  },
  {
    id: 'task-team-collaboration',
    userId: 'local-user',
    title: 'Team collaboration',
    status: 'planned',
    priority: 'high',
    goalId: 'dream-car',
    dueDate: isoHoursFromNow(1),
    startDate: isoHoursFromNow(1),
    timeOfDay: '10:00',
    estimatedMinutes: 60,
    energyLevel: 3,
    context: '@work',
    notes: 'Sprint planning sync',
    createdAt: isoHoursFromNow(-5),
    updatedAt: isoHoursFromNow(-1),
  },
  {
    id: 'task-leora-automation',
    userId: 'local-user',
    title: 'Prototype: LEORA automation',
    status: 'in_progress',
    priority: 'high',
    goalId: 'dream-car',
    dueDate: isoHoursFromNow(4),
    startDate: isoHoursFromNow(4),
    timeOfDay: '14:00',
    estimatedMinutes: 120,
    energyLevel: 3,
    context: '@work',
    notes: 'Best deep-focus slot to finish sprint deliverable',
    focusTotalMinutes: 90,
    lastFocusSessionId: 'focus-session-seed',
    createdAt: isoHoursFromNow(-4),
    updatedAt: isoHoursFromNow(0),
  },
  {
    id: 'task-meet-aziz',
    userId: 'local-user',
    title: 'Meet with Aziz',
    status: 'planned',
    priority: 'medium',
    dueDate: isoHoursFromNow(2),
    startDate: isoHoursFromNow(2),
    timeOfDay: '13:00',
    estimatedMinutes: 30,
    energyLevel: 2,
    context: '@cafe',
    notes: 'Roadmap sync over coffee',
    createdAt: isoHoursFromNow(-3),
    updatedAt: isoHoursFromNow(-1),
  },
  {
    id: 'task-buy-groceries',
    userId: 'local-user',
    title: 'Buy groceries',
    status: 'planned',
    priority: 'medium',
    dueDate: isoHoursFromNow(6),
    startDate: isoHoursFromNow(6),
    timeOfDay: '18:00',
    estimatedMinutes: 60,
    energyLevel: 2,
    context: '@market',
    notes: 'Restock essentials after work',
    createdAt: isoHoursFromNow(-1),
    updatedAt: isoHoursFromNow(-1),
  },
  {
    id: 'task-top-up-fund',
    userId: 'local-user',
    title: 'Top up emergency fund',
    status: 'overdue',
    priority: 'medium',
    goalId: 'emergency-fund',
    dueDate: isoHoursFromNow(-1),
    startDate: isoHoursFromNow(-1),
    timeOfDay: '10:00',
    estimatedMinutes: 20,
    energyLevel: 1,
    context: '@home',
    notes: 'Budget review + transfer',
    createdAt: isoHoursFromNow(-6),
    updatedAt: isoHoursFromNow(-1),
  },
  {
    id: 'task-evening-workout',
    userId: 'local-user',
    title: 'Evening workout',
    status: 'planned',
    priority: 'medium',
    goalId: 'fitness',
    habitId: 'h1',
    dueDate: isoHoursFromNow(8),
    startDate: isoHoursFromNow(8),
    timeOfDay: '19:00',
    estimatedMinutes: 30,
    energyLevel: 3,
    context: '@park',
    notes: 'Cardio reset outdoors',
    createdAt: isoHoursFromNow(-2),
    updatedAt: isoHoursFromNow(-2),
  },
  {
    id: 'task-language-review',
    userId: 'local-user',
    title: 'Review language notes',
    status: 'planned',
    priority: 'low',
    goalId: 'language',
    dueDate: isoHoursFromNow(10),
    startDate: isoHoursFromNow(10),
    timeOfDay: '21:00',
    estimatedMinutes: 15,
    energyLevel: 2,
    context: '@home',
    notes: 'Grammar deck + spaced repetition',
    createdAt: isoHoursFromNow(-1),
    updatedAt: isoHoursFromNow(-1),
  },
];

const clampPercent = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return undefined;
  }
  if (!Number.isFinite(value)) {
    return undefined;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
};

const cloneTask = (task: Task): Task => ({
  ...task,
  checklist: task.checklist ? task.checklist.map((item) => ({ ...item })) : undefined,
  dependencies: task.dependencies ? task.dependencies.map((dep) => ({ ...dep })) : undefined,
});

const appendTaskHistoryEntry = (history: PlannerHistoryItem[], entry: PlannerHistoryItem) =>
  [entry, ...history].slice(0, 200);

const createHistoryEntry = (params: {
  id: string;
  title: string;
  status: TaskStatus;
  action: PlannerHistoryItem['action'];
  snapshot?: Task;
}): PlannerHistoryItem => ({
  historyId: generateId('history'),
  taskId: params.id,
  ...params,
  snapshot: params.snapshot ? cloneTask(params.snapshot) : undefined,
  timestamp: nowIso(),
});

const computeTaskProgress = (goalId: string, tasks: Task[]) => {
  const related = tasks.filter(
    (task) =>
      task.goalId === goalId &&
      task.status !== 'canceled' &&
      task.status !== 'archived' &&
      task.status !== 'deleted',
  );
  if (!related.length) {
    return undefined;
  }
  const completed = related.filter((task) => task.status === 'completed').length;
  const inProgress = related.filter((task) => task.status === 'in_progress').length;
  const progress = (completed + inProgress * 0.5) / related.length;
  return clampPercent(progress);
};

const computeHabitProgress = (goalId: string, habits: Habit[]) => {
  const related = habits.filter(
    (habit) =>
      habit.goalId === goalId ||
      habit.linkedGoalIds?.includes(goalId),
  );
  if (!related.length) {
    return undefined;
  }
  const total = related.reduce(
    (sum, habit) => sum + (habit.completionRate30d ?? 0),
    0,
  );
  return clampPercent(total / related.length);
};

const buildTaskGoalMap = (tasks: Task[]) => {
  const map = new Map<string, string>();
  tasks.forEach((task) => {
    if (task.goalId) {
      map.set(task.id, task.goalId);
    }
  });
  return map;
};

const computeFocusMinutesLast30 = (
  goalId: string,
  focusSessions: FocusSession[],
  taskGoalMap: Map<string, string>,
) => {
  if (!focusSessions.length) {
    return 0;
  }
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const threshold = Date.now() - THIRTY_DAYS_MS;
  return focusSessions.reduce((sum, session) => {
    const sessionGoalId =
      session.goalId ?? (session.taskId ? taskGoalMap.get(session.taskId) : undefined);
    if (sessionGoalId !== goalId) {
      return sum;
    }
    const startedAt = new Date(session.startedAt).getTime();
    if (Number.isNaN(startedAt) || startedAt < threshold) {
      return sum;
    }
    const minutes = session.actualMinutes ?? session.plannedMinutes ?? 0;
    return sum + minutes;
  }, 0);
};

const recalcGoalProgress = (
  goals: Goal[],
  tasks: Task[],
  habits: Habit[],
  focusSessions: FocusSession[],
) => {
  if (!goals.length) {
    return goals;
  }
  const taskGoalMap = buildTaskGoalMap(tasks);

  return goals.map((goal) => {
    const focusMinutesLast30 = computeFocusMinutesLast30(goal.id, focusSessions, taskGoalMap);
    const tasksProgressPercent = computeTaskProgress(goal.id, tasks);
    const habitsProgressPercent = computeHabitProgress(goal.id, habits);
    const financialProgressPercent =
      goal.metricType === 'amount' && goal.targetValue
        ? clampPercent((goal.currentValue ?? 0) / goal.targetValue)
        : goal.stats?.financialProgressPercent;

    const stats: Goal['stats'] = {
      ...goal.stats,
      focusMinutesLast30,
      tasksProgressPercent,
      habitsProgressPercent,
      financialProgressPercent,
    };

    const progressData = calculateGoalProgress(goal);
    const milestones = syncGoalMilestones(goal);
    const blendedPercent = goal.status === 'completed'
      ? 1
      : Math.max(
          progressData.progressPercent ?? 0,
          tasksProgressPercent ?? 0,
          habitsProgressPercent ?? 0,
          financialProgressPercent ?? 0,
        );
    const progressValue =
      progressData.progressTargetValue != null
        ? blendedPercent * (progressData.progressTargetValue as number)
        : progressData.progressValue;

    const nextGoal: Goal = {
      ...goal,
      stats,
      currentValue: progressValue,
      progressTargetValue: progressData.progressTargetValue,
      progressPercent: goal.status === 'completed' ? 1 : blendedPercent,
      milestones,
    };

    return nextGoal;
  });
};

const DEFAULT_TASKS: Task[] = ENABLE_PLANNER_SEED_DATA ? SAMPLE_TASKS : [];

const INITIAL_GOALS = recalcGoalProgress(DEFAULT_GOALS, DEFAULT_TASKS, DEFAULT_HABITS, []);

const createInitialPlannerCollections = () => ({
  goals: INITIAL_GOALS,
  habits: DEFAULT_HABITS,
  tasks: DEFAULT_TASKS,
  focusSessions: [] as FocusSession[],
  taskHistory: [] as PlannerHistoryItem[],
});

export const usePlannerDomainStore = create<PlannerDomainState>()(
  persist(
    (set, get) => ({
      ...createInitialPlannerCollections(),

      addGoalCheckIn: (payload) => {
        const goal = get().goals.find((g) => g.id === payload.goalId);
        const linkedBudget = resolveLinkedBudgetForGoal(goal?.id, goal?.linkedBudgetId);
        const hasFinanceLink = Boolean(linkedBudget || goal?.linkedDebtId);
        const isMoneyGoal =
          goal &&
          (goal.goalType === 'financial' || goal.metricType === 'amount') &&
          hasFinanceLink;

        // Prevent over-progress and block updates on completed goals
        if (goal && goal.status === 'completed') {
          return;
        }

        let valueToApply = payload.value;
        if (goal && isMoneyGoal) {
          const { progressValue, progressTargetValue } = calculateGoalProgress(goal);
          const remaining = Math.max(progressTargetValue - progressValue, 0);
          valueToApply = Math.min(Math.max(payload.value, 0), remaining);
          if (valueToApply <= 0) {
            return;
          }
        }

        if (goal && isMoneyGoal && payload.sourceType !== 'finance' && valueToApply > 0) {
          // Route manual goal check-ins through Finance to keep budgets/transactions in sync.
          createGoalFinanceTransaction({
            goal,
            amount: valueToApply,
            budgetId: linkedBudget?.id ?? goal.linkedBudgetId,
            debtId: goal.linkedDebtId,
            note: payload.note,
            eventType: 'goal-progress',
            plannedAmount: goal.targetValue,
            paidAmount: valueToApply,
          });
          return;
        }

        let created: GoalCheckIn | undefined;
        let updatedGoal: Goal | undefined;
        set((state) => {
          if (!payload.goalId || !Number.isFinite(payload.value)) {
            return state;
          }
          const checkInId = generateId('checkin');
          const createdAt = payload.createdAt ?? nowIso();
          const goals = recalcGoalProgress(
            state.goals.map((goal) => {
              if (goal.id !== payload.goalId) {
                return goal;
              }
              const entry: GoalCheckIn = {
                id: checkInId,
                goalId: payload.goalId,
                value: valueToApply,
                note: payload.note,
                sourceType: payload.sourceType ?? 'manual',
                sourceId: payload.sourceId,
                dateKey: payload.dateKey,
                createdAt,
              };
              created = entry;
              const existing = goal.checkIns ?? [];
              const filtered = payload.sourceId
                ? existing.filter((item) =>
                    !(
                      item.sourceId === payload.sourceId &&
                      item.sourceType === (payload.sourceType ?? 'manual') &&
                      (!payload.dateKey || item.dateKey === payload.dateKey)
                    ),
                  )
                : existing;
              const checkIns = [entry, ...filtered];
              const nextFinanceIds =
                entry.sourceType === 'finance' && entry.sourceId
                  ? Array.from(new Set([...(goal.financeContributionIds ?? []), entry.sourceId]))
                  : goal.financeContributionIds;
              return {
                ...goal,
                checkIns,
                financeContributionIds: nextFinanceIds,
                updatedAt: nowIso(),
              };
            }),
            state.tasks,
            state.habits,
            state.focusSessions,
          );
          updatedGoal = goals.find((g) => g.id === payload.goalId);
          return { goals };
        });

        if (updatedGoal) {
          persistGoalToRealm(updatedGoal);
          publishPlannerEvent('planner.goal.progress_updated', { goal: updatedGoal });
        }
        return created;
      },

      removeFinanceContribution: (sourceId) => {
        if (!sourceId) {
          return;
        }
        const changedGoalIds: string[] = [];
        set((state) => {
          const goals = recalcGoalProgress(
            state.goals.map((goal) => {
              const filteredCheckIns = (goal.checkIns ?? []).filter(
                (entry) => !(entry.sourceType === 'finance' && entry.sourceId === sourceId),
              );
              const financeContributionIds = goal.financeContributionIds?.filter((id) => id !== sourceId);
              const checkInsChanged = filteredCheckIns.length !== (goal.checkIns?.length ?? 0);
              const idsChanged =
                (goal.financeContributionIds?.length ?? 0) !== (financeContributionIds?.length ?? 0);
              if (!checkInsChanged && !idsChanged) {
                return goal;
              }
              changedGoalIds.push(goal.id);
              return {
                ...goal,
                checkIns: filteredCheckIns,
                financeContributionIds,
                updatedAt: nowIso(),
              };
            }),
            state.tasks,
            state.habits,
            state.focusSessions,
          );
          return { goals };
        });
        changedGoalIds.forEach((goalId) => {
          const goal = get().goals.find((item) => item.id === goalId);
          if (goal) {
            persistGoalToRealm(goal);
            publishPlannerEvent('planner.goal.progress_updated', { goal });
          }
        });
      },

      createGoal: (payload) => {
        const goalId = payload.id ?? generateId('goal');
        const now = nowIso();
        const initialValue = payload.initialValue ?? 0;
        const targetValue = payload.targetValue ?? 0;
        const direction =
          payload.direction ?? (targetValue > initialValue ? 'increase' : targetValue < initialValue ? 'decrease' : 'neutral');
        const linkedBudget = resolveLinkedBudget(payload.linkedBudgetId);
        const resolvedCurrency = linkedBudget?.currency ?? payload.currency;

        const baseGoal: Goal = {
          ...payload,
          id: goalId,
          direction,
          initialValue,
          targetValue,
          currency: resolvedCurrency,
          progressTargetValue: payload.progressTargetValue,
          currentValue: 0,
          checkIns: payload.checkIns ?? [],
          financeContributionIds: payload.financeContributionIds ?? [],
          progressPercent: payload.progressPercent ?? 0,
          stats: payload.stats ?? {},
          createdAt: now,
          updatedAt: now,
        };

        const progressData = calculateGoalProgress(baseGoal);
        const goal: Goal = {
          ...baseGoal,
          progressTargetValue: progressData.progressTargetValue,
          progressPercent: progressData.progressPercent,
        };

        // Queue operation if offline and set isPending flag
        queueIfOffline('goal', 'create', goalId, goal).then((isOffline) => {
          if (isOffline) {
            set((state) => ({
              goals: state.goals.map((g) => g.id === goalId ? { ...g, isPending: true } : g),
            }));
          }
        });

        let created: Goal = goal;
        set((state) => {
          const goals = recalcGoalProgress([goal, ...state.goals], state.tasks, state.habits, state.focusSessions);
          created = goals.find((item) => item.id === goal.id) ?? goal;
          return { goals };
        });
        persistGoalToRealm(created);
        publishPlannerEvent('planner.goal.created', { goal: created });
        return created;
      },

      updateGoal: (id, updates) => {
        const previousGoal = get().goals.find((g) => g.id === id);

        // Extract internal flag and clean updates
        const { __skipBudgetSync, ...cleanUpdates } = updates as any;
        const isUnlinkingBudget =
          Object.prototype.hasOwnProperty.call(updates, 'linkedBudgetId') &&
          !cleanUpdates.linkedBudgetId;

        if (!isUnlinkingBudget) {
          const targetBudgetId = cleanUpdates.linkedBudgetId ?? previousGoal?.linkedBudgetId;
          const budget = resolveLinkedBudget(targetBudgetId);
          if (budget) {
            cleanUpdates.linkedBudgetId = budget.id;
            cleanUpdates.currency = budget.currency;
          }
        } else {
          // When unlinking a budget, ignore any currency overrides from the payload
          if (previousGoal?.linkedBudgetId) {
            delete (cleanUpdates as any).currency;
          }
        }

        let updated: Goal | undefined;
        set((state) => {
          const goals = recalcGoalProgress(
            state.goals.map((goal) =>
              goal.id === id ? { ...goal, ...cleanUpdates, updatedAt: nowIso() } : goal,
            ),
            state.tasks,
            state.habits,
            state.focusSessions,
          );
          updated = goals.find((goal) => goal.id === id);
          return { goals };
        });
        if (updated) {
          persistGoalToRealm(updated);
          const skipBudgetSync = Boolean(__skipBudgetSync);

          if (!skipBudgetSync) {
            publishPlannerEvent('planner.goal.updated', { goal: updated });
          }

          // Skip budget sync if flag is set (to prevent infinite loops from FinanceDomainStore)
          if (skipBudgetSync) {
            return;
          }

          // Sync changes with linked budget
          if (updated.linkedBudgetId) {
            const financeStore = useFinanceDomainStore.getState();
            const budgetUpdates: Record<string, any> = {};

            // Sync currency
            if (cleanUpdates.currency && cleanUpdates.currency !== previousGoal?.currency) {
              budgetUpdates.currency = cleanUpdates.currency;
            }

            // Sync target value → limit amount
            if (cleanUpdates.targetValue !== undefined && cleanUpdates.targetValue !== previousGoal?.targetValue) {
              budgetUpdates.limitAmount = cleanUpdates.targetValue;
            }

            // Sync status: archived/completed → archive budget
            if ((cleanUpdates.status === 'archived' || cleanUpdates.status === 'completed') &&
                previousGoal?.status !== 'archived' && previousGoal?.status !== 'completed') {
              budgetUpdates.isArchived = true;
            }

            // Sync status: active → unarchive budget
            if (cleanUpdates.status === 'active' &&
                (previousGoal?.status === 'archived' || previousGoal?.status === 'completed')) {
              budgetUpdates.isArchived = false;
            }

            if (Object.keys(budgetUpdates).length > 0 && financeStore?.updateBudget) {
              financeStore.updateBudget(updated.linkedBudgetId, budgetUpdates);
            }

            // If goal progress increased without a finance transaction (e.g., manual current value change),
            // create a synced finance transaction to keep the linked budget aligned.
            const previousProgress = previousGoal ? calculateGoalProgress(previousGoal).progressValue : 0;
            const nextProgress = calculateGoalProgress(updated).progressValue;
            const progressDelta = nextProgress - previousProgress;
            if (progressDelta > 0 && financeStore?.createTransaction) {
              const budget = financeStore.budgets.find((b) => b.id === updated?.linkedBudgetId);
              const accountId =
                budget?.accountId ??
                financeStore.accounts.find((acc) => acc.currency === budget?.currency)?.id ??
                financeStore.accounts[0]?.id;
              if (budget) {
                financeStore.createTransaction({
                  userId: updated.userId,
                  type: budget.transactionType === 'income' ? 'income' : 'expense',
                  accountId: accountId ?? undefined,
                  amount: progressDelta,
                  currency: budget.currency,
                  baseCurrency: budget.currency,
                  rateUsedToBase: 1,
                  convertedAmountToBase: progressDelta,
                  description: `Goal: ${updated.title}`,
                  date: new Date().toISOString(),
                  budgetId: budget.id,
                  goalId: updated.id,
                  relatedBudgetId: budget.id,
                  goalName: updated.title,
                  goalType: updated.goalType,
                  plannedAmount: updated.targetValue,
                  paidAmount: progressDelta,
                });
              }
            }
          }
        }
      },

      setGoalStatus: (id, status) => {
        let updated: Goal | undefined;
        set((state) => {
          const goals = recalcGoalProgress(
            state.goals.map((goal) =>
              goal.id === id ? { ...goal, status, updatedAt: nowIso() } : goal,
            ),
            state.tasks,
            state.habits,
            state.focusSessions,
          );
          updated = goals.find((goal) => goal.id === id);
          return { goals };
        });
        if (updated) {
          persistGoalToRealm(updated);
          publishPlannerEvent('planner.goal.updated', { goal: updated });
        }
      },

      completeGoal: (id, completedDate) => {
        let completedGoal: Goal | undefined;
        set((state) => {
          const goals = recalcGoalProgress(
            state.goals.map((goal) =>
              goal.id === id
                ? {
                    ...goal,
                    status: 'completed',
                    completedDate: completedDate ?? nowIso(),
                    progressPercent: 1,
                    updatedAt: nowIso(),
                  }
                : goal,
            ),
            state.tasks,
            state.habits,
            state.focusSessions,
          );
          completedGoal = goals.find((goal) => goal.id === id);
          return { goals };
        });
        if (completedGoal) {
          persistGoalToRealm(completedGoal);
          publishPlannerEvent('planner.goal.completed', { goal: completedGoal });
        }
      },

      archiveGoal: (id) => {
        let archived: Goal | undefined;
        set((state) => {
          const goals = recalcGoalProgress(
            state.goals.map((goal) =>
              goal.id === id ? { ...goal, status: 'archived', updatedAt: nowIso() } : goal,
            ),
            state.tasks,
            state.habits,
            state.focusSessions,
          );
          archived = goals.find((goal) => goal.id === id);
          return { goals };
        });
        if (archived) {
          persistGoalToRealm(archived);
          publishPlannerEvent('planner.goal.archived', { goal: archived });
        }
      },

      pauseGoal: (id) => {
        let updated: Goal | undefined;
        set((state) => {
          const goals = recalcGoalProgress(
            state.goals.map((goal) =>
              goal.id === id ? { ...goal, status: 'paused', updatedAt: nowIso() } : goal,
            ),
            state.tasks,
            state.habits,
            state.focusSessions,
          );
          updated = goals.find((goal) => goal.id === id);
          return { goals };
        });
        if (updated) {
          persistGoalToRealm(updated);
          publishPlannerEvent('planner.goal.updated', { goal: updated });
        }
      },

      resumeGoal: (id) => {
        let updated: Goal | undefined;
        set((state) => {
          const goals = recalcGoalProgress(
            state.goals.map((goal) =>
              goal.id === id ? { ...goal, status: 'active', updatedAt: nowIso() } : goal,
            ),
            state.tasks,
            state.habits,
            state.focusSessions,
          );
          updated = goals.find((goal) => goal.id === id);
          return { goals };
        });
        if (updated) {
          persistGoalToRealm(updated);
          publishPlannerEvent('planner.goal.updated', { goal: updated });
        }
      },

      restartGoal: (id) => {
        let restarted: Goal | undefined;
        set((state) => {
          const goals = recalcGoalProgress(
            state.goals.map((goal) => {
              if (goal.id !== id) return goal;
              return {
                ...goal,
                status: 'active',
                progressPercent: 0,
                currentValue: 0,
                checkIns: [],
                financeContributionIds: [],
                completedDate: undefined,
                updatedAt: nowIso(),
              };
            }),
            state.tasks,
            state.habits,
            state.focusSessions,
          );
          restarted = goals.find((goal) => goal.id === id);
          return { goals };
        });
        if (restarted) {
          persistGoalToRealm(restarted);
          publishPlannerEvent('planner.goal.updated', { goal: restarted });
        }
      },

      deleteGoalPermanently: (id) => {
        const goal = get().goals.find((g) => g.id === id);

        // Unlink budget before deleting
        if (goal?.linkedBudgetId) {
          const financeStore = useFinanceDomainStore.getState();
          if (financeStore?.updateBudget) {
            financeStore.updateBudget(goal.linkedBudgetId, {
              linkedGoalId: undefined,
            });
          }
        }

        // Unlink debt before deleting
        if (goal?.linkedDebtId) {
          const financeStore = useFinanceDomainStore.getState();
          if (financeStore?.updateDebt) {
            financeStore.updateDebt(goal.linkedDebtId, {
              linkedGoalId: undefined,
            });
          }
        }

        set((state) => {
          const goals = state.goals.filter((goal) => goal.id !== id);
          return { goals };
        });
        deleteGoalFromRealm(id);
        publishPlannerEvent('planner.goal.deleted', { goalId: id });
      },

      createHabit: (payload) => {
        const habit: Habit = {
          ...payload,
          id: payload.id ?? generateId('habit'),
          streakCurrent: payload.streakCurrent ?? 0,
          streakBest: payload.streakBest ?? 0,
          completionRate30d: payload.completionRate30d ?? 0,
          completionHistory: payload.completionHistory ?? {},
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        const stats = recalcHabitStatsFromHistory(habit.completionHistory);
        set((state) => {
          const habits = [{ ...habit, ...stats }, ...state.habits];
          const goalIds = [habit.goalId, ...(habit.linkedGoalIds ?? [])].filter(Boolean) as string[];
          const goalsWithLinks = state.goals.map((goal) => {
            if (!goalIds.includes(goal.id)) return goal;
            const nextLinked = Array.from(new Set([...(goal.linkedHabitIds ?? []), habit.id]));
            return { ...goal, linkedHabitIds: nextLinked, updatedAt: nowIso() };
          });
          return {
            habits,
            goals: recalcGoalProgress(goalsWithLinks, state.tasks, habits, state.focusSessions),
          };
        });
        const persistedHabit = { ...habit, ...stats };
        const storedHabit = persistHabitToRealm(persistedHabit);
        const finalHabit = storedHabit ?? persistedHabit;
        if (storedHabit && storedHabit.id !== persistedHabit.id) {
          set((state) => {
            const habits = state.habits.map((h) => (h.id === persistedHabit.id ? storedHabit : h));
            return {
              habits,
              goals: recalcGoalProgress(state.goals, state.tasks, habits, state.focusSessions),
            };
          });
        }
        const goalIds = [habit.goalId, ...(habit.linkedGoalIds ?? [])].filter(Boolean) as string[];
        if (goalIds.length) {
          set((state) => {
            const goals = recalcGoalProgress(
              state.goals.map((goal) => {
                if (!goalIds.includes(goal.id)) return goal;
                const nextLinked = Array.from(new Set([...(goal.linkedHabitIds ?? []), finalHabit.id]));
                return { ...goal, linkedHabitIds: nextLinked, updatedAt: nowIso() };
              }),
              state.tasks,
              state.habits,
              state.focusSessions,
            );
            return { goals };
          });
          goalIds.forEach((goalId) => {
            const goal = get().goals.find((g) => g.id === goalId);
            if (goal) {
              persistGoalToRealm(goal);
              publishPlannerEvent('planner.goal.updated', { goal });
            }
          });
        }
        publishPlannerEvent('planner.habit.created', { habit: finalHabit });
        return finalHabit;
      },

      updateHabit: (id, updates) => {
        let updated: Habit | undefined;
        set((state) => {
          const habits = state.habits.map((habit) => {
            if (habit.id !== id) return habit;
            return { ...habit, ...updates, updatedAt: nowIso() };
          });
          updated = habits.find((habit) => habit.id === id);

          const prevHabit = state.habits.find((habit) => habit.id === id);
          const nextGoalIds = updated
            ? [updated.goalId, ...(updated.linkedGoalIds ?? [])].filter(Boolean)
            : [];
          const prevGoalIds = prevHabit
            ? [prevHabit.goalId, ...(prevHabit.linkedGoalIds ?? [])].filter(Boolean)
            : [];

          const goals = recalcGoalProgress(
            state.goals.map((goal) => {
              let linked = goal.linkedHabitIds ?? [];
              if (prevGoalIds.includes(goal.id) && !nextGoalIds.includes(goal.id)) {
                linked = linked.filter((hid) => hid !== id);
              }
              if (nextGoalIds.includes(goal.id)) {
                linked = Array.from(new Set([...linked, id]));
              }
              if (linked === goal.linkedHabitIds) {
                return goal;
              }
              return { ...goal, linkedHabitIds: linked, updatedAt: nowIso() };
            }),
            state.tasks,
            habits,
            state.focusSessions,
          );

          return {
            habits,
            goals,
          };
        });
        if (updated) {
          const storedHabit = persistHabitToRealm(updated);
          const finalHabit = storedHabit ?? updated;
          if (storedHabit && storedHabit.id !== updated.id) {
            set((state) => {
              const habits = state.habits.map((habit) => (habit.id === updated?.id ? storedHabit : habit));
              return {
                habits,
                goals: recalcGoalProgress(state.goals, state.tasks, habits, state.focusSessions),
              };
            });
          }
          publishPlannerEvent('planner.habit.updated', { habit: finalHabit });
          const goalIds = [finalHabit.goalId, ...(finalHabit.linkedGoalIds ?? [])].filter(Boolean) as string[];
          goalIds.forEach((goalId) => {
            const goal = get().goals.find((g) => g.id === goalId);
            if (goal) {
              persistGoalToRealm(goal);
              publishPlannerEvent('planner.goal.updated', { goal });
            }
          });
        }
      },

      logHabitCompletion: (id, completed, options) => {
        let evaluated: Habit | undefined;
        let evaluatedDate: string | undefined;
        let affectedGoals: Goal[] | undefined;
        set((state) => {
          const habits = state.habits.map((habit) => {
            if (habit.id !== id) {
              return habit;
            }
            const history = { ...(habit.completionHistory ?? {}) };
            const targetDate = options?.date
              ? startOfDay(typeof options.date === 'string' ? new Date(options.date) : options.date)
              : startOfDay(new Date());
            const key = dateKeyFromDate(targetDate);
            evaluatedDate = key;

            if (options?.clear) {
              delete history[key];
            } else {
              history[key] = { status: completed ? 'done' : 'miss' };
            }

            const stats = recalcHabitStatsFromHistory(history);
            const nextHabit = {
              ...habit,
              completionHistory: history,
              ...stats,
              updatedAt: nowIso(),
            };
            evaluated = nextHabit;
            return nextHabit;
          });
          return {
            habits,
            goals: recalcGoalProgress(state.goals, state.tasks, habits, state.focusSessions),
          };
        });
        if (evaluated) {
          publishPlannerEvent('planner.habit.day_evaluated', {
            habit: evaluated,
            date: evaluatedDate,
            status: completed ? 'done' : 'miss',
          });
          const persisted = persistHabitToRealm(evaluated);
          if (persisted && persisted.id !== evaluated.id) {
            set((state) => {
              const habits = state.habits.map((habit) => (habit.id === evaluated?.id ? persisted : habit));
              return {
                habits,
                goals: recalcGoalProgress(state.goals, state.tasks, habits, state.focusSessions),
              };
            });
          }
        }

        if (evaluated && evaluatedDate) {
          const goalIds = [evaluated.goalId, ...(evaluated.linkedGoalIds ?? [])].filter(
            (goalId): goalId is string => Boolean(goalId),
          );

          if (completed) {
            const value = Number.isFinite(evaluated.targetPerDay) && evaluated.targetPerDay ? evaluated.targetPerDay : 1;
            goalIds.forEach((goalId) => {
              get().addGoalCheckIn({
                goalId,
                value,
                note: evaluated?.title,
                sourceType: 'habit',
                sourceId: evaluated.id,
                dateKey: evaluatedDate,
              });
            });
          } else if (options?.clear || completed === false) {
            if (goalIds.length) {
              set((state) => {
                const goals = recalcGoalProgress(
                  state.goals.map((goal) => {
                    if (!goalIds.includes(goal.id)) {
                      return goal;
                    }
                    const existing = goal.checkIns ?? [];
                    const filtered = existing.filter(
                      (entry) =>
                        !(
                          entry.sourceType === 'habit' &&
                          entry.sourceId === evaluated?.id &&
                          (!evaluatedDate || entry.dateKey === evaluatedDate)
                        ),
                    );
                    if (filtered.length === existing.length) {
                      return goal;
                    }
                    return { ...goal, checkIns: filtered, currentValue: undefined, updatedAt: nowIso() };
                  }),
                  state.tasks,
                  state.habits,
                  state.focusSessions,
                );
                affectedGoals = goals.filter((goal) => goalIds.includes(goal.id));
                return { goals };
              });
            }
          }
        }

        if (affectedGoals?.length) {
          affectedGoals.forEach((goal) => {
            persistGoalToRealm(goal);
            publishPlannerEvent('planner.goal.progress_updated', { goal });
          });
        }
      },

      pauseHabit: (id) => {
        let updatedHabit: Habit | undefined;
        set((state) => {
          const habits = state.habits.map((habit) => {
            if (habit.id === id) {
              updatedHabit = { ...habit, status: 'paused', updatedAt: nowIso() };
              return updatedHabit;
            }
            return habit;
          });
          return {
            habits,
            goals: recalcGoalProgress(state.goals, state.tasks, habits, state.focusSessions),
          };
        });
        if (updatedHabit) {
          const storedHabit = persistHabitToRealm(updatedHabit);
          if (storedHabit && storedHabit.id !== updatedHabit.id) {
            set((state) => {
              const habits = state.habits.map((habit) => (habit.id === updatedHabit?.id ? storedHabit : habit));
              return {
                habits,
                goals: recalcGoalProgress(state.goals, state.tasks, habits, state.focusSessions),
              };
            });
          }
        }
      },

      resumeHabit: (id) => {
        let updatedHabit: Habit | undefined;
        set((state) => {
          const habits = state.habits.map((habit) => {
            if (habit.id === id) {
              updatedHabit = { ...habit, status: 'active', updatedAt: nowIso() };
              return updatedHabit;
            }
            return habit;
          });
          return {
            habits,
            goals: recalcGoalProgress(state.goals, state.tasks, habits, state.focusSessions),
          };
        });
        if (updatedHabit) {
          const storedHabit = persistHabitToRealm(updatedHabit);
          if (storedHabit && storedHabit.id !== updatedHabit.id) {
            set((state) => {
              const habits = state.habits.map((habit) => (habit.id === updatedHabit?.id ? storedHabit : habit));
              return {
                habits,
                goals: recalcGoalProgress(state.goals, state.tasks, habits, state.focusSessions),
              };
            });
          }
        }
      },

      archiveHabit: (id) => {
        let updatedHabit: Habit | undefined;
        set((state) => {
          const habits = state.habits.map((habit) => {
            if (habit.id === id) {
              updatedHabit = { ...habit, status: 'archived', updatedAt: nowIso() };
              return updatedHabit;
            }
            return habit;
          });
          return {
            habits,
            goals: recalcGoalProgress(state.goals, state.tasks, habits, state.focusSessions),
          };
        });
        if (updatedHabit) {
          const storedHabit = persistHabitToRealm(updatedHabit);
          if (storedHabit && storedHabit.id !== updatedHabit.id) {
            set((state) => {
              const habits = state.habits.map((habit) => (habit.id === updatedHabit?.id ? storedHabit : habit));
              return {
                habits,
                goals: recalcGoalProgress(state.goals, state.tasks, habits, state.focusSessions),
              };
            });
          }
        }
      },

      createTask: (payload) => {
        const task: Task = {
          ...payload,
          id: payload.id ?? generateId('task'),
          status: payload.status ?? 'active',
          focusTotalMinutes: payload.focusTotalMinutes ?? 0,
          checklist: payload.checklist ?? [],
          dependencies: payload.dependencies ?? [],
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        set((state) => {
          const tasks = [task, ...state.tasks];
          const historyEntry = createHistoryEntry({
            id: task.id,
            title: task.title,
            status: task.status,
            action: 'created',
            snapshot: task,
          });
          return {
            tasks,
            goals: recalcGoalProgress(state.goals, tasks, state.habits, state.focusSessions),
            taskHistory: [historyEntry, ...state.taskHistory].slice(0, 200),
          };
        });
        persistTaskToRealm(task);
        publishPlannerEvent('planner.task.created', { task });
        return task;
      },

      updateTask: (id, updates) => {
        let updated: Task | undefined;
        set((state) => {
          const tasks = state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates, updatedAt: nowIso() } : task,
          );
          updated = tasks.find((task) => task.id === id);
          return {
            tasks,
            goals: recalcGoalProgress(state.goals, tasks, state.habits, state.focusSessions),
          };
        });
        if (updated) {
          persistTaskToRealm(updated);
          publishPlannerEvent('planner.task.updated', { task: updated });
        }
      },

      completeTask: (id, options) => {
        let completedTask: Task | undefined;
        set((state) => {
          let completedTitle: string | undefined;
          const actualMinutes = options?.actualMinutes ?? 0;
          const tasks = state.tasks.map((task) => {
            if (task.id !== id) {
              return task;
            }
            completedTitle = task.title;
            const nextTask = {
              ...task,
              status: 'completed',
              focusTotalMinutes: (task.focusTotalMinutes ?? 0) + actualMinutes,
              updatedAt: nowIso(),
            };
            completedTask = nextTask;
            return nextTask;
          });
          const history = completedTitle && completedTask
            ? appendTaskHistoryEntry(
                state.taskHistory,
                createHistoryEntry({
                  id,
                  title: completedTitle,
                  status: 'completed',
                  action: 'completed',
                  snapshot: completedTask,
                }),
              )
            : state.taskHistory;
          return {
            tasks,
            goals: recalcGoalProgress(state.goals, tasks, state.habits, state.focusSessions),
            taskHistory: history,
          };
        });
        if (completedTask) {
          persistTaskToRealm(completedTask);
          publishPlannerEvent('planner.task.completed', { task: completedTask });
          if (completedTask.goalId) {
            const value = Number.isFinite(completedTask.progressValue)
              ? (completedTask.progressValue as number)
              : Number.isFinite(completedTask.estimatedMinutes)
                ? (completedTask.estimatedMinutes as number)
                : 1;
            get().addGoalCheckIn({
              goalId: completedTask.goalId,
              value,
              note: completedTask.title,
              sourceType: 'task',
              sourceId: completedTask.id,
              createdAt: completedTask.updatedAt,
            });
          }
        }
      },

      cancelTask: (id) => {
        let canceledTask: Task | undefined;
        let affectedGoals: Goal[] | undefined;
        set((state) => {
          let canceledTitle: string | undefined;
          const tasks = state.tasks.map((task) => {
            if (task.id !== id) {
              return task;
            }
            canceledTitle = task.title;
            const next = {
              ...task,
              status: 'canceled',
              updatedAt: nowIso(),
            };
            canceledTask = next;
            return next;
          });
          const history = canceledTitle && canceledTask
            ? appendTaskHistoryEntry(
                state.taskHistory,
                createHistoryEntry({
                  id,
                  title: canceledTitle,
                  status: 'canceled',
                  action: 'deleted',
                  snapshot: canceledTask,
                }),
              )
            : state.taskHistory;
          return {
            tasks,
            goals: recalcGoalProgress(state.goals, tasks, state.habits, state.focusSessions),
            taskHistory: history,
          };
        });
        if (canceledTask) {
          persistTaskToRealm(canceledTask);
          publishPlannerEvent('planner.task.canceled', { task: canceledTask });
          if (canceledTask.goalId) {
            set((state) => {
              const goals = recalcGoalProgress(
                state.goals.map((goal) => {
                  if (goal.id !== canceledTask?.goalId) {
                    return goal;
                  }
                  const filtered = (goal.checkIns ?? []).filter(
                    (entry) => !(entry.sourceType === 'task' && entry.sourceId === canceledTask?.id),
                  );
                  if (filtered.length === (goal.checkIns ?? []).length) {
                    return goal;
                  }
                  return { ...goal, checkIns: filtered, updatedAt: nowIso() };
                }),
                state.tasks,
                state.habits,
                state.focusSessions,
              );
              affectedGoals = goals.filter((goal) => goal.id === canceledTask?.goalId);
              return { goals };
            });
          }
        }
        if (affectedGoals?.length) {
          affectedGoals.forEach((goal) => {
            persistGoalToRealm(goal);
            publishPlannerEvent('planner.goal.progress_updated', { goal });
          });
        }
      },

      scheduleTask: (id, schedule) => {
        let scheduledTask: Task | undefined;
        set((state) => {
          let scheduledTitle: string | undefined;
          const tasks = state.tasks.map((task) => {
            if (task.id !== id) {
              return task;
            }
            scheduledTitle = task.title;
            const nextTask = {
              ...task,
              status: 'active',
              dueDate: schedule.dueDate,
              startDate: schedule.dueDate,
              timeOfDay: schedule.timeOfDay ?? task.timeOfDay,
              updatedAt: nowIso(),
            };
            scheduledTask = nextTask;
            return nextTask;
          });
          const history = scheduledTitle && scheduledTask
            ? appendTaskHistoryEntry(
                state.taskHistory,
                createHistoryEntry({
                  id,
                  title: scheduledTitle,
                  status: 'planned',
                  action: 'moved',
                  snapshot: scheduledTask,
                }),
              )
            : state.taskHistory;
          return {
            tasks,
            goals: recalcGoalProgress(state.goals, tasks, state.habits, state.focusSessions),
            taskHistory: history,
          };
        });
        if (scheduledTask) {
          persistTaskToRealm(scheduledTask);
          publishPlannerEvent('planner.task.updated', { task: scheduledTask });
        }
      },

      toggleTaskChecklist: (taskId, itemId) =>
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== taskId || !task.checklist) {
              return task;
            }
            return {
              ...task,
              checklist: task.checklist.map((item) =>
                item.id === itemId ? { ...item, completed: !item.completed } : item,
              ),
            };
          }),
        })),

      addTaskDependency: (taskId, dependency) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, dependencies: [...(task.dependencies ?? []), dependency] }
              : task,
          ),
        })),

      setTaskStatus: (taskId, status) => {
        let updatedTask: Task | undefined;
        let previousTask: Task | undefined;
        let affectedGoals: Goal[] | undefined;
        set((state) => {
          previousTask = state.tasks.find((task) => task.id === taskId);
          const tasks = state.tasks.map((task) =>
            task.id === taskId ? { ...task, status, updatedAt: nowIso() } : task,
          );
          updatedTask = tasks.find((task) => task.id === taskId);
          const historyEntry = createHistoryEntry({
            id: taskId,
            title: updatedTask?.title ?? state.tasks.find((task) => task.id === taskId)?.title ?? '',
            status,
            action: 'moved',
            snapshot: updatedTask,
          });
          return {
            tasks,
            goals: recalcGoalProgress(state.goals, tasks, state.habits, state.focusSessions),
            taskHistory: [historyEntry, ...state.taskHistory].slice(0, 200),
          };
        });
        if (updatedTask) {
          persistTaskToRealm(updatedTask);
          publishPlannerEvent('planner.task.updated', { task: updatedTask });
          if (updatedTask.goalId && status === 'completed') {
            const value = Number.isFinite(updatedTask.progressValue)
              ? (updatedTask.progressValue as number)
              : Number.isFinite(updatedTask.estimatedMinutes)
                ? (updatedTask.estimatedMinutes as number)
                : 1;
            get().addGoalCheckIn({
              goalId: updatedTask.goalId,
              value,
              note: updatedTask.title,
              sourceType: 'task',
              sourceId: updatedTask.id,
              createdAt: updatedTask.updatedAt,
            });
          } else if (previousTask?.goalId && previousTask.status === 'completed' && status !== 'completed') {
            set((state) => {
              const goals = recalcGoalProgress(
                state.goals.map((goal) => {
                  if (goal.id !== previousTask?.goalId) {
                    return goal;
                  }
                  const filtered = (goal.checkIns ?? []).filter(
                    (entry) => !(entry.sourceType === 'task' && entry.sourceId === previousTask?.id),
                  );
                  if (filtered.length === (goal.checkIns ?? []).length) {
                    return goal;
                  }
                  return { ...goal, checkIns: filtered, currentValue: undefined, updatedAt: nowIso() };
                }),
                state.tasks,
                state.habits,
                state.focusSessions,
              );
              affectedGoals = previousTask?.goalId ? goals.filter((goal) => goal.id === previousTask?.goalId) : [];
              return { goals };
            });
          }
        }
        if (affectedGoals?.length) {
          affectedGoals.forEach((goal) => {
            persistGoalToRealm(goal);
            publishPlannerEvent('planner.goal.progress_updated', { goal });
          });
        }
      },

      deleteTask: (taskId) => {
        let affectedGoal: Goal | undefined;
        let archivedTask: Task | undefined;
        set((state) => {
          const tasks = state.tasks.map((task) => {
            if (task.id !== taskId) {
              return task;
            }
            archivedTask = {
              ...task,
              status: 'archived',
              updatedAt: nowIso(),
            };
            return archivedTask;
          });
          if (!archivedTask) {
            return state;
          }
          const historyEntry = createHistoryEntry({
            id: taskId,
            title: archivedTask?.title ?? '',
            status: archivedTask?.status ?? 'archived',
            action: 'deleted',
            snapshot: archivedTask,
          });
          const nextGoals = recalcGoalProgress(
            state.goals.map((goal) => {
              if (archivedTask?.goalId && goal.id === archivedTask.goalId) {
                const filtered = (goal.checkIns ?? []).filter(
                  (entry) => !(entry.sourceType === 'task' && entry.sourceId === archivedTask.id),
                );
                if (filtered.length !== (goal.checkIns ?? []).length) {
                  affectedGoal = { ...goal, checkIns: filtered, currentValue: undefined, updatedAt: nowIso() };
                  return affectedGoal;
                }
              }
              return goal;
            }),
            tasks,
            state.habits,
            state.focusSessions,
          );
          return {
            tasks,
            goals: nextGoals,
            taskHistory: [historyEntry, ...state.taskHistory].slice(0, 200),
          };
        });
        if (archivedTask) {
          persistTaskToRealm(archivedTask);
          publishPlannerEvent('planner.task.updated', { task: archivedTask });
        }
        if (affectedGoal) {
          persistGoalToRealm(affectedGoal);
          publishPlannerEvent('planner.goal.progress_updated', { goal: affectedGoal });
        }
      },

      deleteTaskPermanently: (taskId) => {
        let affectedGoal: Goal | undefined;
        set((state) => {
          const removedTask = state.tasks.find((task) => task.id === taskId);
          const tasks = state.tasks.filter((task) => task.id !== taskId);
          const nextGoals = recalcGoalProgress(
            state.goals.map((goal) => {
              if (removedTask?.goalId && goal.id === removedTask.goalId) {
                const filtered = (goal.checkIns ?? []).filter(
                  (entry) => !(entry.sourceType === 'task' && entry.sourceId === removedTask.id),
                );
                if (filtered.length !== (goal.checkIns ?? []).length) {
                  affectedGoal = { ...goal, checkIns: filtered, currentValue: undefined, updatedAt: nowIso() };
                  return affectedGoal;
                }
              }
              return goal;
            }),
            tasks,
            state.habits,
            state.focusSessions,
          );
          return {
            tasks,
            goals: nextGoals,
            taskHistory: state.taskHistory.filter((entry) => entry.taskId !== taskId),
          };
        });
        deleteTaskFromRealm(taskId);
        if (affectedGoal) {
          persistGoalToRealm(affectedGoal);
          publishPlannerEvent('planner.goal.progress_updated', { goal: affectedGoal });
        }
      },

      restoreTaskFromHistory: (historyId) => {
        let restoredTask: Task | undefined;
        set((state) => {
          const entryIndex = state.taskHistory.findIndex((item) => item.historyId === historyId);
          if (entryIndex === -1) {
            return state;
          }
          const entry = state.taskHistory[entryIndex];
          if (!entry.snapshot) {
            return {
              taskHistory: state.taskHistory.filter((item, idx) => idx !== entryIndex),
            };
          }
          const restored: Task = {
            ...entry.snapshot,
            status: ['canceled', 'completed', 'archived'].includes(entry.snapshot.status)
              ? 'active'
              : entry.snapshot.status,
            updatedAt: nowIso(),
          };
          restoredTask = restored;
          const tasks = [restored, ...state.tasks.filter((task) => task.id !== restored.id)];
          return {
            tasks,
            goals: recalcGoalProgress(state.goals, tasks, state.habits, state.focusSessions),
            taskHistory: state.taskHistory.filter((item, idx) => idx !== entryIndex),
          };
        });
        if (restoredTask) {
          persistTaskToRealm(restoredTask);
        }
      },

      removeHistoryEntry: (historyId) =>
        set((state) => ({
          taskHistory: state.taskHistory.filter((entry) => entry.historyId !== historyId),
        })),

      createFocusSession: (payload) => {
        const session: FocusSession = {
          ...payload,
          id: generateId('focus'),
          status: payload.status ?? 'in_progress',
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        set((state) => {
          const focusSessions = [session, ...state.focusSessions];
          return {
            focusSessions,
            goals: recalcGoalProgress(state.goals, state.tasks, state.habits, focusSessions),
          };
        });
        return session;
      },

      updateFocusSession: (id, updates) =>
        set((state) => {
          const focusSessions = state.focusSessions.map((session) =>
            session.id === id ? { ...session, ...updates, updatedAt: nowIso() } : session,
          );
          return {
            focusSessions,
            goals: recalcGoalProgress(state.goals, state.tasks, state.habits, focusSessions),
          };
        }),

      startFocus: (payload) => {
        const plannedMinutes = payload.plannedMinutes ?? 25;
        const session = get().createFocusSession({
          userId: 'local-user',
          taskId: payload.taskId,
          goalId: payload.goalId,
          plannedMinutes,
          startedAt: nowIso(),
          notes: payload.notes,
        });
        if (payload.taskId) {
          set((state) => {
            const tasks = state.tasks.map((task) =>
              task.id === payload.taskId
                ? { ...task, status: 'in_progress', lastFocusSessionId: session.id, updatedAt: nowIso() }
                : task,
            );
            return {
              tasks,
              goals: recalcGoalProgress(state.goals, tasks, state.habits, state.focusSessions),
            };
          });
        }
        publishPlannerEvent('planner.focus.started', { session });
        return session;
      },

      pauseFocus: (sessionId) =>
        set((state) => {
          const focusSessions = state.focusSessions.map((session) =>
            session.id === sessionId ? { ...session, status: 'paused', updatedAt: nowIso() } : session,
          );
          return {
            focusSessions,
            goals: recalcGoalProgress(state.goals, state.tasks, state.habits, focusSessions),
          };
        }),

      resumeFocus: (sessionId) =>
        set((state) => {
          const focusSessions = state.focusSessions.map((session) =>
            session.id === sessionId ? { ...session, status: 'in_progress', updatedAt: nowIso() } : session,
          );
          return {
            focusSessions,
            goals: recalcGoalProgress(state.goals, state.tasks, state.habits, focusSessions),
          };
        }),

      finishFocus: (sessionId, options) => {
        let completedSession: FocusSession | undefined;
        set((state) => {
          const targetSession = state.focusSessions.find((session) => session.id === sessionId);
          if (!targetSession) {
            return state;
          }
          const actualMinutes =
            options?.actualMinutes ?? targetSession.actualMinutes ?? targetSession.plannedMinutes ?? 0;
          const focusSessions = state.focusSessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  status: 'completed',
                  actualMinutes,
                  endedAt: session.endedAt ?? nowIso(),
                  updatedAt: nowIso(),
                }
              : session,
          );
          completedSession = focusSessions.find((session) => session.id === sessionId);
          let tasks = state.tasks;
          if (targetSession.taskId) {
            tasks = state.tasks.map((task) =>
              task.id === targetSession.taskId
                ? {
                    ...task,
                    focusTotalMinutes: (task.focusTotalMinutes ?? 0) + actualMinutes,
                    lastFocusSessionId: sessionId,
                    updatedAt: nowIso(),
                  }
                : task,
            );
          }
          return {
            focusSessions,
            tasks,
            goals: recalcGoalProgress(state.goals, tasks, state.habits, focusSessions),
          };
        });
        if (completedSession) {
          publishPlannerEvent('planner.focus.completed', { session: completedSession });
        }
      },

      cancelFocus: (sessionId) =>
        set((state) => {
          const focusSessions = state.focusSessions.map((session) =>
            session.id === sessionId ? { ...session, status: 'canceled', updatedAt: nowIso() } : session,
          );
          return {
            focusSessions,
            goals: recalcGoalProgress(state.goals, state.tasks, state.habits, focusSessions),
          };
        }),
      hydrateFromRealm: (payload) =>
        set((state) => {
          const nextGoals = payload.goals ?? state.goals;
          const nextHabits = payload.habits ?? state.habits;
          const nextTasks = payload.tasks ?? state.tasks;
          const nextFocusSessions = payload.focusSessions ?? state.focusSessions;
          return {
            ...state,
            ...payload,
            goals: recalcGoalProgress(nextGoals, nextTasks, nextHabits, nextFocusSessions),
            habits: nextHabits,
            tasks: nextTasks,
            focusSessions: nextFocusSessions,
          };
        }),
      reset: () => set(createInitialPlannerCollections()),
    }),
    {
      name: 'planner-domain',
      storage: createJSONStorage(() => mmkvStorageAdapter),
      version: 1,
      partialize: (state) => ({
        goals: state.goals,
        habits: state.habits,
        tasks: state.tasks,
        focusSessions: state.focusSessions,
        taskHistory: state.taskHistory,
      }),
    }
  )
);
