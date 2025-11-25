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
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { ArrowRightLeft, Wallet } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useFinancePreferencesStore } from '@/stores/useFinancePreferencesStore';
import { normalizeFinanceCurrency } from '@/utils/financeCurrency';
import { useShallow } from 'zustand/react/shallow';
import { useLocalization } from '@/localization/useLocalization';

const formatDisplayCurrency = (value: number, currency: string = 'USD') => {
  try {
    return new Intl.NumberFormat(currency === 'UZS' ? 'uz-UZ' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'UZS' ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};

type AccountPickerContext = 'from' | 'to' | null;

type LocalParams = {
  id?: string;
  goalId?: string;
};

export default function TransferModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const financeStrings = (strings as any).financeScreens ?? {};
  const transactionsStrings = financeStrings.transactions ?? {};
  const transferStrings = transactionsStrings.transferForm ?? {};
  const detailStrings = transactionsStrings.details ?? {};
  const commonStrings = (strings as any).common ?? {};
  const { id, goalId } = useLocalSearchParams<LocalParams>();
  const editingId = Array.isArray(id) ? id[0] : id ?? null;
  const linkedGoalId = Array.isArray(goalId) ? goalId[0] : goalId ?? null;

  const { accounts, transactions, createTransaction, updateTransaction } = useFinanceDomainStore(
    useShallow((state) => ({
      accounts: state.accounts,
      transactions: state.transactions,
      createTransaction: state.createTransaction,
      updateTransaction: state.updateTransaction,
    })),
  );

  const { baseCurrency, convertAmount } = useFinancePreferencesStore(
    useShallow((state) => ({
      baseCurrency: state.baseCurrency,
      convertAmount: state.convertAmount,
      formatCurrency: state.formatCurrency,
    })),
  );

  const editingTransaction = useMemo(
    () => transactions.find((txn) => txn.id === editingId) ?? null,
    [transactions, editingId],
  );

  const [accountPickerContext, setAccountPickerContext] = useState<AccountPickerContext>(null);
  const [fromAccountId, setFromAccountId] = useState<string | null>(accounts[0]?.id ?? null);
  const [toAccountId, setToAccountId] = useState<string | null>(accounts[1]?.id ?? null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [transferDate, setTransferDate] = useState(new Date());
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [customExchangeRate, setCustomExchangeRate] = useState('');
  const [accountModalVisible, setAccountModalVisible] = useState(false);

  const fromAccount = useMemo(
    () => accounts.find((account) => account.id === fromAccountId) ?? accounts[0] ?? null,
    [accounts, fromAccountId],
  );

  const toAccount = useMemo(
    () => accounts.find((account) => account.id === toAccountId) ?? accounts[1] ?? null,
    [accounts, toAccountId],
  );

  useEffect(() => {
    if (!editingTransaction) {
      return;
    }
    if (editingTransaction.type !== 'transfer') {
      return;
    }

    setFromAccountId(editingTransaction.accountId ?? editingTransaction.fromAccountId ?? accounts[0]?.id ?? null);
    setToAccountId(editingTransaction.toAccountId ?? accounts[1]?.id ?? null);
    setAmount(editingTransaction.amount.toString());
    setTransferDate(new Date(editingTransaction.date));

    const noteText = editingTransaction.description ?? '';
    const rateRegex = /Exchange rate: 1 [A-Z]+ = ([\d.]+) [A-Z]+\.?\s?(.*)$/i;
    const match = noteText.match(rateRegex);
    if (match) {
      setCustomExchangeRate(match[1]);
      setNote(match[2]?.replace(/^Received: [^.]+\.\s?/, '').trim() ?? '');
    } else {
      setNote(noteText);
    }
  }, [accounts, editingTransaction]);

  useEffect(() => {
    if (accounts.length && !fromAccountId) {
      setFromAccountId(accounts[0].id);
    }
    if (accounts.length > 1 && !toAccountId) {
      setToAccountId(accounts[1].id);
    }
  }, [accounts, fromAccountId, toAccountId]);

  const amountNumber = useMemo(() => {
    const parsed = parseFloat(amount.replace(/,/g, '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amount]);

  const needsConversion = useMemo(() => {
    if (!fromAccount || !toAccount) return false;
    return fromAccount.currency !== toAccount.currency;
  }, [fromAccount, toAccount]);

  const normalizedFromCurrency = useMemo(
    () => (fromAccount ? normalizeFinanceCurrency(fromAccount.currency) : null),
    [fromAccount],
  );

  const normalizedToCurrency = useMemo(
    () => (toAccount ? normalizeFinanceCurrency(toAccount.currency) : null),
    [toAccount],
  );

  const autoExchangeRate = useMemo(() => {
    if (!needsConversion || !normalizedFromCurrency || !normalizedToCurrency) {
      return 1;
    }
    const ratio = convertAmount(1, normalizedToCurrency, normalizedFromCurrency);
    if (!Number.isFinite(ratio) || ratio <= 0) {
      return 1;
    }
    return ratio;
  }, [convertAmount, needsConversion, normalizedFromCurrency, normalizedToCurrency]);

  const currentExchangeRate = useMemo(() => {
    if (!needsConversion) return 1;
    const customRate = parseFloat(customExchangeRate.replace(/,/g, '.'));
    if (customExchangeRate && Number.isFinite(customRate) && customRate > 0) {
      return customRate;
    }
    return autoExchangeRate;
  }, [needsConversion, customExchangeRate, autoExchangeRate]);

  const convertedAmount = useMemo(() => {
    if (!needsConversion) {
      return amountNumber;
    }
    if (!currentExchangeRate || currentExchangeRate <= 0) {
      return 0;
    }
    return amountNumber / currentExchangeRate;
  }, [needsConversion, amountNumber, currentExchangeRate]);

  useEffect(() => {
    if (!needsConversion) {
      setCustomExchangeRate('');
    }
  }, [needsConversion]);

  const isSaveDisabled =
    !fromAccount || !toAccount || fromAccount.id === toAccount.id || amountNumber <= 0;

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

  const handleExchangeRateChange = useCallback((value: string) => {
    const sanitized = value.replace(/[^0-9.,]/g, '').replace(/,/g, '.');
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      const [integer, fraction] = parts;
      setCustomExchangeRate(`${integer}.${fraction}`);
      return;
    }
    setCustomExchangeRate(sanitized);
  }, []);

  const applyDateTimePart = useCallback((mode: 'date' | 'time', value: Date) => {
    setTransferDate((prev) => {
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
      const baseValue = new Date(transferDate);
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
    [applyDateTimePart, transferDate],
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

  const pickerValue = useMemo(() => new Date(transferDate), [transferDate]);

  const dateLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(transferDate);
    } catch {
      return transferDate.toLocaleDateString();
    }
  }, [transferDate]);

  const timeLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(transferDate);
    } catch {
      return transferDate.toLocaleTimeString();
    }
  }, [transferDate]);

  const handleSelectAccount = useCallback(
    (accountId: string) => {
      if (accountPickerContext === 'from') {
        setFromAccountId(accountId);
      } else if (accountPickerContext === 'to') {
        setToAccountId(accountId);
      }
      setAccountModalVisible(false);
      setAccountPickerContext(null);
    },
    [accountPickerContext],
  );

  const handleOpenAccountPicker = useCallback((context: AccountPickerContext) => {
    setAccountPickerContext(context);
    setAccountModalVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleSubmit = useCallback(() => {
    if (isSaveDisabled || !fromAccount || !toAccount) {
      return;
    }

    const normalizedBaseCurrency = normalizeFinanceCurrency(baseCurrency);
    const normalizedFrom = normalizeFinanceCurrency(fromAccount.currency);
    const rateToBase = normalizedFrom === normalizedBaseCurrency ? 1 : convertAmount(1, normalizedFrom, normalizedBaseCurrency);
    const convertedAmountToBase = amountNumber * rateToBase;
    const recipientAmount = needsConversion ? convertedAmount : amountNumber;
    const effectiveRateFromTo = needsConversion ? currentExchangeRate : 1;

    let finalNote = note.trim();
    if (needsConversion && amountNumber > 0) {
      const rateInfoTemplate = transferStrings.rateInfoTemplate as string | undefined;
      const rateInfo = rateInfoTemplate
        ? rateInfoTemplate
            .replace('{toCurrency}', toAccount.currency)
            .replace('{rate}', currentExchangeRate.toFixed(4))
            .replace('{fromCurrency}', fromAccount.currency)
            .replace('{amount}', formatDisplayCurrency(recipientAmount, toAccount.currency))
        : `Exchange rate: 1 ${toAccount.currency} = ${currentExchangeRate.toFixed(4)} ${fromAccount.currency}. Received: ${formatDisplayCurrency(recipientAmount, toAccount.currency)}`;
      finalNote = finalNote ? `${rateInfo}. ${finalNote}` : rateInfo;
    }

    const payload = {
      userId: 'local-user',
      type: 'transfer' as const,
      amount: amountNumber,
      accountId: fromAccount.id,
      fromAccountId: fromAccount.id,
      toAccountId: toAccount.id,
      currency: fromAccount.currency,
      toCurrency: toAccount.currency,
      toAmount: recipientAmount,
      goalId: editingTransaction?.goalId ?? linkedGoalId ?? undefined,
      baseCurrency: normalizedBaseCurrency,
      rateUsedToBase: rateToBase,
      convertedAmountToBase,
      effectiveRateFromTo,
      description: finalNote.length ? finalNote : undefined,
      date: transferDate.toISOString(),
    } satisfies Parameters<typeof createTransaction>[0];

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, payload);
    } else {
      createTransaction(payload);
    }

    handleClose();
  }, [
    amountNumber,
    baseCurrency,
    convertAmount,
    convertedAmount,
    currentExchangeRate,
    editingTransaction,
    fromAccount,
    handleClose,
    createTransaction,
    needsConversion,
    note,
    toAccount,
    transferDate,
    updateTransaction,
    isSaveDisabled,
  ]);

  const handleSwapAccounts = useCallback(() => {
    setFromAccountId(toAccountId);
    setToAccountId(fromAccountId);
  }, [fromAccountId, toAccountId]);

  const accountModalTitle =
    accountPickerContext === 'from'
      ? transferStrings.fromAccount ?? 'From account'
      : transferStrings.toAccount ?? 'To account';

  return (
    <>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['bottom', "top"]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
            {transferStrings.title ?? 'Transfer between accounts'}
          </Text>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>
              {commonStrings.close ?? 'Close'}
            </Text>
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
                {transferStrings.fromAccount ?? 'From account'}
              </Text>
              <Pressable onPress={() => handleOpenAccountPicker('from')} style={({ pressed }) => [pressed && styles.pressed]}>
                <AdaptiveGlassView style={styles.accountCard}>
                  <View style={styles.accountInfo}>
                    <View style={styles.accountNameRow}>
                      <Text style={styles.accountName}>
                        {fromAccount?.name ?? transferStrings.selectAccount ?? 'Select account'}
                      </Text>
                      {fromAccount && (
                        <View style={styles.currencyBadge}>
                          <Text style={styles.currencyBadgeText}>{fromAccount.currency}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.accountBalance}>
                      {fromAccount ? formatDisplayCurrency(fromAccount.currentBalance, fromAccount.currency) : '—'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#7E8B9A" />
                </AdaptiveGlassView>
              </Pressable>
            </View>

            <View style={styles.swapContainer}>
              <Pressable onPress={handleSwapAccounts} style={({ pressed }) => [styles.swapButton, pressed && styles.pressed]}>
                <AdaptiveGlassView style={styles.swapButtonInner}>
                  <ArrowRightLeft size={20} color="#FFFFFF" />
                </AdaptiveGlassView>
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                {transferStrings.toAccount ?? 'To account'}
              </Text>
              <Pressable onPress={() => handleOpenAccountPicker('to')} style={({ pressed }) => [pressed && styles.pressed]}>
                <AdaptiveGlassView style={styles.accountCard}>
                  <View style={styles.accountInfo}>
                    <View style={styles.accountNameRow}>
                      <Text style={styles.accountName}>
                        {toAccount?.name ?? transferStrings.selectAccount ?? 'Select account'}
                      </Text>
                      {toAccount && (
                        <View style={styles.currencyBadge}>
                          <Text style={styles.currencyBadgeText}>{toAccount.currency}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.accountBalance}>
                      {toAccount ? formatDisplayCurrency(toAccount.currentBalance, toAccount.currency) : '—'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#7E8B9A" />
                </AdaptiveGlassView>
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                {detailStrings.amount ?? 'Amount'}
              </Text>
              <AdaptiveGlassView style={styles.inputContainer}>
                <TextInput
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder={transferStrings.amountPlaceholder ?? detailStrings.amount ?? 'Amount'}
                  placeholderTextColor="#7E8B9A"
                  keyboardType="numeric"
                  style={styles.textInput}
                />
              </AdaptiveGlassView>
            </View>

            {needsConversion && fromAccount && toAccount && (
              <View style={styles.section}>
                <View style={styles.exchangeRateLabelRow}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    {transferStrings.exchangeRate ?? 'Exchange rate'}
                  </Text>
                  {!customExchangeRate && (
                    <View style={styles.autoBadge}>
                      <Text style={styles.autoBadgeText}>{transferStrings.auto ?? 'Auto'}</Text>
                    </View>
                  )}
                </View>
                <AdaptiveGlassView style={styles.exchangeRateContainer}>
                  <View style={styles.exchangeRateRow}>
                    <Text style={styles.exchangeRateLabel}>1 {toAccount.currency} =</Text>
                    <TextInput
                      value={customExchangeRate || autoExchangeRate.toFixed(4)}
                      onChangeText={handleExchangeRateChange}
                      placeholder={autoExchangeRate.toFixed(4)}
                      placeholderTextColor="#7E8B9A"
                      keyboardType="numeric"
                      style={styles.exchangeRateInput}
                    />
                    <Text style={styles.exchangeRateLabel}>{fromAccount.currency}</Text>
                  </View>

                  {amountNumber > 0 && (
                    <View style={styles.conversionInfo}>
                      <Ionicons name="arrow-forward" size={16} color="#7E8B9A" />
                      <Text style={styles.conversionText}>
                        {transferStrings.conversionInfo
                          ? (transferStrings.conversionInfo as string).replace(
                              '{amount}',
                              formatDisplayCurrency(convertedAmount, toAccount.currency),
                            )
                          : `${formatDisplayCurrency(convertedAmount, toAccount.currency)} will be received`}
                      </Text>
                    </View>
                  )}

                  {customExchangeRate && (
                    <Pressable onPress={() => setCustomExchangeRate('')} style={styles.resetRateButton}>
                      <Text style={styles.resetRateText}>
                        {transferStrings.resetRate ?? 'Reset to auto rate'}
                      </Text>
                    </Pressable>
                  )}
                </AdaptiveGlassView>
              </View>
            )}

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                {transferStrings.date ?? detailStrings.date ?? 'Date'}
              </Text>
              <View style={styles.dateTimeRow}>
                <Pressable onPress={() => openDateTimePicker('date')} style={({ pressed }) => [styles.dateTimeButton, pressed && styles.pressed]}>
                  <AdaptiveGlassView style={styles.dateTimeChip}>
                    <Ionicons name="calendar-outline" size={18} color="#7E8B9A" />
                    <Text style={styles.dateTimeText}>{dateLabel}</Text>
                  </AdaptiveGlassView>
                </Pressable>
                <Pressable onPress={() => openDateTimePicker('time')} style={({ pressed }) => [styles.dateTimeButton, pressed && styles.pressed]}>
                  <AdaptiveGlassView style={styles.dateTimeChip}>
                    <Ionicons name="time-outline" size={18} color="#7E8B9A" />
                    <Text style={styles.dateTimeText}>{timeLabel}</Text>
                  </AdaptiveGlassView>
                </Pressable>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                {detailStrings.note ?? 'Note'}
              </Text>
              <AdaptiveGlassView style={styles.noteContainer}>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder={
                    transferStrings.notePlaceholder ??
                    financeStrings.debts?.modal?.notePlaceholder ??
                    'Add optional description or context…'
                  }
                  placeholderTextColor="#7E8B9A"
                  multiline
                  style={styles.noteInput}
                />
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
            <AdaptiveGlassView style={[styles.primaryButtonInner, { opacity: isSaveDisabled ? 0.4 : 1 }]}>
              <Text style={[styles.primaryButtonText, { color: isSaveDisabled ? '#7E8B9A' : '#FFFFFF' }]}>
                {transferStrings.submit ?? transferStrings.title ?? 'Transfer'}
              </Text>
            </AdaptiveGlassView>
          </Pressable>
        </View>
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
        visible={accountModalVisible}
        onRequestClose={() => {
          setAccountModalVisible(false);
          setAccountPickerContext(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              setAccountModalVisible(false);
              setAccountPickerContext(null);
            }}
          />
          <AdaptiveGlassView style={[styles.glassSurface, styles.accountModalCard,{backgroundColor:theme.colors.card}]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>{accountModalTitle}</Text>
              <Pressable
                onPress={() => {
                  setAccountModalVisible(false);
                  setAccountPickerContext(null);
                }}
                hitSlop={10}
              >
                <Ionicons name="close" size={22} color="#7E8B9A" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.accountList}>
              {accounts.map((account) => {
                const selected =
                  accountPickerContext === 'from'
                    ? account.id === fromAccount?.id
                    : account.id === toAccount?.id;
                return (
                  <Pressable
                    key={account.id}
                    onPress={() => handleSelectAccount(account.id)}
                    style={({ pressed }) => [styles.accountRowItem, pressed && styles.pressed]}
                  >
                    <AdaptiveGlassView
                      style={[styles.glassSurface, styles.accountCardRow, { opacity: selected ? 1 : 0.7 }]}
                    >
                      <View style={styles.accountPickerIcon}>
                        <Wallet size={18} color="#7E8B9A" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.accountName}>{account.name}</Text>
                        <Text style={styles.accountBalance}>
                          {formatDisplayCurrency(account.currentBalance, account.currency)}
                        </Text>
                      </View>
                      {selected && <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />}
                    </AdaptiveGlassView>
                  </Pressable>
                );
              })}
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
    gap: 20,
  },
  section: {
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  accountCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  currencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  currencyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  accountBalance: {
    fontSize: 13,
    fontWeight: '400',
    color: '#7E8B9A',
    marginTop: 4,
  },
  swapContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  swapButton: {
    borderRadius: 16,
  },
  swapButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  exchangeRateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  autoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(126,139,154,0.2)',
  },
  autoBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7E8B9A',
  },
  exchangeRateContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  exchangeRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exchangeRateLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  exchangeRateInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingVertical: 6,
  },
  conversionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  conversionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7E8B9A',
  },
  resetRateButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  resetRateText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7E8B9A',
    textDecorationLine: 'underline',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    borderRadius: 16,
  },
  dateTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
  },
  dateTimeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noteContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 90,
  },
  noteInput: {
    fontSize: 15,
    fontWeight: '500',
    textAlignVertical: 'top',
    color: '#FFFFFF',
    minHeight: 70,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  accountModalCard: {
    borderRadius: 20,
    padding: 16,
    maxHeight: '70%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  accountList: {
    paddingVertical: 8,
    gap: 10,
  },
  accountRowItem: {
    borderRadius: 16,
  },
  accountCardRow: {
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountPickerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  glassSurface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
});
