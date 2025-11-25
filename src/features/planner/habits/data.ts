import type { Habit as PlannerDomainHabit } from '@/domain/planner/types';
import { addDays, buildCalendarDays, startOfDay, startOfMonth, startOfWeek } from '@/utils/calendar';

export type HabitDayStatus = 'done' | 'miss' | 'none';
export type HabitCTAType = 'check' | 'timer' | 'chips' | 'dual';

export interface HabitCalendarCell {
  key: string;
  label: string;
  status: HabitDayStatus;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export interface HabitCardModel {
  id: string;
  title: string;
  streak: number;
  record: number;
  weeklyCompleted: number;
  weeklyTarget: number;
  daysRow: HabitDayStatus[];
  badgeDays?: number;
  cta?: { kind: HabitCTAType };
  chips?: string[];
  linkedGoalIds: string[];
  scheduleDays: number[];
  aiNote?: string;
  expanded?: boolean;
  todayStatus: HabitDayStatus;
  canLogToday: boolean;
  calendarWeeks: HabitCalendarCell[][];
  calendarMonthLabel: string;
}

export interface HabitLegendSlice {
  count: number;
  percent: number;
}

export interface HabitLegendSummary {
  done: HabitLegendSlice;
  miss: HabitLegendSlice;
  none: HabitLegendSlice;
  total: number;
}

const getStatus = (value: PlannerDomainHabit['completionHistory'] extends Record<string, infer V> ? V : never) =>
  typeof value === 'string' ? value : value?.status;

const chunk = <T,>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const deriveWeeklyTarget = (habit: PlannerDomainHabit): number => {
  if (habit.timesPerWeek && habit.timesPerWeek > 0) {
    return habit.timesPerWeek;
  }
  if (habit.daysOfWeek && habit.daysOfWeek.length > 0) {
    return habit.daysOfWeek.length;
  }
  switch (habit.frequency) {
    case 'daily':
      return 7;
    case 'weekly':
      return 3;
    default:
      return 5;
  }
};

const buildDaysRow = (target: number, completed: number): HabitDayStatus[] => {
  const row: HabitDayStatus[] = Array.from({ length: 7 }, () => 'none');
  const safeTarget = Math.max(0, Math.min(target, 7));
  const safeCompleted = Math.max(0, Math.min(completed, safeTarget));
  for (let i = 0; i < safeCompleted; i += 1) {
    row[i] = 'done';
  }
  for (let i = safeCompleted; i < safeTarget; i += 1) {
    row[i] = 'miss';
  }
  return row;
};

const dateKeyFromDate = (date: Date) => startOfDay(date).toISOString().split('T')[0]!;

const buildDaysRowFromHistory = (
  history: PlannerDomainHabit['completionHistory'],
  referenceDate: Date,
): HabitDayStatus[] => {
  const weekStart = startOfWeek(referenceDate);
  return Array.from<HabitDayStatus>({ length: 7 }).map((_, idx) => {
    const current = addDays(weekStart, idx);
    if (current.getTime() > referenceDate.getTime()) {
      return 'none';
    }
    const key = dateKeyFromDate(current);
    const status = getStatus(history?.[key]);
    if (status === 'done') return 'done';
    if (status === 'miss') return 'miss';
    return 'none';
  });
};

export const buildHabitCalendar = (
  history: PlannerDomainHabit['completionHistory'] | undefined,
  referenceDate: Date,
  locale = 'en-US',
): { weeks: HabitCalendarCell[][]; label: string } => {
  const monthStart = startOfMonth(referenceDate);
  const today = startOfDay(new Date());
  const calendarDays = buildCalendarDays(monthStart, referenceDate, today);
  const annotated = calendarDays.map((day) => {
    const key = dateKeyFromDate(day.date);
    const status = getStatus(history?.[key]) ?? 'none';
    return {
      key,
      label: day.label,
      status,
      isCurrentMonth: day.isCurrentMonth,
      isToday: day.isToday,
    } satisfies HabitCalendarCell;
  });
  return {
    weeks: chunk(annotated, 7),
    label: new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric',
    }).format(referenceDate),
  };
};

export const summarizeHabitLegendFromWeeks = (weeks: HabitCalendarCell[][]): HabitLegendSummary => {
  const counts: Record<HabitDayStatus, number> = {
    done: 0,
    miss: 0,
    none: 0,
  };
  weeks.forEach((week) => {
    week.forEach((cell) => {
      if (!cell.isCurrentMonth) {
        return;
      }
      counts[cell.status] += 1;
    });
  });
  const total = counts.done + counts.miss + counts.none;
  const toPercent = (value: number) => Math.round((value / Math.max(total, 1)) * 100);
  return {
    done: { count: counts.done, percent: toPercent(counts.done) },
    miss: { count: counts.miss, percent: toPercent(counts.miss) },
    none: { count: counts.none, percent: toPercent(counts.none) },
    total,
  } satisfies HabitLegendSummary;
};

const pickCTA = (habit: PlannerDomainHabit): HabitCTAType => {
  if (habit.completionMode === 'numeric') {
    return 'dual';
  }
  return 'check';
};

export const buildHabits = (
  domainHabits?: PlannerDomainHabit[],
  options?: { selectedDate?: Date; locale?: string },
): HabitCardModel[] => {
  if (!domainHabits || domainHabits.length === 0) {
    return [];
  }
  const selectedDate = startOfDay(options?.selectedDate ?? new Date());
  const locale = options?.locale ?? 'en-US';
  const todayKey = dateKeyFromDate(selectedDate);
  const weekStart = startOfWeek(selectedDate);
  return domainHabits.map((habit) => {
    const weeklyTarget = deriveWeeklyTarget(habit);
    let weeklyCompleted = 0;
    for (let i = 0; i < 7; i += 1) {
      const key = dateKeyFromDate(addDays(weekStart, i));
      if (getStatus(habit.completionHistory?.[key]) === 'done') {
        weeklyCompleted += 1;
      }
    }
    const todayStatus =
      getStatus(habit.completionHistory?.[todayKey]) === 'done'
        ? 'done'
        : getStatus(habit.completionHistory?.[todayKey]) === 'miss'
        ? 'miss'
        : 'none';
    const canLogToday =
      !habit.daysOfWeek ||
      habit.daysOfWeek.length === 0 ||
      habit.daysOfWeek.includes(selectedDate.getDay());
    const calendarData = buildHabitCalendar(habit.completionHistory, selectedDate, locale);
    return {
      id: habit.id,
      title: habit.title,
      streak: habit.streakCurrent ?? 0,
      record: habit.streakBest ?? habit.streakCurrent ?? 0,
      weeklyCompleted,
      weeklyTarget,
      daysRow: buildDaysRowFromHistory(habit.completionHistory, selectedDate),
      badgeDays: habit.streakCurrent ?? undefined,
      cta: { kind: pickCTA(habit), completedToday: todayStatus === 'done' },
      linkedGoalIds: habit.linkedGoalIds ?? (habit.goalId ? [habit.goalId] : []),
      scheduleDays: habit.daysOfWeek ?? [],
      aiNote: habit.description,
      expanded: false,
      todayStatus,
      canLogToday,
      calendarWeeks: calendarData.weeks,
      calendarMonthLabel: calendarData.label,
    };
  });
};

const templateCalendar = buildHabitCalendar(undefined, new Date());

const HABIT_TEMPLATES: HabitCardModel[] = [
  {
    id: 'habit-morning-mobility',
    title: 'Morning mobility',
    streak: 14,
    record: 30,
    weeklyCompleted: 4,
    weeklyTarget: 5,
    daysRow: buildDaysRow(5, 4),
    badgeDays: 14,
    cta: { kind: 'check' },
    linkedGoalIds: ['fitness'],
    scheduleDays: [1, 2, 3, 4, 5],
    aiNote: 'Pair with journaling for a calm start.',
    expanded: false,
    todayStatus: 'none',
    canLogToday: true,
    calendarWeeks: templateCalendar.weeks,
    calendarMonthLabel: templateCalendar.label,
  },
  {
    id: 'habit-language-focus',
    title: 'Language deep dive',
    streak: 8,
    record: 18,
    weeklyCompleted: 3,
    weeklyTarget: 4,
    daysRow: buildDaysRow(4, 3),
    badgeDays: 8,
    cta: { kind: 'timer' },
    linkedGoalIds: ['language'],
    scheduleDays: [1, 3, 5, 6],
    aiNote: 'Aim for one 25min focus block.',
    expanded: false,
    todayStatus: 'none',
    canLogToday: true,
    calendarWeeks: templateCalendar.weeks,
    calendarMonthLabel: templateCalendar.label,
  },
  {
    id: 'habit-finance-review',
    title: 'Weekly finance review',
    streak: 5,
    record: 12,
    weeklyCompleted: 1,
    weeklyTarget: 2,
    daysRow: buildDaysRow(2, 1),
    badgeDays: 5,
    cta: { kind: 'chips' },
    chips: ['Budget', 'Invest', 'Debt'],
    linkedGoalIds: ['dream-car', 'emergency-fund'],
    scheduleDays: [0, 3],
    aiNote: 'Use Sunday evenings for calm decision making.',
    expanded: false,
    todayStatus: 'none',
    canLogToday: true,
    calendarWeeks: templateCalendar.weeks,
    calendarMonthLabel: templateCalendar.label,
  },
  {
    id: 'habit-evening-reset',
    title: 'Evening reset',
    streak: 10,
    record: 21,
    weeklyCompleted: 5,
    weeklyTarget: 7,
    daysRow: buildDaysRow(7, 5),
    badgeDays: 10,
    cta: { kind: 'dual' },
    linkedGoalIds: [],
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    aiNote: 'Close the day by reviewing planner tasks.',
    expanded: false,
    todayStatus: 'none',
    canLogToday: true,
    calendarWeeks: templateCalendar.weeks,
    calendarMonthLabel: templateCalendar.label,
  },
];

export const getHabitTemplates = (): HabitCardModel[] =>
  HABIT_TEMPLATES.map((habit) => ({
    ...habit,
    daysRow: [...habit.daysRow],
    linkedGoalIds: [...habit.linkedGoalIds],
    scheduleDays: [...habit.scheduleDays],
    chips: habit.chips ? [...habit.chips] : undefined,
  }));
