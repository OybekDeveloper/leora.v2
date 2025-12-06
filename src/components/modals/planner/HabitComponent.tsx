import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Switch,
} from 'react-native';
import { FlashList as FlashListBase } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useShallow } from 'zustand/react/shallow';
import {
  Calendar,
  CalendarDays,
  Settings,
  Clock,
  DollarSign,
  HeartPulse,
  PiggyBank,
  Sparkles,
  BookOpen,
  Smile,
  PlusCircle,
  Dumbbell,
  Brain,
  Droplets,
  CircleSlash,
  Plus,
  Minus,
  Bell,
  Flame,
  Zap,
  HelpCircle,
  Flag,
  Check,
} from 'lucide-react-native';
import { Dropdown } from 'react-native-element-dropdown';

import { createThemedStyles, useAppTheme } from '@/constants/theme';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useLocalization } from '@/localization/useLocalization';
import type {
  HabitType,
  CompletionMode,
  HabitFinanceRule,
  Frequency,
  HabitCountingType,
  HabitDifficulty,
  HabitPriority,
} from '@/domain/planner/types';

// Cast FlashList to avoid TypeScript generic inference issues
const FlashList = FlashListBase as any;

type Props = {
  habitId?: string;
  presetGoalId?: string;
};

const HABIT_TYPE_IDS: { id: HabitType; icon: typeof HeartPulse }[] = [
  { id: 'health', icon: HeartPulse },
  { id: 'finance', icon: PiggyBank },
  { id: 'productivity', icon: Sparkles },
  { id: 'education', icon: BookOpen },
  { id: 'personal', icon: Smile },
  { id: 'custom', icon: PlusCircle },
];

const FREQUENCY_TYPE_IDS: { id: Frequency; icon: string }[] = [
  { id: 'daily', icon: 'calendar' },
  { id: 'weekly', icon: 'calendarDays' },
  { id: 'custom', icon: 'settings' },
];

const FINANCE_RULE_TYPE_IDS = [
  'no_spend_in_categories',
  'spend_in_categories',
  'has_any_transactions',
  'daily_spend_under',
] as const;

const DIFFICULTY_OPTIONS: { id: HabitDifficulty; icon: typeof Zap }[] = [
  { id: 'easy', icon: Zap },
  { id: 'medium', icon: Flame },
  { id: 'hard', icon: Sparkles },
];

const STREAK_OPTIONS = [
  { days: 7, key: 'days7' as const },
  { days: 21, key: 'days21' as const },
  { days: 30, key: 'days30' as const },
  { days: 66, key: 'days66' as const },
  { days: 100, key: 'days100' as const },
];

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const PRIORITY_OPTIONS: { id: HabitPriority; label: string }[] = [
  { id: 'low', label: 'low' },
  { id: 'medium', label: 'medium' },
  { id: 'high', label: 'high' },
];

type PopularHabitTemplate = {
  id: string;
  titleKey: 'morningWorkout' | 'meditation' | 'drinkWater' | 'quitSmoking';
  icon: typeof Dumbbell;
  habitType: HabitType;
  countingType: HabitCountingType;
  difficulty: HabitDifficulty;
  completionMode?: CompletionMode;
  targetPerDay?: number;
  unit?: string;
};

const POPULAR_HABITS: PopularHabitTemplate[] = [
  {
    id: 'morning-workout',
    titleKey: 'morningWorkout',
    icon: Dumbbell,
    habitType: 'health',
    countingType: 'create',
    difficulty: 'medium',
  },
  {
    id: 'meditation',
    titleKey: 'meditation',
    icon: Brain,
    habitType: 'personal',
    countingType: 'create',
    difficulty: 'easy',
  },
  {
    id: 'drink-water',
    titleKey: 'drinkWater',
    icon: Droplets,
    habitType: 'health',
    countingType: 'create',
    difficulty: 'easy',
    completionMode: 'numeric',
    targetPerDay: 8,
    unit: 'glasses',
  },
  {
    id: 'quit-smoking',
    titleKey: 'quitSmoking',
    icon: CircleSlash,
    habitType: 'health',
    countingType: 'quit',
    difficulty: 'hard',
  },
];

const renderFrequencyIcon = (iconId: string, size: number, color: string) => {
  switch (iconId) {
    case 'calendar':
      return <Calendar size={size} color={color} />;
    case 'calendarDays':
      return <CalendarDays size={size} color={color} />;
    case 'settings':
      return <Settings size={size} color={color} />;
    default:
      return <Calendar size={size} color={color} />;
  }
};

// Custom dates picker component for custom frequency
type CustomDatesPickerProps = {
  selectedDates: string[];
  onDatesChange: (dates: string[]) => void;
  styles: any;
};

function CustomDatesPicker({ selectedDates, onDatesChange, styles }: CustomDatesPickerProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < (startDayOfWeek === 0 ? 6 : startDayOfWeek - 1); i++) {
      days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const formatDateKey = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const toggleDate = (day: number) => {
    const dateKey = formatDateKey(day);
    if (selectedDates.includes(dateKey)) {
      onDatesChange(selectedDates.filter(d => d !== dateKey));
    } else {
      onDatesChange([...selectedDates, dateKey]);
    }
  };

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = getDaysInMonth(currentMonth);

  return (
    <View style={styles.calendarContainer}>
      {/* Month navigation */}
      <View style={styles.calendarHeader}>
        <Pressable onPress={goToPrevMonth} hitSlop={12}>
          <Text style={styles.calendarNavButton}>{'<'}</Text>
        </Pressable>
        <Text style={styles.calendarMonthText}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        <Pressable onPress={goToNextMonth} hitSlop={12}>
          <Text style={styles.calendarNavButton}>{'>'}</Text>
        </Pressable>
      </View>

      {/* Weekday headers */}
      <View style={styles.calendarWeekdayRow}>
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
          <Text key={day} style={styles.calendarWeekdayText}>{day}</Text>
        ))}
      </View>

      {/* Days grid */}
      <View style={styles.calendarDaysGrid}>
        {days.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={styles.calendarDayCell} />;
          }
          const dateKey = formatDateKey(day);
          const isSelected = selectedDates.includes(dateKey);
          return (
            <Pressable
              key={day}
              style={[
                styles.calendarDayCell,
                isSelected && styles.calendarDayCellSelected,
              ]}
              onPress={() => toggleDate(day)}
            >
              <Text style={[
                styles.calendarDayText,
                isSelected && styles.calendarDayTextSelected,
              ]}>
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Selected count */}
      {selectedDates.length > 0 && (
        <Text style={styles.calendarSelectedCount}>
          {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''} selected
        </Text>
      )}
    </View>
  );
}

export function HabitComponent({ habitId, presetGoalId }: Props) {
  const styles = useStyles();
  const theme = useAppTheme();
  const router = useRouter();
  const { strings } = useLocalization();
  const habitStrings = strings.plannerModals.habit;

  const { habits, createHabit, updateHabit, goals } = usePlannerDomainStore(
    useShallow((state) => ({
      habits: state.habits,
      createHabit: state.createHabit,
      updateHabit: state.updateHabit,
      goals: state.goals,
    }))
  );

  const { categories, accounts } = useFinanceDomainStore(
    useShallow((state) => ({
      categories: state.categories,
      accounts: state.accounts,
    }))
  );

  // Basic fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [iconId, setIconId] = useState<string | undefined>();
  const [habitType, setHabitType] = useState<HabitType>('health');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [timesPerWeek, setTimesPerWeek] = useState(1);

  // New fields
  const [countingType, setCountingType] = useState<HabitCountingType>('create');
  const [difficulty, setDifficulty] = useState<HabitDifficulty>('medium');
  const [priority, setPriority] = useState<HabitPriority>('medium');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [customDates, setCustomDates] = useState<string[]>([]); // ISO date strings like '2024-01-15'
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState<Date | undefined>();
  const [challengeLengthDays, setChallengeLengthDays] = useState<number | undefined>();

  // Existing fields from spec
  const [completionMode, setCompletionMode] = useState<CompletionMode>('boolean');
  const [targetPerDay, setTargetPerDay] = useState<string>('1');
  const [unit, setUnit] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<Date | undefined>();
  const [goalId, setGoalId] = useState<string | undefined>(presetGoalId);

  // Finance Rule
  const [enableFinanceRule, setEnableFinanceRule] = useState(false);
  const [financeRuleType, setFinanceRuleType] = useState<'no_spend_in_categories' | 'spend_in_categories' | 'has_any_transactions' | 'daily_spend_under'>('no_spend_in_categories');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [ruleAmount, setRuleAmount] = useState('');
  const [ruleCurrency, setRuleCurrency] = useState('USD');

  // Pickers
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  // Load habit data if editing
  useEffect(() => {
    if (habitId) {
      const habit = habits.find((h) => h.id === habitId);
      if (habit) {
        setTitle(habit.title || '');
        setDescription(habit.description || '');
        setIconId(habit.iconId);
        setHabitType(habit.habitType || 'health');
        setFrequency(habit.frequency || 'daily');
        setTimesPerWeek(habit.timesPerWeek || 1);
        setCompletionMode(habit.completionMode || 'boolean');
        setTargetPerDay(String(habit.targetPerDay || 1));
        setUnit(habit.unit || '');
        setGoalId(habit.goalId);
        setCountingType(habit.countingType || 'create');
        setDifficulty(habit.difficulty || 'medium');
        setPriority(habit.priority || 'medium');
        setSelectedDays(habit.daysOfWeek || []);
        setReminderEnabled(habit.reminderEnabled || false);
        setChallengeLengthDays(habit.challengeLengthDays);

        if (habit.timeOfDay) {
          const [hours, minutes] = habit.timeOfDay.split(':').map(Number);
          const date = new Date();
          date.setHours(hours, minutes, 0, 0);
          setTimeOfDay(date);
        }

        if (habit.reminderTime) {
          const [hours, minutes] = habit.reminderTime.split(':').map(Number);
          const date = new Date();
          date.setHours(hours, minutes, 0, 0);
          setReminderTime(date);
        }

        if (habit.financeRule) {
          setEnableFinanceRule(true);
          setFinanceRuleType(habit.financeRule.type);

          if (habit.financeRule.type === 'no_spend_in_categories' || habit.financeRule.type === 'spend_in_categories') {
            setSelectedCategories(habit.financeRule.categoryIds || []);
            if (habit.financeRule.type === 'spend_in_categories' && habit.financeRule.minAmount) {
              setRuleAmount(String(habit.financeRule.minAmount));
              setRuleCurrency(habit.financeRule.currency || 'USD');
            }
          } else if (habit.financeRule.type === 'has_any_transactions') {
            setSelectedAccounts(habit.financeRule.accountIds || []);
          } else if (habit.financeRule.type === 'daily_spend_under') {
            setRuleAmount(String(habit.financeRule.amount));
            setRuleCurrency(habit.financeRule.currency);
          }
        }
      }
    }
  }, [habitId, habits]);

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setIconId(undefined);
    setHabitType('health');
    setFrequency('daily');
    setTimesPerWeek(1);
    setCountingType('create');
    setDifficulty('medium');
    setPriority('medium');
    setSelectedDays([]);
    setReminderEnabled(false);
    setReminderTime(undefined);
    setChallengeLengthDays(undefined);
    setCompletionMode('boolean');
    setTargetPerDay('1');
    setUnit('');
    setTimeOfDay(undefined);
    setGoalId(presetGoalId);
    setEnableFinanceRule(false);
    setFinanceRuleType('no_spend_in_categories');
    setSelectedCategories([]);
    setSelectedAccounts([]);
    setRuleAmount('');
    setRuleCurrency('USD');
  }, [presetGoalId]);

  const handlePopularHabitSelect = useCallback((template: PopularHabitTemplate) => {
    const templateStrings = habitStrings.popularHabits[template.titleKey];
    setTitle(templateStrings.title);
    setHabitType(template.habitType);
    setCountingType(template.countingType);
    setDifficulty(template.difficulty);
    if (template.completionMode) {
      setCompletionMode(template.completionMode);
    }
    if (template.targetPerDay) {
      setTargetPerDay(String(template.targetPerDay));
    }
    if (template.unit) {
      setUnit(template.unit);
    }
    if (templateStrings.time) {
      const [hours, minutes] = templateStrings.time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      setTimeOfDay(date);
    }
  }, [habitStrings.popularHabits]);

  const buildHabitData = useCallback(() => {
    let financeRule: HabitFinanceRule | undefined;

    if (enableFinanceRule) {
      if (financeRuleType === 'no_spend_in_categories') {
        financeRule = {
          type: 'no_spend_in_categories',
          categoryIds: selectedCategories,
        };
      } else if (financeRuleType === 'spend_in_categories') {
        financeRule = {
          type: 'spend_in_categories',
          categoryIds: selectedCategories,
          minAmount: ruleAmount ? parseFloat(ruleAmount) : undefined,
          currency: ruleCurrency,
        };
      } else if (financeRuleType === 'has_any_transactions') {
        financeRule = {
          type: 'has_any_transactions',
          accountIds: selectedAccounts.length > 0 ? selectedAccounts : undefined,
        };
      } else if (financeRuleType === 'daily_spend_under') {
        financeRule = {
          type: 'daily_spend_under',
          amount: parseFloat(ruleAmount),
          currency: ruleCurrency,
        };
      }
    }

    return {
      title,
      description: description || undefined,
      iconId,
      habitType,
      frequency,
      timesPerWeek: frequency === 'weekly' || frequency === 'custom' ? timesPerWeek : undefined,
      daysOfWeek: (frequency === 'weekly' || frequency === 'custom') && selectedDays.length > 0 ? selectedDays : undefined,
      countingType,
      difficulty,
      priority,
      reminderEnabled,
      reminderTime: reminderTime ? `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}` : undefined,
      challengeLengthDays,
      completionMode,
      targetPerDay: completionMode === 'numeric' ? parseFloat(targetPerDay) : undefined,
      unit: completionMode === 'numeric' ? unit : undefined,
      timeOfDay: timeOfDay ? `${timeOfDay.getHours().toString().padStart(2, '0')}:${timeOfDay.getMinutes().toString().padStart(2, '0')}` : undefined,
      goalId,
      financeRule,
      updatedAt: new Date().toISOString(),
    };
  }, [
    title,
    description,
    iconId,
    habitType,
    frequency,
    timesPerWeek,
    selectedDays,
    countingType,
    difficulty,
    priority,
    reminderEnabled,
    reminderTime,
    challengeLengthDays,
    completionMode,
    targetPerDay,
    unit,
    timeOfDay,
    goalId,
    enableFinanceRule,
    financeRuleType,
    selectedCategories,
    selectedAccounts,
    ruleAmount,
    ruleCurrency,
  ]);

  const handleSubmit = useCallback((andMore = false) => {
    if (!title.trim()) return;

    const habitData = buildHabitData();

    if (habitId) {
      updateHabit(habitId, habitData);
    } else {
      createHabit({
        ...habitData,
        userId: 'current-user',
        status: 'active',
        streakCurrent: 0,
        streakBest: 0,
        completionRate30d: 0,
        completionHistory: {},
        createdAt: new Date().toISOString(),
      } as any);
    }

    if (andMore) {
      resetForm();
    } else {
      setTimeout(() => {
        router.back();
      }, 100);
    }
  }, [title, buildHabitData, habitId, updateHabit, createHabit, resetForm, router]);

  const handleTimePress = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: timeOfDay || new Date(),
        mode: 'time',
        is24Hour: true,
        onChange: (event, selectedTime) => {
          if (event.type === 'set' && selectedTime) {
            setTimeOfDay(selectedTime);
          }
        },
      });
    } else {
      setShowTimePicker(true);
    }
  };

  const handleReminderTimePress = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: reminderTime || new Date(),
        mode: 'time',
        is24Hour: true,
        onChange: (event, selectedTime) => {
          if (event.type === 'set' && selectedTime) {
            setReminderTime(selectedTime);
          }
        },
      });
    } else {
      setShowReminderPicker(true);
    }
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const toggleAccount = (accId: string) => {
    setSelectedAccounts(prev =>
      prev.includes(accId) ? prev.filter(id => id !== accId) : [...prev, accId]
    );
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev =>
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {habitId ? habitStrings.editTitle : habitStrings.createTitle}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.closeText}>{habitStrings.close}</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Popular Habits */}
        {!habitId && (
          <View style={styles.sectionFullWidth}>
            <Text style={[styles.label, styles.labelWithPadding]}>{habitStrings.popularHabitsLabel}</Text>
            <View style={styles.popularHabitsListContainer}>
              <FlashList
                data={POPULAR_HABITS}
                horizontal
                showsHorizontalScrollIndicator={false}
                estimatedItemSize={130}
                keyExtractor={(item: PopularHabitTemplate) => item.id}
                ItemSeparatorComponent={() => <View style={styles.horizontalSeparator} />}
                ListHeaderComponent={<View style={styles.listEdgeSpacer} />}
                ListFooterComponent={<View style={styles.listEdgeSpacer} />}
                renderItem={({ item: template }: { item: PopularHabitTemplate }) => {
                  const Icon = template.icon;
                  const templateStrings = habitStrings.popularHabits[template.titleKey];
                  return (
                    <Pressable onPress={() => handlePopularHabitSelect(template)}>
                      <AdaptiveGlassView style={styles.popularHabitCard}>
                        <View style={styles.popularHabitIconWrap}>
                          <Icon size={24} color={theme.colors.textPrimary} />
                        </View>
                        <Text style={styles.popularHabitTitle} numberOfLines={1} ellipsizeMode="tail">
                          {templateStrings.title}
                        </Text>
                        {templateStrings.time ? (
                          <Text style={styles.popularHabitTime}>
                            <Clock size={10} color={theme.colors.textMuted} /> {templateStrings.time}
                          </Text>
                        ) : null}
                      </AdaptiveGlassView>
                    </Pressable>
                  );
                }}
              />
            </View>
          </View>
        )}

        {/* Habit Name */}
        <View style={styles.section}>
          <Text style={styles.label}>{habitStrings.nameLabel} {habitStrings.nameRequired}</Text>
          <AdaptiveGlassView style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={habitStrings.namePlaceholder}
              placeholderTextColor={theme.colors.textMuted}
            />
          </AdaptiveGlassView>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>{habitStrings.descriptionLabel}</Text>
          <AdaptiveGlassView style={styles.inputWrapper}>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder={habitStrings.descriptionPlaceholder}
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </AdaptiveGlassView>
        </View>

        {/* Counting Type (Create / Quit) */}
        <View style={styles.section}>
          <Text style={styles.label}>{habitStrings.countingTypeLabel}</Text>
          <View style={styles.countingTypeRow}>
            <Pressable
              style={[
                styles.countingTypeButton,
                countingType === 'create' && styles.countingTypeButtonActive,
              ]}
              onPress={() => setCountingType('create')}
            >
              <Plus size={18} color={countingType === 'create' ? theme.colors.primary : theme.colors.textSecondary} />
              <Text style={[
                styles.countingTypeLabel,
                countingType === 'create' && styles.countingTypeLabelActive,
              ]}>
                {habitStrings.countingTypes.create}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.countingTypeButton,
                countingType === 'quit' && styles.countingTypeButtonActive,
              ]}
              onPress={() => setCountingType('quit')}
            >
              <Minus size={18} color={countingType === 'quit' ? theme.colors.primary : theme.colors.textSecondary} />
              <Text style={[
                styles.countingTypeLabel,
                countingType === 'quit' && styles.countingTypeLabelActive,
              ]}>
                {habitStrings.countingTypes.quit}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Categories (Habit Type) */}
        <View style={styles.sectionFullWidth}>
          <Text style={[styles.label, styles.labelWithPadding]}>{habitStrings.categoriesLabel}</Text>
          <View style={styles.habitTypeListContainer}>
            <FlashList
              data={HABIT_TYPE_IDS}
              horizontal
              showsHorizontalScrollIndicator={false}
              estimatedItemSize={110}
              keyExtractor={(item: { id: HabitType; icon: typeof HeartPulse }) => item.id}
              ItemSeparatorComponent={() => <View style={styles.horizontalSeparator} />}
              ListHeaderComponent={<View style={styles.listEdgeSpacer} />}
              ListFooterComponent={<View style={styles.listEdgeSpacer} />}
              renderItem={({ item: type }: { item: { id: HabitType; icon: typeof HeartPulse } }) => {
                const isSelected = habitType === type.id;
                const Icon = type.icon;
                return (
                  <Pressable onPress={() => setHabitType(type.id)}>
                    <AdaptiveGlassView
                      style={[styles.typeCard, isSelected && styles.typeCardActive]}
                    >
                      <View style={[styles.typeIconWrap, isSelected && styles.typeIconWrapActive]}>
                        <Icon size={18} color={isSelected ? theme.colors.primary : theme.colors.textSecondary} />
                      </View>
                      <Text
                        style={[styles.typeLabel, isSelected && styles.typeLabelActive]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {habitStrings.habitTypes[type.id]}
                      </Text>
                    </AdaptiveGlassView>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>

        {/* Difficulty */}
        <View style={styles.section}>
          <Text style={styles.label}>{habitStrings.difficultyLabel}</Text>
          <Dropdown
            mode="default"
            data={DIFFICULTY_OPTIONS.map((opt) => ({
              value: opt.id,
              label: habitStrings.difficultyLevels[opt.id],
              icon: opt.icon,
            }))}
            labelField="label"
            valueField="value"
            value={difficulty}
            onChange={(item) => setDifficulty(item.value as HabitDifficulty)}
            style={styles.dropdown}
            containerStyle={[styles.dropdownContainer, { backgroundColor: theme.colors.card }]}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelectedText}
            renderLeftIcon={() => {
              const currentOption = DIFFICULTY_OPTIONS.find(o => o.id === difficulty);
              const Icon = currentOption?.icon || Zap;
              return (
                <Icon
                  size={18}
                  color={theme.colors.textSecondary}
                  style={{ marginRight: 10 }}
                />
              );
            }}
            renderItem={(item) => {
              const active = item.value === difficulty;
              const Icon = (item as any).icon || Zap;
              return (
                <View style={[styles.dropdownItem, active && styles.dropdownItemActive]}>
                  <Icon size={16} color={active ? theme.colors.textPrimary : theme.colors.textSecondary} />
                  <Text style={[styles.dropdownItemLabel, active && styles.dropdownItemLabelActive]}>
                    {item.label}
                  </Text>
                  {active && <Check size={16} color={theme.colors.textPrimary} />}
                </View>
              );
            }}
          />
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={styles.label}>{habitStrings.priorityLabel || 'Priority'}</Text>
          <Dropdown
            mode="default"
            data={PRIORITY_OPTIONS.map((opt) => ({
              value: opt.id,
              label: habitStrings.priorityLevels?.[opt.id] || opt.label.charAt(0).toUpperCase() + opt.label.slice(1),
            }))}
            labelField="label"
            valueField="value"
            value={priority}
            onChange={(item) => setPriority(item.value as HabitPriority)}
            style={styles.dropdown}
            containerStyle={[styles.dropdownContainer, { backgroundColor: theme.colors.card }]}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelectedText}
            renderLeftIcon={() => (
              <Flag
                size={18}
                color={theme.colors.textSecondary}
                style={{ marginRight: 10 }}
              />
            )}
            renderItem={(item) => {
              const active = item.value === priority;
              return (
                <View style={[styles.dropdownItem, active && styles.dropdownItemActive]}>
                  <Flag size={16} color={active ? theme.colors.textPrimary : theme.colors.textSecondary} />
                  <Text style={[styles.dropdownItemLabel, active && styles.dropdownItemLabelActive]}>
                    {item.label}
                  </Text>
                  {active && <Check size={16} color={theme.colors.textPrimary} />}
                </View>
              );
            }}
          />
        </View>

        {/* Reminder */}
        <View style={styles.section}>
          <AdaptiveGlassView style={styles.switchRow}>
            <Bell size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.label, { flex: 1, marginBottom: 0 }]}>{habitStrings.reminderLabel}</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </AdaptiveGlassView>
        </View>

        {reminderEnabled && (
          <View style={styles.section}>
            <Pressable onPress={handleReminderTimePress}>
              <AdaptiveGlassView style={styles.dateButton}>
                <Clock size={20} color={theme.colors.textSecondary} />
                <Text style={styles.dateButtonText}>
                  {reminderTime ? reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : habitStrings.addReminder}
                </Text>
              </AdaptiveGlassView>
            </Pressable>
          </View>
        )}

        {/* Streak Challenge */}
        <View style={styles.section}>
          <AdaptiveGlassView style={styles.switchRow}>
            <Flame size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.label, { flex: 1, marginBottom: 0 }]}>{habitStrings.streakLabel}</Text>
            <Switch
              value={challengeLengthDays !== undefined}
              onValueChange={(val) => setChallengeLengthDays(val ? 21 : undefined)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </AdaptiveGlassView>
        </View>

        {challengeLengthDays !== undefined && (
          <>
            <View style={styles.streakOptionsRow}>
              {STREAK_OPTIONS.map((option) => {
                const active = challengeLengthDays === option.days;
                return (
                  <Pressable
                    key={option.days}
                    style={[
                      styles.streakOption,
                      active && styles.streakOptionActive,
                    ]}
                    onPress={() => setChallengeLengthDays(option.days)}
                  >
                    <Text style={[
                      styles.streakOptionDays,
                      active && styles.streakOptionDaysActive,
                    ]}>
                      {option.days}
                    </Text>
                    <Text style={[
                      styles.streakOptionLabel,
                      active && styles.streakOptionLabelActive,
                    ]}>
                      {habitStrings.streakOptions[option.key]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.streakMotivationRow}>
              <Flame size={16} color={theme.colors.warning} />
              <Text style={styles.streakMotivationText}>
                {habitStrings.streakMotivation.replace('{days}', String(challengeLengthDays))}
              </Text>
            </View>
          </>
        )}

        {/* Frequency */}
        <View style={styles.section}>
          <Text style={styles.label}>{habitStrings.frequencyLabel}</Text>
          <View style={styles.chipRow}>
            {FREQUENCY_TYPE_IDS.map((type) => {
              const label = habitStrings.frequencyTypes[type.id];
              return (
                <Pressable
                  key={type.id}
                  onPress={() => setFrequency(type.id)}
                >
                  <AdaptiveGlassView
                    style={[
                      styles.chip,
                      frequency === type.id && styles.chipActive,
                    ]}
                  >
                    {renderFrequencyIcon(
                      type.icon,
                      16,
                      frequency === type.id ? theme.colors.primary : theme.colors.textPrimary
                    )}
                    <Text style={[
                      styles.chipLabel,
                      frequency === type.id && styles.chipLabelActive,
                    ]}>
                      {label}
                    </Text>
                  </AdaptiveGlassView>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Select Days of Week - only for weekly */}
        {frequency === 'weekly' && (
          <View style={styles.section}>
            <Text style={styles.label}>{habitStrings.selectDaysLabel || 'Select days'}</Text>
            <View style={styles.weekdayRow}>
              {WEEKDAY_KEYS.map((dayKey, index) => {
                const isSelected = selectedDays.includes(index);
                const dayLabel = habitStrings.weekdays?.[dayKey] || dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
                return (
                  <Pressable
                    key={index}
                    style={[
                      styles.weekdayButton,
                      isSelected && styles.weekdayButtonActive,
                    ]}
                    onPress={() => toggleDay(index)}
                  >
                    <Text style={[
                      styles.weekdayText,
                      isSelected && styles.weekdayTextActive,
                    ]}>
                      {dayLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Custom dates calendar - only for custom */}
        {frequency === 'custom' && (
          <View style={styles.section}>
            <Text style={styles.label}>{habitStrings.selectDatesLabel || 'Select dates'}</Text>
            <CustomDatesPicker
              selectedDates={customDates}
              onDatesChange={setCustomDates}
              styles={styles}
            />
          </View>
        )}

        {/* Completion Mode */}
        <View style={styles.section}>
          <AdaptiveGlassView style={styles.completionModeSwitchRow}>
            <View style={styles.completionModeTextContainer}>
              <Text style={styles.completionModeTitle}>{habitStrings.completionModeLabel}</Text>
              <Text style={styles.completionModeDesc}>
                {completionMode === 'boolean' ? habitStrings.completionModes.boolean : habitStrings.completionModes.numeric}
              </Text>
            </View>
            <Switch
              value={completionMode === 'numeric'}
              onValueChange={(val) => setCompletionMode(val ? 'numeric' : 'boolean')}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </AdaptiveGlassView>
        </View>

        {/* Target & Unit (if numeric) */}
        {completionMode === 'numeric' && (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>{habitStrings.targetPerDay}</Text>
              <AdaptiveGlassView style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={targetPerDay}
                  onChangeText={setTargetPerDay}
                  placeholder={habitStrings.targetPlaceholder}
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="numeric"
                />
              </AdaptiveGlassView>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>{habitStrings.unitLabel}</Text>
              <AdaptiveGlassView style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={unit}
                  onChangeText={setUnit}
                  placeholder={habitStrings.unitPlaceholder}
                  placeholderTextColor={theme.colors.textMuted}
                />
              </AdaptiveGlassView>
            </View>
          </>
        )}

        {/* Time of Day */}
        <View style={styles.section}>
          <Text style={styles.label}>{habitStrings.timeOfDayLabel}</Text>
          <Pressable onPress={handleTimePress}>
            <AdaptiveGlassView style={styles.dateButton}>
              <Clock size={20} color={theme.colors.textSecondary} />
              <Text style={styles.dateButtonText}>
                {timeOfDay ? timeOfDay.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : habitStrings.setTime}
              </Text>
            </AdaptiveGlassView>
          </Pressable>
        </View>

        {/* Link to Goal */}
        <View style={styles.section}>
          <Text style={styles.label}>{habitStrings.linkToGoalLabel}</Text>
          <View style={styles.chipRow}>
            <Pressable onPress={() => setGoalId(undefined)}>
              <AdaptiveGlassView
                style={[
                  styles.chip,
                  !goalId && styles.chipActive,
                ]}
              >
                <Text style={[
                  styles.chipLabel,
                  !goalId && styles.chipLabelActive,
                ]}>
                  {habitStrings.none}
                </Text>
              </AdaptiveGlassView>
            </Pressable>
            {goals.filter(g => g.status === 'active').map((goal) => (
              <Pressable
                key={goal.id}
                onPress={() => setGoalId(goal.id)}
              >
                <AdaptiveGlassView
                  style={[
                    styles.chip,
                    goalId === goal.id && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[styles.chipLabel, goalId === goal.id && styles.chipLabelActive]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {goal.title}
                  </Text>
                </AdaptiveGlassView>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Finance Rule */}
        <View style={styles.section}>
          <AdaptiveGlassView style={styles.switchRow}>
            <DollarSign size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.label, { flex: 1, marginBottom: 0 }]}>{habitStrings.financeRuleLabel}</Text>
            <Switch
              value={enableFinanceRule}
              onValueChange={setEnableFinanceRule}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </AdaptiveGlassView>
        </View>

        {enableFinanceRule && (
          <>
            {/* Finance Rule Type */}
            <View style={styles.section}>
              <Text style={styles.label}>{habitStrings.ruleTypeLabel}</Text>
              <View style={styles.chipRow}>
                {FINANCE_RULE_TYPE_IDS.map((ruleId) => {
                  const labelKey = ruleId === 'no_spend_in_categories' ? 'noSpendInCategories'
                    : ruleId === 'spend_in_categories' ? 'spendInCategories'
                    : ruleId === 'has_any_transactions' ? 'hasAnyTransactions'
                    : 'dailySpendUnder';
                  const label = habitStrings.ruleTypes[labelKey];
                  return (
                    <Pressable
                      key={ruleId}
                      onPress={() => setFinanceRuleType(ruleId as any)}
                    >
                      <AdaptiveGlassView
                        style={[
                          styles.chip,
                          financeRuleType === ruleId && styles.chipActive,
                        ]}
                      >
                        <Text
                          style={[styles.chipLabel, financeRuleType === ruleId && styles.chipLabelActive]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {label}
                        </Text>
                      </AdaptiveGlassView>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Categories (for no_spend / spend_in) */}
            {(financeRuleType === 'no_spend_in_categories' || financeRuleType === 'spend_in_categories') && (
              <View style={styles.section}>
                <Text style={styles.label}>{habitStrings.selectCategories}</Text>
                <View style={styles.chipRow}>
                  {categories.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => toggleCategory(cat)}
                    >
                      <AdaptiveGlassView
                        style={[
                          styles.chip,
                          selectedCategories.includes(cat) && styles.chipActive,
                        ]}
                      >
                        <Text
                          style={[styles.chipLabel, selectedCategories.includes(cat) && styles.chipLabelActive]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {cat}
                        </Text>
                      </AdaptiveGlassView>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Min Amount (for spend_in_categories) */}
            {financeRuleType === 'spend_in_categories' && (
              <View style={styles.section}>
                <Text style={styles.label}>{habitStrings.minAmount}</Text>
                <AdaptiveGlassView style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={ruleAmount}
                    onChangeText={setRuleAmount}
                    placeholder="50"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="numeric"
                  />
                </AdaptiveGlassView>
              </View>
            )}

            {/* Accounts (for has_any_transactions) */}
            {financeRuleType === 'has_any_transactions' && (
              <View style={styles.section}>
                <Text style={styles.label}>{habitStrings.selectAccounts}</Text>
                <View style={styles.chipRow}>
                  {accounts.map((acc) => (
                    <Pressable
                      key={acc.id}
                      onPress={() => toggleAccount(acc.id)}
                    >
                      <AdaptiveGlassView
                        style={[
                          styles.chip,
                          selectedAccounts.includes(acc.id) && styles.chipActive,
                        ]}
                      >
                        <Text
                          style={[styles.chipLabel, selectedAccounts.includes(acc.id) && styles.chipLabelActive]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {acc.name}
                        </Text>
                      </AdaptiveGlassView>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Amount & Currency (for daily_spend_under) */}
            {financeRuleType === 'daily_spend_under' && (
              <>
                <View style={styles.section}>
                  <Text style={styles.label}>{habitStrings.dailyLimitAmount}</Text>
                  <AdaptiveGlassView style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={ruleAmount}
                      onChangeText={setRuleAmount}
                      placeholder="100"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="numeric"
                    />
                  </AdaptiveGlassView>
                </View>
                <View style={styles.section}>
                  <Text style={styles.label}>{habitStrings.currency}</Text>
                  <AdaptiveGlassView style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={ruleCurrency}
                      onChangeText={setRuleCurrency}
                      placeholder="USD"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </AdaptiveGlassView>
                </View>
              </>
            )}
          </>
        )}

        {/* AI Tip */}
        {!habitId && title.trim() && (
          <AdaptiveGlassView style={styles.aiTipCard}>
            <View style={styles.aiTipHeader}>
              <HelpCircle size={16} color={theme.colors.warning} />
              <Text style={styles.aiTipLabel}>{habitStrings.aiTipLabel}</Text>
            </View>
            <Text style={styles.aiTipText}>
              {countingType === 'quit'
                ? 'Each day you resist strengthens your willpower. Stay focused on your goal!'
                : 'Consistency is key. Start small and build up gradually for lasting change.'}
            </Text>
          </AdaptiveGlassView>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {!habitId && (
          <Pressable
            style={styles.buttonSecondary}
            onPress={() => handleSubmit(true)}
            disabled={!title.trim()}
          >
            <AdaptiveGlassView style={[styles.buttonSecondaryInner, !title.trim() && styles.buttonDisabled]}>
              <Text style={styles.buttonSecondaryText}>{habitStrings.createAndMore}</Text>
            </AdaptiveGlassView>
          </Pressable>
        )}
        {habitId && (
          <Pressable
            style={styles.buttonSecondary}
            onPress={() => router.back()}
          >
            <AdaptiveGlassView style={styles.buttonSecondaryInner}>
              <Text style={styles.buttonSecondaryText}>{habitStrings.cancel}</Text>
            </AdaptiveGlassView>
          </Pressable>
        )}
        <Pressable
          style={[styles.buttonPrimary, !title.trim() && styles.buttonDisabled]}
          onPress={() => handleSubmit(false)}
          disabled={!title.trim()}
        >
          <Text style={styles.buttonPrimaryText}>{habitId ? habitStrings.update : habitStrings.create}</Text>
        </Pressable>
      </View>

      {Platform.OS === 'ios' && showTimePicker && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={timeOfDay || new Date()}
            mode="time"
            display="spinner"
            is24Hour={true}
            onChange={(event, selectedTime) => {
              if (event.type === 'set' && selectedTime) {
                setTimeOfDay(selectedTime);
              }
            }}
          />
          <Pressable
            style={styles.pickerDoneButton}
            onPress={() => setShowTimePicker(false)}
          >
            <Text style={styles.pickerDoneText}>{habitStrings.done}</Text>
          </Pressable>
        </View>
      )}

      {Platform.OS === 'ios' && showReminderPicker && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={reminderTime || new Date()}
            mode="time"
            display="spinner"
            is24Hour={true}
            onChange={(event, selectedTime) => {
              if (event.type === 'set' && selectedTime) {
                setReminderTime(selectedTime);
              }
            }}
          />
          <Pressable
            style={styles.pickerDoneButton}
            onPress={() => setShowReminderPicker(false)}
          >
            <Text style={styles.pickerDoneText}>{habitStrings.done}</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  closeText: {
    fontSize: 17,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  sectionFullWidth: {
    gap: 8,
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  // Popular Habits
  popularHabitsListContainer: {
    height: 130,
  },
  habitTypeListContainer: {
    height: 80,
  },
  popularHabitsRow: {
    gap: 10,
    paddingVertical: 4,
  },
  popularHabitCard: {
    width: 130,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: 8,
  },
  popularHabitIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  popularHabitTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    maxWidth: 106,
  },
  popularHabitTime: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  // Counting Type
  countingTypeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countingTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
  },
  countingTypeButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}15`,
  },
  countingTypeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  countingTypeLabelActive: {
    color: theme.colors.primary,
  },
  // Difficulty
  difficultyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  difficultyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
  },
  difficultyButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}15`,
  },
  difficultyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  difficultyLabelActive: {
    color: theme.colors.primary,
  },
  // Streak
  streakOptionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: -16,
  },
  streakOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  streakOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}15`,
  },
  streakOptionDays: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  streakOptionDaysActive: {
    color: theme.colors.primary,
  },
  streakOptionLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  streakOptionLabelActive: {
    color: theme.colors.primary,
  },
  streakMotivationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: `${theme.colors.warning}15`,
    marginTop: -8,
  },
  streakMotivationText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.warning,
    fontWeight: '500',
  },
  // AI Tip
  aiTipCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  aiTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiTipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.warning,
  },
  aiTipText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  // Existing styles
  inputWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  input: {
    padding: 14,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  textArea: {
    padding: 14,
    fontSize: 16,
    color: theme.colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  carouselRow: {
    gap: 10,
    paddingVertical: 6,
  },
  typeCard: {
    width: 110,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  typeCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}15`,
  },
  typeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: theme.colors.surfaceMuted,
  },
  typeIconWrapActive: {
    backgroundColor: `${theme.colors.primary}20`,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    maxWidth: 86,
  },
  typeLabelActive: {
    color: theme.colors.primary,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  chipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}15`,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    maxWidth: 140,
  },
  chipLabelActive: {
    color: theme.colors.primary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  switchLabel: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateButtonText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  buttonSecondary: {
    flex: 1,
  },
  buttonSecondaryInner: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  buttonPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerDoneButton: {
    alignItems: 'center',
    padding: 12,
  },
  pickerDoneText: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  // Weekday styles
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  weekdayButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  weekdayButtonActive: {
    backgroundColor: `${theme.colors.primary}20`,
    borderColor: theme.colors.primary,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  weekdayTextActive: {
    color: theme.colors.primary,
  },
  // Priority dropdown styles
  dropdown: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: theme.colors.card,
  },
  dropdownContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownItemActive: {
    backgroundColor: theme.colors.cardItem,
  },
  dropdownItemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  dropdownItemLabelActive: {
    color: theme.colors.textPrimary,
  },
  dropdownPlaceholder: {
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  dropdownSelectedText: {
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  // Completion Mode styles
  completionModeSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  completionModeTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  completionModeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  completionModeDesc: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  // Calendar styles for custom dates picker
  calendarContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarNavButton: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    paddingHorizontal: 8,
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  calendarWeekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarWeekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    width: 40,
    textAlign: 'center',
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 4,
  },
  calendarDayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  calendarDayCellSelected: {
    backgroundColor: theme.colors.primary,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
  },
  calendarSelectedCount: {
    marginTop: 12,
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
}));
