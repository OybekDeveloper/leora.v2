import React, { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useLocalization } from '@/localization/useLocalization';
import {
  addMonths,
  buildCalendarDays,
  startOfDay,
  startOfMonth,
  toISODateKey,
  useCalendarWeeks,
} from '@/utils/calendar';
import type { PlannerTask, PlannerTaskSection } from '@/types/planner';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { mapDomainTaskToPlannerTask } from '@/features/planner/taskAdapters';
import { getHabitTemplates } from '@/features/planner/habits/data';

const deriveSection = (date: Date): PlannerTaskSection => {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

const formatTime = (locale: string, date: Date) =>
  new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(date);

export default function PlannerCalendarModal() {
  const router = useRouter();
  const { strings, locale } = useLocalization();
  const calendarStrings = strings.plannerScreens.tasks.calendar;
  const { tasks: domainTasks, createTask, scheduleTask } = usePlannerDomainStore((state) => ({
    tasks: state.tasks,
    createTask: state.createTask,
    scheduleTask: state.scheduleTask,
  }));
  const tasks = useMemo(
    () => domainTasks.map((task) => mapDomainTaskToPlannerTask(task, {})),
    [domainTasks],
  );
  const habitTemplates = useMemo(() => getHabitTemplates(), []);
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(selectedDate));
  const days = useMemo(
    () => buildCalendarDays(visibleMonth, selectedDate),
    [selectedDate, visibleMonth],
  );
  const weeks = useCalendarWeeks(days);
  const dayKey = toISODateKey(selectedDate);
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(visibleMonth),
    [locale, visibleMonth],
  );

  const dayTaskMap = useMemo(() => {
    const map = new Map<string, { tasks: number; goals: number }>();
    tasks.forEach((task) => {
      if (!task.dueAt) {
        return;
      }
      const key = toISODateKey(new Date(task.dueAt));
      const entry = map.get(key) ?? { tasks: 0, goals: 0 };
      entry.tasks += 1;
      if (task.goalId) {
        entry.goals += 1;
      }
      map.set(key, entry);
    });
    return map;
  }, [tasks]);

  const tasksForSelectedDay = useMemo(
    () =>
      tasks.filter((task) => {
        if (!task.dueAt) return false;
        return toISODateKey(new Date(task.dueAt)) === dayKey;
      }),
    [dayKey, tasks],
  );

  const otherTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (!task.dueAt) return true;
        return toISODateKey(new Date(task.dueAt)) !== dayKey;
      }),
    [dayKey, tasks],
  );

  const habitsForDay = useCallback(
    (date: Date) => habitTemplates.filter((habit) => habit.scheduleDays.includes(date.getDay())).length,
    [habitTemplates],
  );

  const selectedHabits = habitsForDay(selectedDate);
  const selectedGoals = tasksForSelectedDay.filter((task) => task.goalId).length;

  const statsLabel = calendarStrings.summary
    .replace('{tasks}', String(tasksForSelectedDay.length))
    .replace('{habits}', String(selectedHabits))
    .replace('{goals}', String(selectedGoals));

  const handleMonthChange = useCallback((direction: 'prev' | 'next') => {
    setVisibleMonth((prev) => addMonths(prev, direction === 'prev' ? -1 : 1));
  }, []);

  const handleQuickAdd = useCallback(() => {
    const due = new Date(selectedDate);
    due.setHours(9, 0, 0, 0);
    const iso = due.toISOString();
    createTask({
      userId: 'local-user',
      title: calendarStrings.quickTaskTitle,
      status: 'planned',
      priority: 'medium',
      dueDate: iso,
      startDate: iso,
      timeOfDay: formatTime(locale, due),
      estimatedMinutes: 30,
      context: '@home',
      energyLevel: 2,
    });
  }, [calendarStrings.quickTaskTitle, createTask, locale, selectedDate]);

  const handleMoveHere = useCallback(
    (task: PlannerTask) => {
      const next = new Date(selectedDate);
      if (task.dueAt) {
        const prev = new Date(task.dueAt);
        next.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
      } else {
        next.setHours(9, 0, 0, 0);
      }
      scheduleTask(task.id, { dueDate: next.toISOString(), timeOfDay: formatTime(locale, next) });
    },
    [locale, scheduleTask, selectedDate],
  );
  const handleMoveToTomorrow = useCallback(
    (task: PlannerTask) => {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + 1);
      if (task.dueAt) {
        const prev = new Date(task.dueAt);
        next.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
      } else {
        next.setHours(9, 0, 0, 0);
      }
      scheduleTask(task.id, { dueDate: next.toISOString(), timeOfDay: formatTime(locale, next) });
    },
    [locale, scheduleTask, selectedDate],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerIcon}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>{calendarStrings.title}</Text>
        <View style={styles.headerIcon} />
      </View>

      <View style={styles.monthRow}>
        <Pressable onPress={() => handleMonthChange('prev')} style={styles.monthButton}>
          <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable onPress={() => handleMonthChange('next')} style={styles.monthButton}>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.calendarContainer}>
        {weeks.map((week) => (
          <View key={week[0]?.key} style={styles.weekRow}>
            {week.map((day) => {
              const summary = dayTaskMap.get(day.key);
              const habitCount = habitsForDay(day.date);
              const isSelected = toISODateKey(day.date) === dayKey;
              return (
                <Pressable
                  key={day.key}
                  onPress={() => setSelectedDate(startOfDay(day.date))}
                  style={[
                    styles.dayCell,
                    isSelected && styles.daySelected,
                    !day.isCurrentMonth && styles.dayMuted,
                  ]}
                >
                  <Text style={styles.dayNumber}>{day.label}</Text>
                  <View style={styles.dotRow}>
                    {(summary?.tasks ?? 0) > 0 && <View style={[styles.dot, styles.dotTask]} />}
                    {habitCount > 0 && <View style={[styles.dot, styles.dotHabit]} />}
                    {(summary?.goals ?? 0) > 0 && <View style={[styles.dot, styles.dotGoal]} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>{statsLabel}</Text>
        <Pressable onPress={handleQuickAdd} style={styles.quickAddBtn}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.quickAddText}>{calendarStrings.addQuickTask}</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={{ gap: 12 }}>
        <View>
          <Text style={styles.sectionTitle}>{calendarStrings.scheduledTitle}</Text>
          {tasksForSelectedDay.length === 0 ? (
            <Text style={styles.emptyText}>{calendarStrings.empty}</Text>
          ) : (
            tasksForSelectedDay.map((task) => (
              <View key={task.id} style={styles.taskRow}>
                <View>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskMeta}>
                    {task.start} · {task.context}
                  </Text>
                </View>
                <Pressable onPress={() => handleMoveToTomorrow(task)} style={styles.moveButton}>
                  <Text style={styles.moveButtonText}>{calendarStrings.moveTomorrow}</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        <View>
          <Text style={styles.sectionTitle}>{calendarStrings.moveTitle}</Text>
          {otherTasks.slice(0, 4).map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <View>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskMeta}>
                  {task.dueAt ? formatTime(locale, new Date(task.dueAt)) : calendarStrings.unscheduled}
                </Text>
              </View>
              <Pressable onPress={() => handleMoveHere(task)} style={styles.moveButton}>
                <Text style={styles.moveButtonText}>{calendarStrings.moveHere}</Text>
              </Pressable>
            </View>
          ))}
          {otherTasks.length === 0 && <Text style={styles.emptyText}>{calendarStrings.noOtherTasks}</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#25252B',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1F1F22',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    color: '#FFFFFF',
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
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  daySelected: {
    borderColor: '#FFFFFF',
  },
  dayMuted: {
    opacity: 0.5,
  },
  dayNumber: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotTask: { backgroundColor: '#7C83FD' },
  dotHabit: { backgroundColor: '#F9A826' },
  dotGoal: { backgroundColor: '#52D1DC' },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', flex: 1 },
  quickAddBtn: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickAddText: { color: '#FFFFFF', fontWeight: '700' },
  list: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: { color: '#7E8B9A', fontSize: 13 },
  taskRow: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.02)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  taskTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  taskMeta: { color: '#A0A4B8', fontSize: 12, marginTop: 2 },
  moveButton: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  moveButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
