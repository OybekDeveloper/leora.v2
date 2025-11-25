import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
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
import {
  Target,
  BarChart3,
  Calendar,
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
  Plus,
  PlusCircle,
  Circle,
  CircleDot,
} from 'lucide-react-native';
import { useShallow } from 'zustand/react/shallow';

import CustomModal from '@/components/modals/CustomModal';
import { BottomSheetHandle } from '@/components/modals/BottomSheet';
import { StepIndicator } from '@/components/modals/StepIndicator';
import { SmartHint } from '@/components/modals/SmartHint';
import { useModalStore } from '@/stores/useModalStore';
import { useLocalization } from '@/localization/useLocalization';
import type { FinanceMode, GoalType, MetricKind } from '@/domain/planner/types';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import {
  AVAILABLE_FINANCE_CURRENCIES,
  type FinanceCurrency,
  useFinancePreferencesStore,
} from '@/stores/useFinancePreferencesStore';
import { createThemedStyles } from '@/constants/theme';

// Export handle type for parent components
export interface GoalModalHandle {
  present: () => void;
  dismiss: () => void;
  edit: (goalId: string) => void;
}

// Wizard Step Definition
type WizardStep = {
  id: number;
  key: 'what' | 'measure' | 'when' | 'connect';
  label: string;
  icon: string;
};

const WIZARD_STEPS: WizardStep[] = [
  { id: 1, key: 'what', label: 'What', icon: 'target' },
  { id: 2, key: 'measure', label: 'Measure', icon: 'chart' },
  { id: 3, key: 'when', label: 'When', icon: 'calendar' },
  { id: 4, key: 'connect', label: 'Connect', icon: 'link' },
];

// Form Data Types
type GoalFormData = {
  // Step 1: What & Why
  title: string;
  goalType: GoalType;
  description: string;

  // Step 2: How to Measure
  metricKind: MetricKind;
  financeMode?: FinanceMode;
  currency?: FinanceCurrency;
  unit?: string;
  currentValue: number;
  targetValue: number;

  // Step 3: When
  startDate?: Date;
  targetDate?: Date;
  milestones: Array<{
    id: string;
    title: string;
    percent: number;
    dueDate?: Date;
  }>;

  // Step 4: Connect
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

const GOAL_TYPES: { id: GoalType; label: string; icon: string; examples: string[] }[] = [
  { id: 'financial', label: 'Money', icon: 'dollar', examples: ['Save $5000', 'Pay off debt'] },
  { id: 'health', label: 'Health', icon: 'heart', examples: ['Lose 10kg', 'Run 5km'] },
  { id: 'education', label: 'Learning', icon: 'book', examples: ['Read 24 books', 'Master React'] },
  {
    id: 'productivity',
    label: 'Career',
    icon: 'briefcase',
    examples: ['Get promoted', 'Launch side project'],
  },
  {
    id: 'personal',
    label: 'Personal',
    icon: 'target',
    examples: ['Meditate daily', 'Travel to 5 countries'],
  },
];

const FINANCE_MODES: { id: FinanceMode; label: string; icon: string; description: string }[] = [
  { id: 'save', label: 'Save money', icon: 'banknote', description: 'Build savings' },
  { id: 'spend', label: 'Budget limit', icon: 'shopping', description: 'Control spending' },
  { id: 'debt_close', label: 'Pay off debt', icon: 'credit', description: 'Eliminate debt' },
];

const METRIC_OPTIONS: { id: MetricKind; label: string; icon: string; description: string }[] = [
  { id: 'amount', label: 'Money', icon: 'dollar', description: 'Financial goals' },
  { id: 'count', label: 'Number', icon: 'hash', description: 'Count-based' },
  { id: 'duration', label: 'Time', icon: 'timer', description: 'Time-based' },
  { id: 'weight', label: 'Weight', icon: 'scale', description: 'Weight tracking' },
  { id: 'custom', label: 'Custom', icon: 'settings', description: 'Your metric' },
];

// Helper functions
const parseNumericInput = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
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

// Icon render helpers
const renderIcon = (iconId: string, size: number, color: string) => {
  switch (iconId) {
    case 'target':
      return <Target size={size} color={color} />;
    case 'chart':
      return <BarChart3 size={size} color={color} />;
    case 'calendar':
      return <Calendar size={size} color={color} />;
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

// Component
const GoalModalComponent: React.ForwardRefRenderFunction<GoalModalHandle> = (_, ref) => {
  const styles = useStyles();
  const { locale } = useLocalization();
  const modalRef = useRef<BottomSheetHandle>(null);

  const modalState = useModalStore((state) => state.plannerGoalModal);
  const closePlannerGoalModal = useModalStore((state) => state.closePlannerGoalModal);

  const { goals, createGoal, updateGoal } = usePlannerDomainStore(
    useShallow((state) => ({
      goals: state.goals,
      createGoal: state.createGoal,
      updateGoal: state.updateGoal,
    })),
  );

  const { budgets, debts } = useFinanceDomainStore(
    useShallow((state) => ({
      budgets: state.budgets,
      debts: state.debts,
    })),
  );

  const baseCurrency = useFinancePreferencesStore((state) => state.baseCurrency);

  // Wizard state
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

  // UI state
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<DatePickerTarget | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Expose imperative handle to parent
  useImperativeHandle(ref, () => ({
    present: () => {
      modalRef.current?.present();
    },
    dismiss: () => {
      modalRef.current?.dismiss();
    },
    edit: (goalId: string) => {
      const existingGoal = goals.find((g) => g.id === goalId);
      if (existingGoal) {
        loadGoalData(existingGoal);
      }
      modalRef.current?.present();
    },
  }), [goals]);

  // Helper to load goal data for editing
  const loadGoalData = useCallback((goal: any) => {
    setFormData({
      title: goal.title || '',
      goalType: goal.goalType || 'financial',
      description: goal.description || '',
      metricKind: goal.metricKind || 'amount',
      financeMode: goal.financeMode,
      currency: goal.currency as FinanceCurrency | undefined,
      unit: goal.unit,
      currentValue: goal.initialValue || 0,
      targetValue: goal.targetValue || 0,
      startDate: goal.startDate ? new Date(goal.startDate) : undefined,
      targetDate: goal.targetDate ? new Date(goal.targetDate) : undefined,
      milestones: goal.milestones?.map((m: any) => ({
        id: m.id,
        title: m.title,
        percent: m.targetPercent,
        dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
      })) || [],
      linkedHabitIds: goal.linkedHabitIds || [],
      linkedTaskIds: goal.linkedTaskIds || [],
      linkedBudgetId: goal.linkedBudgetId,
      linkedDebtId: goal.linkedDebtId,
    });
    setCurrentStep(1);
    setErrors({});
  }, []);

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

  // Field update handlers
  const updateField = useCallback(<K extends keyof GoalFormData>(field: K, value: GoalFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

  // Validation
  const validateStep = useCallback(
    (step: number): boolean => {
      const newErrors: Record<string, string> = {};

      if (step === 1) {
        if (!formData.title.trim()) {
          newErrors.title = 'Title is required';
        } else if (formData.title.length < 3) {
          newErrors.title = 'Title is too short. Be more specific!';
        }
      }

      if (step === 2) {
        // Only validate that target is a valid number (can be any value, including negative)
        if (isNaN(formData.targetValue)) {
          newErrors.targetValue = 'Target must be a valid number';
        }

        // Check that target and current are not exactly equal (they should be different to track progress)
        if (formData.targetValue === formData.currentValue) {
          newErrors.targetValue = 'Target should be different from current value';
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData],
  );

  // Navigation
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

  // Submit
  const handleSubmit = useCallback(() => {
    // Calculate goal direction automatically
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

    if (modalState.mode === 'edit' && modalState.goalId) {
      updateGoal(modalState.goalId, {
        title: formData.title,
        goalType: formData.goalType,
        description: formData.description || undefined,
        metricType: formData.metricKind,
        direction,
        financeMode: formData.financeMode,
        currency: formData.currency,
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
        linkedBudgetId: formData.linkedBudgetId,
        linkedDebtId: formData.linkedDebtId,
      });
    } else {
      createGoal({
        userId: 'current-user', // TODO: Get from auth
        title: formData.title,
        goalType: formData.goalType,
        description: formData.description || undefined,
        status: 'active',
        metricType: formData.metricKind,
        direction,
        financeMode: formData.financeMode,
        currency: formData.currency,
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
        linkedBudgetId: formData.linkedBudgetId,
        linkedDebtId: formData.linkedDebtId,
      });
    }

    // Close modal and reset form
    modalRef.current?.dismiss();
    closePlannerGoalModal();

    // Reset form to defaults
    setFormData({
      title: '',
      goalType: 'financial',
      description: '',
      metricKind: 'amount',
      currency: baseCurrency,
      currentValue: 0,
      targetValue: 0,
      milestones: [],
      linkedHabitIds: [],
      linkedTaskIds: [],
    });
    setCurrentStep(1);
    setErrors({});
  }, [formData, modalState, createGoal, updateGoal, closePlannerGoalModal, baseCurrency]);

  // Date picker handlers
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

  // Milestone handlers
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

  // Render step content
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

  // Step 1: What & Why
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What do you want to achieve?</Text>

      {/* Title */}
      <View style={styles.fieldContainer}>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          value={formData.title}
          onChangeText={(text) => updateField('title', text)}
          placeholder='E.g., "Save for vacation", "Run a marathon", "Learn Spanish"'
          placeholderTextColor={styles.placeholder.color}
          maxLength={100}
          autoFocus
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        <Text style={styles.characterCount}>{formData.title.length}/100</Text>
      </View>

      {/* Goal Type */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Category</Text>
        <View style={styles.chipRow}>
          {GOAL_TYPES.map((type) => (
            <Pressable
              key={type.id}
              style={[styles.chip, formData.goalType === type.id && styles.chipSelected]}
              onPress={() => updateField('goalType', type.id)}
            >
              {renderIcon(type.icon, 20, formData.goalType === type.id ? styles.chipLabelSelected.color : styles.chipLabel.color)}
              <Text style={[styles.chipLabel, formData.goalType === type.id && styles.chipLabelSelected]}>
                {type.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {formData.goalType && (
          <SmartHint
            type="tip"
            message={`Examples: ${GOAL_TYPES.find((t) => t.id === formData.goalType)?.examples.join(', ')}`}
          />
        )}
      </View>

      {/* Description (optional) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Why is this important? (optional)</Text>
        <TextInput
          style={[styles.textArea]}
          value={formData.description}
          onChangeText={(text) => updateField('description', text)}
          placeholder="Your motivation..."
          placeholderTextColor={styles.placeholder.color}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
        <SmartHint type="info" message="Goals with clear 'why' are 60% more likely to succeed" />
      </View>
    </View>
  );

  // Step 2: How to Measure
  const renderStep2 = () => {
    const isFinancial = formData.goalType === 'financial';

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>How will you track it?</Text>

        {isFinancial ? (
          <>
            {/* Finance Mode */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Goal Type</Text>
              <View style={styles.chipRow}>
                {FINANCE_MODES.map((mode) => (
                  <Pressable
                    key={mode.id}
                    style={[styles.chip, formData.financeMode === mode.id && styles.chipSelected]}
                    onPress={() => updateField('financeMode', mode.id)}
                  >
                    {renderIcon(mode.icon, 20, formData.financeMode === mode.id ? styles.chipLabelSelected.color : styles.chipLabel.color)}
                    <Text style={[styles.chipLabel, formData.financeMode === mode.id && styles.chipLabelSelected]}>
                      {mode.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Currency */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Currency</Text>
              <View style={styles.chipRow}>
                {AVAILABLE_FINANCE_CURRENCIES.map((curr) => (
                  <Pressable
                    key={curr}
                    style={[styles.chip, formData.currency === curr && styles.chipSelected]}
                    onPress={() => updateField('currency', curr)}
                  >
                    <Text style={[styles.chipLabel, formData.currency === curr && styles.chipLabelSelected]}>
                      {curr}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Current & Target Values */}
            <View style={styles.fieldContainer}>
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Current</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.currentValue.toString()}
                    onChangeText={(text) => updateField('currentValue', parseNumericInput(text))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={styles.placeholder.color}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Target *</Text>
                  <TextInput
                    style={[styles.input, errors.targetValue && styles.inputError]}
                    value={formData.targetValue.toString()}
                    onChangeText={(text) => updateField('targetValue', parseNumericInput(text))}
                    keyboardType="numeric"
                    placeholder="5000"
                    placeholderTextColor={styles.placeholder.color}
                  />
                </View>
              </View>
              {errors.targetValue && <Text style={styles.errorText}>{errors.targetValue}</Text>}
            </View>

            <SmartHint type="success" message="Progress will update automatically based on your transactions" />
          </>
        ) : (
          <>
            {/* Metric Kind */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>What will you measure?</Text>
              <View style={styles.chipRow}>
                {METRIC_OPTIONS.filter((m) => m.id !== 'amount').map((metric) => (
                  <Pressable
                    key={metric.id}
                    style={[styles.chip, formData.metricKind === metric.id && styles.chipSelected]}
                    onPress={() => updateField('metricKind', metric.id)}
                  >
                    {renderIcon(metric.icon, 20, formData.metricKind === metric.id ? styles.chipLabelSelected.color : styles.chipLabel.color)}
                    <Text style={[styles.chipLabel, formData.metricKind === metric.id && styles.chipLabelSelected]}>
                      {metric.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Unit (for count/duration) */}
            {(formData.metricKind === 'count' || formData.metricKind === 'duration') && (
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Unit</Text>
                <TextInput
                  style={styles.input}
                  value={formData.unit ?? ''}
                  onChangeText={(text) => updateField('unit', text)}
                  placeholder={formData.metricKind === 'count' ? 'workouts, books, km...' : 'hours, minutes...'}
                  placeholderTextColor={styles.placeholder.color}
                />
              </View>
            )}

            {/* Current & Target Values */}
            <View style={styles.fieldContainer}>
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Current</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.currentValue.toString()}
                    onChangeText={(text) => updateField('currentValue', parseNumericInput(text))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={styles.placeholder.color}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Target *</Text>
                  <TextInput
                    style={[styles.input, errors.targetValue && styles.inputError]}
                    value={formData.targetValue.toString()}
                    onChangeText={(text) => updateField('targetValue', parseNumericInput(text))}
                    keyboardType="numeric"
                    placeholder="100"
                    placeholderTextColor={styles.placeholder.color}
                  />
                </View>
              </View>
              {errors.targetValue && <Text style={styles.errorText}>{errors.targetValue}</Text>}
            </View>
          </>
        )}
      </View>
    );
  };

  // Step 3: When
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>When do you want to achieve this?</Text>

      {/* Deadline */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Deadline (optional)</Text>
        <Pressable
          style={styles.dateButton}
          onPress={() => openDatePicker({ type: 'due' })}
        >
          <Calendar size={20} color={styles.dateButtonText.color} />
          <Text style={styles.dateButtonText}>
            {formData.targetDate ? formData.targetDate.toLocaleDateString(locale) : 'Select date'}
          </Text>
        </Pressable>
        <SmartHint type="tip" message="Goals with deadlines are 42% more successful" />
      </View>

      {/* Quick presets */}
      {!formData.targetDate && (
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Quick select</Text>
          <View style={styles.chipRow}>
            <Pressable style={styles.chip} onPress={() => updateField('targetDate', addMonths(new Date(), 1))}>
              <Text style={styles.chipLabel}>1 month</Text>
            </Pressable>
            <Pressable style={styles.chip} onPress={() => updateField('targetDate', addMonths(new Date(), 3))}>
              <Text style={styles.chipLabel}>3 months</Text>
            </Pressable>
            <Pressable style={styles.chip} onPress={() => updateField('targetDate', addMonths(new Date(), 6))}>
              <Text style={styles.chipLabel}>6 months</Text>
            </Pressable>
            <Pressable style={styles.chip} onPress={() => updateField('targetDate', addYears(new Date(), 1))}>
              <Text style={styles.chipLabel}>1 year</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Milestones */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Milestones (optional)</Text>
        {formData.milestones.map((milestone, index) => (
          <View key={milestone.id} style={styles.milestoneItem}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={milestone.title}
              onChangeText={(text) => updateMilestone(milestone.id, { title: text })}
              placeholder={`Milestone ${index + 1}`}
              placeholderTextColor={styles.placeholder.color}
            />
            <Pressable onPress={() => removeMilestone(milestone.id)}>
              <Trash2 size={20} color={styles.deleteIcon.color} />
            </Pressable>
          </View>
        ))}
        <Pressable style={styles.addButton} onPress={addMilestone}>
          <PlusCircle size={20} color={styles.addButtonText.color} />
          <Text style={styles.addButtonText}>Add milestone</Text>
        </Pressable>
      </View>
    </View>
  );

  // Step 4: Connect
  const renderStep4 = () => {
    const isFinancial = formData.goalType === 'financial';
    const isSaveMode = formData.financeMode === 'save';
    const isDebtMode = formData.financeMode === 'debt_close';
    const isSpendMode = formData.financeMode === 'spend';

    // Filter budgets and debts
    const activeBudgets = budgets.filter((b) => !b.isArchived);
    const activeDebts = debts.filter((d) => d.status === 'active');

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Connect to finances (optional)</Text>
        <Text style={styles.stepSubtitle}>Link to budgets or debts to track progress automatically</Text>

        {isFinancial ? (
          <>
            {/* Save mode: Link to budget */}
            {isSaveMode && (
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Link to savings budget</Text>
                {activeBudgets.length > 0 ? (
                  <View style={styles.listContainer}>
                    <Pressable
                      style={[styles.listItem, !formData.linkedBudgetId && styles.listItemSelected]}
                      onPress={() => updateField('linkedBudgetId', undefined)}
                    >
                      {!formData.linkedBudgetId ? (
                        <CircleDot size={20} color={styles.primaryColor.color} />
                      ) : (
                        <Circle size={20} color={styles.textSecondary.color} />
                      )}
                      <Text style={styles.listItemText}>No budget</Text>
                    </Pressable>
                    {activeBudgets.map((budget) => (
                      <Pressable
                        key={budget.id}
                        style={[styles.listItem, formData.linkedBudgetId === budget.id && styles.listItemSelected]}
                        onPress={() => updateField('linkedBudgetId', budget.id)}
                      >
                        {formData.linkedBudgetId === budget.id ? (
                          <CircleDot size={20} color={styles.primaryColor.color} />
                        ) : (
                          <Circle size={20} color={styles.textSecondary.color} />
                        )}
                        <View style={styles.listItemContent}>
                          <Text style={styles.listItemText}>{budget.name}</Text>
                          <Text style={styles.listItemSubtext}>
                            {budget.currency} {budget.spentAmount.toFixed(2)} / {budget.limitAmount.toFixed(2)}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <SmartHint type="info" message="No budgets available. Create one in Finance tab." />
                )}
              </View>
            )}

            {/* Debt mode: Link to debt */}
            {isDebtMode && (
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Which debt are you paying off?</Text>
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
                      <Text style={styles.listItemText}>No debt</Text>
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
                  <SmartHint type="info" message="No active debts. Create one in Finance tab." />
                )}
                <SmartHint type="success" message="Progress updates automatically when you make payments" />
              </View>
            )}

            {/* Spend mode: Link to budget */}
            {isSpendMode && (
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Link to budget category</Text>
                {activeBudgets.length > 0 ? (
                  <View style={styles.listContainer}>
                    <Pressable
                      style={[styles.listItem, !formData.linkedBudgetId && styles.listItemSelected]}
                      onPress={() => updateField('linkedBudgetId', undefined)}
                    >
                      {!formData.linkedBudgetId ? (
                        <CircleDot size={20} color={styles.primaryColor.color} />
                      ) : (
                        <Circle size={20} color={styles.textSecondary.color} />
                      )}
                      <Text style={styles.listItemText}>No budget</Text>
                    </Pressable>
                    {activeBudgets.map((budget) => (
                      <Pressable
                        key={budget.id}
                        style={[styles.listItem, formData.linkedBudgetId === budget.id && styles.listItemSelected]}
                        onPress={() => updateField('linkedBudgetId', budget.id)}
                      >
                        {formData.linkedBudgetId === budget.id ? (
                          <CircleDot size={20} color={styles.primaryColor.color} />
                        ) : (
                          <Circle size={20} color={styles.textSecondary.color} />
                        )}
                        <View style={styles.listItemContent}>
                          <Text style={styles.listItemText}>{budget.name}</Text>
                          <Text style={styles.listItemSubtext}>
                            {budget.currency} {budget.spentAmount.toFixed(2)} / {budget.limitAmount.toFixed(2)}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <SmartHint type="info" message="No budgets available. Create one in Finance tab." />
                )}
              </View>
            )}
          </>
        ) : (
          <SmartHint
            type="info"
            message="Finance linking is only available for financial goals. You can add habits and tasks later from the goal details screen."
          />
        )}
      </View>
    );
  };

  // Render
  return (
    <CustomModal
      ref={modalRef}
      variant="form"
      enableDynamicSizing={false}
      fallbackSnapPoint="96%"
      onDismiss={() => {
        closePlannerGoalModal();
        // Reset form when dismissed via swipe/backdrop
        setFormData({
          title: '',
          goalType: 'financial',
          description: '',
          metricKind: 'amount',
          currency: baseCurrency,
          currentValue: 0,
          targetValue: 0,
          milestones: [],
          linkedHabitIds: [],
          linkedTaskIds: [],
        });
        setCurrentStep(1);
        setErrors({});
      }}
    >
      <View style={styles.container}>
        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} totalSteps={4} steps={WIZARD_STEPS} />

        {/* Step Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.footer}>
          {currentStep > 1 && (
            <Pressable style={[styles.button, styles.buttonSecondary]} onPress={goToPreviousStep}>
              <Text style={styles.buttonSecondaryText}>Back</Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.button, styles.buttonPrimary, currentStep === 1 && styles.buttonPrimaryFull]}
            onPress={goToNextStep}
          >
            <Text style={styles.buttonPrimaryText}>{currentStep < 4 ? 'Next →' : 'Create Goal'}</Text>
          </Pressable>
        </View>

        {/* Date Picker (iOS) */}
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
              <Text style={styles.datePickerDoneText}>Done</Text>
            </Pressable>
          </View>
        )}
      </View>
    </CustomModal>
  );
};

// Styles
const useStyles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  stepContainer: {
    gap: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginTop: -12,
    marginBottom: 8,
  },
  fieldContainer: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  textArea: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 14,
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
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipIcon: {
    fontSize: 16,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  chipLabelSelected: {
    color: '#FFFFFF',
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
    gap: 10,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 14,
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
    gap: 10,
  },
  deleteIcon: {
    color: theme.colors.danger,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  comingSoonText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginLeft: 8,
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  listItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
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
    paddingTop: 20,
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

export const GoalModal = forwardRef<GoalModalHandle>(GoalModalComponent);
export default GoalModal;
