import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useShallow } from 'zustand/react/shallow';
import { Calendar, CalendarDays, Settings, Clock, DollarSign } from 'lucide-react-native';

import { useAppTheme } from '@/constants/theme';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import type { HabitType, CompletionMode, HabitFinanceRule, Frequency } from '@/domain/planner/types';

type Props = {
  habitId?: string;
};

const HABIT_TYPES: { id: HabitType; label: string }[] = [
  { id: 'health', label: 'Health' },
  { id: 'finance', label: 'Finance' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'education', label: 'Education' },
  { id: 'personal', label: 'Personal' },
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          {habitId ? 'Edit Habit' : 'New Habit'}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>Close</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Habit Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Habit Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
            value={title}
            onChangeText={setTitle}
            placeholder="E.g., Morning meditation, Exercise, Read"
            placeholderTextColor={theme.colors.textMuted}
            autoFocus
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Description</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: theme.colors.card, color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Why is this habit important to you?"
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Habit Type */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Habit Type</Text>
          <View style={styles.chipRow}>
            {HABIT_TYPES.map((type) => (
              <Pressable
                key={type.id}
                style={[
                  styles.chip,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                  habitType === type.id && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
                onPress={() => setHabitType(type.id)}
              >
                <Text style={[
                  styles.chipLabel,
                  { color: theme.colors.textPrimary },
                  habitType === type.id && { color: '#FFFFFF' },
                ]}>
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Frequency */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Frequency</Text>
          <View style={styles.chipRow}>
            {FREQUENCY_TYPES.map((type) => (
              <Pressable
                key={type.id}
                style={[
                  styles.chip,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                  frequency === type.id && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
                onPress={() => setFrequency(type.id)}
              >
                {renderFrequencyIcon(
                  type.icon,
                  16,
                  frequency === type.id ? '#FFFFFF' : theme.colors.textPrimary
                )}
                <Text style={[
                  styles.chipLabel,
                  { color: theme.colors.textPrimary },
                  frequency === type.id && { color: '#FFFFFF' },
                ]}>
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Times per week/day */}
        {(frequency === 'weekly' || frequency === 'custom') && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              {frequency === 'weekly' ? 'Times per week' : 'Times per period'}
            </Text>
            <View style={styles.chipRow}>
              {TIMES_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.chip,
                    { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                    timesPerWeek === opt.value && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                  ]}
                  onPress={() => setTimesPerWeek(opt.value)}
                >
                  <Text style={[
                    styles.chipLabel,
                    { color: theme.colors.textPrimary },
                    timesPerWeek === opt.value && { color: '#FFFFFF' },
                  ]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Completion Mode */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Completion Mode</Text>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.colors.textPrimary }]}>Boolean (Done/Miss)</Text>
            <Switch
              value={completionMode === 'numeric'}
              onValueChange={(val) => setCompletionMode(val ? 'numeric' : 'boolean')}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
            <Text style={[styles.switchLabel, { color: theme.colors.textPrimary }]}>Numeric (Track Value)</Text>
          </View>
        </View>

        {/* Target & Unit (if numeric) */}
        {completionMode === 'numeric' && (
          <>
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Target per Day</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                value={targetPerDay}
                onChangeText={setTargetPerDay}
                placeholder="E.g., 8, 10000, 30"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Unit</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                value={unit}
                onChangeText={setUnit}
                placeholder="E.g., km, glasses, minutes"
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>
          </>
        )}

        {/* Time of Day */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Time of Day (Optional)</Text>
          <Pressable
            style={[styles.dateButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={handleTimePress}
          >
            <Clock size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.dateButtonText, { color: theme.colors.textPrimary }]}>
              {timeOfDay ? timeOfDay.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Set time'}
            </Text>
          </Pressable>
        </View>

        {/* Link to Goal */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Link to Goal (Optional)</Text>
          <View style={styles.chipRow}>
            <Pressable
              style={[
                styles.chip,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                !goalId && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
              ]}
              onPress={() => setGoalId(undefined)}
            >
              <Text style={[
                styles.chipLabel,
                { color: theme.colors.textPrimary },
                !goalId && { color: '#FFFFFF' },
              ]}>
                None
              </Text>
            </Pressable>
            {goals.filter(g => g.status === 'active').map((goal) => (
              <Pressable
                key={goal.id}
                style={[
                  styles.chip,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                  goalId === goal.id && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
                onPress={() => setGoalId(goal.id)}
              >
                <Text style={[
                  styles.chipLabel,
                  { color: theme.colors.textPrimary },
                  goalId === goal.id && { color: '#FFFFFF' },
                ]}>
                  {goal.title}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Finance Rule */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <DollarSign size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.label, { color: theme.colors.textSecondary, flex: 1 }]}>Finance Rule (Auto-evaluate)</Text>
            <Switch
              value={enableFinanceRule}
              onValueChange={setEnableFinanceRule}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {enableFinanceRule && (
          <>
            {/* Finance Rule Type */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Rule Type</Text>
              <View style={styles.chipRow}>
                {FINANCE_RULE_TYPES.map((rule) => (
                  <Pressable
                    key={rule.id}
                    style={[
                      styles.chip,
                      { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                      financeRuleType === rule.id && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                    ]}
                    onPress={() => setFinanceRuleType(rule.id as any)}
                  >
                    <Text style={[
                      styles.chipLabel,
                      { color: theme.colors.textPrimary },
                      financeRuleType === rule.id && { color: '#FFFFFF' },
                    ]}>
                      {rule.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Categories (for no_spend / spend_in) */}
            {(financeRuleType === 'no_spend_in_categories' || financeRuleType === 'spend_in_categories') && (
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Select Categories</Text>
                <View style={styles.chipRow}>
                  {categories.map((cat) => (
                    <Pressable
                      key={cat}
                      style={[
                        styles.chip,
                        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                        selectedCategories.includes(cat) && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                      ]}
                      onPress={() => toggleCategory(cat)}
                    >
                      <Text style={[
                        styles.chipLabel,
                        { color: theme.colors.textPrimary },
                        selectedCategories.includes(cat) && { color: '#FFFFFF' },
                      ]}>
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Min Amount (for spend_in_categories) */}
            {financeRuleType === 'spend_in_categories' && (
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Minimum Amount (Optional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                  value={ruleAmount}
                  onChangeText={setRuleAmount}
                  placeholder="E.g., 50"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Accounts (for has_any_transactions) */}
            {financeRuleType === 'has_any_transactions' && (
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Select Accounts (Optional)</Text>
                <View style={styles.chipRow}>
                  {accounts.map((acc) => (
                    <Pressable
                      key={acc.id}
                      style={[
                        styles.chip,
                        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                        selectedAccounts.includes(acc.id) && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                      ]}
                      onPress={() => toggleAccount(acc.id)}
                    >
                      <Text style={[
                        styles.chipLabel,
                        { color: theme.colors.textPrimary },
                        selectedAccounts.includes(acc.id) && { color: '#FFFFFF' },
                      ]}>
                        {acc.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Amount & Currency (for daily_spend_under) */}
            {financeRuleType === 'daily_spend_under' && (
              <>
                <View style={styles.section}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Daily Limit Amount</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                    value={ruleAmount}
                    onChangeText={setRuleAmount}
                    placeholder="E.g., 100"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.section}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Currency</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                    value={ruleCurrency}
                    onChangeText={setRuleCurrency}
                    placeholder="USD"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Pressable
          style={[styles.button, styles.buttonSecondary, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.buttonSecondaryText, { color: theme.colors.textPrimary }]}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.buttonPrimary, { backgroundColor: theme.colors.primary }]}
          onPress={handleSubmit}
          disabled={!title.trim()}
        >
          <Text style={styles.buttonPrimaryText}>{habitId ? 'Update' : 'Create'} Habit</Text>
        </Pressable>
      </View>

      {Platform.OS === 'ios' && showTimePicker && (
        <View style={[styles.pickerContainer, { backgroundColor: theme.colors.card }]}>
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
            <Text style={[styles.pickerDoneText, { color: theme.colors.primary }]}>Done</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeText: {
    fontSize: 17,
    fontWeight: '500',
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
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: 'top',
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
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    fontSize: 14,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    borderWidth: 1,
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPrimary: {},
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  },
});
