import { create } from 'zustand';

import type { FocusSession, Goal, Habit, Task } from '@/domain/planner/types';
import { plannerEventBus } from '@/events/plannerEventBus';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import type { GoalSummary, HabitSummary, HomeSnapshot, TaskSummary } from '@/types/plannerSummaries';
import { startOfDay } from '@/utils/calendar';
import {
  calculateTaskProgress,
  calculateHabitProgress,
  calculateGoalProgress as calculateGoalProgressAverage,
} from '@/utils/progressCalculator';
import { calculateGoalProgress as buildGoalProgress } from '@/utils/goalProgress';

interface PlannerAggregatesState {
  taskSummaries: TaskSummary[];
  goalSummaries: GoalSummary[];
  habitSummaries: HabitSummary[];
  homeSnapshot: HomeSnapshot;
  recompute: () => void;
}

const todayKey = () => startOfDay(new Date()).toISOString().slice(0, 10);

const isHistoricalTask = (status: Task['status']) =>
  status === 'completed' || status === 'archived' || status === 'deleted' || status === 'canceled';

const isPlannedTask = (status: Task['status']) =>
  status === 'planned' || status === 'active' || status === 'in_progress' || status === 'overdue' || status === 'inbox';

const computeTaskSummary = (task: Task): TaskSummary => {
  const subtasksTotal = task.checklist?.length ?? 0;
  const subtasksDone = task.checklist?.filter((item) => item.completed).length ?? 0;
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const badges = {
    overdue: Boolean(due && due.getTime() < Date.now() && !isHistoricalTask(task.status)),
    today: Boolean(due && due.toISOString().slice(0, 10) === todayKey()),
    planned: isPlannedTask(task.status),
  };
  return {
    taskId: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    timeOfDay: task.timeOfDay,
    estimatedMin: task.estimatedMinutes,
    goalId: task.goalId,
    habitId: task.habitId,
    financeLink: task.financeLink,
    focusTotalMin: task.focusTotalMinutes ?? 0,
    nextAction: undefined,
    badges,
    subtasksDone,
    subtasksTotal,
  };
};

const computeGoalSummary = (goal: Goal, tasks: Task[], habits: Habit[]): GoalSummary => {
  const milestonesTotal = goal.milestones?.length ?? 0;
  const milestonesDone = goal.milestones?.filter((m) => m.completedAt).length ?? 0;
  const habitsLinked = habits.filter((h) => h.goalId === goal.id);
  const tasksLinked = tasks.filter(
    (t) => t.goalId === goal.id && !isHistoricalTask(t.status),
  );
  const progress = buildGoalProgress(goal);
  return {
    goalId: goal.id,
    title: goal.title,
    type: goal.goalType,
    unit: goal.unit,
    currency: goal.currency,
    target: progress.displayTarget,
    current: progress.displayCurrent,
    progressPercent: goal.status === 'completed' ? 1 : progress.progressPercent,
    deadline: goal.targetDate,
    eta: undefined,
    riskFlags: [],
    milestonesDone,
    milestonesTotal,
    badges: {
      habitsToday: habitsLinked.length ? habitsLinked.length : undefined,
      nextTask: tasksLinked[0]?.title ?? null,
      financeLink: goal.financeMode ?? null,
    },
    nextAction: tasksLinked[0]?.title,
  };
};

const computeHabitSummary = (habit: Habit): HabitSummary => {
  const today = todayKey();
  const todayEntry = habit.completionHistory ? habit.completionHistory[today] : undefined;
  const todayStatus: HabitSummary['todayStatus'] = todayEntry
    ? (typeof todayEntry === 'string' ? todayEntry === 'done' : todayEntry.status === 'done')
      ? 'done'
      : 'remaining'
    : undefined;

  const todayValue =
    typeof todayEntry === 'object' && todayEntry?.value != null ? todayEntry.value : undefined;
  const remainingValue =
    habit.completionMode === 'numeric' && habit.targetPerDay
      ? Math.max(0, habit.targetPerDay - (todayValue ?? 0))
      : undefined;

  return {
    habitId: habit.id,
    title: habit.title,
    frequency: habit.frequency,
    completionMode: habit.completionMode,
    targetPerDay: habit.targetPerDay,
    unit: habit.unit,
    todayStatus,
    remainingValue,
    streakCurrent: habit.streakCurrent,
    streakBest: habit.streakBest,
    completionRate30d: habit.completionRate30d,
    goalId: habit.goalId,
    financeRule: habit.financeRule,
  };
};

const computeFocusProductivity = (sessions: FocusSession[], targetDate: Date) => {
  const dayKey = startOfDay(targetDate).toISOString().slice(0, 10);
  const minutes = sessions
    .filter((session) => session.startedAt && session.startedAt.slice(0, 10) === dayKey)
    .reduce((sum, session) => sum + (session.actualMinutes ?? session.plannedMinutes ?? 0), 0);
  return Math.min(1, minutes / 120);
};

const computeHomeSnapshot = (
  goals: GoalSummary[],
  habits: HabitSummary[],
  tasks: TaskSummary[],
): HomeSnapshot => {
  const domain = usePlannerDomainStore.getState();
  const today = startOfDay(new Date());

  // Use centralized progress calculator (returns 0-100, convert to 0-1 for storage)
  const taskProgressPercent = calculateTaskProgress(domain.tasks, today) / 100;
  const habitProgressPercent = calculateHabitProgress(domain.habits, today) / 100;
  const goalProgressPercent = calculateGoalProgressAverage(domain.goals) ?? 0;
  const focusPercent = computeFocusProductivity(domain.focusSessions ?? [], today);

  // Tasks for today (keep for counts)
  const tasksToday = tasks.filter((t) => t.badges.today);

  // Определяем at-risk цели (прогресс < 30% и дедлайн близок)
  const now = Date.now();
  const atRiskGoals = goals
    .filter((g) => {
      if (!g.deadline) return false;
      const deadlineTime = new Date(g.deadline).getTime();
      const daysUntilDeadline = (deadlineTime - now) / (1000 * 60 * 60 * 24);
      return g.progressPercent < 0.3 && daysUntilDeadline > 0 && daysUntilDeadline <= 7;
    })
    .map((g) => g.goalId);

  // Habits today count
  const habitsToday = habits.filter((h) => h.todayStatus !== undefined);

  return {
    date: todayKey(),
    rings: {
      goals: Number((goalProgressPercent / 100).toFixed(3)),
      habits: Number(habitProgressPercent.toFixed(3)),
      productivity: Number(focusPercent.toFixed(3)),
      finance: 0, // Finance% будет обновляться из Finance модуля
    },
    today: {
      tasksDue: tasksToday.length,
      habitsDue: habitsToday.length,
      nextEvents: [],
    },
    alerts: {
      atRiskGoals,
      budgetRisk: [], // Будет заполняться из Finance
      debtDue: [], // Будет заполняться из Finance
    },
  };
};

export const usePlannerAggregatesStore = create<PlannerAggregatesState>((set) => {
  const recompute = () => {
    const domain = usePlannerDomainStore.getState();
    const taskSummaries = domain.tasks.map(computeTaskSummary);
    const goalSummaries = domain.goals.map((goal) =>
      computeGoalSummary(goal, domain.tasks, domain.habits),
    );
    const habitSummaries = domain.habits.map(computeHabitSummary);
    const homeSnapshot = computeHomeSnapshot(goalSummaries, habitSummaries, taskSummaries);
    set({ taskSummaries, goalSummaries, habitSummaries, homeSnapshot });
  };

  // Initial compute
  recompute();

  const plannerEvents: Parameters<typeof plannerEventBus.subscribe>[0][] = [
    'planner.task.created',
    'planner.task.updated',
    'planner.task.completed',
    'planner.task.canceled',
    'planner.goal.created',
    'planner.goal.updated',
    'planner.goal.completed',
    'planner.goal.archived',
    'planner.goal.progress_updated',
    'planner.habit.created',
    'planner.habit.updated',
    'planner.habit.day_evaluated',
    'planner.focus.started',
    'planner.focus.completed',
    'finance.tx.created',
    'finance.tx.updated',
    'finance.budget.spending_changed',
    'finance.debt.created',
    'finance.debt.payment_added',
    'finance.debt.status_changed',
    'insights.actions.apply',
  ];

  plannerEvents.forEach((eventName) => {
    plannerEventBus.subscribe(eventName, () => recompute());
  });

  // Keep aggregates in sync with persisted planner store (incl. hydration)
  usePlannerDomainStore.subscribe(() => recompute());

  return {
    taskSummaries: [],
    goalSummaries: [],
    habitSummaries: [],
    homeSnapshot: {
      date: todayKey(),
      rings: { goals: 0, habits: 0, productivity: 0, finance: 0 },
      today: { tasksDue: 0, habitsDue: 0, nextEvents: [] },
      alerts: { atRiskGoals: [], budgetRisk: [], debtDue: [] },
    },
    recompute,
  };
});
