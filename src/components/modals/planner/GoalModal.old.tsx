import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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
import { Ionicons } from '@expo/vector-icons';
import { useShallow } from 'zustand/react/shallow';

import CustomModal, { CustomModalProps } from '@/components/modals/CustomModal';
import { BottomSheetHandle } from '@/components/modals/BottomSheet';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useModalStore } from '@/stores/useModalStore';
import { useLocalization } from '@/localization/useLocalization';
import type { GoalModalScenarioKey } from '@/localization/strings';
import type { FinanceMode, Goal, GoalType, MetricKind } from '@/domain/planner/types';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import {
  AVAILABLE_FINANCE_CURRENCIES,
  type FinanceCurrency,
  useFinancePreferencesStore,
} from '@/stores/useFinancePreferencesStore';

const modalProps: Partial<CustomModalProps> = {
  variant: 'form',
  enableDynamicSizing: false,
  fallbackSnapPoint: '96%',
  scrollable: true,
  scrollProps: { keyboardShouldPersistTaps: 'handled' },
  contentContainerStyle: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
};

type GoalTemplate = {
  id: string;
  title: string;
  emoji: string;
  goalType: GoalType;
  metricKind: MetricKind;
  financeMode?: FinanceMode;
  defaultUnit?: string;
  recommendedPercents?: number[];
  targetValue?: number;
  description?: string;
};

type MilestoneFormValue = {
  id: string;
  title: string;
  percent: number;
  dueDate?: Date;
};

type DatePickerTarget = { type: 'start' } | { type: 'due' } | { type: 'milestone'; id: string };

type UnitDefinition = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: 'time' | 'distance' | 'weight' | 'volume' | 'count' | 'other';
  metricTypes: MetricKind[];
  goalTypes?: GoalType[];
};

// Professional Unit System (based on Strides, Way of Life, Notion)
const UNIT_DEFINITIONS: UnitDefinition[] = [
  // Time units
  { id: 'minutes', label: 'Minutes', icon: 'time-outline', category: 'time', metricTypes: ['duration'] },
  { id: 'hours', label: 'Hours', icon: 'hourglass-outline', category: 'time', metricTypes: ['duration'] },
  { id: 'days', label: 'Days', icon: 'calendar-outline', category: 'time', metricTypes: ['duration'] },
  { id: 'weeks', label: 'Weeks', icon: 'calendar-number-outline', category: 'time', metricTypes: ['duration'] },
  { id: 'months', label: 'Months', icon: 'calendar-clear-outline', category: 'time', metricTypes: ['duration'] },
  
  // Distance units
  { id: 'km', label: 'Kilometers', icon: 'map-outline', category: 'distance', metricTypes: ['count'], goalTypes: ['health'] },
  { id: 'miles', label: 'Miles', icon: 'navigate-outline', category: 'distance', metricTypes: ['count'], goalTypes: ['health'] },
  { id: 'meters', label: 'Meters', icon: 'trending-up-outline', category: 'distance', metricTypes: ['count'], goalTypes: ['health'] },
  { id: 'steps', label: 'Steps', icon: 'footsteps-outline', category: 'distance', metricTypes: ['count'], goalTypes: ['health'] },
  
  // Weight units
  { id: 'kg', label: 'Kilograms', icon: 'barbell-outline', category: 'weight', metricTypes: ['count'], goalTypes: ['health'] },
  { id: 'lbs', label: 'Pounds', icon: 'scale-outline', category: 'weight', metricTypes: ['count'], goalTypes: ['health'] },
  { id: 'grams', label: 'Grams', icon: 'nutrition-outline', category: 'weight', metricTypes: ['count'] },
  
  // Volume units
  { id: 'liters', label: 'Liters', icon: 'water-outline', category: 'volume', metricTypes: ['count'], goalTypes: ['health'] },
  { id: 'ml', label: 'Milliliters', icon: 'flask-outline', category: 'volume', metricTypes: ['count'], goalTypes: ['health'] },
  { id: 'cups', label: 'Cups', icon: 'cafe-outline', category: 'volume', metricTypes: ['count'], goalTypes: ['health'] },
  { id: 'glasses', label: 'Glasses', icon: 'beaker-outline', category: 'volume', metricTypes: ['count'], goalTypes: ['health'] },
  
  // Count units (universal)
  { id: 'times', label: 'Times', icon: 'repeat-outline', category: 'count', metricTypes: ['count'] },
  { id: 'reps', label: 'Reps', icon: 'fitness-outline', category: 'count', metricTypes: ['count'], goalTypes: ['health'] },
  { id: 'sets', label: 'Sets', icon: 'list-outline', category: 'count', metricTypes: ['count'], goalTypes: ['health'] },
  { id: 'sessions', label: 'Sessions', icon: 'timer-outline', category: 'count', metricTypes: ['count', 'duration'] },
  { id: 'workouts', label: 'Workouts', icon: 'barbell-outline', category: 'count', metricTypes: ['count'], goalTypes: ['health'] },
  { id: 'calories', label: 'Calories', icon: 'flame-outline', category: 'count', metricTypes: ['count'], goalTypes: ['health'] },
  
  // Education/Work units
  { id: 'pages', label: 'Pages', icon: 'document-text-outline', category: 'count', metricTypes: ['count'], goalTypes: ['education'] },
  { id: 'books', label: 'Books', icon: 'book-outline', category: 'count', metricTypes: ['count'], goalTypes: ['education'] },
  { id: 'chapters', label: 'Chapters', icon: 'reader-outline', category: 'count', metricTypes: ['count'], goalTypes: ['education'] },
  { id: 'lessons', label: 'Lessons', icon: 'school-outline', category: 'count', metricTypes: ['count'], goalTypes: ['education'] },
  { id: 'courses', label: 'Courses', icon: 'library-outline', category: 'count', metricTypes: ['count'], goalTypes: ['education'] },
  { id: 'tasks', label: 'Tasks', icon: 'checkmark-done-outline', category: 'count', metricTypes: ['count'], goalTypes: ['productivity'] },
  { id: 'projects', label: 'Projects', icon: 'briefcase-outline', category: 'count', metricTypes: ['count'], goalTypes: ['productivity'] },
  
  // Other/Abstract
  { id: 'points', label: 'Points', icon: 'star-outline', category: 'other', metricTypes: ['count', 'custom'] },
  { id: 'score', label: 'Score', icon: 'trophy-outline', category: 'other', metricTypes: ['count', 'custom'] },
  { id: 'level', label: 'Level', icon: 'stats-chart-outline', category: 'other', metricTypes: ['count', 'custom'] },
  { id: 'percent', label: 'Percent', icon: 'pie-chart-outline', category: 'other', metricTypes: ['count', 'custom'] },
];

// Universal Goal Templates
const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: 'emergency-fund',
    title: 'Emergency Fund',
    emoji: '🛡️',
    goalType: 'financial',
    metricKind: 'amount',
    financeMode: 'save',
    targetValue: 10000,
    description: '6 months of expenses',
    recommendedPercents: [25, 50, 75],
  },
  {
    id: 'debt-free',
    title: 'Debt Free',
    emoji: '💳',
    goalType: 'financial',
    metricKind: 'amount',
    financeMode: 'debt_close',
    recommendedPercents: [25, 50, 75, 90],
  },
  {
    id: 'save-vacation',
    title: 'Save for Vacation',
    emoji: '✈️',
    goalType: 'financial',
    metricKind: 'amount',
    financeMode: 'save',
    targetValue: 3000,
    recommendedPercents: [50, 100],
  },
  {
    id: 'spend-guardrails',
    title: 'Spending guardrails',
    emoji: '🧾',
    goalType: 'financial',
    metricKind: 'amount',
    financeMode: 'spend',
    targetValue: 1200,
    description: 'Control discretionary categories',
    recommendedPercents: [50, 75, 100],
  },
  {
    id: 'fitness-target',
    title: 'Fitness Goal',
    emoji: '💪',
    goalType: 'health',
    metricKind: 'count',
    defaultUnit: 'workouts',
    targetValue: 100,
    recommendedPercents: [25, 50, 75],
  },
  {
    id: 'weight-loss',
    title: 'Weight Loss',
    emoji: '⚖️',
    goalType: 'health',
    metricKind: 'count',
    defaultUnit: 'kg',
    targetValue: 10,
    recommendedPercents: [30, 60, 90],
  },
  {
    id: 'learn-skill',
    title: 'Learn New Skill',
    emoji: '📚',
    goalType: 'education',
    metricKind: 'duration',
    defaultUnit: 'hours',
    targetValue: 100,
    description: 'Master a new skill',
    recommendedPercents: [25, 50, 100],
  },
  {
    id: 'read-books',
    title: 'Read Books',
    emoji: '📖',
    goalType: 'education',
    metricKind: 'count',
    defaultUnit: 'books',
    targetValue: 24,
    recommendedPercents: [25, 50, 75],
  },
  {
    id: 'career-promotion',
    title: 'Career Goal',
    emoji: '🎯',
    goalType: 'productivity',
    metricKind: 'custom',
    description: 'Achieve next level',
  },
  {
    id: 'side-project',
    title: 'Side Project',
    emoji: '🚀',
    goalType: 'productivity',
    metricKind: 'count',
    defaultUnit: 'tasks',
    targetValue: 50,
    recommendedPercents: [25, 50, 75, 100],
  },
  {
    id: 'meditation-practice',
    title: 'Meditation Practice',
    emoji: '🧘',
    goalType: 'personal',
    metricKind: 'duration',
    defaultUnit: 'hours',
    targetValue: 50,
    recommendedPercents: [30, 60, 90],
  },
];

const SCENARIO_TEMPLATE_MAP: Record<GoalModalScenarioKey, string | null> = {
  financialSave: 'emergency-fund',
  financialSpend: 'spend-guardrails',
  habitSupport: 'fitness-target',
  skillGrowth: 'learn-skill',
  custom: null,
};

const TEMPLATE_SCENARIO_MAP = Object.entries(SCENARIO_TEMPLATE_MAP).reduce<Record<string, GoalModalScenarioKey>>(
  (acc, [scenario, templateId]) => {
    if (templateId) {
      acc[templateId] = scenario as GoalModalScenarioKey;
    }
    return acc;
  },
  {},
);

const SCENARIO_ICONS: Record<GoalModalScenarioKey, string> = {
  financialSave: '💰',
  financialSpend: '🧾',
  habitSupport: '💪',
  skillGrowth: '📚',
  custom: '✨',
};

const SCENARIO_ORDER: GoalModalScenarioKey[] = ['financialSave', 'financialSpend', 'habitSupport', 'skillGrowth', 'custom'];

type GoalModalMetricOption = 'amount' | 'count' | 'duration' | 'custom';

const METRIC_OPTIONS: { id: GoalModalMetricOption; label: string; icon: string; description: string }[] = [
  { id: 'amount', label: 'Money', icon: '💰', description: 'Financial goals' },
  { id: 'count', label: 'Number', icon: '🔢', description: 'Count-based' },
  { id: 'duration', label: 'Time', icon: '⏱️', description: 'Time-based' },
  { id: 'custom', label: 'Custom', icon: '⚙️', description: 'Your metric' },
];

const FINANCE_MODES: { id: FinanceMode; label: string; icon: string }[] = [
  { id: 'save', label: 'Save', icon: '💵' },
  { id: 'spend', label: 'Budget', icon: '🛍️' },
  { id: 'debt_close', label: 'Pay Off', icon: '💳' },
];

const GOAL_TYPES: { id: GoalType; label: string; icon: string }[] = [
  { id: 'financial', label: 'Financial', icon: '💰' },
  { id: 'health', label: 'Health', icon: '❤️' },
  { id: 'education', label: 'Learning', icon: '📚' },
  { id: 'productivity', label: 'Career', icon: '💼' },
  { id: 'personal', label: 'Personal', icon: '🎯' },
];

const UNIT_CATEGORIES = [
  { id: 'time', label: 'Time', icon: 'time-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'distance', label: 'Distance', icon: 'map-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'weight', label: 'Weight', icon: 'barbell-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'volume', label: 'Volume', icon: 'water-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'count', label: 'General', icon: 'apps-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' as keyof typeof Ionicons.glyphMap },
];

const clampPercent = (value: number) => Math.min(Math.max(value, 0), 1);

const parseNumericInput = (value: string) => {
  if (!value.trim()) return undefined;
  const normalized = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const generateMilestoneId = () => `goal-ms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const formatMilestonePercent = (value: number) => Math.max(1, Math.min(100, Math.round(value)));

// PL-10: Auto-plan suggestions
type HabitSuggestion = {
  id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly';
  icon: string;
};

type TaskSuggestion = {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
};

const HABIT_SUGGESTIONS: Record<GoalType, HabitSuggestion[]> = {
  financial: [
    { id: 'h1', title: 'Daily Budget Check', description: 'Review spending every morning', frequency: 'daily', icon: '💰' },
    { id: 'h2', title: 'No Impulse Buying', description: '24h rule before purchases', frequency: 'daily', icon: '🛡️' },
    { id: 'h3', title: 'Save Receipt', description: 'Track all transactions', frequency: 'daily', icon: '🧾' },
  ],
  health: [
    { id: 'h4', title: 'Morning Exercise', description: '30 min workout', frequency: 'daily', icon: '💪' },
    { id: 'h5', title: 'Water Intake', description: 'Drink 8 glasses', frequency: 'daily', icon: '💧' },
    { id: 'h6', title: 'Meal Prep', description: 'Prepare healthy meals', frequency: 'weekly', icon: '🥗' },
  ],
  education: [
    { id: 'h7', title: 'Daily Reading', description: 'Read 30 minutes', frequency: 'daily', icon: '📚' },
    { id: 'h8', title: 'Practice Skills', description: 'Apply what you learned', frequency: 'daily', icon: '🎯' },
    { id: 'h9', title: 'Take Notes', description: 'Document key insights', frequency: 'daily', icon: '📝' },
  ],
  productivity: [
    { id: 'h10', title: 'Deep Work Block', description: '2h focused work', frequency: 'daily', icon: '🧠' },
    { id: 'h11', title: 'Weekly Review', description: 'Plan next week', frequency: 'weekly', icon: '📊' },
    { id: 'h12', title: 'Daily Planning', description: 'Set 3 key tasks', frequency: 'daily', icon: '✅' },
  ],
  personal: [
    { id: 'h13', title: 'Meditation', description: '10 min mindfulness', frequency: 'daily', icon: '🧘' },
    { id: 'h14', title: 'Journaling', description: 'Reflect on your day', frequency: 'daily', icon: '📔' },
    { id: 'h15', title: 'Gratitude Practice', description: 'List 3 things', frequency: 'daily', icon: '🙏' },
  ],
};

const TASK_SUGGESTIONS: Record<GoalType, TaskSuggestion[]> = {
  financial: [
    { id: 't1', title: 'Set up budget', description: 'Create monthly budget plan', priority: 'high', icon: '📊' },
    { id: 't2', title: 'Review expenses', description: 'Analyze last month spending', priority: 'medium', icon: '🔍' },
    { id: 't3', title: 'Automate savings', description: 'Set up auto-transfer', priority: 'high', icon: '🤖' },
  ],
  health: [
    { id: 't4', title: 'Create workout plan', description: 'Design weekly routine', priority: 'high', icon: '📝' },
    { id: 't5', title: 'Schedule check-up', description: 'Book health appointment', priority: 'medium', icon: '🏥' },
    { id: 't6', title: 'Buy equipment', description: 'Get necessary gear', priority: 'low', icon: '🛒' },
  ],
  education: [
    { id: 't7', title: 'Enroll in course', description: 'Sign up for learning', priority: 'high', icon: '🎓' },
    { id: 't8', title: 'Get materials', description: 'Buy books/resources', priority: 'medium', icon: '📚' },
    { id: 't9', title: 'Set study schedule', description: 'Plan learning time', priority: 'high', icon: '📅' },
  ],
  productivity: [
    { id: 't10', title: 'Break down project', description: 'Create task list', priority: 'high', icon: '📋' },
    { id: 't11', title: 'Setup workspace', description: 'Organize environment', priority: 'medium', icon: '🖥️' },
    { id: 't12', title: 'Define milestones', description: 'Set checkpoints', priority: 'high', icon: '🎯' },
  ],
  personal: [
    { id: 't13', title: 'Define vision', description: 'Clarify your goal', priority: 'high', icon: '🌟' },
    { id: 't14', title: 'Find accountability', description: 'Get support buddy', priority: 'medium', icon: '🤝' },
    { id: 't15', title: 'Track progress', description: 'Set up measurement', priority: 'medium', icon: '📈' },
  ],
};

export default function PlannerGoalModal() {
  const { plannerGoalModal, closePlannerGoalModal } = useModalStore(
    useShallow((state) => ({
      plannerGoalModal: state.plannerGoalModal,
      closePlannerGoalModal: state.closePlannerGoalModal,
    })),
  );
  const modalRef = useRef<BottomSheetHandle>(null);
  const hasHydratedRef = useRef(false);
  const { strings, locale } = useLocalization();
  const modalStrings = strings.plannerModals.goal;
  const sectionTimelineStrings = modalStrings.timelineSection;
  const measurementStrings = modalStrings.measurementSection;
  const scenarioStrings = modalStrings.scenarios;
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }),
    [locale],
  );
  const baseCurrency = useFinancePreferencesStore((state) => state.baseCurrency);
  const { goals, createGoal, updateGoal } = usePlannerDomainStore(
    useShallow((state) => ({
      goals: state.goals,
      createGoal: state.createGoal,
      updateGoal: state.updateGoal,
    })),
  );

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('financial');
  const [metricKind, setMetricKind] = useState<MetricKind>('amount');
  const [currentValueText, setCurrentValueText] = useState('');
  const [targetValueText, setTargetValueText] = useState('');
  const [unit, setUnit] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [showCustomUnit, setShowCustomUnit] = useState(false);
  const [currency, setCurrency] = useState<FinanceCurrency>(baseCurrency);
  const [financeMode, setFinanceMode] = useState<FinanceMode>('save');

  // Auto-plan state (PL-10: Create and more)
  const [showAutoPlan, setShowAutoPlan] = useState(false);
  const [createdGoalId, setCreatedGoalId] = useState<string | null>(null);
  const [selectedHabits, setSelectedHabits] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [milestones, setMilestones] = useState<MilestoneFormValue[]>([]);
  const [pickerState, setPickerState] = useState<{ target: DatePickerTarget; value: Date } | null>(null);
  const [errorKey, setErrorKey] = useState<keyof typeof modalStrings.alerts | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<GoalModalScenarioKey>('custom');

  const currencyOptions = useMemo(() => {
    const ordered = new Set<FinanceCurrency>([baseCurrency, ...AVAILABLE_FINANCE_CURRENCIES]);
    return Array.from(ordered);
  }, [baseCurrency]);

  const scenarioEntries = useMemo(
    () => SCENARIO_ORDER.map((key) => ({ key, ...scenarioStrings[key] })),
    [scenarioStrings],
  );

  const isEditing = plannerGoalModal.mode === 'edit' && !!editingGoalId;

  // Smart unit filtering based on context
  const availableUnits = useMemo(() => {
    return UNIT_DEFINITIONS.filter(unitDef => {
      // Filter by metric type
      if (!unitDef.metricTypes.includes(metricKind)) {
        return false;
      }
      
      // If unit has specific goal types, check if current goal type matches
      if (unitDef.goalTypes && unitDef.goalTypes.length > 0) {
        return unitDef.goalTypes.includes(goalType);
      }
      
      return true;
    });
  }, [metricKind, goalType]);

  // Group units by category for better UX
  const unitsByCategory = useMemo(() => {
    const grouped = new Map<string, UnitDefinition[]>();
    
    availableUnits.forEach(unit => {
      const category = unit.category;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(unit);
    });
    
    return grouped;
  }, [availableUnits]);

  // Get smart default unit based on context
  const getSmartDefaultUnit = useCallback((metric: MetricKind, goal: GoalType): string => {
    switch (metric) {
      case 'duration':
        return 'hours';
      case 'amount':
        return '';
      case 'count':
        if (goal === 'health') {
          return 'workouts';
        }
        if (goal === 'education') {
          return 'books';
        }
        if (goal === 'productivity') {
          return 'tasks';
        }
        return 'times';
      case 'weight':
      case 'none':
      case 'custom':
        return 'times';
      default:
        return 'times';
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      if (plannerGoalModal.isOpen) {
        closePlannerGoalModal();
      }
      return;
    }

    if (plannerGoalModal.isOpen) {
      modalRef.current?.present();
    } else {
      modalRef.current?.dismiss();
    }
  }, [closePlannerGoalModal, plannerGoalModal.isOpen]);

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setGoalType('financial');
    setMetricKind('amount');
    setCurrentValueText('');
    setTargetValueText('');
    setUnit('');
    setCustomUnit('');
    setShowCustomUnit(false);
    setCurrency(baseCurrency);
    setFinanceMode('save');
    setStartDate(undefined);
    setTargetDate(undefined);
    setMilestones([]);
    setPickerState(null);
    setErrorKey(null);
    setEditingGoalId(null);
    setSelectedScenario('custom');
  }, [baseCurrency]);

  useEffect(() => {
    if (!plannerGoalModal.isOpen) {
      resetForm();
    }
  }, [plannerGoalModal.isOpen, resetForm]);

  const resolveScenarioIdFromGoal = useCallback((goal: Goal): GoalModalScenarioKey => {
    const scenarios: {
      id: GoalModalScenarioKey;
      goalType: GoalType;
      metricKind: MetricKind;
      financeMode?: FinanceMode;
    }[] = [
      { id: 'financialSave', goalType: 'financial', metricKind: 'amount', financeMode: 'save' },
      { id: 'financialSpend', goalType: 'financial', metricKind: 'amount', financeMode: 'spend' },
      { id: 'habitSupport', goalType: 'health', metricKind: 'count', financeMode: undefined },
      { id: 'skillGrowth', goalType: 'education', metricKind: 'duration', financeMode: undefined },
      { id: 'custom', goalType: 'personal', metricKind: 'custom', financeMode: undefined },
    ];

    const match = scenarios.find(
      (scenario) =>
        scenario.goalType === goal.goalType &&
        scenario.metricKind === goal.metricType &&
        (scenario.financeMode === undefined || scenario.financeMode === goal.financeMode)
    );
    return (match?.id ?? 'custom') as GoalModalScenarioKey;
  }, []);

  useEffect(() => {
    if (!plannerGoalModal.isOpen || plannerGoalModal.mode !== 'edit' || !plannerGoalModal.goalId) {
      return;
    }
    const existing = goals.find((goal) => goal.id === plannerGoalModal.goalId);
    if (!existing) return;

    setEditingGoalId(existing.id);
    setTitle(existing.title);
    setDescription(existing.description ?? '');
    setGoalType(existing.goalType);
    setMetricKind(existing.metricType);
    setFinanceMode(existing.financeMode ?? 'save');
    setCurrency((existing.currency as FinanceCurrency) ?? baseCurrency);
    
    // Handle unit - check if it's a predefined unit or custom
    const existingUnit = existing.unit ?? '';
    const predefinedUnit = UNIT_DEFINITIONS.find(u => u.id === existingUnit);
    
    if (predefinedUnit) {
      setUnit(existingUnit);
      setShowCustomUnit(false);
      setCustomUnit('');
    } else if (existingUnit) {
      setUnit('custom');
      setCustomUnit(existingUnit);
      setShowCustomUnit(true);
    } else {
      setUnit('');
      setShowCustomUnit(false);
      setCustomUnit('');
    }
    
    setCurrentValueText(
      existing.initialValue != null && Number.isFinite(existing.initialValue)
        ? String(existing.initialValue)
        : '',
    );
    setTargetValueText(
      existing.targetValue != null && Number.isFinite(existing.targetValue)
        ? String(existing.targetValue)
        : '',
    );
    setStartDate(existing.startDate ? new Date(existing.startDate) : undefined);
    setTargetDate(existing.targetDate ? new Date(existing.targetDate) : undefined);
    setMilestones(
      (existing.milestones ?? []).map((milestone) => ({
        id: milestone.id,
        title: milestone.title,
        percent: formatMilestonePercent((milestone.targetPercent ?? 0) * 100),
        dueDate: milestone.dueDate ? new Date(milestone.dueDate) : undefined,
      })),
    );
    setErrorKey(null);
    setSelectedScenario(resolveScenarioIdFromGoal(existing));
  }, [baseCurrency, goals, plannerGoalModal.goalId, plannerGoalModal.isOpen, plannerGoalModal.mode, resolveScenarioIdFromGoal]);

  const applyTemplate = useCallback((template: GoalTemplate, scenarioOverride?: GoalModalScenarioKey) => {
    setSelectedScenario(scenarioOverride ?? TEMPLATE_SCENARIO_MAP[template.id] ?? 'custom');
    setTitle(template.title);
    setDescription(template.description ?? '');
    setGoalType(template.goalType);
    setMetricKind(template.metricKind);

    if (template.financeMode) {
      setFinanceMode(template.financeMode);
    }

    if (template.defaultUnit) {
      setUnit(template.defaultUnit);
      setShowCustomUnit(false);
      setCustomUnit('');
    }

    if (template.targetValue) {
      setTargetValueText(String(template.targetValue));
    }

    if (template.recommendedPercents && template.recommendedPercents.length > 0) {
      setMilestones(
        template.recommendedPercents.map((percent) => ({
          id: generateMilestoneId(),
          title: `${percent}% Complete`,
          percent,
        })),
      );
    }
  }, []);

  const handleMetricChange = useCallback((kind: MetricKind) => {
    setMetricKind(kind);
    if (kind !== 'amount') {
      setFinanceMode('save');
      // Smart default unit
      const smartUnit = getSmartDefaultUnit(kind, goalType);
      setUnit(smartUnit);
      setShowCustomUnit(false);
      setCustomUnit('');
    } else {
      setCurrency((prev) => prev || baseCurrency);
      setUnit('');
    }
  }, [baseCurrency, getSmartDefaultUnit, goalType]);

  const handleGoalTypeChange = useCallback((type: GoalType) => {
    setGoalType(type);
    // Update unit if metric kind is not amount
    if (metricKind !== 'amount') {
      const smartUnit = getSmartDefaultUnit(metricKind, type);
      setUnit(smartUnit);
      setShowCustomUnit(false);
      setCustomUnit('');
    }
  }, [getSmartDefaultUnit, metricKind]);

  const handleScenarioSelect = useCallback(
    (scenario: GoalModalScenarioKey) => {
      setSelectedScenario(scenario);
      const templateId = SCENARIO_TEMPLATE_MAP[scenario];
      if (templateId) {
        const template = GOAL_TEMPLATES.find((item) => item.id === templateId);
        if (template) {
          applyTemplate(template, scenario);
        }
      }
    },
    [applyTemplate],
  );

  const handleAddMilestone = useCallback(() => {
    const lastPercent = milestones[milestones.length - 1]?.percent ?? 0;
    const nextPercent = formatMilestonePercent(lastPercent + 25);
    setMilestones((prev) => [
      ...prev, 
      { 
        id: generateMilestoneId(), 
        title: `${nextPercent}% Complete`, 
        percent: nextPercent 
      }
    ]);
  }, [milestones]);

  const handleUpdateMilestone = useCallback((id: string, updates: Partial<MilestoneFormValue>) => {
    setMilestones((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextPercent = updates.percent ?? item.percent;
        return {
          ...item,
          ...updates,
          percent: formatMilestonePercent(nextPercent),
        };
      }),
    );
  }, []);

  const handleRemoveMilestone = useCallback((id: string) => {
    setMilestones((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const applyDateValue = useCallback(
    (target: DatePickerTarget, value: Date) => {
      if (target.type === 'start') {
        setStartDate(value);
      } else if (target.type === 'due') {
        setTargetDate(value);
      } else {
        setMilestones((prev) =>
          prev.map((item) => (item.id === target.id ? { ...item, dueDate: value } : item)),
        );
      }
      setPickerState(null);
    },
    [],
  );

  const openDatePicker = useCallback(
    (target: DatePickerTarget) => {
      let currentValue: Date | undefined;
      if (target.type === 'start') {
        currentValue = startDate;
      } else if (target.type === 'due') {
        currentValue = targetDate;
      } else {
        currentValue = milestones.find((item) => item.id === target.id)?.dueDate;
      }
      const baseValue = currentValue ?? new Date();
      if (Platform.OS === 'android') {
        DateTimePickerAndroid.open({
          value: baseValue,
          mode: 'date',
          onChange: (event, selected) => {
            if (event.type === 'set' && selected) {
              applyDateValue(target, selected);
            }
          },
        });
        return;
      }
      setPickerState({ target, value: baseValue });
    },
    [applyDateValue, milestones, startDate, targetDate],
  );

  const handleIosPickerChange = useCallback(
    (event: DateTimePickerEvent, selected?: Date) => {
      if (event.type === 'dismissed') {
        setPickerState(null);
        return;
      }
      if (selected && pickerState) {
        applyDateValue(pickerState.target, selected);
      }
    },
    [applyDateValue, pickerState],
  );

  const formatDateLabel = useCallback(
    (date?: Date) => (date ? dateFormatter.format(date) : sectionTimelineStrings.noDate),
    [dateFormatter, sectionTimelineStrings.noDate],
  );

  const targetValue = parseNumericInput(targetValueText);
  const disablePrimary = !title.trim() || !targetValue || targetValue <= 0;

  const buildMilestonePayload = useCallback(
    () =>
      milestones
        .map((item) => ({
          id: item.id,
          title: item.title.trim() || `${formatMilestonePercent(item.percent)}%`,
          targetPercent: clampPercent(item.percent / 100),
          dueDate: item.dueDate?.toISOString(),
        }))
        .filter((item) => item.targetPercent > 0),
    [milestones],
  );

  const handleSubmit = useCallback(
    (options?: { keepOpen?: boolean; showAutoPlan?: boolean }) => {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        setErrorKey('missingTitle');
        return;
      }
      const parsedTarget = parseNumericInput(targetValueText);
      if (!parsedTarget || parsedTarget <= 0) {
        setErrorKey('invalidTarget');
        return;
      }
      const parsedCurrent = parseNumericInput(currentValueText) ?? 0;
      const progressPercent = clampPercent(parsedCurrent / parsedTarget);
      const stats: Goal['stats'] = {};
      if (metricKind === 'amount') {
        stats.financialProgressPercent = progressPercent;
      } else if (metricKind === 'count') {
        stats.tasksProgressPercent = progressPercent;
      } else {
        stats.habitsProgressPercent = progressPercent;
      }

      // Determine final unit value
      let finalUnit: string | undefined;
      if (metricKind === 'amount') {
        finalUnit = undefined;
      } else if (showCustomUnit) {
        finalUnit = customUnit.trim() || undefined;
      } else if (unit && unit !== 'custom') {
        finalUnit = unit;
      } else {
        finalUnit = undefined;
      }

      const payload = {
        userId: 'local-user',
        title: trimmedTitle,
        description: description.trim() || undefined,
        goalType,
        status: 'active' as const,
        metricType: metricKind,
        unit: finalUnit,
        initialValue: parsedCurrent,
        targetValue: parsedTarget,
        financeMode: metricKind === 'amount' ? financeMode : undefined,
        currency: metricKind === 'amount' ? currency : undefined,
        startDate: (startDate ?? new Date()).toISOString(),
        targetDate: targetDate?.toISOString(),
        milestones: buildMilestonePayload(),
        progressPercent,
        stats,
      } satisfies Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>;

      let newGoalId: string;
      if (isEditing && editingGoalId) {
        updateGoal(editingGoalId, payload);
        newGoalId = editingGoalId;
      } else {
        const newGoal = createGoal(payload);
        newGoalId = newGoal.id;
      }

      // PL-10: Show auto-plan after creating goal
      if (options?.showAutoPlan && !isEditing) {
        setCreatedGoalId(newGoalId);
        setShowAutoPlan(true);
        setTitle('');
        setDescription('');
        setCurrentValueText('');
        setTargetValueText('');
        setMilestones([]);
        setErrorKey(null);
        return;
      }

      if (options?.keepOpen && !isEditing) {
        setTitle('');
        setDescription('');
        setCurrentValueText('');
        setTargetValueText('');
        setMilestones([]);
        setErrorKey(null);
        return;
      }
      closePlannerGoalModal();
    },
    [
      buildMilestonePayload,
      closePlannerGoalModal,
      createGoal,
      currency,
      currentValueText,
      customUnit,
      description,
      editingGoalId,
      financeMode,
      goalType,
      isEditing,
      metricKind,
      showCustomUnit,
      startDate,
      targetDate,
      targetValueText,
      title,
      unit,
      updateGoal,
    ],
  );

  // PL-10: Auto-plan handlers
  const { createHabit, createTask } = usePlannerDomainStore(
    useShallow((state) => ({
      createHabit: state.createHabit,
      createTask: state.createTask,
    })),
  );

  const habitSuggestions = useMemo(() => HABIT_SUGGESTIONS[goalType].slice(0, 3), [goalType]);
  const taskSuggestions = useMemo(() => TASK_SUGGESTIONS[goalType].slice(0, 3), [goalType]);

  const handleToggleHabit = useCallback((habitId: string) => {
    setSelectedHabits((prev) => {
      const next = new Set(prev);
      if (next.has(habitId)) {
        next.delete(habitId);
      } else {
        next.add(habitId);
      }
      return next;
    });
  }, []);

  const handleToggleTask = useCallback((taskId: string) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const handleCreateSelected = useCallback(() => {
    if (!createdGoalId) return;

    // Create selected habits
    habitSuggestions
      .filter((h) => selectedHabits.has(h.id))
      .forEach((habit) => {
        createHabit({
          userId: 'local-user',
          title: habit.title,
          description: habit.description,
          goalId: createdGoalId,
          frequency: habit.frequency,
          completionMode: 'boolean',
          status: 'active',
          habitType: goalType === 'health' ? 'health' : 'productivity',
          completionHistory: [],
        });
      });

    // Create selected tasks
    taskSuggestions
      .filter((t) => selectedTasks.has(t.id))
      .forEach((task) => {
        createTask({
          userId: 'local-user',
          title: task.title,
          description: task.description,
          goalId: createdGoalId,
          priority: task.priority,
          context: 'personal',
        });
      });

    // Close modal
    setShowAutoPlan(false);
    setCreatedGoalId(null);
    setSelectedHabits(new Set());
    setSelectedTasks(new Set());
    closePlannerGoalModal();
  }, [
    closePlannerGoalModal,
    createdGoalId,
    createHabit,
    createTask,
    goalType,
    habitSuggestions,
    selectedHabits,
    selectedTasks,
    taskSuggestions,
  ]);

  const handleSkipAutoPlan = useCallback(() => {
    setShowAutoPlan(false);
    setCreatedGoalId(null);
    setSelectedHabits(new Set());
    setSelectedTasks(new Set());
    closePlannerGoalModal();
  }, [closePlannerGoalModal]);

  const renderMilestone = (milestone: MilestoneFormValue) => (
    <AdaptiveGlassView key={milestone.id} style={styles.milestoneCard}>
      <View style={styles.milestoneHeader}>
        <TextInput
          value={milestone.title}
          onChangeText={(text) => handleUpdateMilestone(milestone.id, { title: text })}
          placeholder={modalStrings.milestoneSection.title}
          placeholderTextColor="#7E8B9A"
          style={[styles.textInput, { flex: 1 }]}
        />
        <Pressable onPress={() => handleRemoveMilestone(milestone.id)} hitSlop={8}>
          <Ionicons name="trash-outline" size={18} color="#7E8B9A" />
        </Pressable>
      </View>
      <View style={styles.milestoneRow}>
        <View style={styles.milestoneColumn}>
          <Text style={styles.label}>{modalStrings.milestoneSection.percentLabel}</Text>
          <AdaptiveGlassView style={styles.milestoneInput}>
            <TextInput
              value={String(milestone.percent)}
              onChangeText={(text) => {
                const parsed = parseNumericInput(text) ?? 0;
                handleUpdateMilestone(milestone.id, { percent: formatMilestonePercent(parsed) });
              }}
              keyboardType="numeric"
              placeholder="%"
              placeholderTextColor="#7E8B9A"
              style={styles.textInput}
            />
          </AdaptiveGlassView>
        </View>
        <View style={styles.milestoneColumn}>
          <Text style={styles.label}>{modalStrings.milestoneSection.dueLabel}</Text>
          <Pressable onPress={() => openDatePicker({ type: 'milestone', id: milestone.id })}>
            <AdaptiveGlassView style={styles.milestoneInput}>
              <Text style={styles.dateText}>{formatDateLabel(milestone.dueDate)}</Text>
            </AdaptiveGlassView>
          </Pressable>
        </View>
      </View>
    </AdaptiveGlassView>
  );

  return (
    <>
      <CustomModal ref={modalRef} onDismiss={closePlannerGoalModal} {...modalProps}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {showAutoPlan ? (
              /* PL-10: Auto-plan UI */
              <>
                {/* Success Header */}
                <View style={[styles.header, styles.sectionPadding]}>
                  <Text style={styles.autoPlanEmoji}>🎉</Text>
                  <Text style={styles.autoPlanTitle}>Goal Created!</Text>
                  <Text style={styles.autoPlanSubtitle}>
                    Let's set up some habits and tasks to help you achieve it
                  </Text>
                </View>

                {/* Habit Suggestions */}
                <View style={[styles.section, styles.sectionPadding]}>
                  <Text style={styles.sectionLabel}>Recommended Habits</Text>
                  <View style={styles.suggestionsList}>
                    {habitSuggestions.map((habit) => {
                      const isSelected = selectedHabits.has(habit.id);
                      return (
                        <Pressable
                          key={habit.id}
                          onPress={() => handleToggleHabit(habit.id)}
                          style={({ pressed }) => [styles.suggestionItem, pressed && styles.pressed]}
                        >
                          <AdaptiveGlassView style={[styles.suggestionInner, isSelected && styles.suggestionSelected]}>
                            <View style={styles.suggestionCheckbox}>
                              {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                            </View>
                            <Text style={styles.suggestionEmoji}>{habit.icon}</Text>
                            <View style={styles.suggestionContent}>
                              <Text style={styles.suggestionTitle}>{habit.title}</Text>
                              <Text style={styles.suggestionDescription}>{habit.description}</Text>
                              <Text style={styles.suggestionMeta}>{habit.frequency}</Text>
                            </View>
                          </AdaptiveGlassView>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Task Suggestions */}
                <View style={[styles.section, styles.sectionPadding]}>
                  <Text style={styles.sectionLabel}>Recommended Tasks</Text>
                  <View style={styles.suggestionsList}>
                    {taskSuggestions.map((task) => {
                      const isSelected = selectedTasks.has(task.id);
                      return (
                        <Pressable
                          key={task.id}
                          onPress={() => handleToggleTask(task.id)}
                          style={({ pressed }) => [styles.suggestionItem, pressed && styles.pressed]}
                        >
                          <AdaptiveGlassView style={[styles.suggestionInner, isSelected && styles.suggestionSelected]}>
                            <View style={styles.suggestionCheckbox}>
                              {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                            </View>
                            <Text style={styles.suggestionEmoji}>{task.icon}</Text>
                            <View style={styles.suggestionContent}>
                              <Text style={styles.suggestionTitle}>{task.title}</Text>
                              <Text style={styles.suggestionDescription}>{task.description}</Text>
                              <View style={styles.taskMetaRow}>
                                <Text style={[styles.suggestionMeta, styles.priorityBadge]}>
                                  {task.priority}
                                </Text>
                              </View>
                            </View>
                          </AdaptiveGlassView>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Auto-plan Actions */}
                <View style={styles.actionButtons}>
                  <Pressable
                    onPress={handleSkipAutoPlan}
                    style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.secondaryButtonText}>Skip</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCreateSelected}
                    disabled={selectedHabits.size === 0 && selectedTasks.size === 0}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && styles.pressed,
                      (selectedHabits.size === 0 && selectedTasks.size === 0) && { opacity: 0.4 },
                    ]}
                  >
                    <AdaptiveGlassView style={styles.primaryButtonInner}>
                      <Text style={styles.primaryButtonText}>
                        Create Selected ({selectedHabits.size + selectedTasks.size})
                      </Text>
                    </AdaptiveGlassView>
                  </Pressable>
                </View>
              </>
            ) : (
              /* Regular Goal Form */
              <>
                {/* Header */}
                <View style={[styles.header, styles.sectionPadding]}>
                  <Text style={styles.headerTitle}>
                    {isEditing ? modalStrings.actions.update.toUpperCase() : modalStrings.title.toUpperCase()}
                  </Text>
                </View>

            {/* Scenario selector */}
            <View style={[styles.section, styles.sectionNoPadding]}>
              <View style={styles.sectionPadding}>
                <Text style={styles.sectionLabel}>{modalStrings.scenarioSection.title}</Text>
                <Text style={styles.sectionDescription}>{modalStrings.scenarioSection.subtitle}</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.templatesScroll}
              >
                {scenarioEntries.map(({ key, title: scenarioTitle, subtitle }) => {
                  const isActive = selectedScenario === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => handleScenarioSelect(key)}
                      style={({ pressed }) => [styles.templateCard, pressed && styles.pressed]}
                    >
                      <AdaptiveGlassView style={[styles.templateInner, { opacity: isActive ? 1 : 0.6 }]}>
                        <Text style={styles.templateEmoji}>{SCENARIO_ICONS[key]}</Text>
                        <Text style={[styles.templateLabel, { color: isActive ? '#FFFFFF' : '#7E8B9A' }]}>
                          {scenarioTitle}
                        </Text>
                        <Text style={styles.templateSubtitle}>{subtitle}</Text>
                      </AdaptiveGlassView>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Details */}
            <View style={[styles.section, styles.sectionPadding]}>
              <Text style={styles.sectionLabel}>{modalStrings.detailsSection.titleLabel}</Text>
              <AdaptiveGlassView style={styles.inputContainer}>
                <TextInput
                  value={title}
                  onChangeText={(text) => {
                    setTitle(text);
                    setErrorKey(null);
                  }}
                  placeholder={modalStrings.detailsSection.titlePlaceholder}
                  placeholderTextColor="#7E8B9A"
                  style={styles.textInput}
                />
              </AdaptiveGlassView>
            </View>

            {/* Description */}
            <View style={[styles.section, styles.sectionPadding]}>
              <Text style={styles.sectionLabel}>{modalStrings.detailsSection.descriptionLabel}</Text>
              <AdaptiveGlassView style={styles.descriptionContainer}>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder={modalStrings.detailsSection.descriptionPlaceholder}
                  placeholderTextColor="#7E8B9A"
                  multiline
                  style={styles.descriptionInput}
                />
              </AdaptiveGlassView>
            </View>

            {/* Goal type */}
            <View style={[styles.section, styles.sectionPadding]}>
              <Text style={styles.sectionLabel}>Category</Text>
              <View style={styles.typeRow}>
                {GOAL_TYPES.map((type) => {
                  const isActive = goalType === type.id;
                  return (
                    <Pressable
                      key={type.id}
                      onPress={() => handleGoalTypeChange(type.id)}
                      style={({ pressed }) => [styles.typeButton, pressed && styles.pressed]}
                    >
                      <AdaptiveGlassView style={[styles.typeButtonInner, { opacity: isActive ? 1 : 0.6 }]}>
                        <Text style={styles.typeEmoji}>{type.icon}</Text>
                        <Text style={[styles.typeLabel, { color: isActive ? '#FFFFFF' : '#7E8B9A' }]}>
                          {type.label}
                        </Text>
                      </AdaptiveGlassView>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Measurement type */}
            <View style={[styles.section, styles.sectionPadding]}>
              <Text style={styles.sectionLabel}>{measurementStrings.title}</Text>
              <Text style={styles.label}>{measurementStrings.metricLabel}</Text>
              <View style={styles.measurementGrid}>
                {METRIC_OPTIONS.map((metric) => {
                  const isActive = metricKind === metric.id;
                  return (
                    <Pressable
                      key={metric.id}
                      onPress={() => handleMetricChange(metric.id)}
                      style={({ pressed }) => [styles.measurementButton, pressed && styles.pressed]}
                    >
                      <AdaptiveGlassView style={[styles.measurementButtonInner, { opacity: isActive ? 1 : 0.6 }]}>
                        <Text style={styles.measurementEmoji}>{metric.icon}</Text>
                        <Text style={[styles.measurementLabel, { color: isActive ? '#FFFFFF' : '#7E8B9A' }]}>
                          {measurementStrings.metricOptions[metric.id] ?? metric.label}
                        </Text>
                        <Text style={styles.measurementDescription}>{metric.description}</Text>
                      </AdaptiveGlassView>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Target values */}
            <View style={[styles.section, styles.sectionPadding]}>
              <Text style={styles.sectionLabel}>{measurementStrings.title}</Text>
              <View style={styles.valueRow}>
                <View style={styles.valueColumn}>
                  <Text style={styles.label}>{measurementStrings.currentLabel}</Text>
                  <AdaptiveGlassView style={styles.inputContainer}>
                    <TextInput
                      value={currentValueText}
                      onChangeText={(text) => {
                        setCurrentValueText(text);
                        setErrorKey(null);
                      }}
                      placeholder={measurementStrings.placeholders.current}
                      placeholderTextColor="#7E8B9A"
                      keyboardType="numeric"
                      style={styles.textInput}
                    />
                  </AdaptiveGlassView>
                </View>
                <View style={styles.valueColumn}>
                  <Text style={styles.label}>{measurementStrings.targetLabel}</Text>
                  <AdaptiveGlassView style={styles.inputContainer}>
                    <TextInput
                      value={targetValueText}
                      onChangeText={(text) => {
                        setTargetValueText(text);
                        setErrorKey(null);
                      }}
                      placeholder={measurementStrings.placeholders.target}
                      placeholderTextColor="#7E8B9A"
                      keyboardType="numeric"
                      style={styles.textInput}
                    />
                  </AdaptiveGlassView>
                </View>
              </View>

              {/* Currency / Unit */}
              {metricKind === 'amount' ? (
                <>
                  <Text style={styles.label}>{measurementStrings.currencyLabel}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.currencyScroll}>
                    {currencyOptions.map((curr) => {
                      const isActive = currency === curr;
                      return (
                        <Pressable
                          key={curr}
                          onPress={() => setCurrency(curr)}
                          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
                        >
                          <AdaptiveGlassView style={[styles.chipInner, { opacity: isActive ? 1 : 0.6 }]}>
                            <Text style={[styles.chipText, { color: isActive ? '#FFFFFF' : '#7E8B9A' }]}>
                              {curr}
                            </Text>
                          </AdaptiveGlassView>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <Text style={styles.label}>{measurementStrings.financeModeLabel}</Text>
                  <View style={styles.modeRow}>
                    {FINANCE_MODES.map((mode) => {
                      const isActive = financeMode === mode.id;
                      return (
                        <Pressable
                          key={mode.id}
                          onPress={() => setFinanceMode(mode.id)}
                          style={({ pressed }) => [styles.modeButton, pressed && styles.pressed]}
                        >
                          <AdaptiveGlassView style={[styles.modeButtonInner, { opacity: isActive ? 1 : 0.6 }]}>
                            <Text style={styles.modeEmoji}>{mode.icon}</Text>
                            <Text style={[styles.modeLabel, { color: isActive ? '#FFFFFF' : '#7E8B9A' }]}>
                              {measurementStrings.financeModes[mode.id] ?? mode.label}
                            </Text>
                          </AdaptiveGlassView>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : metricKind !== 'custom' ? (
                <>
                  <Text style={styles.label}>{measurementStrings.unitLabel}</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.unitsScroll}
                  >
                    {Array.from(unitsByCategory.entries()).map(([categoryId, units]) => {
                      const categoryInfo = UNIT_CATEGORIES.find(c => c.id === categoryId);
                      if (!categoryInfo || units.length === 0) return null;
                      
                      return (
                        <View key={categoryId} style={styles.unitCategoryGroup}>
                          <View style={styles.unitCategoryHeader}>
                            <Ionicons name={categoryInfo.icon} size={14} color="#7E8B9A" />
                            <Text style={styles.unitCategoryLabel}>{categoryInfo.label}</Text>
                          </View>
                          <View style={styles.unitCategoryItems}>
                            {units.map((unitDef) => {
                              const isActive = unit === unitDef.id;
                              return (
                                <Pressable
                                  key={unitDef.id}
                                  onPress={() => {
                                    setUnit(unitDef.id);
                                    setShowCustomUnit(false);
                                    setCustomUnit('');
                                  }}
                                  style={({ pressed }) => [styles.unitChip, pressed && styles.pressed]}
                                >
                                  <AdaptiveGlassView style={[styles.unitChipInner, { opacity: isActive ? 1 : 0.6 }]}>
                                    <Ionicons 
                                      name={unitDef.icon} 
                                      size={16} 
                                      color={isActive ? '#FFFFFF' : '#7E8B9A'} 
                                    />
                                    <Text style={[styles.unitChipText, { color: isActive ? '#FFFFFF' : '#7E8B9A' }]}>
                                      {unitDef.label}
                                    </Text>
                                  </AdaptiveGlassView>
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>
                      );
                    })}
                    
                    {/* Custom option */}
                    <View style={styles.unitCategoryGroup}>
                      <View style={styles.unitCategoryHeader}>
                        <Ionicons name="create-outline" size={14} color="#7E8B9A" />
                        <Text style={styles.unitCategoryLabel}>{measurementStrings.unitLabel}</Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          setUnit('custom');
                          setShowCustomUnit(true);
                        }}
                        style={({ pressed }) => [styles.unitChip, pressed && styles.pressed]}
                      >
                        <AdaptiveGlassView style={[styles.unitChipInner, { opacity: showCustomUnit ? 1 : 0.6 }]}>
                          <Ionicons 
                            name="add-circle-outline" 
                            size={16} 
                            color={showCustomUnit ? '#FFFFFF' : '#7E8B9A'} 
                          />
                          <Text style={[styles.unitChipText, { color: showCustomUnit ? '#FFFFFF' : '#7E8B9A' }]}>
                            {measurementStrings.unitLabel}
                          </Text>
                        </AdaptiveGlassView>
                      </Pressable>
                    </View>
                  </ScrollView>
                  
                  {/* Custom unit input */}
                  {showCustomUnit && (
                    <AdaptiveGlassView style={[styles.inputContainer, { marginTop: 12 }]}>
                      <TextInput
                        value={customUnit}
                        onChangeText={setCustomUnit}
                        placeholder={measurementStrings.placeholders.unit}
                        placeholderTextColor="#7E8B9A"
                        style={styles.textInput}
                        autoFocus
                      />
                    </AdaptiveGlassView>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.label}>{measurementStrings.unitLabel}</Text>
                  <AdaptiveGlassView style={styles.inputContainer}>
                    <TextInput
                      value={unit}
                      onChangeText={setUnit}
                      placeholder={measurementStrings.placeholders.unit}
                      placeholderTextColor="#7E8B9A"
                      style={styles.textInput}
                    />
                  </AdaptiveGlassView>
                </>
              )}
              {errorKey && <Text style={styles.errorText}>{modalStrings.alerts[errorKey]}</Text>}
            </View>

            {/* Timeline */}
            <View style={[styles.section, styles.sectionPadding]}>
              <Text style={styles.sectionLabel}>{sectionTimelineStrings.title}</Text>
              <View style={styles.timelineRow}>
                <Pressable style={styles.dateButton} onPress={() => openDatePicker({ type: 'start' })}>
                  <AdaptiveGlassView style={styles.dateButtonInner}>
                    <Ionicons name="calendar-outline" size={16} color="#7E8B9A" />
                    <View style={styles.dateTextContainer}>
                      <Text style={styles.dateLabel}>{sectionTimelineStrings.startLabel}</Text>
                      <Text style={styles.dateText}>{formatDateLabel(startDate)}</Text>
                    </View>
                  </AdaptiveGlassView>
                </Pressable>
                <Pressable style={styles.dateButton} onPress={() => openDatePicker({ type: 'due' })}>
                  <AdaptiveGlassView style={styles.dateButtonInner}>
                    <Ionicons name="flag-outline" size={16} color="#7E8B9A" />
                    <View style={styles.dateTextContainer}>
                      <Text style={styles.dateLabel}>{sectionTimelineStrings.dueLabel}</Text>
                      <Text style={styles.dateText}>{formatDateLabel(targetDate)}</Text>
                    </View>
                  </AdaptiveGlassView>
                </Pressable>
              </View>
            </View>

            {/* Milestones */}
            <View style={[styles.section, styles.sectionPadding]}>
              <View style={styles.milestoneHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionLabel}>{modalStrings.milestoneSection.title}</Text>
                  <Text style={styles.sectionDescription}>{modalStrings.milestoneSection.description}</Text>
                </View>
                <Pressable onPress={handleAddMilestone} style={styles.addButton} accessibilityLabel={modalStrings.milestoneSection.add}>
                  <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                </Pressable>
              </View>
              {milestones.length === 0 ? (
                <AdaptiveGlassView style={styles.emptyCard}>
                  <Text style={styles.emptyText}>{modalStrings.milestoneSection.empty}</Text>
                </AdaptiveGlassView>
              ) : (
                <View style={styles.milestoneList}>{milestones.map(renderMilestone)}</View>
              )}
            </View>

            {/* AI Suggestions */}
            <View style={styles.aiSuggestion}>
              <Text style={styles.aiSuggestionIcon}>💡</Text>
              <View style={styles.aiTextContainer}>
                <Text style={styles.aiText}>
                  AI:{' '}
                  <Text style={{ color: '#FFFFFF' }}>
                    Goals with specific deadlines are 42% more likely to be achieved. Set a realistic target date!
                  </Text>
                </Text>
              </View>
            </View>

            {milestones.length > 0 && (
              <View style={styles.aiSuggestion}>
                <Text style={styles.aiSuggestionIcon}>🎯</Text>
                <View style={styles.aiTextContainer}>
                  <Text style={styles.aiText}>
                    AI:{' '}
                    <Text style={{ color: '#FFFFFF' }}>
                      Great! Breaking goals into milestones increases success rate by 60%.
                    </Text>
                  </Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {!isEditing && (
                <Pressable
                  disabled={disablePrimary}
                  onPress={() => handleSubmit({ showAutoPlan: true })}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && !disablePrimary && styles.pressed,
                    disablePrimary && { opacity: 0.4 },
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>{modalStrings.actions.createAndMore || 'Create and more'}</Text>
                </Pressable>
              )}
              <Pressable
                disabled={disablePrimary}
                onPress={() => handleSubmit()}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && !disablePrimary && styles.pressed,
                  !isEditing && { flex: 1 },
                ]}
              >
                <AdaptiveGlassView style={[styles.primaryButtonInner, { opacity: disablePrimary ? 0.4 : 1 }]}>
                  <Text style={[styles.primaryButtonText, { color: disablePrimary ? '#7E8B9A' : '#FFFFFF' }]}>
                    {isEditing ? modalStrings.actions.update : modalStrings.actions.create}
                  </Text>
                </AdaptiveGlassView>
              </Pressable>
            </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </CustomModal>

      {Platform.OS === 'ios' && pickerState && (
        <Modal transparent visible onRequestClose={() => setPickerState(null)} animationType="fade">
          <View style={styles.pickerModal}>
            <Pressable style={styles.pickerBackdrop} onPress={() => setPickerState(null)} />
            <AdaptiveGlassView style={styles.pickerCard}>
              <DateTimePicker value={pickerState.value} mode="date" display="spinner" onChange={handleIosPickerChange} />
              <Pressable onPress={() => setPickerState(null)} style={styles.pickerDoneButton}>
                <Text style={styles.pickerDoneText}>Done</Text>
              </Pressable>
            </AdaptiveGlassView>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: '#7E8B9A',
  },
  section: {
    marginBottom: 20,
  },
  sectionPadding: {
    paddingHorizontal: 20,
  },
  sectionNoPadding: {
    paddingHorizontal: 0,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#7E8B9A',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#7E8B9A',
    marginTop: -6,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#7E8B9A',
    marginBottom: 8,
    marginTop: 8,
  },
  templatesScroll: {
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  templateCard: {
    borderRadius: 16,
  },
  templateInner: {
    width: 110,
    height: 100,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  templateEmoji: {
    fontSize: 32,
  },
  templateLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  templateSubtitle: {
    fontSize: 10,
    textAlign: 'center',
    color: '#7E8B9A',
  },
  inputContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textInput: {
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  descriptionContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 80,
  },
  descriptionInput: {
    fontSize: 15,
    fontWeight: '400',
    textAlignVertical: 'top',
    color: '#FFFFFF',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    borderRadius: 16,
  },
  typeButtonInner: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    minWidth: 70,
  },
  typeEmoji: {
    fontSize: 20,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  measurementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  measurementButton: {
    width: '48%',
    borderRadius: 16,
  },
  measurementButtonInner: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
    alignItems: 'center',
  },
  measurementEmoji: {
    fontSize: 24,
  },
  measurementLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  measurementDescription: {
    fontSize: 10,
    color: '#7E8B9A',
  },
  valueRow: {
    flexDirection: 'row',
    gap: 12,
  },
  valueColumn: {
    flex: 1,
  },
  currencyScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  chip: {
    borderRadius: 12,
  },
  chipInner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    borderRadius: 16,
  },
  modeButtonInner: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
  },
  modeEmoji: {
    fontSize: 20,
  },
  modeLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  unitsScroll: {
    gap: 16,
    paddingVertical: 8,
  },
  unitCategoryGroup: {
    gap: 8,
  },
  unitCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  unitCategoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7E8B9A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unitCategoryItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitChip: {
    borderRadius: 12,
  },
  unitChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  unitChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
  },
  dateButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateTextContainer: {
    flex: 1,
    gap: 2,
  },
  dateLabel: {
    fontSize: 10,
    color: '#7E8B9A',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  milestoneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    padding: 4,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyDescription: {
    color: '#7E8B9A',
    fontSize: 13,
  },
  milestoneList: {
    gap: 12,
  },
  milestoneCard: {
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  milestoneRow: {
    flexDirection: 'row',
    gap: 12,
  },
  milestoneColumn: {
    flex: 1,
  },
  milestoneInput: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#FCA5A5',
  },
  aiSuggestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  aiSuggestionIcon: {
    fontSize: 22,
  },
  aiTextContainer: {
    flex: 1,
  },
  aiText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19,
    color: '#7E8B9A',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#7E8B9A',
  },
  primaryButton: {
    flex: 2,
    borderRadius: 16,
  },
  primaryButtonInner: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  pickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  pickerCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  pickerDoneButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  pickerDoneText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // PL-10: Auto-plan styles
  autoPlanEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  autoPlanTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  autoPlanSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#7E8B9A',
    textAlign: 'center',
    lineHeight: 20,
  },
  suggestionsList: {
    gap: 12,
  },
  suggestionItem: {
    borderRadius: 16,
  },
  suggestionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  suggestionSelected: {
    borderColor: '#FFFFFF',
  },
  suggestionCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#7E8B9A',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  suggestionEmoji: {
    fontSize: 24,
  },
  suggestionContent: {
    flex: 1,
    gap: 4,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  suggestionDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#7E8B9A',
    lineHeight: 18,
  },
  suggestionMeta: {
    fontSize: 11,
    fontWeight: '500',
    color: '#7E8B9A',
    textTransform: 'capitalize',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
