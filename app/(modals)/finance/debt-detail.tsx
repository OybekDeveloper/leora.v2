import React, { useMemo, useCallback } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CreditCard,
  HandCoins,
  Calendar,
  User,
  Clock,
  FileText,
  TrendingUp,
  TrendingDown,
  Check,
  Edit3,
  Trash2,
} from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useShallow } from 'zustand/react/shallow';
import { FxService } from '@/services/fx/FxService';
import { normalizeFinanceCurrency } from '@/utils/financeCurrency';

const formatCurrencyDisplay = (value: number, currency?: string) => {
  const resolvedCurrency = currency ?? 'USD';
  const absValue = Math.abs(value);

  try {
    // Format number with proper decimal places
    const decimals = resolvedCurrency === 'UZS' ? 0 : 2;
    const formatted = new Intl.NumberFormat(resolvedCurrency === 'UZS' ? 'uz-UZ' : 'en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(absValue);

    // Return without dollar sign - just number and currency code
    return `${formatted} ${resolvedCurrency}`;
  } catch {
    return `${absValue.toFixed(resolvedCurrency === 'UZS' ? 0 : 2)} ${resolvedCurrency}`;
  }
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
};

const formatShortDate = (dateString: string): string => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
};

type ActionButtonProps = {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  theme: ReturnType<typeof useAppTheme>;
};

const ActionButton = ({ icon, label, onPress, disabled, theme }: ActionButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        pressed && styles.pressedOpacity,
        disabled && styles.disabledButton,
      ]}
    >
      {icon}
      <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
};

type DetailRowProps = {
  label: string;
  value: string;
  valueColor?: string;
  theme: ReturnType<typeof useAppTheme>;
};

const DetailRow = ({ label, value, valueColor, theme }: DetailRowProps) => {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text
        style={[styles.detailValue, { color: valueColor ?? theme.colors.textPrimary }]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
};

// =====================================================
// Main Component
// =====================================================
export default function DebtDetailModal() {
  const router = useRouter();
  const theme = useAppTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const debtId = Array.isArray(id) ? id[0] : id ?? null;
  const { strings } = useLocalization();
  const commonStrings = (strings as any).common ?? {};
  const closeLabel = commonStrings.close ?? 'Close';


  const { debts, debtPayments, accounts, deleteDebt, fxRates } = useFinanceDomainStore(
    useShallow((state) => ({
      debts: state.debts,
      debtPayments: state.debtPayments,
      accounts: state.accounts,
      deleteDebt: state.deleteDebt,
      fxRates: state.fxRates, // FX kurs o'zgarganda UI yangilanishi uchun
    })),
  );

  const debt = useMemo(
    () => debts.find((d) => d.id === debtId) ?? null,
    [debtId, debts],
  );

  const payments = useMemo(
    () => debtPayments.filter((p) => p.debtId === debtId).sort((a, b) =>
      new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    ),
    [debtId, debtPayments],
  );

  const fundingAccount = useMemo(
    () => accounts.find((a) => a.id === debt?.fundingAccountId) ?? null,
    [accounts, debt?.fundingAccountId],
  );

  // Calculate progress
  const progressData = useMemo(() => {
    if (!debt) return { percent: 0, paid: 0, original: 0, remaining: 0 };
    const original = debt.principalOriginalAmount ?? debt.principalAmount;
    const rawPaid = payments.reduce((sum, p) => sum + p.convertedAmountToDebt, 0);
    // Multi-currency to'lovlarda yaxlitlash xatolarini oldini olish:
    // To'langan summa asl summadan oshmasligi kerak
    const paid = Math.min(rawPaid, original);
    const remaining = debt.principalAmount;
    const percent = original > 0 ? (paid / original) * 100 : 0;
    return { percent, paid, original, remaining };
  }, [debt, payments]);

  // Multi-currency P/L calculation
  const currencyPL = useMemo(() => {
    if (!debt?.repaymentCurrency || debt.repaymentCurrency === debt.principalCurrency) {
      return null;
    }

    const startRate = debt.repaymentRateOnStart ?? 1;
    const originalPrincipal = (debt as any).principalOriginalAmount ?? debt.principalAmount;

    // YOPILGAN QARZ: Saqlangan settlement ma'lumotlarini ishlatish
    if (debt.settledAt && debt.finalProfitLoss !== undefined) {
      const finalRate = debt.finalRateUsed ?? startRate;
      const expectedAtStartRate = originalPrincipal * startRate;
      const totalPaid = debt.totalPaidInRepaymentCurrency ?? expectedAtStartRate;

      // finalProfitLoss allaqachon to'g'ri hisoblab saqlangan
      const profitLossInRepaymentCurrency = debt.finalProfitLoss;
      const profitLossInPrincipal = finalRate > 0 ? profitLossInRepaymentCurrency / finalRate : 0;

      return {
        startRate,
        currentRate: finalRate,
        rateDifference: finalRate - startRate,
        profitLossInRepaymentCurrency,
        profitLossInPrincipal,
        isProfit: profitLossInRepaymentCurrency >= 0,
        expectedAtStartRate,
        currentAtCurrentRate: totalPaid,
        isSettled: true,
        settledAt: debt.settledAt,
      };
    }

    // AKTIV QARZ: Hozirgi kursni FxService dan olish
    const currentRate = FxService.getInstance().getRate(
      normalizeFinanceCurrency(debt.principalCurrency),
      normalizeFinanceCurrency(debt.repaymentCurrency)
    ) ?? startRate;

    // Qarz summasi (qolgan)
    const remainingAmount = debt.principalAmount;

    // Boshlang'ich kursda kutilgan summa
    const expectedAtStartRate = remainingAmount * startRate;
    // Hozirgi kursda summa
    const currentAtCurrentRate = remainingAmount * currentRate;

    // Foyda/zarar hisoblash
    // Agar men qarz berdim (they_owe_me): kurs oshsa = foyda (ko'proq pul qaytadi)
    // Agar men qarz oldim (i_owe): kurs tushsa = foyda (kamroq pul to'layman)
    const rateDifference = currentRate - startRate;
    const profitLossInRepaymentCurrency = remainingAmount * rateDifference;

    // Principal valyutada foyda/zarar
    const profitLossInPrincipal = currentRate > 0 ? profitLossInRepaymentCurrency / currentRate : 0;

    // Yo'nalishga qarab foyda/zarar belgilash
    // they_owe_me: kurs oshsa = foyda (ko'proq pul qaytadi)
    // i_owe: kurs oshsa = zarar (ko'proq pul to'layman)
    const isProfit = debt.direction === 'they_owe_me'
      ? rateDifference >= 0
      : rateDifference <= 0;

    return {
      startRate,
      currentRate,
      rateDifference,
      profitLossInRepaymentCurrency,
      profitLossInPrincipal,
      isProfit,
      expectedAtStartRate,
      currentAtCurrentRate,
      isSettled: false,
    };
  }, [debt, fxRates]); // fxRates - kurs o'zgarganda qayta hisoblash uchun

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handlePayFull = useCallback(() => {
    router.push({ pathname: '/(modals)/finance/debt-actions', params: { id: debt?.id, action: 'full_payment' } });
  }, [router, debt?.id]);

  const handlePayPartial = useCallback(() => {
    router.push({ pathname: '/(modals)/finance/debt-actions', params: { id: debt?.id, action: 'partial_payment' } });
  }, [router, debt?.id]);

  const handleSchedule = useCallback(() => {
    router.push({ pathname: '/(modals)/finance/debt-actions', params: { id: debt?.id, action: 'extend_date' } });
  }, [router, debt?.id]);

  const handleEdit = useCallback(() => {
    router.push({ pathname: '/(modals)/finance/debt', params: { id: debt?.id } });
  }, [router, debt?.id]);

  const handleDelete = useCallback(() => {
    if (!debt) return;

    Alert.alert(
      'Delete Debt',
      `Are you sure you want to delete the debt with ${debt.counterpartyName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteDebt(debt.id);
            router.back();
          },
        },
      ]
    );
  }, [debt, deleteDebt, router]);


  if (!debt) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.textSecondary }]}>Debt Details</Text>
          <Pressable onPress={handleBack} hitSlop={12}>
            <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>{closeLabel}</Text>
          </Pressable>
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Debt not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isTheyOweMe = debt.direction === 'they_owe_me';
  const isIOwe = debt.direction === 'i_owe';
  // MUHIM: Faqat qolgan summa 0.01 dan kichik bo'lganda to'langan deb hisoblanadi
  // debt.status 'paid' bo'lishi mumkin, lekin principalAmount > 0.01 bo'lsa, to'lanmagan!
  // Bu holat user "Mark as Settled" bosganda, lekin keyinroq yangi to'lov qo'shganda yuzaga keladi
  // Floating point xatolari uchun 0.01 tolerans
  const isPaid = debt.principalAmount <= 0.01;
  const payFullLabel = isIOwe ? 'Repay Full' : 'Collect Full';
  const payPartialLabel = isIOwe ? 'Repay Partial' : 'Collect Partial';

  // Debug: Log debt details to understand why actions might be hidden
  console.log('[DebtDetail] Debt state:', {
    id: debt.id,
    counterparty: debt.counterpartyName,
    principalCurrency: debt.principalCurrency,
    principalAmount: debt.principalAmount,
    principalOriginalAmount: debt.principalOriginalAmount,
    'progressData.remaining': progressData.remaining,
    'progressData.paid': progressData.paid,
    'progressData.original': progressData.original,
    status: debt.status,
    isPaid,
    direction: debt.direction,
    paymentsCount: payments.length,
    payments: payments.map(p => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      convertedAmountToDebt: p.convertedAmountToDebt,
      rateUsedToDebt: p.rateUsedToDebt,
    })),
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.textSecondary }]}>Debt Details</Text>
        <Pressable onPress={handleBack} hitSlop={12}>
          <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>{closeLabel}</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Main Card */}
        <AdaptiveGlassView style={[styles.mainCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.mainCardHeader}>
            <View style={[styles.avatarLarge, { backgroundColor: isTheyOweMe ? `${theme.colors.success}20` : `${theme.colors.danger}20` }]}>
              <User size={28} color={isTheyOweMe ? theme.colors.success : theme.colors.danger} />
            </View>
            <View style={styles.counterpartyInfo}>
              <Text style={[styles.counterpartyName, { color: theme.colors.textPrimary }]}>
                {debt.counterpartyName}
              </Text>
              <Text style={[styles.debtType, { color: isTheyOweMe ? theme.colors.success : theme.colors.danger }]}>
                {isTheyOweMe ? 'They owe you' : 'You owe them'}
              </Text>
            </View>
            {isPaid && (
              <View style={[styles.paidBadge, { backgroundColor: `${theme.colors.success}20` }]}>
                <Check size={14} color={theme.colors.success} />
                <Text style={[styles.paidBadgeText, { color: theme.colors.success }]}>Paid</Text>
              </View>
            )}
          </View>

          {/* Amount & Progress */}
          <View style={styles.amountSection}>
            <View style={styles.amountRow}>
              <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>
                {isIOwe ? 'You still owe' : 'They still owe'}
              </Text>
              <Text style={[styles.amountValue, { color: isIOwe ? theme.colors.danger : theme.colors.success }]}>
                {formatCurrencyDisplay(progressData.remaining, debt.principalCurrency)}
              </Text>
            </View>
            {progressData.paid > 0 && (
              <View style={styles.amountRow}>
                <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>
                  {isIOwe ? 'Repaid' : 'Collected'}
                </Text>
                <Text style={[styles.amountPaid, { color: theme.colors.success }]}>
                  {formatCurrencyDisplay(progressData.paid, debt.principalCurrency)}
                </Text>
              </View>
            )}
            <View style={styles.amountRow}>
              <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>Original</Text>
              <Text style={[styles.amountOriginal, { color: theme.colors.textMuted }]}>
                {formatCurrencyDisplay(progressData.original, debt.principalCurrency)}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.colors.success,
                    width: `${Math.min(progressData.percent, 100)}%`
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
              {progressData.percent.toFixed(0)}% {isIOwe ? 'repaid' : 'collected'}
            </Text>
          </View>

          {/* Due Date */}
          {debt.dueDate && (
            <View style={styles.dueRow}>
              <Clock size={14} color={theme.colors.textMuted} />
              <Text style={[styles.dueText, { color: theme.colors.textSecondary }]}>
                Due: {formatDate(debt.dueDate)}
              </Text>
            </View>
          )}
        </AdaptiveGlassView>

        {/* Action Buttons */}
        {!isPaid && (
          <View style={styles.actionsGrid}>
            <ActionButton
              icon={<CreditCard size={18} color={theme.colors.primary} />}
              label={payFullLabel}
              onPress={handlePayFull}
              theme={theme}
            />
            <ActionButton
              icon={<HandCoins size={18} color={theme.colors.primary} />}
              label={payPartialLabel}
              onPress={handlePayPartial}
              theme={theme}
            />
            <ActionButton
              icon={<Calendar size={18} color={theme.colors.primary} />}
              label="Due Date"
              onPress={handleSchedule}
              theme={theme}
            />
            {/* "Mark as Settled" tugmasi olib tashlandi - faqat to'liq to'langandan keyin avtomatik 'paid' statusga o'tadi */}
          </View>
        )}

        {/* Details Card */}
        <AdaptiveGlassView style={[styles.detailCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Details</Text>
          <View style={styles.detailsList}>
            <DetailRow
              label="Type"
              value={isTheyOweMe ? 'Lent money (they owe me)' : 'Borrowed money (I owe)'}
              theme={theme}
            />
            <DetailRow label="Currency" value={debt.principalCurrency} theme={theme} />
            <DetailRow label="Created" value={formatDate(debt.createdAt)} theme={theme} />
            {debt.dueDate && <DetailRow label="Due Date" value={formatDate(debt.dueDate)} theme={theme} />}
            {fundingAccount && <DetailRow label="Account" value={fundingAccount.name} theme={theme} />}
            {debt.description && <DetailRow label="Note" value={debt.description} theme={theme} />}
          </View>
        </AdaptiveGlassView>

        {/* Multi-currency Repayment Info */}
        {debt.repaymentCurrency && debt.repaymentCurrency !== debt.principalCurrency && (
          <AdaptiveGlassView style={[styles.detailCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={16} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Repayment Plan</Text>
            </View>
            <View style={styles.detailsList}>
              <DetailRow label="Repay in" value={debt.repaymentCurrency} theme={theme} />
              <DetailRow
                label="Rate at start"
                value={`1 ${debt.principalCurrency} = ${debt.repaymentRateOnStart?.toLocaleString() ?? '—'} ${debt.repaymentCurrency}`}
                theme={theme}
              />
              {debt.repaymentAmount && (
                <DetailRow
                  label="Expected amount"
                  value={formatCurrencyDisplay(debt.repaymentAmount, debt.repaymentCurrency)}
                  theme={theme}
                />
              )}
            </View>
          </AdaptiveGlassView>
        )}

        {/* Payment History */}
        {payments.length > 0 && (
          <AdaptiveGlassView style={[styles.detailCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeader}>
              <FileText size={16} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                {isIOwe ? 'Repayment History' : 'Collection History'}
              </Text>
            </View>
            <View style={styles.paymentsList}>
              {payments.map((payment) => (
                <View key={payment.id} style={styles.paymentItem}>
                  <View style={styles.paymentLeft}>
                    <Text style={[styles.paymentDate, { color: theme.colors.textSecondary }]}>
                      {formatShortDate(payment.paymentDate)}
                    </Text>
                    {payment.note && (
                      <Text style={[styles.paymentNote, { color: theme.colors.textMuted }]} numberOfLines={1}>
                        {payment.note}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.paymentAmount, { color: theme.colors.success }]}>
                    +{formatCurrencyDisplay(payment.amount, payment.currency)}
                  </Text>
                </View>
              ))}
            </View>
          </AdaptiveGlassView>
        )}

        {/* Currency P/L Section */}
        {currencyPL && (
          <AdaptiveGlassView style={[styles.detailCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeader}>
              {currencyPL.isProfit ? (
                <TrendingUp size={16} color={theme.colors.success} />
              ) : (
                <TrendingDown size={16} color={theme.colors.danger} />
              )}
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                {currencyPL.isSettled ? 'Yakuniy Natija' : 'Valyuta Farqi'}
              </Text>
            </View>
            <View style={styles.detailsList}>
              <DetailRow
                label="Boshlang'ich kurs"
                value={`1 ${debt.principalCurrency} = ${currencyPL.startRate.toLocaleString()} ${debt.repaymentCurrency}`}
                theme={theme}
              />
              <DetailRow
                label={currencyPL.isSettled ? 'Yakuniy kurs' : 'Hozirgi kurs'}
                value={`1 ${debt.principalCurrency} = ${currencyPL.currentRate.toLocaleString()} ${debt.repaymentCurrency}`}
                theme={theme}
              />
              <DetailRow
                label="Kutilgan summa"
                value={formatCurrencyDisplay(currencyPL.expectedAtStartRate, debt.repaymentCurrency)}
                theme={theme}
              />
              <DetailRow
                label={currencyPL.isSettled ? "To'langan summa" : 'Hozirgi summa'}
                value={formatCurrencyDisplay(currencyPL.currentAtCurrentRate, debt.repaymentCurrency)}
                valueColor={currencyPL.isProfit ? theme.colors.success : theme.colors.danger}
                theme={theme}
              />
              <DetailRow
                label={currencyPL.isProfit ? 'Foyda' : 'Zarar'}
                value={`${currencyPL.isProfit ? '+' : '−'}${formatCurrencyDisplay(Math.abs(currencyPL.profitLossInRepaymentCurrency), debt.repaymentCurrency)}`}
                valueColor={currencyPL.isProfit ? theme.colors.success : theme.colors.danger}
                theme={theme}
              />
              {/* Principal valyutada ham ko'rsatish */}
              <DetailRow
                label={`${currencyPL.isProfit ? 'Foyda' : 'Zarar'} (${debt.principalCurrency})`}
                value={`${currencyPL.isProfit ? '+' : '−'}${formatCurrencyDisplay(Math.abs(currencyPL.profitLossInPrincipal), debt.principalCurrency)}`}
                valueColor={currencyPL.isProfit ? theme.colors.success : theme.colors.danger}
                theme={theme}
              />
              {/* Yopilgan sana */}
              {currencyPL.isSettled && currencyPL.settledAt && (
                <DetailRow
                  label="Yopilgan sana"
                  value={formatDate(currencyPL.settledAt)}
                  theme={theme}
                />
              )}
            </View>
          </AdaptiveGlassView>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
        <Pressable
          onPress={handleDelete}
          style={[styles.bottomButton, { backgroundColor: `${theme.colors.danger}10`, borderColor: `${theme.colors.danger}30` }]}
        >
          <Trash2 size={18} color={theme.colors.danger} />
          <Text style={[styles.bottomButtonText, { color: theme.colors.danger }]}>Delete</Text>
        </Pressable>
        <Pressable
          onPress={handleEdit}
          style={[styles.bottomButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        >
          <Edit3 size={18} color={theme.colors.primary} />
          <Text style={[styles.bottomButtonText, { color: theme.colors.primary }]}>Edit</Text>
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
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  mainCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 16,
  },
  mainCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterpartyInfo: {
    flex: 1,
    gap: 4,
  },
  counterpartyName: {
    fontSize: 20,
    fontWeight: '700',
  },
  debtType: {
    fontSize: 14,
    fontWeight: '600',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  paidBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  amountSection: {
    gap: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  amountLabel: {
    fontSize: 13,
  },
  amountValue: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  amountPaid: {
    fontSize: 16,
    fontWeight: '700',
  },
  amountOriginal: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    gap: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dueText: {
    fontSize: 13,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  detailCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  detailsList: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    maxWidth: '60%',
  },
  paymentsList: {
    gap: 12,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLeft: {
    gap: 2,
  },
  paymentDate: {
    fontSize: 13,
    fontWeight: '600',
  },
  paymentNote: {
    fontSize: 12,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
  pressedOpacity: {
    opacity: 0.8,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  bottomButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
