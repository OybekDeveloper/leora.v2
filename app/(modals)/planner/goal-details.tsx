// app/(modals)/goal-details.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Modal,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
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
  Trash2,
  Users,
  X,
  MoreVertical,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { BudgetCreateInline } from '@/components/finance/BudgetCreateInline';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useGoalFinanceLink } from '@/hooks/useGoalFinanceLink';
import { useGoalProgress } from '@/hooks/useGoalProgress';
import GoalActionsDropdown, { type GoalDropdownAction } from '@/components/planner/goals/GoalActionsDropdown';
import { useAppTheme } from '@/constants/theme';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { usePlannerAggregatesStore } from '@/stores/usePlannerAggregatesStore';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useFinancePreferencesStore } from '@/stores/useFinancePreferencesStore';
import { createGoalFinanceTransaction } from '@/services/finance/financeAutoTracking';
import { plannerEventBus } from '@/events/plannerEventBus';
import type { Goal } from '@/domain/planner/types';
import type { BudgetFlowType } from '@/domain/finance/types';
import { calculateGoalProgress } from '@/utils/goalProgress';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function GoalDetailsModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ goalId?: string }>();
  const baseCurrency = useFinancePreferencesStore((state) => state.baseCurrency);

  const goals = usePlannerDomainStore((state) => state.goals);
  const tasks = usePlannerDomainStore((state) => state.tasks);
  const habits = usePlannerDomainStore((state) => state.habits);
  const goalSummaries = usePlannerAggregatesStore((state) => state.goalSummaries);
  const habitSummaries = usePlannerAggregatesStore((state) => state.habitSummaries);
  const logHabitCompletion = usePlannerDomainStore((state) => state.logHabitCompletion);
  const completeTask = usePlannerDomainStore((state) => state.completeTask);
  const addGoalCheckIn = usePlannerDomainStore((state) => state.addGoalCheckIn);
  const archiveGoal = usePlannerDomainStore((state) => state.archiveGoal);
  const completeGoal = usePlannerDomainStore((state) => state.completeGoal);
  const resumeGoal = usePlannerDomainStore((state) => state.resumeGoal);
  const restartGoal = usePlannerDomainStore((state) => state.restartGoal);
  const deleteGoalPermanently = usePlannerDomainStore((state) => state.deleteGoalPermanently);

  // Check-in modal state
  const [checkInVisible, setCheckInVisible] = useState(false);
  const [checkInValue, setCheckInValue] = useState('');
  const [checkInNote, setCheckInNote] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [budgetPromptVisible, setBudgetPromptVisible] = useState(false);
  const [pendingProgress, setPendingProgress] = useState<number | null>(null);
  const [pendingNote, setPendingNote] = useState<string | undefined>(undefined);
  const [showInlineBudget, setShowInlineBudget] = useState(false);
  const [completeConfirmVisible, setCompleteConfirmVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteForeverVisible, setDeleteForeverVisible] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Finance data
  const debts = useFinanceDomainStore((state) => state.debts);
  const scrollRef = useRef<ScrollView | null>(null);
  const sectionPositions = useRef<Partial<Record<'tasks' | 'habits' | 'activity', number>>>({});

  const goal = useMemo(() => {
    if (!params.goalId) return undefined;
    return goals.find((g) => g.id === params.goalId);
  }, [goals, params.goalId]);

  const { accounts, linkedBudget, availableBudgets, createAndLinkBudget, linkExistingBudget } = useGoalFinanceLink(goal);
  const { logProgress } = useGoalProgress(goal);

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
  const linkedDebt = useMemo(() => {
    if (!goal) return undefined;
    const direct = goal.linkedDebtId ? debts.find((d) => d.id === goal.linkedDebtId) : undefined;
    return direct ?? debts.find((d) => d.linkedGoalId === goal.id);
  }, [goal, debts]);

  useEffect(() => {
    if (!goal) {
      router.back();
    }
  }, [goal, router]);

  useEffect(() => {
    if (!selectedAccountId && accounts[0]) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

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

  // Use displayCurrent/displayTarget to account for initialValue properly
  const numericCurrent = Number(progressData?.displayCurrent ?? summary?.current ?? 0);
  const numericTarget = Number(progressData?.displayTarget ?? summary?.target ?? 0);
  const currentDisplay = numericCurrent;
  const targetDisplay = numericTarget;

  const ratioBase =
    numericTarget > 0 && Number.isFinite(numericTarget)
      ? numericCurrent / numericTarget
      : progressData?.progressPercent ?? summary?.progressPercent ?? 0;
  const progressPercent = Math.round(Math.min(Math.max(ratioBase, 0), 1) * 100);
  const clampedProgress = Math.min(Math.max(progressPercent, 0), 100);
  const isMoneyGoal = goal.goalType === 'financial' || goal.metricType === 'amount';
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
        entry.sourceType === 'task'
          ? 'Task'
          : entry.sourceType === 'habit'
            ? 'Habit'
            : entry.sourceType === 'finance'
              ? 'Finance'
              : 'Manual';
      const date = entry.createdAt ?? (entry.dateKey ? `${entry.dateKey}T00:00:00.000Z` : undefined);
      const title =
        task?.title ??
        habit?.title ??
        entry.note ??
        (entry.sourceType === 'finance' ? 'Finance update' : 'Manual check-in');
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

  const scrollToSection = useCallback((key: 'tasks' | 'habits' | 'activity') => {
    const y = sectionPositions.current[key];
    if (scrollRef.current && y != null && Number.isFinite(y)) {
      scrollRef.current.scrollTo({ y, animated: true });
    }
  }, []);

  const handleCheckInPress = () => {
    setCheckInNote('');
    setCheckInValue(goal?.metricType === 'weight' && goal?.initialValue ? goal.initialValue.toString() : '');
    setCheckInVisible(true);
  };

  const stepperSteps = useMemo(() => {
    if (!goal) return [];
    if (goal.metricType === 'none') return [];
    if (goal.metricType === 'amount') return [100, 1000, 5000];
    if (goal.metricType === 'weight') return [0.5, 1, 5];
    return [1, 5, 10];
  }, [goal]);

  const applyProgress = useCallback(
    (value: number, note?: string) => {
      if (!goal) return;
      const result = logProgress(value, {
        note,
        budgetId: linkedBudget?.id,
        accountId: selectedAccountId ?? accounts[0]?.id,
        debtId: goal?.linkedDebtId,
        plannedAmount: goal?.targetValue,
        paidAmount: value,
        dateKey: new Date().toISOString().slice(0, 10),
      });
      if (result.status === 'needs-budget') {
        setPendingProgress(value);
        setPendingNote(note);
        setBudgetPromptVisible(true);
        return;
      }
      setPendingProgress(null);
      setPendingNote(undefined);
      setBudgetPromptVisible(false);
      setCheckInVisible(false);
      setCheckInValue('');
      setCheckInNote('');
    },
    [accounts, goal, linkedBudget?.id, logProgress, selectedAccountId],
  );

  const handleStepperIncrement = useCallback(
    (value: number) => {
      applyProgress(value, 'Quick progress');
    },
    [applyProgress],
  );

  const handleCheckInSubmit = () => {
    if (!goal || !checkInValue.trim()) return;

    const entered = parseFloat(checkInValue);
    if (!Number.isFinite(entered)) {
      Alert.alert('Invalid Input', 'Please enter a valid number');
      return;
    }

    const todayKey = new Date().toISOString().slice(0, 10);
    if (!isMoneyGoal) {
      const hasTodayEntry = (goal.checkIns ?? []).some(
        (entry) => (entry.dateKey ?? entry.createdAt?.slice(0, 10)) === todayKey && entry.sourceType === 'manual',
      );
      if (hasTodayEntry) {
        Alert.alert('Already logged', 'You have already checked in for this goal today.');
        return;
      }
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

    applyProgress(delta, checkInNote.trim() || undefined);
  };

  const handleBudgetPick = useCallback(
    (budgetId: string) => {
      if (!goal || pendingProgress == null) return;
      if (budgetId) {
        linkExistingBudget(budgetId);
      }
      const result = logProgress(pendingProgress, {
        budgetId,
        note: pendingNote,
        accountId: selectedAccountId ?? accounts[0]?.id,
        debtId: goal?.linkedDebtId,
        plannedAmount: goal?.targetValue,
        paidAmount: pendingProgress,
        dateKey: new Date().toISOString().slice(0, 10),
      });
      if (result.status === 'logged') {
        setPendingProgress(null);
        setPendingNote(undefined);
        setBudgetPromptVisible(false);
        setShowInlineBudget(false);
        setCheckInVisible(false);
        setCheckInValue('');
        setCheckInNote('');
      }
    },
    [
      accounts,
      goal,
      linkExistingBudget,
      logProgress,
      pendingNote,
      pendingProgress,
      selectedAccountId,
    ],
  );

  const handleBudgetCreated = useCallback(
    (payload: { name: string; amount: number; currency: string; transactionType: BudgetFlowType }) => {
      const created = createAndLinkBudget({
        ...payload,
        currency: payload.currency || goal?.currency || baseCurrency,
      });
      handleBudgetPick(created.id);
    },
    [baseCurrency, createAndLinkBudget, goal?.currency, handleBudgetPick],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!goal) return;
    archiveGoal(goal.id);
    setDeleteConfirmVisible(false);
    setMenuOpen(false);
  }, [archiveGoal, goal]);

  const handleConfirmComplete = useCallback(() => {
    if (!goal) return;
    const budgetId = linkedBudget?.id ?? goal.linkedBudgetId;
    const completionAmount = goal.targetValue ?? progressData?.displayTarget ?? 0;
    if (isMoneyGoal && budgetId && completionAmount > 0) {
      createGoalFinanceTransaction({
        goal,
        amount: completionAmount,
        budgetId,
        note: 'Goal completed',
        eventType: 'goal-completed',
      });
    }
    linkedTasks.forEach((task) => {
      if (task.status !== 'completed') {
        completeTask(task.id);
      }
    });
    linkedHabits.forEach((habit) => {
      logHabitCompletion(habit.id, true, { date: new Date() });
    });
    addGoalCheckIn({
      goalId: goal.id,
      value: 0,
      note: 'Goal completed',
      sourceType: 'manual',
      createdAt: new Date().toISOString(),
    });
    completeGoal(goal.id, new Date().toISOString());
    setCompleteConfirmVisible(false);
    setMenuOpen(false);
  }, [
    addGoalCheckIn,
    completeGoal,
    completeTask,
    goal,
    isMoneyGoal,
    linkedBudget?.id,
    linkedHabits,
    linkedTasks,
    logHabitCompletion,
    progressData?.displayTarget,
  ]);

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

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
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

          {stepperSteps.length > 0 && (
            <View style={styles.stepperRow}>
              {stepperSteps.map((step) => (
                <Pressable
                  key={step}
                  style={styles.stepperButton}
                  onPress={() => handleStepperIncrement(step)}
                  accessibilityRole="button"
                >
                  <Text style={styles.stepperText}>+{step}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Check In Button */}
          {goal.status === 'archived' ? (
            <Pressable
              style={styles.recoverButton}
              onPress={() => resumeGoal(goal.id)}
              accessibilityRole="button"
            >
              <Text style={styles.recoverButtonText}>Recover Goal</Text>
            </Pressable>
          ) : goal.status === 'completed' ? (
            <Pressable
              style={styles.recoverButton}
              onPress={() => restartGoal(goal.id)}
              accessibilityRole="button"
            >
              <Text style={styles.recoverButtonText}>Restart Goal</Text>
            </Pressable>
          ) : (
            <>
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
              <Pressable
                style={styles.deleteButton}
                onPress={() => setDeleteConfirmVisible(true)}
                accessibilityRole="button"
              >
                <Trash2 size={18} color="#F87171" />
                <Text style={styles.deleteButtonText}>Delete Goal</Text>
              </Pressable>
            </>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <Pressable style={styles.statCard} onPress={() => scrollToSection('tasks')}>
              <Text style={styles.statValue}>{linkedTasks.length}</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </Pressable>
            <Pressable style={styles.statCard} onPress={() => scrollToSection('habits')}>
              <Text style={styles.statValue}>{linkedHabits.length}</Text>
              <Text style={styles.statLabel}>Habits</Text>
            </Pressable>
            <Pressable style={styles.statCard} onPress={() => scrollToSection('activity')}>
              <Text style={styles.statValue}>{historyItems.length}</Text>
              <Text style={styles.statLabel}>Activity</Text>
            </Pressable>
          </View>

          {/* Metric Panel */}
          {(goal.goalType === 'financial' || goal.metricType === 'amount') && (linkedBudget || linkedDebt) && (
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

          {/* Tasks */}
          {goal && (
            <View
              style={styles.section}
              onLayout={(e) => {
                sectionPositions.current.tasks = e.nativeEvent.layout.y;
              }}
            >
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Tasks</Text>
                <Pressable
                  style={styles.newStepButton}
                  onPress={() => router.push(`/(modals)/planner/task?goalId=${goal.id}`)}
                >
                  <Plus size={14} color={theme.colors.primary} />
                  <Text style={[styles.newStepButtonText, { color: theme.colors.primary }]}>New Step</Text>
                </Pressable>
              </View>
              {nextTask && (
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
              )}
              {linkedTasks.length > 0 ? (
                <View style={styles.taskList}>
                  {linkedTasks.slice(0, 3).map((task) => (
                    <View key={task.id} style={styles.taskListRow}>
                      <Text style={styles.taskListTitle}>{task.title}</Text>
                      {task.dueDate && (
                        <Text style={styles.taskListMeta}>{new Date(task.dueDate).toLocaleDateString()}</Text>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.emptyInlineText, { color: theme.colors.textMuted }]}>No steps yet</Text>
              )}
            </View>
          )}

          {/* Today's Habits */}
          {linkedHabitSummaries.length > 0 && (
            <View
              style={styles.section}
              onLayout={(e) => {
                sectionPositions.current.habits = e.nativeEvent.layout.y;
              }}
            >
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

          {/* Activity */}
          {historyItems.length > 0 && (
            <View
              style={styles.section}
              onLayout={(e) => {
                sectionPositions.current.activity = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.sectionHeading}>Activity</Text>
              <View style={styles.historyList}>
                {(activityExpanded ? historyItems : historyItems.slice(0, 5)).map((item) => (
                  <View key={item.id} style={styles.historyRow}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyType}>{item.type}</Text>
                      <Text style={styles.historyDate}>{item.date.toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.historyTitle}>{item.title}</Text>
                    <Text style={styles.historyValue}>{item.value}</Text>
                  </View>
                ))}
                {!activityExpanded && historyItems.length > 5 && (
                  <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.35)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.activityFade}
                    pointerEvents="none"
                  />
                )}
              </View>
              {historyItems.length > 5 && (
                <Pressable
                  style={styles.moreButton}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setActivityExpanded((prev) => !prev);
                  }}
                >
                  <Text style={styles.moreButtonText}>
                    {activityExpanded ? 'Show Less' : 'More'}
                  </Text>
                </Pressable>
              )}
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

              {isMoneyGoal && accounts.length > 0 && (
                <View style={styles.modalAccountSection}>
                  <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                    Choose account
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.modalAccountChips}
                  >
                    {accounts.map((account) => {
                      const active = (selectedAccountId ?? accounts[0]?.id) === account.id;
                      return (
                        <Pressable
                          key={account.id}
                          onPress={() => setSelectedAccountId(account.id)}
                          style={({ pressed }) => [
                            styles.modalAccountChip,
                            active && styles.modalAccountChipActive,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text style={[styles.modalAccountLabel, { color: theme.colors.textPrimary }]}>
                            {account.name}
                          </Text>
                          <Text style={[styles.modalAccountSub, { color: theme.colors.textSecondary }]}>
                            {account.currency} · {account.currentBalance.toFixed(2)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

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

        <Modal
          visible={budgetPromptVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setBudgetPromptVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setBudgetPromptVisible(false)}>
            <Pressable
              style={[styles.modalContent, { backgroundColor: theme.colors.card }]}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Connect a Budget</Text>
              <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                To track this money goal, connect a Budget
              </Text>

              <View style={styles.budgetOptions}>
                {availableBudgets.length > 0 ? (
                  availableBudgets.map((budget) => (
                    <Pressable
                      key={budget.id}
                      style={[
                        styles.budgetOption,
                        budget.id === linkedBudget?.id && { borderColor: theme.colors.primary },
                        { borderColor: theme.colors.border },
                      ]}
                      onPress={() => handleBudgetPick(budget.id)}
                    >
                      <Text style={[styles.budgetOptionTitle, { color: theme.colors.textPrimary }]}>
                        {budget.name}
                      </Text>
                      <Text style={[styles.budgetOptionSub, { color: theme.colors.textSecondary }]}>
                        {budget.currency} {budget.limitAmount.toFixed(0)}
                      </Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={[styles.emptyInlineText, { color: theme.colors.textMuted }]}>
                    No budgets yet
                  </Text>
                )}
              </View>

              {showInlineBudget ? (
                <BudgetCreateInline
                  defaultName={`Budget · ${goal.title}`}
                  defaultCurrency={goal.currency ?? baseCurrency}
                  defaultTransactionType={goal.financeMode === 'save' ? 'income' : 'expense'}
                  onSubmit={handleBudgetCreated}
                  onCancel={() => setShowInlineBudget(false)}
                />
              ) : (
                <Pressable
                  style={styles.modalButton}
                  onPress={() => setShowInlineBudget(true)}
                >
                  <Text style={[styles.modalButtonTextSecondary, { color: theme.colors.textPrimary }]}>
                    Create Budget
                  </Text>
                </Pressable>
              )}

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: theme.colors.border }]}
                  onPress={() => {
                    setBudgetPromptVisible(false);
                    setPendingProgress(null);
                    setPendingNote(undefined);
                  }}
                >
                  <Text style={[styles.modalButtonTextSecondary, { color: theme.colors.textSecondary }]}>
                    Cancel
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={deleteConfirmVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDeleteConfirmVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setDeleteConfirmVisible(false)}>
            <Pressable
              style={[styles.modalContent, { backgroundColor: theme.colors.card }]}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Are you sure?</Text>
              <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                This goal will be moved to Trash.
              </Text>
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: theme.colors.border }]}
                  onPress={() => setDeleteConfirmVisible(false)}
                >
                  <Text style={[styles.modalButtonTextSecondary, { color: theme.colors.textSecondary }]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleConfirmDelete}
                >
                  <Text style={styles.modalButtonTextPrimary}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={deleteForeverVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDeleteForeverVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setDeleteForeverVisible(false)}>
            <Pressable
              style={[styles.modalContent, { backgroundColor: theme.colors.card }]}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Delete permanently?</Text>
              <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                This goal will be removed and cannot be recovered.
              </Text>
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: theme.colors.border }]}
                  onPress={() => setDeleteForeverVisible(false)}
                >
                  <Text style={[styles.modalButtonTextSecondary, { color: theme.colors.textSecondary }]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => {
                    deleteGoalPermanently(goal.id);
                    setDeleteForeverVisible(false);
                    router.back();
                  }}
                >
                  <Text style={styles.modalButtonTextPrimary}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={completeConfirmVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCompleteConfirmVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setCompleteConfirmVisible(false)}>
            <Pressable
              style={[styles.modalContent, { backgroundColor: theme.colors.card }]}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                Are you sure you want to complete this goal?
              </Text>
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: theme.colors.border }]}
                  onPress={() => setCompleteConfirmVisible(false)}
                >
                  <Text style={[styles.modalButtonTextSecondary, { color: theme.colors.textSecondary }]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleConfirmComplete}
                >
                  <Text style={styles.modalButtonTextPrimary}>
                    Complete
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <GoalActionsDropdown
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          anchorStyle={{ marginTop: insets.top + 8, right: 12 }}
          actions={[
            { label: 'Edit Goal', onPress: () => router.push(`/(modals)/planner/goal?id=${goal.id}`) },
            goal.status === 'archived'
              ? { label: 'Restore Goal', onPress: () => resumeGoal(goal.id) }
              : { label: 'Delete Goal', destructive: true, onPress: () => setDeleteConfirmVisible(true) },
            goal.status === 'archived'
              ? { label: 'Delete Permanently', destructive: true, onPress: () => setDeleteForeverVisible(true) }
              : null,
            { label: 'Mark Complete', onPress: () => setCompleteConfirmVisible(true) },
            { label: 'Add Task for Goal', onPress: () => router.push(`/(modals)/planner/task?goalId=${goal.id}`) },
            { label: 'Add Habit for Goal', onPress: () => router.push(`/(modals)/planner/habit?goalId=${goal.id}`) },
          ].filter(Boolean) as GoalDropdownAction[]}
        />
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
  taskList: {
    marginTop: 10,
    gap: 8,
  },
  taskListRow: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1F2937',
  },
  taskListTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  taskListMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#9CA3AF',
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
  stepperRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  stepperButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#0EA5E9',
  },
  stepperText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
  modalAccountSection: {
    gap: 8,
  },
  modalAccountChips: {
    flexDirection: 'row',
    gap: 10,
  },
  modalAccountChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30303a',
  },
  modalAccountChipActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
  modalAccountLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalAccountSub: {
    fontSize: 12,
    fontWeight: '500',
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
    position: 'relative',
  },
  activityFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 40,
    borderRadius: 12,
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FCA5A5',
    marginTop: 12,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F87171',
  },
  recoverButton: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    borderColor: '#10B981',
    marginBottom: 10,
  },
  recoverButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  newStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1F2937',
  },
  newStepButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyInlineText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  budgetOptions: {
    gap: 8,
  },
  budgetOption: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
  },
  budgetOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  budgetOptionSub: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  moreButton: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 4,
  },
  moreButtonText: {
    color: '#38BDF8',
    fontWeight: '700',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
