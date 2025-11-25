// app/(tabs)/(planner)/(tabs)/habits.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  UIManager,
  View,
  ViewStyle,
} from 'react-native';
import { AlarmClock, Award, Check, Flame, MoreHorizontal, Sparkles, Trophy, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { createThemedStyles, useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import type { AppTranslations } from '@/localization/strings';
import { useSelectedDayStore } from '@/stores/selectedDayStore';
import {
  buildHabits,
  summarizeHabitLegendFromWeeks,
  type HabitCardModel,
  type HabitDayStatus,
} from '@/features/planner/habits/data';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
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
  const { domainHabits, domainGoals, logHabitCompletion, archiveHabit } = usePlannerDomainStore(
    useShallow((state) => ({
      domainHabits: state.habits,
      domainGoals: state.goals,
      logHabitCompletion: state.logHabitCompletion,
      archiveHabit: state.archiveHabit,
    })),
  );
  const storedSelectedDate = useSelectedDayStore((state) => state.selectedDate);
  const selectedDate = storedSelectedDate;
  const activeDomainHabits = useMemo(() => domainHabits.filter((habit) => habit.status !== 'archived'), [domainHabits]);
  const goalTitleMap = useMemo(() => {
    const map: Record<string, string> = {};
    domainGoals.forEach((goal) => {
      map[goal.id] = goal.title;
    });
    return map;
  }, [domainGoals]);
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

  const toggleExpand = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHabits((prev) =>
      prev.map((habit) => (habit.id === id ? { ...habit, expanded: !habit.expanded } : habit)),
    );
  }, []);


  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>{habitStrings.headerTitle}</Text>
        <Text style={styles.monthText}>{topMonthLabel}</Text>
      </View>


      {/* Habits list */}
      {habits.length === 0 ? (
        <View style={styles.emptyStateWrapper}>
          <AdaptiveGlassView style={styles.emptyStateCard}>
            <Text style={styles.emptyTitle}>{habitStrings.empty.title}</Text>
            <Text style={styles.emptySubtitle}>{habitStrings.empty.subtitle}</Text>
          </AdaptiveGlassView>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              data={habit}
              onToggleExpand={() => toggleExpand(habit.id)}
              strings={habitStrings}
              goalTitles={goalTitleMap}
              onLog={(habitId, status, options) =>
                logHabitCompletion(habitId, status, {
                  date: selectedDate,
                  clear: options?.clear,
                })
              }
              onEditHabit={() => router.push(`/(modals)/planner/habit?id=${habit.id}`)}
              onDeleteHabit={(habitId) => archiveHabit(habitId)}
            />
          ))}
        </View>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// -------------------------------------
// Habit Card
// -------------------------------------
function HabitCard({
  data,
  onToggleExpand,
  strings,
  goalTitles,
  onLog,
  onEditHabit,
  onDeleteHabit,
}: {
  data: HabitCardModel;
  onToggleExpand: () => void;
  strings: AppTranslations['plannerScreens']['habits'];
  goalTitles: Record<string, string>;
  onLog: (habitId: string, completed: boolean, options?: { clear?: boolean }) => void;
  onEditHabit: () => void;
  onDeleteHabit: (habitId: string) => void;
}) {
  const theme = useAppTheme();
  const styles = useStyles();
  const completion = useMemo(
    () => pct(data.weeklyCompleted, data.weeklyTarget),
    [data.weeklyCompleted, data.weeklyTarget],
  );
  const streakText = strings.stats.streak.replace('{days}', String(data.streak));
  const recordText = strings.stats.record.replace('{days}', String(data.record));
  const completionText = strings.stats.completion
    .replace('{percent}', String(completion))
    .replace('{completed}', String(data.weeklyCompleted))
    .replace('{target}', String(data.weeklyTarget));
  const badgeText = `${data.badgeDays ?? data.streak} ${strings.badgeSuffix}`;
  const legendSummary = useMemo(() => summarizeHabitLegendFromWeeks(data.calendarWeeks), [data.calendarWeeks]);
  const legendDescriptions = useMemo(() => {
    const formatHint = (template: string, slice: { count: number; percent: number }) =>
      template.replace('{count}', String(slice.count)).replace('{percent}', String(slice.percent));
    return {
      done: formatHint(strings.calendarLegendHint.done, legendSummary.done),
      miss: formatHint(strings.calendarLegendHint.miss, legendSummary.miss),
      none: formatHint(strings.calendarLegendHint.none, legendSummary.none),
    };
  }, [legendSummary, strings.calendarLegendHint]);
  const goalLabels =
    data.linkedGoalIds?.map((goalId) => goalTitles[goalId] ?? goalId) ?? [];
  const isCompletedToday = data.todayStatus === 'done';
  const disablePrimary = !data.canLogToday && !isCompletedToday;
  const handlePrimary = useCallback(() => {
    if (disablePrimary) {
      return;
    }
    if (isCompletedToday) {
      onLog(data.id, false, { clear: true });
    } else {
      onLog(data.id, true);
    }
  }, [data.id, disablePrimary, isCompletedToday, onLog]);
  const handleFail = useCallback(() => onLog(data.id, false), [data.id, onLog]);
  const [legendHint, setLegendHint] = useState<string | null>(null);

  return (
    <AdaptiveGlassView style={styles.card}>
      <Pressable onPress={onToggleExpand} style={styles.cardPress}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.cardTitle}>{data.title}</Text>
            <MoreHorizontal size={16} color={theme.colors.textSecondary} />
          </View>
          <View style={styles.badgeRight}>
            <Flame size={14} color={theme.colors.textSecondary} />
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
        </View>

        {goalLabels.length > 0 && (
          <View style={styles.goalChipRow}>
            {goalLabels.slice(0, 3).map((label) => (
              <View key={label} style={styles.goalChip}>
                <Text style={styles.goalChipText}>{label}</Text>
              </View>
            ))}
            {goalLabels.length > 3 && (
              <View style={[styles.goalChip, styles.goalChipOverflow]}>
                <Text style={styles.goalChipText}>+{goalLabels.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.statsCol}>
          <Text style={styles.statLine}>{streakText}</Text>
          <Text style={styles.statLine}>{recordText}</Text>
          <Text style={styles.statLine}>{completionText}</Text>
        </View>

        <View style={styles.daysRow}>
          {data.daysRow.map((status, idx) => (
            <DayBubble key={idx} status={status} />
          ))}
        </View>

        {!!data.aiNote && (
          <View style={styles.aiRow}>
            <Sparkles size={14} color={theme.colors.textSecondary} />
            <Text style={styles.aiText} numberOfLines={1}>
              {data.aiNote}
            </Text>
          </View>
        )}

        <View style={{ marginTop: 12 }}>
          {data.cta?.kind === 'check' && (
            <GlassButton
              label={isCompletedToday ? strings.ctas.completed : strings.ctas.checkIn}
              onPress={handlePrimary}
              disabled={disablePrimary}
            />
          )}
          {data.cta?.kind === 'timer' && (
            <GlassButton
              icon={<AlarmClock size={14} color={theme.colors.textSecondary} />}
              label={strings.ctas.startTimer}
              onPress={handlePrimary}
              disabled={disablePrimary}
            />
          )}
          {data.cta?.kind === 'chips' && (
            <View style={styles.chipsRow}>
              {(data.chips ?? []).map((chip) => (
                <GlassChip key={chip} label={chip} onPress={handlePrimary} disabled={disablePrimary} />
              ))}
            </View>
          )}
          {data.cta?.kind === 'dual' && (
            <View style={styles.dualRow}>
              <GlassButton
                label={strings.ctas.completed}
                compact
                onPress={() => onLog(data.id, true)}
                disabled={!data.canLogToday}
              />
              <GlassButton
                label={strings.ctas.failed}
                compact
                variant="danger"
                onPress={handleFail}
                disabled={!data.canLogToday}
              />
            </View>
          )}
          <View style={styles.dualRow}>
            <GlassButton label={strings.ctas.edit} compact onPress={onEditHabit} />
            <GlassButton label={strings.ctas.delete} compact variant="danger" onPress={() => onDeleteHabit(data.id)} />
          </View>
        </View>
        {/* 
        {data.expanded && (
          <View style={styles.expandArea}>
            <View style={styles.calendarBlock}>
              <Text style={styles.blockTitle}>
                {strings.calendarTitle.replace('{month}', data.calendarMonthLabel)}
              </Text>
              <View style={styles.calendarGrid}>
                {data.calendarWeeks.map((week, weekIdx) => (
                  <View key={`week-${weekIdx}`} style={styles.calendarWeekRow}>
                    {week.map((cell, cellIdx) => (
                      <View
                        key={`${cell.key}-${cellIdx}`}
                        style={[
                          styles.calendarCell,
                          !cell.isCurrentMonth && styles.calendarCellMuted,
                          cell.status === 'done' && styles.calendarCellDone,
                          cell.status === 'miss' && styles.calendarCellMiss,
                          cell.isToday && styles.calendarCellToday,
                        ]}
                      >
                        <Text style={styles.calendarCellText}>{cell.label}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
              <View style={styles.calendarLegendRow}>
                <LegendButton
                  label={strings.calendarLegend.done}
                  dotStyle={[styles.legendDot, styles.legendDotDone]}
                  description={legendDescriptions.done}
                  onHint={setLegendHint}
                />
                <LegendButton
                  label={strings.calendarLegend.miss}
                  dotStyle={[styles.legendDot, styles.legendDotMiss]}
                  description={legendDescriptions.miss}
                  onHint={setLegendHint}
                />
                <LegendButton
                  label={strings.calendarLegend.none}
                  dotStyle={[styles.legendDot, styles.legendDotNone]}
                  description={legendDescriptions.none}
                  onHint={setLegendHint}
                />
              </View>
              {legendHint && (
                <AdaptiveGlassView style={styles.legendTooltip}>
                  <Text style={styles.legendTooltipText}>{legendHint}</Text>
                </AdaptiveGlassView>
              )}
            </View>
            <View style={styles.sectionBlock}>
              <Text style={styles.blockTitle}>{strings.expand.titles.statistics}</Text>
              <Text style={styles.blockLine}>{strings.expand.lines.overallCompletion}</Text>
              <Text style={styles.blockLine}>{strings.expand.lines.successPercentile}</Text>
              <Text style={styles.blockLine}>{strings.expand.lines.averageStreak}</Text>
              <Text style={styles.blockLine}>{strings.expand.lines.bestMonth}</Text>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.blockTitle}>{strings.expand.titles.pattern}</Text>
              <Text style={styles.blockLine}>{strings.expand.lines.bestTime}</Text>
              <Text style={styles.blockLine}>{strings.expand.lines.worstTime}</Text>
              <Text style={styles.blockLine}>{strings.expand.lines.afterWeekends}</Text>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.blockTitle}>{strings.expand.titles.achievements}</Text>
              <BlockBadge
                icon={<Trophy size={14} color={theme.colors.textSecondary} />}
                text={strings.expand.badges.firstWeek}
              />
              <BlockBadge
                icon={<Award size={14} color={theme.colors.textSecondary} />}
                text={strings.expand.badges.monthNoBreak}
              />
              <BlockBadge
                icon={<Award size={14} color={theme.colors.textSecondary} />}
                text={strings.expand.badges.hundredCompletions}
              />
              <BlockBadge
                icon={<Trophy size={14} color={theme.colors.textSecondary} />}
                text={strings.expand.badges.marathoner}
              />
            </View>
          </View>
        )} */}
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
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

function GlassButton({
  label,
  icon,
  compact,
  variant = 'default',
  onPress,
  disabled,
}: {
  label: string;
  icon?: React.ReactNode;
  compact?: boolean;
  variant?: 'default' | 'danger';
  onPress?: () => void;
  disabled?: boolean;
}) {
  const theme = useAppTheme();
  const styles = useStyles();
  const danger = variant === 'danger';
  const paddingStyle = { paddingVertical: compact ? 8 : 10 };
  const borderColor = danger ? theme.colors.danger : theme.colors.border;
  const textColor = danger ? theme.colors.danger : theme.colors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || disabled}
      style={({ pressed }) => [pressed && onPress && !disabled && styles.pressed]}
    >
      <AdaptiveGlassView
        style={[
          styles.glassBtn,
          paddingStyle,
          { borderColor, opacity: disabled ? 0.4 : 1 },
        ]}
      >
        <View style={styles.glassBtnRow}>
          {icon}
          <Text style={[styles.glassBtnText, { color: textColor }]}>{label}</Text>
        </View>
      </AdaptiveGlassView>
    </Pressable>
  );
}

function GlassChip({ label, onPress, disabled }: { label: string; onPress?: () => void; disabled?: boolean }) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || disabled}
      style={({ pressed }) => [pressed && onPress && !disabled && styles.pressed]}
    >
      <AdaptiveGlassView style={[styles.chip, disabled && { opacity: 0.4 }]}>
        <Text style={styles.chipText}>{label}</Text>
      </AdaptiveGlassView>
    </Pressable>
  );
}

function BlockBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  const styles = useStyles();
  return (
    <View style={styles.blockBadgeRow}>
      {icon}
      <Text style={styles.blockBadgeText}>{text}</Text>
    </View>
  );
}


// -------------------------------------
// Styles
// -------------------------------------
const useStyles = createThemedStyles((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: 40, gap: 16, paddingHorizontal: 12 },
  emptyStateWrapper: {
    paddingVertical: 60,
  },
  emptyStateCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    padding: 24,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
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

  aiRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiText: { fontSize: 12, color: theme.colors.textSecondary },

  chipsRow: { flexDirection: 'row', gap: 12, marginTop: 2 },
  dualRow: { flexDirection: 'row', gap: 10 },

  glassBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    alignItems: 'center',
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  glassBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  glassBtnText: { fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary },

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
}));
function LegendButton({
  label,
  dotStyle,
  description,
  onHint,
}: {
  label: string;
  dotStyle: StyleProp<ViewStyle>;
  description: string;
  onHint: (text: string | null) => void;
}) {
  const styles = useStyles();
  return (
    <Pressable
      onPressIn={() => onHint(description)}
      onPressOut={() => onHint(null)}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <View style={styles.calendarLegendItem}>
        <View style={dotStyle} />
        <Text style={styles.calendarLegendText}>{label}</Text>
      </View>
    </Pressable>
  );
}
