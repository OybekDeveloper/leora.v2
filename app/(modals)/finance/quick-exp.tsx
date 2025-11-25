import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wallet } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import {
  FINANCE_CATEGORIES,
  type FinanceCategory,
  getCategoriesForType,
} from '@/constants/financeCategories';
import { useAppTheme } from '@/constants/theme';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useFinancePreferencesStore } from '@/stores/useFinancePreferencesStore';
import { useLocalization } from '@/localization/useLocalization';
import { useShallow } from 'zustand/react/shallow';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';

type IncomeOutcomeTab = 'income' | 'outcome';

type CategoryModalState = {
  mode: 'add' | 'edit';
  baseValue?: string;
};

export default function QuickExpenseModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const financeStrings = (strings as any).financeScreens ?? {};
  const transactionsStrings = financeStrings.transactions ?? {};
  const quickStrings = transactionsStrings.quick ?? {};
  const detailStrings = transactionsStrings.details ?? {};
  const filterStrings = transactionsStrings.filterSheet ?? {};
  const commonStrings = (strings as any).common ?? {};
  const debtStrings = financeStrings.debts?.modal ?? {};
  const { id, tab, goalId, budgetId } = useLocalSearchParams<{ id?: string; tab?: string; goalId?: string; budgetId?: string }>();
  const editingId = Array.isArray(id) ? id[0] : id ?? null;
  const initialTab = Array.isArray(tab) ? tab[0] : tab ?? null;
  const linkedGoalId = Array.isArray(goalId) ? goalId[0] : goalId ?? null;
  const budgetIdParam = Array.isArray(budgetId) ? budgetId[0] : budgetId ?? null;

  const baseCurrency = useFinancePreferencesStore((state) => state.baseCurrency);
  const goals = usePlannerDomainStore((state) => state.goals);

  const {
    accounts,
    categories,
    transactions,
    budgets,
    debts,
    createTransaction,
    updateTransaction,
    addCategory,
    renameCategory,
  } = useFinanceDomainStore(
    useShallow((state) => ({
      accounts: state.accounts,
      categories: state.categories,
      transactions: state.transactions,
      budgets: state.budgets,
      debts: state.debts,
      createTransaction: state.createTransaction,
      updateTransaction: state.updateTransaction,
      addCategory: state.addCategory,
      renameCategory: state.renameCategory,
    })),
  );

  const editingTransaction = useMemo(
    () => transactions.find((txn) => txn.id === editingId) ?? null,
    [transactions, editingId],
  );

  const [activeTab, setActiveTab] = useState<IncomeOutcomeTab>(
    initialTab === 'outcome' ? 'outcome' : 'income',
  );
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(accounts[0]?.id ?? null);
  const [note, setNote] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [categoryModalState, setCategoryModalState] = useState<CategoryModalState | null>(null);
  const [categoryDraft, setCategoryDraft] = useState('');
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [debtPerson, setDebtPerson] = useState('');
  const [accountModalVisible, setAccountModalVisible] = useState(false);

  const availableCategories = useMemo(() => {
    const baseList = getCategoriesForType(activeTab);
    const aggregated = new Map<string, FinanceCategory & { isCustom?: boolean }>();
    baseList.forEach((category) => aggregated.set(category.name, category));

    categories.forEach((name) => {
      if (!aggregated.has(name)) {
        const fallback = FINANCE_CATEGORIES.find((cat) => cat.name === name);
        aggregated.set(name, {
          id: `custom-${name}`,
          name,
          type: 'both',
          colorToken: fallback?.colorToken ?? 'primary',
          icon: fallback?.icon ?? Wallet,
          isCustom: true,
        });
      }
    });

    return Array.from(aggregated.values());
  }, [activeTab, categories]);

  const resetForm = useCallback(
    (tabValue: IncomeOutcomeTab, accountId?: string | null) => {
      setActiveTab(tabValue);
      setAmount('');
      setSelectedCategory(null);
      setSelectedAccount(accountId ?? accounts[0]?.id ?? null);
      setTransactionDate(new Date());
      setNote('');
      setDebtPerson('');
      setPickerMode(null);
    },
    [accounts],
  );

  useEffect(() => {
    if (!editingTransaction) {
      const fallbackTab: IncomeOutcomeTab =
        initialTab === 'outcome' ? 'outcome' : initialTab === 'income' ? 'income' : 'income';
      resetForm(fallbackTab);
      return;
    }

    const tabValue: IncomeOutcomeTab = editingTransaction.type === 'income' ? 'income' : 'outcome';
    resetForm(tabValue, editingTransaction.accountId ?? null);
    setAmount(editingTransaction.amount.toString());
    setSelectedCategory(editingTransaction.categoryId ?? null);
    setTransactionDate(new Date(editingTransaction.date));

    const noteText = editingTransaction.description ?? '';
    const debtRegex =
      tabValue === 'income'
        ? /^(.+?) owes me\.?\s?(.*)$/i
        : /^I owe to (.+?)\.?\s?(.*)$/i;
    const match = noteText.match(debtRegex);

    if (match) {
      setDebtPerson(match[1].trim());
      setNote(match[2]?.trim() ?? '');
    } else {
      setNote(noteText);
    }
  }, [editingTransaction, initialTab, resetForm]);

  const isDebtCategory = useMemo(() => {
    if (!selectedCategory) return false;
    const lower = selectedCategory.toLowerCase();
    return lower === 'debt' || lower === 'debts' || lower.includes('долг');
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedCategory) {
      return;
    }
    const exists = availableCategories.some((category) => category.name === selectedCategory);
    if (!exists) {
      setSelectedCategory(null);
    }
  }, [availableCategories, selectedCategory]);

  useEffect(() => {
    if (!isDebtCategory && debtPerson) {
      setDebtPerson('');
    }
  }, [isDebtCategory, debtPerson]);

  const formatCurrency = useCallback((value: number, currency: string = 'USD') => {
    try {
      return new Intl.NumberFormat(currency === 'UZS' ? 'uz-UZ' : 'en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: currency === 'UZS' ? 0 : 2,
      }).format(value);
    } catch {
      return `${currency} ${value.toFixed(2)}`;
    }
  }, []);

  const selectedAccountData = useMemo(
    () => accounts.find((account) => account.id === selectedAccount) ?? accounts[0] ?? null,
    [accounts, selectedAccount],
  );

  const effectiveGoalId = useMemo(
    () => linkedGoalId ?? editingTransaction?.goalId ?? null,
    [editingTransaction?.goalId, linkedGoalId],
  );
  const linkedGoal = useMemo(
    () => (effectiveGoalId ? goals.find((goal) => goal.id === effectiveGoalId) ?? null : null),
    [effectiveGoalId, goals],
  );
  const inferredBudgetId = editingTransaction?.budgetId ?? budgetIdParam ?? linkedGoal?.linkedBudgetId ?? null;
  const inferredDebtId = editingTransaction?.debtId ?? linkedGoal?.linkedDebtId ?? null;
  const linkedBudget = useMemo(() => {
    const targetId = editingTransaction?.relatedBudgetId ?? inferredBudgetId;
    if (!targetId) return null;
    return budgets.find((budget) => budget.id === targetId) ?? null;
  }, [budgets, editingTransaction?.relatedBudgetId, inferredBudgetId]);
  const linkedDebt = useMemo(() => {
    const targetId = editingTransaction?.relatedDebtId ?? inferredDebtId;
    if (!targetId) return null;
    return debts.find((debt) => debt.id === targetId) ?? null;
  }, [debts, editingTransaction?.relatedDebtId, inferredDebtId]);

  const amountNumber = useMemo(() => {
    const sanitized = amount.replace(/,/g, '.');
    const parsed = parseFloat(sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amount]);

  const isSaveDisabled = !(
    amountNumber > 0 && selectedCategory && selectedAccountData && transactionDate
  );

  const handleAmountChange = useCallback((value: string) => {
    const sanitized = value.replace(/[^0-9.,]/g, '').replace(/,/g, '.');
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      const [integer, fraction] = parts;
      setAmount(`${integer}.${fraction}`);
      return;
    }
    setAmount(sanitized);
  }, []);

  const applyDateTimePart = useCallback((mode: 'date' | 'time', value: Date) => {
    setTransactionDate((prev) => {
      const next = new Date(prev);
      if (mode === 'date') {
        next.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
      } else {
        next.setHours(value.getHours(), value.getMinutes(), 0, 0);
      }
      return next;
    });
  }, []);

  const openDateTimePicker = useCallback(
    (mode: 'date' | 'time') => {
      const baseValue = new Date(transactionDate);
      if (Platform.OS === 'android') {
        DateTimePickerAndroid.open({
          value: baseValue,
          mode,
          is24Hour: true,
          display: mode === 'date' ? 'calendar' : 'clock',
          onChange: (event, selected) => {
            if (event.type === 'set' && selected) {
              applyDateTimePart(mode, selected);
            }
          },
        });
        return;
      }
      setPickerMode(mode);
    },
    [applyDateTimePart, transactionDate],
  );

  const handleIosPickerChange = useCallback(
    (event: DateTimePickerEvent, selected?: Date) => {
      if (event.type === 'dismissed') {
        setPickerMode(null);
        return;
      }
      if (selected && pickerMode) {
        applyDateTimePart(pickerMode, selected);
      }
    },
    [applyDateTimePart, pickerMode],
  );

  const closePicker = useCallback(() => setPickerMode(null), []);

  const pickerValue = useMemo(() => new Date(transactionDate), [transactionDate]);

  const dateLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(transactionDate);
    } catch {
      return transactionDate.toLocaleDateString();
    }
  }, [transactionDate]);

  const timeLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(transactionDate);
    } catch {
      return transactionDate.toLocaleTimeString();
    }
  }, [transactionDate]);

  const handleOpenCategoryModal = useCallback((state: CategoryModalState) => {
    setCategoryModalState(state);
    setCategoryDraft(state.mode === 'edit' ? state.baseValue ?? '' : '');
  }, []);

  const handleConfirmCategory = useCallback(() => {
    const trimmed = categoryDraft.trim();
    if (!trimmed || !categoryModalState) {
      return;
    }

    if (categoryModalState.mode === 'add') {
      addCategory(trimmed);
      setSelectedCategory(trimmed);
    } else if (categoryModalState.baseValue) {
      renameCategory(categoryModalState.baseValue, trimmed);
      setSelectedCategory(trimmed);
    }

    setCategoryDraft('');
    setCategoryModalState(null);
  }, [addCategory, categoryDraft, categoryModalState, renameCategory]);

  const handleDismissCategoryModal = useCallback(() => {
    setCategoryDraft('');
    setCategoryModalState(null);
  }, []);

  const handleSelectAccount = useCallback((accountId: string) => {
    setSelectedAccount(accountId);
    setAccountModalVisible(false);
  }, []);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleSubmit = useCallback(() => {
    if (isSaveDisabled || !selectedAccountData || !selectedCategory) {
      return;
    }

    let finalNote = note.trim();
    if (isDebtCategory && debtPerson.trim()) {
      const debtInfo = activeTab === 'income' ? `${debtPerson} owes me` : `I owe to ${debtPerson}`;
      finalNote = finalNote ? `${debtInfo}. ${finalNote}` : debtInfo;
    }

    const domainType: 'income' | 'expense' = activeTab === 'income' ? 'income' : 'expense';
    const goalForLink =
      linkedGoal ??
      (editingTransaction?.goalId ? goals.find((goal) => goal.id === editingTransaction.goalId) ?? null : null);
    const budgetForLink =
      linkedBudget ??
      (inferredBudgetId ? budgets.find((budget) => budget.id === inferredBudgetId) ?? null : null);
    const debtForLink =
      linkedDebt ??
      (inferredDebtId ? debts.find((debt) => debt.id === inferredDebtId) ?? null : null);
    const basePayload: Parameters<typeof createTransaction>[0] = {
      userId: 'local-user',
      type: domainType,
      accountId: selectedAccountData.id,
      amount: amountNumber,
      currency: selectedAccountData.currency,
      categoryId: selectedCategory,
      description: finalNote.length ? finalNote : undefined,
      date: transactionDate.toISOString(),
      baseCurrency,
      rateUsedToBase: 1,
      convertedAmountToBase: amountNumber,
      goalId: goalForLink?.id ?? editingTransaction?.goalId ?? linkedGoalId ?? undefined,
      budgetId: budgetForLink?.id ?? editingTransaction?.budgetId ?? undefined,
      debtId: debtForLink?.id ?? editingTransaction?.debtId ?? undefined,
      goalName: goalForLink?.title ?? editingTransaction?.goalName,
      goalType: goalForLink?.goalType ?? editingTransaction?.goalType,
      relatedBudgetId: budgetForLink?.id ?? editingTransaction?.relatedBudgetId,
      relatedDebtId: debtForLink?.id ?? editingTransaction?.relatedDebtId,
      plannedAmount: goalForLink?.targetValue ?? editingTransaction?.plannedAmount,
      paidAmount: amountNumber,
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, basePayload);
    } else {
      createTransaction(basePayload);
    }

    handleClose();
  }, [
    activeTab,
    amountNumber,
    budgets,
    baseCurrency,
    createTransaction,
    debts,
    debtPerson,
    editingTransaction,
    goals,
    handleClose,
    isDebtCategory,
    isSaveDisabled,
    linkedBudget,
    linkedDebt,
    linkedGoal,
    inferredBudgetId,
    inferredDebtId,
    linkedGoalId,
    note,
    selectedAccountData,
    selectedCategory,
    transactionDate,
    updateTransaction,
  ]);

  const renderCategoryIcon = (category: FinanceCategory, size: number, color: string) => {
    const IconComponent = category.icon as React.ComponentType<{ size?: number; color?: string }>;
    return <IconComponent size={size} color={color} />;
  };

  const buttonLabel = editingTransaction
    ? quickStrings.update ?? commonStrings.save ?? 'Save'
    : quickStrings.save ?? commonStrings.save ?? 'Save';
  const categoryModalVisible = Boolean(categoryModalState);

  return (
    <>
      <SafeAreaView
        edges={['bottom',"top"]}
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      >
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.textSecondary }]}>
            {activeTab === 'income'
              ? quickStrings.incomeHeader ?? `+ ${filterStrings.typeOptions?.income ?? 'Income'}`
              : quickStrings.outcomeHeader ?? `- ${filterStrings.typeOptions?.expense ?? 'Outcome'}`}
          </Text>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>
              {commonStrings.close ?? 'Close'}
            </Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          >
            <View style={styles.section}>
              <AdaptiveGlassView style={[styles.glassSurface, styles.tabContainer,{backgroundColor:theme.colors.card}]}>
                <Pressable
                  onPress={() => setActiveTab('income')}
                  style={({ pressed }) => [styles.tabOption, { borderBottomWidth: 1 }, pressed && styles.pressed]}
                >
                  <View style={styles.tabOptionContent}>
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: activeTab === 'income' ? '#FFFFFF' : '#7E8B9A' },
                      ]}
                    >
                      {filterStrings.typeOptions?.income ?? 'Income'}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setActiveTab('outcome')}
                  style={({ pressed }) => [styles.tabOption, pressed && styles.pressed]}
                >
                  <View style={styles.tabOptionContent}>
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: activeTab === 'outcome' ? '#FFFFFF' : '#7E8B9A' },
                      ]}
                    >
                      {filterStrings.typeOptions?.expense ?? 'Outcome'}
                    </Text>
                  </View>
                </Pressable>
              </AdaptiveGlassView>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                {detailStrings.amount ?? 'Amount'}
              </Text>
              <AdaptiveGlassView style={[styles.glassSurface, styles.inputContainer]}>
                <TextInput
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder={quickStrings.amountPlaceholder ?? 'Input amount'}
                  placeholderTextColor="#7E8B9A"
                  keyboardType="numeric"
                  style={styles.textInput}
                />
              </AdaptiveGlassView>
            </View>

            <View style={[styles.section, { paddingHorizontal: 0 }]}>
              <View style={styles.categoryHeader}>
                <Text style={[styles.sectionLabel, { paddingHorizontal: 20, color: theme.colors.textSecondary }]}>
                  {detailStrings.category ?? 'Category'}
                </Text>
                <Pressable
                  onPress={() => handleOpenCategoryModal({ mode: 'add' })}
                  hitSlop={10}
                  style={{ paddingHorizontal: 20 }}
                >
                  <Ionicons name="add" size={18} color="#7E8B9A" />
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesScroll}
              >
                {availableCategories.map((cat) => {
                  const isActive = selectedCategory === cat.name;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setSelectedCategory(cat.name)}
                      style={({ pressed }) => [styles.categoryCard, pressed && styles.pressed]}
                    >
                      <AdaptiveGlassView
                        style={[
                          styles.glassSurface,
                          styles.categoryCardInner,
                          { opacity: isActive ? 1 : 0.6 },
                        ]}
                      >
                        {renderCategoryIcon(cat, 28, isActive ? '#FFFFFF' : '#9E9E9E')}
                        <Text
                          style={[
                            styles.categoryCardText,
                            { color: isActive ? '#FFFFFF' : '#9E9E9E' },
                          ]}
                          numberOfLines={2}
                        >
                          {cat.name}
                        </Text>
                      </AdaptiveGlassView>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                {detailStrings.date ?? 'Date'}
              </Text>
              <View style={styles.dateTimeRow}>
                <Pressable
                  onPress={() => openDateTimePicker('date')}
                  style={({ pressed }) => [styles.dateTimeButton, pressed && styles.pressed]}
                >
                  <AdaptiveGlassView style={[styles.glassSurface, styles.dateTimeChip]}>
                    <Ionicons name="calendar-outline" size={18} color="#7E8B9A" />
                    <Text style={styles.dateTimeText}>{dateLabel}</Text>
                  </AdaptiveGlassView>
                </Pressable>
                <Pressable
                  onPress={() => openDateTimePicker('time')}
                  style={({ pressed }) => [styles.dateTimeButton, pressed && styles.pressed]}
                >
                  <AdaptiveGlassView style={[styles.glassSurface, styles.dateTimeChip]}>
                    <Ionicons name="time-outline" size={18} color="#7E8B9A" />
                    <Text style={styles.dateTimeText}>{timeLabel}</Text>
                  </AdaptiveGlassView>
                </Pressable>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                {detailStrings.account ?? 'Account'}
              </Text>
              <Pressable
                onPress={() => setAccountModalVisible(true)}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <AdaptiveGlassView style={[styles.glassSurface, styles.inputContainer]}>
                  <View style={styles.accountRow}>
                    <View>
                      <Text style={styles.textInput}>{selectedAccountData?.name}</Text>
                      <Text style={styles.accountBalance}>
                        {selectedAccountData
                          ? formatCurrency(selectedAccountData.currentBalance, selectedAccountData.currency)
                          : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#7E8B9A" />
                  </View>
                </AdaptiveGlassView>
              </Pressable>
            </View>

            {(linkedGoal || linkedBudget || linkedDebt) && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                  Linked data
                </Text>
                <AdaptiveGlassView style={[styles.glassSurface, styles.linkedCard,{ backgroundColor: theme.colors.card }]}>
                  {linkedGoal && (
                    <View style={styles.linkedRow}>
                      <Text style={[styles.linkedLabel, { color: theme.colors.textSecondary }]}>Goal</Text>
                      <Text style={[styles.linkedValue, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                        {linkedGoal.title}
                      </Text>
                    </View>
                  )}
                  {linkedBudget && (
                    <View style={styles.linkedRow}>
                      <Text style={[styles.linkedLabel, { color: theme.colors.textSecondary }]}>Budget</Text>
                      <Text style={[styles.linkedValue, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                        {linkedBudget.name} · {(linkedBudget.currentBalance ?? linkedBudget.remainingAmount ?? linkedBudget.limitAmount).toFixed(2)} {linkedBudget.currency}
                      </Text>
                    </View>
                  )}
                  {linkedDebt && (
                    <View style={styles.linkedRow}>
                      <Text style={[styles.linkedLabel, { color: theme.colors.textSecondary }]}>Debt</Text>
                      <Text style={[styles.linkedValue, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                        {linkedDebt.counterpartyName ?? linkedDebt.counterpartyId ?? ''} · {linkedDebt.principalAmount.toFixed(2)} {linkedDebt.principalCurrency}
                      </Text>
                    </View>
                  )}
                </AdaptiveGlassView>
              </View>
            )}

            {isDebtCategory && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                  {activeTab === 'income'
                    ? quickStrings.debtOwedToYouLabel ?? 'Who owes you?'
                    : quickStrings.debtYouOweLabel ?? 'Who do you owe?'}
                </Text>
                <AdaptiveGlassView style={[styles.glassSurface, styles.inputContainer]}>
                  <TextInput
                    value={debtPerson}
                    onChangeText={setDebtPerson}
                    placeholder={
                      activeTab === 'income'
                        ? quickStrings.debtOwedToYouPlaceholder ?? 'Person name who owes you'
                        : quickStrings.debtYouOwePlaceholder ?? 'Person name you owe to'
                    }
                    placeholderTextColor="#7E8B9A"
                    style={styles.textInput}
                  />
                </AdaptiveGlassView>
              </View>
            )}

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                {detailStrings.note ?? 'Note'}
              </Text>
              <AdaptiveGlassView style={[styles.glassSurface, styles.noteContainer]}>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder={
                    debtStrings.notePlaceholder ??
                    quickStrings.notePlaceholder ??
                    'Add optional description or context…'
                  }
                  placeholderTextColor="#7E8B9A"
                  multiline
                  style={styles.noteInput}
                />
              </AdaptiveGlassView>
            </View>

            <View style={styles.actionButtons}>
              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                onPress={handleClose}
              >
                <Text style={styles.secondaryButtonText}>{commonStrings.cancel ?? 'Cancel'}</Text>
              </Pressable>
              <Pressable
                disabled={isSaveDisabled}
                onPress={handleSubmit}
                style={({ pressed }) => [styles.primaryButton, pressed && !isSaveDisabled && styles.pressed]}
              >
                <AdaptiveGlassView
                  style={[
                    styles.glassSurface,
                    styles.primaryButtonInner,
                    { opacity: isSaveDisabled ? 0.4 : 1 },
                  ]}
                >
                  <Text
                    style={[
                      styles.primaryButtonText,
                      { color: isSaveDisabled ? '#7E8B9A' : '#FFFFFF' },
                    ]}
                  >
                    {buttonLabel}
                  </Text>
                </AdaptiveGlassView>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {Platform.OS === 'ios' && pickerMode && (
        <Modal transparent visible onRequestClose={closePicker} animationType="fade">
          <View style={styles.pickerModal}>
            <Pressable style={styles.pickerBackdrop} onPress={closePicker} />
            <AdaptiveGlassView style={[styles.glassSurface, styles.pickerCard,{ backgroundColor: theme.colors.card }]}>
              <DateTimePicker
                value={pickerValue}
                mode={pickerMode}
                display={pickerMode === 'date' ? 'inline' : 'spinner'}
                onChange={handleIosPickerChange}
                is24Hour
              />
              <Pressable onPress={closePicker} style={styles.pickerDoneButton}>
                <Text style={styles.pickerDoneText}>{commonStrings.done ?? 'Done'}</Text>
              </Pressable>
            </AdaptiveGlassView>
          </View>
        </Modal>
      )}

      <Modal
        transparent
        animationType="fade"
        visible={categoryModalVisible}
        onRequestClose={handleDismissCategoryModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={handleDismissCategoryModal} />
          <AdaptiveGlassView style={[styles.glassSurface, styles.modalCard]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                {categoryModalState?.mode === 'edit'
                  ? quickStrings.categoryEditTitle ?? financeStrings.budgets?.addCategory ?? 'Edit category'
                  : quickStrings.categoryAddTitle ?? financeStrings.budgets?.addCategory ?? 'Add category'}
              </Text>
              <Pressable onPress={handleDismissCategoryModal} hitSlop={10}>
                <Ionicons name="close" size={22} color="#7E8B9A" />
              </Pressable>
            </View>

            <AdaptiveGlassView style={[styles.glassSurface, styles.inputContainer]}>
              <TextInput
                value={categoryDraft}
                onChangeText={setCategoryDraft}
                placeholder={
                  quickStrings.categoryPlaceholder ?? financeStrings.budgets?.addCategory ?? 'Category name'
                }
                placeholderTextColor="#7E8B9A"
                style={styles.textInput}
              />
            </AdaptiveGlassView>

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                onPress={handleDismissCategoryModal}
              >
                <Text style={styles.secondaryButtonText}>{commonStrings.cancel ?? 'Cancel'}</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmCategory}
                disabled={!categoryDraft.trim()}
                style={({ pressed }) => [styles.primaryButton, pressed && !!categoryDraft.trim() && styles.pressed]}
              >
                <AdaptiveGlassView
                  style={[
                    styles.glassSurface,
                    styles.primaryButtonInner,
                    { opacity: categoryDraft.trim() ? 1 : 0.4 },
                  ]}
                >
                  <Text
                    style={[
                      styles.primaryButtonText,
                      { color: categoryDraft.trim() ? '#FFFFFF' : '#7E8B9A' },
                    ]}
                  >
                    {commonStrings.save ?? 'Save'}
                  </Text>
                </AdaptiveGlassView>
              </Pressable>
            </View>
          </AdaptiveGlassView>
        </View>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={accountModalVisible}
        onRequestClose={() => setAccountModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setAccountModalVisible(false)} />
          <AdaptiveGlassView style={[styles.glassSurface, styles.accountModalCard,{ backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              {detailStrings.account ?? 'Account'}
            </Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.accountList}
            >
              {accounts.map((account) => (
                <Pressable
                  key={account.id}
                  onPress={() => handleSelectAccount(account.id)}
                  style={({ pressed }) => [styles.accountRowItem, pressed && styles.pressed]}
                >
                  <AdaptiveGlassView
                    style={[
                      styles.glassSurface,
                      styles.accountCard,
                      { opacity: account.id === selectedAccountData?.id ? 1 : 0.7 },
                    ]}
                  >
                    <View style={styles.accountRowBetween}>
                      <Text style={styles.accountName}>{account.name}</Text>
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={account.id === selectedAccountData?.id ? '#FFFFFF' : '#7E8B9A'}
                      />
                    </View>
                    <Text style={styles.accountBalance}>
                      {formatCurrency(account.currentBalance, account.currency)}
                    </Text>
                  </AdaptiveGlassView>
                </Pressable>
              ))}
            </ScrollView>
          </AdaptiveGlassView>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 18,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#7E8B9A',
  },
  glassSurface: {
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
  },
  tabOption: {
    flex: 1,
  },
  tabOptionContent: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  inputContainer: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  categoryCard: {
    borderRadius: 20,
  },
  categoryCardInner: {
    width: 110,
    height: 110,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 10,
  },
  categoryCardText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
  },
  dateTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateTimeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountBalance: {
    color: '#7E8B9A',
    fontSize: 13,
    marginTop: 4,
  },
  noteContainer: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 120,
  },
  noteInput: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  linkedCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  linkedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  linkedLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  linkedValue: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
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
    borderRadius: 28,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  accountModalCard: {
    borderRadius: 24,
    padding: 16,
    maxHeight: '70%',
  },
  accountList: {
    paddingVertical: 12,
    gap: 10,
  },
  accountRowItem: {
    borderRadius: 16,
  },
  accountCard: {
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  accountRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
