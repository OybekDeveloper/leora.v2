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
import { FlashList as FlashListBase } from '@shopify/flash-list';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wallet } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import AccountPicker from '@/components/shared/AccountPicker';
import { formatNumberWithSpaces, parseSpacedNumber } from '@/utils/formatNumber';
import {
  FINANCE_CATEGORIES,
  type FinanceCategory,
  getCategoriesForType,
} from '@/constants/financeCategories';
import { useLocalizedCategories } from '@/hooks/useLocalizedCategories';
import { useAppTheme, type Theme } from '@/constants/theme';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useFinancePreferencesStore } from '@/stores/useFinancePreferencesStore';
import { normalizeFinanceCurrency } from '@/utils/financeCurrency';
import { useLocalization } from '@/localization/useLocalization';
import { useShallow } from 'zustand/react/shallow';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';

const FlashList = FlashListBase as any;

type IncomeOutcomeTab = 'income' | 'outcome';

type CategoryModalState = {
  mode: 'add' | 'edit';
  baseValue?: string;
};

type ExtendedCategory = FinanceCategory & { isCustom?: boolean; localizedName?: string };

export default function QuickExpenseModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { strings } = useLocalization();
  const financeStrings = (strings as any).financeScreens ?? {};
  const transactionsStrings = financeStrings.transactions ?? {};
  const quickStrings = transactionsStrings.quick ?? {};
  const detailStrings = transactionsStrings.details ?? {};
  const filterStrings = transactionsStrings.filterSheet ?? {};
  const commonStrings = (strings as any).common ?? {};
  const debtStrings = financeStrings.debts?.modal ?? {};
  const { getLocalizedCategoryName } = useLocalizedCategories();
  const { id, tab, goalId, budgetId } = useLocalSearchParams<{ id?: string; tab?: string; goalId?: string; budgetId?: string }>();
  const editingId = Array.isArray(id) ? id[0] : id ?? null;
  const initialTab = Array.isArray(tab) ? tab[0] : tab ?? null;
  const linkedGoalId = Array.isArray(goalId) ? goalId[0] : goalId ?? null;
  const budgetIdParam = Array.isArray(budgetId) ? budgetId[0] : budgetId ?? null;

  const { baseCurrency, convertAmount } = useFinancePreferencesStore(
    useShallow((state) => ({
      baseCurrency: state.baseCurrency,
      convertAmount: state.convertAmount,
    }))
  );
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
  const [transactionName, setTransactionName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(accounts[0]?.id ?? null);
  const [note, setNote] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [categoryModalState, setCategoryModalState] = useState<CategoryModalState | null>(null);
  const [categoryDraft, setCategoryDraft] = useState('');
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [showBudgetPicker, setShowBudgetPicker] = useState(false);

  const availableCategories = useMemo(() => {
    const baseList = getCategoriesForType(activeTab);
    const aggregated = new Map<string, ExtendedCategory>();
    baseList.forEach((category) => {
      aggregated.set(category.name, {
        ...category,
        localizedName: getLocalizedCategoryName(category.name),
      });
    });

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
          localizedName: getLocalizedCategoryName(name),
        });
      }
    });

    return Array.from(aggregated.values());
  }, [activeTab, categories, getLocalizedCategoryName]);

  const resetForm = useCallback(
    (tabValue: IncomeOutcomeTab, accountId?: string | null) => {
      setActiveTab(tabValue);
      setTransactionName('');
      setAmount('');
      setSelectedCategory(null);
      setSelectedAccount(accountId ?? accounts[0]?.id ?? null);
      setTransactionDate(new Date());
      setNote('');
      setSelectedBudgetId(null);
      setShowBudgetPicker(false);
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
    setTransactionName(editingTransaction.name ?? '');
    setAmount(editingTransaction.amount.toString());
    setSelectedCategory(editingTransaction.categoryId ?? null);
    setTransactionDate(new Date(editingTransaction.date));
    setSelectedBudgetId(editingTransaction.budgetId ?? editingTransaction.relatedBudgetId ?? null);
    setNote(editingTransaction.description ?? '');
  }, [editingTransaction, initialTab, resetForm]);

  // Filter budgets that match the selected category and transaction type
  const categoryBudgets = useMemo(() => {
    if (!selectedCategory) return [];
    const transactionType = activeTab === 'income' ? 'income' : 'expense';
    return budgets.filter((budget) => {
      // Check if budget transactionType matches (income/expense)
      if (budget.transactionType && budget.transactionType !== transactionType) return false;
      // Check if budget has categoryIds and if selected category is included
      if (budget.categoryIds && budget.categoryIds.length > 0) {
        return budget.categoryIds.includes(selectedCategory);
      }
      return false;
    });
  }, [budgets, selectedCategory, activeTab]);

  // All budgets (for showing all options regardless of type/category)
  const allBudgets = budgets;

  // Other budgets (all except category-specific ones)
  const otherBudgets = useMemo(() => {
    const categoryBudgetIds = new Set(categoryBudgets.map((b) => b.id));
    return budgets.filter((budget) => !categoryBudgetIds.has(budget.id));
  }, [budgets, categoryBudgets]);

  const selectedBudget = useMemo(() => {
    if (!selectedBudgetId) return null;
    return budgets.find((b) => b.id === selectedBudgetId) ?? null;
  }, [budgets, selectedBudgetId]);

  useEffect(() => {
    if (!selectedCategory) {
      return;
    }
    const exists = availableCategories.some((category) => category.name === selectedCategory);
    if (!exists) {
      setSelectedCategory(null);
    }
  }, [availableCategories, selectedCategory]);

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
    return parseSpacedNumber(amount);
  }, [amount]);

  const isSaveDisabled = !(
    amountNumber > 0 && selectedCategory && selectedAccountData && transactionDate
  );

  const handleAmountChange = useCallback((value: string) => {
    // Remove spaces and non-numeric characters except dot and comma
    const withoutSpaces = value.replace(/\s/g, '');
    const sanitized = withoutSpaces.replace(/[^0-9.,]/g, '').replace(/,/g, '.');
    const parts = sanitized.split('.');
    let cleanValue = sanitized;
    if (parts.length > 2) {
      cleanValue = `${parts[0]}.${parts.slice(1).join('')}`;
    }
    // Format with spaces for display
    if (cleanValue) {
      const num = parseFloat(cleanValue);
      if (!isNaN(num)) {
        // Keep the decimal part as user typed it
        const hasDecimal = cleanValue.includes('.');
        if (hasDecimal) {
          const [intPart, decPart] = cleanValue.split('.');
          const formattedInt = intPart ? parseInt(intPart, 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '0';
          setAmount(`${formattedInt}.${decPart}`);
        } else {
          setAmount(formatNumberWithSpaces(num));
        }
      } else {
        setAmount(cleanValue);
      }
    } else {
      setAmount('');
    }
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

  const handleAccountSelect = useCallback((account: typeof accounts[0] | null) => {
    setSelectedAccount(account?.id ?? null);
  }, []);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleSubmit = useCallback(() => {
    if (isSaveDisabled || !selectedAccountData || !selectedCategory) {
      return;
    }

    const finalNote = note.trim();

    const domainType: 'income' | 'expense' = activeTab === 'income' ? 'income' : 'expense';
    // Safe lookups - validate IDs exist in stores before accessing
    let goalForLink = linkedGoal;
    if (!goalForLink && editingTransaction?.goalId) {
      goalForLink = goals.find((goal) => goal.id === editingTransaction.goalId) ?? null;
    }

    // Priority: user-selected budget > linkedBudget > inferred budget
    let budgetForLink = selectedBudget;
    if (!budgetForLink) {
      budgetForLink = linkedBudget;
    }
    if (!budgetForLink && inferredBudgetId) {
      budgetForLink = budgets.find((budget) => budget.id === inferredBudgetId) ?? null;
    }

    let debtForLink = linkedDebt;
    if (!debtForLink && inferredDebtId) {
      debtForLink = debts.find((debt) => debt.id === inferredDebtId) ?? null;
    }

    // FX Conversion - account currency dan base currency ga
    const normalizedBaseCurrency = normalizeFinanceCurrency(baseCurrency);
    const normalizedAccountCurrency = normalizeFinanceCurrency(selectedAccountData.currency);
    const rateToBase = normalizedAccountCurrency === normalizedBaseCurrency
      ? 1
      : convertAmount(1, normalizedAccountCurrency, normalizedBaseCurrency);
    const convertedAmountToBase = amountNumber * rateToBase;

    // Build payload with safe null handling for all linked data
    const basePayload: Parameters<typeof createTransaction>[0] = {
      userId: 'local-user',
      type: domainType,
      accountId: selectedAccountData.id,
      amount: amountNumber,
      currency: selectedAccountData.currency,
      categoryId: selectedCategory,
      name: transactionName.trim() || undefined,
      counterpartyId: selectedCounterpartyId ?? undefined,
      description: finalNote.length ? finalNote : undefined,
      date: transactionDate.toISOString(),
      baseCurrency: normalizedBaseCurrency,
      rateUsedToBase: rateToBase,
      convertedAmountToBase,
      // Linked data - safe null handling
      goalId: goalForLink?.id ?? editingTransaction?.goalId ?? linkedGoalId ?? undefined,
      budgetId: budgetForLink?.id ?? editingTransaction?.budgetId ?? undefined,
      debtId: debtForLink?.id ?? editingTransaction?.debtId ?? undefined,
      goalName: goalForLink?.title ?? editingTransaction?.goalName ?? undefined,
      goalType: goalForLink?.goalType ?? editingTransaction?.goalType ?? undefined,
      relatedBudgetId: budgetForLink?.id ?? editingTransaction?.relatedBudgetId ?? undefined,
      relatedDebtId: debtForLink?.id ?? editingTransaction?.relatedDebtId ?? undefined,
      plannedAmount: goalForLink?.targetValue ?? editingTransaction?.plannedAmount ?? undefined,
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
    convertAmount,
    createTransaction,
    debts,
    editingTransaction,
    goals,
    handleClose,
    isSaveDisabled,
    linkedBudget,
    linkedDebt,
    linkedGoal,
    inferredBudgetId,
    inferredDebtId,
    linkedGoalId,
    note,
    selectedAccountData,
    selectedBudget,
    selectedCategory,
    transactionDate,
    transactionName,
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
        style={styles.safeArea}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {activeTab === 'income'
              ? quickStrings.incomeHeader ?? `+ ${filterStrings.typeOptions?.income ?? 'Income'}`
              : quickStrings.outcomeHeader ?? `- ${filterStrings.typeOptions?.expense ?? 'Outcome'}`}
          </Text>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Text style={styles.closeText}>
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
            <View style={styles.typeTabs}>
              <Pressable
                onPress={() => setActiveTab('income')}
                style={[
                  styles.typeTab,
                  activeTab === 'income' && styles.typeTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.typeTabLabel,
                    activeTab === 'income' && styles.typeTabLabelActive,
                  ]}
                >
                  {filterStrings.typeOptions?.income ?? 'Income'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('outcome')}
                style={[
                  styles.typeTab,
                  activeTab === 'outcome' && styles.typeTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.typeTabLabel,
                    activeTab === 'outcome' && styles.typeTabLabelActive,
                  ]}
                >
                  {filterStrings.typeOptions?.expense ?? 'Outcome'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {detailStrings.name ?? 'Name'}
              </Text>
              <AdaptiveGlassView style={[styles.glassSurface, styles.inputWrapper]}>
                <TextInput
                  value={transactionName}
                  onChangeText={setTransactionName}
                  placeholder={quickStrings.namePlaceholder ?? 'Transaction name (optional)'}
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.textInput}
                />
              </AdaptiveGlassView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {detailStrings.amount ?? 'Amount'}
              </Text>
              <AdaptiveGlassView style={[styles.glassSurface, styles.inputWrapper]}>
                <TextInput
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder={quickStrings.amountPlaceholder ?? 'Input amount'}
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="numeric"
                  style={styles.textInput}
                />
              </AdaptiveGlassView>
            </View>

            <View style={styles.sectionFullWidth}>
              <View style={styles.categoryHeader}>
                <Text style={[styles.sectionLabel, styles.labelWithPadding]}>
                  {detailStrings.category ?? 'Category'}
                </Text>
                <Pressable
                  onPress={() => handleOpenCategoryModal({ mode: 'add' })}
                  hitSlop={10}
                  style={styles.labelWithPadding}
                >
                  <Ionicons name="add" size={18} color={theme.colors.textMuted} />
                </Pressable>
              </View>

              <View style={styles.categoryListContainer}>
                <FlashList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={availableCategories}
                  keyExtractor={(item: ExtendedCategory) => item.id}
                  estimatedItemSize={122}
                  renderItem={({ item: cat }: { item: ExtendedCategory }) => {
                    const isActive = selectedCategory === cat.name;
                    return (
                      <Pressable
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
                          {renderCategoryIcon(cat, 28, isActive ? theme.colors.textPrimary : theme.colors.textMuted)}
                          <Text
                            style={[
                              styles.categoryCardText,
                              { color: isActive ? theme.colors.textPrimary : theme.colors.textMuted },
                            ]}
                            numberOfLines={2}
                          >
                            {cat.localizedName ?? cat.name}
                          </Text>
                        </AdaptiveGlassView>
                      </Pressable>
                    );
                  }}
                  ListHeaderComponent={<View style={styles.listEdgeSpacer} />}
                  ItemSeparatorComponent={() => <View style={styles.horizontalSeparator} />}
                  ListFooterComponent={<View style={styles.listEdgeSpacer} />}
                />
              </View>
            </View>

            {/* Budget Picker - shows when budgets exist for this transaction type */}
            {allBudgets.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  {quickStrings.budget ?? 'Budget'} ({quickStrings.optional ?? 'optional'})
                </Text>
                <Pressable
                  onPress={() => setShowBudgetPicker(!showBudgetPicker)}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <AdaptiveGlassView style={[styles.glassSurface, styles.budgetPickerButton]}>
                    <Text style={[styles.budgetPickerText, { color: selectedBudget ? theme.colors.textPrimary : theme.colors.textMuted }]}>
                      {selectedBudget?.name ?? (quickStrings.selectBudget ?? 'Select budget...')}
                    </Text>
                    <Ionicons
                      name={showBudgetPicker ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={theme.colors.textMuted}
                    />
                  </AdaptiveGlassView>
                </Pressable>
                {showBudgetPicker && (
                  <View style={styles.budgetDropdown}>
                    {/* Option to clear selection */}
                    <Pressable
                      onPress={() => {
                        setSelectedBudgetId(null);
                        setShowBudgetPicker(false);
                      }}
                      style={({ pressed }) => [styles.budgetOption, pressed && styles.pressed]}
                    >
                      <AdaptiveGlassView style={[styles.glassSurface, styles.budgetOptionInner]}>
                        <Text style={[styles.budgetOptionText, { color: theme.colors.textMuted }]}>
                          {quickStrings.noBudget ?? 'No budget'}
                        </Text>
                      </AdaptiveGlassView>
                    </Pressable>

                    {/* Category-specific budgets */}
                    {categoryBudgets.length > 0 && (
                      <>
                        <Text style={styles.budgetSectionLabel}>
                          {quickStrings.categoryBudgets ?? 'Category budgets'}
                        </Text>
                        {categoryBudgets.map((budget) => (
                          <Pressable
                            key={budget.id}
                            onPress={() => {
                              setSelectedBudgetId(budget.id);
                              setShowBudgetPicker(false);
                            }}
                            style={({ pressed }) => [styles.budgetOption, pressed && styles.pressed]}
                          >
                            <AdaptiveGlassView
                              style={[
                                styles.glassSurface,
                                styles.budgetOptionInner,
                                selectedBudgetId === budget.id && styles.budgetOptionSelected,
                              ]}
                            >
                              <View style={styles.budgetOptionContent}>
                                <Text
                                  style={[
                                    styles.budgetOptionText,
                                    { color: selectedBudgetId === budget.id ? theme.colors.textPrimary : theme.colors.textSecondary },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {budget.name}
                                </Text>
                                <Text style={styles.budgetOptionSubtext}>
                                  {formatNumberWithSpaces(budget.remainingAmount ?? 0)} / {formatNumberWithSpaces(budget.limitAmount ?? 0)} {budget.currency}
                                </Text>
                              </View>
                              {selectedBudgetId === budget.id && (
                                <Ionicons name="checkmark" size={18} color={theme.colors.textPrimary} />
                              )}
                            </AdaptiveGlassView>
                          </Pressable>
                        ))}
                      </>
                    )}

                    {/* Other budgets */}
                    {otherBudgets.length > 0 && (
                      <>
                        <Text style={styles.budgetSectionLabel}>
                          {quickStrings.allBudgets ?? 'All budgets'}
                        </Text>
                        {otherBudgets.map((budget) => (
                          <Pressable
                            key={budget.id}
                            onPress={() => {
                              setSelectedBudgetId(budget.id);
                              setShowBudgetPicker(false);
                            }}
                            style={({ pressed }) => [styles.budgetOption, pressed && styles.pressed]}
                          >
                            <AdaptiveGlassView
                              style={[
                                styles.glassSurface,
                                styles.budgetOptionInner,
                                selectedBudgetId === budget.id && styles.budgetOptionSelected,
                              ]}
                            >
                              <View style={styles.budgetOptionContent}>
                                <Text
                                  style={[
                                    styles.budgetOptionText,
                                    { color: selectedBudgetId === budget.id ? theme.colors.textPrimary : theme.colors.textSecondary },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {budget.name}
                                </Text>
                                <Text style={styles.budgetOptionSubtext}>
                                  {formatNumberWithSpaces(budget.remainingAmount ?? 0)} / {formatNumberWithSpaces(budget.limitAmount ?? 0)} {budget.currency}
                                </Text>
                              </View>
                              {selectedBudgetId === budget.id && (
                                <Ionicons name="checkmark" size={18} color={theme.colors.textPrimary} />
                              )}
                            </AdaptiveGlassView>
                          </Pressable>
                        ))}
                      </>
                    )}
                  </View>
                )}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {detailStrings.date ?? 'Date'}
              </Text>
              <View style={styles.dateTimeRow}>
                <Pressable
                  onPress={() => openDateTimePicker('date')}
                  style={({ pressed }) => [styles.dateTimeButton, pressed && styles.pressed]}
                >
                  <AdaptiveGlassView style={[styles.glassSurface, styles.dateTimeChip]}>
                    <Ionicons name="calendar-outline" size={18} color={theme.colors.textMuted} />
                    <Text style={styles.dateTimeText}>{dateLabel}</Text>
                  </AdaptiveGlassView>
                </Pressable>
                <Pressable
                  onPress={() => openDateTimePicker('time')}
                  style={({ pressed }) => [styles.dateTimeButton, pressed && styles.pressed]}
                >
                  <AdaptiveGlassView style={[styles.glassSurface, styles.dateTimeChip]}>
                    <Ionicons name="time-outline" size={18} color={theme.colors.textMuted} />
                    <Text style={styles.dateTimeText}>{timeLabel}</Text>
                  </AdaptiveGlassView>
                </Pressable>
              </View>
            </View>

            <View style={[styles.section, { zIndex: 9999 }]}>
              <AccountPicker
                selectedAccountId={selectedAccount}
                onSelect={handleAccountSelect}
                label={detailStrings.account ?? 'Account'}
                placeholder={quickStrings.selectAccountPlaceholder ?? 'Select account...'}
              />
            </View>

            {(linkedGoal || linkedBudget || linkedDebt) && (
              <View style={[styles.section, { zIndex: 1 }]}>
                <Text style={styles.sectionLabel}>
                  {detailStrings.linkedData ?? 'Linked data'}
                </Text>
                <AdaptiveGlassView style={[styles.glassSurface, styles.linkedCard]}>
                  {linkedGoal && (
                    <View style={styles.linkedRow}>
                      <Text style={styles.linkedLabel}>{detailStrings.linkedGoal ?? 'Goal'}</Text>
                      <Text style={styles.linkedValue} numberOfLines={1}>
                        {linkedGoal.title}
                      </Text>
                    </View>
                  )}
                  {linkedBudget && (
                    <View style={styles.linkedRow}>
                      <Text style={styles.linkedLabel}>{detailStrings.linkedBudget ?? 'Budget'}</Text>
                      <Text style={styles.linkedValue} numberOfLines={1}>
                        {linkedBudget.name ?? ''} · {(linkedBudget.currentBalance ?? linkedBudget.remainingAmount ?? linkedBudget.limitAmount ?? 0).toFixed(2)} {linkedBudget.currency ?? ''}
                      </Text>
                    </View>
                  )}
                  {linkedDebt && (
                    <View style={styles.linkedRow}>
                      <Text style={styles.linkedLabel}>{detailStrings.relatedDebt ?? 'Debt'}</Text>
                      <Text style={styles.linkedValue} numberOfLines={1}>
                        {linkedDebt.counterpartyName ?? linkedDebt.counterpartyId ?? ''} · {(linkedDebt.principalAmount ?? 0).toFixed(2)} {linkedDebt.principalCurrency ?? ''}
                      </Text>
                    </View>
                  )}
                </AdaptiveGlassView>
              </View>
            )}

            <View style={[styles.section, { zIndex: 1 }]}>
              <Text style={styles.sectionLabel}>
                {detailStrings.note ?? 'Note'}
              </Text>
              <AdaptiveGlassView style={[styles.glassSurface, styles.noteWrapper]}>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder={
                    debtStrings.notePlaceholder ??
                    quickStrings.notePlaceholder ??
                    'Add optional description or context…'
                  }
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  style={styles.noteInput}
                />
              </AdaptiveGlassView>
            </View>

            <View style={[styles.actionButtons, { zIndex: 1 }]}>
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
                      { color: isSaveDisabled ? theme.colors.textMuted : theme.colors.textPrimary },
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
            <AdaptiveGlassView style={[styles.glassSurface, styles.pickerCard]}>
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
              <Text style={styles.modalTitle}>
                {categoryModalState?.mode === 'edit'
                  ? quickStrings.categoryEditTitle ?? financeStrings.budgets?.addCategory ?? 'Edit category'
                  : quickStrings.categoryAddTitle ?? financeStrings.budgets?.addCategory ?? 'Add category'}
              </Text>
              <Pressable onPress={handleDismissCategoryModal} hitSlop={10}>
                <Ionicons name="close" size={22} color={theme.colors.textMuted} />
              </Pressable>
            </View>

            <AdaptiveGlassView style={[styles.glassSurface, styles.inputWrapper]}>
              <TextInput
                value={categoryDraft}
                onChangeText={setCategoryDraft}
                placeholder={
                  quickStrings.categoryPlaceholder ?? financeStrings.budgets?.addCategory ?? 'Category name'
                }
                placeholderTextColor={theme.colors.textMuted}
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
                      { color: categoryDraft.trim() ? theme.colors.textPrimary : theme.colors.textMuted },
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
    </>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: -0.3,
      color: theme.colors.textSecondary,
    },
    closeText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 12,
      gap: 18,
    },
    section: {
      gap: 12,
    },
    sectionFullWidth: {
      gap: 12,
      marginHorizontal: -20,
    },
    labelWithPadding: {
      paddingHorizontal: 20,
    },
    categoryListContainer: {
      height: 126,
    },
    listEdgeSpacer: {
      width: 20,
    },
    horizontalSeparator: {
      width: 12,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.5,
      color: theme.colors.textMuted,
    },
    glassSurface: {},
    typeTabs: {
      flexDirection: 'row',
      marginHorizontal: 0,
      marginBottom: 6,
      borderRadius: 12,
      backgroundColor: theme.colors.glassBg,
      padding: 4,
    },
    typeTab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 10,
    },
    typeTabActive: {
      backgroundColor: theme.colors.overlayStrong,
    },
    typeTabLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textMuted,
    },
    typeTabLabelActive: {
      color: theme.colors.textPrimary,
    },
    inputWrapper: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    textInput: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    categoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    budgetPickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    budgetPickerText: {
      fontSize: 15,
      fontWeight: '600',
    },
    budgetDropdown: {
      marginTop: 8,
      gap: 6,
    },
    budgetOption: {
      borderRadius: 12,
    },
    budgetOptionInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    budgetOptionSelected: {
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
    },
    budgetOptionContent: {
      flex: 1,
      gap: 2,
    },
    budgetOptionText: {
      fontSize: 14,
      fontWeight: '600',
    },
    budgetOptionSubtext: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.textMuted,
    },
    budgetSectionLabel: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginTop: 8,
      marginBottom: 4,
      paddingHorizontal: 4,
      color: theme.colors.textMuted,
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
      color: theme.colors.textPrimary,
    },
    noteWrapper: {
      borderRadius: 16,
      overflow: 'hidden',
      minHeight: 120,
    },
    noteInput: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.colors.textPrimary,
      minHeight: 100,
      textAlignVertical: 'top',
      paddingHorizontal: 14,
      paddingVertical: 12,
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
      color: theme.colors.textSecondary,
    },
    linkedValue: {
      fontSize: 13,
      fontWeight: '700',
      flex: 1,
      textAlign: 'right',
      color: theme.colors.textPrimary,
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
      borderColor: theme.colors.glassBorder,
      paddingVertical: 14,
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: theme.colors.textPrimary,
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
      backgroundColor: theme.colors.backdrop,
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
      backgroundColor: theme.colors.card,
    },
    pickerDoneButton: {
      alignItems: 'center',
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.glassBorder,
    },
    pickerDoneText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.backdrop,
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
      backgroundColor: theme.colors.card,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      paddingTop: 8,
    },
  });
