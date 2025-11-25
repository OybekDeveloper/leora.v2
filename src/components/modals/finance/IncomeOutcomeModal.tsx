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
import { Wallet } from 'lucide-react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import CustomModal, { CustomModalProps } from '@/components/modals/CustomModal';
import { BottomSheetHandle } from '@/components/modals/BottomSheet';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import {
  FINANCE_CATEGORIES,
  FinanceCategory,
  getCategoriesForType,
} from '@/constants/financeCategories';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useFinancePreferencesStore } from '@/stores/useFinancePreferencesStore';
import { useModalStore } from '@/stores/useModalStore';
import { useTranslation } from '../../../utils/localization';
import type { Transaction as LegacyTransaction } from '@/types/store.types';
import { useShallow } from 'zustand/react/shallow';

type IncomeOutcomeTab = 'income' | 'outcome';

interface CategoryModalState {
  mode: 'add' | 'edit';
  baseValue?: string;
}

const modalProps: Partial<CustomModalProps> = {
  variant: 'form',
  enableDynamicSizing: false,
  fallbackSnapPoint: '96%',
  scrollable: true,
  scrollProps: { keyboardShouldPersistTaps: 'handled' },
  contentContainerStyle: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
};

type IncomeOutcomeModalProps = {
  onRequestClose?: () => void;
};

export default function IncomeOutcomeModal({ onRequestClose }: IncomeOutcomeModalProps) {
  const modalRef = useRef<BottomSheetHandle>(null);
  const categoryModalRef = useRef<BottomSheetHandle>(null);
  const accountModalRef = useRef<BottomSheetHandle>(null);

  const { t } = useTranslation();

  const incomeOutcome = useModalStore((state) => state.incomeOutcome);
  const closeIncomeOutcome = useModalStore((state) => state.closeIncomeOutcome);
  const baseCurrency = useFinancePreferencesStore((state) => state.baseCurrency);

  const {
    accounts,
    categories,
    createTransaction,
    updateTransaction,
    addCategory,
    renameCategory,
  } = useFinanceDomainStore(
    useShallow((state) => ({
      accounts: state.accounts,
      categories: state.categories,
      createTransaction: state.createTransaction,
      updateTransaction: state.updateTransaction,
      addCategory: state.addCategory,
      renameCategory: state.renameCategory,
    })),
  );

  const [activeTab, setActiveTab] = useState<IncomeOutcomeTab>('income');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [categoryModalState, setCategoryModalState] = useState<CategoryModalState | null>(null);
  const [categoryDraft, setCategoryDraft] = useState('');
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [debtPerson, setDebtPerson] = useState('');

  const isEditing = Boolean(
    incomeOutcome.mode === 'edit' && incomeOutcome.transaction?.type !== 'transfer'
  );
  const editingTransaction = incomeOutcome.transaction as LegacyTransaction | undefined;

  const isDebtCategory = useMemo(() => {
    if (!selectedCategory) return false;
    const lower = selectedCategory.toLowerCase();
    return lower === 'debt' || lower === 'debts' || lower.includes('долг');
  }, [selectedCategory]);

  const availableCategories = useMemo(() => {
    const baseList = getCategoriesForType(activeTab);
    const aggregated = new Map<string, FinanceCategory & { isCustom?: boolean }>();
    baseList.forEach((category) => aggregated.set(category.name, category));

    categories.forEach((name) => {
      if (!aggregated.has(name)) {
        const fallback = FINANCE_CATEGORIES.find((cat) => cat.name === name);
        aggregated.set(name, {
          id: `custom-${name}`,
          name,
          type: 'both',
          colorToken: fallback?.colorToken ?? 'primary',
          icon: fallback?.icon ?? Wallet,
          isCustom: true,
        });
      }
    });

    return Array.from(aggregated.values());
  }, [activeTab, categories]);

  useEffect(() => {
    if (incomeOutcome.isOpen) {
      modalRef.current?.present();
    } else {
      modalRef.current?.dismiss();
    }
  }, [incomeOutcome.isOpen]);

  const resetForm = useCallback(
    (tab: IncomeOutcomeTab = 'income') => {
      setActiveTab(tab);
      setAmount('');
      setSelectedCategory(null);
      setSelectedAccount(accounts[0]?.id ?? null);
      setTransactionDate(new Date());
      setNote('');
      setDebtPerson('');
      setPickerMode(null);
    },
    [accounts]
  );

  useEffect(() => {
    if (incomeOutcome.isOpen) {
      const transaction = incomeOutcome.transaction;
      const fallbackTab = incomeOutcome.initialTab ?? 'income';

      if (transaction && transaction.type !== 'transfer') {
        const tab = transaction.type ?? 'income';
        resetForm(tab);
        setAmount(transaction.amount.toString());
        setSelectedCategory(transaction.category ?? null);
        setSelectedAccount(transaction.accountId);
        setTransactionDate(new Date(transaction.date));

        // Парсим note для извлечения информации о долге
        const noteText = transaction.note ?? transaction.description ?? '';
        const debtRegex = tab === 'income'
          ? /^(.+?) owes me\.?\s?(.*)$/i
          : /^I owe to (.+?)\.?\s?(.*)$/i;
        const match = noteText.match(debtRegex);

        if (match) {
          setDebtPerson(match[1].trim());
          setNote(match[2]?.trim() ?? '');
        } else {
          setNote(noteText);
        }
      } else {
        resetForm(fallbackTab);
      }
    } else {
      resetForm('income');
    }
  }, [incomeOutcome, resetForm]);

  useEffect(() => {
    if (!selectedCategory) {
      return;
    }
    const exists = availableCategories.some((category) => category.name === selectedCategory);
    if (!exists) {
      setSelectedCategory(null);
    }
  }, [availableCategories, selectedCategory]);

  useEffect(() => {
    // Сбрасываем debtPerson если категория больше не Debt
    if (!isDebtCategory && debtPerson) {
      setDebtPerson('');
    }
  }, [isDebtCategory, debtPerson]);

  const formatCurrency = useCallback((value: number, currency: string = 'USD') => {
    try {
      return new Intl.NumberFormat(
        currency === 'UZS' ? 'uz-UZ' : 'en-US',
        {
          style: 'currency',
          currency,
          maximumFractionDigits: currency === 'UZS' ? 0 : 2,
        }
      ).format(value);
    } catch {
      return `${currency} ${value.toFixed(2)}`;
    }
  }, []);

  const selectedAccountData = useMemo(
    () => accounts.find((account) => account.id === selectedAccount) ?? accounts[0],
    [accounts, selectedAccount]
  );

  const amountNumber = useMemo(() => {
    const sanitized = amount.replace(/,/g, '.');
    const parsed = parseFloat(sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amount]);

  const isSaveDisabled = !(
    amountNumber > 0 &&
    selectedCategory &&
    selectedAccountData &&
    transactionDate
  );

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

  const applyDateTimePart = useCallback((mode: 'date' | 'time', value: Date) => {
    setTransactionDate((prev) => {
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
      const baseValue = new Date(transactionDate);
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
    [applyDateTimePart, transactionDate]
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

  const pickerValue = useMemo(() => new Date(transactionDate), [transactionDate]);

  const dateLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(transactionDate);
    } catch {
      return transactionDate.toLocaleDateString();
    }
  }, [transactionDate]);

  const timeLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(transactionDate);
    } catch {
      return transactionDate.toLocaleTimeString();
    }
  }, [transactionDate]);

  const handleOpenCategoryModal = useCallback((state: CategoryModalState) => {
    setCategoryModalState(state);
    setCategoryDraft(state.mode === 'edit' ? (state.baseValue ?? '') : '');
    categoryModalRef.current?.present();
  }, []);

  const handleConfirmCategory = useCallback(() => {
    const trimmed = categoryDraft.trim();
    if (!trimmed || !categoryModalState) {
      return;
    }

    if (categoryModalState.mode === 'add') {
      addCategory(trimmed);
      setSelectedCategory(trimmed);
    } else if (categoryModalState.baseValue) {
      renameCategory(categoryModalState.baseValue, trimmed);
      setSelectedCategory(trimmed);
    }

    categoryModalRef.current?.dismiss();
    setCategoryDraft('');
    setCategoryModalState(null);
  }, [addCategory, categoryDraft, categoryModalState, renameCategory]);

  const handleDismissCategoryModal = useCallback(() => {
    categoryModalRef.current?.dismiss();
    setCategoryDraft('');
    setCategoryModalState(null);
  }, []);

  const handleSelectAccount = useCallback((accountId: string) => {
    setSelectedAccount(accountId);
    accountModalRef.current?.dismiss();
  }, []);

  const handleClose = useCallback(() => {
    closeIncomeOutcome();
    onRequestClose?.();
  }, [closeIncomeOutcome, onRequestClose]);

  const handleSubmit = useCallback(() => {
    if (isSaveDisabled || !selectedAccountData || !selectedCategory) {
      return;
    }

    // Формируем заметку с информацией о долге
    let finalNote = note.trim();
    if (isDebtCategory && debtPerson.trim()) {
      const debtInfo = activeTab === 'income'
        ? `${debtPerson} owes me`
        : `I owe to ${debtPerson}`;
      finalNote = finalNote
        ? `${debtInfo}. ${finalNote}`
        : debtInfo;
    }

    const domainType: 'income' | 'expense' = activeTab === 'income' ? 'income' : 'expense';
    const basePayload: Parameters<typeof createTransaction>[0] = {
      userId: 'local-user',
      type: domainType,
      accountId: selectedAccountData.id,
      amount: amountNumber,
      currency: selectedAccountData.currency,
      categoryId: selectedCategory,
      description: finalNote.length ? finalNote : undefined,
      date: transactionDate.toISOString(),
      baseCurrency,
      rateUsedToBase: 1,
      convertedAmountToBase: amountNumber,
    };

    if (isEditing && editingTransaction) {
      updateTransaction(editingTransaction.id, basePayload);
    } else {
      createTransaction(basePayload);
    }

    handleClose();
  }, [
    activeTab,
    amountNumber,
    createTransaction,
    debtPerson,
    editingTransaction,
    handleClose,
    isDebtCategory,
    isEditing,
    isSaveDisabled,
    note,
    selectedAccountData,
    selectedCategory,
    transactionDate,
    updateTransaction,
    baseCurrency,
  ]);

  const renderCategoryIcon = (category: FinanceCategory, size: number, color: string) => {
    const IconComponent = category.icon as React.ComponentType<{
      size?: number;
      color?: string;
    }>;
    return <IconComponent size={size} color={color} />;
  };

  const buttonLabel = isEditing ? t('finance.saveChanges') : t('finance.addEntry');

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
              <Text style={styles.headerTitle}>
                {activeTab === 'income' ? '+ INCOME' : '- OUTCOME'}
              </Text>
            </View>

            {/* Tab Switcher */}
            <View style={styles.section}>
              <AdaptiveGlassView style={[styles.glassSurface, styles.tabContainer]}>
                <Pressable
                  onPress={() => setActiveTab('income')}
                  style={({ pressed }) => [
                    styles.tabOption,
                    { borderBottomWidth: 1 },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.tabOptionContent}>
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: activeTab === 'income' ? '#FFFFFF' : '#7E8B9A' },
                      ]}
                    >
                      {t('finance.income')}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setActiveTab('outcome')}
                  style={({ pressed }) => [styles.tabOption, pressed && styles.pressed]}
                >
                  <View style={styles.tabOptionContent}>
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: activeTab === 'outcome' ? '#FFFFFF' : '#7E8B9A' },
                      ]}
                    >
                      {t('finance.outcome')}
                    </Text>
                  </View>
                </Pressable>
              </AdaptiveGlassView>
            </View>

            {/* Amount */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('finance.amount')}</Text>
              <AdaptiveGlassView style={[styles.glassSurface, styles.inputContainer]}>
                <TextInput
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="Input amount"
                  placeholderTextColor="#7E8B9A"
                  keyboardType="numeric"
                  style={styles.textInput}
                />
              </AdaptiveGlassView>
            </View>

            {/* Category */}
            <View style={[styles.section, { paddingHorizontal: 0 }]}>
              <View style={styles.categoryHeader}>
                <Text style={[styles.sectionLabel, { paddingHorizontal: 20 }]}>
                  {t('finance.category')}
                </Text>
                <Pressable
                  onPress={() => handleOpenCategoryModal({ mode: 'add' })}
                  hitSlop={10}
                  style={{ paddingHorizontal: 20 }}
                >
                  <Ionicons name="add" size={18} color="#7E8B9A" />
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesScroll}
              >
                {availableCategories.map((cat) => {
                  const isActive = selectedCategory === cat.name;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setSelectedCategory(cat.name)}
                      style={({ pressed }) => [styles.categoryCard, pressed && styles.pressed]}
                    >
                      <AdaptiveGlassView
                        style={[
                          styles.glassSurface,
                          styles.categoryCardInner,
                          { opacity: isActive ? 1 : 0.6 },
                        ]}
                      >
                        {renderCategoryIcon(cat, 28, isActive ? '#FFFFFF' : '#9E9E9E')}
                        <Text
                          style={[
                            styles.categoryCardText,
                            { color: isActive ? '#FFFFFF' : '#9E9E9E' },
                          ]}
                          numberOfLines={2}
                        >
                          {cat.name}
                        </Text>
                      </AdaptiveGlassView>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Date & Time */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('finance.date')}</Text>
              <View style={styles.dateTimeRow}>
                <Pressable
                  onPress={() => openDateTimePicker('date')}
                  style={({ pressed }) => [styles.dateTimeButton, pressed && styles.pressed]}
                >
                  <AdaptiveGlassView style={[styles.glassSurface, styles.dateTimeChip]}>
                    <Ionicons name="calendar-outline" size={18} color="#7E8B9A" />
                    <Text style={styles.dateTimeText}>{dateLabel}</Text>
                  </AdaptiveGlassView>
                </Pressable>
                <Pressable
                  onPress={() => openDateTimePicker('time')}
                  style={({ pressed }) => [styles.dateTimeButton, pressed && styles.pressed]}
                >
                  <AdaptiveGlassView style={[styles.glassSurface, styles.dateTimeChip]}>
                    <Ionicons name="time-outline" size={18} color="#7E8B9A" />
                    <Text style={styles.dateTimeText}>{timeLabel}</Text>
                  </AdaptiveGlassView>
                </Pressable>
              </View>
            </View>

            {/* Account */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('finance.account')}</Text>
              <Pressable
                onPress={() => accountModalRef.current?.present()}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <AdaptiveGlassView style={[styles.glassSurface, styles.inputContainer]}>
                  <View style={styles.accountRow}>
                    <View>
                      <Text style={styles.textInput}>{selectedAccountData?.name}</Text>
                      <Text style={styles.accountBalance}>
                        {selectedAccountData
                          ? formatCurrency(selectedAccountData.currentBalance, selectedAccountData.currency)
                          : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#7E8B9A" />
                  </View>
                </AdaptiveGlassView>
              </Pressable>
            </View>

            {/* Debt Person - показываем только когда выбрана категория Debt */}
            {isDebtCategory && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  {activeTab === 'income'
                    ? 'Who owes you?'
                    : 'Who do you owe?'}
                </Text>
                <AdaptiveGlassView style={[styles.glassSurface, styles.inputContainer]}>
                  <TextInput
                    value={debtPerson}
                    onChangeText={setDebtPerson}
                    placeholder={activeTab === 'income'
                      ? 'Person name who owes you'
                      : 'Person name you owe to'}
                    placeholderTextColor="#7E8B9A"
                    style={styles.textInput}
                  />
                </AdaptiveGlassView>
              </View>
            )}

            {/* Note */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('finance.note')}</Text>
              <AdaptiveGlassView style={[styles.glassSurface, styles.noteContainer]}>
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
                  style={[
                    styles.glassSurface,
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
                    {buttonLabel}
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
            <AdaptiveGlassView style={[styles.glassSurface, styles.pickerCard]}>
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

      {/* Category Editor Modal */}
      <CustomModal
        ref={categoryModalRef}
        variant="form"
        fallbackSnapPoint="50%"
        onDismiss={() => setCategoryModalState(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {categoryModalState?.mode === 'edit'
                ? t('finance.editCategory')
                : t('finance.addCategory')}
            </Text>
            <Pressable onPress={handleDismissCategoryModal} hitSlop={10}>
              <Ionicons name="close" size={22} color="#7E8B9A" />
            </Pressable>
          </View>

          <AdaptiveGlassView style={[styles.glassSurface, styles.inputContainer]}>
            <TextInput
              value={categoryDraft}
              onChangeText={setCategoryDraft}
              placeholder={t('finance.categoryPlaceholder')}
              placeholderTextColor="#7E8B9A"
              style={styles.textInput}
            />
          </AdaptiveGlassView>

          <Pressable
            disabled={!categoryDraft.trim()}
            onPress={handleConfirmCategory}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && categoryDraft.trim() && styles.pressed,
            ]}
          >
            <AdaptiveGlassView
              style={[
                styles.glassSurface,
                styles.primaryButtonInner,
                { opacity: !categoryDraft.trim() ? 0.4 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: !categoryDraft.trim() ? '#7E8B9A' : '#FFFFFF' },
                ]}
              >
                {t('finance.save')}
              </Text>
            </AdaptiveGlassView>
          </Pressable>
        </View>
      </CustomModal>

      {/* Account Picker Modal */}
      <CustomModal
        ref={accountModalRef}
        variant="form"
        fallbackSnapPoint="50%"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('finance.selectAccount')}</Text>
            <Pressable onPress={() => accountModalRef.current?.dismiss()} hitSlop={10}>
              <Ionicons name="close" size={22} color="#7E8B9A" />
            </Pressable>
          </View>

          <View style={styles.accountList}>
            {accounts.map((account) => {
              const selected = account.id === selectedAccountData?.id;
              return (
                <Pressable
                  key={account.id}
                  onPress={() => handleSelectAccount(account.id)}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <AdaptiveGlassView
                    style={[
                      styles.glassSurface,
                      styles.accountItem,
                      { opacity: selected ? 1 : 0.7 },
                    ]}
                  >
                    <View>
                      <Text style={[styles.textInput, { marginBottom: 4 }]}>
                        {account.name}
                      </Text>
                      <Text style={styles.accountBalance}>
                        {formatCurrency(account.currentBalance, account.currency)}
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
  tabContainer: {
    borderRadius: 16,
  },
  glassSurface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tabOption: {
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tabOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tabLabel: {
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
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoriesScroll: {
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  categoryCard: {
    borderRadius: 16,
  },
  categoryCardInner: {
    width: 90,
    height: 90,
    borderRadius: 16,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  categoryCardText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  dateRow: {
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
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountBalance: {
    fontSize: 13,
    fontWeight: '400',
    color: '#7E8B9A',
    marginTop: 4,
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
});
