// app/(modals)/planner/habit-detail.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Check,
  Flame,
  MoreVertical,
  Target,
  TrendingUp,
  Trophy,
  Award,
  X,
} from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import HabitActionsDropdown, { type HabitDropdownAction } from '@/components/planner/habits/HabitActionsDropdown';
import { createThemedStyles, useAppTheme } from '@/constants/theme';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { useLocalization } from '@/localization/useLocalization';
import { useSelectedDayStore } from '@/stores/selectedDayStore';
import { startOfDay, startOfWeek, addDays, toISODateKey } from '@/utils/calendar';
import type { HabitDayStatus, HabitCTAType } from '@/features/planner/habits/data';
import type { HabitCompletionEntry } from '@/domain/planner/types';

export default function HabitDetailModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useStyles();
  const { strings } = useLocalization();
  const habitStrings = strings.plannerScreens.habits;
  const params = useLocalSearchParams<{ id?: string }>();

  const [menuOpen, setMenuOpen] = useState(false);

  const habits = usePlannerDomainStore((state) => state.habits);
  const goals = usePlannerDomainStore((state) => state.goals);
  const logHabitCompletion = usePlannerDomainStore((state) => state.logHabitCompletion);
  const archiveHabit = usePlannerDomainStore((state) => state.archiveHabit);

  const selectedDate = useSelectedDayStore((state) => state.selectedDate);

  const habit = useMemo(() => {
    if (!params.id) return undefined;
    return habits.find((h) => h.id === params.id);
  }, [habits, params.id]);

  const linkedGoal = useMemo(() => {
    if (!habit?.goalId) return undefined;
    return goals.find((g) => g.id === habit.goalId);
  }, [habit?.goalId, goals]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!habit) return { streak: 0, record: 0, weeklyCompleted: 0, weeklyTarget: 7, completion: 0 };

    const history = habit.completionHistory ?? {};
    const today = startOfDay(new Date());

    // Get completed dates from history
    const completedDates = Object.entries(history)
      .filter(([_, entry]: [string, HabitCompletionEntry]) => entry.status === 'done')
      .map(([dateKey]) => dateKey)
      .sort()
      .reverse();

    // Use stored streak values
    const currentStreak = habit.streakCurrent ?? 0;
    const maxStreak = habit.streakBest ?? currentStreak;

    // Weekly completion
    const weekStart = startOfWeek(today);
    let weeklyCompleted = 0;
    for (let i = 0; i < 7; i++) {
      const dayKey = toISODateKey(addDays(weekStart, i));
      if (completedDates.includes(dayKey)) {
        weeklyCompleted++;
      }
    }

    const weeklyTarget = habit.timesPerWeek ?? 7;
    const completion = weeklyTarget > 0 ? Math.round((weeklyCompleted / weeklyTarget) * 100) : 0;

    return {
      streak: currentStreak,
      record: maxStreak,
      weeklyCompleted,
      weeklyTarget,
      completion,
    };
  }, [habit]);

  // Days row (last 10 days)
  const daysRow = useMemo(() => {
    if (!habit) return [];
    const today = startOfDay(new Date());
    const history = habit.completionHistory ?? {};

    const days: HabitDayStatus[] = [];
    for (let i = 9; i >= 0; i--) {
      const date = addDays(today, -i);
      const key = toISODateKey(date);
      const entry = history[key];
      if (entry?.status === 'done') days.push('done');
      else if (entry?.status === 'miss') days.push('miss');
      else days.push('none');
    }
    return days;
  }, [habit]);

  // Today status
  const todayStatus = useMemo(() => {
    if (!habit) return 'none';
    const todayKey = toISODateKey(new Date());
    const entry = habit.completionHistory?.[todayKey];
    if (!entry) return 'none';
    return entry.status === 'done' ? 'done' : 'miss';
  }, [habit]);

  const isCompletedToday = todayStatus === 'done';

  const handleCheckIn = useCallback(() => {
    if (!habit) return;
    if (isCompletedToday) {
      logHabitCompletion(habit.id, false, { date: selectedDate, clear: true });
    } else {
      logHabitCompletion(habit.id, true, { date: selectedDate });
    }
  }, [habit, isCompletedToday, logHabitCompletion, selectedDate]);

  const handleMarkFailed = useCallback(() => {
    if (!habit) return;
    logHabitCompletion(habit.id, false, { date: selectedDate });
  }, [habit, logHabitCompletion, selectedDate]);

  const handleEdit = useCallback(() => {
    if (!habit) return;
    setMenuOpen(false);
    router.push(`/(modals)/planner/habit?id=${habit.id}`);
  }, [habit, router]);

  const handleDelete = useCallback(() => {
    if (!habit) return;
    setMenuOpen(false);
    Alert.alert(
      habitStrings.ctas?.delete ?? 'Delete',
      'Are you sure you want to delete this habit?',
      [
        { text: strings.common.cancel, style: 'cancel' },
        {
          text: habitStrings.ctas?.delete ?? 'Delete',
          style: 'destructive',
          onPress: () => {
            archiveHabit(habit.id);
            router.back();
          },
        },
      ]
    );
  }, [habit, archiveHabit, router, habitStrings, strings]);

  const menuActions: HabitDropdownAction[] = useMemo(() => {
    if (!habit) return [];
    return [
      { label: habitStrings.ctas?.edit ?? 'Edit', onPress: handleEdit },
      { label: habitStrings.ctas?.delete ?? 'Delete', onPress: handleDelete, destructive: true },
    ];
  }, [habit, habitStrings, handleEdit, handleDelete]);

  if (!habit) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Habit not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Determine CTA type based on completionMode
  const ctaType: HabitCTAType = habit.completionMode === 'numeric' ? 'dual' : 'check';
  const showDualButtons = ctaType === 'dual';
  const showTimerButton = false; // Timer mode not currently in types

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.modalHeaderTitle, { color: theme.colors.textPrimary }]}>
          {habit.title}
        </Text>
        <View style={styles.modalHeaderActions}>
          <Pressable
            onPress={() => setMenuOpen((prev) => !prev)}
            style={[styles.menuTrigger, { backgroundColor: theme.colors.cardItem }]}
          >
            <MoreVertical size={20} color={theme.colors.textPrimary} />
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            style={[styles.modalHeaderAction, { backgroundColor: theme.colors.cardItem }]}
          >
            <X size={20} color={theme.colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Streak Badge */}
        <View style={styles.streakBadgeRow}>
          <Flame size={18} color="#F59E0B" />
          <Text style={[styles.streakBadgeText, { color: '#F59E0B' }]}>{stats.streak} days</Text>
        </View>

        {/* Stats Card */}
        <AdaptiveGlassView style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Streak:</Text>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
              {stats.streak} days straight
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Record:</Text>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
              {stats.record} days
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Completion:</Text>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
              {stats.completion}% ({stats.weeklyCompleted}/{stats.weeklyTarget} weekly)
            </Text>
          </View>
        </AdaptiveGlassView>

        {/* Days Row */}
        <View style={styles.daysRowContainer}>
          {daysRow.map((status, idx) => (
            <DayBubble key={idx} status={status} />
          ))}
        </View>

        {/* CTA Button */}
        <View style={styles.ctaContainer}>
          {showDualButtons ? (
            <View style={styles.dualButtonRow}>
              <Pressable
                style={[styles.ctaButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={handleCheckIn}
              >
                <Text style={[styles.ctaButtonText, { color: theme.colors.textSecondary }]}>
                  {isCompletedToday ? habitStrings.ctas?.completed : habitStrings.ctas?.completed}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.ctaButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={handleMarkFailed}
              >
                <Text style={[styles.ctaButtonText, { color: theme.colors.textSecondary }]}>
                  {habitStrings.ctas?.failed}
                </Text>
              </Pressable>
            </View>
          ) : showTimerButton ? (
            <Pressable
              style={[styles.ctaButtonFull, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={handleCheckIn}
            >
              <Text style={[styles.ctaButtonText, { color: theme.colors.textSecondary }]}>
                {habitStrings.ctas?.startTimer ?? 'Start timer'}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.ctaButtonFull, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={handleCheckIn}
            >
              <Text style={[styles.ctaButtonText, { color: theme.colors.textSecondary }]}>
                {isCompletedToday ? habitStrings.ctas?.completed : habitStrings.ctas?.checkIn}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Statistics Section */}
        <AdaptiveGlassView style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            {habitStrings.expand?.titles?.statistics ?? 'Statistics'}
          </Text>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Overall completion:</Text>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
              {Object.values(habit.completionHistory ?? {}).filter((e) => e.status === 'done').length}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Success percentile:</Text>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{stats.completion}%</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Average streak:</Text>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{Math.round(stats.streak * 0.7)} days</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Best month:</Text>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>November (93%)</Text>
          </View>
        </AdaptiveGlassView>

        {/* Pattern Section */}
        <AdaptiveGlassView style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            {habitStrings.expand?.titles?.pattern ?? 'Pattern'}
          </Text>
          <View style={styles.patternRow}>
            <TrendingUp size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.patternText, { color: theme.colors.textSecondary }]}>
              Best time: 7:00-7:30 (85% success rate)
            </Text>
          </View>
          <View style={styles.patternRow}>
            <TrendingUp size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.patternText, { color: theme.colors.textSecondary }]}>
              Worst time: Weekends (45%)
            </Text>
          </View>
          <View style={styles.patternRow}>
            <TrendingUp size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.patternText, { color: theme.colors.textSecondary }]}>
              After weekends: -30% probability
            </Text>
          </View>
        </AdaptiveGlassView>

        {/* Achievements Section */}
        <AdaptiveGlassView style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            {habitStrings.expand?.titles?.achievements ?? 'Achievements'}
          </Text>
          <View style={styles.achievementRow}>
            <Trophy size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.achievementText, { color: theme.colors.textSecondary }]}>First week</Text>
          </View>
          <View style={styles.achievementRow}>
            <Award size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.achievementText, { color: theme.colors.textSecondary }]}>Month without break</Text>
          </View>
          <View style={styles.achievementRow}>
            <Award size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.achievementText, { color: theme.colors.textSecondary }]}>100 completions</Text>
          </View>
          <View style={styles.achievementRow}>
            <Trophy size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.achievementText, { color: theme.colors.textSecondary }]}>
              Marathoner ({stats.record} days straight)
            </Text>
          </View>
        </AdaptiveGlassView>

        {/* Linked Goal */}
        {linkedGoal && (
          <AdaptiveGlassView style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Linked Goal</Text>
            <Pressable
              style={styles.linkedGoalRow}
              onPress={() => router.push(`/(modals)/planner/goal-details?goalId=${linkedGoal.id}`)}
            >
              <Target size={16} color={theme.colors.primary} />
              <Text style={[styles.linkedGoalText, { color: theme.colors.textPrimary }]}>{linkedGoal.title}</Text>
            </Pressable>
          </AdaptiveGlassView>
        )}
      </ScrollView>

      {/* Actions Dropdown */}
      <HabitActionsDropdown
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        actions={menuActions}
        anchorStyle={{ marginTop: insets.top + 8, right: 12 }}
      />
    </SafeAreaView>
  );
}

// Day Bubble Component
function DayBubble({ status }: { status: HabitDayStatus }) {
  const theme = useAppTheme();
  const base = {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1.5,
    borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
    backgroundColor: 'transparent',
  };

  if (status === 'done') {
    const success = theme.colors.success;
    return (
      <View style={[base, { backgroundColor: success, borderColor: success }]}>
        <Check size={14} color="#FFFFFF" strokeWidth={3} />
      </View>
    );
  }
  if (status === 'miss') {
    const danger = theme.colors.danger;
    return (
      <View style={[base, { backgroundColor: danger, borderColor: danger }]}>
        <X size={14} color="#FFFFFF" strokeWidth={3} />
      </View>
    );
  }
  return <View style={base} />;
}

const useStyles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuTrigger: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  streakBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
  },
  streakBadgeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  daysRowContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  ctaContainer: {
    marginTop: 4,
  },
  dualButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ctaButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonFull: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  patternText: {
    fontSize: 13,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  achievementText: {
    fontSize: 13,
  },
  linkedGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkedGoalText: {
    fontSize: 14,
    fontWeight: '600',
  },
}));
