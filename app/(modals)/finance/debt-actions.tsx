import React, { useMemo, useState, useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CreditCard,
  HandCoins,
  Calendar,
  CheckCircle2,
  CalendarDays,
  ChevronDown,
  Check,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import AccountPicker from '@/components/shared/AccountPicker';
import type { Debt } from '@/domain/finance/types';
import { useShallow } from 'zustand/react/shallow';

// =====================================================
// Utility Functions
// =====================================================
const formatCurrencyDisplay = (value: number, currency?: string) => {
  const resolvedCurrency = currency ?? 'USD';
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

// =====================================================
// Action Types
// =====================================================
type ActionType = 'partial_payment' | 'full_payment' | 'extend_date' | 'mark_settled';

type ActionCardProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'default' | 'success' | 'warning';
  theme: ReturnType<typeof useAppTheme>;
};

const ActionCard = ({ icon, title, subtitle, onPress, disabled, variant = 'default', theme }: ActionCardProps) => {
  const bgColor = variant === 'success'
    ? `${theme.colors.success}10`
    : variant === 'warning'
    ? `${theme.colors.warning}10`
    : theme.colors.card;

  const borderColor = variant === 'success'
    ? `${theme.colors.success}30`
    : variant === 'warning'
    ? `${theme.colors.warning}30`
    : theme.colors.border;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionCard,
        { backgroundColor: bgColor, borderColor },
        pressed && styles.pressedOpacity,
        disabled && styles.disabledCard,
      ]}
    >
      <View style={styles.actionCardIcon}>{icon}</View>
      <View style={styles.actionCardContent}>
        <Text style={[styles.actionCardTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.actionCardSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <ChevronDown size={18} color={theme.colors.textMuted} style={{ transform: [{ rotate: '-90deg' }] }} />
    </Pressable>
  );
};

// =====================================================
// Payment Form Component
// =====================================================
type PaymentFormProps = {
  debt: Debt;
  isPartial: boolean;
  onClose: () => void;
  onSubmit: (amount: number, accountId: string | null, paymentDate: Date, note?: string) => void;
};

const PaymentForm = ({ debt, isPartial, onClose, onSubmit }: PaymentFormProps) => {
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const debtActionsStrings = strings.financeScreens.debts.actions;
  const isIOwe = debt.direction === 'i_owe';

  const [amount, setAmount] = useState(isPartial ? '' : debt.principalAmount.toString());
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(debt.fundingAccountId ?? null);
  const [note, setNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount) || 0;
    if (parsedAmount <= 0) {
      Alert.alert(debtActionsStrings?.errors?.invalidAmount ?? 'Invalid amount', debtActionsStrings?.errors?.enterValidAmount ?? 'Please enter a valid amount');
      return;
    }
    if (parsedAmount > debt.principalAmount) {
      Alert.alert(
        debtActionsStrings?.errors?.amountTooHigh ?? 'Amount too high',
        `${debtActionsStrings?.errors?.maxAmount ?? 'Maximum amount is'} ${formatCurrencyDisplay(debt.principalAmount, debt.principalCurrency)}`
      );
      return;
    }
    onSubmit(parsedAmount, selectedAccountId, paymentDate, note || undefined);
  };

  const handleDateChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setPaymentDate(selectedDate);
    }
  };

  return (
    <ScrollView
      style={styles.formScrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: isIOwe ? `${theme.colors.danger}15` : `${theme.colors.success}15` }]}>
        <Text style={[styles.infoBannerText, { color: isIOwe ? theme.colors.danger : theme.colors.success }]}>
          {isIOwe
            ? debtActionsStrings?.paymentInfo?.expense ?? 'This payment will be recorded as an expense from your account'
            : debtActionsStrings?.paymentInfo?.income ?? 'This payment will be recorded as income to your account'
          }
        </Text>
      </View>

      {/* Amount Input */}
      <View style={styles.fieldContainer}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
          {debtActionsStrings?.fields?.amount ?? 'Amount'}
        </Text>
        <View style={[styles.amountInputContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
          <Text style={[styles.currencyPrefix, { color: theme.colors.textSecondary }]}>
            {debt.principalCurrency}
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.amountInput, { color: theme.colors.textPrimary }]}
            editable={isPartial}
          />
        </View>
        <Text style={[styles.fieldHelper, { color: theme.colors.textMuted }]}>
          {debtActionsStrings?.fields?.remaining ?? 'Remaining'}: {formatCurrencyDisplay(debt.principalAmount, debt.principalCurrency)}
        </Text>
      </View>

      {/* Payment Date */}
      <View style={styles.fieldContainer}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
          {debtActionsStrings?.fields?.paymentDate ?? 'Payment Date'}
        </Text>
        <Pressable
          onPress={() => setShowDatePicker(!showDatePicker)}
          style={[styles.dateButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
        >
          <CalendarDays size={18} color={theme.colors.textSecondary} />
          <Text style={[styles.dateButtonText, { color: theme.colors.textPrimary }]}>
            {formatDate(paymentDate.toISOString())}
          </Text>
          <ChevronDown size={16} color={theme.colors.textMuted} />
        </Pressable>

        {showDatePicker && (
          <View style={[styles.datePickerInline, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <DateTimePicker
              value={paymentDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
              themeVariant={theme.mode}
            />
            {Platform.OS === 'ios' && (
              <Pressable
                onPress={() => setShowDatePicker(false)}
                style={[styles.datePickerDone, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={[styles.datePickerDoneText, { color: theme.colors.onPrimary }]}>
                  {debtActionsStrings?.buttons?.done ?? 'Done'}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Account Picker */}
      <View style={[styles.fieldContainer, { zIndex: 100 }]}>
        <AccountPicker
          label={debtActionsStrings?.fields?.account ?? 'Account'}
          selectedAccountId={selectedAccountId}
          onSelect={(account) => setSelectedAccountId(account?.id ?? null)}
          placeholder={debtActionsStrings?.fields?.selectAccount ?? 'Select account...'}
        />
      </View>

      {/* Note */}
      <View style={styles.fieldContainer}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
          {debtActionsStrings?.fields?.note ?? 'Note'}
        </Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={debtActionsStrings?.fields?.optionalNote ?? 'Optional note...'}
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.noteInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.card, color: theme.colors.textPrimary }]}
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Actions */}
      <View style={styles.formActionsRow}>
        <Pressable
          onPress={onClose}
          style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
        >
          <Text style={[styles.cancelBtnText, { color: theme.colors.textPrimary }]}>
            {debtActionsStrings?.buttons?.cancel ?? 'Cancel'}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
        >
          <Check size={18} color={theme.colors.onPrimary} />
          <Text style={[styles.submitBtnText, { color: theme.colors.onPrimary }]}>
            {debtActionsStrings?.buttons?.confirm ?? 'Confirm'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

// =====================================================
// Extend Date Form Component
// =====================================================
type ExtendDateFormProps = {
  debt: Debt;
  onClose: () => void;
  onSubmit: (dueDate: Date) => void;
};

const ExtendDateForm = ({ debt, onClose, onSubmit }: ExtendDateFormProps) => {
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const debtActionsStrings = strings.financeScreens.debts.actions;

  const [dueDate, setDueDate] = useState(debt.dueDate ? new Date(debt.dueDate) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const quickOptions = [
    { label: debtActionsStrings?.quickOptions?.tomorrow ?? 'Tomorrow', days: 1 },
    { label: debtActionsStrings?.quickOptions?.nextWeek ?? 'Next Week', days: 7 },
    { label: debtActionsStrings?.quickOptions?.nextMonth ?? 'Next Month', days: 30 },
    { label: debtActionsStrings?.quickOptions?.threeMonths ?? '3 Months', days: 90 },
  ];

  const handleQuickOption = (days: number) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + days);
    setDueDate(newDate);
  };

  return (
    <ScrollView
      style={styles.formScrollContent}
      contentContainerStyle={styles.extendDateContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Quick Options */}
      <View style={styles.quickOptionsGrid}>
        {quickOptions.map((option) => (
          <Pressable
            key={option.label}
            onPress={() => handleQuickOption(option.days)}
            style={[styles.quickOptionBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <Text style={[styles.quickOptionText, { color: theme.colors.textPrimary }]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Custom Date */}
      <View style={styles.fieldContainer}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
          {debtActionsStrings?.extendDate?.customDateLabel ?? 'Or select a custom date'}
        </Text>
        <Pressable
          onPress={() => setShowDatePicker(!showDatePicker)}
          style={[styles.dateButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
        >
          <CalendarDays size={18} color={theme.colors.textSecondary} />
          <Text style={[styles.dateButtonText, { color: theme.colors.textPrimary }]}>
            {formatDate(dueDate.toISOString())}
          </Text>
          <ChevronDown size={16} color={theme.colors.textMuted} />
        </Pressable>

        {showDatePicker && (
          <View style={[styles.datePickerInline, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <DateTimePicker
              value={dueDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
              themeVariant={theme.mode}
            />
            {Platform.OS === 'ios' && (
              <Pressable
                onPress={() => setShowDatePicker(false)}
                style={[styles.datePickerDone, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={[styles.datePickerDoneText, { color: theme.colors.onPrimary }]}>
                  {debtActionsStrings?.buttons?.done ?? 'Done'}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.extendDateActionsRow}>
        <Pressable
          onPress={onClose}
          style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
        >
          <Text style={[styles.cancelBtnText, { color: theme.colors.textPrimary }]}>
            {debtActionsStrings?.buttons?.cancel ?? 'Cancel'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onSubmit(dueDate)}
          style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
        >
          <Check size={18} color={theme.colors.onPrimary} />
          <Text style={[styles.submitBtnText, { color: theme.colors.onPrimary }]}>
            {debtActionsStrings?.buttons?.setDueDate ?? 'Set Due Date'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

// =====================================================
// Mark Settled Confirmation Component
// =====================================================
type MarkSettledFormProps = {
  debt: Debt;
  onClose: () => void;
  onConfirm: () => void;
};

const MarkSettledForm = ({ debt, onClose, onConfirm }: MarkSettledFormProps) => {
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const debtActionsStrings = strings.financeScreens.debts.actions;
  const isIOwe = debt.direction === 'i_owe';

  return (
    <View style={styles.settledContent}>
      <View style={[styles.settledIconContainer, { backgroundColor: `${theme.colors.success}15` }]}>
        <CheckCircle2 size={48} color={theme.colors.success} />
      </View>

      <Text style={[styles.settledTitle, { color: theme.colors.textPrimary }]}>
        {debtActionsStrings?.markSettled?.title ?? 'Mark as Settled?'}
      </Text>

      <Text style={[styles.settledDescription, { color: theme.colors.textSecondary }]}>
        {isIOwe
          ? debtActionsStrings?.markSettled?.descriptionIOwe ?? `This will mark your debt of ${formatCurrencyDisplay(debt.principalAmount, debt.principalCurrency)} to ${debt.counterpartyName} as fully settled.`
          : debtActionsStrings?.markSettled?.descriptionTheyOwe ?? `This will mark the ${formatCurrencyDisplay(debt.principalAmount, debt.principalCurrency)} debt from ${debt.counterpartyName} as fully settled.`
        }
      </Text>

      <View style={[styles.settledWarning, { backgroundColor: `${theme.colors.warning}10`, borderColor: `${theme.colors.warning}30` }]}>
        <Text style={[styles.settledWarningText, { color: theme.colors.warning }]}>
          {debtActionsStrings?.markSettled?.warning ?? 'This action cannot be undone. No transaction will be created.'}
        </Text>
      </View>

      <View style={styles.formActionsRow}>
        <Pressable
          onPress={onClose}
          style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
        >
          <Text style={[styles.cancelBtnText, { color: theme.colors.textPrimary }]}>
            {debtActionsStrings?.buttons?.cancel ?? 'Cancel'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          style={[styles.submitBtn, { backgroundColor: theme.colors.success }]}
        >
          <Check size={18} color="#FFFFFF" />
          <Text style={[styles.submitBtnText, { color: '#FFFFFF' }]}>
            {debtActionsStrings?.buttons?.markSettled ?? 'Mark Settled'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

// =====================================================
// Main Component
// =====================================================
export default function DebtActionsModal() {
  const router = useRouter();
  const theme = useAppTheme();
  const { id, action } = useLocalSearchParams<{ id?: string; action?: string }>();
  const debtId = Array.isArray(id) ? id[0] : id ?? null;
  const initialAction = Array.isArray(action) ? action[0] : action ?? null;
  const { strings } = useLocalization();
  const debtActionsStrings = strings.financeScreens.debts.actions;
  const commonStrings = (strings as any).common ?? {};
  const closeLabel = commonStrings.close ?? 'Close';

  const [activeAction, setActiveAction] = useState<ActionType | null>(() => {
    if (initialAction && ['partial_payment', 'full_payment', 'extend_date', 'mark_settled'].includes(initialAction)) {
      return initialAction as ActionType;
    }
    return null;
  });

  const { debts, addDebtPayment, updateDebt } = useFinanceDomainStore(
    useShallow((state) => ({
      debts: state.debts,
      addDebtPayment: state.addDebtPayment,
      updateDebt: state.updateDebt,
    })),
  );

  const debt = useMemo(
    () => debts.find((d) => d.id === debtId) ?? null,
    [debtId, debts],
  );

  const handleBack = useCallback(() => {
    if (activeAction) {
      setActiveAction(null);
    } else {
      router.back();
    }
  }, [router, activeAction]);

  const handlePaymentSubmit = useCallback((amount: number, accountId: string | null, paymentDate: Date, note?: string) => {
    if (!debt) return;

    try {
      addDebtPayment({
        debtId: debt.id,
        amount,
        currency: debt.principalCurrency,
        paymentDate: paymentDate.toISOString(),
        accountId: accountId ?? undefined,
        note,
      });

      const actionLabel = debt.direction === 'i_owe'
        ? debtActionsStrings?.success?.repayment ?? 'repayment'
        : debtActionsStrings?.success?.collection ?? 'collection';

      Alert.alert(
        debtActionsStrings?.success?.paymentRecorded ?? 'Payment Recorded',
        `${formatCurrencyDisplay(amount, debt.principalCurrency)} ${actionLabel} ${debtActionsStrings?.success?.hasBeenRecorded ?? 'has been recorded.'}`
      );
      router.back();
    } catch (error) {
      Alert.alert(
        debtActionsStrings?.errors?.error ?? 'Error',
        debtActionsStrings?.errors?.paymentFailed ?? 'Failed to record payment. Please try again.'
      );
    }
  }, [debt, addDebtPayment, router, debtActionsStrings]);

  const handleExtendDateSubmit = useCallback((dueDate: Date) => {
    if (!debt) {
      console.log('[DebtActions] handleExtendDateSubmit: No debt found');
      return;
    }

    console.log('[DebtActions] handleExtendDateSubmit:', {
      debtId: debt.id,
      newDueDate: dueDate.toISOString(),
      currentDueDate: debt.dueDate,
    });

    try {
      updateDebt(debt.id, { dueDate: dueDate.toISOString() });
      console.log('[DebtActions] updateDebt called successfully');
      Alert.alert(
        debtActionsStrings?.success?.dueDateUpdated ?? 'Due Date Updated',
        `${debtActionsStrings?.success?.dueDateSetTo ?? 'Due date set to'} ${formatDate(dueDate.toISOString())}`
      );
      router.back();
    } catch (error) {
      console.error('[DebtActions] updateDebt error:', error);
      Alert.alert(
        debtActionsStrings?.errors?.error ?? 'Error',
        debtActionsStrings?.errors?.dueDateFailed ?? 'Failed to update due date. Please try again.'
      );
    }
  }, [debt, updateDebt, router, debtActionsStrings]);

  const handleMarkSettledConfirm = useCallback(() => {
    if (!debt) return;

    try {
      updateDebt(debt.id, {
        status: 'paid',
        principalAmount: 0,
        principalBaseValue: 0,
      });
      Alert.alert(
        debtActionsStrings?.success?.debtSettled ?? 'Debt Settled',
        debtActionsStrings?.success?.markedAsSettled ?? 'The debt has been marked as fully settled.'
      );
      router.back();
    } catch (error) {
      Alert.alert(
        debtActionsStrings?.errors?.error ?? 'Error',
        debtActionsStrings?.errors?.settleFailed ?? 'Failed to mark debt as settled. Please try again.'
      );
    }
  }, [debt, updateDebt, router, debtActionsStrings]);

  if (!debt) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
            {debtActionsStrings?.title ?? 'Debt Actions'}
          </Text>
          <Pressable onPress={handleBack} hitSlop={12}>
            <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>{closeLabel}</Text>
          </Pressable>
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {debtActionsStrings?.notFound ?? 'Debt not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isIOwe = debt.direction === 'i_owe';
  const isPaid = debt.status === 'paid' || debt.principalAmount <= 0;

  // Get title based on active action
  const getTitle = () => {
    switch (activeAction) {
      case 'partial_payment':
        return isIOwe
          ? debtActionsStrings?.partialPayment?.titleIOwe ?? 'Partial Repayment'
          : debtActionsStrings?.partialPayment?.titleTheyOwe ?? 'Partial Collection';
      case 'full_payment':
        return isIOwe
          ? debtActionsStrings?.fullPayment?.titleIOwe ?? 'Full Repayment'
          : debtActionsStrings?.fullPayment?.titleTheyOwe ?? 'Full Collection';
      case 'extend_date':
        return debtActionsStrings?.extendDate?.title ?? 'Extend Due Date';
      case 'mark_settled':
        return debtActionsStrings?.markSettled?.title ?? 'Mark as Settled';
      default:
        return debtActionsStrings?.title ?? 'Debt Actions';
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.textSecondary }]}>{getTitle()}</Text>
        <Pressable onPress={handleBack} hitSlop={12}>
          <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>{closeLabel}</Text>
        </Pressable>
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.contentContainer}
      >
        {!activeAction ? (
          /* Action Selection */
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.actionsListContent}
          >
            {/* Debt Summary */}
            <AdaptiveGlassView style={[styles.summaryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                {isIOwe
                  ? debtActionsStrings?.summary?.youOwe ?? 'You owe'
                  : debtActionsStrings?.summary?.theyOwe ?? 'They owe you'
                }
              </Text>
              <Text style={[styles.summaryAmount, { color: isIOwe ? theme.colors.danger : theme.colors.success }]}>
                {formatCurrencyDisplay(debt.principalAmount, debt.principalCurrency)}
              </Text>
              <Text style={[styles.summaryPerson, { color: theme.colors.textSecondary }]}>
                {debt.counterpartyName}
              </Text>
            </AdaptiveGlassView>

            {isPaid ? (
              <View style={[styles.paidBanner, { backgroundColor: `${theme.colors.success}15` }]}>
                <CheckCircle2 size={24} color={theme.colors.success} />
                <Text style={[styles.paidBannerText, { color: theme.colors.success }]}>
                  {debtActionsStrings?.paidBanner ?? 'This debt has been fully settled'}
                </Text>
              </View>
            ) : (
              <View style={styles.actionsList}>
                {/* Partial Payment */}
                <ActionCard
                  icon={<HandCoins size={22} color={theme.colors.primary} />}
                  title={isIOwe
                    ? debtActionsStrings?.partialPayment?.titleIOwe ?? 'Partial Repayment'
                    : debtActionsStrings?.partialPayment?.titleTheyOwe ?? 'Partial Collection'
                  }
                  subtitle={debtActionsStrings?.partialPayment?.subtitle ?? 'Record a partial payment towards this debt'}
                  onPress={() => setActiveAction('partial_payment')}
                  theme={theme}
                />

                {/* Full Payment */}
                <ActionCard
                  icon={<CreditCard size={22} color={theme.colors.success} />}
                  title={isIOwe
                    ? debtActionsStrings?.fullPayment?.titleIOwe ?? 'Full Repayment'
                    : debtActionsStrings?.fullPayment?.titleTheyOwe ?? 'Full Collection'
                  }
                  subtitle={`${debtActionsStrings?.fullPayment?.subtitle ?? 'Pay off the full remaining amount of'} ${formatCurrencyDisplay(debt.principalAmount, debt.principalCurrency)}`}
                  onPress={() => setActiveAction('full_payment')}
                  variant="success"
                  theme={theme}
                />

                {/* Extend Due Date */}
                <ActionCard
                  icon={<Calendar size={22} color={theme.colors.warning} />}
                  title={debtActionsStrings?.extendDate?.title ?? 'Extend Due Date'}
                  subtitle={debt.dueDate
                    ? `${debtActionsStrings?.extendDate?.currentDue ?? 'Currently due'}: ${formatDate(debt.dueDate)}`
                    : debtActionsStrings?.extendDate?.noDueDate ?? 'No due date set'
                  }
                  onPress={() => setActiveAction('extend_date')}
                  variant="warning"
                  theme={theme}
                />

                {/* Mark as Settled */}
                <ActionCard
                  icon={<CheckCircle2 size={22} color={theme.colors.success} />}
                  title={debtActionsStrings?.markSettled?.title ?? 'Mark as Settled'}
                  subtitle={debtActionsStrings?.markSettled?.subtitle ?? 'Mark this debt as settled without recording a payment'}
                  onPress={() => setActiveAction('mark_settled')}
                  theme={theme}
                />
              </View>
            )}
          </ScrollView>
        ) : activeAction === 'partial_payment' ? (
          <PaymentForm
            debt={debt}
            isPartial={true}
            onClose={() => setActiveAction(null)}
            onSubmit={handlePaymentSubmit}
          />
        ) : activeAction === 'full_payment' ? (
          <PaymentForm
            debt={debt}
            isPartial={false}
            onClose={() => setActiveAction(null)}
            onSubmit={handlePaymentSubmit}
          />
        ) : activeAction === 'extend_date' ? (
          <ExtendDateForm
            debt={debt}
            onClose={() => setActiveAction(null)}
            onSubmit={handleExtendDateSubmit}
          />
        ) : activeAction === 'mark_settled' ? (
          <MarkSettledForm
            debt={debt}
            onClose={() => setActiveAction(null)}
            onConfirm={handleMarkSettledConfirm}
          />
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =====================================================
// Styles
// =====================================================
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
    flex: 1,
  },
  actionsListContent: {
    padding: 16,
    gap: 16,
  },
  summaryCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 6,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  summaryPerson: {
    fontSize: 15,
    fontWeight: '600',
  },
  paidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 16,
  },
  paidBannerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionsList: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  actionCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardContent: {
    flex: 1,
    gap: 4,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionCardSubtitle: {
    fontSize: 13,
  },
  pressedOpacity: {
    opacity: 0.8,
  },
  disabledCard: {
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
  // Form Styles
  formScrollContent: {
    flex: 1,
    padding: 16,
  },
  formContent: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  infoBanner: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoBannerText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  fieldContainer: {
    gap: 8,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  fieldHelper: {
    fontSize: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    gap: 8,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '600',
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  datePickerInline: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
  },
  datePickerDone: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerDoneText: {
    fontSize: 15,
    fontWeight: '600',
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  formActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 16,
  },
  extendDateContent: {
    gap: 16,
    paddingBottom: 32,
  },
  extendDateActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'center',
  },
  submitBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'center',
  },
  // Quick Options
  quickOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  quickOptionBtn: {
    width: '48%',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Mark Settled Styles
  settledContent: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    gap: 16,
  },
  settledIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  settledTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  settledDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  settledWarning: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  settledWarningText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
