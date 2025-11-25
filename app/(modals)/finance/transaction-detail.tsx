import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import type { Transaction as LegacyTransaction } from '@/types/store.types';
import type { Transaction as DomainTransaction } from '@/domain/finance/types';
import { mapDomainDebtToLegacy } from '@/utils/finance/debtMappers';
import { useShallow } from 'zustand/react/shallow';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';

const BASE_CURRENCY = 'UZS';

const formatCurrencyDisplay = (value: number, currency?: string) => {
  const resolvedCurrency = currency ?? BASE_CURRENCY;
  try {
    return new Intl.NumberFormat(resolvedCurrency === 'UZS' ? 'uz-UZ' : 'en-US', {
      style: 'currency',
      currency: resolvedCurrency,
      maximumFractionDigits: resolvedCurrency === 'UZS' ? 0 : 2,
    }).format(Math.abs(value));
  } catch {
    return `${resolvedCurrency} ${Math.abs(value).toFixed(2)}`;
  }
};

type LegacyTransactionType = 'income' | 'outcome' | 'transfer';

const toLegacyTransactionType = (type: DomainTransaction['type']): LegacyTransactionType =>
  type === 'expense' ? 'outcome' : type;

const mapDomainTransactionToLegacy = (transaction: DomainTransaction): LegacyTransaction[] => {
  const legacyType = toLegacyTransactionType(transaction.type);
  const fallbackAccount = transaction.accountId ?? transaction.fromAccountId ?? 'local-account';
  const baseRecord = {
    type: legacyType,
    category: transaction.categoryId,
    toAccountId: transaction.toAccountId,
    note: transaction.description,
    description: transaction.description,
    date: new Date(transaction.date),
    createdAt: new Date(transaction.createdAt),
    updatedAt: new Date(transaction.updatedAt),
    goalId: transaction.goalId,
    goalName: transaction.goalName,
    goalType: transaction.goalType,
    budgetId: transaction.budgetId,
    debtId: transaction.debtId,
    relatedBudgetId: transaction.relatedBudgetId ?? transaction.budgetId,
    relatedDebtId: transaction.relatedDebtId ?? transaction.debtId,
    plannedAmount: transaction.plannedAmount ?? transaction.amount,
    paidAmount: transaction.paidAmount ?? transaction.amount,
    sourceTransactionId: transaction.id,
  } as const;

  if (legacyType !== 'transfer') {
    return [
      {
        ...baseRecord,
        id: transaction.id,
        amount: transaction.amount,
        accountId: fallbackAccount,
        currency: transaction.currency,
      },
    ];
  }

  const fromAccountId = transaction.accountId ?? transaction.fromAccountId ?? fallbackAccount;
  const toAccountId = transaction.toAccountId ?? fallbackAccount;
  const incomingAmount = transaction.toAmount ?? transaction.amount;
  const incomingCurrency = transaction.toCurrency ?? transaction.currency;

  return [
    {
      ...baseRecord,
      id: `${transaction.id}-from`,
      amount: transaction.amount,
      accountId: fromAccountId,
      currency: transaction.currency,
      transferDirection: 'outgoing',
    },
    {
      ...baseRecord,
      id: `${transaction.id}-to`,
      amount: incomingAmount,
      accountId: toAccountId,
      currency: incomingCurrency,
      transferDirection: 'incoming',
    },
  ];
};

type DetailRowProps = {
  label: string;
  value: string;
};

const DetailRow = ({ label, value }: DetailRowProps) => {
  const theme = useAppTheme();

  return (
    <View style={styles.detailField}>
      <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text
        style={[styles.detailValue, { color: theme.colors.textPrimary }]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {value}
      </Text>
    </View>
  );
};

export default function TransactionDetailModal() {
  const router = useRouter();
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const transactionsStrings = strings.financeScreens.transactions;
  const filterSheetStrings = transactionsStrings.filterSheet;
  const { id } = useLocalSearchParams<{ id?: string }>();
  const transactionId = Array.isArray(id) ? id[0] : id ?? null;

  const { accounts, transactions: domainTransactions, debts: domainDebts, budgets: financeBudgets } = useFinanceDomainStore(
    useShallow((state) => ({
      accounts: state.accounts,
      transactions: state.transactions,
      debts: state.debts,
      budgets: state.budgets,
    })),
  );
  const goals = usePlannerDomainStore((state) => state.goals);

  const transactions = useMemo<LegacyTransaction[]>(
    () => domainTransactions.flatMap(mapDomainTransactionToLegacy),
    [domainTransactions],
  );
  const debts = useMemo(() => domainDebts.map(mapDomainDebtToLegacy), [domainDebts]);

  const selectedTransaction = useMemo(
    () => transactions.find((txn) => txn.id === transactionId) ?? null,
    [transactionId, transactions],
  );

  const selectedGoal = useMemo(() => {
    if (!selectedTransaction?.goalId) {
      return null;
    }
    return goals.find((goal) => goal.id === selectedTransaction.goalId) ?? null;
  }, [goals, selectedTransaction?.goalId]);

  const selectedBudget = useMemo(() => {
    if (!selectedTransaction) {
      return null;
    }
    const budgetId = selectedTransaction.relatedBudgetId ?? selectedTransaction.budgetId;
    if (!budgetId) {
      return null;
    }
    return financeBudgets.find((budget) => budget.id === budgetId) ?? null;
  }, [financeBudgets, selectedTransaction]);

  const relatedDebt = useMemo(() => {
    if (!selectedTransaction?.relatedDebtId) {
      return null;
    }
    return debts.find((debt) => debt.id === selectedTransaction.relatedDebtId) ?? null;
  }, [debts, selectedTransaction]);

  const selectedTransactionTypeLabel = useMemo(() => {
    if (!selectedTransaction) {
      return null;
    }
    if (selectedTransaction.relatedDebtId) {
      return filterSheetStrings.typeOptions.debt ?? 'Debt';
    }
    if (selectedTransaction.type === 'income') {
      return filterSheetStrings.typeOptions.income;
    }
    if (selectedTransaction.type === 'outcome') {
      return filterSheetStrings.typeOptions.expense;
    }
    if (selectedTransaction.type === 'transfer') {
      return filterSheetStrings.typeOptions.transfer;
    }
    return null;
  }, [filterSheetStrings.typeOptions, selectedTransaction]);

  const handleEditTransaction = () => {
    if (!selectedTransaction) {
      return;
    }

    const targetId = selectedTransaction.sourceTransactionId ?? selectedTransaction.id;

    if (selectedTransaction.type === 'transfer') {
      router.replace({
        pathname: '/(modals)/finance/transaction',
        params: { id: targetId },
      });
      return;
    }

    router.replace({
      pathname: '/(modals)/finance/quick-exp',
      params: {
        id: targetId,
        tab: (selectedTransaction.type ?? 'income') as 'income' | 'outcome',
      },
    });
  };

  const handleClose = () => {
    router.back();
  };

  if (!selectedTransaction) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {transactionsStrings.details.title}
          </Text>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>
              {(strings as any).common?.close ?? 'Close'}
            </Text>
          </Pressable>
        </View>
        <View style={styles.detailEmpty}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
            Transaction not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          {transactionsStrings.details.title}
        </Text>
        <Pressable onPress={handleClose} hitSlop={12}>
          <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>
            {(strings as any).common?.close ?? 'Close'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <AdaptiveGlassView style={[styles.glassSurface, styles.detailCard]}>
          {selectedTransactionTypeLabel ? (
            <DetailRow
              label={transactionsStrings.details.type}
              value={selectedTransactionTypeLabel}
            />
          ) : null}
          <DetailRow
            label={transactionsStrings.details.amount}
            value={`${selectedTransaction.type === 'income'
              ? '+'
              : selectedTransaction.type === 'outcome'
                ? '−'
                : selectedTransaction.transferDirection === 'incoming'
                  ? '+'
                  : selectedTransaction.transferDirection === 'outgoing'
                    ? '−'
                    : ''}${formatCurrencyDisplay(selectedTransaction.amount, selectedTransaction.currency)}`}
          />
          <DetailRow
            label={transactionsStrings.details.account}
            value={
              accounts.find((account) => account.id === selectedTransaction.accountId)?.name ??
              transactionsStrings.details.account
            }
          />
          <DetailRow
            label={transactionsStrings.details.category}
            value={selectedTransaction.category ?? '—'}
          />
          <DetailRow
            label={transactionsStrings.details.date}
            value={new Date(selectedTransaction.date).toLocaleString()}
          />
        </AdaptiveGlassView>

        <AdaptiveGlassView style={[styles.glassSurface, styles.detailCard]}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
            {transactionsStrings.details.note}
          </Text>
          <Text style={[styles.detailNote, { color: theme.colors.textPrimary }]}>
            {selectedTransaction.note ?? selectedTransaction.description ?? '—'}
          </Text>
        </AdaptiveGlassView>

        {(selectedGoal || selectedTransaction?.goalName || selectedBudget || relatedDebt) && (
          <AdaptiveGlassView style={[styles.glassSurface, styles.detailCard]}>
            {(selectedGoal || selectedTransaction?.goalName) && (
              <DetailRow
                label="Linked Goal"
                value={selectedGoal?.title ?? selectedTransaction?.goalName ?? '—'}
              />
            )}
            {selectedBudget && (
              <DetailRow
                label="Linked Budget"
                value={`${selectedBudget.name} • ${(selectedBudget.currentBalance ?? selectedBudget.remainingAmount ?? selectedBudget.limitAmount).toFixed(2)} ${selectedBudget.currency}`}
              />
            )}
            {relatedDebt && (
              <DetailRow
                label={transactionsStrings.details.relatedDebt}
                value={`${relatedDebt.person} • ${relatedDebt.remainingAmount.toFixed(2)} ${relatedDebt.currency}`}
              />
            )}
          </AdaptiveGlassView>
        )}
      </ScrollView>

      <View style={styles.footerButtons}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: theme.colors.primary },
            pressed && styles.pressedOpacity,
          ]}
          onPress={handleEditTransaction}
        >
          <Text style={[styles.primaryButtonText, { color: theme.colors.onPrimary }]}>
            {strings.financeScreens.accounts.actions.edit}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: theme.colors.border },
            pressed && styles.pressedOpacity,
          ]}
          onPress={handleClose}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.colors.textPrimary }]}>
            {transactionsStrings.details.close}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
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
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    gap: 16,
  },
  glassSurface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(16,16,22,0.82)',
  },
  detailCard: {
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 12,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },
  detailField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailNote: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  detailEmpty: {
    flex: 1,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  primaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pressedOpacity: {
    opacity: 0.85,
  },
});
