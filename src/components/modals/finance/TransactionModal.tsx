import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { ArrowRightLeft, Wallet } from 'lucide-react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import CustomModal, { CustomModalProps } from '@/components/modals/CustomModal';
import { BottomSheetHandle } from '@/components/modals/BottomSheet';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useModalStore } from '@/stores/useModalStore';
import { useFinancePreferencesStore } from '@/stores/useFinancePreferencesStore';
import { useTranslation } from '../../../utils/localization';
import type { Transaction as LegacyTransaction } from '@/types/store.types';
import { useShallow } from 'zustand/react/shallow';
import { normalizeFinanceCurrency } from '@/utils/financeCurrency';

type AccountPickerContext = 'from' | 'to';

const modalProps: Partial<CustomModalProps> = {
  variant: 'form',
  enableDynamicSizing: false,
  fallbackSnapPoint: '96%',
  scrollable: true,
  scrollProps: { keyboardShouldPersistTaps: 'handled' },
  contentContainerStyle: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
};

type TransactionModalProps = {
  onRequestClose?: () => void;
};

export default function TransactionModal({ onRequestClose }: TransactionModalProps) {
  const modalRef = useRef<BottomSheetHandle>(null);
  const accountPickerRef = useRef<BottomSheetHandle>(null);

  const { t } = useTranslation();

  const transferModal = useModalStore((state) => state.transferModal);
  const closeTransferModal = useModalStore((state) => state.closeTransferModal);

  const { accounts, createTransaction, updateTransaction } = useFinanceDomainStore(
    useShallow((state) => ({
      accounts: state.accounts,
      createTransaction: state.createTransaction,
      updateTransaction: state.updateTransaction,
    })),
  );

  const { baseCurrency, convertAmount, formatCurrency: formatCurrencyFormatter } =
    useFinancePreferencesStore(
      useShallow((state) => ({
        baseCurrency: state.baseCurrency,
        convertAmount: state.convertAmount,
        formatCurrency: state.formatCurrency,
      })),
    );

  const [accountPickerContext, setAccountPickerContext] = useState<AccountPickerContext | null>(
    null
  );
  const [fromAccountId, setFromAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [transferDate, setTransferDate] = useState(new Date());
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [customExchangeRate, setCustomExchangeRate] = useState('');

  const isEditing = Boolean(
    transferModal.mode === 'edit' && transferModal.transaction?.type === 'transfer'
  );
  const editingTransaction = transferModal.transaction as LegacyTransaction | undefined;

  useEffect(() => {
    if (transferModal.isOpen) {
      modalRef.current?.present();
    } else {
      modalRef.current?.dismiss();
    }
  }, [transferModal.isOpen]);

  const resetForm = useCallback(() => {
    setFromAccountId(accounts[0]?.id ?? null);
    setToAccountId(accounts[1]?.id ?? null);
    setAmount('');
    setNote('');
    setTransferDate(new Date());
    setPickerMode(null);
    setCustomExchangeRate('');
  }, [accounts]);

  const formatCurrency = useCallback(
    (value: number, currency: string = 'USD') => {
      const normalized = normalizeFinanceCurrency(currency);
      return formatCurrencyFormatter(value, { fromCurrency: normalized, convert: false });
    },
    [formatCurrencyFormatter],
  );

  const fromAccount = useMemo(
    () => accounts.find((account: any) => account.id === fromAccountId) ?? accounts[0],
    [accounts, fromAccountId]
  );

  const toAccount = useMemo(
    () => accounts.find((account: any) => account.id === toAccountId) ?? accounts[1],
    [accounts, toAccountId]
  );

  const normalizedFromCurrency = useMemo(
    () => (fromAccount ? normalizeFinanceCurrency(fromAccount.currency) : null),
    [fromAccount],
  );

  const normalizedToCurrency = useMemo(
    () => (toAccount ? normalizeFinanceCurrency(toAccount.currency) : null),
    [toAccount],
  );

  const amountNumber = useMemo(() => {
    const parsed = parseFloat(amount.replace(/,/g, '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amount]);

  const isSaveDisabled =
    !fromAccount || !toAccount || fromAccount.id === toAccount.id || amountNumber <= 0;

  // Проверка нужна ли конвертация
  const needsConversion = useMemo(() => {
    if (!fromAccount || !toAccount) return false;
    return fromAccount.currency !== toAccount.currency;
  }, [fromAccount, toAccount]);

  // Получение автоматического курса обмена
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

  // Текущий курс (кастомный или автоматический)
  const currentExchangeRate = useMemo(() => {
    if (!needsConversion) return 1;
    
    const customRate = parseFloat(customExchangeRate.replace(/,/g, '.'));
    if (customExchangeRate && Number.isFinite(customRate) && customRate > 0) {
      return customRate;
    }
    
    return autoExchangeRate;
  }, [needsConversion, customExchangeRate, autoExchangeRate]);

  // Конвертированная сумма для получателя
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
    if (transferModal.isOpen && editingTransaction) {
      if (editingTransaction.type !== 'transfer') {
        resetForm();
        return;
      }

      setFromAccountId(editingTransaction.accountId);
      setToAccountId(editingTransaction.toAccountId ?? null);
      setAmount(editingTransaction.amount.toString());
      setTransferDate(new Date(editingTransaction.date));

      // Парсим note для извлечения информации о курсе обмена
      const noteText = editingTransaction.note ?? editingTransaction.description ?? '';
      const rateRegex = /Exchange rate: 1 [A-Z]+ = ([\d.]+) [A-Z]+\.?\s?(.*)$/i;
      const match = noteText.match(rateRegex);

      if (match) {
        setCustomExchangeRate(match[1]);
        setNote(match[2]?.replace(/^Received: [^.]+\.\s?/, '').trim() ?? '');
      } else {
        setNote(noteText);
      }
    } else if (transferModal.isOpen) {
      resetForm();
    }
  }, [editingTransaction, resetForm, transferModal.isOpen]);

  // Сбрасываем кастомный курс при смене счетов
  useEffect(() => {
    if (!needsConversion) {
      setCustomExchangeRate('');
    }
  }, [needsConversion, fromAccountId, toAccountId]);

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
    [applyDateTimePart, transferDate]
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
    [applyDateTimePart, pickerMode]
  );

  const closePicker = useCallback(() => setPickerMode(null), []);

  const pickerValue = useMemo(() => new Date(transferDate), [transferDate]);

  const dateLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(transferDate);
    } catch {
      return transferDate.toLocaleDateString();
    }
  }, [transferDate]);

  const timeLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(transferDate);
    } catch {
      return transferDate.toLocaleTimeString();
    }
  }, [transferDate]);

  const handleSelectAccount = useCallback(
    (accountId: string) => {
      if (!accountPickerContext) {
        return;
      }

      if (accountPickerContext === 'from') {
        setFromAccountId(accountId);
      } else {
        setToAccountId(accountId);
      }

      accountPickerRef.current?.dismiss();
      setAccountPickerContext(null);
    },
    [accountPickerContext]
  );

  const handleOpenAccountPicker = useCallback((context: AccountPickerContext) => {
    setAccountPickerContext(context);
    accountPickerRef.current?.present();
  }, []);

  const handleClose = useCallback(() => {
    closeTransferModal();
    onRequestClose?.();
  }, [closeTransferModal, onRequestClose]);

  const handleSubmit = useCallback(() => {
    if (isSaveDisabled || !fromAccount || !toAccount) {
      return;
    }

    const normalizedFromCurrency = normalizeFinanceCurrency(fromAccount.currency);
    const normalizedBaseCurrency = normalizeFinanceCurrency(baseCurrency);
    const rateToBase =
      normalizedFromCurrency === normalizedBaseCurrency
        ? 1
        : convertAmount(1, normalizedFromCurrency, normalizedBaseCurrency);
    const convertedAmountToBase = amountNumber * rateToBase;
    const recipientAmount = needsConversion ? convertedAmount : amountNumber;
    const effectiveRateFromTo = needsConversion ? currentExchangeRate : 1;

    // Формируем заметку с информацией о конвертации
    let finalNote = note.trim();
    if (needsConversion && amountNumber > 0) {
      const rateInfo = `Exchange rate: 1 ${toAccount.currency} = ${currentExchangeRate.toFixed(4)} ${fromAccount.currency}. Received: ${formatCurrency(recipientAmount, toAccount.currency)}`;
      finalNote = finalNote ? `${rateInfo}. ${finalNote}` : rateInfo;
    }

    const basePayload = {
      userId: 'local-user',
      type: 'transfer' as const,
      amount: amountNumber,
      accountId: fromAccount.id,
      fromAccountId: fromAccount.id,
      toAccountId: toAccount.id,
      currency: fromAccount.currency,
      toCurrency: toAccount.currency,
      toAmount: recipientAmount,
      baseCurrency: normalizedBaseCurrency,
      rateUsedToBase: rateToBase,
      convertedAmountToBase,
      effectiveRateFromTo,
      description: finalNote.length ? finalNote : undefined,
      date: transferDate.toISOString(),
    } satisfies Parameters<typeof createTransaction>[0];

    if (isEditing && editingTransaction) {
      updateTransaction(editingTransaction.id, basePayload);
    } else {
      createTransaction(basePayload);
    }

    handleClose();
  }, [
    amountNumber,
    baseCurrency,
    convertAmount,
    convertedAmount,
    currentExchangeRate,
    editingTransaction,
    formatCurrency,
    fromAccount,
    isEditing,
    isSaveDisabled,
    handleClose,
    createTransaction,
    needsConversion,
    note,
    toAccount,
    transferDate,
    updateTransaction,
  ]);

  const handleSwapAccounts = useCallback(() => {
    const temp = fromAccountId;
    setFromAccountId(toAccountId);
    setToAccountId(temp);
  }, [fromAccountId, toAccountId]);

  return (
    <>
      <CustomModal ref={modalRef} onDismiss={handleClose} {...modalProps}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>TRANSFER</Text>
            </View>

            {/* From Account */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('finance.fromAccount')}</Text>
              <Pressable
                onPress={() => handleOpenAccountPicker('from')}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <AdaptiveGlassView style={styles.accountContainer}>
                  <View style={styles.accountInfo}>
                    <View style={styles.accountNameRow}>
                      <Text style={styles.accountName}>{fromAccount?.name ?? 'Select'}</Text>
                      {fromAccount && (
                        <View style={styles.currencyBadge}>
                          <Text style={styles.currencyBadgeText}>{fromAccount.currency}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.accountBalance}>
                      {fromAccount
                        ? formatCurrency(fromAccount.currentBalance, fromAccount.currency)
                        : 'No balance'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#7E8B9A" />
                </AdaptiveGlassView>
              </Pressable>
            </View>

            {/* Swap Button */}
            <View style={styles.swapContainer}>
              <Pressable
                onPress={handleSwapAccounts}
                style={({ pressed }) => [styles.swapButton, pressed && styles.pressed]}
              >
                <AdaptiveGlassView style={styles.swapButtonInner}>
                  <ArrowRightLeft size={20} color="#FFFFFF" />
                </AdaptiveGlassView>
              </Pressable>
            </View>

            {/* To Account */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('finance.toAccount')}</Text>
              <Pressable
                onPress={() => handleOpenAccountPicker('to')}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <AdaptiveGlassView style={styles.accountContainer}>
                  <View style={styles.accountInfo}>
                    <View style={styles.accountNameRow}>
                      <Text style={styles.accountName}>{toAccount?.name ?? 'Select'}</Text>
                      {toAccount && (
                        <View style={styles.currencyBadge}>
                          <Text style={styles.currencyBadgeText}>{toAccount.currency}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.accountBalance}>
                      {toAccount
                        ? formatCurrency(toAccount.currentBalance, toAccount.currency)
                        : 'No balance'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#7E8B9A" />
                </AdaptiveGlassView>
              </Pressable>
            </View>

            {/* Amount */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('finance.amount')}</Text>
              <AdaptiveGlassView style={styles.inputContainer}>
                <TextInput
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="Amount"
                  placeholderTextColor="#7E8B9A"
                  keyboardType="numeric"
                  style={styles.textInput}
                />
              </AdaptiveGlassView>
            </View>

            {/* Exchange Rate - показываем только если валюты разные */}
            {needsConversion && fromAccount && toAccount && (
              <View style={styles.section}>
                <View style={styles.exchangeRateLabelRow}>
                  <Text style={styles.sectionLabel}>Exchange rate</Text>
                  {!customExchangeRate && (
                    <View style={styles.autoBadge}>
                      <Text style={styles.autoBadgeText}>Auto</Text>
                    </View>
                  )}
                </View>
                <AdaptiveGlassView style={styles.exchangeRateContainer}>
                  <View style={styles.exchangeRateRow}>
                    <Text style={styles.exchangeRateLabel}>
                      1 {toAccount.currency} =
                    </Text>
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
                  
                  {/* Показываем конвертированную сумму */}
                  {amountNumber > 0 && (
                    <View style={styles.conversionInfo}>
                      <Ionicons name="arrow-forward" size={16} color="#7E8B9A" />
                      <Text style={styles.conversionText}>
                        {formatCurrency(convertedAmount, toAccount.currency)} will be received
                      </Text>
                    </View>
                  )}
                  
                  {/* Показываем если курс изменён */}
                  {customExchangeRate && (
                    <Pressable
                      onPress={() => setCustomExchangeRate('')}
                      style={styles.resetRateButton}
                    >
                      <Text style={styles.resetRateText}>Reset to auto rate</Text>
                    </Pressable>
                  )}
                </AdaptiveGlassView>
              </View>
            )}

            {/* Date & Time */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('finance.date')}</Text>
              <View style={styles.dateTimeRow}>
                <Pressable
                  onPress={() => openDateTimePicker('date')}
                  style={({ pressed }) => [styles.dateTimeButton, pressed && styles.pressed]}
                >
                  <AdaptiveGlassView style={styles.dateTimeChip}>
                    <Ionicons name="calendar-outline" size={18} color="#7E8B9A" />
                    <Text style={styles.dateTimeText}>{dateLabel}</Text>
                  </AdaptiveGlassView>
                </Pressable>
                <Pressable
                  onPress={() => openDateTimePicker('time')}
                  style={({ pressed }) => [styles.dateTimeButton, pressed && styles.pressed]}
                >
                  <AdaptiveGlassView style={styles.dateTimeChip}>
                    <Ionicons name="time-outline" size={18} color="#7E8B9A" />
                    <Text style={styles.dateTimeText}>{timeLabel}</Text>
                  </AdaptiveGlassView>
                </Pressable>
              </View>
            </View>

            {/* Note */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('finance.note')}</Text>
              <AdaptiveGlassView style={styles.noteContainer}>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder={t('finance.notePlaceholder')}
                  placeholderTextColor="#7E8B9A"
                  multiline
                  style={styles.noteInput}
                />
              </AdaptiveGlassView>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                onPress={handleClose}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={isSaveDisabled}
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && !isSaveDisabled && styles.pressed,
                ]}
              >
                <AdaptiveGlassView
                  style={[styles.primaryButtonInner, { opacity: isSaveDisabled ? 0.4 : 1 }]}
                >
                  <Text
                    style={[
                      styles.primaryButtonText,
                      { color: isSaveDisabled ? '#7E8B9A' : '#FFFFFF' },
                    ]}
                  >
                    {t('finance.transfer')}
                  </Text>
                </AdaptiveGlassView>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </CustomModal>

      {/* iOS Date/Time Picker Modal */}
      {Platform.OS === 'ios' && pickerMode && (
        <Modal transparent visible onRequestClose={closePicker} animationType="fade">
          <View style={styles.pickerModal}>
            <Pressable style={styles.pickerBackdrop} onPress={closePicker} />
            <AdaptiveGlassView style={styles.pickerCard}>
              <DateTimePicker
                value={pickerValue}
                mode={pickerMode}
                display={pickerMode === 'date' ? 'inline' : 'spinner'}
                onChange={handleIosPickerChange}
                is24Hour
              />
              <Pressable onPress={closePicker} style={styles.pickerDoneButton}>
                <Text style={styles.pickerDoneText}>Done</Text>
              </Pressable>
            </AdaptiveGlassView>
          </View>
        </Modal>
      )}

      {/* Account Picker Modal */}
      <CustomModal
        ref={accountPickerRef}
        variant="form"
        fallbackSnapPoint="50%"
        onDismiss={() => setAccountPickerContext(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {accountPickerContext === 'from'
                ? t('finance.selectFromAccount')
                : t('finance.selectToAccount')}
            </Text>
            <Pressable onPress={() => accountPickerRef.current?.dismiss()} hitSlop={10}>
              <Ionicons name="close" size={22} color="#7E8B9A" />
            </Pressable>
          </View>

          <View style={styles.accountList}>
            {accounts.map((account) => {
              const selected =
                accountPickerContext === 'from'
                  ? account.id === fromAccount?.id
                  : account.id === toAccount?.id;
              return (
                <Pressable
                  key={account.id}
                  onPress={() => handleSelectAccount(account.id)}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <AdaptiveGlassView
                    style={[styles.accountItem, { opacity: selected ? 1 : 0.7 }]}
                  >
                    <View style={styles.accountPickerIcon}>
                      <Wallet size={18} color="#7E8B9A" />
                    </View>
                    <View style={styles.accountPickerInfo}>
                      <Text style={[styles.textInput, { marginBottom: 4 }]}>{account.name}</Text>
                      <Text style={styles.accountBalance}>
                        {formatCurrency(account.currentBalance, account.currency)}
                      </Text>
                    </View>
                    {selected && <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />}
                  </AdaptiveGlassView>
                </Pressable>
              );
            })}
          </View>
        </View>
      </CustomModal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: '#7E8B9A',
  },
  section: {
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#7E8B9A',
    marginBottom: 12,
  },
  exchangeRateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
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
  accountContainer: {
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
    fontWeight: '400',
    color: '#FFFFFF',
  },
  currencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    marginVertical: 8,
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
    paddingVertical: 16,
  },
  textInput: {
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
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
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingVertical: 4,
  },
  conversionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  conversionText: {
    fontSize: 13,
    fontWeight: '400',
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
    paddingVertical: 16,
    borderRadius: 16,
  },
  dateTimeText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  noteContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 80,
  },
  noteInput: {
    fontSize: 15,
    fontWeight: '400',
    textAlignVertical: 'top',
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#7E8B9A',
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
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  pickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  pickerCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  pickerDoneButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  pickerDoneText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  accountList: {
    gap: 12,
  },
  accountItem: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  accountPickerInfo: {
    flex: 1,
  },
});
