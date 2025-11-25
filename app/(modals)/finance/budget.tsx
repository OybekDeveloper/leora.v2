import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { getCategoriesForType } from '@/constants/financeCategories';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useFinancePreferencesStore } from '@/stores/useFinancePreferencesStore';
import { useSelectedDayStore } from '@/stores/selectedDayStore';
import { addDays, addMonths, startOfMonth, startOfWeek } from '@/utils/calendar';
import type { BudgetPeriodType } from '@/domain/finance/types';
import { useShallow } from 'zustand/react/shallow';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';

const formatDate = (date?: Date | null) => {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
  } catch {
    return date.toDateString();
  }
};

type RouteParams = {
  id?: string;
  goalId?: string;
};

export default function BudgetModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { strings, locale } = useLocalization();
  const commonStrings = (strings as any).common ?? {};
  const closeLabel = commonStrings.close ?? 'Close';
  const { id, goalId } = useLocalSearchParams<RouteParams>();
  const editingId = Array.isArray(id) ? id[0] : id ?? null;
  const linkedGoalId = Array.isArray(goalId) ? goalId[0] : goalId ?? null;

  const baseCurrency = useFinancePreferencesStore((state) => state.baseCurrency);
  const goals = usePlannerDomainStore((state) => state.goals);

  const { budgets, accounts, createBudget, updateBudget, archiveBudget } = useFinanceDomainStore(
    useShallow((state) => ({
      budgets: state.budgets,
      accounts: state.accounts,
      createBudget: state.createBudget,
      updateBudget: state.updateBudget,
      archiveBudget: state.archiveBudget,
    })),
  );

  const selectedDate = useSelectedDayStore((state) => state.selectedDate ?? new Date());
  const normalizedSelectedDate = useMemo(() => startOfMonth(selectedDate), [selectedDate]);

  const editingBudget = useMemo(() => budgets.find((budget) => budget.id === editingId) ?? null, [budgets, editingId]);

  const [formName, setFormName] = useState('');
  const [limitInput, setLimitInput] = useState('');
  const [limitValue, setLimitValue] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(accounts[0]?.id ?? null);
  const [transactionType, setTransactionType] = useState<'income' | 'outcome'>('outcome');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [periodType, setPeriodType] = useState<BudgetPeriodType>('monthly');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [iosRangePicker, setIosRangePicker] = useState<{ target: 'start' | 'end'; value: Date } | null>(null);
  const [rangeTarget, setRangeTarget] = useState<'start' | 'end' | null>(null);

  const availableCategories = useMemo(() => getCategoriesForType(transactionType === 'income' ? 'income' : 'outcome'), [transactionType]);

  const accountMap = useMemo(() => new Map(accounts.map((acc) => [acc.id, acc])), [accounts]);

  const isCustomRangeValid = useMemo(() => {
    if (periodType !== 'custom_range') return true;
    return Boolean(customStartDate && customEndDate && customEndDate >= customStartDate);
  }, [customEndDate, customStartDate, periodType]);

  const computedRange = useMemo(() => {
    const start = periodType === 'weekly'
      ? startOfWeek(normalizedSelectedDate)
      : periodType === 'monthly'
        ? startOfMonth(normalizedSelectedDate)
        : periodType === 'custom_range'
          ? customStartDate
          : startOfMonth(normalizedSelectedDate);
    const end = periodType === 'weekly'
      ? addDays(startOfWeek(normalizedSelectedDate), 6)
      : periodType === 'monthly'
        ? addDays(addMonths(startOfMonth(normalizedSelectedDate), 1), -1)
        : periodType === 'custom_range'
          ? customEndDate
          : addDays(addMonths(startOfMonth(normalizedSelectedDate), 1), -1);
    return { start, end };
  }, [customEndDate, customStartDate, normalizedSelectedDate, periodType]);

  const formattedRange = useMemo(() => {
    if (!computedRange.start || !computedRange.end) return null;
    const formatter = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' });
    return `${formatter.format(computedRange.start)} - ${formatter.format(computedRange.end)}`;
  }, [computedRange, locale]);

  const ensuredCategories = useMemo(() => {
    if (selectedCategories.length > 0) return selectedCategories;
    if (availableCategories.length > 0) return [availableCategories[0].name];
    return [];
  }, [availableCategories, selectedCategories]);

  const isBudgetFormValid = formName.trim().length > 0 && limitValue > 0 && ensuredCategories.length > 0 && isCustomRangeValid;

  useEffect(() => {
    if (!editingBudget) return;
    setFormName(editingBudget.name);
    setLimitInput(String(editingBudget.limitAmount));
    setLimitValue(editingBudget.limitAmount);
    setSelectedAccountId(editingBudget.accountId ?? null);
    setTransactionType(editingBudget.transactionType === 'income' ? 'income' : 'outcome');
    setSelectedCategories(editingBudget.categoryIds ?? []);
    setNotifyEnabled(Boolean(editingBudget.notifyOnExceed));
    setPeriodType(editingBudget.periodType ?? 'monthly');
    setCustomStartDate(editingBudget.startDate ? new Date(editingBudget.startDate) : null);
    setCustomEndDate(editingBudget.endDate ? new Date(editingBudget.endDate) : null);
  }, [editingBudget]);

  useEffect(() => {
    if (!selectedAccountId && accounts[0]) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    const allowedNames = availableCategories.map((cat) => cat.name);
    setSelectedCategories((prev) => {
      const filtered = prev.filter((name) => allowedNames.includes(name));
      if (filtered.length > 0) return filtered;
      return allowedNames.length ? [allowedNames[0]] : [];
    });
  }, [availableCategories]);

  const handleLimitInputChange = useCallback((value: string) => {
    const cleaned = value.replace(/[^0-9.,]/g, '').replace(/,/g, '.');
    setLimitInput(cleaned);
    const parsed = parseFloat(cleaned || '0');
    setLimitValue(Number.isFinite(parsed) ? parsed : 0);
  }, []);

  const toggleCategory = useCallback((name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    );
  }, []);

  const handlePeriodChange = useCallback((type: BudgetPeriodType) => {
    setPeriodType(type);
    if (type !== 'custom_range') {
      setCustomStartDate(null);
      setCustomEndDate(null);
    }
  }, []);

  const openRangePicker = useCallback(
    (target: 'start' | 'end') => {
      if (Platform.OS === 'android') {
        const base = target === 'start' ? customStartDate ?? new Date() : customEndDate ?? new Date();
        DateTimePickerAndroid.open({
          value: base,
          mode: 'date',
          onChange: (event, selected) => {
            if (event.type !== 'set' || !selected) return;
            if (target === 'start') setCustomStartDate(selected);
            else setCustomEndDate(selected);
          },
        });
      } else {
        setRangeTarget(target);
        setIosRangePicker({ target, value: target === 'start' ? customStartDate ?? new Date() : customEndDate ?? new Date() });
      }
    },
    [customEndDate, customStartDate],
  );

  const handleIosRangeChange = useCallback(
    (event: DateTimePickerEvent, selected?: Date) => {
      if (!iosRangePicker) return;
      if (event.type === 'dismissed') {
        setIosRangePicker(null);
        setRangeTarget(null);
        return;
      }
      if (selected && rangeTarget) {
        if (rangeTarget === 'start') setCustomStartDate(selected);
        if (rangeTarget === 'end') setCustomEndDate(selected);
      }
    },
    [iosRangePicker, rangeTarget],
  );

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleSubmit = useCallback(() => {
    if (!isBudgetFormValid || ensuredCategories.length === 0) {
      return;
    }

    const resolvedLinkedGoalId = linkedGoalId ?? editingBudget?.linkedGoalId ?? null;
    const linkedGoal = resolvedLinkedGoalId ? goals.find((g) => g.id === resolvedLinkedGoalId) : null;
    const startDateValue = computedRange.start ?? startOfMonth(normalizedSelectedDate);
    const endDateValue = computedRange.end ?? addDays(addMonths(new Date(startDateValue), 1), -1);
    const startIso = startDateValue.toISOString();
    const endIso = endDateValue.toISOString();
    const account = selectedAccountId ? accountMap.get(selectedAccountId) : undefined;

    if (editingBudget) {
      updateBudget(editingBudget.id, {
        name: formName.trim(),
        limitAmount: limitValue,
        accountId: selectedAccountId ?? undefined,
        transactionType: transactionType === 'income' ? 'income' : 'expense',
        categoryIds: ensuredCategories,
        notifyOnExceed: notifyEnabled,
        periodType,
        startDate: startIso,
        endDate: endIso,
        linkedGoalId: resolvedLinkedGoalId ?? undefined,
      });
    } else {
      createBudget({
        userId: 'local-user',
        name: formName.trim(),
        budgetType: 'category',
        categoryIds: ensuredCategories,
        accountId: selectedAccountId ?? undefined,
        transactionType: transactionType === 'income' ? 'income' : 'expense',
        currency: linkedGoal?.currency ?? account?.currency ?? baseCurrency,
        limitAmount: limitValue,
        periodType,
        startDate: startIso,
        endDate: endIso,
        notifyOnExceed: notifyEnabled,
        rolloverMode: 'none',
        isArchived: false,
        linkedGoalId: resolvedLinkedGoalId ?? undefined,
      });
    }

    handleClose();
  }, [
    accountMap,
    baseCurrency,
    computedRange,
    createBudget,
    editingBudget,
    ensuredCategories,
    formName,
    goals,
    handleClose,
    isBudgetFormValid,
    limitValue,
    linkedGoalId,
    normalizedSelectedDate,
    notifyEnabled,
    periodType,
    selectedAccountId,
    transactionType,
    updateBudget,
  ]);

  const handleDeleteCurrentBudget = useCallback(() => {
    if (!editingBudget) return;
    const linkedGoals = goals.filter((goal) => goal.linkedBudgetId === editingBudget.id);
    if (linkedGoals.length > 0) {
      Alert.alert(
        'Budget is linked',
        linkedGoals.length === 1
          ? 'This budget is linked to a goal. Unlink it before deleting.'
          : 'This budget is linked to multiple goals. Unlink them before deleting.',
      );
      return;
    }
    archiveBudget(editingBudget.id);
    handleClose();
  }, [archiveBudget, editingBudget, goals, handleClose]);

  const periodOptions: BudgetPeriodType[] = ['weekly', 'monthly', 'custom_range'];
  const periodLabels: Record<BudgetPeriodType, string> = {
    weekly: strings.financeScreens.budgets.form.periodOptions.weekly,
    monthly: strings.financeScreens.budgets.form.periodOptions.monthly,
    custom_range: strings.financeScreens.budgets.form.periodOptions.custom_range,
    none: strings.financeScreens.budgets.form.periodOptions.monthly,
  };

  return (
    <>
      <SafeAreaView edges={['bottom',"top"]} style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
            {editingBudget ? strings.financeScreens.debts.modal.buttons.saveChanges : strings.financeScreens.budgets.setLimit}
          </Text>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>{closeLabel}</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          >
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                {strings.financeScreens.budgets.form.nameLabel as string}
              </Text>
              <AdaptiveGlassView style={[styles.glassSurface, styles.inputContainer]}>
                <TextInput
                  value={formName}
                  onChangeText={setFormName}
                  placeholder={strings.financeScreens.budgets.form.namePlaceholder as string}
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.textInput, { color: theme.colors.textPrimary }]}
                />
              </AdaptiveGlassView>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                {`${strings.financeScreens.transactions.details.amount} (${selectedAccountId ? accountMap.get(selectedAccountId)?.currency ?? baseCurrency : baseCurrency})`}
              </Text>
              <AdaptiveGlassView style={[styles.glassSurface, styles.inputContainer]}>
                <TextInput
                  value={limitInput}
                  onChangeText={handleLimitInputChange}
                  keyboardType="numeric"
                  placeholder={(strings.financeScreens.budgets.form.limitPlaceholder as string) ?? '0'}
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.textInput, { color: theme.colors.textPrimary }]}
                />
              </AdaptiveGlassView>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{strings.financeScreens.debts.modal.accountLabel}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.accountScroll}
              >
                {accounts.map((account) => {
                  const isSelected = account.id === selectedAccountId;
                  return (
                    <Pressable key={account.id} onPress={() => setSelectedAccountId(account.id)} style={({ pressed }) => [pressed && styles.pressed]}>
                      <AdaptiveGlassView
                        style={[styles.glassSurface, styles.accountChip, { opacity: isSelected ? 1 : 0.6 }]}
                      >
                        <Text style={[styles.accountChipLabel, { color: isSelected ? '#FFFFFF' : '#9E9E9E' }]}>
                          {account.name}
                        </Text>
                        <Text style={styles.accountChipSubtext}>{account.currency}</Text>
                      </AdaptiveGlassView>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{strings.financeScreens.budgets.form.periodLabel}</Text>
              <View style={styles.periodChipsRow}>
                {periodOptions.map((type) => {
                  const active = periodType === type;
                  return (
                    <Pressable key={type} onPress={() => handlePeriodChange(type)}>
                      <AdaptiveGlassView
                        style={[styles.glassSurface, styles.periodChip, active && styles.periodChipActive]}
                      >
                        <Text style={[styles.periodChipLabel, active && styles.periodChipLabelActive]}>
                          {periodLabels[type]}
                        </Text>
                      </AdaptiveGlassView>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.rangeSummary}>
                {strings.financeScreens.budgets.form.selectedRangeLabel.replace('{range}', formattedRange ?? '—')}
              </Text>
            </View>

            {periodType === 'custom_range' && (
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  {strings.financeScreens.budgets.form.customRange.helper}
                </Text>
                <View style={styles.customRangeRow}>
                  <Pressable onPress={() => openRangePicker('start')}>
                    <AdaptiveGlassView style={[styles.glassSurface, styles.rangeButton]}>
                      <Text style={styles.rangeButtonLabel}>{strings.financeScreens.budgets.form.customRange.start}</Text>
                      <Text style={styles.rangeValue}>{formatDate(customStartDate)}</Text>
                    </AdaptiveGlassView>
                  </Pressable>
                  <Pressable onPress={() => openRangePicker('end')}>
                    <AdaptiveGlassView style={[styles.glassSurface, styles.rangeButton]}>
                      <Text style={styles.rangeButtonLabel}>{strings.financeScreens.budgets.form.customRange.end}</Text>
                      <Text style={styles.rangeValue}>{formatDate(customEndDate)}</Text>
                    </AdaptiveGlassView>
                  </Pressable>
                </View>
                {!isCustomRangeValid && (
                  <Text style={styles.rangeError}>{strings.financeScreens.budgets.form.customRange.error}</Text>
                )}
              </View>
            )}

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{strings.financeScreens.accounts.header}</Text>
              <AdaptiveGlassView style={[styles.glassSurface, styles.typeContainer]}>
                <Pressable
                  onPress={() => setTransactionType('outcome')}
                  style={({ pressed }) => [styles.typeOption, { borderBottomWidth: 1 }, pressed && styles.pressed]}
                >
                  <View style={styles.typeOptionContent}>
                    <Text style={[styles.typeLabel, { color: transactionType === 'outcome' ? '#FFFFFF' : '#7E8B9A' }]}>
                      {strings.financeScreens.accounts.outcome}
                    </Text>
                  </View>
                </Pressable>

                <Pressable onPress={() => setTransactionType('income')} style={({ pressed }) => [styles.typeOption, pressed && styles.pressed]}>
                  <View style={styles.typeOptionContent}>
                    <Text style={[styles.typeLabel, { color: transactionType === 'income' ? '#FFFFFF' : '#7E8B9A' }]}>
                      {strings.financeScreens.accounts.income}
                    </Text>
                  </View>
                </Pressable>
              </AdaptiveGlassView>
            </View>

            <View style={[styles.section, { paddingHorizontal: 0 }]}> 
              <Text style={[styles.label, { paddingHorizontal: 20, color: theme.colors.textSecondary }]}>
                {strings.financeScreens.transactions.details.category}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryChipScroll}
              >
                {availableCategories.map((category) => {
                  const isActive = selectedCategories.includes(category.name);
                  const Icon = category.icon;
                  return (
                    <Pressable key={category.id} onPress={() => toggleCategory(category.name)} style={({ pressed }) => [pressed && styles.pressed]}>
                      <AdaptiveGlassView
                        style={[styles.glassSurface, styles.categoryChipCard, { opacity: isActive ? 1 : 0.6 }]}
                      >
                        <Icon size={20} color={isActive ? '#FFFFFF' : '#9E9E9E'} />
                        <Text style={[styles.categoryChipLabel, { color: isActive ? '#FFFFFF' : '#9E9E9E' }]}>
                          {category.name}
                        </Text>
                      </AdaptiveGlassView>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <AdaptiveGlassView style={[styles.glassSurface, styles.notificationRow]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notificationLabel}>{strings.financeScreens.debts.modal.reminderToggle}</Text>
                  <Text style={styles.notificationSubtext}>
                    {notifyEnabled
                      ? strings.financeScreens.debts.modal.reminderEnabledLabel
                      : strings.financeScreens.debts.modal.reminderDisabledLabel}
                  </Text>
                </View>
                <Switch value={notifyEnabled} onValueChange={setNotifyEnabled} />
              </AdaptiveGlassView>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.actionButtons}>
          <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={handleClose}>
            <Text style={styles.secondaryButtonText}>{commonStrings.cancel ?? 'Cancel'}</Text>
          </Pressable>
          <Pressable
            disabled={!isBudgetFormValid}
            onPress={handleSubmit}
            style={({ pressed }) => [styles.primaryButton, pressed && isBudgetFormValid && styles.pressed]}
          >
            <AdaptiveGlassView
              style={[styles.glassSurface, styles.primaryButtonInner, { opacity: !isBudgetFormValid ? 0.4 : 1 }]}
            >
              <Text
                style={[styles.primaryButtonText, { color: !isBudgetFormValid ? '#7E8B9A' : '#FFFFFF' }]}
              >
                {editingBudget
                  ? strings.financeScreens.debts.modal.buttons.saveChanges
                  : strings.financeScreens.budgets.setLimit}
              </Text>
            </AdaptiveGlassView>
          </Pressable>
        </View>

        {editingBudget && (
          <View style={[styles.deleteContainer, { paddingBottom: insets.bottom + 8 }]}>
            <Pressable onPress={handleDeleteCurrentBudget} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
              <Text style={styles.deleteButtonText}>{strings.financeScreens.accounts.actions.delete}</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>

      {Platform.OS === 'ios' && iosRangePicker && (
        <Modal transparent visible animationType="fade" onRequestClose={() => setIosRangePicker(null)}>
          <View style={styles.pickerModal}>
            <Pressable style={styles.pickerBackdrop} onPress={() => setIosRangePicker(null)} />
            <AdaptiveGlassView style={[styles.glassSurface, styles.pickerCard]}>
              <DateTimePicker
                value={iosRangePicker.value}
                mode="date"
                display="inline"
                onChange={handleIosRangeChange}
              />
              <Pressable onPress={() => setIosRangePicker(null)} style={styles.pickerDoneButton}>
                <Text style={styles.pickerDoneText}>{commonStrings.apply ?? 'OK'}</Text>
              </Pressable>
            </AdaptiveGlassView>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 18,
  },
  section: {
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  glassSurface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  inputContainer: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '600',
  },
  accountScroll: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    gap: 12,
  },
  accountChip: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: 140,
  },
  accountChipLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  accountChipSubtext: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  periodChipsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  periodChipActive: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  periodChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7E8B9A',
  },
  periodChipLabelActive: {
    color: '#FFFFFF',
  },
  rangeSummary: {
    fontSize: 12,
    color: '#7E8B9A',
  },
  customRangeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rangeButton: {
    borderRadius: 16,
    padding: 14,
    width: 160,
    gap: 6,
  },
  rangeButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7E8B9A',
  },
  rangeValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rangeError: {
    marginTop: 6,
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
  },
  typeContainer: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  typeOptionContent: {
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoryChipScroll: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryChipCard: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryChipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  notificationRow: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notificationSubtext: {
    fontSize: 12,
    color: '#7E8B9A',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
  },
  primaryButtonInner: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  deleteContainer: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  deleteButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  deleteButtonText: {
    color: '#FF6B6B',
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
  pickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  pickerCard: {
    borderRadius: 24,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  pickerDoneButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
