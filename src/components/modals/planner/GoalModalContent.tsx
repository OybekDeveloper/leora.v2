import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useShallow } from 'zustand/react/shallow';
import { useRouter } from 'expo-router';
import {
  Target,
  BarChart3,
  Calendar as CalendarIcon,
  Link,
  DollarSign,
  Heart,
  BookOpen,
  Briefcase,
  Banknote,
  ShoppingBag,
  CreditCard,
  Hash,
  Timer,
  Scale,
  Settings,
  Trash2,
  PlusCircle,
  Circle,
  CircleDot,
} from 'lucide-react-native';

import { FlashList as FlashListBase } from '@shopify/flash-list';
import { StepIndicator } from '@/components/modals/StepIndicator';
import { SmartHint } from '@/components/modals/SmartHint';
import { useLocalization } from '@/localization/useLocalization';

// Cast FlashList to avoid TypeScript generic inference issues
const FlashList = FlashListBase as any;
import { useGoalModalContentLocalization } from '@/localization/planner/goalModalContent';
import type { FinanceMode, GoalType, MetricKind } from '@/domain/planner/types';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import {
  AVAILABLE_FINANCE_CURRENCIES,
  type FinanceCurrency,
  useFinancePreferencesStore,
} from '@/stores/useFinancePreferencesStore';
import { createThemedStyles, useAppTheme } from '@/constants/theme';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { formatNumberWithSpaces, parseSpacedNumber } from '@/utils/formatNumber';

// Wizard Step Definition
type WizardStep = {
  id: number;
  key: 'what' | 'measure' | 'when' | 'connect';
  label: string;
  icon: string;
};

// Form Data Types
type GoalFormData = {
  title: string;
  goalType: GoalType;
  description: string;
  metricKind: MetricKind;
  financeMode?: FinanceMode;
  currency?: FinanceCurrency;
  unit?: string;
  currentValue: number;
  targetValue: number;
  startDate?: Date;
  targetDate?: Date;
  milestones: Array<{
    id: string;
    title: string;
    percent: number;
    dueDate?: Date;
  }>;
  linkedHabitIds: string[];
  linkedTaskIds: string[];
  linkedBudgetId?: string;
  linkedDebtId?: string;
};

type MilestoneFormValue = {
  id: string;
  title: string;
  percent: number;
  dueDate?: Date;
};

type DatePickerTarget = { type: 'start' } | { type: 'due' } | { type: 'milestone'; id: string };

const parseNumericInput = (value: string) => {
  // Use parseSpacedNumber to handle formatted input with spaces
  return parseSpacedNumber(value);
};

const formatNumericInput = (value: number): string => {
  if (value === 0) return '';
  return formatNumberWithSpaces(value);
};

const generateId = () => Math.random().toString(36).substring(2, 15);

const addMonths = (date: Date, months: number) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const addYears = (date: Date, years: number) => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

type Props = {
  goalId?: string;
};

const renderIcon = (iconId: string, size: number, color: string) => {
  switch (iconId) {
    case 'target':
      return <Target size={size} color={color} />;
    case 'chart':
      return <BarChart3 size={size} color={color} />;
    case 'calendar':
      return <CalendarIcon size={size} color={color} />;
    case 'link':
      return <Link size={size} color={color} />;
    case 'dollar':
      return <DollarSign size={size} color={color} />;
    case 'heart':
      return <Heart size={size} color={color} />;
    case 'book':
      return <BookOpen size={size} color={color} />;
    case 'briefcase':
      return <Briefcase size={size} color={color} />;
    case 'banknote':
      return <Banknote size={size} color={color} />;
    case 'shopping':
      return <ShoppingBag size={size} color={color} />;
    case 'credit':
      return <CreditCard size={size} color={color} />;
    case 'hash':
      return <Hash size={size} color={color} />;
    case 'timer':
      return <Timer size={size} color={color} />;
    case 'scale':
      return <Scale size={size} color={color} />;
    case 'settings':
      return <Settings size={size} color={color} />;
    default:
      return <Target size={size} color={color} />;
  }
};

export function GoalModalContent({ goalId }: Props) {
  const styles = useStyles();
  const theme = useAppTheme();
  const { locale } = useLocalization();
  const t = useGoalModalContentLocalization();
  const router = useRouter();

  const { goals, createGoal, updateGoal } = usePlannerDomainStore(
    useShallow((state) => ({
      goals: state.goals,
      createGoal: state.createGoal,
      updateGoal: state.updateGoal,
    })),
  );

  const { budgets, debts, createBudget, updateBudget, updateDebt } = useFinanceDomainStore(
    useShallow((state) => ({
      budgets: state.budgets,
      debts: state.debts,
      createBudget: state.createBudget,
      updateBudget: state.updateBudget,
      updateDebt: state.updateDebt,
    })),
  );

  const baseCurrency = useFinancePreferencesStore((state) => state.baseCurrency);

  // Wizard steps with localized labels
  const wizardSteps = useMemo<WizardStep[]>(() => [
    { id: 1, key: 'what', label: t.wizardSteps.what, icon: 'target' },
    { id: 2, key: 'measure', label: t.wizardSteps.measure, icon: 'chart' },
    { id: 3, key: 'when', label: t.wizardSteps.when, icon: 'calendar' },
    { id: 4, key: 'connect', label: t.wizardSteps.connect, icon: 'link' },
  ], [t]);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    goalType: 'financial',
    description: '',
    metricKind: 'amount',
    currentValue: 0,
    targetValue: 0,
    milestones: [],
    linkedHabitIds: [],
    linkedTaskIds: [],
  });

  const linkedBudgetForCurrency = useMemo(
    () => (formData.linkedBudgetId ? budgets.find((budget) => budget.id === formData.linkedBudgetId) : undefined),
    [budgets, formData.linkedBudgetId],
  );

  // Goal type items for FlashList
  const goalTypeItems = useMemo(() => [
    { id: 'financial' as GoalType, label: t.goalTypes.money, iconId: 'dollar' },
    { id: 'health' as GoalType, label: t.goalTypes.health, iconId: 'heart' },
    { id: 'education' as GoalType, label: t.goalTypes.learning, iconId: 'book' },
    { id: 'productivity' as GoalType, label: t.goalTypes.career, iconId: 'briefcase' },
    { id: 'personal' as GoalType, label: t.goalTypes.personal, iconId: 'target' },
  ], [t]);

  // Finance mode items for FlashList
  const financeModeItems = useMemo(() => [
    { id: 'save' as FinanceMode, label: t.financeModes.save.label, iconId: 'banknote' },
    { id: 'spend' as FinanceMode, label: t.financeModes.spend.label, iconId: 'shopping' },
    { id: 'debt_close' as FinanceMode, label: t.financeModes.debtClose.label, iconId: 'credit' },
  ], [t]);

  // Currency items for FlashList
  const currencyItems = useMemo(() =>
    AVAILABLE_FINANCE_CURRENCIES.map((curr) => ({
      id: curr,
      label: curr,
    })),
    [],
  );

  // Metric kind items for FlashList
  const metricKindItems = useMemo(() => [
    { id: 'count' as MetricKind, label: t.metricOptions.number.label, iconId: 'hash' },
    { id: 'duration' as MetricKind, label: t.metricOptions.time.label, iconId: 'timer' },
    { id: 'weight' as MetricKind, label: t.metricOptions.weight.label, iconId: 'scale' },
    { id: 'custom' as MetricKind, label: t.metricOptions.custom.label, iconId: 'settings' },
  ], [t]);

  // Deadline preset items for FlashList
  const deadlinePresetItems = useMemo(() => [
    { id: '1m', label: t.deadlinePresets.oneMonth },
    { id: '3m', label: t.deadlinePresets.threeMonths },
    { id: '6m', label: t.deadlinePresets.sixMonths },
    { id: '1y', label: t.deadlinePresets.oneYear },
  ], [t]);

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<DatePickerTarget | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingDebtSelection, setPendingDebtSelection] = useState(false);
  const [debtCountBeforeCreate, setDebtCountBeforeCreate] = useState<number | null>(null);

  // Load goal data if editing
  useEffect(() => {
    if (goalId) {
      const existingGoal = goals.find((g) => g.id === goalId);
      if (existingGoal) {
        setFormData({
          title: existingGoal.title || '',
          goalType: existingGoal.goalType || 'financial',
          description: existingGoal.description || '',
          metricKind: existingGoal.metricType || 'amount',
          financeMode: existingGoal.financeMode,
          currency: existingGoal.currency as FinanceCurrency | undefined,
          unit: existingGoal.unit,
          currentValue: existingGoal.initialValue || 0,
          targetValue: existingGoal.targetValue || 0,
          startDate: existingGoal.startDate ? new Date(existingGoal.startDate) : undefined,
          targetDate: existingGoal.targetDate ? new Date(existingGoal.targetDate) : undefined,
          milestones: existingGoal.milestones?.map((m: any) => ({
            id: m.id,
            title: m.title,
            percent: m.targetPercent,
            dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
          })) || [],
          linkedHabitIds: existingGoal.linkedHabitIds || [],
          linkedTaskIds: existingGoal.linkedTaskIds || [],
          linkedBudgetId: existingGoal.linkedBudgetId,
          linkedDebtId: existingGoal.linkedDebtId,
        });
      }
    }
  }, [goalId, goals]);

  useEffect(() => {
    if (!goalId) return;
    if (!formData.linkedBudgetId) {
      const budgetForGoal = budgets.find((budget) => budget.linkedGoalId === goalId);
      if (budgetForGoal) {
        setFormData((prev) => ({ ...prev, linkedBudgetId: budgetForGoal.id }));
      }
    }
    if (!formData.linkedDebtId) {
      const debtForGoal = debts.find((debt) => debt.linkedGoalId === goalId);
      if (debtForGoal) {
        setFormData((prev) => ({ ...prev, linkedDebtId: debtForGoal.id }));
      }
    }
  }, [budgets, debts, formData.linkedBudgetId, formData.linkedDebtId, goalId]);

  // Smart defaults when goalType changes
  useEffect(() => {
    if (formData.goalType === 'financial') {
      setFormData((prev) => ({
        ...prev,
        metricKind: 'amount',
        currency: prev.currency ?? baseCurrency,
        financeMode: prev.financeMode ?? 'save',
      }));
    } else if (formData.goalType === 'health') {
      setFormData((prev) => ({
        ...prev,
        metricKind: prev.metricKind === 'amount' ? 'count' : prev.metricKind,
      }));
    } else if (formData.goalType === 'education') {
      setFormData((prev) => ({
        ...prev,
        metricKind: prev.metricKind === 'amount' ? 'count' : prev.metricKind,
      }));
    }
  }, [formData.goalType, baseCurrency]);

  useEffect(() => {
    if (!linkedBudgetForCurrency) return;
    if (formData.currency !== linkedBudgetForCurrency.currency) {
      setFormData((prev) => ({
        ...prev,
        currency: linkedBudgetForCurrency.currency as FinanceCurrency,
      }));
    }
  }, [formData.currency, linkedBudgetForCurrency]);

  const updateField = useCallback(<K extends keyof GoalFormData>(field: K, value: GoalFormData[K]) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Sync currency when budget is selected
      if (field === 'linkedBudgetId' && value) {
        const linkedBudget = budgets.find((b) => b.id === value);
        if (linkedBudget?.currency) {
          updated.currency = linkedBudget.currency as FinanceCurrency;
        }
      }

      return updated;
    });
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, [budgets]);

  // Handle deadline preset selection
  const handleDeadlinePresetSelect = useCallback((item: { id: string; label: string }) => {
    const today = new Date();
    switch (item.id) {
      case '1m':
        updateField('targetDate', addMonths(today, 1));
        break;
      case '3m':
        updateField('targetDate', addMonths(today, 3));
        break;
      case '6m':
        updateField('targetDate', addMonths(today, 6));
        break;
      case '1y':
        updateField('targetDate', addYears(today, 1));
        break;
    }
  }, [updateField]);

  // Auto-select newly created debt
  useEffect(() => {
    if (pendingDebtSelection && debtCountBeforeCreate !== null) {
      if (debts.length > debtCountBeforeCreate) {
        // A new debt was created, select it
        const newDebt = debts[debts.length - 1];
        if (newDebt) {
          updateField('linkedDebtId', newDebt.id);
        }
        setPendingDebtSelection(false);
        setDebtCountBeforeCreate(null);
      }
    }
  }, [debts, pendingDebtSelection, debtCountBeforeCreate, updateField]);

  const validateStep = useCallback(
    (step: number): boolean => {
      const newErrors: Record<string, string> = {};

      if (step === 1) {
        if (!formData.title.trim()) {
          newErrors.title = t.validation.titleRequired;
        } else if (formData.title.length < 3) {
          newErrors.title = t.validation.titleTooShort;
        }
      }

      if (step === 2) {
        if (isNaN(formData.targetValue)) {
          newErrors.targetValue = t.validation.targetInvalid;
        }
        if (formData.targetValue === formData.currentValue) {
          newErrors.targetValue = t.validation.targetSameAsCurrent;
        }
      }

      if (step === 4 && formData.goalType === 'financial') {
        // Budget is auto-created for save/spend modes, so no validation needed
        // Only debt_close mode requires user to select a debt
        if (formData.financeMode === 'debt_close' && !formData.linkedDebtId) {
          newErrors.linkedDebtId = t.validation.debtRequired;
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData, t],
  );

  const goToNextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep((prev) => prev + 1);
      } else {
        handleSubmit();
      }
    }
  }, [currentStep, validateStep]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const syncFinanceLinks = useCallback(
    (targetGoalId: string, prevBudgetId?: string | null, prevDebtId?: string | null) => {
      if (prevBudgetId && prevBudgetId !== formData.linkedBudgetId) {
        updateBudget(prevBudgetId, { linkedGoalId: undefined });
      }
      if (formData.linkedBudgetId) {
        updateBudget(formData.linkedBudgetId, { linkedGoalId: targetGoalId });
      }
      if (prevDebtId && prevDebtId !== formData.linkedDebtId) {
        updateDebt(prevDebtId, { linkedGoalId: undefined });
      }
      if (formData.linkedDebtId) {
        updateDebt(formData.linkedDebtId, { linkedGoalId: targetGoalId });
      }
    },
    [formData.linkedBudgetId, formData.linkedDebtId, updateBudget, updateDebt],
  );

  const handleSubmit = useCallback(() => {
    const calculateDirection = (): 'increase' | 'decrease' | 'neutral' => {
      if (formData.targetValue > formData.currentValue) {
        return 'increase';
      } else if (formData.targetValue < formData.currentValue) {
        return 'decrease';
      } else {
        return 'neutral';
      }
    };

    const direction = calculateDirection();
    const previousGoal = goalId ? goals.find((item) => item.id === goalId) : undefined;
    const prevBudgetId = previousGoal?.linkedBudgetId ?? null;
    const prevDebtId = previousGoal?.linkedDebtId ?? null;

    // Determine if we need to auto-create a budget for financial goals
    const isFinancialGoal = formData.goalType === 'financial';
    const needsBudget = isFinancialGoal && formData.financeMode !== 'debt_close';

    let finalBudgetId = formData.linkedBudgetId;
    const enforcedCurrency = (formData.currency ?? baseCurrency) as FinanceCurrency;

    // Auto-create budget for financial goals (save/spend mode)
    if (needsBudget && !finalBudgetId) {
      const budgetLimit = Math.abs(formData.targetValue - formData.currentValue);
      const newBudget = createBudget({
        userId: 'current-user',
        name: formData.title, // Use goal title as budget name
        budgetType: 'project',
        currency: enforcedCurrency,
        limitAmount: budgetLimit,
        periodType: formData.targetDate ? 'custom_range' : 'none',
        startDate: formData.startDate?.toISOString() ?? new Date().toISOString(),
        endDate: formData.targetDate?.toISOString(),
        isOverspent: false,
        isArchived: false,
        transactionType: formData.financeMode === 'spend' ? 'expense' : 'expense', // Both save and spend track expenses
      });
      finalBudgetId = newBudget.id;
    }

    // Update existing budget limit if linked and it's a financial goal
    if (needsBudget && finalBudgetId && prevBudgetId === finalBudgetId) {
      const budgetLimit = Math.abs(formData.targetValue - formData.currentValue);
      updateBudget(finalBudgetId, {
        limitAmount: budgetLimit,
        currency: enforcedCurrency,
        startDate: formData.startDate?.toISOString(),
        endDate: formData.targetDate?.toISOString(),
      });
    }

    let nextGoalId = goalId ?? undefined;
    if (goalId) {
      updateGoal(goalId, {
        title: formData.title,
        goalType: formData.goalType,
        description: formData.description || undefined,
        metricType: formData.metricKind,
        direction,
        financeMode: formData.financeMode,
        currency: enforcedCurrency,
        unit: formData.unit,
        initialValue: formData.currentValue,
        targetValue: formData.targetValue,
        startDate: formData.startDate?.toISOString(),
        targetDate: formData.targetDate?.toISOString(),
        milestones: formData.milestones.map((m) => ({
          id: m.id,
          title: m.title,
          targetPercent: m.percent,
          dueDate: m.dueDate?.toISOString(),
        })),
        linkedBudgetId: finalBudgetId,
        linkedDebtId: formData.linkedDebtId,
      });
      nextGoalId = goalId;
    } else {
      const created = createGoal({
        userId: 'current-user',
        title: formData.title,
        goalType: formData.goalType,
        description: formData.description || undefined,
        status: 'active',
        metricType: formData.metricKind,
        direction,
        financeMode: formData.financeMode,
        currency: enforcedCurrency,
        unit: formData.unit,
        initialValue: formData.currentValue,
        targetValue: formData.targetValue,
        startDate: formData.startDate?.toISOString(),
        targetDate: formData.targetDate?.toISOString(),
        milestones: formData.milestones.map((m) => ({
          id: m.id,
          title: m.title,
          targetPercent: m.percent,
          dueDate: m.dueDate?.toISOString(),
        })),
        linkedBudgetId: finalBudgetId,
        linkedDebtId: formData.linkedDebtId,
      });
      nextGoalId = created.id;
    }

    if (nextGoalId) {
      syncFinanceLinks(nextGoalId, prevBudgetId, prevDebtId);
    }

    // Delay navigation to allow AsyncStorage to persist the changes
    setTimeout(() => {
      router.back();
    }, 100);
  }, [baseCurrency, budgets, formData, goalId, goals, createBudget, createGoal, updateBudget, updateGoal, router, syncFinanceLinks]);

  const handleDateChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        setDatePickerVisible(false);
      }

      if (event.type === 'set' && selectedDate && datePickerTarget) {
        if (datePickerTarget.type === 'start') {
          updateField('startDate', selectedDate);
        } else if (datePickerTarget.type === 'due') {
          updateField('targetDate', selectedDate);
        } else if (datePickerTarget.type === 'milestone') {
          setFormData((prev) => ({
            ...prev,
            milestones: prev.milestones.map((m) =>
              m.id === datePickerTarget.id ? { ...m, dueDate: selectedDate } : m,
            ),
          }));
        }
      }

      if (Platform.OS === 'ios') {
        // Keep picker open on iOS
      }
    },
    [datePickerTarget, updateField],
  );

  const openDatePicker = useCallback((target: DatePickerTarget) => {
    setDatePickerTarget(target);
    if (Platform.OS === 'android') {
      const currentDate =
        target.type === 'start'
          ? formData.startDate ?? new Date()
          : target.type === 'due'
            ? formData.targetDate ?? new Date()
            : formData.milestones.find((m) => m.id === target.id)?.dueDate ?? new Date();

      DateTimePickerAndroid.open({
        value: currentDate,
        onChange: handleDateChange,
        mode: 'date',
        is24Hour: true,
      });
    } else {
      setDatePickerVisible(true);
    }
  }, [formData, handleDateChange]);

  const closeDatePicker = useCallback(() => {
    setDatePickerVisible(false);
    setDatePickerTarget(null);
  }, []);

  const addMilestone = useCallback(() => {
    const newMilestone: MilestoneFormValue = {
      id: generateId(),
      title: '',
      percent: 25,
    };
    setFormData((prev) => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone],
    }));
  }, []);

  const updateMilestone = useCallback((id: string, updates: Partial<MilestoneFormValue>) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  }, []);

  const removeMilestone = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((m) => m.id !== id),
    }));
  }, []);

  const handleCreateBudgetLink = useCallback(() => {
    // Open budget modal with goalId if editing, otherwise just open it
    const params = goalId ? { goalId } : {};
    router.push({ pathname: '/(modals)/finance/budget', params });
  }, [goalId, router]);

  const handleAddFinanceContribution = useCallback(() => {
    if (!goalId) return;
    const tabParam = formData.financeMode === 'spend' || formData.financeMode === 'save' || formData.financeMode === 'debt_close' ? 'outcome' : 'income';
    router.push({ pathname: '/(modals)/finance/quick-exp', params: { goalId, tab: tabParam } });
  }, [formData.financeMode, goalId, router]);

  const handleCreateDebt = useCallback(() => {
    // Mark that we're waiting for a new debt to be created
    setPendingDebtSelection(true);
    setDebtCountBeforeCreate(debts.length);
    // Navigate to debt creation modal with goalId if editing
    router.push({ pathname: '/(modals)/finance/debt', params: goalId ? { goalId } : undefined });
  }, [debts.length, goalId, router]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  const getGoalExamples = (goalType: GoalType): string => {
    const examples = t.goalExamples[goalType];
    return examples ? examples.join(', ') : '';
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t.step1.title}</Text>

      <View style={styles.fieldContainer}>
        <AdaptiveGlassView style={styles.glassInputContainer}>
          <TextInput
            style={[styles.glassInput, errors.title && styles.inputError]}
            value={formData.title}
            onChangeText={(text) => updateField('title', text)}
            placeholder={t.step1.titlePlaceholder}
            placeholderTextColor={styles.placeholder.color}
            maxLength={100}
            autoFocus
          />
        </AdaptiveGlassView>
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        <Text style={styles.characterCount}>{formData.title.length}/100</Text>
      </View>

      <View style={styles.fieldContainerFullWidth}>
        <Text style={[styles.fieldLabel, styles.labelWithPadding]}>{t.step1.category}</Text>
        <View style={styles.goalTypeListContainer}>
          <FlashList
            data={goalTypeItems}
            horizontal
            showsHorizontalScrollIndicator={false}
            estimatedItemSize={100}
            keyExtractor={(item: { id: GoalType; label: string; iconId: string }) => item.id}
            ItemSeparatorComponent={() => <View style={styles.horizontalSeparator} />}
            ListHeaderComponent={<View style={styles.listEdgeSpacer} />}
            ListFooterComponent={<View style={styles.listEdgeSpacer} />}
            renderItem={({ item }: { item: { id: GoalType; label: string; iconId: string } }) => {
              const isSelected = formData.goalType === item.id;
              return (
                <Pressable onPress={() => updateField('goalType', item.id)}>
                  <AdaptiveGlassView style={[styles.chip, isSelected && styles.chipSelected]}>
                    {renderIcon(item.iconId, 16, isSelected ? '#FFFFFF' : theme.colors.textSecondary)}
                    <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{item.label}</Text>
                  </AdaptiveGlassView>
                </Pressable>
              );
            }}
          />
        </View>
        {formData.goalType && (
          <View style={styles.labelWithPadding}>
            <SmartHint
              type="tip"
              message={`Examples: ${getGoalExamples(formData.goalType)}`}
            />
          </View>
        )}
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{t.step1.whyImportant}</Text>
        <AdaptiveGlassView style={styles.glassInputContainer}>
          <TextInput
            style={[styles.glassTextArea]}
            value={formData.description}
            onChangeText={(text) => updateField('description', text)}
            placeholder={t.step1.motivationPlaceholder}
            placeholderTextColor={styles.placeholder.color}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </AdaptiveGlassView>
        <SmartHint type="info" message={t.step1.whyHint} />
      </View>
    </View>
  );

  const renderStep2 = () => {
    const isFinancial = formData.goalType === 'financial';

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>{t.step2.title}</Text>

        {isFinancial ? (
          <>
            <View style={styles.fieldContainerFullWidth}>
              <Text style={[styles.fieldLabel, styles.labelWithPadding]}>{t.step2.goalType}</Text>
              <View style={styles.financeModeListContainer}>
                <FlashList
                  data={financeModeItems}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  estimatedItemSize={100}
                  keyExtractor={(item: { id: FinanceMode; label: string; iconId: string }) => item.id}
                  ItemSeparatorComponent={() => <View style={styles.horizontalSeparator} />}
                  ListHeaderComponent={<View style={styles.listEdgeSpacer} />}
                  ListFooterComponent={<View style={styles.listEdgeSpacer} />}
                  renderItem={({ item }: { item: { id: FinanceMode; label: string; iconId: string } }) => {
                    const isSelected = formData.financeMode === item.id;
                    return (
                      <Pressable onPress={() => updateField('financeMode', item.id)}>
                        <AdaptiveGlassView style={[styles.chip, isSelected && styles.chipSelected]}>
                          {renderIcon(item.iconId, 16, isSelected ? '#FFFFFF' : theme.colors.textSecondary)}
                          <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{item.label}</Text>
                        </AdaptiveGlassView>
                      </Pressable>
                    );
                  }}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{t.step2.currency}</Text>
              {formData.linkedBudgetId && (() => {
                const linkedBudget = budgets.find((b) => b.id === formData.linkedBudgetId);
                if (linkedBudget) {
                  return (
                    <View>
                      <AdaptiveGlassView style={styles.currencyInheritedChip}>
                        <Text style={styles.currencyInheritedText}>{linkedBudget.currency}</Text>
                      </AdaptiveGlassView>
                      <Text style={[styles.fieldLabel, { opacity: 0.6, marginTop: 6 }]}>
                        {t.step2.currencyInherited}
                      </Text>
                    </View>
                  );
                }
                return null;
              })()}
              {!formData.linkedBudgetId && (
                <View style={styles.currencyListContainer}>
                  <FlashList
                    data={currencyItems}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    estimatedItemSize={60}
                    keyExtractor={(item: { id: string; label: string }) => item.id}
                    ItemSeparatorComponent={() => <View style={styles.horizontalSeparator} />}
                    renderItem={({ item }: { item: { id: string; label: string } }) => {
                      const isSelected = formData.currency === item.id;
                      return (
                        <Pressable onPress={() => updateField('currency', item.id as FinanceCurrency)}>
                          <AdaptiveGlassView style={[styles.chip, isSelected && styles.chipSelected]}>
                            <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{item.label}</Text>
                          </AdaptiveGlassView>
                        </Pressable>
                      );
                    }}
                  />
                </View>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>{t.step2.current}</Text>
                  <AdaptiveGlassView style={styles.glassInputContainer}>
                    <TextInput
                      style={styles.glassInput}
                      value={formData.currentValue ? formatNumericInput(formData.currentValue) : ''}
                      onChangeText={(text) => updateField('currentValue', parseNumericInput(text))}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={styles.placeholder.color}
                    />
                  </AdaptiveGlassView>
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>{t.step2.target}</Text>
                  <AdaptiveGlassView style={[styles.glassInputContainer, errors.targetValue && styles.inputError]}>
                    <TextInput
                      style={styles.glassInput}
                      value={formData.targetValue ? formatNumericInput(formData.targetValue) : ''}
                      onChangeText={(text) => updateField('targetValue', parseNumericInput(text))}
                      keyboardType="numeric"
                      placeholder="5 000"
                      placeholderTextColor={styles.placeholder.color}
                    />
                  </AdaptiveGlassView>
                </View>
              </View>
              {errors.targetValue && <Text style={styles.errorText}>{errors.targetValue}</Text>}
            </View>

            <SmartHint type="success" message={t.step2.progressAutoHint} />
          </>
        ) : (
          <>
            <View style={styles.fieldContainerFullWidth}>
              <Text style={[styles.fieldLabel, styles.labelWithPadding]}>{t.step2.whatMeasure}</Text>
              <View style={styles.metricKindListContainer}>
                <FlashList
                  data={metricKindItems}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  estimatedItemSize={100}
                  keyExtractor={(item: { id: MetricKind; label: string; iconId: string }) => item.id}
                  ItemSeparatorComponent={() => <View style={styles.horizontalSeparator} />}
                  ListHeaderComponent={<View style={styles.listEdgeSpacer} />}
                  ListFooterComponent={<View style={styles.listEdgeSpacer} />}
                  renderItem={({ item }: { item: { id: MetricKind; label: string; iconId: string } }) => {
                    const isSelected = formData.metricKind === item.id;
                    return (
                      <Pressable onPress={() => updateField('metricKind', item.id)}>
                        <AdaptiveGlassView style={[styles.chip, isSelected && styles.chipSelected]}>
                          {renderIcon(item.iconId, 16, isSelected ? '#FFFFFF' : theme.colors.textSecondary)}
                          <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{item.label}</Text>
                        </AdaptiveGlassView>
                      </Pressable>
                    );
                  }}
                />
              </View>
            </View>

            {(formData.metricKind === 'count' || formData.metricKind === 'duration') && (
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{t.step2.unit}</Text>
                <AdaptiveGlassView style={styles.glassInputContainer}>
                  <TextInput
                    style={styles.glassInput}
                    value={formData.unit ?? ''}
                    onChangeText={(text) => updateField('unit', text)}
                    placeholder={formData.metricKind === 'count' ? t.step2.unitPlaceholderCount : t.step2.unitPlaceholderDuration}
                    placeholderTextColor={styles.placeholder.color}
                  />
                </AdaptiveGlassView>
              </View>
            )}

            <View style={styles.fieldContainer}>
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>{t.step2.current}</Text>
                  <AdaptiveGlassView style={styles.glassInputContainer}>
                    <TextInput
                      style={styles.glassInput}
                      value={formData.currentValue ? formatNumericInput(formData.currentValue) : ''}
                      onChangeText={(text) => updateField('currentValue', parseNumericInput(text))}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={styles.placeholder.color}
                    />
                  </AdaptiveGlassView>
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>{t.step2.target}</Text>
                  <AdaptiveGlassView style={[styles.glassInputContainer, errors.targetValue && styles.inputError]}>
                    <TextInput
                      style={styles.glassInput}
                      value={formData.targetValue ? formatNumericInput(formData.targetValue) : ''}
                      onChangeText={(text) => updateField('targetValue', parseNumericInput(text))}
                      keyboardType="numeric"
                      placeholder="100"
                      placeholderTextColor={styles.placeholder.color}
                    />
                  </AdaptiveGlassView>
                </View>
              </View>
              {errors.targetValue && <Text style={styles.errorText}>{errors.targetValue}</Text>}
            </View>
          </>
        )}
      </View>
    );
  };

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t.step3.title}</Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{t.step3.deadline}</Text>
        <AdaptiveGlassView style={styles.glassDateButton}>
          <Pressable
            style={styles.dateButtonInner}
            onPress={() => openDatePicker({ type: 'due' })}
          >
            <CalendarIcon size={20} color={theme.colors.textSecondary} />
            <Text style={styles.dateButtonText}>
              {formData.targetDate ? formData.targetDate.toLocaleDateString(locale) : t.step3.selectDate}
            </Text>
          </Pressable>
        </AdaptiveGlassView>
        <SmartHint type="tip" message={t.step3.deadlineHint} />
      </View>

      {!formData.targetDate && (
        <View style={styles.fieldContainerFullWidth}>
          <Text style={[styles.fieldLabel, styles.labelWithPadding]}>{t.step3.quickSelect}</Text>
          <View style={styles.deadlinePresetListContainer}>
            <FlashList
              data={deadlinePresetItems}
              horizontal
              showsHorizontalScrollIndicator={false}
              estimatedItemSize={80}
              keyExtractor={(item: { id: string; label: string }) => item.id}
              ItemSeparatorComponent={() => <View style={styles.horizontalSeparator} />}
              ListHeaderComponent={<View style={styles.listEdgeSpacer} />}
              ListFooterComponent={<View style={styles.listEdgeSpacer} />}
              renderItem={({ item }: { item: { id: string; label: string } }) => (
                <Pressable onPress={() => handleDeadlinePresetSelect(item)}>
                  <AdaptiveGlassView style={styles.chip}>
                    <Text style={styles.chipLabel}>{item.label}</Text>
                  </AdaptiveGlassView>
                </Pressable>
              )}
            />
          </View>
        </View>
      )}

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{t.step3.milestones}</Text>
        {formData.milestones.map((milestone, index) => (
          <View key={milestone.id} style={styles.milestoneItem}>
            <AdaptiveGlassView style={[styles.glassInputContainer, { flex: 1 }]}>
              <TextInput
                style={styles.glassInput}
                value={milestone.title}
                onChangeText={(text) => updateMilestone(milestone.id, { title: text })}
                placeholder={t.step3.milestonePlaceholder(index + 1)}
                placeholderTextColor={styles.placeholder.color}
              />
            </AdaptiveGlassView>
            <Pressable onPress={() => removeMilestone(milestone.id)}>
              <Trash2 size={20} color={styles.deleteIcon.color} />
            </Pressable>
          </View>
        ))}
        <Pressable style={styles.addButton} onPress={addMilestone}>
          <PlusCircle size={20} color={styles.addButtonText.color} />
          <Text style={styles.addButtonText}>{t.step3.addMilestone}</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderStep4 = () => {
    const isFinancial = formData.goalType === 'financial';
    const isSaveMode = formData.financeMode === 'save';
    const isDebtMode = formData.financeMode === 'debt_close';
    const isSpendMode = formData.financeMode === 'spend';

    const activeBudgets = budgets.filter((b) => !b.isArchived);
    const activeDebts = debts.filter((d) => d.status === 'active');
    const selectedBudget = formData.linkedBudgetId
      ? activeBudgets.find((b) => b.id === formData.linkedBudgetId) ?? null
      : null;
    const selectedDebt = formData.linkedDebtId
      ? activeDebts.find((d) => d.id === formData.linkedDebtId) ?? null
      : null;
    const progressPreview = formData.targetValue > 0
      ? Math.min(Math.max((formData.currentValue / formData.targetValue) * 100, 0), 999)
      : 0;

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>{t.step4.title}</Text>
        <Text style={styles.stepSubtitle}>{t.step4.subtitle}</Text>

        {isFinancial && (selectedBudget || selectedDebt) && (
          <AdaptiveGlassView style={styles.previewCard}>
            <Text style={styles.previewLabel}>{t.step4.livePreview}</Text>
            {selectedBudget && (
              <Text style={styles.previewValue}>
                {t.step4.budgetBalance}:{' '}
                {(selectedBudget.currentBalance ?? selectedBudget.remainingAmount ?? selectedBudget.limitAmount).toFixed(2)}{' '}
                {selectedBudget.currency}
              </Text>
            )}
            <Text style={styles.previewValue}>{t.step4.goalProgress}: {progressPreview.toFixed(0)}%</Text>
            {selectedDebt && (
              <Text style={styles.previewValue}>
                {t.step4.debtRemaining}: {selectedDebt.principalAmount.toFixed(2)} {selectedDebt.principalCurrency}
              </Text>
            )}
          </AdaptiveGlassView>
        )}

        {isFinancial ? (
          <>
            {isSaveMode && (
              <View style={styles.fieldContainer}>
                <SmartHint type="success" message={t.step4.autoBudgetHint} />
                <SmartHint
                  type="info"
                  message={t.step4.autoBudgetInfo(
                    formatNumericInput(Math.abs(formData.targetValue - formData.currentValue)),
                    formData.currency ?? baseCurrency
                  )}
                />
              </View>
          )}

            {isDebtMode && (
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{t.step4.whichDebt}</Text>
                {activeDebts.length > 0 ? (
                  <View style={styles.listContainer}>
                    <Pressable
                      style={[styles.listItem, !formData.linkedDebtId && styles.listItemSelected]}
                      onPress={() => updateField('linkedDebtId', undefined)}
                    >
                      {!formData.linkedDebtId ? (
                        <CircleDot size={20} color={styles.primaryColor.color} />
                      ) : (
                        <Circle size={20} color={styles.textSecondary.color} />
                      )}
                      <Text style={styles.listItemText}>{t.step4.noDebt}</Text>
                    </Pressable>
                    {activeDebts.map((debt) => (
                      <Pressable
                        key={debt.id}
                        style={[styles.listItem, formData.linkedDebtId === debt.id && styles.listItemSelected]}
                        onPress={() => updateField('linkedDebtId', debt.id)}
                      >
                        {formData.linkedDebtId === debt.id ? (
                          <CircleDot size={20} color={styles.primaryColor.color} />
                        ) : (
                          <Circle size={20} color={styles.textSecondary.color} />
                        )}
                        <View style={styles.listItemContent}>
                          <Text style={styles.listItemText}>{debt.counterpartyName}</Text>
                          <Text style={styles.listItemSubtext}>
                            {debt.principalCurrency} {debt.principalAmount.toFixed(2)}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <SmartHint type="info" message={t.step4.noDebtsHint} />
                )}
                <Pressable
                  style={styles.addButton}
                  onPress={handleCreateDebt}
                >
                  <PlusCircle size={20} color={styles.addButtonText.color} />
                  <Text style={styles.addButtonText}>{t.step4.createNewDebt}</Text>
                </Pressable>
                {errors.linkedDebtId && <Text style={styles.errorText}>{errors.linkedDebtId}</Text>}
                <SmartHint type="success" message={t.step4.debtProgressHint} />
              </View>
            )}

            {isSpendMode && (
              <View style={styles.fieldContainer}>
                <SmartHint type="success" message={t.step4.autoBudgetHint} />
                <SmartHint
                  type="info"
                  message={t.step4.autoBudgetInfo(
                    formatNumericInput(Math.abs(formData.targetValue - formData.currentValue)),
                    formData.currency ?? baseCurrency
                  )}
                />
              </View>
            )}
          </>
        ) : (
          <SmartHint
            type="info"
            message={t.step4.nonFinancialHint}
          />
        )}

        {goalId && isFinancial && (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {t.step4.connectFinance}
            </Text>
            <View style={styles.listContainer}>
              <Pressable
                style={({ pressed }) => [styles.listItem, pressed && styles.listItemSelected]}
                onPress={handleCreateBudgetLink}
              >
                <Text style={styles.listItemText}>
                  {t.step4.createBudgetForGoal}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.listItem, pressed && styles.listItemSelected]}
                onPress={handleAddFinanceContribution}
              >
                <Text style={styles.listItemText}>
                  {t.step4.addContribution}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{goalId ? t.header.editGoal : t.header.createGoal}</Text>
        <Pressable onPress={router.back} hitSlop={12}>
          <Text style={styles.closeText}>{t.header.close}</Text>
        </Pressable>
      </View>

      <StepIndicator currentStep={currentStep} totalSteps={4} steps={wizardSteps} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStepContent()}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 1 && (
          <Pressable style={[styles.button, styles.buttonSecondary]} onPress={goToPreviousStep}>
            <Text style={styles.buttonSecondaryText}>{t.buttons.back}</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.button, styles.buttonPrimary, currentStep === 1 && styles.buttonPrimaryFull]}
          onPress={goToNextStep}
        >
          <Text style={styles.buttonPrimaryText}>{currentStep < 4 ? t.buttons.next : t.buttons.createGoal}</Text>
        </Pressable>
      </View>

      {Platform.OS === 'ios' && datePickerVisible && datePickerTarget && (
        <View style={styles.datePickerContainer}>
          <DateTimePicker
            value={
              datePickerTarget.type === 'start'
                ? formData.startDate ?? new Date()
                : datePickerTarget.type === 'due'
                  ? formData.targetDate ?? new Date()
                  : formData.milestones.find((m) => m.id === datePickerTarget.id)?.dueDate ?? new Date()
            }
            mode="date"
            display="spinner"
            onChange={handleDateChange}
          />
          <Pressable style={styles.datePickerDone} onPress={closeDatePicker}>
            <Text style={styles.datePickerDoneText}>{t.buttons.done}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const useStyles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  closeText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  stepContainer: {
    gap: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  fieldContainer: {
    gap: 10,
  },
  fieldContainerFullWidth: {
    gap: 10,
    marginHorizontal: -20,
  },
  labelWithPadding: {
    paddingHorizontal: 20,
  },
  listEdgeSpacer: {
    width: 20,
  },
  horizontalSeparator: {
    width: 10,
  },
  goalTypeListContainer: {
    height: 52,
  },
  financeModeListContainer: {
    height: 52,
  },
  currencyListContainer: {
    height: 52,
  },
  metricKindListContainer: {
    height: 52,
  },
  deadlinePresetListContainer: {
    height: 52,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  glassInputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  glassInput: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  glassTextArea: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  glassDateButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  dateButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  currencyInheritedChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  currencyInheritedText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  textArea: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  placeholder: {
    color: theme.colors.textMuted,
  },
  characterCount: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  errorText: {
    fontSize: 13,
    color: theme.colors.danger,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    // Add shadow for better visibility
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  chipIcon: {
    fontSize: 16,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  chipLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
    gap: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateButtonText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  deleteIcon: {
    color: theme.colors.danger,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  previewCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    gap: 6,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  listContainer: {
    gap: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  listItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}15`,
    // Add shadow for better visibility
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  listItemContent: {
    flex: 1,
  },
  listItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  listItemSubtext: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  primaryColor: {
    color: theme.colors.primary,
  },
  textSecondary: {
    color: theme.colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  buttonPrimaryFull: {
    flex: 1,
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  datePickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  datePickerDone: {
    alignItems: 'center',
    padding: 12,
  },
  datePickerDoneText: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.primary,
  },
}));
