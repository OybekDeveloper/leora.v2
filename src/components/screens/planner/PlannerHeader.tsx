import React, { useCallback, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useShallow } from 'zustand/react/shallow';

import { useThemeColors } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import DateChangeModal from '@/components/modals/DateChangeModal';
import { BottomSheetHandle } from '@/components/modals/BottomSheet';
import { useSelectedDayStore } from '@/stores/selectedDayStore';
import { HeartPulse } from 'lucide-react-native';
import { startOfDay, toISODateKey } from '@/utils/calendar';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import type { CalendarEventMap, CalendarEventType } from '@/types/home';

interface PlannerHeaderProps {
  title?: string;
}

export default function PlannerHeader({ title }: PlannerHeaderProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const { strings, locale } = useLocalization();
  const calendarSheetRef = useRef<BottomSheetHandle>(null);
  const { selectedDate, setSelectedDate } = useSelectedDayStore(
    useShallow((state) => ({
      selectedDate: state.selectedDate,
      setSelectedDate: state.setSelectedDate,
    })),
  );
  const plannerData = usePlannerDomainStore(
    useShallow((state) => ({
      tasks: state.tasks,
      habits: state.habits,
      goals: state.goals,
    })),
  );
  const headerTitle = title ?? strings.tabs.planner;
  const formattedDate = useMemo(() => {
    const todayIso = toISODateKey(startOfDay(new Date()));
    const selectedIso = toISODateKey(selectedDate);
    if (todayIso === selectedIso) {
      return strings.calendar?.todayLabel ?? strings.plannerScreens.tasks.todayLabel;
    }
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
    }).format(selectedDate);
  }, [locale, selectedDate, strings.calendar, strings.plannerScreens.tasks.todayLabel]);

  const handleOpenCalendar = useCallback(() => {
    calendarSheetRef.current?.present();
  }, []);

  const handleSelectDate = useCallback(
    (date: Date) => {
      setSelectedDate(date);
    },
    [setSelectedDate],
  );

  const calendarEvents = useMemo<CalendarEventMap>(() => {
    const events: CalendarEventMap = {};
    const register = (value: string | Date | undefined | null, type: CalendarEventType) => {
      if (!value) return;
      const date = typeof value === 'string' ? new Date(value) : value;
      if (Number.isNaN(date.getTime())) return;
      const iso = toISODateKey(date);
      if (!events[iso]) {
        events[iso] = {};
      }
      events[iso]![type] = (events[iso]![type] ?? 0) + 1;
    };

    plannerData.tasks.forEach((task) => register(task.dueDate, 'tasks'));
    plannerData.habits.forEach((habit) => {
      if (!habit.completionHistory) return;
      Object.keys(habit.completionHistory).forEach((key) => register(`${key}T00:00:00.000Z`, 'habits'));
    });
    plannerData.goals.forEach((goal) => {
      goal.checkIns?.forEach((checkIn) => register(checkIn.dateKey ?? checkIn.createdAt, 'goals'));
      goal.milestones?.forEach((milestone) => register(milestone.completedAt ?? milestone.dueDate, 'goals'));
    });

    return events;
  }, [plannerData.goals, plannerData.habits, plannerData.tasks]);

  return (
    <>
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.actions}>
          <Pressable
            onPress={handleOpenCalendar}
            style={[styles.iconButton, { backgroundColor: colors.background }]}
          >
            <Ionicons name="calendar-outline" size={24} color={colors.textSecondary} />
            <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>{formattedDate}</Text>
          </Pressable>
        </View>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{headerTitle}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            onPress={() => router.navigate('/(modals)/search')}
            style={[styles.iconButton, { backgroundColor: colors.background }]}
          >
            <Ionicons name="search" size={24} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => router.navigate('/focus-mode')}
            style={[styles.iconButton, { backgroundColor: colors.background }]}
          >
            <HeartPulse size={24} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>
      <DateChangeModal
        ref={calendarSheetRef}
        selectedDate={selectedDate}
        events={calendarEvents}
        onSelectDate={handleSelectDate}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 'auto',
    height: 'auto',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    flexDirection: 'row',
    gap: 6,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
