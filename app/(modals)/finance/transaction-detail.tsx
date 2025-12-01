import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import type { Transaction as DomainTransaction } from '@/domain/finance/types';
import { useShallow } from 'zustand/react/shallow';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import TransactionCardIcon from '@/components/screens/finance/transactions/TransactionCardIcon';
import type { TransactionCardType } from '@/components/screens/finance/transactions/types';

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

// Domain type ni UI type ga aylantirish
const toCardType = (type: DomainTransaction['type'], hasDebt: boolean): TransactionCardType => {
  if (hasDebt) return 'debt';
  if (type === 'expense') return 'outcome';
  return type;
};

// Vaqtni formatlash
const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
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

  const { accounts, transactions: domainTransactions, debts, budgets: financeBudgets } = useFinanceDomainStore(
    useShallow((state) => ({
      accounts: state.accounts,
      transactions: state.transactions,
      debts: state.debts,
      budgets: state.budgets,
    })),
  );
  const goals = usePlannerDomainStore((state) => state.goals);

  // Domain transaction dan to'g'ridan-to'g'ri qidirish
  const selectedTransaction = useMemo(
    () => domainTransactions.find((txn) => txn.id === transactionId) ?? null,
    [transactionId, domainTransactions],
  );

  // Account map yaratish
  const accountMap = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts],
  );

  // Bog'liq debt
  const relatedDebt = useMemo(() => {
    if (!selectedTransaction?.relatedDebtId) {
      return null;
    }
    return debts.find((debt) => debt.id === selectedTransaction.relatedDebtId) ?? null;
  }, [debts, selectedTransaction]);

  // Card type
  const cardType = useMemo<TransactionCardType | null>(() => {
    if (!selectedTransaction) return null;
    return toCardType(selectedTransaction.type, !!relatedDebt);
  }, [selectedTransaction, relatedDebt]);

  // Goal
  const selectedGoal = useMemo(() => {
    if (!selectedTransaction?.goalId) {
      return null;
    }
    return goals.find((goal) => goal.id === selectedTransaction.goalId) ?? null;
  }, [goals, selectedTransaction?.goalId]);

  // Budget
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

  // Type label
  const selectedTransactionTypeLabel = useMemo(() => {
    if (!cardType) return null;
    switch (cardType) {
      case 'debt':
        return filterSheetStrings.typeOptions.debt ?? 'Debt';
      case 'income':
        return filterSheetStrings.typeOptions.income;
      case 'outcome':
        return filterSheetStrings.typeOptions.expense;
      case 'transfer':
        return filterSheetStrings.typeOptions.transfer;
      default:
        return null;
    }
  }, [filterSheetStrings.typeOptions, cardType]);

  // Summa belgisi
  const getAmountSign = (): string => {
    if (!cardType) return '';
    switch (cardType) {
      case 'income':
        return '+';
      case 'outcome':
        return '−';
      case 'transfer':
        return '';
      case 'debt':
        return relatedDebt?.direction === 'they_owe_me' ? '+' : '−';
      default:
        return '';
    }
  };

  const handleEditTransaction = () => {
    if (!selectedTransaction) {
      return;
    }

    if (selectedTransaction.type === 'transfer') {
      router.replace({
        pathname: '/(modals)/finance/transaction',
        params: { id: selectedTransaction.id },
      });
      return;
    }

    router.replace({
      pathname: '/(modals)/finance/quick-exp',
      params: {
        id: selectedTransaction.id,
        tab: selectedTransaction.type === 'expense' ? 'outcome' : 'income',
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
            {transactionsStrings.details.notFound}
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
        {/* Header Card - Icon, Name, Amount */}
        <AdaptiveGlassView style={[styles.glassSurface, styles.headerCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.headerCardContent}>
            <TransactionCardIcon
              categoryId={selectedTransaction.categoryId}
              type={cardType ?? 'outcome'}
              size={56}
            />
            <View style={styles.headerCardInfo}>
              <Text style={[styles.transactionName, { color: theme.colors.textPrimary }]}>
                {selectedTransaction.name ?? selectedTransaction.categoryId ?? selectedTransactionTypeLabel ?? 'Transaction'}
              </Text>
              {selectedTransaction.type === 'transfer' ? (
                <View style={styles.transferRow}>
                  <Text style={[styles.transferAccount, { color: theme.colors.textSecondary }]}>
                    {accountMap.get(selectedTransaction.accountId ?? selectedTransaction.fromAccountId ?? '') ?? 'Account'}
                  </Text>
                  <ArrowRight size={14} color={theme.colors.textMuted} />
                  <Text style={[styles.transferAccount, { color: theme.colors.textSecondary }]}>
                    {accountMap.get(selectedTransaction.toAccountId ?? '') ?? 'Account'}
                  </Text>
                </View>
              ) : cardType === 'debt' && relatedDebt ? (
                <Text style={[styles.subText, { color: theme.colors.textSecondary }]}>
                  {relatedDebt.direction === 'i_owe'
                    ? `You owe ${relatedDebt.counterpartyName}`
                    : `${relatedDebt.counterpartyName} owes you`}
                </Text>
              ) : (
                <Text style={[styles.subText, { color: theme.colors.textSecondary }]}>
                  {accountMap.get(selectedTransaction.accountId ?? selectedTransaction.fromAccountId ?? '') ?? selectedTransactionTypeLabel}
                </Text>
              )}
            </View>
            <View style={styles.headerCardAmount}>
              <Text style={[styles.amount, { color: theme.colors.textPrimary }]}>
                {getAmountSign()} {formatCurrencyDisplay(selectedTransaction.amount, selectedTransaction.currency)}
              </Text>
              {selectedTransaction.type === 'transfer' && selectedTransaction.toAmount && selectedTransaction.toCurrency !== selectedTransaction.currency && (
                <Text style={[styles.conversionText, { color: theme.colors.textMuted }]}>
                  → {formatCurrencyDisplay(selectedTransaction.toAmount, selectedTransaction.toCurrency)}
                </Text>
              )}
            </View>
          </View>
        </AdaptiveGlassView>

        {/* Details Card */}
        <AdaptiveGlassView style={[styles.glassSurface, styles.detailCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {/* Transfer uchun: From va To accountlar */}
          {selectedTransaction.type === 'transfer' ? (
            <>
              <DetailRow
                label="From Account"
                value={accountMap.get(selectedTransaction.accountId ?? selectedTransaction.fromAccountId ?? '') ?? '—'}
              />
              <DetailRow
                label="To Account"
                value={accountMap.get(selectedTransaction.toAccountId ?? '') ?? '—'}
              />
              {selectedTransaction.toAmount && selectedTransaction.toCurrency !== selectedTransaction.currency && (
                <DetailRow
                  label="Converted Amount"
                  value={formatCurrencyDisplay(selectedTransaction.toAmount, selectedTransaction.toCurrency)}
                />
              )}
            </>
          ) : (
            /* Income/Expense uchun: bitta account */
            <DetailRow
              label={cardType === 'income' ? 'Credited to' : cardType === 'outcome' ? 'Debited from' : transactionsStrings.details.account}
              value={accountMap.get(selectedTransaction.accountId ?? selectedTransaction.fromAccountId ?? '') ?? '—'}
            />
          )}
          {selectedTransaction.categoryId && (
            <DetailRow
              label={transactionsStrings.details.category}
              value={selectedTransaction.categoryId}
            />
          )}
          <DetailRow
            label={transactionsStrings.details.date}
            value={formatDateTime(new Date(selectedTransaction.date))}
          />
        </AdaptiveGlassView>

        {/* Note Card */}
        {selectedTransaction.description && (
          <AdaptiveGlassView style={[styles.glassSurface, styles.detailCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
              {transactionsStrings.details.note}
            </Text>
            <Text style={[styles.detailNote, { color: theme.colors.textPrimary }]}>
              {selectedTransaction.description}
            </Text>
          </AdaptiveGlassView>
        )}

        {/* Linked Items Card */}
        {(selectedGoal || selectedTransaction?.goalName || selectedBudget || relatedDebt) && (
          <AdaptiveGlassView style={[styles.glassSurface, styles.detailCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            {(selectedGoal || selectedTransaction?.goalName) && (
              <DetailRow
                label={transactionsStrings.details.linkedGoal}
                value={selectedGoal?.title ?? selectedTransaction?.goalName ?? '—'}
              />
            )}
            {selectedBudget && (
              <DetailRow
                label={transactionsStrings.details.linkedBudget}
                value={`${selectedBudget.name} • ${formatCurrencyDisplay(selectedBudget.currentBalance ?? selectedBudget.remainingAmount ?? selectedBudget.limitAmount, selectedBudget.currency)}`}
              />
            )}
            {relatedDebt && (
              <DetailRow
                label={transactionsStrings.details.relatedDebt}
                value={`${relatedDebt.counterpartyName} • ${formatCurrencyDisplay(relatedDebt.principalAmount, relatedDebt.principalCurrency)}`}
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
  },
  headerCard: {
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerCardInfo: {
    flex: 1,
    gap: 4,
  },
  headerCardAmount: {
    alignItems: 'flex-end',
    gap: 2,
  },
  transactionName: {
    fontSize: 17,
    fontWeight: '700',
  },
  subText: {
    fontSize: 13,
  },
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transferAccount: {
    fontSize: 13,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
  },
  conversionText: {
    fontSize: 12,
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
