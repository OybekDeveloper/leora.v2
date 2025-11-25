import { useMemo } from 'react';

export interface WeekDayItem {
  key: string;
  label: string;
  number: string;
  date: Date;
  isSelected: boolean;
}

export interface CalendarDayItem {
  key: string;
  label: string;
  date: Date;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  isFuture: boolean;
}

const dayFormatter = new Intl.DateTimeFormat('en-US', { day: '2-digit' });
const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

export const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

export function startOfDay(date?: Date | null): Date {
  const base = date ?? new Date();
  return new Date(base.getFullYear(), base.getMonth(), base.getDate());
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(date.getDate() + amount);
  return next;
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function startOfWeek(date: Date): Date {
  const current = startOfDay(date);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday as the first day
  current.setDate(current.getDate() + diff);
  return current;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function toISODateKey(date: Date): string {
  return startOfDay(date).toISOString().split('T')[0]!;
}

export function buildWeekStrip(selectedDate: Date): WeekDayItem[] {
  const start = startOfWeek(selectedDate);
  return Array.from({ length: 7 }).map((_, idx) => {
    const date = addDays(start, idx);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      label: weekdayFormatter.format(date),
      number: dayFormatter.format(date),
      date,
      isSelected: isSameDay(date, selectedDate),
    };
  });
}

export function buildCalendarDays(
  monthDate: Date,
  selectedDate: Date,
  today: Date = startOfDay(new Date())
): CalendarDayItem[] {
  const firstVisible = startOfWeek(startOfMonth(monthDate));
  return Array.from({ length: 42 }).map((_, idx) => {
    const date = addDays(firstVisible, idx);
    return {
      key: date.toISOString(),
      label: dayFormatter.format(date),
      date,
      isCurrentMonth: date.getMonth() === monthDate.getMonth(),
      isSelected: isSameDay(date, selectedDate),
      isToday: isSameDay(date, today),
      isFuture: date.getTime() > today.getTime(),
    };
  });
}

export function useCalendarWeeks(days: CalendarDayItem[]): CalendarDayItem[][] {
  return useMemo(() => {
    const rows: CalendarDayItem[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
  }, [days]);
}
