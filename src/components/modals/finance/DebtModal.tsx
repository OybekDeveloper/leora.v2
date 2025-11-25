import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import CustomModal, { CustomModalProps } from '@/components/modals/CustomModal';
import { BottomSheetHandle } from '@/components/modals/BottomSheet';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useModalStore } from '@/stores/useModalStore';
import {
  AVAILABLE_FINANCE_CURRENCIES,
  type FinanceCurrency,
  useFinancePreferencesStore,
} from '@/stores/useFinancePreferencesStore';
import type { Account, Counterparty, Debt } from '@/domain/finance/types';
import { useShallow } from 'zustand/react/shallow';
import { isDebtLocked, canDeleteDebt, getDebtTransactions } from '@/utils/debtValidation';

const applyTemplate = (template: string, replacements: Record<string, string>) =>
  Object.entries(replacements).reduce<string>(
    (result, [key, value]) => result.split(`{${key}}`).join(value),
    template,
  );

type DebtType = 'borrowed' | 'lent';
type PickerMode = 'date' | 'time' | null;
type ActiveDateField = 'date' | 'expected' | 'schedule' | null;

const modalProps: Partial<CustomModalProps> = {
  variant: 'form',
  enableDynamicSizing: false,
  fallbackSnapPoint: '96%',
  scrollable: true,
  scrollProps: { keyboardShouldPersistTaps: 'handled' },
  contentContainerStyle: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
};

const formatPresetAmount = (value: number) => {
  if (!Number.isFinite(value)) {
    return '';
  }
  const fraction = value % 1 === 0 ? 0 : 2;
  return value.toLocaleString('en-US', {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  });
};

const formatAmountInputValue = (value: string) => {
  const cleaned = value.replace(/[^0-9.,]/g, '').replace(/,/g, '');
  if (!cleaned) {
    return { formatted: '', numeric: 0 };
  }

  const [integerRaw, fractionRaw = ''] = cleaned.split('.');
  const integer = integerRaw.replace(/^0+(?=\d)/, '') || '0';
  const parsedInteger = Number.parseInt(integer, 10);
  const formattedInteger = Number.isFinite(parsedInteger)
    ? parsedInteger.toLocaleString('en-US')
    : '0';
  const hasTrailingDot = cleaned.endsWith('.');
  const sanitizedFraction = fractionRaw.replace(/[^0-9]/g, '').slice(0, 2);

  let formatted = formattedInteger;
  if (sanitizedFraction.length > 0) {
    formatted += `.${sanitizedFraction}`;
  } else if (hasTrailingDot) {
    formatted += '.';
  }

  const numeric = Number.parseFloat(
    sanitizedFraction.length > 0
      ? `${integer}.${sanitizedFraction}`
      : integer,
  );

  return {
    formatted,
    numeric: Number.isFinite(numeric) ? numeric : 0,
  };
};

const ensureCurrency = (value?: string): FinanceCurrency => {
  if (!value) {
    return 'USD';
  }
  const upper = value.toUpperCase();
  return AVAILABLE_FINANCE_CURRENCIES.includes(upper as FinanceCurrency)
    ? (upper as FinanceCurrency)
    : 'USD';
};

const getAccountCurrency = (account?: Account | null) =>
  ensureCurrency(account?.currency);

const formatCurrencyValue = (value: number, currency: FinanceCurrency) => {
  const locale = currency === 'UZS' ? 'uz-UZ' : 'en-US';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'UZS' ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};

type DebtModalSnapshot = {
  id: string;
  type: DebtType;
  person: string;
  amount: number;
  remainingAmount: number;
  currency: FinanceCurrency;
  date: Date;
  expectedReturnDate?: Date;
  reminderEnabled?: boolean;
  reminderTime?: string;
  accountId?: string | null;
  note?: string;
};

const mapDirectionToDebtType = (direction: Debt['direction']): DebtType =>
  direction === 'they_owe_me' ? 'lent' : 'borrowed';

const mapDebtTypeToDirection = (type: DebtType): Debt['direction'] =>
  type === 'lent' ? 'they_owe_me' : 'i_owe';

const adaptDebtForModal = (debt: Debt): DebtModalSnapshot => ({
  id: debt.id,
  type: mapDirectionToDebtType(debt.direction),
  person: debt.counterpartyName,
  amount: debt.principalOriginalAmount ?? debt.principalAmount,
  remainingAmount: debt.principalAmount,
  currency: ensureCurrency(debt.principalCurrency),
  date: new Date(debt.startDate),
  expectedReturnDate: debt.dueDate ? new Date(debt.dueDate) : undefined,
  reminderEnabled: debt.reminderEnabled,
  reminderTime: debt.reminderTime,
  accountId: debt.fundingAccountId ?? null,
  note: debt.description,
});

type DebtModalProps = {
  onRequestClose?: () => void;
};

export default function DebtModal({ onRequestClose }: DebtModalProps) {
  const modalRef = useRef<BottomSheetHandle>(null);
  const accountModalRef = useRef<BottomSheetHandle>(null);
  const currencyModalRef = useRef<BottomSheetHandle>(null);
  const counterpartyModalRef = useRef<BottomSheetHandle>(null);
  const fullPaymentModalRef = useRef<BottomSheetHandle>(null);
  const paymentModalRef = useRef<BottomSheetHandle>(null);
  const scheduleModalRef = useRef<BottomSheetHandle>(null);
  const reminderModalRef = useRef<BottomSheetHandle>(null);
  const ensuredEditingCounterpartyId = useRef<string | null>(null);

  const { strings } = useLocalization();
  const debtsStrings = strings.financeScreens.debts;
  const modalStrings = debtsStrings.modal;
  const paymentStrings = modalStrings.payment;
  const actionButtons = modalStrings.actionsBar ?? {
    pay: 'Pay debt',
    partial: 'Partial payment',
    notify: 'Notification',
    schedule: 'Manage dates',
  };
  const manualRateStrings = modalStrings.manualRate ?? {
    title: 'Conversion',
    description:
      'Debt currency {debtCurrency}. Wallet currency {accountCurrency}. Enter the debit amount in {accountCurrency}.',
    toggle: 'Enter manually',
    amountLabel: 'Debit amount ({currency})',
  };
  const counterpartyActionsStrings = modalStrings.counterpartyActions ?? {
    renameTitle: 'Rename person',
    renamePlaceholder: 'Enter new name',
    renameSave: 'Save name',
    renameCancel: 'Cancel',
    deleteTitle: 'Remove person?',
    deleteDescription: 'This will permanently remove the selected person.',
    deleteConfirm: 'Remove',
    deleteBlocked: 'You cannot delete a person linked to debts.',
    duplicateName: 'A person with this name already exists.',
  };

  const debtModal = useModalStore((state) => state.debtModal);
  const closeDebtModal = useModalStore((state) => state.closeDebtModal);
  const consumeDebtModalFocus = useModalStore((state) => state.consumeDebtModalFocus);

  const {
    accounts,
    debts,
    createDebt,
    updateDebt,
    deleteDebt,
    addDebtPayment,
    counterparties,
    createCounterparty,
    renameCounterparty,
    deleteCounterparty,
  } = useFinanceDomainStore(
    useShallow((state) => ({
      accounts: state.accounts,
      debts: state.debts,
      createDebt: state.createDebt,
      updateDebt: state.updateDebt,
      deleteDebt: state.deleteDebt,
      addDebtPayment: state.addDebtPayment,
      counterparties: state.counterparties,
      createCounterparty: state.createCounterparty,
      renameCounterparty: state.renameCounterparty,
      deleteCounterparty: state.deleteCounterparty,
    })),
  );

  const defaultDebtAccounts = useFinancePreferencesStore(
    (state) => state.defaultDebtAccounts,
  );
  const baseCurrency = useFinancePreferencesStore((state) => state.baseCurrency);
  const setDefaultDebtAccount = useFinancePreferencesStore(
    (state) => state.setDefaultDebtAccount,
  );
  const convertAmount = useFinancePreferencesStore((state) => state.convertAmount);

  const editingDebtDomain = useMemo(() => {
    if (!debtModal.debt?.id) {
      return undefined;
    }
    return debts.find((debt) => debt.id === debtModal.debt?.id);
  }, [debtModal.debt?.id, debts]);

  const editingDebt = useMemo(() => (editingDebtDomain ? adaptDebtForModal(editingDebtDomain) : undefined), [editingDebtDomain]);

  const isEditing = Boolean(debtModal.mode === 'edit' && editingDebtDomain);

  const [person, setPerson] = useState('');
  const [selectedCounterpartyId, setSelectedCounterpartyId] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [amountValue, setAmountValue] = useState(0);
  const [activeType, setActiveType] = useState<DebtType>('borrowed');
  const [note, setNote] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [expectedDate, setExpectedDate] = useState<Date | undefined>(undefined);
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [activeDateField, setActiveDateField] = useState<ActiveDateField>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentAmountValue, setPaymentAmountValue] = useState(0);
  const [paymentAccountId, setPaymentAccountId] = useState<string | null>(null);
  const [paymentCurrency, setPaymentCurrency] = useState<FinanceCurrency>('USD');
  const [paymentNote, setPaymentNote] = useState('');
  const [accountSelectorContext, setAccountSelectorContext] = useState<'debt' | 'payment'>('debt');
  const [currencySelectorContext, setCurrencySelectorContext] = useState<'debt' | 'payment'>('debt');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<FinanceCurrency>('USD');
  const [scheduleDate, setScheduleDate] = useState<Date>(new Date());
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [manualFundingEnabled, setManualFundingEnabled] = useState(false);
  const [fundingOverrideInput, setFundingOverrideInput] = useState('');
  const [fundingOverrideValue, setFundingOverrideValue] = useState(0);
  const [counterpartyQuery, setCounterpartyQuery] = useState('');
  const [editingCounterpartyId, setEditingCounterpartyId] = useState<string | null>(null);
  const [editingCounterpartyName, setEditingCounterpartyName] = useState('');

  const selectedCounterparty = useMemo(
    () => counterparties.find((party) => party.id === selectedCounterpartyId) ?? null,
    [counterparties, selectedCounterpartyId],
  );

  const filteredCounterparties = useMemo(() => {
    const query = counterpartyQuery.trim().toLowerCase();
    if (!query) {
      return counterparties;
    }
    return counterparties.filter((party) =>
      party.displayName.toLowerCase().includes(query),
    );
  }, [counterparties, counterpartyQuery]);

  useEffect(() => {
    if (selectedCounterparty) {
      setPerson(selectedCounterparty.displayName);
    } else if (!selectedCounterpartyId) {
      setPerson('');
    }
  }, [selectedCounterparty, selectedCounterpartyId]);

  useEffect(() => {
    if (debtModal.isOpen && debtModal.showPrimarySheet) {
      modalRef.current?.present();
    } else {
      modalRef.current?.dismiss();
    }
  }, [debtModal.isOpen, debtModal.showPrimarySheet]);

  const getDefaultAccountId = useCallback(
    (type: DebtType) => defaultDebtAccounts[type] ?? accounts[0]?.id ?? null,
    [accounts, defaultDebtAccounts],
  );

  const resetForm = useCallback(
    (type: DebtType = 'borrowed') => {
      setPerson('');
      setSelectedCounterpartyId(null);
      setCounterpartyQuery('');
      setEditingCounterpartyId(null);
      setEditingCounterpartyName('');
      setAmountInput('');
      setAmountValue(0);
      setActiveType(type);
      setNote('');
      setStartDate(new Date());
      setExpectedDate(undefined);
      setActiveDateField(null);
      setPickerMode(null);
      const fallbackAccountId = getDefaultAccountId(type);
      setSelectedAccountId(fallbackAccountId);
      const defaultCurrency = fallbackAccountId
        ? getAccountCurrency(accounts.find((acc) => acc.id === fallbackAccountId))
        : 'USD';
      setSelectedCurrency(defaultCurrency);
      setPaymentAccountId(fallbackAccountId);
      setPaymentCurrency(defaultCurrency);
      setPaymentAmountInput('');
      setPaymentAmountValue(0);
      setPaymentNote('');
      setScheduleDate(new Date());
      setReminderEnabled(false);
      setReminderTime('09:00');
      setManualFundingEnabled(false);
      setFundingOverrideInput('');
      setFundingOverrideValue(0);
    },
    [accounts, getDefaultAccountId],
  );

  useEffect(() => {
    if (!debtModal.isOpen) {
      resetForm('borrowed');
      ensuredEditingCounterpartyId.current = null;
      return;
    }

    if (debtModal.mode === 'create') {
      resetForm('borrowed');
      ensuredEditingCounterpartyId.current = null;
    }
  }, [debtModal.isOpen, debtModal.mode, resetForm]);

  useEffect(() => {
    if (!debtModal.isOpen || !isEditing || !editingDebt) {
      return;
    }

    setActiveType(editingDebt.type);
    setAmountInput(formatPresetAmount(editingDebt.amount));
    setAmountValue(editingDebt.amount);
    setNote(editingDebt.note ?? '');
    setStartDate(new Date(editingDebt.date));
    const expected = editingDebt.expectedReturnDate
      ? new Date(editingDebt.expectedReturnDate)
      : undefined;
    setExpectedDate(expected);
    setScheduleDate(expected ?? new Date());
    setReminderEnabled(editingDebt.reminderEnabled ?? false);
    setReminderTime(editingDebt.reminderTime ?? '09:00');
    const fallbackAccount = editingDebt.accountId ?? getDefaultAccountId(editingDebt.type);
    setSelectedAccountId(fallbackAccount);
    setSelectedCurrency(editingDebt.currency);
    setPaymentAccountId(fallbackAccount);
    setPaymentCurrency(editingDebt.currency);
    setPaymentAmountInput('');
    setPaymentAmountValue(0);
    setPaymentNote('');
    setManualFundingEnabled(false);
    setFundingOverrideInput('');
    setFundingOverrideValue(0);
    setEditingCounterpartyId(null);
    setEditingCounterpartyName('');

    if (editingDebtDomain?.counterpartyId) {
      ensuredEditingCounterpartyId.current = editingDebtDomain.counterpartyId;
      setSelectedCounterpartyId(editingDebtDomain.counterpartyId);
    } else if (editingDebt.person) {
      if (!ensuredEditingCounterpartyId.current) {
        const ensured = createCounterparty(editingDebt.person);
        ensuredEditingCounterpartyId.current = ensured.id;
        setSelectedCounterpartyId(ensured.id);
        setPerson(ensured.displayName);
      } else {
        setSelectedCounterpartyId(ensuredEditingCounterpartyId.current);
      }
    } else {
      ensuredEditingCounterpartyId.current = null;
      setSelectedCounterpartyId(null);
    }
  }, [
    createCounterparty,
    debtModal.isOpen,
    editingDebt,
    editingDebtDomain?.counterpartyId,
    getDefaultAccountId,
    isEditing,
  ]);

  useEffect(() => {
    if (!debtModal.isOpen || isEditing) {
      return;
    }
    const defaultAccountId = getDefaultAccountId(activeType);
    setSelectedAccountId(defaultAccountId);
    if (defaultAccountId) {
      const defaultCurrency = getAccountCurrency(
        accounts.find((acc) => acc.id === defaultAccountId),
      );
      setSelectedCurrency(defaultCurrency);
    }
  }, [accounts, activeType, debtModal.isOpen, getDefaultAccountId, isEditing]);

  const selectedAccount = useMemo(
    () => accounts.find((acc) => acc.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId],
  );

  const paymentAccount = useMemo(
    () => accounts.find((acc) => acc.id === paymentAccountId) ?? null,
    [accounts, paymentAccountId],
  );

  const accountCurrency = selectedAccount ? getAccountCurrency(selectedAccount) : selectedCurrency;
  const hasCurrencyMismatch = Boolean(selectedAccount && accountCurrency !== selectedCurrency);

  const autoFundingAmount = useMemo(() => {
    if (!hasCurrencyMismatch) {
      return amountValue;
    }
    try {
      return convertAmount(amountValue, selectedCurrency, accountCurrency);
    } catch {
      return amountValue;
    }
  }, [amountValue, convertAmount, hasCurrencyMismatch, selectedCurrency, accountCurrency]);

  useEffect(() => {
    if (!hasCurrencyMismatch) {
      setManualFundingEnabled(false);
      setFundingOverrideInput('');
      setFundingOverrideValue(0);
      return;
    }
    if (!manualFundingEnabled) {
      const numericSource = Number.isFinite(autoFundingAmount) ? `${autoFundingAmount}` : '';
      const { formatted, numeric } = formatAmountInputValue(numericSource);
      setFundingOverrideInput(formatted);
      setFundingOverrideValue(numeric);
    }
  }, [autoFundingAmount, hasCurrencyMismatch, manualFundingEnabled]);

  useEffect(() => {
    if (selectedCounterparty) {
      setPerson(selectedCounterparty.displayName);
    }
  }, [selectedCounterparty]);

  const manualFundingInvalid =
    manualFundingEnabled && hasCurrencyMismatch && fundingOverrideValue <= 0;

  const personDirectional = modalStrings.personDirectional;
  const selectedCounterpartyName = selectedCounterparty?.displayName ?? person;
  const personLabel =
    activeType === 'borrowed'
      ? personDirectional?.incoming?.label ?? modalStrings.person
      : personDirectional?.outgoing?.label ?? modalStrings.person;
  const personPlaceholder =
    activeType === 'borrowed'
      ? personDirectional?.incoming?.placeholder ?? modalStrings.personPlaceholder
      : personDirectional?.outgoing?.placeholder ?? modalStrings.personPlaceholder;

  const accountDirectional = modalStrings.accountDirectional;
  const accountLabel =
    activeType === 'borrowed'
      ? accountDirectional?.incoming?.label ?? modalStrings.accountLabel
      : accountDirectional?.outgoing?.label ?? modalStrings.accountLabel;
  const accountHelperTemplate =
    activeType === 'borrowed'
      ? accountDirectional?.incoming?.helper ?? modalStrings.accountHelper
      : accountDirectional?.outgoing?.helper ?? modalStrings.accountHelper;
  const accountHelperText = accountHelperTemplate
    ? applyTemplate(accountHelperTemplate, { accountCurrency })
    : null;

  const currencyFlowTemplate =
    activeType === 'borrowed'
      ? modalStrings.currencyFlow?.incoming
      : modalStrings.currencyFlow?.outgoing;
  const currencyFlowText = currencyFlowTemplate
    ? applyTemplate(currencyFlowTemplate, {
        debtCurrency: selectedCurrency,
        accountCurrency,
      })
    : null;

  const manualDescription = manualRateStrings.description
    ? applyTemplate(manualRateStrings.description, {
        debtCurrency: selectedCurrency,
        accountCurrency,
      })
    : null;
  const manualAmountLabel = manualRateStrings.amountLabel
    ? applyTemplate(manualRateStrings.amountLabel, { currency: accountCurrency })
    : manualRateStrings.amountLabel;

  const counterpartyPickerTitle = modalStrings.counterpartyPickerTitle ?? personLabel;
  const counterpartySearchPlaceholder =
    modalStrings.counterpartySearchPlaceholder ?? personPlaceholder;
  const counterpartyAddTemplate = modalStrings.counterpartyAddAction ?? 'Add "{query}"';
  const counterpartyAddLabel = counterpartyQuery.trim()
    ? counterpartyAddTemplate.replace('{query}', counterpartyQuery.trim())
    : null;
  const counterpartyEmptyLabel = modalStrings.counterpartyEmpty ?? personPlaceholder;
  const renameCancelLabel =
    counterpartyActionsStrings.renameCancel ?? modalStrings.buttons.cancel ?? 'Cancel';
  const renameSaveLabel = counterpartyActionsStrings.renameSave ?? modalStrings.buttons.save ?? 'Save';
  const deleteConfirmLabel =
    counterpartyActionsStrings.deleteConfirm ?? modalStrings.buttons.delete ?? 'Delete';

  const isSaveDisabled =
    !selectedCounterpartyId ||
    amountValue <= 0 ||
    !startDate ||
    !selectedAccountId ||
    manualFundingInvalid;

  const outstandingInPaymentCurrency = useMemo(() => {
    if (editingDebt) {
      return convertAmount(editingDebt.remainingAmount, editingDebt.currency, paymentCurrency);
    }
    return amountValue;
  }, [amountValue, convertAmount, editingDebt, paymentCurrency]);

  const isPaymentDisabled =
    !paymentAccountId || paymentAmountValue <= 0 || paymentAmountValue > outstandingInPaymentCurrency;

  const handleAmountChange = useCallback((value: string) => {
    const { formatted, numeric } = formatAmountInputValue(value);
    setAmountInput(formatted);
    setAmountValue(numeric);
  }, []);

  const applyDateTimePart = useCallback((field: ActiveDateField, mode: 'date' | 'time', value: Date) => {
    const updateFn = (prev: Date) => {
      const next = new Date(prev);
      if (mode === 'date') {
        next.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
      } else {
        next.setHours(value.getHours(), value.getMinutes(), 0, 0);
      }
      return next;
    };

    if (field === 'expected') {
      setExpectedDate((prev) => updateFn(prev ?? new Date()));
    } else if (field === 'schedule') {
      setScheduleDate(updateFn);
    } else {
      setStartDate(updateFn);
    }
  }, []);

  const openDateTimePicker = useCallback(
    (field: ActiveDateField, mode: 'date' | 'time') => {
      let baseValue: Date;
      if (field === 'expected') {
        baseValue = expectedDate ?? new Date();
      } else if (field === 'schedule') {
        baseValue = scheduleDate;
      } else {
        baseValue = startDate;
      }

      if (Platform.OS === 'android') {
        DateTimePickerAndroid.open({
          value: baseValue,
          mode,
          is24Hour: true,
          display: mode === 'date' ? 'calendar' : 'clock',
          onChange: (event, selected) => {
            if (event.type === 'set' && selected) {
              applyDateTimePart(field, mode, selected);
            }
          },
        });
        return;
      }
      setActiveDateField(field);
      setPickerMode(mode);
    },
    [applyDateTimePart, expectedDate, scheduleDate, startDate]
  );

  const handleIosPickerChange = useCallback(
    (event: DateTimePickerEvent, selected?: Date) => {
      if (event.type === 'dismissed') {
        setPickerMode(null);
        setActiveDateField(null);
        return;
      }
      if (selected && pickerMode && activeDateField) {
        applyDateTimePart(activeDateField, pickerMode, selected);
      }
    },
    [activeDateField, applyDateTimePart, pickerMode]
  );

  const closePicker = useCallback(() => {
    setPickerMode(null);
    setActiveDateField(null);
  }, []);

  const pickerValue = useMemo(() => {
    if (activeDateField === 'expected') {
      return expectedDate ?? new Date();
    } else if (activeDateField === 'schedule') {
      return scheduleDate;
    }
    return startDate;
  }, [activeDateField, expectedDate, scheduleDate, startDate]);

  const dateLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(startDate);
    } catch {
      return startDate.toLocaleDateString();
    }
  }, [startDate]);

  const timeLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(startDate);
    } catch {
      return startDate.toLocaleTimeString();
    }
  }, [startDate]);

  const expectedDateLabel = useMemo(() => {
    if (!expectedDate) return 'Pick a date';
    try {
      return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(expectedDate);
    } catch {
      return expectedDate.toLocaleDateString();
    }
  }, [expectedDate]);

  const handleClose = useCallback(() => {
    closeDebtModal();
    onRequestClose?.();
  }, [closeDebtModal, onRequestClose]);

  const scheduleDateLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(scheduleDate);
    } catch {
      return scheduleDate.toLocaleDateString();
    }
  }, [scheduleDate]);

  const handleCancel = useCallback(() => {
    resetForm(activeType);
    handleClose();
  }, [activeType, handleClose, resetForm]);

  const handleSubmit = useCallback(() => {
    if (isSaveDisabled || !selectedAccountId || !selectedCounterpartyId) {
      return;
    }

    const direction = mapDebtTypeToDirection(activeType);
    const description = note.trim() || undefined;
    const counterpartyName = (selectedCounterpartyName.trim() || '—') as string;
    const principalBaseValue = convertAmount(amountValue, selectedCurrency, baseCurrency);
    const rateOnStart =
      amountValue !== 0 ? principalBaseValue / amountValue : 1;
    const basePayload = {
      userId: 'local-user',
      direction,
      counterpartyId: selectedCounterpartyId,
      counterpartyName,
      description,
      principalAmount: amountValue,
      principalOriginalAmount: amountValue,
      principalCurrency: selectedCurrency,
      principalOriginalCurrency: selectedCurrency,
      baseCurrency,
      principalBaseValue,
      rateOnStart,
      startDate: startDate.toISOString(),
      dueDate: expectedDate?.toISOString(),
      fundingAccountId: selectedAccountId,
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : undefined,
    } as const;

    const fundingOverrideAmount =
      manualFundingEnabled && hasCurrencyMismatch ? fundingOverrideValue : undefined;

    if (isEditing && editingDebtDomain) {
      updateDebt(editingDebtDomain.id, basePayload);
    } else {
      createDebt({ ...basePayload, fundingOverrideAmount });
      setDefaultDebtAccount(activeType, selectedAccountId);
    }

    handleClose();
  }, [
    activeType,
    amountValue,
    createDebt,
    editingDebtDomain,
    expectedDate,
    isEditing,
    isSaveDisabled,
    handleClose,
    hasCurrencyMismatch,
    manualFundingEnabled,
    note,
    reminderEnabled,
    reminderTime,
    baseCurrency,
    convertAmount,
    selectedAccountId,
    selectedCounterpartyName,
    selectedCounterpartyId,
    selectedCurrency,
    setDefaultDebtAccount,
    startDate,
    fundingOverrideValue,
    updateDebt,
  ]);

  const handleClearExpected = useCallback(() => {
    setExpectedDate(undefined);
  }, []);

  const handleDelete = useCallback(() => {
    if (!isEditing || !editingDebtDomain) {
      return;
    }

    // Check if debt is locked (has linked transactions)
    const deletionCheck = canDeleteDebt(editingDebtDomain.id);
    if (!deletionCheck.canDelete) {
      const linkedTransactions = getDebtTransactions(editingDebtDomain.id);
      Alert.alert(
        'Cannot Delete Debt',
        `This debt cannot be deleted because it has ${linkedTransactions.length} linked transaction(s). Please delete the associated transactions first.`,
        [{ text: 'OK', style: 'cancel' }]
      );
      return;
    }

    Alert.alert(modalStrings.deleteTitle, modalStrings.deleteDescription, [
      {
        text: modalStrings.buttons.cancel,
        style: 'cancel',
      },
      {
        text: modalStrings.buttons.delete,
        style: 'destructive',
        onPress: () => {
          deleteDebt(editingDebtDomain.id);
          handleClose();
        },
      },
    ]);
  }, [deleteDebt, editingDebtDomain, handleClose, isEditing, modalStrings]);

  const handleSelectAccount = useCallback(
    (accountId: string) => {
      const account = accounts.find((acc) => acc.id === accountId);
      if (accountSelectorContext === 'payment') {
        setPaymentAccountId(accountId);
        setPaymentCurrency(getAccountCurrency(account));
      } else {
        setSelectedAccountId(accountId);
        const accountCurrency = getAccountCurrency(account);
        setSelectedCurrency(accountCurrency);
        setPaymentCurrency(accountCurrency);
        if (!isEditing) {
          setDefaultDebtAccount(activeType, accountId);
        }
      }
      accountModalRef.current?.dismiss();
    },
    [accountSelectorContext, accounts, activeType, isEditing, setDefaultDebtAccount],
  );

  const handleCancelCounterpartyEdit = useCallback(() => {
    setEditingCounterpartyId(null);
    setEditingCounterpartyName('');
  }, []);

  const openCounterpartyPicker = useCallback(() => {
    setCounterpartyQuery('');
    handleCancelCounterpartyEdit();
    counterpartyModalRef.current?.present();
  }, [handleCancelCounterpartyEdit]);

  const closeCounterpartyModal = useCallback(() => {
    handleCancelCounterpartyEdit();
    counterpartyModalRef.current?.dismiss();
  }, [handleCancelCounterpartyEdit]);

  const handleSelectCounterparty = useCallback(
    (party: Counterparty) => {
      setSelectedCounterpartyId(party.id);
      setPerson(party.displayName);
      setCounterpartyQuery('');
      closeCounterpartyModal();
    },
    [closeCounterpartyModal],
  );

  const handleAddCounterpartyFromQuery = useCallback(() => {
    const name = counterpartyQuery.trim();
    if (!name) {
      return;
    }
    try {
      const created = createCounterparty(name, { reuseIfExists: false });
      setSelectedCounterpartyId(created.id);
      setPerson(created.displayName);
      setCounterpartyQuery('');
      handleCancelCounterpartyEdit();
      closeCounterpartyModal();
    } catch (error) {
      const message =
        error instanceof Error && error.name === 'COUNTERPARTY_DUPLICATE'
          ? counterpartyActionsStrings.duplicateName
          : counterpartyActionsStrings.renamePlaceholder;
      Alert.alert(counterpartyActionsStrings.renameTitle, message);
    }
  }, [
    counterpartyActionsStrings.duplicateName,
    counterpartyActionsStrings.renamePlaceholder,
    counterpartyActionsStrings.renameTitle,
    counterpartyQuery,
    createCounterparty,
    handleCancelCounterpartyEdit,
    closeCounterpartyModal,
  ]);

  const handleStartEditCounterparty = useCallback((party: Counterparty) => {
    setEditingCounterpartyId(party.id);
    setEditingCounterpartyName(party.displayName);
  }, []);

  const handleSubmitCounterpartyEdit = useCallback(() => {
    if (!editingCounterpartyId) {
      return;
    }
    try {
      renameCounterparty(editingCounterpartyId, editingCounterpartyName);
      handleCancelCounterpartyEdit();
    } catch (error) {
      const message =
        error instanceof Error && error.name === 'COUNTERPARTY_DUPLICATE'
          ? counterpartyActionsStrings.duplicateName
          : counterpartyActionsStrings.renamePlaceholder;
      Alert.alert(counterpartyActionsStrings.renameTitle, message);
    }
  }, [
    counterpartyActionsStrings.duplicateName,
    counterpartyActionsStrings.renamePlaceholder,
    counterpartyActionsStrings.renameTitle,
    editingCounterpartyId,
    editingCounterpartyName,
    handleCancelCounterpartyEdit,
    renameCounterparty,
  ]);

  const handleDeleteCounterpartyInternal = useCallback(
    (counterpartyId: string) => {
      try {
        deleteCounterparty(counterpartyId);
        if (selectedCounterpartyId === counterpartyId) {
          setSelectedCounterpartyId(null);
          setPerson('');
        }
        if (editingCounterpartyId === counterpartyId) {
          handleCancelCounterpartyEdit();
        }
      } catch (error) {
        const message =
          error instanceof Error && error.name === 'COUNTERPARTY_IN_USE'
            ? counterpartyActionsStrings.deleteBlocked
            : counterpartyActionsStrings.deleteBlocked;
        Alert.alert(counterpartyActionsStrings.deleteTitle, message);
      }
    },
    [
      counterpartyActionsStrings.deleteBlocked,
      counterpartyActionsStrings.deleteTitle,
      deleteCounterparty,
      editingCounterpartyId,
      handleCancelCounterpartyEdit,
      selectedCounterpartyId,
    ],
  );

  const handleConfirmDeleteCounterparty = useCallback(
    (party: Counterparty) => {
      Alert.alert(
        counterpartyActionsStrings.deleteTitle,
        counterpartyActionsStrings.deleteDescription,
        [
          {
            text: renameCancelLabel,
            style: 'cancel',
          },
          {
            text: deleteConfirmLabel,
            style: 'destructive',
            onPress: () => handleDeleteCounterpartyInternal(party.id),
          },
        ],
      );
    },
    [
      counterpartyActionsStrings.deleteDescription,
      counterpartyActionsStrings.deleteTitle,
      deleteConfirmLabel,
      handleDeleteCounterpartyInternal,
      renameCancelLabel,
    ],
  );

  const handleSelectCurrency = useCallback(
    (currency: FinanceCurrency) => {
      if (currencySelectorContext === 'payment') {
        setPaymentCurrency(currency);
      } else {
        setSelectedCurrency(currency);
      }
      currencyModalRef.current?.dismiss();
    },
    [currencySelectorContext],
  );

  const handlePaymentAmountChange = useCallback((value: string) => {
    const { formatted, numeric } = formatAmountInputValue(value);
    setPaymentAmountInput(formatted);
    setPaymentAmountValue(numeric);
  }, []);

  const handleFundingOverrideChange = useCallback((value: string) => {
    const { formatted, numeric } = formatAmountInputValue(value);
    setFundingOverrideInput(formatted);
    setFundingOverrideValue(numeric);
  }, []);

  const handleManualFundingToggle = useCallback(
    (value: boolean) => {
      setManualFundingEnabled(value);
      if (!value) {
        const source = Number.isFinite(autoFundingAmount) ? `${autoFundingAmount}` : '';
        const { formatted, numeric } = formatAmountInputValue(source);
        setFundingOverrideInput(formatted);
        setFundingOverrideValue(numeric);
      }
    },
    [autoFundingAmount],
  );

  const handleOpenFullPaymentModal = useCallback(() => {
    if (!isEditing || !editingDebt) {
      return;
    }
    fullPaymentModalRef.current?.present();
  }, [editingDebt, isEditing]);

  const shouldCloseContext = debtModal.isOpen && !debtModal.showPrimarySheet;

  const closeShortcutContext = useCallback(() => {
    if (shouldCloseContext) {
      handleClose();
    }
  }, [handleClose, shouldCloseContext]);

  const handleCloseFullPaymentModal = useCallback(() => {
    fullPaymentModalRef.current?.dismiss();
    closeShortcutContext();
  }, [closeShortcutContext]);

  const handleOpenPartialPaymentModal = useCallback(() => {
    if (!isEditing) {
      return;
    }
    paymentModalRef.current?.present();
  }, [isEditing]);

  const handleClosePaymentModal = useCallback(() => {
    paymentModalRef.current?.dismiss();
    closeShortcutContext();
  }, [closeShortcutContext]);

  const handleOpenScheduleModal = useCallback(() => {
    if (!isEditing) {
      return;
    }
    scheduleModalRef.current?.present();
  }, [isEditing]);

  const handleCloseScheduleModal = useCallback(() => {
    scheduleModalRef.current?.dismiss();
    closeShortcutContext();
  }, [closeShortcutContext]);

  const handleOpenReminderModal = useCallback(() => {
    if (!isEditing) {
      return;
    }
    reminderModalRef.current?.present();
  }, [isEditing]);

  const handleCloseReminderModal = useCallback(() => {
    reminderModalRef.current?.dismiss();
    closeShortcutContext();
  }, [closeShortcutContext]);

  const handleRecordPayment = useCallback(() => {
    if (!isEditing || !editingDebtDomain || !editingDebt || !paymentAccountId || paymentAmountValue <= 0) {
      return;
    }

    if (paymentAmountValue > outstandingInPaymentCurrency) {
      Alert.alert(
        paymentStrings.amount,
        paymentStrings.limitError ?? 'Payment exceeds remaining amount',
      );
      return;
    }

    const debtCurrency = editingDebt.currency;
    const debtBaseCurrency = (editingDebtDomain.baseCurrency ?? debtCurrency) as FinanceCurrency;
    const convertedAmountToDebt = convertAmount(
      paymentAmountValue,
      paymentCurrency,
      debtCurrency,
    );
    const convertedAmountToBase = convertAmount(
      paymentAmountValue,
      paymentCurrency,
      debtBaseCurrency,
    );
    const rateUsedToDebt =
      paymentAmountValue !== 0 ? convertedAmountToDebt / paymentAmountValue : 1;
    const rateUsedToBase =
      paymentAmountValue !== 0 ? convertedAmountToBase / paymentAmountValue : 1;

    addDebtPayment({
      debtId: editingDebtDomain.id,
      amount: paymentAmountValue,
      currency: paymentCurrency,
      accountId: paymentAccountId,
      paymentDate: new Date().toISOString(),
      rateUsedToDebt,
      rateUsedToBase,
      note: paymentNote.trim() || undefined,
    });

    setPaymentAmountInput('');
    setPaymentAmountValue(0);
    setPaymentNote('');
    handleClosePaymentModal();
  }, [
    addDebtPayment,
    editingDebtDomain,
    editingDebt,
    handleClosePaymentModal,
    isEditing,
    convertAmount,
    outstandingInPaymentCurrency,
    paymentAccountId,
    paymentAmountValue,
    paymentCurrency,
    paymentNote,
    paymentStrings.amount,
    paymentStrings.limitError,
  ]);

  const fullPaymentCurrency = editingDebt?.currency ?? selectedCurrency;
  const formattedFullPaymentAmount = formatCurrencyValue(
    editingDebt?.remainingAmount ?? 0,
    fullPaymentCurrency,
  );
  const fullPaymentDescriptionText = (
    modalStrings.fullPaymentDescription ?? 'You will pay {amount}.'
  ).replace('{amount}', formattedFullPaymentAmount);

  const isFullPaymentDisabled =
    !editingDebt || editingDebt.remainingAmount <= 0 || !(paymentAccountId ?? selectedAccountId);

  const handleFullPayment = useCallback(() => {
    if (!isEditing || !editingDebt || !editingDebtDomain) {
      return;
    }
    const targetAccountId = paymentAccountId ?? selectedAccountId ?? accounts[0]?.id ?? null;
    if (!targetAccountId) {
      Alert.alert(modalStrings.accountLabel, modalStrings.accountHelper);
      return;
    }
    if (editingDebt.remainingAmount <= 0) {
      handleCloseFullPaymentModal();
      return;
    }

    const debtCurrency = editingDebt.currency;
    const debtBaseCurrency = (editingDebtDomain.baseCurrency ?? debtCurrency) as FinanceCurrency;
    const convertedAmountToBase = convertAmount(
      editingDebt.remainingAmount,
      debtCurrency,
      debtBaseCurrency,
    );
    const rateUsedToBase =
      editingDebt.remainingAmount !== 0
        ? convertedAmountToBase / editingDebt.remainingAmount
        : 1;

    addDebtPayment({
      debtId: editingDebtDomain.id,
      amount: editingDebt.remainingAmount,
      currency: editingDebt.currency,
      accountId: targetAccountId,
      paymentDate: new Date().toISOString(),
      rateUsedToDebt: 1,
      rateUsedToBase,
      note: fullPaymentDescriptionText,
    });

    handleCloseFullPaymentModal();
  }, [
    accounts,
    addDebtPayment,
    editingDebt,
    editingDebtDomain,
    convertAmount,
    fullPaymentDescriptionText,
    handleCloseFullPaymentModal,
    isEditing,
    modalStrings.accountHelper,
    modalStrings.accountLabel,
    paymentAccountId,
    selectedAccountId,
  ]);

  const handleReminderTimeChange = useCallback((value: string) => {
    const sanitized = value.replace(/[^0-9:]/g, '').slice(0, 5);
    setReminderTime(sanitized);
  }, []);

  const handleToggleReminder = useCallback((value: boolean) => {
    setReminderEnabled(value);
  }, []);

  const handleSaveSchedule = useCallback(() => {
    if (!isEditing || !editingDebtDomain) {
      return;
    }
    updateDebt(editingDebtDomain.id, { dueDate: scheduleDate.toISOString() });
    setExpectedDate(scheduleDate);
    handleCloseScheduleModal();
  }, [editingDebtDomain, handleCloseScheduleModal, isEditing, scheduleDate, updateDebt]);

  const handleSaveReminder = useCallback(() => {
    if (!isEditing || !editingDebtDomain) {
      return;
    }
    updateDebt(editingDebtDomain.id, {
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : undefined,
    });
    handleCloseReminderModal();
  }, [
    editingDebtDomain,
    handleCloseReminderModal,
    isEditing,
    reminderEnabled,
    reminderTime,
    updateDebt,
  ]);

  useEffect(() => {
    if (!debtModal.isOpen || !debtModal.initialFocus) {
      return;
    }

    switch (debtModal.initialFocus) {
      case 'full':
        handleOpenFullPaymentModal();
        break;
      case 'partial':
        handleOpenPartialPaymentModal();
        break;
      case 'schedule':
        handleOpenScheduleModal();
        break;
      case 'reminder':
        handleOpenReminderModal();
        break;
      default:
        break;
    }

    consumeDebtModalFocus();
  }, [
    consumeDebtModalFocus,
    debtModal.initialFocus,
    debtModal.isOpen,
    handleOpenFullPaymentModal,
    handleOpenPartialPaymentModal,
    handleOpenReminderModal,
    handleOpenScheduleModal,
  ]);

  return (
    <>
      <CustomModal ref={modalRef} onDismiss={handleCancel} {...modalProps}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {isEditing ? 'EDIT DEBT' : 'NEW DEBT'}
              </Text>
            </View>

            {/* Type Switcher */}
            <View style={styles.section}>
              <AdaptiveGlassView style={styles.typeContainer}>
                <Pressable
                  onPress={() => setActiveType('borrowed')}
                  style={({ pressed }) => [
                    styles.typeOption,
                    { borderBottomWidth: 1 },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.typeOptionContent}>
                    <Text
                      style={[
                        styles.typeLabel,
                        { color: activeType === 'borrowed' ? '#FFFFFF' : '#7E8B9A' },
                      ]}
                    >
                      {modalStrings.toggles.outgoing}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setActiveType('lent')}
                  style={({ pressed }) => [styles.typeOption, pressed && styles.pressed]}
                >
                  <View style={styles.typeOptionContent}>
                    <Text
                      style={[
                        styles.typeLabel,
                        { color: activeType === 'lent' ? '#FFFFFF' : '#7E8B9A' },
                      ]}
                    >
                      {modalStrings.toggles.incoming}
                    </Text>
                  </View>
                </Pressable>
              </AdaptiveGlassView>
            </View>

            {/* Person */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{personLabel}</Text>
              <Pressable
                onPress={openCounterpartyPicker}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <AdaptiveGlassView style={styles.inputContainer}>
                  <View style={styles.accountRow}>
                      <Text
                        style={[
                          styles.textInput,
                          !selectedCounterpartyName && styles.placeholderText,
                        ]}
                      >
                        {selectedCounterpartyName || personPlaceholder}
                      </Text>
                    <Ionicons name="chevron-forward" size={18} color="#7E8B9A" />
                  </View>
                </AdaptiveGlassView>
              </Pressable>
              {!selectedCounterpartyId ? (
                <Text style={styles.helperText}>{personPlaceholder}</Text>
              ) : null}
            </View>

            {/* Amount */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{modalStrings.amount}</Text>
              <AdaptiveGlassView style={styles.inputContainer}>
                <TextInput
                  value={amountInput}
                  onChangeText={handleAmountChange}
                  placeholder="Amount"
                  placeholderTextColor="#7E8B9A"
                  keyboardType="numeric"
                  style={styles.textInput}
                />
              </AdaptiveGlassView>
            </View>

            {/* Account */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>{accountLabel}</Text>
              <Pressable
                onPress={() => {
                  setAccountSelectorContext('debt');
                  accountModalRef.current?.present();
                }}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <AdaptiveGlassView style={styles.inputContainer}>
                  <View style={styles.accountRow}>
                    <Text style={styles.textInput}>
                      {selectedAccount?.name ?? modalStrings.selectAccount}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#7E8B9A" />
                  </View>
                </AdaptiveGlassView>
              </Pressable>
              {accountHelperText ? (
                <Text style={styles.helperText}>{accountHelperText}</Text>
              ) : null}
            </View>

            {/* Currency */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{modalStrings.currencyLabel}</Text>
              <Pressable
                onPress={() => {
                  setCurrencySelectorContext('debt');
                  currencyModalRef.current?.present();
                }}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <AdaptiveGlassView style={styles.inputContainer}>
                  <View style={styles.accountRow}>
                    <Text style={styles.textInput}>{selectedCurrency}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#7E8B9A" />
                  </View>
                </AdaptiveGlassView>
              </Pressable>
              {currencyFlowText ? (
                <Text style={styles.helperText}>{currencyFlowText}</Text>
              ) : null}
            </View>

            {hasCurrencyMismatch && (
              <View style={styles.section}>
                <View style={styles.manualRateHeader}>
                  <Text style={styles.sectionLabel}>{manualRateStrings.title}</Text>
                  <View style={styles.manualRateToggleRow}>
                    <Text style={styles.manualRateToggleLabel}>{manualRateStrings.toggle}</Text>
                    <Switch
                      value={manualFundingEnabled}
                      onValueChange={handleManualFundingToggle}
                    />
                  </View>
                </View>
                {manualDescription ? (
                  <Text style={styles.manualRateDescription}>{manualDescription}</Text>
                ) : null}
                <Text style={styles.sectionLabel}>{manualAmountLabel}</Text>
                {manualFundingEnabled ? (
                  <AdaptiveGlassView style={styles.inputContainer}>
                    <BottomSheetTextInput
                      value={fundingOverrideInput}
                      onChangeText={handleFundingOverrideChange}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#7E8B9A"
                      style={styles.textInput}
                    />
                  </AdaptiveGlassView>
                ) : (
                  <AdaptiveGlassView
                    style={[styles.inputContainer, styles.manualRateReadonlySurface]}
                  >
                    <Text style={styles.manualRateReadonlyValue}>
                      {formatCurrencyValue(autoFundingAmount, accountCurrency)}
                    </Text>
                  </AdaptiveGlassView>
                )}
              </View>
            )}

            {/* Date & Time */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{modalStrings.dateLabel}</Text>
              <View style={styles.dateTimeRow}>
                <Pressable
                  onPress={() => openDateTimePicker('date', 'date')}
                  style={({ pressed }) => [styles.dateTimeButton, pressed && styles.pressed]}
                >
                  <AdaptiveGlassView style={styles.dateTimeChip}>
                    <Ionicons name="calendar-outline" size={18} color="#7E8B9A" />
                    <Text style={styles.dateTimeText}>{dateLabel}</Text>
                  </AdaptiveGlassView>
                </Pressable>
                <Pressable
                  onPress={() => openDateTimePicker('date', 'time')}
                  style={({ pressed }) => [styles.dateTimeButton, pressed && styles.pressed]}
                >
                  <AdaptiveGlassView style={styles.dateTimeChip}>
                    <Ionicons name="time-outline" size={18} color="#7E8B9A" />
                    <Text style={styles.dateTimeText}>{timeLabel}</Text>
                  </AdaptiveGlassView>
                </Pressable>
              </View>
            </View>

            {/* Expected Return Date */}
            <View style={styles.section}>
              <View style={styles.expectedHeader}>
                <Text style={styles.sectionLabel}>{modalStrings.expectedReturn}</Text>
                {expectedDate && (
                  <Pressable onPress={handleClearExpected} hitSlop={8}>
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                )}
              </View>
              <Pressable
                onPress={() => openDateTimePicker('expected', 'date')}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <AdaptiveGlassView style={styles.dateTimeChip}>
                  <Ionicons name="calendar-outline" size={18} color="#7E8B9A" />
                  <Text
                    style={[
                      styles.dateTimeText,
                      { color: expectedDate ? '#FFFFFF' : '#7E8B9A' },
                    ]}
                  >
                    {expectedDateLabel}
                  </Text>
                </AdaptiveGlassView>
              </Pressable>
            </View>

            {/* Note */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{modalStrings.note}</Text>
              <AdaptiveGlassView style={styles.noteContainer}>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder={modalStrings.notePlaceholder}
                  placeholderTextColor="#7E8B9A"
                  multiline
                  style={styles.noteInput}
                />
              </AdaptiveGlassView>
            </View>

            {/* Quick Actions - only in edit mode */}
            {isEditing && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Quick actions</Text>
                <View style={styles.quickActionsGrid}>
                  <Pressable
                    onPress={handleOpenFullPaymentModal}
                    style={({ pressed }) => [pressed && styles.pressed]}
                  >
                    <AdaptiveGlassView style={styles.quickActionCard}>
                      <Ionicons name="card-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.quickActionText}>{actionButtons.pay}</Text>
                    </AdaptiveGlassView>
                  </Pressable>

                  <Pressable
                    onPress={handleOpenPartialPaymentModal}
                    style={({ pressed }) => [pressed && styles.pressed]}
                  >
                    <AdaptiveGlassView style={styles.quickActionCard}>
                      <Ionicons name="swap-vertical-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.quickActionText}>{actionButtons.partial}</Text>
                    </AdaptiveGlassView>
                  </Pressable>

                  <Pressable
                    onPress={handleOpenScheduleModal}
                    style={({ pressed }) => [pressed && styles.pressed]}
                  >
                    <AdaptiveGlassView style={styles.quickActionCard}>
                      <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.quickActionText}>{actionButtons.schedule}</Text>
                    </AdaptiveGlassView>
                  </Pressable>

                  <Pressable
                    onPress={handleOpenReminderModal}
                    style={({ pressed }) => [pressed && styles.pressed]}
                  >
                    <AdaptiveGlassView style={styles.quickActionCard}>
                      <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.quickActionText}>{actionButtons.notify}</Text>
                    </AdaptiveGlassView>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                onPress={handleCancel}
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
                  style={[
                    styles.primaryButtonInner,
                    { opacity: isSaveDisabled ? 0.4 : 1 },
                  ]}
                >
                  <Text
                    style={[
                      styles.primaryButtonText,
                      { color: isSaveDisabled ? '#7E8B9A' : '#FFFFFF' },
                    ]}
                  >
                    {isEditing ? modalStrings.buttons.saveChanges : modalStrings.buttons.save}
                  </Text>
                </AdaptiveGlassView>
              </Pressable>
            </View>

            {/* Delete Button */}
            {isEditing && (() => {
              const isLocked = editingDebtDomain ? isDebtLocked(editingDebtDomain.id) : false;
              const linkedCount = isLocked ? getDebtTransactions(editingDebtDomain!.id).length : 0;

              return (
                <View>
                  <Pressable
                    onPress={handleDelete}
                    style={({ pressed }) => [
                      styles.deleteButton,
                      isLocked && styles.deleteButtonLocked,
                      pressed && !isLocked && styles.pressed
                    ]}
                  >
                    <View style={styles.deleteButtonContent}>
                      {isLocked && (
                        <Ionicons name="lock-closed" size={16} color="#7E8B9A" style={{ marginRight: 6 }} />
                      )}
                      <Text style={[styles.deleteButtonText, isLocked && styles.deleteButtonTextLocked]}>
                        {modalStrings.buttons.delete}
                      </Text>
                    </View>
                  </Pressable>
                  {isLocked && (
                    <Text style={styles.lockNotice}>
                      Linked to {linkedCount} transaction{linkedCount > 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
              );
            })()}
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

      {/* Full Payment Modal */}
      <CustomModal
        ref={fullPaymentModalRef}
        variant="form"
        fallbackSnapPoint="50%"
        onDismiss={handleCloseFullPaymentModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {modalStrings.fullPaymentTitle ?? 'Pay debt in full'}
            </Text>
            <Pressable onPress={handleCloseFullPaymentModal} hitSlop={10}>
              <Ionicons name="close" size={22} color="#7E8B9A" />
            </Pressable>
          </View>

          <Text style={styles.fullPaymentDescription}>{fullPaymentDescriptionText}</Text>

          <Pressable
            onPress={() => {
              setAccountSelectorContext('payment');
              accountModalRef.current?.present();
            }}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <AdaptiveGlassView style={styles.inputContainer}>
              <View style={styles.accountRow}>
                <Text style={styles.textInput}>
                  {paymentAccount?.name ?? modalStrings.selectAccount}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#7E8B9A" />
              </View>
            </AdaptiveGlassView>
          </Pressable>

          <Pressable
            disabled={isFullPaymentDisabled || !editingDebt}
            onPress={handleFullPayment}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && !(isFullPaymentDisabled || !editingDebt) && styles.pressed,
            ]}
          >
            <AdaptiveGlassView
              style={[
                styles.primaryButtonInner,
                { opacity: isFullPaymentDisabled || !editingDebt ? 0.4 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  {
                    color: isFullPaymentDisabled || !editingDebt ? '#7E8B9A' : '#FFFFFF',
                  },
                ]}
              >
                {modalStrings.fullPaymentSubmit ?? 'Pay in full'}
              </Text>
            </AdaptiveGlassView>
          </Pressable>
        </View>
      </CustomModal>

      {/* Partial Payment Modal */}
      <CustomModal
        ref={paymentModalRef}
        variant="form"
        fallbackSnapPoint="70%"
        onDismiss={handleClosePaymentModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{paymentStrings.title}</Text>
              <Pressable onPress={handleClosePaymentModal} hitSlop={10}>
                <Ionicons name="close" size={22} color="#7E8B9A" />
              </Pressable>
            </View>

            <AdaptiveGlassView style={styles.inputContainer}>
              <TextInput
                value={paymentAmountInput}
                onChangeText={handlePaymentAmountChange}
                placeholder="Payment amount"
                placeholderTextColor="#7E8B9A"
                keyboardType="numeric"
                style={styles.textInput}
              />
            </AdaptiveGlassView>

            <Pressable
              onPress={() => {
                setAccountSelectorContext('payment');
                accountModalRef.current?.present();
              }}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <AdaptiveGlassView style={styles.inputContainer}>
                <View style={styles.accountRow}>
                  <Text style={styles.textInput}>
                    {paymentAccount?.name ?? modalStrings.selectAccount}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#7E8B9A" />
                </View>
              </AdaptiveGlassView>
            </Pressable>

            <AdaptiveGlassView style={styles.noteContainer}>
              <TextInput
                value={paymentNote}
                onChangeText={setPaymentNote}
                placeholder={paymentStrings.note}
                placeholderTextColor="#7E8B9A"
                multiline
                style={styles.noteInput}
              />
            </AdaptiveGlassView>

            <Pressable
              disabled={isPaymentDisabled}
              onPress={handleRecordPayment}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && !isPaymentDisabled && styles.pressed,
              ]}
            >
              <AdaptiveGlassView
                style={[
                  styles.primaryButtonInner,
                  { opacity: isPaymentDisabled ? 0.4 : 1 },
                ]}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    { color: isPaymentDisabled ? '#7E8B9A' : '#FFFFFF' },
                  ]}
                >
                  {paymentStrings.submit}
                </Text>
              </AdaptiveGlassView>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </CustomModal>

      {/* Schedule Modal */}
      <CustomModal
        ref={scheduleModalRef}
        variant="form"
        fallbackSnapPoint="45%"
        onDismiss={handleCloseScheduleModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {modalStrings.scheduleTitle ?? 'Repayment schedule'}
            </Text>
            <Pressable onPress={handleCloseScheduleModal} hitSlop={10}>
              <Ionicons name="close" size={22} color="#7E8B9A" />
            </Pressable>
          </View>

          <Pressable
            onPress={() => openDateTimePicker('schedule', 'date')}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <AdaptiveGlassView style={styles.dateTimeChip}>
              <Ionicons name="calendar-outline" size={18} color="#7E8B9A" />
              <Text style={styles.dateTimeText}>{scheduleDateLabel}</Text>
            </AdaptiveGlassView>
          </Pressable>

          <Pressable
            onPress={handleSaveSchedule}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <AdaptiveGlassView style={styles.primaryButtonInner}>
              <Text style={styles.primaryButtonText}>
                {modalStrings.buttons.saveChanges}
              </Text>
            </AdaptiveGlassView>
          </Pressable>
        </View>
      </CustomModal>

      {/* Reminder Modal */}
      <CustomModal
        ref={reminderModalRef}
        variant="form"
        fallbackSnapPoint="55%"
        onDismiss={handleCloseReminderModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {modalStrings.reminderTitle ?? 'Reminders'}
            </Text>
            <Pressable onPress={handleCloseReminderModal} hitSlop={10}>
              <Ionicons name="close" size={22} color="#7E8B9A" />
            </Pressable>
          </View>

          <AdaptiveGlassView style={styles.reminderRow}>
            <Text style={styles.reminderLabel}>
              {modalStrings.reminderToggle ?? 'Enable notification'}
            </Text>
            <Switch value={reminderEnabled} onValueChange={handleToggleReminder} />
          </AdaptiveGlassView>

          {reminderEnabled && (
            <AdaptiveGlassView style={styles.inputContainer}>
              <TextInput
                value={reminderTime}
                onChangeText={handleReminderTimeChange}
                placeholder="09:00"
                placeholderTextColor="#7E8B9A"
                keyboardType="numeric"
                style={styles.textInput}
              />
            </AdaptiveGlassView>
          )}

          <Pressable
            onPress={handleSaveReminder}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <AdaptiveGlassView style={styles.primaryButtonInner}>
              <Text style={styles.primaryButtonText}>
                {modalStrings.buttons.saveChanges}
              </Text>
            </AdaptiveGlassView>
          </Pressable>
        </View>
      </CustomModal>

      {/* Counterparty Picker */}
      <CustomModal ref={counterpartyModalRef} variant="form" fallbackSnapPoint="65%">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{counterpartyPickerTitle}</Text>
            <Pressable onPress={closeCounterpartyModal} hitSlop={10}>
              <Ionicons name="close" size={22} color="#7E8B9A" />
            </Pressable>
          </View>

          <AdaptiveGlassView style={styles.searchContainer}>
            <Ionicons name="search" size={16} color="#7E8B9A" />
            <TextInput
              value={counterpartyQuery}
              onChangeText={setCounterpartyQuery}
              placeholder={counterpartySearchPlaceholder}
              placeholderTextColor="#7E8B9A"
              style={styles.searchInput}
            />
          </AdaptiveGlassView>

          {counterpartyAddLabel ? (
            <Pressable
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
              onPress={handleAddCounterpartyFromQuery}
            >
              <Text style={styles.addButtonText}>{counterpartyAddLabel}</Text>
            </Pressable>
          ) : null}

          {filteredCounterparties.length > 0 ? (
            <View style={styles.accountList}>
              {filteredCounterparties.map((party) => {
                const selected = party.id === selectedCounterpartyId;
                return (
                  <AdaptiveGlassView
                    key={party.id}
                    style={[
                      styles.accountItem,
                      { opacity: selected ? 1 : 0.7 },
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleSelectCounterparty(party)}
                      style={styles.counterpartyPressArea}
                    >
                      <View style={styles.counterpartyInfo}>
                        <Text style={styles.textInput}>{party.displayName}</Text>
                        {selected && (
                          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                        )}
                      </View>
                      <View style={styles.counterpartyActionsRow}>
                        <Pressable
                          hitSlop={12}
                          style={styles.counterpartyActionButton}
                          onPress={(event) => {
                            event.stopPropagation();
                            handleStartEditCounterparty(party);
                          }}
                        >
                          <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                        </Pressable>
                        <Pressable
                          hitSlop={12}
                          style={styles.counterpartyActionButton}
                          onPress={(event) => {
                            event.stopPropagation();
                            handleConfirmDeleteCounterparty(party);
                          }}
                        >
                          <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                        </Pressable>
                      </View>
                    </TouchableOpacity>
                  </AdaptiveGlassView>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyState}>{counterpartyEmptyLabel}</Text>
          )}

          {editingCounterpartyId && (
            <AdaptiveGlassView style={styles.counterpartyEditContainer}>
              <Text style={styles.sectionLabel}>{counterpartyActionsStrings.renameTitle}</Text>
              <TextInput
                value={editingCounterpartyName}
                onChangeText={setEditingCounterpartyName}
                placeholder={counterpartyActionsStrings.renamePlaceholder}
                placeholderTextColor="#7E8B9A"
                style={styles.textInput}
              />
              <View style={styles.editButtonsRow}>
                <Pressable
                  style={({ pressed }) => [styles.editButtonSecondary, pressed && styles.pressed]}
                  onPress={handleCancelCounterpartyEdit}
                >
                  <Text style={styles.editButtonTextSecondary}>{renameCancelLabel}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.editButtonPrimary, pressed && styles.pressed]}
                  onPress={handleSubmitCounterpartyEdit}
                >
                  <Text style={styles.editButtonTextPrimary}>{renameSaveLabel}</Text>
                </Pressable>
              </View>
            </AdaptiveGlassView>
          )}
        </View>
      </CustomModal>

      {/* Account Picker Modal */}
      <CustomModal ref={accountModalRef} variant="form" fallbackSnapPoint="50%">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{modalStrings.accountPickerTitle}</Text>
            <Pressable onPress={() => accountModalRef.current?.dismiss()} hitSlop={10}>
              <Ionicons name="close" size={22} color="#7E8B9A" />
            </Pressable>
          </View>

          <View style={styles.accountList}>
            {accounts.map((account) => {
              const selected = account.id === selectedAccountId;
              return (
                <Pressable
                  key={account.id}
                  onPress={() => handleSelectAccount(account.id)}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <AdaptiveGlassView
                    style={[
                      styles.accountItem,
                      { opacity: selected ? 1 : 0.7 },
                    ]}
                  >
                    <View>
                      <Text style={[styles.textInput, { marginBottom: 4 }]}>
                        {account.name}
                      </Text>
                      <Text style={styles.accountBalance}>
                        {getAccountCurrency(account)} • {account.accountType ?? 'account'}
                      </Text>
                    </View>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    )}
                  </AdaptiveGlassView>
                </Pressable>
              );
            })}
          </View>
        </View>
      </CustomModal>

      {/* Currency Picker Modal */}
      <CustomModal ref={currencyModalRef} variant="form" fallbackSnapPoint="40%">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{modalStrings.currencyPickerTitle}</Text>
            <Pressable onPress={() => currencyModalRef.current?.dismiss()} hitSlop={10}>
              <Ionicons name="close" size={22} color="#7E8B9A" />
            </Pressable>
          </View>

          <View style={styles.accountList}>
            {AVAILABLE_FINANCE_CURRENCIES.map((currency) => {
              const selected = currency === selectedCurrency;
              return (
                <Pressable
                  key={currency}
                  onPress={() => handleSelectCurrency(currency)}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <AdaptiveGlassView
                    style={[
                      styles.accountItem,
                      { opacity: selected ? 1 : 0.7 },
                    ]}
                  >
                    <Text style={styles.textInput}>{currency}</Text>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    )}
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
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  typeContainer: {
    borderRadius: 16,
  },
  typeOption: {
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  typeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '400',
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
  placeholderText: {
    color: '#7E8B9A',
  },
  manualRateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  manualRateToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manualRateToggleLabel: {
    fontSize: 12,
    color: '#7E8B9A',
  },
  manualRateDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  manualRateReadonlySurface: {
    justifyContent: 'center',
  },
  manualRateReadonlyValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  expectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  removeText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#7E8B9A',
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
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '48%',
    minWidth: 150,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
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
  deleteButton: {
    marginTop: 16,
    paddingVertical: 16,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteButtonLocked: {
    opacity: 0.5,
  },
  deleteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  deleteButtonTextLocked: {
    color: '#7E8B9A',
  },
  lockNotice: {
    fontSize: 12,
    color: '#7E8B9A',
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
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
    gap: 16,
  },
  searchContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
  },
  addButton: {
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    textAlign: 'center',
    fontSize: 13,
    color: '#7E8B9A',
    marginTop: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fullPaymentDescription: {
    fontSize: 14,
    color: '#7E8B9A',
  },
  accountList: {
    gap: 12,
  },
  accountItem: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterpartyPressArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  counterpartyInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 8,
  },
  counterpartyActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  counterpartyActionButton: {
    padding: 6,
  },
  accountBalance: {
    fontSize: 13,
    fontWeight: '400',
    color: '#7E8B9A',
  },
  reminderRow: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  counterpartyEditContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  editButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editButtonSecondary: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  editButtonPrimary: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  editButtonTextSecondary: {
    fontSize: 14,
    color: '#7E8B9A',
  },
  editButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
