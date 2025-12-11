// app/(tabs)/(planner)/(tabs)/habits.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { Check, Sparkles, X } from 'lucide-react-native';
import { FireIcon } from '../../../../assets/icons';
import { useRouter } from 'expo-router';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import EmptyAnimation from '@/components/shared/EmptyAnimation';
import SelectableListItem from '@/components/shared/SelectableListItem';
import { createThemedStyles, useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import type { AppTranslations } from '@/localization/strings';
import { useSelectedDayStore } from '@/stores/selectedDayStore';
import {
  buildHabits,
  type HabitCardModel,
  type HabitDayStatus,
} from '@/features/planner/habits/data';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { useSelectionStore } from '@/stores/useSelectionStore';
import { useShallow } from 'zustand/react/shallow';
import { startOfDay } from '@/utils/calendar';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// -------------------------------------
// Date helpers
// -------------------------------------
const pct = (a: number, b: number) => Math.round((a / Math.max(b, 1)) * 100);


// -------------------------------------
// Main Screen
// -------------------------------------
export default function PlannerHabitsTab() {
  const router = useRouter();
  const styles = useStyles();
  const { strings, locale } = useLocalization();
  const habitStrings = strings.plannerScreens.habits;
  const {
    domainHabits,
    logHabitCompletion,
    resumeHabit,
    deleteHabitPermanently,
  } = usePlannerDomainStore(
    useShallow((state) => ({
      domainHabits: state.habits,
      logHabitCompletion: state.logHabitCompletion,
      resumeHabit: state.resumeHabit,
      deleteHabitPermanently: state.deleteHabitPermanently,
    })),
  );

  // Selection mode
  const {
    isSelectionMode,
    entityType,
    enterSelectionMode,
    toggleSelection,
    isSelected,
  } = useSelectionStore();

  const isHabitSelectionMode = isSelectionMode && entityType === 'habit';
  const selectedDate = useSelectedDayStore((state) => state.selectedDate);
  const selectedDayStart = useMemo(() => startOfDay(selectedDate).getTime(), [selectedDate]);

  const activeDomainHabits = useMemo(() =>
    domainHabits.filter((habit) => {
      if (habit.showStatus === 'archived' || habit.showStatus === 'deleted') return false;
      const createdAtDay = startOfDay(new Date(habit.createdAt)).getTime();
      return createdAtDay <= selectedDayStart;
    }),
    [domainHabits, selectedDayStart]
  );
  const archivedDomainHabits = useMemo(() =>
    domainHabits.filter((habit) => habit.showStatus === 'archived' || habit.showStatus === 'deleted'),
    [domainHabits]
  );
  const [habits, setHabits] = useState<HabitCardModel[]>(() =>
    buildHabits(activeDomainHabits, { selectedDate, locale }),
  );

  useEffect(() => {
    setHabits((prev) => {
      const expandedMap = new Map(prev.map((habit) => [habit.id, habit.expanded]));
      return buildHabits(activeDomainHabits, { selectedDate, locale }).map((habit) => ({
        ...habit,
        expanded: expandedMap.get(habit.id),
      }));
    });
  }, [activeDomainHabits, locale, selectedDate]);

  const monthYearFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric',
      }),
    [locale],
  );

  const topMonthLabel = useMemo(() => monthYearFormatter.format(selectedDate), [monthYearFormatter, selectedDate]);


  // Selection mode handlers
  const handleEnterSelectionMode = useCallback(
    (isHistory = false) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      enterSelectionMode('habit', isHistory);
    },
    [enterSelectionMode],
  );

  const handleToggleSelection = useCallback(
    (id: string) => {
      toggleSelection(id);
    },
    [toggleSelection],
  );

  // Build archived habits for history section
  const archivedHabits = useMemo(
    () => buildHabits(archivedDomainHabits, { selectedDate, locale }),
    [archivedDomainHabits, selectedDate, locale],
  );

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: isHabitSelectionMode ? 180 : 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>{habitStrings.headerTitle}</Text>
          <Text style={styles.monthText}>{topMonthLabel}</Text>
        </View>


        {/* Habits list */}
        {habits.length === 0 && archivedHabits.length === 0 ? (
          <View style={styles.emptyStateWrapper}>
            <EmptyAnimation size={180} />
            <AdaptiveGlassView style={styles.emptyStateCard}>
              <Text style={styles.emptyTitle}>{habitStrings.empty.title}</Text>
              <Text style={styles.emptySubtitle}>{habitStrings.empty.subtitle}</Text>
            </AdaptiveGlassView>
          </View>
        ) : (
          <>
            {habits.length > 0 && (
              <View style={[{ gap: 12 }, isHabitSelectionMode && styles.selectionModeContainer]}>
                {habits.map((habit) => {
                  const enterSelection = () => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    handleEnterSelectionMode(false);
                    handleToggleSelection(habit.id);
                  };
                  return (
                    <SelectableListItem
                      key={habit.id}
                      id={habit.id}
                      isSelectionMode={isHabitSelectionMode}
                      isSelected={isSelected(habit.id)}
                      onToggleSelect={handleToggleSelection}
                      onLongPress={enterSelection}
                      onPress={() => router.push(`/(modals)/planner/habit-detail?id=${habit.id}`)}
                    >
                      <HabitCard
                        data={habit}
                        onPress={() => router.push(`/(modals)/planner/habit-detail?id=${habit.id}`)}
                        onLongPress={enterSelection}
                        strings={habitStrings}
                        onLog={(habitId, status, options) =>
                          logHabitCompletion(habitId, status, {
                            date: selectedDate,
                            clear: options?.clear,
                          })
                        }
                      />
                    </SelectableListItem>
                  );
                })}
              </View>
            )}

            {/* Archived Habits (History) */}
            {archivedHabits.length > 0 && (
              <>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyLabel}>Delete History</Text>
                  <Text style={styles.historyHint}>Recover deleted habits</Text>
                </View>
                <View style={[{ gap: 12 }, isHabitSelectionMode && styles.selectionModeContainer]}>
                  {archivedHabits.map((habit) => {
                    const enterHistorySelection = () => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      handleEnterSelectionMode(true);
                      handleToggleSelection(habit.id);
                    };
                    return (
                      <SelectableListItem
                        key={habit.id}
                        id={habit.id}
                        isSelectionMode={isHabitSelectionMode}
                        isSelected={isSelected(habit.id)}
                        onToggleSelect={handleToggleSelection}
                        onLongPress={enterHistorySelection}
                      >
                        <HabitCard
                          data={habit}
                          onPress={() => {}}
                          onLongPress={enterHistorySelection}
                          strings={habitStrings}
                          onLog={() => {}}
                          onRecover={() => resumeHabit(habit.id)}
                          onDeleteForever={() => deleteHabitPermanently(habit.id)}
                          isArchived
                        />
                      </SelectableListItem>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

    </>
  );
}

// -------------------------------------
// Habit Card - Rasmga asoslangan sodda dizayn
// -------------------------------------
function HabitCard({
  data,
  onPress,
  onLongPress,
  strings,
  onLog,
  onRecover,
  onDeleteForever,
  isArchived = false,
}: {
  data: HabitCardModel;
  onPress: () => void;
  onLongPress?: () => void;
  strings: AppTranslations['plannerScreens']['habits'];
  onLog: (habitId: string, completed: boolean, options?: { clear?: boolean }) => void;
  onRecover?: () => void;
  onDeleteForever?: () => void;
  isArchived?: boolean;
}) {
  const theme = useAppTheme();
  const styles = useStyles();

  const completion = useMemo(
    () => pct(data.weeklyCompleted, data.weeklyTarget),
    [data.weeklyCompleted, data.weeklyTarget],
  );

  const badgeText = `${data.badgeDays ?? data.streak} ${strings.badgeSuffix}`;
  const isCompletedToday = data.todayStatus === 'done';
  const disablePrimary = !data.canLogToday && !isCompletedToday;

  const handlePrimary = useCallback(() => {
    if (disablePrimary) return;
    if (isCompletedToday) {
      onLog(data.id, false, { clear: true });
    } else {
      onLog(data.id, true);
    }
  }, [data.id, disablePrimary, isCompletedToday, onLog]);

  const handleFail = useCallback(() => onLog(data.id, false), [data.id, onLog]);

  // CTA label va type aniqlash
  const ctaLabel = useMemo(() => {
    if (data.cta?.kind === 'timer') return strings.ctas.startTimer;
    if (data.cta?.kind === 'dual') return null; // dual button ko'rsatiladi
    return isCompletedToday ? strings.ctas.completed : strings.ctas.checkIn;
  }, [data.cta?.kind, isCompletedToday, strings.ctas]);

  const showDualButtons = data.cta?.kind === 'dual';

  return (
    <AdaptiveGlassView style={styles.card}>
      <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={400} style={styles.cardPress}>
        {/* Header: Title + Streak Badge */}
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{data.title}</Text>
          <View style={styles.streakBadge}>
            <FireIcon size={14} color="#F59E0B" />
            <Text style={[styles.streakBadgeText, { color: '#F59E0B' }]}>{badgeText}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsCol}>
          <Text style={styles.statLine}>
            <Text style={styles.statLabel}>Streak: </Text>
            {data.streak} days straight
          </Text>
          <Text style={styles.statLine}>
            <Text style={styles.statLabel}>Record: </Text>
            {data.record} days
          </Text>
          <Text style={styles.statLine}>
            <Text style={styles.statLabel}>Completion: </Text>
            {completion}% ({data.weeklyCompleted}/{data.weeklyTarget} weekly)
          </Text>
        </View>

        {/* Days Row - 10 ta bubble */}
        <View style={styles.daysRow}>
          {data.daysRow.map((status, idx) => (
            <DayBubble key={idx} status={status} />
          ))}
        </View>

        {/* AI Note */}
        {!!data.aiNote && (
          <View style={styles.aiRow}>
            <Sparkles size={14} color={theme.colors.textSecondary} />
            <Text style={styles.aiText} numberOfLines={1}>
              Ai: "{data.aiNote}"
            </Text>
          </View>
        )}

        {/* CTA Button(s) */}
        {isArchived ? (
          <View style={styles.ctaRow}>
            <Pressable
              style={[styles.ctaButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={onRecover}
            >
              <Text style={[styles.ctaButtonText, { color: theme.colors.textSecondary }]}>Recover</Text>
            </Pressable>
            <Pressable
              style={[styles.ctaButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={onDeleteForever}
            >
              <Text style={[styles.ctaButtonText, { color: theme.colors.textSecondary }]}>Delete Forever</Text>
            </Pressable>
          </View>
        ) : showDualButtons ? (
          <View style={styles.ctaRow}>
            <Pressable
              style={[styles.ctaButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, opacity: disablePrimary ? 0.4 : 1 }]}
              onPress={() => onLog(data.id, true)}
              disabled={disablePrimary}
            >
              <Text style={[styles.ctaButtonText, { color: theme.colors.textSecondary }]}>{strings.ctas.completed}</Text>
            </Pressable>
            <Pressable
              style={[styles.ctaButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, opacity: disablePrimary ? 0.4 : 1 }]}
              onPress={handleFail}
              disabled={disablePrimary}
            >
              <Text style={[styles.ctaButtonText, { color: theme.colors.textSecondary }]}>{strings.ctas.failed}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.ctaButtonFull, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, opacity: disablePrimary ? 0.4 : 1 }]}
            onPress={handlePrimary}
            disabled={disablePrimary}
          >
            <Text style={[styles.ctaButtonText, { color: theme.colors.textSecondary }]}>{ctaLabel}</Text>
          </Pressable>
        )}
      </Pressable>
    </AdaptiveGlassView>
  );
}

// -------------------------------------
// Small UI parts
// -------------------------------------
function DayBubble({ status }: { status: HabitDayStatus }) {
  const theme = useAppTheme();
  const base = {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1.2,
    borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
    backgroundColor: 'transparent',
  };

  if (status === 'done') {
    const success = theme.colors.success;
    return (
      <View
        style={[
          base,
          { backgroundColor: `${success}26`, borderColor: `${success}80` },
        ]}
      >
        <Check size={12} color={success} />
      </View>
    );
  }
  if (status === 'miss') {
    const danger = theme.colors.danger;
    return (
      <View
        style={[
          base,
          { backgroundColor: `${danger}26`, borderColor: `${danger}80` },
        ]}
      >
        <X size={12} color={danger} />
      </View>
    );
  }
  return <View style={base} />;
}


// -------------------------------------
// Styles
// -------------------------------------
const useStyles = createThemedStyles((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: 40, gap: 16, paddingHorizontal: 12 },
  emptyStateWrapper: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    padding: 24,
    gap: 14,
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  topBar: {
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 0.3, color: theme.colors.textSecondary },
  monthText: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary },

  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  cardPress: { padding: 12 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
  badgeRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary },
  goalChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  goalChip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  goalChipOverflow: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  goalChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },

  statsCol: { gap: 3, marginBottom: 6, paddingLeft: 2 },
  statLine: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
  statKey: { fontWeight: '800', color: theme.colors.textPrimary },
  calendarBlock: {
    marginBottom: 16,
    gap: 10,
  },
  calendarGrid: {
    gap: 6,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    gap: 6,
  },
  calendarCell: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  calendarCellMuted: {
    opacity: 0.35,
  },
  calendarCellDone: {
    backgroundColor: `${theme.colors.success}26`,
    borderColor: `${theme.colors.success}80`,
  },
  calendarCellMiss: {
    backgroundColor: `${theme.colors.danger}26`,
    borderColor: `${theme.colors.danger}80`,
  },
  calendarCellToday: {
    borderColor: theme.colors.primary,
  },
  calendarCellText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  calendarLegendRow: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
  },
  calendarLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.border,
  },
  legendDotDone: {
    backgroundColor: theme.colors.success,
  },
  legendDotMiss: {
    backgroundColor: theme.colors.danger,
  },
  legendDotNone: {
    backgroundColor: theme.colors.border,
  },
  calendarLegendText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  legendTooltip: {
    marginTop: 8,
    borderRadius: 12,
    padding: 10,
  },
  legendTooltipText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  daysRow: { flexDirection: 'row', gap: 6, marginTop: 6 },

  // New CTA styles
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  ctaButton: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  ctaButtonFull: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  ctaButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Streak badge styles
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  streakBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Stat label
  statLabel: {
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },

  aiRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiText: { fontSize: 12, color: theme.colors.textSecondary },

  actionsContainer: { marginTop: 12, gap: 10 },
  chipsRow: { flexDirection: 'row', gap: 12 },
  dualRow: { flexDirection: 'row', gap: 10 },

  glassBtn: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  glassBtnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  glassBtnText: { fontSize: 13, fontWeight: '600' },

  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  chipText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3, color: theme.colors.textSecondary },

  expandArea: { marginTop: 12, gap: 12 },
  sectionBlock: {
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    gap: 6,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  blockTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary },
  blockLine: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
  blockBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  blockBadgeText: { color: theme.colors.textSecondary, fontSize: 13 },
  selectionModeContainer: {
    paddingLeft: 36,
  },
  historyHeader: {
    paddingTop: 18,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 0.3, color: theme.colors.textSecondary },
  historyHint: { fontSize: 12, fontWeight: '500', color: theme.colors.textTertiary },
}));
