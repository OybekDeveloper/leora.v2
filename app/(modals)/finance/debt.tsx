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
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
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
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<FinanceCurrency>('USD');
  const [startDate, setStartDate] = useState(new Date());
  const [expectedReturnDate, setExpectedReturnDate] = useState<Date | null>(null);
  const [note, setNote] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(accounts[0]?.id ?? null);
  const [pickerState, setPickerState] = useState<{ target: 'start' | 'expected'; value: Date } | null>(null);

  useEffect(() => {
    if (!editingDebt) return;
    setDebtType(mapDirectionToDebtType(editingDebt.direction));
    setPerson(editingDebt.counterpartyName);
    setAmount(String(editingDebt.principalOriginalAmount ?? editingDebt.principalAmount ?? ''));
    setCurrency(ensureCurrency(editingDebt.principalCurrency));
    setStartDate(new Date(editingDebt.startDate));
    setExpectedReturnDate(editingDebt.dueDate ? new Date(editingDebt.dueDate) : null);
    setNote(editingDebt.description ?? '');
    setReminderEnabled(Boolean(editingDebt.reminderEnabled));
    setSelectedAccountId(editingDebt.fundingAccountId ?? null);
  }, [editingDebt]);

  useEffect(() => {
    if (!selectedAccountId && accounts[0]) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const amountNumber = useMemo(() => {
    const parsed = parseFloat(amount.replace(/,/g, '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amount]);

  const isSaveDisabled = !person.trim() || amountNumber <= 0;

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
    const payload = {
      userId: 'local-user',
      direction,
      counterpartyName: person.trim(),
      principalAmount: amountNumber,
      principalOriginalAmount: amountNumber,
      principalCurrency: currency,
      principalOriginalCurrency: currency,
      baseCurrency,
      rateOnStart: 1,
      startDate: startDate.toISOString(),
      dueDate: expectedReturnDate ? expectedReturnDate.toISOString() : undefined,
      reminderEnabled,
      fundingAccountId: selectedAccountId ?? undefined,
      description: note.trim() || undefined,
      linkedGoalId: editingDebt?.linkedGoalId ?? linkedGoalId ?? undefined,
    } satisfies Parameters<typeof createDebt>[0];

    if (editingDebt) {
      updateDebt(editingDebt.id, payload);
    } else {
      createDebt(payload);
    }

    handleClose();
  }, [
    amountNumber,
    baseCurrency,
    createDebt,
    currency,
    debtType,
    editingDebt,
    expectedReturnDate,
    handleClose,
    isSaveDisabled,
    note,
    person,
    reminderEnabled,
    selectedAccountId,
    startDate,
    updateDebt,
  ]);

  const handleDelete = useCallback(() => {
    if (!editingDebt) return;
    const linkedGoals = goals.filter((goal) => goal.linkedDebtId === editingDebt.id);
    if (linkedGoals.length > 0) {
      Alert.alert(
        'Debt is linked',
        linkedGoals.length === 1
          ? 'This debt is linked to a goal. Unlink it before deleting.'
          : 'This debt is linked to multiple goals. Unlink them before deleting.',
      );
      return;
    }
    deleteDebt(editingDebt.id);
    handleClose();
  }, [deleteDebt, editingDebt, goals, handleClose]);

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
            <AdaptiveGlassView style={[styles.glassSurface, styles.typeContainer]}>
              <Pressable onPress={() => setDebtType('borrowed')} style={({ pressed }) => [styles.typeOption, { borderBottomWidth: 1 }, pressed && styles.pressed]}>
                <Text style={[styles.typeLabel, { color: debtType === 'borrowed' ? '#FFFFFF' : '#7E8B9A' }]}>
                  {debtStrings.borrowedLabel ?? 'I Owe'}
                </Text>
              </Pressable>
              <Pressable onPress={() => setDebtType('lent')} style={({ pressed }) => [styles.typeOption, pressed && styles.pressed]}>
                <Text style={[styles.typeLabel, { color: debtType === 'lent' ? '#FFFFFF' : '#7E8B9A' }]}>
                  {debtStrings.lentLabel ?? 'They Owe Me'}
                </Text>
              </Pressable>
            </AdaptiveGlassView>
          </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{debtStrings.person ?? 'Name'}</Text>
              <AdaptiveGlassView style={[styles.glassSurface, styles.inputContainer]}>
                <TextInput
                  value={person}
                  onChangeText={setPerson}
                  placeholder={debtStrings.personPlaceholder ?? 'Person'}
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.textInput, { color: theme.colors.textPrimary }]}
                />
              </AdaptiveGlassView>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                {`${(strings.financeScreens.transactions.details.amount as string) ?? 'Amount'} (${currency})`}
              </Text>
              <AdaptiveGlassView style={[styles.glassSurface, styles.inputContainer]}>
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

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{debtStrings.currency ?? 'Currency'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.currencyScroll}>
                {AVAILABLE_FINANCE_CURRENCIES.map((code) => {
                  const active = currency === code;
                  return (
                    <Pressable key={code} onPress={() => setCurrency(code)} style={({ pressed }) => [styles.currencyPill, active && styles.currencyPillActive, pressed && styles.pressed]}>
                      <Text style={[styles.currencyLabel, { color: active ? '#0E0E0E' : '#FFFFFF' }]}>{code}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{debtStrings.date ?? 'Date'}</Text>
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
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{debtStrings.accountLabel ?? 'Account'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountScroll}>
                {accounts.map((account) => {
                  const active = account.id === selectedAccountId;
                  return (
                    <Pressable key={account.id} onPress={() => setSelectedAccountId(account.id)} style={({ pressed }) => [styles.accountChip, active && styles.accountChipActive, pressed && styles.pressed]}>
                      <Text style={[styles.accountChipLabel, { color: active ? '#0E0E0E' : '#FFFFFF' }]}>{account.name}</Text>
                      <Text style={[styles.accountChipSubtext, { color: active ? '#0E0E0E' : '#9E9E9E' }]}>{account.currency}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{debtStrings.note ?? 'Note'}</Text>
              <AdaptiveGlassView style={[styles.glassSurface, styles.noteContainer]}>
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
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  glassSurface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  typeContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  typeOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '700',
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
  currencyScroll: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    gap: 10,
  },
  currencyPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
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
  accountScroll: {
    paddingVertical: 4,
    gap: 10,
  },
  accountChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 12,
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
  noteContainer: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 120,
  },
  noteInput: {
    fontSize: 15,
    fontWeight: '500',
    minHeight: 100,
    textAlignVertical: 'top',
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
