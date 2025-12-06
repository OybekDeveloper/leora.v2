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
import { ArrowRightLeft } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import AccountPicker from '@/components/shared/AccountPicker';
import { useAppTheme } from '@/constants/theme';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useFinancePreferencesStore } from '@/stores/useFinancePreferencesStore';
import { normalizeFinanceCurrency } from '@/utils/financeCurrency';
import { useShallow } from 'zustand/react/shallow';
import { useLocalization } from '@/localization/useLocalization';
import { formatNumberWithSpaces, parseSpacedNumber } from '@/utils/formatNumber';

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

// Exchange rate ni to'liq aniqlikda formatlash
// Katta sonlar uchun 2-4 raqam, kichik sonlar uchun barcha significant digits
const formatExchangeRate = (rate: number): string => {
  if (rate >= 1) {
    // Katta sonlar uchun 4 ta decimal
    return rate.toFixed(4).replace(/\.?0+$/, '') || '0';
  }
  // Kichik sonlar uchun - barcha significant digits ko'rsatish
  // Masalan: 0.0000802 -> "0.0000802"
  const str = rate.toPrecision(6);
  // Scientific notation ni oddiy ko'rinishga o'zgartirish
  const num = parseFloat(str);
  // Kerakli aniqlikni hisoblash - birinchi nol bo'lmagan raqamgacha + 4 ta raqam
  const log = Math.floor(Math.log10(Math.abs(rate)));
  const decimals = Math.max(4, -log + 3);
  return num.toFixed(Math.min(decimals, 10));
};

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

  const [fromAccountId, setFromAccountId] = useState<string | null>(accounts[0]?.id ?? null);
  const [toAccountId, setToAccountId] = useState<string | null>(accounts[1]?.id ?? null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [transferDate, setTransferDate] = useState(new Date());
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [customExchangeRate, setCustomExchangeRate] = useState('');

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
    setAmount(formatNumberWithSpaces(editingTransaction.amount));
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

  const amountNumber = useMemo(() => parseSpacedNumber(amount), [amount]);

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

  // Exchange rate: 1 FROM currency = X TO currency
  // Masalan: 1 USD = 12500 UZS yoki 1 UZS = 0.00008 USD
  const autoExchangeRate = useMemo(() => {
    if (!needsConversion || !normalizedFromCurrency || !normalizedToCurrency) {
      return 1;
    }
    // FROM dan TO ga konvertatsiya qilish uchun rate
    // Masalan: USD dan UZS ga - 1 USD = 12500 UZS
    const ratio = convertAmount(1, normalizedFromCurrency, normalizedToCurrency);
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

  // Konvertatsiya: FROM amount * rate = TO amount
  // Masalan: 100 USD * 12500 = 1,250,000 UZS
  const convertedAmount = useMemo(() => {
    if (!needsConversion) {
      return amountNumber;
    }
    if (!currentExchangeRate || currentExchangeRate <= 0) {
      return 0;
    }
    return amountNumber * currentExchangeRate;
  }, [needsConversion, amountNumber, currentExchangeRate]);

  useEffect(() => {
    if (!needsConversion) {
      setCustomExchangeRate('');
    }
  }, [needsConversion]);

  const isSaveDisabled =
    !fromAccount || !toAccount || fromAccount.id === toAccount.id || amountNumber <= 0;

  const handleAmountChange = useCallback((value: string) => {
    // Faqat raqam va nuqta qabul qilish
    const cleaned = value.replace(/[^\d.]/g, '');
    // Bir nechta nuqtani oldini olish
    const parts = cleaned.split('.');
    const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
    const num = parseFloat(sanitized) || 0;
    setAmount(num > 0 ? formatNumberWithSpaces(num) : sanitized);
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

  const handleFromAccountSelect = useCallback((account: typeof accounts[0] | null) => {
    setFromAccountId(account?.id ?? null);
  }, []);

  const handleToAccountSelect = useCallback((account: typeof accounts[0] | null) => {
    setToAccountId(account?.id ?? null);
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
      // Rate info: 1 FROM = X TO
      // Masalan: 1 USD = 12500 UZS
      const rateInfoTemplate = transferStrings.rateInfoTemplate as string | undefined;
      const formattedRate = formatExchangeRate(currentExchangeRate);
      const rateInfo = rateInfoTemplate
        ? rateInfoTemplate
            .replace('{fromCurrency}', fromAccount.currency)
            .replace('{rate}', formattedRate)
            .replace('{toCurrency}', toAccount.currency)
            .replace('{amount}', formatDisplayCurrency(recipientAmount, toAccount.currency))
        : `Exchange rate: 1 ${fromAccount.currency} = ${formattedRate} ${toAccount.currency}. Received: ${formatDisplayCurrency(recipientAmount, toAccount.currency)}`;
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
            <View style={[styles.section, { zIndex: 9999 }]}>
              <AccountPicker
                selectedAccountId={fromAccountId}
                onSelect={handleFromAccountSelect}
                label={transferStrings.fromAccount ?? 'From account'}
                placeholder={transferStrings.selectAccount ?? 'Select account...'}
                excludeAccountId={toAccountId ?? undefined}
              />
            </View>

            <View style={styles.swapContainer}>
              <Pressable onPress={handleSwapAccounts} style={({ pressed }) => [styles.swapButton, pressed && styles.pressed]}>
                <AdaptiveGlassView style={[styles.swapButtonInner, { backgroundColor: theme.colors.card }]}>
                  <ArrowRightLeft size={20} color={theme.colors.textPrimary} />
                </AdaptiveGlassView>
              </Pressable>
            </View>

            <View style={[styles.section, { zIndex: 8888 }]}>
              <AccountPicker
                selectedAccountId={toAccountId}
                onSelect={handleToAccountSelect}
                label={transferStrings.toAccount ?? 'To account'}
                placeholder={transferStrings.selectAccount ?? 'Select account...'}
                excludeAccountId={fromAccountId ?? undefined}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                {detailStrings.amount ?? 'Amount'}
              </Text>
              <AdaptiveGlassView style={styles.inputWrapper}>
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
              <View style={[styles.section, { zIndex: 1 }]}>
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
                <AdaptiveGlassView style={[styles.exchangeRateContainer, { backgroundColor: theme.colors.card }]}>
                  <View style={styles.exchangeRateRow}>
                    <Text style={[styles.exchangeRateLabel, { color: theme.colors.textPrimary }]}>1 {fromAccount.currency} =</Text>
                    <TextInput
                      value={customExchangeRate || formatExchangeRate(autoExchangeRate)}
                      onChangeText={handleExchangeRateChange}
                      placeholder={formatExchangeRate(autoExchangeRate)}
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="numeric"
                      style={[styles.exchangeRateInput, { color: theme.colors.textPrimary }]}
                    />
                    <Text style={[styles.exchangeRateLabel, { color: theme.colors.textPrimary }]}>{toAccount.currency}</Text>
                  </View>

                  {amountNumber > 0 && (
                    <View style={styles.conversionInfo}>
                      <Ionicons name="arrow-forward" size={16} color={theme.colors.textMuted} />
                      <Text style={[styles.conversionText, { color: theme.colors.textSecondary }]}>
                        {formatDisplayCurrency(amountNumber, fromAccount.currency)} → {formatDisplayCurrency(convertedAmount, toAccount.currency)}
                      </Text>
                    </View>
                  )}

                  {customExchangeRate && (
                    <Pressable onPress={() => setCustomExchangeRate('')} style={styles.resetRateButton}>
                      <Text style={[styles.resetRateText, { color: theme.colors.textMuted }]}>
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
              <AdaptiveGlassView style={styles.noteWrapper}>
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
  inputWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  textInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  noteWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 90,
  },
  noteInput: {
    fontSize: 15,
    fontWeight: '500',
    textAlignVertical: 'top',
    color: '#FFFFFF',
    minHeight: 70,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  glassSurface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
});
