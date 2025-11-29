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
} from 'lucide-react-native';

import { createThemedStyles, useAppTheme } from '@/constants/theme';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import type { HabitType, CompletionMode, HabitFinanceRule, Frequency } from '@/domain/planner/types';

type Props = {
  habitId?: string;
};

const HABIT_TYPES: { id: HabitType; label: string; icon: typeof HeartPulse }[] = [
  { id: 'health', label: 'Health', icon: HeartPulse },
  { id: 'finance', label: 'Finance', icon: PiggyBank },
  { id: 'productivity', label: 'Productivity', icon: Sparkles },
  { id: 'education', label: 'Education', icon: BookOpen },
  { id: 'personal', label: 'Personal', icon: Smile },
  { id: 'custom', label: 'Custom', icon: PlusCircle },
];

const FREQUENCY_TYPES: { id: Frequency; label: string; icon: string }[] = [
  { id: 'daily', label: 'Daily', icon: 'calendar' },
  { id: 'weekly', label: 'Weekly', icon: 'calendarDays' },
  { id: 'custom', label: 'Custom', icon: 'settings' },
];

const TIMES_OPTIONS = [
  { value: 1, label: 'Once' },
  { value: 2, label: 'Twice' },
  { value: 3, label: '3 times' },
  { value: 4, label: '4 times' },
  { value: 5, label: '5 times' },
];

const FINANCE_RULE_TYPES = [
  { id: 'no_spend_in_categories', label: 'No Spend in Categories' },
  { id: 'spend_in_categories', label: 'Spend in Categories' },
  { id: 'has_any_transactions', label: 'Has Any Transactions' },
  { id: 'daily_spend_under', label: 'Daily Spend Under' },
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

export function HabitComponent({ habitId }: Props) {
  const styles = useStyles();
  const theme = useAppTheme();
  const router = useRouter();

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
  const [habitType, setHabitType] = useState<HabitType>('health');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [timesPerWeek, setTimesPerWeek] = useState(1);

  // New fields from spec
  const [completionMode, setCompletionMode] = useState<CompletionMode>('boolean');
  const [targetPerDay, setTargetPerDay] = useState<string>('1');
  const [unit, setUnit] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<Date | undefined>();
  const [goalId, setGoalId] = useState<string | undefined>();

  // Finance Rule
  const [enableFinanceRule, setEnableFinanceRule] = useState(false);
  const [financeRuleType, setFinanceRuleType] = useState<'no_spend_in_categories' | 'spend_in_categories' | 'has_any_transactions' | 'daily_spend_under'>('no_spend_in_categories');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [ruleAmount, setRuleAmount] = useState('');
  const [ruleCurrency, setRuleCurrency] = useState('USD');

  // Pickers
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Load habit data if editing
  useEffect(() => {
    if (habitId) {
      const habit = habits.find((h) => h.id === habitId);
      if (habit) {
        setTitle(habit.title || '');
        setDescription(habit.description || '');
        setHabitType(habit.habitType || 'health');
        setFrequency(habit.frequency || 'daily');
        setTimesPerWeek(habit.timesPerWeek || 1);
        setCompletionMode(habit.completionMode || 'boolean');
        setTargetPerDay(String(habit.targetPerDay || 1));
        setUnit(habit.unit || '');
        setGoalId(habit.goalId);

        if (habit.timeOfDay) {
          const [hours, minutes] = habit.timeOfDay.split(':').map(Number);
          const date = new Date();
          date.setHours(hours, minutes, 0, 0);
          setTimeOfDay(date);
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

  const handleSubmit = useCallback(() => {
    if (!title.trim()) return;

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

    const habitData = {
      title,
      description: description || undefined,
      habitType,
      frequency,
      timesPerWeek: frequency === 'weekly' || frequency === 'custom' ? timesPerWeek : undefined,
      completionMode,
      targetPerDay: completionMode === 'numeric' ? parseFloat(targetPerDay) : undefined,
      unit: completionMode === 'numeric' ? unit : undefined,
      timeOfDay: timeOfDay ? `${timeOfDay.getHours().toString().padStart(2, '0')}:${timeOfDay.getMinutes().toString().padStart(2, '0')}` : undefined,
      goalId,
      financeRule,
      updatedAt: new Date().toISOString(),
    };

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

    // Delay navigation to allow AsyncStorage to persist the changes
    setTimeout(() => {
      router.back();
    }, 100);
  }, [
    title,
    description,
    habitType,
    frequency,
    timesPerWeek,
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
    habitId,
    createHabit,
    updateHabit,
    router,
  ]);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {habitId ? 'Edit Habit' : 'New Habit'}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Habit Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Habit Name *</Text>
          <AdaptiveGlassView style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="E.g., Morning meditation, Exercise, Read"
              placeholderTextColor={theme.colors.textMuted}
              autoFocus
            />
          </AdaptiveGlassView>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <AdaptiveGlassView style={styles.inputWrapper}>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Why is this habit important to you?"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </AdaptiveGlassView>
        </View>

        {/* Habit Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Habit Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselRow}
          >
            {HABIT_TYPES.map((type) => {
              const Icon = type.icon;
              const active = habitType === type.id;
              return (
                <Pressable
                  key={type.id}
                  onPress={() => setHabitType(type.id)}
                >
                  <AdaptiveGlassView
                    style={[
                      styles.typeCard,
                      active && styles.typeCardActive,
                    ]}
                  >
                    <View style={[
                      styles.typeIconWrap,
                      active && styles.typeIconWrapActive,
                    ]}>
                      <Icon size={18} color={active ? theme.colors.primary : theme.colors.textSecondary} />
                    </View>
                    <Text style={[
                      styles.typeLabel,
                      active && styles.typeLabelActive,
                    ]}>
                      {type.label}
                    </Text>
                  </AdaptiveGlassView>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Frequency */}
        <View style={styles.section}>
          <Text style={styles.label}>Frequency</Text>
          <View style={styles.chipRow}>
            {FREQUENCY_TYPES.map((type) => (
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
                    {type.label}
                  </Text>
                </AdaptiveGlassView>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Times per week/day */}
        {(frequency === 'weekly' || frequency === 'custom') && (
          <View style={styles.section}>
            <Text style={styles.label}>
              {frequency === 'weekly' ? 'Times per week' : 'Times per period'}
            </Text>
            <View style={styles.chipRow}>
              {TIMES_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setTimesPerWeek(opt.value)}
                >
                  <AdaptiveGlassView
                    style={[
                      styles.chip,
                      timesPerWeek === opt.value && styles.chipActive,
                    ]}
                  >
                    <Text style={[
                      styles.chipLabel,
                      timesPerWeek === opt.value && styles.chipLabelActive,
                    ]}>
                      {opt.label}
                    </Text>
                  </AdaptiveGlassView>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Completion Mode */}
        <View style={styles.section}>
          <Text style={styles.label}>Completion Mode</Text>
          <AdaptiveGlassView style={styles.switchRow}>
            <Text style={styles.switchLabel}>Boolean (Done/Miss)</Text>
            <Switch
              value={completionMode === 'numeric'}
              onValueChange={(val) => setCompletionMode(val ? 'numeric' : 'boolean')}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
            <Text style={styles.switchLabel}>Numeric (Track Value)</Text>
          </AdaptiveGlassView>
        </View>

        {/* Target & Unit (if numeric) */}
        {completionMode === 'numeric' && (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Target per Day</Text>
              <AdaptiveGlassView style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={targetPerDay}
                  onChangeText={setTargetPerDay}
                  placeholder="E.g., 8, 10000, 30"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="numeric"
                />
              </AdaptiveGlassView>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Unit</Text>
              <AdaptiveGlassView style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="E.g., km, glasses, minutes"
                  placeholderTextColor={theme.colors.textMuted}
                />
              </AdaptiveGlassView>
            </View>
          </>
        )}

        {/* Time of Day */}
        <View style={styles.section}>
          <Text style={styles.label}>Time of Day (Optional)</Text>
          <Pressable onPress={handleTimePress}>
            <AdaptiveGlassView style={styles.dateButton}>
              <Clock size={20} color={theme.colors.textSecondary} />
              <Text style={styles.dateButtonText}>
                {timeOfDay ? timeOfDay.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Set time'}
              </Text>
            </AdaptiveGlassView>
          </Pressable>
        </View>

        {/* Link to Goal */}
        <View style={styles.section}>
          <Text style={styles.label}>Link to Goal (Optional)</Text>
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
                  None
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
                  <Text style={[
                    styles.chipLabel,
                    goalId === goal.id && styles.chipLabelActive,
                  ]}>
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
            <Text style={[styles.label, { flex: 1, marginBottom: 0 }]}>Finance Rule (Auto-evaluate)</Text>
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
              <Text style={styles.label}>Rule Type</Text>
              <View style={styles.chipRow}>
                {FINANCE_RULE_TYPES.map((rule) => (
                  <Pressable
                    key={rule.id}
                    onPress={() => setFinanceRuleType(rule.id as any)}
                  >
                    <AdaptiveGlassView
                      style={[
                        styles.chip,
                        financeRuleType === rule.id && styles.chipActive,
                      ]}
                    >
                      <Text style={[
                        styles.chipLabel,
                        financeRuleType === rule.id && styles.chipLabelActive,
                      ]}>
                        {rule.label}
                      </Text>
                    </AdaptiveGlassView>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Categories (for no_spend / spend_in) */}
            {(financeRuleType === 'no_spend_in_categories' || financeRuleType === 'spend_in_categories') && (
              <View style={styles.section}>
                <Text style={styles.label}>Select Categories</Text>
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
                        <Text style={[
                          styles.chipLabel,
                          selectedCategories.includes(cat) && styles.chipLabelActive,
                        ]}>
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
                <Text style={styles.label}>Minimum Amount (Optional)</Text>
                <AdaptiveGlassView style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={ruleAmount}
                    onChangeText={setRuleAmount}
                    placeholder="E.g., 50"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="numeric"
                  />
                </AdaptiveGlassView>
              </View>
            )}

            {/* Accounts (for has_any_transactions) */}
            {financeRuleType === 'has_any_transactions' && (
              <View style={styles.section}>
                <Text style={styles.label}>Select Accounts (Optional)</Text>
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
                        <Text style={[
                          styles.chipLabel,
                          selectedAccounts.includes(acc.id) && styles.chipLabelActive,
                        ]}>
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
                  <Text style={styles.label}>Daily Limit Amount</Text>
                  <AdaptiveGlassView style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={ruleAmount}
                      onChangeText={setRuleAmount}
                      placeholder="E.g., 100"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="numeric"
                    />
                  </AdaptiveGlassView>
                </View>
                <View style={styles.section}>
                  <Text style={styles.label}>Currency</Text>
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
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.buttonSecondary}
          onPress={() => router.back()}
        >
          <AdaptiveGlassView style={styles.buttonSecondaryInner}>
            <Text style={styles.buttonSecondaryText}>Cancel</Text>
          </AdaptiveGlassView>
        </Pressable>
        <Pressable
          style={[styles.buttonPrimary, !title.trim() && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!title.trim()}
        >
          <Text style={styles.buttonPrimaryText}>{habitId ? 'Update' : 'Create'} Habit</Text>
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
            <Text style={styles.pickerDoneText}>Done</Text>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
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
    gap: 12,
    paddingVertical: 6,
  },
  typeCard: {
    width: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    marginRight: 10,
    justifyContent: 'center',
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
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
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
}));
