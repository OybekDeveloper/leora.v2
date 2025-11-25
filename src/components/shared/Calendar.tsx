/**
 * Shared Calendar Component
 *
 * A reusable calendar component that can display tasks, habits, goals,
 * and finance events with customizable theming and interaction.
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { buildCalendarDays, toISODateKey, useCalendarWeeks, addMonths } from '@/utils/calendar';
import { createThemedStyles, useAppTheme } from '@/constants/theme';
import type { Task, Habit, Goal } from '@/domain/planner/types';
import type { Transaction } from '@/domain/finance/types';

export interface MarkedDate {
  tasks?: number;
  habits?: number;
  goals?: number;
  transactions?: number;
  customDots?: Array<{ color: string }>;
}

export interface CalendarProps {
  /** Currently selected date */
  selectedDate: Date;
  /** Callback when a day is pressed */
  onDayPress: (date: Date) => void;
  /** Current visible month */
  visibleMonth: Date;
  /** Callback when month changes */
  onMonthChange?: (direction: 'prev' | 'next') => void;
  /** Tasks to display as indicators */
  tasks?: Task[];
  /** Habits to display as indicators */
  habits?: Habit[];
  /** Goals to display as indicators */
  goals?: Goal[];
  /** Finance events/transactions to display */
  financeEvents?: Transaction[];
  /** Custom marked dates (overrides automatic calculation) */
  markedDates?: Record<string, MarkedDate>;
  /** Show month navigation arrows */
  showMonthNavigation?: boolean;
  /** Show day indicators (dots) */
  showIndicators?: boolean;
  /** Locale for month label */
  locale?: string;
}

export function Calendar({
  selectedDate,
  onDayPress,
  visibleMonth,
  onMonthChange,
  tasks = [],
  habits = [],
  goals = [],
  financeEvents = [],
  markedDates,
  showMonthNavigation = true,
  showIndicators = true,
  locale = 'en-US',
}: CalendarProps) {
  const theme = useAppTheme();
  const styles = useStyles();

  // Build calendar days
  const days = useMemo(
    () => buildCalendarDays(visibleMonth, selectedDate),
    [selectedDate, visibleMonth]
  );

  const weeks = useCalendarWeeks(days);

  // Month label
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(visibleMonth),
    [locale, visibleMonth]
  );

  // Build day markers from tasks/habits/goals
  const dayMarkersMap = useMemo(() => {
    if (markedDates) return markedDates;

    const map: Record<string, MarkedDate> = {};

    // Mark tasks
    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const key = toISODateKey(new Date(task.dueDate));
      if (!map[key]) map[key] = {};
      map[key].tasks = (map[key].tasks || 0) + 1;
    });

    // Mark habits (active habits for each day)
    habits.forEach((habit) => {
      if (habit.status !== 'active') return;
      // For each day in the visible month, check if habit is scheduled
      days.forEach((day) => {
        if (!day.isCurrentMonth) return;
        const key = day.key;
        // Check if habit has completion history for this day or is scheduled
        if (habit.frequency === 'daily' || (habit.completionHistory && habit.completionHistory[key])) {
          if (!map[key]) map[key] = {};
          map[key].habits = (map[key].habits || 0) + 1;
        }
      });
    });

    // Mark goals (goals with due dates)
    goals.forEach((goal) => {
      if (!goal.targetDate) return;
      const key = toISODateKey(new Date(goal.targetDate));
      if (!map[key]) map[key] = {};
      map[key].goals = (map[key].goals || 0) + 1;
    });

    // Mark finance events
    financeEvents.forEach((event) => {
      if (!event.date) return;
      const key = toISODateKey(new Date(event.date));
      if (!map[key]) map[key] = {};
      map[key].transactions = (map[key].transactions || 0) + 1;
    });

    return map;
  }, [tasks, habits, goals, financeEvents, markedDates, days]);

  const selectedDayKey = toISODateKey(selectedDate);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (onMonthChange) {
      onMonthChange(direction);
    }
  };

  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      {showMonthNavigation && (
        <View style={styles.monthRow}>
          <Pressable
            onPress={() => handleMonthChange('prev')}
            style={styles.monthButton}
          >
            <Ionicons name="chevron-back" size={18} color={theme.colors.textPrimary} />
          </Pressable>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <Pressable
            onPress={() => handleMonthChange('next')}
            style={styles.monthButton}
          >
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textPrimary} />
          </Pressable>
        </View>
      )}

      {/* Calendar Grid */}
      <View style={styles.calendarContainer}>
        {weeks.map((week) => (
          <View key={week[0]?.key} style={styles.weekRow}>
            {week.map((day) => {
              const markers = dayMarkersMap[day.key];
              const isSelected = day.key === selectedDayKey;
              const isToday = day.isToday;

              return (
                <Pressable
                  key={day.key}
                  onPress={() => onDayPress(day.date)}
                  style={[
                    styles.dayCell,
                    isSelected && styles.daySelected,
                    isToday && !isSelected && styles.dayToday,
                    !day.isCurrentMonth && styles.dayMuted,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      isSelected && styles.dayNumberSelected,
                      isToday && !isSelected && styles.dayNumberToday,
                      !day.isCurrentMonth && styles.dayNumberMuted,
                    ]}
                  >
                    {day.label}
                  </Text>

                  {/* Indicator Dots */}
                  {showIndicators && markers && (
                    <View style={styles.dotRow}>
                      {markers.tasks && markers.tasks > 0 && (
                        <View style={[styles.dot, styles.dotTask]} />
                      )}
                      {markers.habits && markers.habits > 0 && (
                        <View style={[styles.dot, styles.dotHabit]} />
                      )}
                      {markers.goals && markers.goals > 0 && (
                        <View style={[styles.dot, styles.dotGoal]} />
                      )}
                      {markers.transactions && markers.transactions > 0 && (
                        <View style={[styles.dot, styles.dotTransaction]} />
                      )}
                      {markers.customDots &&
                        markers.customDots.map((dot, idx) => (
                          <View
                            key={idx}
                            style={[styles.dot, { backgroundColor: dot.color }]}
                          />
                        ))}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((theme) => ({
  container: {
    gap: 8,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  calendarContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 6,
  },
  weekRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.background,
  },
  daySelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20', // 20% opacity
    borderWidth: 2,
  },
  dayToday: {
    borderColor: theme.colors.secondary || theme.colors.primary,
    borderWidth: 1.5,
  },
  dayMuted: {
    opacity: 0.4,
  },
  dayNumber: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  dayNumberSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  dayNumberToday: {
    color: theme.colors.secondary || theme.colors.primary,
    fontWeight: '700',
  },
  dayNumberMuted: {
    color: theme.colors.textSecondary,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dotTask: {
    backgroundColor: '#7C83FD', // Blue
  },
  dotHabit: {
    backgroundColor: '#F9A826', // Orange
  },
  dotGoal: {
    backgroundColor: '#52D1DC', // Cyan
  },
  dotTransaction: {
    backgroundColor: '#34C759', // Green
  },
}));
