// app/(tabs)/(planner)/(tabs)/index.tsx
import React, { useMemo, useCallback, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
  type ViewStyle,
} from 'react-native';
import {
  CheckSquare,
  Square,
  Zap,
  AlarmClock,
  Heart,
  Bell,
  ClipboardList,
  Trash2,
  Filter,
  Sun,
  SunMedium,
  Moon,
  MoreHorizontal,
  RotateCcw,
  Pencil,
} from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import EdgeSwipeable from '@/components/shared/EdgeSwipeable';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import type { AppTranslations } from '@/localization/strings';
import { useRouter } from 'expo-router';

import type { PlannerTask, PlannerTaskSection, PlannerTaskStatus } from '@/types/planner';
import { useSelectedDayStore } from '@/stores/selectedDayStore';
import { usePlannerFocusBridge } from '@/features/planner/useFocusTaskBridge';
import { getHabitTemplates } from '@/features/planner/habits/data';
import { startOfDay } from '@/utils/calendar';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { mapDomainTaskToPlannerTask, type PlannerTaskCard } from '@/features/planner/taskAdapters';
import { useShallow } from 'zustand/react/shallow';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// -----------------------------
// Helpers
// -----------------------------
const energyIcons = (n: 1 | 2 | 3, color: string) =>
  Array.from({ length: n }).map((_, i) => <Zap key={i} size={14} color={color} />);

const sectionMeta = (
  theme: ReturnType<typeof useAppTheme>,
  id: PlannerTaskSection,
  sectionLabels: AppTranslations['plannerScreens']['tasks']['sections'],
) => {
  const copy = sectionLabels[id];
  switch (id) {
    case 'morning':
      return { icon: <Sun size={14} color={theme.colors.textSecondary} />, title: copy.title, time: copy.time };
    case 'afternoon':
      return { icon: <SunMedium size={14} color={theme.colors.textSecondary} />, title: copy.title, time: copy.time };
    case 'evening':
      return { icon: <Moon size={14} color={theme.colors.textSecondary} />, title: copy.title, time: copy.time };
  }
};

const isTaskOverdue = (task: PlannerTask) => {
  if (!task.dueAt) return false;
  if (task.status === 'completed' || task.status === 'archived') return false;
  return task.dueAt < Date.now();
};

const stripeColor = (theme: ReturnType<typeof useAppTheme>, task: PlannerTask) => {
  if (task.status === 'completed') return theme.colors.success;
  if (task.status === 'in_progress') return theme.colors.primary;
  if (task.status === 'archived') return theme.colors.danger;
  if (isTaskOverdue(task)) return theme.colors.danger;
  return theme.colors.textTertiary;
};

const statusBadgeColors = (
  theme: ReturnType<typeof useAppTheme>,
  status: PlannerTaskStatus,
) => {
  switch (status) {
    case 'completed':
      return { bg: `${theme.colors.success}1A`, text: theme.colors.success };
    case 'in_progress':
      return { bg: `${theme.colors.primary}1A`, text: theme.colors.primary };
    case 'archived':
      return { bg: `${theme.colors.danger}1A`, text: theme.colors.danger };
    default:
      return { bg: theme.colors.surfaceMuted, text: theme.colors.textSecondary };
  }
};

const durationToMinutes = (value?: string): number | undefined => {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  const minuteMatch = normalized.match(/(\d+)\s*(?:min|m)\b/);
  if (minuteMatch) {
    return Number(minuteMatch[1]);
  }
  const hourMatch = normalized.match(/(\d+)\s*(?:hour|h)\b/);
  if (hourMatch) {
    return Number(hourMatch[1]) * 60;
  }
  return undefined;
};

// -----------------------------
// Components
// -----------------------------
export default function PlannerTasksTab() {
  const theme = useAppTheme();
  const { strings, locale } = useLocalization();
  const tasksStrings = strings.plannerScreens.tasks;
  const router = useRouter();
  const startFocusForTask = usePlannerFocusBridge((state) => state.startFocusForTask);
  const habitTemplates = useMemo(() => getHabitTemplates(), []);
  const handleEditTask = useCallback(
    (task: PlannerTask) => {
      router.push(`/(modals)/planner/task?id=${task.id}`);
    },
    [router],
  );

  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const {
    tasks: domainTasks,
    setTaskStatus,
    completeTask,
    deleteTask: deleteDomainTask,
    deleteTaskPermanently,
  } = usePlannerDomainStore(
    useShallow((state) => ({
      tasks: state.tasks,
      setTaskStatus: state.setTaskStatus,
      completeTask: state.completeTask,
      deleteTask: state.deleteTask,
      deleteTaskPermanently: state.deleteTaskPermanently,
    })),
  );

  const selectedDay = useSelectedDayStore((state) => state.selectedDate);
  const normalizedSelectedDay = useMemo(() => startOfDay(selectedDay ?? new Date()), [selectedDay]);
  const dayStart = normalizedSelectedDay.getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;

  const activeDomainTasks = useMemo(
    () =>
      domainTasks.filter(
        (task) =>
          task.status === 'active' ||
          task.status === 'in_progress' ||
          task.status === 'planned' ||
          task.status === 'overdue' ||
          task.status === 'inbox',
      ),
    [domainTasks],
  );

  const historyDomainTasks = useMemo(
    () => domainTasks.filter((task) => task.status === 'completed' || task.status === 'archived'),
    [domainTasks],
  );

  const plannerTasks: PlannerTaskCard[] = useMemo(
    () => activeDomainTasks.map((task) => mapDomainTaskToPlannerTask(task, expandedMap)),
    [activeDomainTasks, expandedMap],
  );

  const tasksForDay: PlannerTaskCard[] = useMemo(() => {
    return plannerTasks.filter((task) => {
      if (task.dueAt == null) return true;
      return task.dueAt >= dayStart && task.dueAt < dayEnd;
    });
  }, [dayEnd, dayStart, plannerTasks]);

  const historyTasks: PlannerTaskCard[] = useMemo(
    () =>
      historyDomainTasks
        .filter((task) => {
          const ts = new Date(task.updatedAt ?? task.createdAt).getTime();
          return ts >= dayStart && ts < dayEnd;
        })
        .map((task) =>
          mapDomainTaskToPlannerTask(task, {
            expandedMap,
            deletedAt: task.status === 'archived' ? new Date(task.updatedAt).getTime() : null,
          }),
        ),
    [dayEnd, dayStart, expandedMap, historyDomainTasks],
  );

  const grouped = useMemo(() => {
    const base: Record<PlannerTaskSection, PlannerTaskCard[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };
    tasksForDay.forEach((task) => {
      base[task.section].push(task);
    });
    return base;
  }, [tasksForDay]);

  const sortedHistory: PlannerTaskCard[] = useMemo(() => {
    return [...historyTasks].sort(
      (a, b) =>
        (b.deletedAt ?? b.updatedAt ?? b.createdAt ?? 0) - (a.deletedAt ?? a.updatedAt ?? a.createdAt ?? 0),
    );
  }, [historyTasks]);

  const doneCount = (arr: PlannerTaskCard[]) => arr.filter((t) => t.status === 'completed').length;
  const dayOfWeek = normalizedSelectedDay.getDay();
  const habitsDueToday = useMemo(
    () => habitTemplates.filter((habit) => habit.scheduleDays.includes(dayOfWeek)).length,
    [habitTemplates, dayOfWeek],
  );
  const goalStepsToday = useMemo(() => {
    const goalIds = new Set<string>();
    tasksForDay.forEach((task) => {
      if (task.goalId) {
        goalIds.add(task.goalId);
      }
    });
    return goalIds.size;
  }, [tasksForDay]);

  const handleToggleDone = useCallback(
    (task: PlannerTaskCard) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      if (task.status === 'completed') {
        setTaskStatus(task.id, 'active');
        return;
      }
      completeTask(task.id);
    },
    [completeTask, setTaskStatus],
  );

  const handleStartFocus = useCallback(
    (task: PlannerTaskCard) => {
      const durationMinutes = durationToMinutes(task.duration);
      startFocusForTask(task.id, durationMinutes ? { durationMinutes } : undefined);
      router.push({ pathname: '/focus-mode', params: { taskId: task.id } });
    },
    [router, startFocusForTask],
  );

  const handleToggleExpand = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      deleteDomainTask(id);
    },
    [deleteDomainTask],
  );

  const handleRestore = useCallback((taskId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTaskStatus(taskId, 'active');
  }, [setTaskStatus]);

  const handleRemoveFromHistory = useCallback(
    (taskId: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      deleteTaskPermanently(taskId);
    },
    [deleteTaskPermanently],
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    [locale],
  );

  const plansLabel = useMemo(() => {
    const today = startOfDay(new Date());
    if (normalizedSelectedDay.getTime() === today.getTime()) {
      return tasksStrings.todayLabel;
    }
    return dateFormatter.format(normalizedSelectedDay);
  }, [dateFormatter, normalizedSelectedDay, tasksStrings.todayLabel]);

  const plansTitle = useMemo(
    () => tasksStrings.headerTemplate.replace('{date}', plansLabel),
    [plansLabel, tasksStrings.headerTemplate],
  );
  const summaryLabel = useMemo(
    () =>
      tasksStrings.dailySummary
        .replace('{tasks}', String(tasksForDay.length))
        .replace('{habits}', String(habitsDueToday))
        .replace('{goals}', String(goalStepsToday)),
    [goalStepsToday, habitsDueToday, tasksForDay, tasksStrings.dailySummary],
  );

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Summary Widget - MOVED TO TOP */}
        <View style={[styles.dailySummary, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.dailySummaryText, { color: theme.colors.textPrimary }]}>{summaryLabel}</Text>
        </View>


        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={[styles.topTitle, { color: theme.colors.textSecondary }]}>{plansTitle}</Text>
          <Pressable style={styles.filterBtn}>
            <Text style={[styles.filterText, { color: theme.colors.textSecondary }]}>{tasksStrings.filter}</Text>
            <Filter size={14} color={theme.colors.textSecondary} />
          </Pressable>
        </View>

        <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />

        {/* Sections */}
        {grouped.morning.length > 0 && (
          <Section
            id="morning"
            items={grouped.morning}
            theme={theme}
            done={doneCount(grouped.morning)}
            total={grouped.morning.length}
            onToggleDone={handleToggleDone}
            onToggleExpand={handleToggleExpand}
            onDelete={handleDelete}
            onComplete={handleToggleDone}
            onFocusTask={handleStartFocus}
            onEditTask={handleEditTask}
            tasksStrings={tasksStrings}
          />
        )}

        {grouped.afternoon.length > 0 && (
          <Section
            id="afternoon"
            items={grouped.afternoon}
            theme={theme}
            done={doneCount(grouped.afternoon)}
            total={grouped.afternoon.length}
            onToggleDone={handleToggleDone}
            onToggleExpand={handleToggleExpand}
            onDelete={handleDelete}
            onComplete={handleToggleDone}
            onFocusTask={handleStartFocus}
            onEditTask={handleEditTask}
            tasksStrings={tasksStrings}
          />
        )}

        {grouped.evening.length > 0 && (
          <Section
            id="evening"
            items={grouped.evening}
            theme={theme}
            done={doneCount(grouped.evening)}
            total={grouped.evening.length}
            onToggleDone={handleToggleDone}
            onToggleExpand={handleToggleExpand}
            onDelete={handleDelete}
            onComplete={handleToggleDone}
            onFocusTask={handleStartFocus}
            onEditTask={handleEditTask}
            tasksStrings={tasksStrings}
          />
        )}

        {sortedHistory.length > 0 && (
          <HistorySection
            items={sortedHistory}
            theme={theme}
            onRestore={handleRestore}
            onRemove={handleRemoveFromHistory}
            tasksStrings={tasksStrings}
          />
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </>
  );
}

// -----------------------------
// Section Component
// -----------------------------
function Section({
  id,
  items,
  theme,
  done,
  total,
  onToggleDone,
  onToggleExpand,
  onDelete,
  onComplete,
  onFocusTask,
  onEditTask,
  tasksStrings,
}: {
  id: PlannerTaskSection;
  items: PlannerTaskCard[];
  theme: ReturnType<typeof useAppTheme>;
  done: number;
  total: number;
  onToggleDone: (task: PlannerTaskCard) => void;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void;
  onComplete: (task: PlannerTaskCard) => void;
  onFocusTask: (task: PlannerTaskCard) => void;
  onEditTask: (task: PlannerTask) => void;
  tasksStrings: AppTranslations['plannerScreens']['tasks'];
}) {
  const meta = sectionMeta(theme, id, tasksStrings.sections);
  return (
    <>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionLeft}>
          {meta.icon}
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{meta.title}</Text>
          <Text style={[styles.sectionTime, { color: theme.colors.textTertiary }]}>{meta.time}</Text>
        </View>
        <Text style={[styles.sectionCount, { color: theme.colors.textSecondary }]}>
          {done}/{total} {tasksStrings.sectionCountLabel}
        </Text>
      </View>
      <Text style={[styles.sectionTip, { color: theme.colors.textTertiary }]}>{tasksStrings.sectionTip}</Text>

      <View style={{ gap: 10 }}>
        {items.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            theme={theme}
            onToggleDone={() => onToggleDone(t)}
            onToggleExpand={() => onToggleExpand(t.id)}
            onDelete={() => onDelete(t.id)}
            onComplete={() => onComplete(t)}
            onFocusTask={() => onFocusTask(t)}
            onEditTask={() => onEditTask(t)}
            tasksStrings={tasksStrings}
          />
        ))}
      </View>
    </>
  );
}

// -----------------------------
// Task Card (swipe actions, expand)
// -----------------------------
function TaskCard({
  task,
  theme,
  onToggleDone,
  onToggleExpand,
  onDelete,
  onComplete,
  onRestore,
  mode = 'active',
  onFocusTask,
  onEditTask,
  tasksStrings,
}: {
  task: PlannerTaskCard;
  theme: ReturnType<typeof useAppTheme>;
  onToggleDone: () => void;
  onToggleExpand: () => void;
  onDelete: () => void;
  onComplete: () => void;
  onRestore?: () => void;
  mode?: 'active' | 'history';
  onFocusTask?: (task: PlannerTask) => void;
  onEditTask?: (task: PlannerTask) => void;
  tasksStrings: AppTranslations['plannerScreens']['tasks'];
}) {
  const isHistory = mode === 'history';
  const isCompleted = task.status === 'completed';
  const allowComplete = !isHistory && !isCompleted;
  const allowDelete = isHistory ? !!onDelete : true;
  const allowRestore = isHistory;
  const badgeColors = statusBadgeColors(theme, task.status);
  const statusLabel = tasksStrings.statuses[task.status];
  const canFocus = !isHistory && task.status !== 'completed' && typeof onFocusTask === 'function';
  const focusLabel =
    task.status === 'in_progress' ? tasksStrings.focus.inProgress : tasksStrings.focus.cta;

  const checkboxDisabled = isHistory;
  const checkboxPress = checkboxDisabled ? undefined : onToggleDone;

  const renderRightActions = useCallback(() => {
    const baseActionStyle: ViewStyle = {
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.sm,
      flex: 1,
      height: '100%',
    };
    const iconColor = theme.colors.white ?? theme.colors.textPrimary;
    return (
      <View
        style={[
          styles.swipeActions,
          {
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.sm,
            gap: 4,
          },
        ]}
      >
        {isHistory ? (
          <>
            {allowRestore && (
              <Pressable
                style={[
                  styles.swipeActionButtonMono,
                  baseActionStyle,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={onRestore}
              >
                <View style={styles.swipeActionContent}>
                  <RotateCcw size={32} color={iconColor} />
                </View>
              </Pressable>
            )}
            {allowDelete && (
              <Pressable
                style={[
                  styles.swipeActionButtonMono,
                  baseActionStyle,
                  { backgroundColor: theme.colors.danger },
                ]}
                onPress={onDelete}
              >
                <View style={styles.swipeActionContent}>
                  <Trash2 size={32} color={iconColor} />
                </View>
              </Pressable>
            )}
          </>
        ) : (
          <>
            {allowComplete && (
              <Pressable
                style={[
                  styles.swipeActionButtonMono,
                  baseActionStyle,
                  { backgroundColor: theme.colors.success },
                ]}
                onPress={onComplete}
              >
                <View style={styles.swipeActionContent}>
                  <CheckSquare size={32} color={iconColor} />
                </View>
              </Pressable>
            )}
            {onEditTask && (
              <Pressable
                style={[
                  styles.swipeActionButtonMono,
                  baseActionStyle,
                  { backgroundColor: theme.colors.card },
                ]}
                onPress={() => onEditTask(task)}
              >
                <View style={styles.swipeActionContent}>
                  <Pencil size={32} color={iconColor} />
                </View>
              </Pressable>
            )}
            {allowDelete && (
              <Pressable
                style={[
                  styles.swipeActionButtonMono,
                  baseActionStyle,
                  { backgroundColor: theme.colors.danger },
                ]}
                onPress={onDelete}
              >
                <View style={styles.swipeActionContent}>
                  <Trash2 size={32} color={iconColor} />
                </View>
              </Pressable>
            )}
          </>
        )}
      </View>
    );
  }, [
    allowComplete,
    allowDelete,
    allowRestore,
    onComplete,
    onDelete,
    onEditTask,
    onRestore,
    isHistory,
    task,
    theme.colors.card,
    theme.colors.danger,
    theme.colors.primary,
    theme.colors.success,
    theme.colors.white,
    theme.colors.textPrimary,
    theme.spacing.sm,
    theme.spacing.xl,
  ]);

  return (
    <EdgeSwipeable
      activationEdgeRatio={0.25}
      rightThreshold={72}
      renderRightActions={renderRightActions}
    >
      <AdaptiveGlassView
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            shadowOpacity: 0,
          },
        ]}
      >
        <Pressable style={styles.cardPress} onPress={onToggleExpand} disabled={isHistory}>
          {isHistory && task.deletedAt && (
            <View style={[styles.historyBadge, { borderColor: theme.colors.danger }]}>
              <Text style={[styles.historyBadgeText, { color: theme.colors.danger }]}>
                {tasksStrings.history.deletedBadge}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.stripe,
              { backgroundColor: stripeColor(theme, task) },
            ]}
          />

          <Pressable
            onPress={checkboxPress}
            disabled={!checkboxPress}
            style={styles.checkboxWrap}
          >
            {task.status === 'completed' ? (
              <CheckSquare size={16} color={theme.colors.success} />
            ) : task.deletedAt || task.status === 'archived' ? (
              <Trash2 size={16} color={theme.colors.danger} />
            ) : (
              <Square size={16} color={theme.colors.textSecondary} />
            )}
          </Pressable>

          <View style={styles.metaRow}>
            <AlarmClock size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{task.start}</Text>
            <Text style={[styles.metaDot, { color: theme.colors.textSecondary }]}>•</Text>
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{task.duration}</Text>
            <Text style={[styles.metaDot, { color: theme.colors.textSecondary }]}>•</Text>
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{task.context}</Text>

            <View style={{ flex: 1 }} />
            <View style={styles.energyRow}>
              {energyIcons(task.energy, theme.colors.textSecondary)}
            </View>
            {!isHistory && onEditTask && (
              <Pressable hitSlop={10} onPress={() => onEditTask(task)}>
                <MoreHorizontal size={16} color={theme.colors.textSecondary} />
              </Pressable>
            )}
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.statusPill, { backgroundColor: badgeColors.bg }]}>
              <Text style={[styles.statusPillText, { color: badgeColors.text }]}>{statusLabel}</Text>
            </View>
            {!isHistory && canFocus && (
              <Pressable
                onPress={() => onFocusTask?.(task)}
                style={[styles.focusButton, { borderColor: theme.colors.border }]}
              >
                <Zap size={12} color={theme.colors.textSecondary} />
                <Text style={[styles.focusButtonText, { color: theme.colors.textSecondary }]}>
                  {focusLabel}
                </Text>
              </Pressable>
            )}
          </View>

          <View style={styles.titleRow}>
            <Text
              numberOfLines={1}
              style={[
                styles.title,
                {
                  color: theme.colors.white,
                  textDecorationLine: task.status === 'completed' ? 'line-through' : 'none',
                  opacity: task.status === 'completed' ? 0.6 : 1,
                },
              ]}
            >
              {task.title}
            </Text>

            {task.projectHeart && <Heart size={16} color={theme.colors.textSecondary} />}

            <Text style={[styles.timeRight, { color: theme.colors.textSecondary }]}>
              {task.afterWork ? '' : task.costUZS ?? ''}
            </Text>
          </View>

          {task.expanded && !isHistory && (
            <View style={styles.expandArea}>
              {task.desc ? (
                <Text style={[styles.desc, { color: theme.colors.textSecondary }]} numberOfLines={3}>
                  {task.desc}
                </Text>
              ) : null}

              <View style={styles.iconBar}>
                <Bell size={16} color={theme.colors.textSecondary} />
                <ClipboardList size={16} color={theme.colors.textSecondary} />
                <Heart size={16} color={theme.colors.textSecondary} />
                <CalendarDays size={16} color={theme.colors.textSecondary} />
                <Trash2 size={16} color={theme.colors.textSecondary} />
              </View>
            </View>
          )}

          {task.aiNote && !isHistory && (
            <View style={styles.aiRow}>
              <SunMedium size={14} color={theme.colors.textSecondary} />
              <Text numberOfLines={1} style={[styles.aiText, { color: theme.colors.textSecondary }]}>
                {tasksStrings.aiPrefix} {task.aiNote}
              </Text>
            </View>
          )}
        </Pressable>
      </AdaptiveGlassView>
    </EdgeSwipeable>
  );
}
function HistorySection({
  items,
  theme,
  onRestore,
  onRemove,
  tasksStrings,
}: {
  items: PlannerTaskCard[];
  theme: ReturnType<typeof useAppTheme>;
  onRestore: (taskId: string) => void;
  onRemove: (taskId: string) => void;
  tasksStrings: AppTranslations['plannerScreens']['tasks'];
}) {
  return (
    <>
      <View style={styles.historyHeader}>
        <Text style={[styles.historyLabel, { color: theme.colors.textSecondary }]}>
          {tasksStrings.history.title}
        </Text>
        <Text style={[styles.historyHint, { color: theme.colors.textTertiary }]}>{tasksStrings.history.subtitle}</Text>
      </View>
      <Text style={[styles.sectionTip, { color: theme.colors.textTertiary }]}>{tasksStrings.history.tip}</Text>

      <View style={{ gap: 10 }}>
        {items.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            theme={theme}
            onToggleDone={() => { }}
            onToggleExpand={() => { }}
            onDelete={() => onRemove(task.id)}
            onComplete={() => { }}
            onRestore={() => onRestore(task.id)}
            mode="history"
            tasksStrings={tasksStrings}
          />
        ))}
      </View>
    </>
  );
}

// -----------------------------
// Styles
// -----------------------------
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 12, paddingBottom: 40, gap: 16 },

  topBar: {
    paddingTop: 10,
    paddingHorizontal: 4,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topTitle: { fontSize: 14, fontWeight: '600', letterSpacing: 0.4 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterText: { fontSize: 13, fontWeight: '600' },
  separator: { height: StyleSheet.hairlineWidth, opacity: 0.5 },
  dailySummary: {
    marginHorizontal: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  dailySummaryText: {
    fontSize: 13,
    fontWeight: '600',
  },

  sectionHeader: {
    paddingTop: 8,
    paddingBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTip: {
    paddingLeft: 4,
    paddingBottom: 4,
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.75,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  sectionTime: { fontSize: 12 },
  sectionCount: { fontSize: 12, fontWeight: '600' },
  historyHeader: {
    paddingTop: 18,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  historyHint: { fontSize: 12, fontWeight: '500' },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
  },
  cardPress: { padding: 6, position: 'relative' },
  historyBadge: {
    position: 'absolute',
    top: 30,
    right: 12,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  historyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  stripe: {
    position: 'absolute',
    left: 6,
    top: 8,
    bottom: 8,
    width: 6,
    borderRadius: 4,
  },
  checkboxWrap: {
    position: 'absolute',
    left: 18,
    top: 12,
  },

  metaRow: {
    paddingLeft: 38,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metaText: { fontSize: 12, fontWeight: '600' },
  metaDot: { fontSize: 12, opacity: 0.8 },

  energyRow: { flexDirection: 'row', gap: 4, marginRight: 8 },

  titleRow: {
    paddingLeft: 38,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  title: { fontSize: 15, fontWeight: '700' },
  timeRight: { marginLeft: 'auto', fontSize: 12, fontWeight: '700' },
  statusRow: {
    paddingLeft: 38,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  focusButton: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  focusButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },

  expandArea: {
    paddingLeft: 38,
    paddingRight: 8,
    marginTop: 8,
    gap: 8,
  },
  desc: { fontSize: 12, lineHeight: 18 },
  iconBar: { flexDirection: 'row', gap: 12 },

  aiRow: { paddingLeft: 38, paddingRight: 8, marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiText: { fontSize: 12 },

  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    width:"100%"
  },
  swipeActionButtonMono: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
    borderRadius: 8,
    flex: 1,
  },
  swipeActionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  swipeActionTextMono: {
    fontSize: 10,
    fontWeight: '500',
  },

  fab: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
});
