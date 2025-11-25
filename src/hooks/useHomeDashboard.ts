import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';

import type { WidgetType } from '@/config/widgetConfig';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceCurrency } from '@/hooks/useFinanceCurrency';
import type {
  CalendarIndicatorsMap,
  HomeDataStatus,
  ProgressData,
  Task,
  Goal as HomeGoal,
  CalendarEventMap,
  CalendarEventType,
} from '@/types/home';
import type {
  Task as PlannerTask,
  Goal as PlannerGoal,
  Habit as PlannerHabit,
  FocusSession,
} from '@/domain/planner/types';
import type { Budget, Transaction } from '@/domain/finance/types';
import { normalizeFinanceCurrency } from '@/utils/financeCurrency';
import {
  addDays,
  addMonths,
  isSameDay,
  startOfDay,
  startOfMonth,
  toISODateKey,
} from '@/utils/calendar';
import { calculateHabitProgress, calculateTaskProgress } from '@/utils/progressCalculator';
import { useShallow } from 'zustand/shallow';
import { Activity, BookOpen, Brain, Dumbbell, Heart, Sparkles } from 'lucide-react-native';

type WidgetDailyState = {
  hasData: boolean;
  props?: Record<string, unknown>;
};

interface UseHomeDashboardResult {
  selectedDate: Date;
  selectDate: (date: Date) => void;
  progress: ProgressData | null;
  widgetData: Partial<Record<WidgetType, WidgetDailyState>>;
  loading: boolean;
  refreshing: boolean;
  calendarIndicators: CalendarIndicatorsMap;
  calendarEvents: CalendarEventMap;
  refresh: () => void;
}

const METRICS_ORDER: (keyof ProgressData)[] = ['tasks', 'budget', 'focus'];

const mapValueToStatus = (value?: number | null): HomeDataStatus => {
  if (value == null) return 'muted';
  if (value >= 70) return 'success';
  if (value >= 40) return 'warning';
  return 'danger';
};

const buildIndicators = (progress: ProgressData | null | undefined): HomeDataStatus[] => {
  return METRICS_ORDER.map((key) => mapValueToStatus(progress?.[key]));
};

export function useHomeDashboard(initialDate?: Date): UseHomeDashboardResult {
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(initialDate ?? new Date()));
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const plannerState = usePlannerDomainStore(
    useShallow((state) => ({
      tasks: state.tasks,
      goals: state.goals,
      habits: state.habits,
      focusSessions: state.focusSessions,
    })),
  ) as PlannerSnapshot;
  const financeState = useFinanceDomainStore(
    useShallow((state) => ({
      transactions: state.transactions,
      budgets: state.budgets,
    })),
  ) as FinanceSnapshot;

  const { locale } = useLocalization();
  const { convertAmount, globalCurrency } = useFinanceCurrency();

  const budgetScore = useMemo(
    () => computeBudgetScore(financeState.budgets),
    [financeState.budgets],
  );

  const progress = useMemo(
    () => computeProgressData(selectedDate, plannerState.tasks, plannerState.habits, budgetScore),
    [budgetScore, plannerState.habits, plannerState.tasks, selectedDate],
  );

  const widgetData = useMemo(() => {
    return buildWidgetPayloads({
      selectedDate,
      plannerState,
      financeState,
      convertAmount,
      globalCurrency,
      budgetScore,
      locale,
    });
  }, [budgetScore, convertAmount, financeState, globalCurrency, locale, plannerState, selectedDate]);

  const calendarIndicators = useMemo<CalendarIndicatorsMap>(() => {
    const dateKeys = new Set<string>();
    const appendKey = (value?: string | Date | null) => {
      if (!value) return;
      const date = typeof value === 'string' ? new Date(value) : value;
      const iso = toISODateKey(date);
      dateKeys.add(iso);
    };

    plannerState.tasks.forEach((task) => appendKey(task.dueDate));
    plannerState.habits.forEach((habit) => {
      if (!habit.completionHistory) return;
      Object.keys(habit.completionHistory).forEach((key) => appendKey(`${key}T00:00:00.000Z`));
    });
    plannerState.goals.forEach((goal) => {
      goal.checkIns?.forEach((checkIn) => appendKey(checkIn.dateKey ?? checkIn.createdAt));
      goal.milestones?.forEach((milestone) => {
        appendKey(milestone.completedAt);
        appendKey(milestone.dueDate);
      });
    });
    financeState.transactions.forEach((txn) => appendKey(txn.date));
    dateKeys.add(toISODateKey(selectedDate));

    const indicators: CalendarIndicatorsMap = {};
    dateKeys.forEach((key) => {
      const date = startOfDay(new Date(key));
      const dailyProgress = computeProgressData(
        date,
        plannerState.tasks,
        plannerState.habits,
        budgetScore,
      );
      indicators[key] = buildIndicators(dailyProgress);
    });
    return indicators;
  }, [budgetScore, financeState.transactions, plannerState.goals, plannerState.habits, plannerState.tasks, selectedDate]);

  const calendarEvents = useMemo<CalendarEventMap>(() => {
    const events: CalendarEventMap = {};
    const register = (dateValue: string | Date | undefined | null, kind: CalendarEventType) => {
      if (!dateValue) return;
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      const iso = toISODateKey(date);
      if (!events[iso]) {
        events[iso] = {};
      }
      events[iso]![kind] = (events[iso]![kind] ?? 0) + 1;
    };

    plannerState.tasks.forEach((task) => register(task.dueDate, 'tasks'));
    plannerState.habits.forEach((habit) => {
      if (!habit.completionHistory) return;
      Object.keys(habit.completionHistory).forEach((dateKey) => {
        register(`${dateKey}T00:00:00.000Z`, 'habits');
      });
    });
    plannerState.goals.forEach((goal) => {
      goal.checkIns?.forEach((checkIn) => register(checkIn.dateKey ?? checkIn.createdAt, 'goals'));
      goal.milestones?.forEach((milestone) => {
        register(milestone.completedAt ?? milestone.dueDate, 'goals');
      });
    });
    financeState.transactions.forEach((txn) => register(txn.date, 'finance'));

    return events;
  }, [financeState.transactions, plannerState.goals, plannerState.habits, plannerState.tasks]);

  const selectDate = useCallback((date: Date) => {
    const normalized = startOfDay(date);
    setRefreshing(true);
    setSelectedDate(normalized);
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  useEffect(() => {
    if (!refreshing) {
      return;
    }
    const timer = setTimeout(() => setRefreshing(false), 240);
    return () => clearTimeout(timer);
  }, [refreshing]);

  const loading = false;

  return {
    selectedDate,
    selectDate,
    progress,
    widgetData,
    loading,
    refreshing,
    calendarIndicators,
    calendarEvents,
    refresh,
  };
}

function computeProgressData(
  targetDate: Date,
  tasks: PlannerTask[],
  habits: PlannerHabit[],
  budgetScore: number,
): ProgressData {
  return {
    tasks: calculateTaskProgress(tasks, targetDate),
    budget: budgetScore,
    focus: calculateHabitProgress(habits, targetDate),
  };
}

type PlannerSnapshot = {
  tasks: PlannerTask[];
  goals: PlannerGoal[];
  habits: PlannerHabit[];
  focusSessions: FocusSession[];
};

type FinanceSnapshot = {
  transactions: Transaction[];
  budgets: Budget[];
};

type WeeklyStatsSnapshot = {
  tasksCompleted: number;
  totalTasks: number;
  focusHours: number;
  streak: number;
};

type FocusSessionsSnapshot = {
  sessions: { id: string; task: string; duration: number; completed: boolean }[];
  summary: {
    completed: number;
    totalMinutes: number;
    nextSessionMinutes: number | null;
  };
  trend: { label: string; value: number }[];
};

const HABIT_ICON_MAP: Record<string, ComponentType<{ size?: number; color?: string }>> = {
  health: Dumbbell,
  personal: Sparkles,
  productivity: Brain,
  education: BookOpen,
  finance: Activity,
  other: Heart,
};

interface BuildWidgetPayloadParams {
  selectedDate: Date;
  plannerState: PlannerSnapshot;
  financeState: FinanceSnapshot;
  convertAmount: (amount: number, from: string, to?: string) => number;
  globalCurrency: string;
  budgetScore: number;
  locale: string;
}

function buildWidgetPayloads({
  selectedDate,
  plannerState,
  financeState,
  convertAmount,
  globalCurrency,
  budgetScore,
  locale,
}: BuildWidgetPayloadParams): Partial<Record<WidgetType, WidgetDailyState>> {
  const tasksForDay = getTasksForDate(plannerState.tasks, selectedDate);
  const hasTasksForSelectedDate = tasksForDay.length > 0;
  const tasksFeed = tasksForDay;
  const goals = mapGoals(plannerState.goals);
  const habits = mapHabits(plannerState.habits, selectedDate);
  const weeklyStats = buildWeeklyStats(plannerState.tasks, plannerState.focusSessions, plannerState.habits, selectedDate);
  const focusSessions = buildFocusSessions(plannerState.focusSessions, plannerState.tasks, selectedDate);
  const recentTransactions = buildRecentTransactions(financeState.transactions, locale);
  const spending = buildSpendingSummary(financeState.transactions, selectedDate, convertAmount, globalCurrency);
  const budgetList = buildBudgetList(financeState.budgets, globalCurrency, convertAmount);
  const cashFlow = buildCashFlowTimeline(financeState.transactions, selectedDate, convertAmount, globalCurrency, locale);
  const productivity = buildProductivityInsights(progressFromStats(weeklyStats, budgetScore), weeklyStats, focusSessions.trend);
  const hasPlannerBacklog = plannerState.tasks.length > 0;
  const hasGoals = plannerState.goals.length > 0;
  const hasHabits = plannerState.habits.length > 0;
  const hasFocusSessions = plannerState.focusSessions.length > 0;
  const hasWeeklyData = hasPlannerBacklog || hasFocusSessions;
  const hasTransactions = financeState.transactions.length > 0;
  const hasExpenses = financeState.transactions.some((txn) => txn.type === 'expense');
  const hasBudgets = financeState.budgets.length > 0;

  return {
    'daily-tasks': {
      hasData: hasTasksForSelectedDate,
      props: { initialTasks: tasksFeed.slice(0, 5) },
    },
    goals: {
      hasData: hasGoals,
      props: { goals: goals.slice(0, 3) },
    },
    habits: {
      hasData: hasHabits,
      props: { habits: habits.slice(0, 3) },
    },
    'weekly-review': {
      hasData: hasWeeklyData,
      props: { stats: weeklyStats },
    },
    'focus-sessions': {
      hasData: hasFocusSessions,
      props: {
        sessions: focusSessions.sessions.slice(0, 4),
        summary: focusSessions.summary,
      },
    },
    transactions: {
      hasData: hasTransactions,
      props: { transactions: recentTransactions.slice(0, 5) },
    },
    'spending-summary': {
      hasData: hasExpenses,
      props: { categories: spending.categories, total: spending.total },
    },
    'budget-progress': {
      hasData: hasBudgets,
      props: { budgets: budgetList.slice(0, 3) },
    },
    'cash-flow': {
      hasData: hasTransactions,
      props: { days: cashFlow.days },
    },
    'productivity-insights': {
      hasData: hasWeeklyData || hasBudgets,
      props: productivity,
    },
    'wellness-overview': {
      hasData: false,
    },
  } satisfies Partial<Record<WidgetType, WidgetDailyState>>;
}

function getTasksForDate(tasks: PlannerTask[], date: Date): Task[] {
  return tasks
    .filter((task) => (task.dueDate ? isSameDay(new Date(task.dueDate), date) : false))
    .sort((a, b) => {
      const aTime = a.timeOfDay ?? a.dueDate ?? '';
      const bTime = b.timeOfDay ?? b.dueDate ?? '';
      return aTime.localeCompare(bTime);
    })
    .map(mapPlannerTaskToHomeTask);
}

function formatTaskTime(task: PlannerTask): string {
  if (task.timeOfDay) {
    return task.timeOfDay;
  }
  if (task.dueDate) {
    const date = new Date(task.dueDate);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
  return 'Anytime';
}

const mapPlannerTaskToHomeTask = (task: PlannerTask): Task => ({
  id: task.id,
  title: task.title,
  time: formatTaskTime(task),
  completed: task.status === 'completed',
  priority: task.priority,
  context: task.context,
});

function mapGoals(goals: PlannerGoal[]): HomeGoal[] {
  return goals
    .filter((goal) => goal.status === 'active')
    .map((goal) => {
      const percent = Math.round((goal.progressPercent ?? 0) * 100);
      const target = goal.targetValue ?? 0;
      const current = target > 0 ? Math.round((percent / 100) * target) : 0;
      return {
        id: goal.id,
        title: goal.title,
        progress: percent,
        current,
        target,
        unit: goal.unit ?? goal.currency ?? '',
        category: (goal.goalType === 'financial' ? 'financial' : 'personal') as HomeGoal['category'],
      };
    })
    .sort((a, b) => b.progress - a.progress);
}

function mapHabits(habits: PlannerHabit[], date: Date) {
  const weekday = date.getDay();
  return habits
    .filter((habit) => habit.status === 'active')
    .map((habit) => ({
      id: habit.id,
      name: habit.title,
      streak: habit.streakCurrent,
      completed: habit.daysOfWeek ? habit.daysOfWeek.includes(weekday) : false,
      icon: HABIT_ICON_MAP[habit.habitType] ?? HabitatFallbackIcon,
    }));
}

const HabitatFallbackIcon: ComponentType<{ size?: number; color?: string }> = Heart;

function buildWeeklyStats(
  tasks: PlannerTask[],
  focusSessions: FocusSession[],
  habits: PlannerHabit[],
  selectedDate: Date,
): WeeklyStatsSnapshot {
  const start = startOfDay(addDays(selectedDate, -6));
  const end = startOfDay(selectedDate);
  const tasksInWindow = tasks.filter((task) => {
    if (!task.dueDate) return false;
    const due = startOfDay(new Date(task.dueDate));
    return due >= start && due <= end;
  });
  const completed = tasksInWindow.filter((task) => task.status === 'completed').length;
  const focusMinutes = focusSessions
    .filter((session) => {
      if (!session.startedAt) return false;
      const started = startOfDay(new Date(session.startedAt));
      return started >= start && started <= end;
    })
    .reduce((sum, session) => sum + (session.actualMinutes ?? session.plannedMinutes ?? 0), 0);
  const topStreak = habits.reduce((max, habit) => Math.max(max, habit.streakCurrent ?? 0), 0);

  return {
    tasksCompleted: completed,
    totalTasks: tasksInWindow.length,
    focusHours: Number((focusMinutes / 60).toFixed(1)),
    streak: topStreak,
  };
}

function buildFocusSessions(
  sessions: FocusSession[],
  tasks: PlannerTask[],
  date: Date,
): FocusSessionsSnapshot {
  const taskMap = new Map(tasks.map((task) => [task.id, task.title]));
  const dailySessions = sessions
    .filter((session) => (session.startedAt ? isSameDay(new Date(session.startedAt), date) : false))
    .map((session) => ({
      id: session.id,
      task: session.taskId ? taskMap.get(session.taskId) ?? 'Focus session' : 'Focus session',
      duration: session.actualMinutes ?? session.plannedMinutes ?? 25,
      completed: session.status === 'completed',
    }));

  const summary = {
    completed: dailySessions.filter((session) => session.completed).length,
    totalMinutes: dailySessions.reduce((sum, session) => sum + session.duration, 0),
    nextSessionMinutes: dailySessions.find((session) => !session.completed)?.duration ?? null,
  };

  const trend = Array.from({ length: 5 }).map((_, index) => {
    const targetDate = addDays(date, index - 4);
    const minutes = sessions
      .filter((session) => (session.startedAt ? isSameDay(new Date(session.startedAt), targetDate) : false))
      .reduce((sum, session) => sum + (session.actualMinutes ?? session.plannedMinutes ?? 0), 0);
    return { label: targetDate.toLocaleDateString(undefined, { weekday: 'short' }), value: Math.min(100, minutes) };
  });

  return {
    sessions: dailySessions,
    summary,
    trend,
  };
}

function buildRecentTransactions(transactions: Transaction[], locale: string) {
  return [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map((txn) => ({
      id: txn.id,
      type: txn.type,
      amount: txn.amount,
      currency: txn.currency,
      category: txn.categoryId ?? 'General',
      date: formatTransactionDate(txn.date, locale),
    }));
}

function formatTransactionDate(dateInput: string, locale: string) {
  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) {
    return dateInput;
  }
  return parsed.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

function buildSpendingSummary(
  transactions: Transaction[],
  selectedDate: Date,
  convertAmount: (amount: number, from: string, to?: string) => number,
  targetCurrency: string,
) {
  const start = startOfMonth(selectedDate);
  const end = addMonths(start, 1);
  const expenses = transactions.filter((txn) => {
    if (txn.type !== 'expense') return false;
    const date = new Date(txn.date);
    return date >= start && date < end;
  });
  const categoryTotals = expenses.reduce<Record<string, number>>((acc, txn) => {
    const currency = normalizeFinanceCurrency(txn.currency as string);
    const amount = convertAmount(Math.abs(txn.amount), currency, targetCurrency);
    const key = txn.categoryId ?? 'Other';
    acc[key] = (acc[key] ?? 0) + amount;
    return acc;
  }, {});
  const categories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, amount]) => ({ label, amount: Math.round(amount) }));
  const total = categories.reduce((sum, item) => sum + item.amount, 0);
  return { categories, total };
}

function buildBudgetList(
  budgets: Budget[],
  targetCurrency: string,
  convertAmount: (amount: number, from: string, to?: string) => number,
) {
  return budgets
    .map((budget) => ({
      label: budget.name,
      used: Math.round(convertAmount(budget.spentAmount, normalizeFinanceCurrency(budget.currency as string), targetCurrency)),
      total: Math.round(convertAmount(budget.limitAmount, normalizeFinanceCurrency(budget.currency as string), targetCurrency)),
      percentUsed: budget.percentUsed,
    }))
    .sort((a, b) => b.percentUsed - a.percentUsed);
}

function buildCashFlowTimeline(
  transactions: Transaction[],
  selectedDate: Date,
  convertAmount: (amount: number, from: string, to?: string) => number,
  targetCurrency: string,
  locale: string,
) {
  const days = Array.from({ length: 5 }).map((_, index) => {
    const date = startOfDay(addDays(selectedDate, index - 4));
    const iso = toISODateKey(date);
    const dailyTransactions = transactions.filter((txn) =>
      txn.date ? toISODateKey(new Date(txn.date)) === iso : false,
    );
    const income = dailyTransactions
      .filter((txn) => txn.type === 'income')
      .reduce((sum, txn) => sum + convertAmount(txn.amount, normalizeFinanceCurrency(txn.currency as string), targetCurrency), 0);
    const expense = dailyTransactions
      .filter((txn) => txn.type === 'expense')
      .reduce((sum, txn) => sum + convertAmount(Math.abs(txn.amount), normalizeFinanceCurrency(txn.currency as string), targetCurrency), 0);
    return {
      label: date.toLocaleDateString(locale, { weekday: 'short' }),
      income: Math.round(income),
      expense: Math.round(expense),
    };
  });
  return { days };
}

function progressFromStats(weeklyStats: WeeklyStatsSnapshot, budgetScore: number): ProgressData {
  return {
    tasks: weeklyStats.totalTasks > 0 ? Math.round((weeklyStats.tasksCompleted / weeklyStats.totalTasks) * 100) : 0,
    budget: budgetScore,
    focus: Math.min(100, Math.round((weeklyStats.focusHours / 10) * 100)),
  };
}

function buildProductivityInsights(
  progress: ProgressData,
  weeklyStats: WeeklyStatsSnapshot,
  trend: { label: string; value: number }[],
) {
  return {
    metrics: [
      { label: 'Focus score', value: `${progress.focus}`, suffix: '/100' },
      { label: 'Tasks completed', value: `${weeklyStats.tasksCompleted}/${weeklyStats.totalTasks}` },
      { label: 'Deep work', value: weeklyStats.focusHours.toString(), suffix: 'h' },
    ],
    trend: trend,
    trendDelta: trend.length >= 2 ? trend[trend.length - 1]!.value - trend[0]!.value : 0,
  };
}

function computeBudgetScore(budgets: Budget[]): number {
  if (!budgets.length) {
    return 0;
  }
  const averageUsage = budgets.reduce((sum, budget) => sum + Math.min(1, budget.percentUsed), 0) / budgets.length;
  return Math.round(Math.max(0, 100 - averageUsage * 100));
}
