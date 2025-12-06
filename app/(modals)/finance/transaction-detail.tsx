import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, TrendingUp, TrendingDown, MoreVertical } from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import type { Transaction as DomainTransaction } from '@/domain/finance/types';
import { useShallow } from 'zustand/react/shallow';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import TransactionCardIcon from '@/components/screens/finance/transactions/TransactionCardIcon';
import type { TransactionCardType } from '@/components/screens/finance/transactions/types';
import { FxService } from '@/services/fx/FxService';
import { normalizeFinanceCurrency } from '@/utils/financeCurrency';

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

// Dropdown action type
type DropdownAction = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

// Dropdown component (GoalActionsDropdown ga o'xshash)
const ActionsDropdown: React.FC<{
  visible: boolean;
  onClose: () => void;
  actions: DropdownAction[];
  topOffset: number;
}> = ({ visible, onClose, actions, topOffset }) => {
  const theme = useAppTheme();
  if (!visible) return null;

  return (
    <Pressable style={styles.dropdownOverlay} onPress={onClose}>
      <Pressable
        style={[
          styles.dropdownCard,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border, top: topOffset },
        ]}
        onPress={(e) => e.stopPropagation()}
      >
        {actions.map((action, idx) => (
          <Pressable
            key={action.label + idx}
            style={({ pressed }) => [styles.dropdownItem, pressed && { opacity: 0.7 }]}
            onPress={() => {
              onClose();
              action.onPress();
            }}
          >
            <Text
              style={[
                styles.dropdownLabel,
                { color: action.destructive ? theme.colors.danger : theme.colors.textPrimary },
              ]}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </Pressable>
    </Pressable>
  );
};

export default function TransactionDetailModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const transactionsStrings = strings.financeScreens.transactions;
  const filterSheetStrings = transactionsStrings.filterSheet;
  const { id } = useLocalSearchParams<{ id?: string }>();
  const transactionId = Array.isArray(id) ? id[0] : id ?? null;

  const {
    accounts,
    transactions: domainTransactions,
    debts,
    budgets: financeBudgets,
    softDeleteTransaction,
    undoDeleteTransaction,
  } = useFinanceDomainStore(
    useShallow((state) => ({
      accounts: state.accounts,
      transactions: state.transactions,
      debts: state.debts,
      budgets: state.budgets,
      softDeleteTransaction: state.softDeleteTransaction,
      undoDeleteTransaction: state.undoDeleteTransaction,
    })),
  );

  // Menu state
  const [menuVisible, setMenuVisible] = useState(false);
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

  // Valyuta P/L hisoblash (qarz to'lovi uchun)
  const currencyPL = useMemo(() => {
    if (!relatedDebt?.repaymentCurrency || relatedDebt.repaymentCurrency === relatedDebt.principalCurrency) {
      return null;
    }

    const startRate = relatedDebt.repaymentRateOnStart ?? 1;
    const currentRate = FxService.getInstance().getRate(
      normalizeFinanceCurrency(relatedDebt.principalCurrency),
      normalizeFinanceCurrency(relatedDebt.repaymentCurrency)
    ) ?? startRate;

    if (Math.abs(currentRate - startRate) < 0.0001) return null;

    const paymentAmount = selectedTransaction?.amount ?? 0;
    const rateDifference = currentRate - startRate;
    const profitLossInRepaymentCurrency = paymentAmount * rateDifference;
    const profitLoss = currentRate > 0 ? profitLossInRepaymentCurrency / currentRate : 0;

    // Foyda/zarar yo'nalishi
    const isProfit = relatedDebt.direction === 'they_owe_me' ? rateDifference >= 0 : rateDifference <= 0;

    return {
      startRate,
      currentRate,
      rateDifference,
      profitLoss: Math.abs(profitLoss),
      isProfit,
      principalCurrency: relatedDebt.principalCurrency,
      repaymentCurrency: relatedDebt.repaymentCurrency,
    };
  }, [relatedDebt, selectedTransaction?.amount]);

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

  // Transaction statusini tekshirish
  const isCanceled = selectedTransaction?.showStatus === 'deleted' || selectedTransaction?.showStatus === 'archived';

  // Transaction bekor qilish (soft delete)
  const handleCancelTransaction = useCallback(() => {
    if (!transactionId) return;
    softDeleteTransaction(transactionId);
    setMenuVisible(false);
  }, [softDeleteTransaction, transactionId]);

  // Transaction tiklash
  const handleRestoreTransaction = useCallback(() => {
    if (!selectedTransaction) return;
    // Store orqali tiklash (balance ham tiklanadi)
    undoDeleteTransaction(selectedTransaction);
    setMenuVisible(false);
  }, [selectedTransaction, undoDeleteTransaction]);

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
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setMenuVisible(true)}
            style={[styles.menuButton, { backgroundColor: theme.colors.cardItem }]}
            hitSlop={8}
          >
            <MoreVertical size={20} color={theme.colors.textPrimary} />
          </Pressable>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>
              {(strings as any).common?.close ?? 'Close'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Canceled status banner */}
      {isCanceled && (
        <View style={[styles.canceledBanner, { backgroundColor: theme.colors.dangerBg }]}>
          <Text style={[styles.canceledText, { color: theme.colors.danger }]}>
            {(transactionsStrings.details as any).canceledBanner ?? 'This transaction is canceled'}
          </Text>
        </View>
      )}

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
          <DetailRow
            label={(transactionsStrings as any).status?.label ?? 'Status'}
            value={isCanceled
              ? ((transactionsStrings as any).status?.canceled ?? 'canceled')
              : ((transactionsStrings as any).status?.confirmed ?? 'confirmed')}
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

        {/* Base Currency Conversion (if different currency) */}
        {selectedTransaction.convertedAmountToBase &&
          selectedTransaction.baseCurrency &&
          selectedTransaction.baseCurrency !== selectedTransaction.currency && (
          <AdaptiveGlassView style={[styles.glassSurface, styles.detailCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <DetailRow
              label={(transactionsStrings.details as any).baseCurrencyAmount ?? 'Base Currency Amount'}
              value={`≈ ${formatCurrencyDisplay(selectedTransaction.convertedAmountToBase, selectedTransaction.baseCurrency)}`}
            />
            <DetailRow
              label={(transactionsStrings.details as any).exchangeRate ?? 'Exchange Rate'}
              value={`1 ${selectedTransaction.currency} = ${(selectedTransaction.rateUsedToBase ?? 1).toFixed(4)} ${selectedTransaction.baseCurrency}`}
            />
          </AdaptiveGlassView>
        )}

        {/* Debt Payment Currency Conversion Card */}
        {currencyPL && relatedDebt && (() => {
          const currencyConversionStrings = (strings.financeScreens.debts.actions as any)?.currencyConversion ?? {};
          return (
            <AdaptiveGlassView
              style={[
                styles.glassSurface,
                styles.detailCard,
                {
                  backgroundColor: currencyPL.isProfit
                    ? 'rgba(34, 197, 94, 0.08)'
                    : 'rgba(239, 68, 68, 0.08)',
                  borderColor: currencyPL.isProfit
                    ? 'rgba(34, 197, 94, 0.2)'
                    : 'rgba(239, 68, 68, 0.2)',
                },
              ]}
            >
              <View style={styles.currencyPLHeader}>
                {currencyPL.isProfit ? (
                  <TrendingUp size={18} color={theme.colors.success} />
                ) : (
                  <TrendingDown size={18} color={theme.colors.danger} />
                )}
                <Text style={[styles.currencyPLTitle, { color: theme.colors.textPrimary }]}>
                  {currencyConversionStrings.title ?? 'Currency Conversion'}
                </Text>
              </View>

              <DetailRow
                label={currencyConversionStrings.debtCurrency ?? 'Debt Currency'}
                value={currencyPL.principalCurrency}
              />
              <DetailRow
                label={currencyConversionStrings.repaymentCurrency ?? 'Repayment Currency'}
                value={currencyPL.repaymentCurrency}
              />
              <DetailRow
                label={currencyConversionStrings.startRate ?? 'Start Rate'}
                value={`1 ${currencyPL.principalCurrency} = ${currencyPL.startRate.toFixed(2)} ${currencyPL.repaymentCurrency}`}
              />
              <DetailRow
                label={currencyConversionStrings.currentRate ?? 'Current Rate'}
                value={`1 ${currencyPL.principalCurrency} = ${currencyPL.currentRate.toFixed(2)} ${currencyPL.repaymentCurrency}`}
              />

              <View style={styles.currencyPLResult}>
                <Text style={[styles.currencyPLResultLabel, { color: theme.colors.textSecondary }]}>
                  {currencyPL.isProfit
                    ? (currencyConversionStrings.profit ?? 'Profit')
                    : (currencyConversionStrings.loss ?? 'Loss')}
                </Text>
                <Text
                  style={[
                    styles.currencyPLResultValue,
                    { color: currencyPL.isProfit ? theme.colors.success : theme.colors.danger },
                  ]}
                >
                  {currencyPL.isProfit ? '+' : '-'}{formatCurrencyDisplay(currencyPL.profitLoss, currencyPL.principalCurrency)}
                </Text>
              </View>
            </AdaptiveGlassView>
          );
        })()}

        {/* Linked Items Card */}
        {(selectedGoal || selectedTransaction?.goalName || selectedBudget || relatedDebt) && (
          <AdaptiveGlassView style={[styles.glassSurface, styles.detailCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.linkedSectionTitle, { color: theme.colors.textSecondary }]}>
              {transactionsStrings.details.linkedData ?? 'Linked Data'}
            </Text>
            {(selectedGoal || selectedTransaction?.goalName) && (
              <Pressable
                onPress={() => selectedGoal && router.push({
                  pathname: '/(modals)/planner/goal-detail',
                  params: { id: selectedGoal.id },
                })}
                style={({ pressed }) => [styles.linkedItem, pressed && selectedGoal && styles.pressedOpacity]}
              >
                <View style={styles.linkedItemContent}>
                  <Text style={[styles.linkedItemLabel, { color: theme.colors.textSecondary }]}>
                    {transactionsStrings.details.linkedGoal ?? 'Goal'}
                  </Text>
                  <Text style={[styles.linkedItemValue, { color: theme.colors.textPrimary }]}>
                    {selectedGoal?.title ?? selectedTransaction?.goalName ?? '—'}
                  </Text>
                </View>
                {selectedGoal && <ArrowRight size={16} color={theme.colors.textMuted} />}
              </Pressable>
            )}
            {selectedBudget && (
              <Pressable
                onPress={() => router.push({
                  pathname: '/(modals)/finance/budget-detail',
                  params: { id: selectedBudget.id },
                })}
                style={({ pressed }) => [styles.linkedItem, pressed && styles.pressedOpacity]}
              >
                <View style={styles.linkedItemContent}>
                  <Text style={[styles.linkedItemLabel, { color: theme.colors.textSecondary }]}>
                    {transactionsStrings.details.linkedBudget ?? 'Budget'}
                  </Text>
                  <Text style={[styles.linkedItemValue, { color: theme.colors.textPrimary }]}>
                    {selectedBudget.name} • {formatCurrencyDisplay(selectedBudget.currentBalance ?? selectedBudget.remainingAmount ?? selectedBudget.limitAmount, selectedBudget.currency)}
                  </Text>
                </View>
                <ArrowRight size={16} color={theme.colors.textMuted} />
              </Pressable>
            )}
            {relatedDebt && (
              <Pressable
                onPress={() => router.push({
                  pathname: '/(modals)/finance/debt-detail',
                  params: { id: relatedDebt.id },
                })}
                style={({ pressed }) => [styles.linkedItem, pressed && styles.pressedOpacity]}
              >
                <View style={styles.linkedItemContent}>
                  <Text style={[styles.linkedItemLabel, { color: theme.colors.textSecondary }]}>
                    {transactionsStrings.details.relatedDebt ?? 'Debt'}
                  </Text>
                  <Text style={[styles.linkedItemValue, { color: theme.colors.textPrimary }]}>
                    {relatedDebt.counterpartyName} • {formatCurrencyDisplay(relatedDebt.principalAmount, relatedDebt.principalCurrency)}
                  </Text>
                </View>
                <ArrowRight size={16} color={theme.colors.textMuted} />
              </Pressable>
            )}
          </AdaptiveGlassView>
        )}
      </ScrollView>

      <View style={styles.footerButtons}>
        {!isCanceled ? (
          <>
            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressedOpacity]}
              onPress={handleEditTransaction}
            >
              <AdaptiveGlassView style={[styles.glassSurface, styles.actionButtonInner]}>
                <Text style={styles.actionButtonText}>
                  {strings.financeScreens.accounts.actions.edit}
                </Text>
              </AdaptiveGlassView>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressedOpacity]}
              onPress={handleClose}
            >
              <AdaptiveGlassView style={[styles.glassSurface, styles.actionButtonInner, styles.actionButtonSecondary]}>
                <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>
                  {transactionsStrings.details.close}
                </Text>
              </AdaptiveGlassView>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressedOpacity]}
              onPress={handleRestoreTransaction}
            >
              <AdaptiveGlassView style={[styles.glassSurface, styles.actionButtonInner]}>
                <Text style={styles.actionButtonText}>
                  {(transactionsStrings.details as any).actions?.restore ?? 'Restore'}
                </Text>
              </AdaptiveGlassView>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressedOpacity]}
              onPress={handleClose}
            >
              <AdaptiveGlassView style={[styles.glassSurface, styles.actionButtonInner, styles.actionButtonSecondary]}>
                <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>
                  {transactionsStrings.details.close}
                </Text>
              </AdaptiveGlassView>
            </Pressable>
          </>
        )}
      </View>

      {/* Actions Dropdown (GoalActionsDropdown style) */}
      <ActionsDropdown
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        topOffset={insets.top + 8}
        actions={
          !isCanceled
            ? [
                { label: (transactionsStrings.details as any).actions?.edit ?? 'Edit', onPress: () => { setMenuVisible(false); handleEditTransaction(); } },
                { label: (transactionsStrings.details as any).actions?.cancel ?? 'Cancel', onPress: handleCancelTransaction, destructive: true },
              ]
            : [
                { label: (transactionsStrings.details as any).actions?.restore ?? 'Restore', onPress: handleRestoreTransaction },
              ]
        }
      />
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
  linkedSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  linkedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  linkedItemContent: {
    flex: 1,
    gap: 2,
  },
  linkedItemLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  linkedItemValue: {
    fontSize: 14,
    fontWeight: '600',
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
  actionButton: {
    flex: 1,
    borderRadius: 16,
  },
  actionButtonInner: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonSecondary: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressedOpacity: {
    opacity: 0.85,
  },
  currencyPLHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  currencyPLTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  currencyPLResult: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  currencyPLResultLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  currencyPLResultValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  // Header actions
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Canceled banner
  canceledBanner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  canceledText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Dropdown (GoalActionsDropdown style)
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  dropdownCard: {
    position: 'absolute',
    right: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Delete confirmation modal
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  confirmCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonSecondary: {
    borderWidth: 1,
  },
  confirmButtonDanger: {
    // backgroundColor set dynamically
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
