import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FlashList as FlashListBase } from '@shopify/flash-list';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { AddAccountCTA } from '@/components/shared/AddAccountCTA';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import type { Account } from '@/domain/finance/types';
import { useFinancePreferencesStore, type FinanceCurrency } from '@/stores/useFinancePreferencesStore';
import { useShallow } from 'zustand/react/shallow';
import { formatNumberWithSpaces, parseSpacedNumber } from '@/utils/formatNumber';
import { FINANCE_CATEGORIES } from '@/constants/financeCategories';
import { useLocalizedCategories } from '@/hooks/useLocalizedCategories';

const FlashList = FlashListBase as any;
type LocalParams = { budgetId?: string };
type TxnType = 'income' | 'expense';

const BudgetAddValueModal = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const financeStrings = strings.financeScreens;
  const detailStrings = financeStrings.budgets.detail;
  const transactionsStrings = financeStrings.transactions;
  const commonStrings = strings.common;
  const { budgetId } = useLocalSearchParams<LocalParams>();
  const normalizedBudgetId = Array.isArray(budgetId) ? budgetId[0] : budgetId ?? null;
  const { getLocalizedCategoryName } = useLocalizedCategories();

  const { budgets, accounts, createTransaction } = useFinanceDomainStore(
    useShallow((state) => ({
      budgets: state.budgets,
      accounts: state.accounts,
      createTransaction: state.createTransaction,
    })),
  );
  const { baseCurrency, convertAmount } = useFinancePreferencesStore(
    useShallow((state) => ({
      baseCurrency: state.baseCurrency,
      convertAmount: state.convertAmount,
    })),
  );

  const budget = useMemo(
    () => budgets.find((b) => b.id === normalizedBudgetId) ?? null,
    [budgets, normalizedBudgetId],
  );

  // Determine if this is a spending or saving budget
  const isSpendingBudget = budget?.transactionType !== 'income';

  const [amountInput, setAmountInput] = useState('');
  // Initialize transaction type based on budget type (will be set by useEffect)
  const [txnType, setTxnType] = useState<TxnType>('income');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(accounts[0]?.id ?? null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get budget categories with details
  const budgetCategories = useMemo(() => {
    if (!budget?.categoryIds?.length) return [];
    return budget.categoryIds.map((catName) => {
      const found = FINANCE_CATEGORIES.find((c) => c.name === catName);
      return {
        name: catName,
        localizedName: getLocalizedCategoryName(catName),
        icon: found?.icon,
        colorToken: found?.colorToken ?? 'textSecondary',
      };
    });
  }, [budget?.categoryIds, getLocalizedCategoryName]);

  // Set the correct transaction type and default category when budget loads
  useEffect(() => {
    if (budget) {
      // Spending budgets track expenses, saving budgets track income (contributions)
      setTxnType(budget.transactionType === 'income' ? 'income' : 'expense');
      // Set first category as default
      if (budget.categoryIds?.length && !selectedCategory) {
        setSelectedCategory(budget.categoryIds[0]);
      }
    }
  }, [budget, selectedCategory]);

  const handleClose = useCallback(() => router.back(), [router]);

  const amountValue = useMemo(() => parseSpacedNumber(amountInput), [amountInput]);

  const handleAmountChange = useCallback((text: string) => {
    // Faqat raqam va nuqta qabul qilish
    const cleaned = text.replace(/[^\d.]/g, '');
    // Bir nechta nuqtani oldini olish
    const parts = cleaned.split('.');
    const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
    const num = parseFloat(sanitized) || 0;
    setAmountInput(num > 0 ? formatNumberWithSpaces(num) : sanitized);
  }, []);

  const isValid = amountValue > 0 && Boolean(selectedAccountId) && Boolean(budget);

  const handleSubmit = useCallback(() => {
    if (!isValid || !budget || !selectedAccountId) return;
    const account = accounts.find((a) => a.id === selectedAccountId);
    if (!account) return;
    const nowIso = new Date().toISOString();
    const amount = Math.abs(amountValue);
    const txnCurrency = (account.currency ?? baseCurrency) as FinanceCurrency;
    const budgetCurrency = (budget.currency ?? txnCurrency) as FinanceCurrency;
    const rateToBudget = convertAmount(1, txnCurrency, budgetCurrency) || 1;
    const convertedAmountToBudget = amount * rateToBudget;

    createTransaction({
      userId: 'local-user',
      type: txnType,
      amount,
      accountId: account.id,
      currency: txnCurrency,
      baseCurrency: budgetCurrency,
      rateUsedToBase: rateToBudget,
      convertedAmountToBase: convertedAmountToBudget,
      budgetId: budget.id,
      categoryId: selectedCategory ?? budget.categoryIds?.[0],
      goalId: budget.linkedGoalId,
      description: detailStrings.actions?.addToBudget ?? 'Add to budget',
      date: nowIso,
    });
    // Note: createTransaction already handles account balance updates via applyTransactionToAccounts

    handleClose();
  }, [
    accounts,
    amountValue,
    baseCurrency,
    budget,
    createTransaction,
    convertAmount,
    detailStrings.actions?.addToBudget,
    handleClose,
    isValid,
    selectedAccountId,
    selectedCategory,
    txnType,
  ]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
              {isSpendingBudget
                ? (detailStrings.actions?.recordExpense ?? 'Record expense')
                : (detailStrings.actions?.addToBudget ?? 'Add to budget')}
            </Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>{commonStrings.close ?? 'Close'}</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              {transactionsStrings.details?.amount ?? 'Amount'}
            </Text>
            <AdaptiveGlassView style={[styles.glassSurface, styles.inputWrapper, { backgroundColor: theme.colors.card }]}>
              <View style={styles.amountInputContainer}>
                <TextInput
                  value={amountInput}
                  onChangeText={handleAmountChange}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.textInput, { color: theme.colors.textPrimary }]}
                />
                <Text style={[styles.currencySuffix, { color: theme.colors.textSecondary }]}>
                  {budget?.currency ?? baseCurrency}
                </Text>
              </View>
            </AdaptiveGlassView>
          </View>

          <View style={styles.sectionFullWidth}>
            <Text style={[styles.label, styles.labelWithPadding, { color: theme.colors.textSecondary }]}>{financeStrings.debts.modal.accountLabel}</Text>
            {accounts.length === 0 ? (
              <AddAccountCTA
                title="Add an account"
                subtitle="Accounts are required to log budget activity"
              />
            ) : (
              <View style={styles.accountListContainer}>
                <FlashList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={accounts}
                  keyExtractor={(item: Account) => item.id}
                  estimatedItemSize={140}
                  renderItem={({ item: account }: { item: Account }) => {
                    const active = account.id === selectedAccountId;
                    return (
                      <Pressable
                        onPress={() => setSelectedAccountId(account.id)}
                        style={({ pressed }) => [pressed && styles.pressed]}
                      >
                        <AdaptiveGlassView
                          style={[
                            styles.glassSurface,
                            styles.accountChip,
                            {
                              opacity: active ? 1 : 0.6,
                              borderColor: active ? theme.colors.primary : theme.colors.border,
                              backgroundColor: theme.colors.card,
                            },
                          ]}
                        >
                          <Text style={[styles.accountChipLabel, { color: active ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                            {account.name}
                          </Text>
                          <Text style={[styles.accountChipSubtext, { color: theme.colors.textMuted }]}>{account.currency}</Text>
                        </AdaptiveGlassView>
                      </Pressable>
                    );
                  }}
                  ListHeaderComponent={<View style={styles.listEdgeSpacer} />}
                  ItemSeparatorComponent={() => <View style={styles.horizontalSeparator} />}
                  ListFooterComponent={<View style={styles.listEdgeSpacer} />}
                />
              </View>
            )}
          </View>

          {/* Category Selection */}
          {budgetCategories.length > 1 && (
            <View style={styles.sectionFullWidth}>
              <Text style={[styles.label, styles.labelWithPadding, { color: theme.colors.textSecondary }]}>
                {(financeStrings.budgets.form as any).categoryLabel ?? 'Category'}
              </Text>
              <View style={styles.categoryListContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScrollContent}
                >
                  {budgetCategories.map((cat) => {
                    const active = selectedCategory === cat.name;
                    const IconComponent = cat.icon;
                    const iconColor = active
                      ? theme.colors.textPrimary
                      : (theme.colors[cat.colorToken] ?? theme.colors.textSecondary);
                    return (
                      <Pressable
                        key={cat.name}
                        onPress={() => setSelectedCategory(cat.name)}
                        style={({ pressed }) => [pressed && styles.pressed]}
                      >
                        <View
                          style={[
                            styles.categoryChip,
                            {
                              backgroundColor: active
                                ? `${theme.colors.primary}20`
                                : theme.colors.card,
                              borderColor: active ? theme.colors.primary : theme.colors.border,
                            },
                          ]}
                        >
                          {IconComponent && <IconComponent size={18} color={iconColor} />}
                          <Text
                            style={[
                              styles.categoryChipText,
                              { color: active ? theme.colors.textPrimary : theme.colors.textSecondary },
                            ]}
                          >
                            {cat.localizedName}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          )}

          {/* Show selected category if only one */}
          {budgetCategories.length === 1 && (() => {
            const SingleIcon = budgetCategories[0].icon;
            return (
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  {(financeStrings.budgets.form as any).categoryLabel ?? 'Category'}
                </Text>
                <View style={[styles.singleCategoryDisplay, { backgroundColor: theme.colors.card }]}>
                  {SingleIcon && (
                    <SingleIcon
                      size={20}
                      color={theme.colors[budgetCategories[0].colorToken] ?? theme.colors.textSecondary}
                    />
                  )}
                  <Text style={[styles.singleCategoryText, { color: theme.colors.textPrimary }]}>
                    {budgetCategories[0].localizedName}
                  </Text>
                </View>
              </View>
            );
          })()}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.actionButtons}>
        <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={handleClose}>
          <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>{commonStrings.cancel ?? 'Cancel'}</Text>
        </Pressable>
        <Pressable
          disabled={!isValid}
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && isValid && styles.pressed,
            { opacity: isValid ? 1 : 0.5, backgroundColor: theme.colors.primary },
          ]}
        >
          <Text style={styles.primaryButtonText}>{commonStrings.apply ?? 'Add'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default BudgetAddValueModal;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: { flex: 1 },
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
  sectionFullWidth: {
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
    width: 12,
  },
  accountListContainer: {
    height: 64,
  },
  glassSurface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  textInput: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  currencySuffix: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  typeContainer: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  typeOptionContent: {
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  accountChip: {
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 56,
    justifyContent: 'center',
    width: 140,
  },
  accountChipLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  accountChipSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryListContainer: {
    height: 50,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  singleCategoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  singleCategoryText: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.7,
  },
});
