import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useFinancePreferencesStore, type FinanceCurrency } from '@/stores/useFinancePreferencesStore';
import { useShallow } from 'zustand/react/shallow';

type LocalParams = { budgetId?: string };
type TxnType = 'income' | 'expense';

const BudgetAddValueModal = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const financeStrings = (strings as any).financeScreens ?? {};
  const detailStrings = financeStrings.budgets?.detail ?? {};
  const transactionsStrings = financeStrings.transactions ?? {};
  const commonStrings = (strings as any).common ?? {};
  const { budgetId } = useLocalSearchParams<LocalParams>();
  const normalizedBudgetId = Array.isArray(budgetId) ? budgetId[0] : budgetId ?? null;

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

  // Set the correct transaction type when budget loads
  useEffect(() => {
    if (budget) {
      // Spending budgets track expenses, saving budgets track income (contributions)
      setTxnType(budget.transactionType === 'income' ? 'income' : 'expense');
    }
  }, [budget]);

  const handleClose = useCallback(() => router.back(), [router]);

  const amountValue = useMemo(() => {
    const parsed = parseFloat(amountInput.replace(/[^0-9.,]/g, '').replace(/,/g, '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountInput]);

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
            <AdaptiveGlassView style={[styles.glassSurface, styles.inputContainer]}>
              <TextInput
                value={amountInput}
                onChangeText={setAmountInput}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.textInput, { color: theme.colors.textPrimary }]}
              />
            </AdaptiveGlassView>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{financeStrings.debts?.modal?.accountLabel ?? 'Account'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountScroll}>
              {accounts.map((account) => {
                const active = account.id === selectedAccountId;
                return (
                  <Pressable
                    key={account.id}
                    onPress={() => setSelectedAccountId(account.id)}
                    style={({ pressed }) => [pressed && styles.pressed]}
                  >
                    <AdaptiveGlassView
                      style={[
                        styles.glassSurface,
                        styles.accountChip,
                        { opacity: active ? 1 : 0.6, borderColor: active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.18)' },
                      ]}
                    >
                      <Text style={[styles.accountChipLabel, { color: active ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                        {account.name}
                      </Text>
                      <Text style={styles.accountChipSubtext}>{account.currency}</Text>
                    </AdaptiveGlassView>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.actionButtons}>
        <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={handleClose}>
          <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>{commonStrings.cancel ?? 'Cancel'}</Text>
        </Pressable>
        <Pressable
          disabled={!isValid}
          onPress={handleSubmit}
          style={({ pressed }) => [styles.primaryButton, pressed && isValid && styles.pressed, { opacity: isValid ? 1 : 0.5 }]}
        >
          <AdaptiveGlassView style={[styles.glassSurface, styles.primaryButtonInner]}>
            <Text style={styles.primaryButtonText}>{commonStrings.apply ?? 'Add'}</Text>
          </AdaptiveGlassView>
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
  glassSurface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
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
  accountScroll: {
    paddingVertical: 6,
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
    marginTop: 2,
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
  },
  primaryButtonInner: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
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
