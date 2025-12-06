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
import { FlashList as FlashListBase } from '@shopify/flash-list';
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import CounterpartyPicker from '@/components/shared/CounterpartyPicker';
import { formatNumberWithSpaces, parseSpacedNumber } from '@/utils/formatNumber';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import {
  AVAILABLE_FINANCE_CURRENCIES,
  type FinanceCurrency,
  useFinancePreferencesStore,
} from '@/stores/useFinancePreferencesStore';
import { useShallow } from 'zustand/react/shallow';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { FxService } from '@/services/fx/FxService';
import type { Counterparty, Account } from '@/domain/finance/types';

const FlashList = FlashListBase as any;

const ensureCurrency = (value?: string): FinanceCurrency => {
  if (!value) return 'USD';
  const upper = value.toUpperCase();
  return AVAILABLE_FINANCE_CURRENCIES.includes(upper as FinanceCurrency)
    ? (upper as FinanceCurrency)
    : 'USD';
};

const formatDate = (date?: Date | null) => {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
  } catch {
    return date.toDateString();
  }
};

type DebtType = 'borrowed' | 'lent';

const mapDirectionToDebtType = (direction: 'i_owe' | 'they_owe_me'): DebtType =>
  direction === 'they_owe_me' ? 'lent' : 'borrowed';

const mapDebtTypeToDirection = (type: DebtType): 'i_owe' | 'they_owe_me' =>
  type === 'lent' ? 'they_owe_me' : 'i_owe';

type RouteParams = {
  id?: string;
  goalId?: string;
};

export default function DebtModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const commonStrings = (strings as any).common ?? {};
  const debtStrings = (strings.financeScreens.debts.modal as any) ?? {};
  const closeLabel = commonStrings.close ?? 'Close';
  const { id, goalId } = useLocalSearchParams<RouteParams>();
  const editingId = Array.isArray(id) ? id[0] : id ?? null;
  const linkedGoalId = Array.isArray(goalId) ? goalId[0] : goalId ?? null;

  const baseCurrency = useFinancePreferencesStore((state) => state.baseCurrency);
  const goals = usePlannerDomainStore((state) => state.goals);

  const { debts, accounts, createDebt, updateDebt, deleteDebt } = useFinanceDomainStore(
    useShallow((state) => ({
      debts: state.debts,
      accounts: state.accounts,
      createDebt: state.createDebt,
      updateDebt: state.updateDebt,
      deleteDebt: state.deleteDebt,
    })),
  );

  const editingDebt = useMemo(() => debts.find((debt) => debt.id === editingId) ?? null, [debts, editingId]);

  const [debtType, setDebtType] = useState<DebtType>('borrowed');
  const [person, setPerson] = useState('');
  const [selectedCounterpartyId, setSelectedCounterpartyId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<FinanceCurrency>('USD');
  const [startDate, setStartDate] = useState(new Date());
  const [expectedReturnDate, setExpectedReturnDate] = useState<Date | null>(null);
  const [note, setNote] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(accounts[0]?.id ?? null);
  const [pickerState, setPickerState] = useState<{ target: 'start' | 'expected'; value: Date } | null>(null);

  // Multi-currency repayment
  const [useDifferentRepaymentCurrency, setUseDifferentRepaymentCurrency] = useState(false);
  const [repaymentCurrency, setRepaymentCurrency] = useState<FinanceCurrency>('USD');
  const [customRepaymentRate, setCustomRepaymentRate] = useState('');
  const [isFixedRepaymentAmount, setIsFixedRepaymentAmount] = useState(false);


  const handleCounterpartySelect = useCallback((counterparty: Counterparty | null) => {
    if (counterparty) {
      setPerson(counterparty.displayName);
      setSelectedCounterpartyId(counterparty.id);
    } else {
      setPerson('');
      setSelectedCounterpartyId(null);
    }
  }, []);

  useEffect(() => {
    if (!editingDebt) return;
    setDebtType(mapDirectionToDebtType(editingDebt.direction));
    setPerson(editingDebt.counterpartyName);
    setSelectedCounterpartyId(editingDebt.counterpartyId ?? null);
    const principalValue = editingDebt.principalOriginalAmount ?? editingDebt.principalAmount ?? 0;
    setAmount(formatNumberWithSpaces(principalValue));
    setCurrency(ensureCurrency(editingDebt.principalCurrency));
    setStartDate(new Date(editingDebt.startDate));
    setExpectedReturnDate(editingDebt.dueDate ? new Date(editingDebt.dueDate) : null);
    setNote(editingDebt.description ?? '');
    setReminderEnabled(Boolean(editingDebt.reminderEnabled));
    // Load account - use fundingAccountId or direction-specific account
    const accountId = editingDebt.direction === 'they_owe_me'
      ? (editingDebt.lentFromAccountId ?? editingDebt.fundingAccountId)
      : (editingDebt.receivedToAccountId ?? editingDebt.fundingAccountId);
    setSelectedAccountId(accountId ?? null);
    // Multi-currency repayment
    if (editingDebt.repaymentCurrency) {
      setUseDifferentRepaymentCurrency(true);
      setRepaymentCurrency(ensureCurrency(editingDebt.repaymentCurrency));
      if (editingDebt.repaymentRateOnStart) {
        setCustomRepaymentRate(String(editingDebt.repaymentRateOnStart));
      }
      setIsFixedRepaymentAmount(Boolean(editingDebt.isFixedRepaymentAmount));
    } else {
      setUseDifferentRepaymentCurrency(false);
    }
  }, [editingDebt]);

  // Account tanlanganda yoki o'zgarganda valyutani avtomatik o'rnatish
  useEffect(() => {
    if (!selectedAccountId && accounts[0]) {
      setSelectedAccountId(accounts[0].id);
      setCurrency(ensureCurrency(accounts[0].currency));
    } else if (selectedAccountId) {
      const account = accounts.find(a => a.id === selectedAccountId);
      if (account && !editingDebt) {
        setCurrency(ensureCurrency(account.currency));
      }
    }
  }, [accounts, selectedAccountId, editingDebt]);

  // Account tanlash handler
  const handleAccountSelect = useCallback((accountId: string) => {
    setSelectedAccountId(accountId);
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      setCurrency(ensureCurrency(account.currency));
    }
  }, [accounts]);

  const amountNumber = useMemo(() => {
    return parseSpacedNumber(amount);
  }, [amount]);

  const isSaveDisabled = !person.trim() || amountNumber <= 0;

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

  const applyDate = useCallback((target: 'start' | 'expected', date: Date) => {
    if (target === 'start') setStartDate(date);
    if (target === 'expected') setExpectedReturnDate(date);
  }, []);

  const openDatePicker = useCallback(
    (target: 'start' | 'expected') => {
      const current = target === 'start' ? startDate : expectedReturnDate ?? new Date();
      if (Platform.OS === 'android') {
        DateTimePickerAndroid.open({
          value: current,
          mode: 'date',
          onChange: (event, selected) => {
            if (event.type !== 'set' || !selected) return;
            applyDate(target, selected);
          },
        });
        return;
      }
      setPickerState({ target, value: current });
    },
    [applyDate, expectedReturnDate, startDate],
  );

  const handleIosPickerChange = useCallback(
    (event: DateTimePickerEvent, selected?: Date) => {
      if (!pickerState) return;
      if (event.type === 'dismissed') {
        setPickerState(null);
        return;
      }
      if (selected) {
        applyDate(pickerState.target, selected);
      }
    },
    [applyDate, pickerState],
  );

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleSubmit = useCallback(() => {
    if (isSaveDisabled) return;

    const direction = mapDebtTypeToDirection(debtType);

    // Calculate base currency rate (debt currency -> base currency) - always auto
    let rateOnStart = 1;
    if (currency !== baseCurrency) {
      // Get current FX rate from service
      rateOnStart = FxService.getInstance().getRate(currency, baseCurrency) ?? 1;
    }

    // Calculate repayment rate
    let repaymentRateOnStart: number | undefined;
    if (useDifferentRepaymentCurrency) {
      const customRate = parseFloat(customRepaymentRate.replace(/,/g, '.'));
      if (Number.isFinite(customRate) && customRate > 0) {
        repaymentRateOnStart = customRate;
      } else {
        // Get current FX rate
        repaymentRateOnStart = FxService.getInstance().getRate(currency, repaymentCurrency) ?? 1;
      }
    }

    // Account mapping based on direction (single account system)
    const accountFields = direction === 'they_owe_me'
      ? {
          // Lending: where money came from
          lentFromAccountId: selectedAccountId ?? undefined,
        }
      : {
          // Borrowing: where borrowed money went
          receivedToAccountId: selectedAccountId ?? undefined,
        };

    // Calculate principal base value using rate
    const principalBaseValue = amountNumber * rateOnStart;

    const payload = {
      userId: 'local-user',
      direction,
      counterpartyName: person.trim(),
      counterpartyId: selectedCounterpartyId ?? undefined,
      principalAmount: amountNumber,
      principalOriginalAmount: amountNumber,
      principalCurrency: currency,
      principalOriginalCurrency: currency,
      baseCurrency,
      rateOnStart,
      principalBaseValue,
      startDate: startDate.toISOString(),
      dueDate: expectedReturnDate ? expectedReturnDate.toISOString() : undefined,
      reminderEnabled,
      fundingAccountId: selectedAccountId ?? undefined,
      description: note.trim() || undefined,
      linkedGoalId: editingDebt?.linkedGoalId ?? linkedGoalId ?? undefined,
      // Account mapping
      ...accountFields,
      // Multi-currency repayment fields
      repaymentCurrency: useDifferentRepaymentCurrency ? repaymentCurrency : undefined,
      repaymentAmount: useDifferentRepaymentCurrency && repaymentRateOnStart
        ? amountNumber * repaymentRateOnStart
        : undefined,
      repaymentRateOnStart: useDifferentRepaymentCurrency ? repaymentRateOnStart : undefined,
      isFixedRepaymentAmount: useDifferentRepaymentCurrency ? isFixedRepaymentAmount : undefined,
    } satisfies Parameters<typeof createDebt>[0];

    // Debug: Log the payload to verify amount is being passed correctly
    console.log('[DebtModal] Creating/updating debt with payload:', {
      amountNumber,
      principalAmount: payload.principalAmount,
      principalOriginalAmount: payload.principalOriginalAmount,
      direction: payload.direction,
      person: payload.counterpartyName,
      fundingAccountId: payload.fundingAccountId,
    });

    if (editingDebt) {
      updateDebt(editingDebt.id, payload);
    } else {
      const created = createDebt(payload);
      console.log('[DebtModal] Debt created:', {
        id: created.id,
        principalAmount: created.principalAmount,
        principalOriginalAmount: created.principalOriginalAmount,
      });
    }

    handleClose();
  }, [
    amountNumber,
    baseCurrency,
    createDebt,
    currency,
    customRepaymentRate,
    debtType,
    editingDebt,
    expectedReturnDate,
    handleClose,
    isFixedRepaymentAmount,
    isSaveDisabled,
    linkedGoalId,
    note,
    person,
    reminderEnabled,
    repaymentCurrency,
    selectedAccountId,
    selectedCounterpartyId,
    startDate,
    updateDebt,
    useDifferentRepaymentCurrency,
  ]);

  const debtAlerts = debtStrings.alerts ?? { linkedTitle: 'Debt is linked', linkedSingle: 'This debt is linked to a goal. Unlink it before deleting.', linkedMultiple: 'This debt is linked to multiple goals. Unlink them before deleting.' };

  const handleDelete = useCallback(() => {
    if (!editingDebt) return;
    const linkedGoals = goals.filter((goal) => goal.linkedDebtId === editingDebt.id);
    if (linkedGoals.length > 0) {
      Alert.alert(
        debtAlerts.linkedTitle,
        linkedGoals.length === 1
          ? debtAlerts.linkedSingle
          : debtAlerts.linkedMultiple,
      );
      return;
    }
    deleteDebt(editingDebt.id);
    handleClose();
  }, [debtAlerts, deleteDebt, editingDebt, goals, handleClose]);

  return (
    <>
      <SafeAreaView edges={['bottom',"top"]} style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
            {editingDebt ? debtStrings.editTitle ?? 'Edit Debt' : debtStrings.title ?? 'Add Debt'}
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
              {debtStrings.typeLabel ?? 'Type'}
            </Text>
            <View style={styles.typeTabs}>
              <Pressable
                onPress={() => setDebtType('borrowed')}
                style={[
                  styles.typeTab,
                  debtType === 'borrowed' && styles.typeTabActive,
                ]}
              >
                <Text style={[
                  styles.typeTabLabel,
                  debtType === 'borrowed' && styles.typeTabLabelActive,
                ]}>
                  {debtStrings.borrowedLabel ?? 'I Owe'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setDebtType('lent')}
                style={[
                  styles.typeTab,
                  debtType === 'lent' && styles.typeTabActive,
                ]}
              >
                <Text style={[
                  styles.typeTabLabel,
                  debtType === 'lent' && styles.typeTabLabelActive,
                ]}>
                  {debtStrings.lentLabel ?? 'They Owe Me'}
                </Text>
              </Pressable>
            </View>
          </View>

            <View style={styles.section}>
              <CounterpartyPicker
                value={person}
                onSelect={handleCounterpartySelect}
                selectedCounterpartyId={selectedCounterpartyId}
                placeholder={debtStrings.personPlaceholder ?? 'Enter name...'}
                label={debtStrings.person ?? 'Name'}
              />
            </View>

            {/* Account tanlash - Amount dan oldin, chunki valyuta accountdan olinadi */}
            <View style={styles.sectionFullWidth}>
              <Text style={[styles.label, styles.labelWithPadding, { color: theme.colors.textSecondary }]}>
                {debtType === 'lent'
                  ? (debtStrings.lentFromAccount ?? 'Given from account')
                  : (debtStrings.receivedToAccount ?? 'Received to account')}
              </Text>
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
                      <Pressable onPress={() => handleAccountSelect(account.id)} style={({ pressed }) => [styles.accountChip, active && styles.accountChipActive, pressed && styles.pressed]}>
                        <Text style={[styles.accountChipLabel, { color: active ? '#0E0E0E' : '#FFFFFF' }]}>{account.name}</Text>
                        <Text style={[styles.accountChipSubtext, { color: active ? '#0E0E0E' : '#9E9E9E' }]}>{account.currency}</Text>
                      </Pressable>
                    );
                  }}
                  ListHeaderComponent={<View style={styles.listEdgeSpacer} />}
                  ItemSeparatorComponent={() => <View style={styles.horizontalSeparator} />}
                  ListFooterComponent={<View style={styles.listEdgeSpacer} />}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                {`${(strings.financeScreens.transactions.details.amount as string) ?? 'Amount'} (${currency})`}
              </Text>
              <AdaptiveGlassView style={[styles.glassSurface, styles.inputWrapper]}>
                <TextInput
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.textInput, { color: theme.colors.textPrimary }]}
                />
              </AdaptiveGlassView>
            </View>

            {/* Multi-currency repayment/collection */}
            <View style={styles.section}>
              <AdaptiveGlassView style={[styles.glassSurface, styles.reminderRow]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderLabel}>
                    {debtType === 'borrowed'
                      ? (debtStrings.differentCurrencyRepay ?? 'Repay in different currency')
                      : (debtStrings.differentCurrencyReceive ?? 'Receive in different currency')}
                  </Text>
                  <Text style={styles.reminderSubtext}>
                    {useDifferentRepaymentCurrency
                      ? (debtType === 'borrowed'
                          ? `${debtStrings.repayIn ?? 'Repay in'} ${repaymentCurrency}`
                          : `${debtStrings.receiveIn ?? 'Receive in'} ${repaymentCurrency}`)
                      : debtStrings.sameCurrency ?? 'Same currency'}
                  </Text>
                </View>
                <Switch value={useDifferentRepaymentCurrency} onValueChange={setUseDifferentRepaymentCurrency} />
              </AdaptiveGlassView>
            </View>

            {useDifferentRepaymentCurrency && (
              <>
                <View style={styles.sectionFullWidth}>
                  <Text style={[styles.label, styles.labelWithPadding, { color: theme.colors.textSecondary }]}>
                    {debtType === 'borrowed'
                      ? (debtStrings.repaymentCurrency ?? 'Repayment Currency')
                      : (debtStrings.receiveCurrency ?? 'Receive Currency')}
                  </Text>
                  <View style={styles.currencyListContainer}>
                    <FlashList
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      data={AVAILABLE_FINANCE_CURRENCIES.filter((c) => c !== currency)}
                      keyExtractor={(item: FinanceCurrency) => item}
                      estimatedItemSize={60}
                      renderItem={({ item: code }: { item: FinanceCurrency }) => {
                        const active = repaymentCurrency === code;
                        return (
                          <Pressable
                            onPress={() => setRepaymentCurrency(code)}
                            style={({ pressed }) => [
                              styles.currencyPill,
                              active && styles.currencyPillActive,
                              pressed && styles.pressed,
                            ]}
                          >
                            <Text style={[styles.currencyLabel, { color: active ? '#0E0E0E' : '#FFFFFF' }]}>{code}</Text>
                          </Pressable>
                        );
                      }}
                      ListHeaderComponent={<View style={styles.listEdgeSpacer} />}
                      ItemSeparatorComponent={() => <View style={styles.horizontalSeparator} />}
                      ListFooterComponent={<View style={styles.listEdgeSpacer} />}
                    />
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    {debtStrings.exchangeRate ?? 'Exchange Rate'} ({currency} → {repaymentCurrency})
                  </Text>
                  <AdaptiveGlassView style={[styles.glassSurface, styles.inputWrapper]}>
                    <TextInput
                      value={customRepaymentRate}
                      onChangeText={setCustomRepaymentRate}
                      keyboardType="numeric"
                      placeholder={debtStrings.autoRate ?? 'Auto (current rate)'}
                      placeholderTextColor={theme.colors.textMuted}
                      style={[styles.textInput, { color: theme.colors.textPrimary }]}
                    />
                  </AdaptiveGlassView>
                </View>

                <View style={styles.section}>
                  <AdaptiveGlassView style={[styles.glassSurface, styles.reminderRow]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reminderLabel}>
                        {debtType === 'borrowed'
                          ? (debtStrings.fixedAmount ?? 'Fixed repayment amount')
                          : (debtStrings.fixedReceiveAmount ?? 'Fixed receive amount')}
                      </Text>
                      <Text style={styles.reminderSubtext}>
                        {isFixedRepaymentAmount
                          ? debtStrings.fixedAmountEnabled ?? 'Amount locked at start rate'
                          : debtStrings.fixedAmountDisabled ?? 'Uses current exchange rate'}
                      </Text>
                    </View>
                    <Switch value={isFixedRepaymentAmount} onValueChange={setIsFixedRepaymentAmount} />
                  </AdaptiveGlassView>
                </View>
              </>
            )}

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{debtStrings.dateLabel ?? 'Date'}</Text>
              <View style={styles.dateRow}>
                <Pressable onPress={() => openDatePicker('start')} style={({ pressed }) => [styles.dateButton, pressed && styles.pressed]}>
                  <AdaptiveGlassView style={[styles.glassSurface, styles.dateChip]}>
                    <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
                  </AdaptiveGlassView>
                </Pressable>
                <Pressable onPress={() => openDatePicker('expected')} style={({ pressed }) => [styles.dateButton, pressed && styles.pressed]}>
                  <AdaptiveGlassView style={[styles.glassSurface, styles.dateChip]}>
                    <Text style={styles.dateValue}>{formatDate(expectedReturnDate)}</Text>
                  </AdaptiveGlassView>
                </Pressable>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{debtStrings.note ?? 'Note'}</Text>
              <AdaptiveGlassView style={[styles.glassSurface, styles.noteWrapper]}>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder={debtStrings.notePlaceholder ?? 'Note'}
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  style={[styles.noteInput, { color: theme.colors.textPrimary }]}
                />
              </AdaptiveGlassView>
            </View>

            <View style={styles.section}>
              <AdaptiveGlassView style={[styles.glassSurface, styles.reminderRow]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderLabel}>{debtStrings.reminderToggle ?? 'Reminder'}</Text>
                  <Text style={styles.reminderSubtext}>
                    {reminderEnabled
                      ? debtStrings.reminderEnabledLabel ?? 'Enabled'
                      : debtStrings.reminderDisabledLabel ?? 'Disabled'}
                  </Text>
                </View>
                <Switch value={reminderEnabled} onValueChange={setReminderEnabled} />
              </AdaptiveGlassView>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.footerButtons}>
          <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={handleClose}>
            <Text style={styles.secondaryButtonText}>{commonStrings.cancel ?? 'Cancel'}</Text>
          </Pressable>
          <Pressable
            disabled={isSaveDisabled}
            onPress={handleSubmit}
            style={({ pressed }) => [styles.primaryButton, pressed && !isSaveDisabled && styles.pressed]}
          >
            <AdaptiveGlassView style={[styles.glassSurface, styles.primaryButtonInner, { opacity: isSaveDisabled ? 0.4 : 1 }]}>
              <Text style={[styles.primaryButtonText, { color: isSaveDisabled ? '#7E8B9A' : '#FFFFFF' }]}>
                {editingDebt ? debtStrings.buttons?.saveChanges ?? 'Save' : debtStrings.buttons?.add ?? 'Add'}
              </Text>
            </AdaptiveGlassView>
          </Pressable>
        </View>

        {editingDebt && (
          <View style={[styles.deleteContainer, { paddingBottom: insets.bottom + 8 }]}>
            <Pressable onPress={handleDelete} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
              <Text style={styles.deleteButtonText}>{(strings.financeScreens.accounts.actions.delete as string) ?? 'Delete'}</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>

      {Platform.OS === 'ios' && pickerState && (
        <Modal transparent visible animationType="fade" onRequestClose={() => setPickerState(null)}>
          <View style={styles.pickerModal}>
            <Pressable style={styles.pickerBackdrop} onPress={() => setPickerState(null)} />
            <AdaptiveGlassView style={[styles.glassSurface, styles.pickerCard,{ backgroundColor: theme.colors.card }]}>
              <DateTimePicker
                value={pickerState.value}
                mode="date"
                display="inline"
                onChange={handleIosPickerChange}
              />
              <Pressable onPress={() => setPickerState(null)} style={styles.pickerDoneButton}>
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
    width: 10,
  },
  currencyListContainer: {
    height: 44,
  },
  accountListContainer: {
    height: 60,
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
  typeTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 4,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  typeTabActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  typeTabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7E8B9A',
  },
  typeTabLabelActive: {
    color: '#FFFFFF',
  },
  inputWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  textInput: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rateHint: {
    fontSize: 12,
    marginTop: 4,
  },
  currencyPill: {
    paddingHorizontal: 14,
    height: 40,
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  currencyPillActive: {
    backgroundColor: '#FFFFFF',
  },
  currencyLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
  },
  dateChip: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  accountChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    height: 56,
    justifyContent: 'center',
    minWidth: 140,
  },
  accountChipActive: {
    backgroundColor: '#FFFFFF',
  },
  accountChipLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  accountChipSubtext: {
    fontSize: 12,
  },
  noteWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 120,
  },
  noteInput: {
    fontSize: 15,
    fontWeight: '500',
    minHeight: 100,
    textAlignVertical: 'top',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  reminderRow: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reminderLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reminderSubtext: {
    fontSize: 12,
    color: '#7E8B9A',
  },
  footerButtons: {
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
    paddingBottom: 12,
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
