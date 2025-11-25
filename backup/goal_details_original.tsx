// app/(modals)/goal-details.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Circle,
  CreditCard,
  DollarSign,
  Heart,
  Lightbulb,
  PieChart,
  Plus,
  Target,
  TrendingUp,
  Users,
  X,
  MoreVertical,
} from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { usePlannerAggregatesStore } from '@/stores/usePlannerAggregatesStore';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { plannerEventBus } from '@/events/plannerEventBus';
import type { Goal } from '@/domain/planner/types';
import { calculateGoalProgress } from '@/utils/goalProgress';

export default function GoalDetailsModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ goalId?: string }>();

  const goals = usePlannerDomainStore((state) => state.goals);
  const tasks = usePlannerDomainStore((state) => state.tasks);
  const habits = usePlannerDomainStore((state) => state.habits);
  const goalSummaries = usePlannerAggregatesStore((state) => state.goalSummaries);
  const habitSummaries = usePlannerAggregatesStore((state) => state.habitSummaries);
  const logHabitCompletion = usePlannerDomainStore((state) => state.logHabitCompletion);
  const addGoalCheckIn = usePlannerDomainStore((state) => state.addGoalCheckIn);
  const archiveGoal = usePlannerDomainStore((state) => state.archiveGoal);
  const completeGoal = usePlannerDomainStore((state) => state.completeGoal);
  const resumeGoal = usePlannerDomainStore((state) => state.resumeGoal);

  // Check-in modal state
  const [checkInVisible, setCheckInVisible] = useState(false);
  const [checkInValue, setCheckInValue] = useState('');
  const [checkInNote, setCheckInNote] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  // Finance data
  const budgets = useFinanceDomainStore((state) => state.budgets);
  const debts = useFinanceDomainStore((state) => state.debts);

  const goal = useMemo(() => {
    if (!params.goalId) return undefined;
    return goals.find((g) => g.id === params.goalId);
  }, [goals, params.goalId]);

  const goalSummary = useMemo(() => {
    if (!params.goalId) return undefined;
    return goalSummaries.find((gs) => gs.goalId === params.goalId);
  }, [goalSummaries, params.goalId]);

  const linkedHabits = useMemo(() => {
    if (!params.goalId) return [];
    return habits.filter((h) => h.goalId === params.goalId && h.status === 'active');
  }, [habits, params.goalId]);

  const linkedHabitSummaries = useMemo(() => {
    if (!params.goalId) return [];
    return habitSummaries.filter((hs) => hs.goalId === params.goalId);
  }, [habitSummaries, params.goalId]);

  const linkedTasks = useMemo(() => {
    if (!params.goalId) return [];
    return tasks.filter((t) => t.goalId === params.goalId && t.status !== 'completed' && t.status !== 'canceled');
  }, [tasks, params.goalId]);

  const nextTask = useMemo(() => {
    if (linkedTasks.length === 0) return undefined;
    // Find task with highest priority or earliest due date
    const sorted = [...linkedTasks].sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const aPriority = a.priority ? priorityOrder[a.priority] : 4;
      const bPriority = b.priority ? priorityOrder[b.priority] : 4;
      if (aPriority !== bPriority) return aPriority - bPriority;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
    return sorted[0];
  }, [linkedTasks]);

  // Finance links
  const linkedBudget = useMemo(() => {
    if (!goal || !goal.linkedBudgetId) return undefined;
    return budgets.find((b) => b.id === goal.linkedBudgetId);
  }, [goal, budgets]);

  const linkedDebt = useMemo(() => {
    if (!goal || !goal.linkedDebtId) return undefined;
    return debts.find((d) => d.id === goal.linkedDebtId);
  }, [goal, debts]);

  useEffect(() => {
    if (!goal) {
      router.back();
    }
  }, [goal, router]);

  // Subscribe to events for auto-update
  useEffect(() => {
    const unsubscribe1 = plannerEventBus.subscribe('planner.goal.updated', () => {});
    const unsubscribe2 = plannerEventBus.subscribe('planner.goal.progress_updated', () => {});
    const unsubscribe3 = plannerEventBus.subscribe('planner.task.updated', () => {});
    const unsubscribe4 = plannerEventBus.subscribe('planner.habit.day_evaluated', () => {});

    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
      unsubscribe4();
    };
  }, []);

  const progressData = useMemo(() => (goal ? calculateGoalProgress(goal) : undefined), [goal]);
  const fallbackSummary = useMemo(
    () =>
      goal
        ? {
            goalId: goal.id,
            title: goal.title,
            type: goal.goalType,
            unit: goal.unit,
            currency: goal.currency,
            target: progressData?.displayTarget,
            current: progressData?.displayCurrent,
            progressPercent: progressData?.progressPercent ?? 0,
            deadline: goal.targetDate,
            eta: undefined,
            riskFlags: [] as string[],
            milestonesDone: goal.milestones?.filter((m) => m.completedAt).length ?? 0,
            milestonesTotal: goal.milestones?.length ?? 0,
            badges: { habitsToday: undefined, nextTask: undefined, financeLink: goal.financeMode ?? null },
            nextAction: undefined,
          }
        : undefined,
    [goal, progressData?.displayCurrent, progressData?.displayTarget, progressData?.progressPercent],
  );
  const summary = goalSummary ?? fallbackSummary;

  if (!goal) {
    return null;
  }

  const progressPercent = Math.round((progressData?.progressPercent ?? summary?.progressPercent ?? 0) * 100);
  const currentDisplay = progressData?.displayCurrent ?? summary?.current;
  const targetDisplay = progressData?.displayTarget ?? summary?.target;
  const clampedProgress = Math.min(Math.max(progressPercent, 0), 100);
  const formatValue = useCallback(
    (value: number) => {
      if (goal.metricType === 'amount' && goal.currency) {
        const maxFraction = goal.currency === 'UZS' ? 0 : 2;
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: goal.currency,
          maximumFractionDigits: maxFraction,
        }).format(value);
      }
      if (goal.metricType === 'duration') {
        if (value >= 60) {
          return `${(value / 60).toFixed(1)} h`;
        }
        return `${Math.round(value)} min`;
      }
      if (goal.unit) {
        return `${Math.round(value * 100) / 100} ${goal.unit}`;
      }
      return `${Math.round(value * 100) / 100}`;
    },
    [goal.currency, goal.metricType, goal.unit],
  );

  const getGoalTypeIcon = (type: Goal['goalType']) => {
    switch (type) {
      case 'financial':
        return <DollarSign size={16} color="#10B981" />;
      case 'health':
        return <Heart size={16} color="#EF4444" />;
      case 'education':
        return <Target size={16} color="#3B82F6" />;
      case 'productivity':
        return <TrendingUp size={16} color="#8B5CF6" />;
      case 'personal':
        return <Users size={16} color="#F59E0B" />;
      default:
        return <Target size={16} color="#94A3B8" />;
    }
  };

  const getGoalTypeLabel = (type: Goal['goalType']) => {
    switch (type) {
      case 'financial':
        return 'Financial';
      case 'health':
        return 'Health';
      case 'education':
        return 'Education';
      case 'productivity':
        return 'Productivity';
      case 'personal':
        return 'Personal';
      default:
        return 'Other';
    }
  };

  const getPriorityColor = (priority?: 'urgent' | 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'urgent':
        return '#EF4444';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#3B82F6';
      case 'low':
        return '#6B7280';
      default:
        return '#94A3B8';
    }
  };

  const historyItems = useMemo(() => {
    if (!goal) return [];
    const checkInItems = (goal.checkIns ?? []).map((entry) => {
      const task = tasks.find((t) => t.id === entry.sourceId);
      const habit = habits.find((h) => h.id === entry.sourceId);
      const typeLabel =
        entry.sourceType === 'task' ? 'Task' : entry.sourceType === 'habit' ? 'Habit' : 'Manual';
      const date = entry.createdAt ?? (entry.dateKey ? `${entry.dateKey}T00:00:00.000Z` : undefined);
      const title = task?.title ?? habit?.title ?? entry.note ?? 'Manual check-in';
      return {
        id: entry.id,
        title,
        type: typeLabel,
        value: `${(entry.value ?? 0) > 0 ? '+' : ''}${formatValue(entry.value ?? 0)}`,
        date: date ? new Date(date) : new Date(),
      };
    });

    const taskItems = tasks
      .filter((t) => t.goalId === goal.id && t.status === 'completed')
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        type: 'Task',
        value: task.progressValue != null ? `+${formatValue(task.progressValue)}` : 'Completed',
        date: task.updatedAt ? new Date(task.updatedAt) : new Date(),
      }));

    const habitItems = habits
      .filter((habit) => habit.goalId === goal.id || habit.linkedGoalIds?.includes(goal.id))
      .flatMap((habit) => {
        const history = habit.completionHistory ?? {};
        return Object.entries(history)
          .filter(([, entry]) => (typeof entry === 'string' ? entry === 'done' : entry?.status === 'done'))
          .map(([dateKey]) => ({
            id: `habit-${habit.id}-${dateKey}`,
            title: habit.title,
            type: 'Habit',
            value: '+1',
            date: new Date(`${dateKey}T00:00:00.000Z`),
          }));
      });

    return [...checkInItems, ...taskItems, ...habitItems].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
  }, [formatValue, goal, habits, tasks]);

  const checkInPrompt = useMemo(() => {
    if (!goal) {
      return {
        title: 'Log progress',
        subtitle: 'Add how much you progressed today',
        placeholder: '0',
      };
    }
    if (goal.metricType === 'weight') {
      return {
        title: 'Log weight',
        subtitle: 'What is your current weight?',
        placeholder: `${goal.initialValue ?? goal.targetValue ?? 0}`,
      };
    }
    if (goal.metricType === 'duration') {
      return {
        title: 'Focus time',
        subtitle: 'How many minutes/hours did you focus?',
        placeholder: '45',
      };
    }
    if (goal.metricType === 'count') {
      return {
        title: 'Add progress',
        subtitle: 'How many units/pages did you complete?',
        placeholder: '10',
      };
    }
    return {
      title: 'Add progress',
      subtitle: 'How much did you move toward this goal?',
      placeholder: goal.unit ?? '0',
    };
  }, [goal]);

  const handleHabitToggle = (habitId: string, currentStatus?: 'done' | 'remaining') => {
    if (currentStatus === 'done') {
      // Already done, optionally allow un-checking (not implemented here)
      return;
    }
    logHabitCompletion(habitId, true, { date: new Date() });
  };

  const handleCheckInPress = () => {
    setCheckInNote('');
    setCheckInValue(goal?.metricType === 'weight' && goal?.initialValue ? goal.initialValue.toString() : '');
    setCheckInVisible(true);
  };

  const handleCheckInSubmit = () => {
    if (!goal || !checkInValue.trim()) return;

    const entered = parseFloat(checkInValue);
    if (!Number.isFinite(entered)) {
      Alert.alert('Invalid Input', 'Please enter a valid number');
      return;
    }

    const todayKey = new Date().toISOString().slice(0, 10);
    const hasTodayEntry = (goal.checkIns ?? []).some(
      (entry) => (entry.dateKey ?? entry.createdAt?.slice(0, 10)) === todayKey && entry.sourceType === 'manual',
    );
    if (hasTodayEntry) {
      Alert.alert('Already logged', 'You have already checked in for this goal today.');
      return;
    }

    const now = new Date().toISOString();
    const currentProgress = progressData?.progressValue ?? 0;
    let delta = entered;

    if (goal.metricType === 'weight') {
      const start = goal.initialValue ?? entered;
      const totalLost = Math.max(start - entered, 0);
      delta = Math.max(totalLost - currentProgress, 0);
    }

    if (delta <= 0) {
      Alert.alert('Nothing to add', 'Enter a value that moves this goal forward.');
      return;
    }

    addGoalCheckIn({
      goalId: goal.id,
      value: delta,
      note: checkInNote.trim() || undefined,
      sourceType: 'manual',
      dateKey: todayKey,
      createdAt: now,
    });

    setCheckInVisible(false);
    setCheckInValue('');
    setCheckInNote('');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalHeaderTitle}>Goal details</Text>
          <View style={styles.modalHeaderActions}>
            <Pressable onPress={() => setMenuOpen((prev) => !prev)} style={styles.menuTrigger} accessibilityRole="button">
              <MoreVertical size={20} color="#E2E8F0" />
            </Pressable>
            <Pressable onPress={() => router.back()} style={styles.modalHeaderAction} accessibilityRole="button">
              <X size={20} color="#E2E8F0" />
            </Pressable>
          </View>
        </View>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{goal.title}</Text>
            <View style={styles.badges}>
              {/* Type Badge */}
              <View style={styles.typeBadge}>
                {getGoalTypeIcon(goal.goalType)}
                <Text style={styles.typeBadgeText}>{getGoalTypeLabel(goal.goalType)}</Text>
              </View>

              {/* Risk Flags */}
              {(summary?.riskFlags?.length ?? 0) > 0 && (
                <View style={styles.riskBadge}>
                  <AlertTriangle size={14} color="#EF4444" />
                  <Text style={styles.riskBadgeText}>{summary?.riskFlags?.length ?? 0} risk(s)</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
          {/* Progress Ring */}
          <View style={styles.progressSection}>
            <View style={styles.progressRing}>
              <Text style={styles.progressPercent}>{clampedProgress}%</Text>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Progress</Text>
              {currentDisplay !== undefined && targetDisplay !== undefined && (
                <Text style={styles.progressValues}>
                  {formatValue(currentDisplay)}
                  <Text style={styles.progressValuesMuted}> / {formatValue(targetDisplay)}</Text>
                </Text>
              )}
              <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceMuted }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${clampedProgress}%`,
                      backgroundColor: clampedProgress >= 80 ? theme.colors.success : theme.colors.primary,
                    },
                  ]}
                />
              </View>
              {summary?.deadline && (
                <View style={styles.deadlineRow}>
                  <Calendar size={14} color="#94A3B8" />
                  <Text style={styles.deadlineText}>Due: {new Date(summary.deadline).toLocaleDateString()}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Check In Button */}
          {goal.metricType !== 'none' && (
            <Pressable
              style={styles.checkInButton}
              onPress={handleCheckInPress}
              accessibilityRole="button"
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.checkInButtonText}>Check In Today</Text>
            </Pressable>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{linkedHabits.length}</Text>
              <Text style={styles.statLabel}>Habits</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{linkedTasks.length}</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {summary?.milestonesDone ?? 0}/{summary?.milestonesTotal ?? 0}
              </Text>
              <Text style={styles.statLabel}>Milestones</Text>
            </View>
          </View>

          {/* Metric Panel */}
          {goal.goalType === 'financial' && (linkedBudget || linkedDebt) && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Financial Tracking</Text>

              {/* Budget Card */}
              {linkedBudget && (
                <AdaptiveGlassView style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <View style={styles.metricTitleRow}>
                      <PieChart size={20} color="#3B82F6" />
                      <Text style={styles.metricTitle}>{linkedBudget.name}</Text>
                    </View>
                    <Text style={styles.metricType}>Budget</Text>
                  </View>
                  <View style={styles.metricBody}>
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Spent</Text>
                      <Text style={styles.metricValue}>
                        {linkedBudget.spentAmount.toFixed(2)} {linkedBudget.currency}
                      </Text>
                    </View>
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Limit</Text>
                      <Text style={styles.metricValue}>
                        {linkedBudget.limitAmount.toFixed(2)} {linkedBudget.currency}
                      </Text>
                    </View>
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Remaining</Text>
                      <Text
                        style={[
                          styles.metricValue,
                          { color: linkedBudget.remainingAmount < 0 ? '#EF4444' : '#10B981' },
                        ]}
                      >
                        {linkedBudget.remainingAmount.toFixed(2)} {linkedBudget.currency}
                      </Text>
                    </View>
                    {/* Progress Bar */}
                    <View style={styles.metricProgressTrack}>
                      <View
                        style={[
                          styles.metricProgressFill,
                          {
                            width: `${Math.min(linkedBudget.percentUsed * 100, 100)}%`,
                            backgroundColor: linkedBudget.percentUsed >= 1 ? '#EF4444' : '#3B82F6',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.metricProgressLabel}>
                      {Math.round(linkedBudget.percentUsed * 100)}% used
                    </Text>
                  </View>
                </AdaptiveGlassView>
              )}

              {/* Debt Card */}
              {linkedDebt && (
                <AdaptiveGlassView style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <View style={styles.metricTitleRow}>
                      <CreditCard size={20} color="#F59E0B" />
                      <Text style={styles.metricTitle}>{linkedDebt.counterpartyName}</Text>
                    </View>
                    <Text style={styles.metricType}>Debt</Text>
                  </View>
                  <View style={styles.metricBody}>
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Direction</Text>
                      <Text style={styles.metricValue}>
                        {linkedDebt.direction === 'i_owe' ? 'I owe' : 'They owe me'}
                      </Text>
                    </View>
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Principal</Text>
                      <Text style={styles.metricValue}>
                        {linkedDebt.principalAmount.toFixed(2)} {linkedDebt.principalCurrency}
                      </Text>
                    </View>
                    {linkedDebt.dueDate && (
                      <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Due Date</Text>
                        <Text style={styles.metricValue}>
                          {new Date(linkedDebt.dueDate).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                    {linkedDebt.description && (
                      <Text style={styles.metricDescription}>{linkedDebt.description}</Text>
                    )}
                  </View>
                </AdaptiveGlassView>
              )}
            </View>
          )}

          {/* Milestones */}
          {goal.milestones && goal.milestones.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Milestones</Text>
              <View style={styles.milestonesGrid}>
                {goal.milestones.map((milestone, index) => (
                  <View key={index} style={styles.milestoneRow}>
                    {milestone.completedAt ? (
                      <CheckCircle2 size={18} color="#10B981" />
                    ) : (
                      <Circle size={18} color="#6B7280" />
                    )}
                    <View style={styles.milestoneContent}>
                      <Text style={styles.milestoneLabel}>{milestone.title}</Text>
                      <Text style={styles.milestoneDate}>Target: {Math.round(milestone.targetPercent)}%</Text>
                      {milestone.completedAt && (
                        <Text style={styles.milestoneDate}>
                          Completed: {new Date(milestone.completedAt).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {historyItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Activity</Text>
              <View style={styles.historyList}>
                {historyItems.map((item) => (
                  <View key={item.id} style={styles.historyRow}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyType}>{item.type}</Text>
                      <Text style={styles.historyDate}>{item.date.toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.historyTitle}>{item.title}</Text>
                    <Text style={styles.historyValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Today's Habits */}
          {linkedHabitSummaries.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Today&lsquo;s Habits</Text>
              <View style={styles.habitsGrid}>
                {linkedHabitSummaries.map((habitSummary) => (
                  <Pressable
                    key={habitSummary.habitId}
                    style={styles.habitRow}
                    onPress={() => handleHabitToggle(habitSummary.habitId, habitSummary.todayStatus)}
                  >
                    <View style={styles.habitLeft}>
                      {habitSummary.todayStatus === 'done' ? (
                        <CheckCircle2 size={20} color="#10B981" />
                      ) : (
                        <Circle size={20} color="#6B7280" />
                      )}
                      <View style={styles.habitInfo}>
                        <Text style={styles.habitTitle}>{habitSummary.title}</Text>
                        <Text style={styles.habitStreak}>Streak: {habitSummary.streakCurrent} days</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Next Task */}
          {nextTask && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Next Task</Text>
              <AdaptiveGlassView style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskTitle}>{nextTask.title}</Text>
                  {nextTask.priority && (
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(nextTask.priority) }]}>
                      <Text style={styles.priorityText}>{nextTask.priority.toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                {nextTask.dueDate && (
                  <View style={styles.taskFooter}>
                    <Calendar size={14} color="#94A3B8" />
                    <Text style={styles.taskDueDate}>Due: {new Date(nextTask.dueDate).toLocaleDateString()}</Text>
                  </View>
                )}
              </AdaptiveGlassView>
            </View>
          )}

          {/* AI Tip (Placeholder) */}
          <AdaptiveGlassView
            style={[
              styles.tipCard,
              {
                borderColor: 'rgba(255,255,255,0.08)',
                backgroundColor: 'rgba(255,255,255,0.05)',
              },
            ]}
          >
            <View style={styles.tipContent}>
              <Lightbulb size={18} color="#FACC15" />
              <Text style={styles.tipText}>
                Keep up the momentum! You&rsquo;re making great progress on this goal.{' '}
                <Text style={styles.tipHighlight}>Complete 1 more task today to stay on track.</Text>
              </Text>
            </View>
          </AdaptiveGlassView>
        </ScrollView>

        {/* Check-In Modal */}
        <Modal
          visible={checkInVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCheckInVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setCheckInVisible(false)}
          >
            <Pressable
              style={[styles.modalContent, { backgroundColor: theme.colors.card }]}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                {checkInPrompt.title}
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                {checkInPrompt.subtitle}
              </Text>

              <TextInput
                style={[styles.modalInput, {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                }]}
                value={checkInValue}
                onChangeText={setCheckInValue}
                keyboardType="decimal-pad"
                placeholder={`e.g., ${checkInPrompt.placeholder}`}
                placeholderTextColor={theme.colors.textMuted}
                autoFocus
              />

              <TextInput
                style={[styles.modalInput, {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                }]}
                value={checkInNote}
                onChangeText={setCheckInNote}
                placeholder="Note (optional)"
                placeholderTextColor={theme.colors.textMuted}
              />

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: theme.colors.border }]}
                  onPress={() => setCheckInVisible(false)}
                >
                  <Text style={[styles.modalButtonTextSecondary, { color: theme.colors.textSecondary }]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleCheckInSubmit}
                >
                  <Text style={styles.modalButtonTextPrimary}>
                    Update
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {menuOpen && (
          <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
            <Pressable
              style={[
                styles.menuCard,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border, marginTop: insets.top + 8 },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  router.push(`/(modals)/planner/goal?id=${goal.id}`);
                }}
              >
                <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>Edit Goal</Text>
              </Pressable>
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  archiveGoal(goal.id);
                }}
              >
                <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>Delete Goal</Text>
              </Pressable>
              {goal.status === 'archived' && (
                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuOpen(false);
                    resumeGoal(goal.id);
                  }}
                >
                  <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>Restore Goal</Text>
                </Pressable>
              )}
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  completeGoal(goal.id);
                }}
              >
                <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>Mark Complete</Text>
              </Pressable>
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  router.push(`/(modals)/planner/task?goalId=${goal.id}`);
                }}
              >
                <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>Add Task for Goal</Text>
              </Pressable>
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  router.push(`/(modals)/planner/habit?goalId=${goal.id}`);
                }}
              >
                <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>Add Habit for Goal</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.2,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 16,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.2,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeaderAction: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  menuTrigger: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  menuCard: {
    position: 'absolute',
    right: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  scrollContent: {
    paddingBottom: 24,
    gap: 20,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressTrack: {
    height: 8,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.1)',
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: '800',
    color: '#C7D2FE',
  },
  progressInfo: {
    flex: 1,
    gap: 4,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  progressValues: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  progressValuesMuted: {
    color: 'rgba(248,250,252,0.6)',
    fontSize: 14,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deadlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#C7D2FE',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  section: {
    gap: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F3F4F6',
    letterSpacing: 0.3,
  },
  milestonesGrid: {
    gap: 10,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  milestoneContent: {
    flex: 1,
    gap: 4,
  },
  milestoneLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  milestoneDate: {
    fontSize: 11,
    fontWeight: '500',
    color: '#10B981',
  },
  habitsGrid: {
    gap: 10,
  },
  habitRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  habitInfo: {
    flex: 1,
    gap: 4,
  },
  habitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  habitStreak: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  taskCard: {
    padding: 14,
    borderRadius: 12,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  priorityBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskDueDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tipCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  tipContent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    color: '#F1F5F9',
  },
  tipHighlight: {
    color: '#FACC15',
    fontWeight: '700',
  },
  // Metric Panel Styles
  metricCard: {
    padding: 16,
    borderRadius: 14,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  metricType: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricBody: {
    gap: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  metricProgressTrack: {
    height: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginTop: 4,
  },
  metricProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricProgressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  metricDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 4,
  },
  // Check-In Button
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#8B5CF6',
  },
  checkInButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Check-In Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  modalButtonPrimary: {
    backgroundColor: '#8B5CF6',
  },
  modalButtonTextSecondary: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyList: {
    gap: 12,
  },
  historyRow: {
    padding: 12,
    borderRadius: 12,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1F2937',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A5B4FC',
  },
  historyDate: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  historyValue: {
    fontSize: 14,
    color: '#A7F3D0',
    fontWeight: '700',
  },
});
