import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import {
  Bitcoin,
  Briefcase,
  Building,
  Coins,
  CreditCard,
  DollarSign,
  PiggyBank,
  PlusCircle,
  Shield,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import type { AccountIconId, AccountKind } from '@/types/accounts';
import { useCustomAccountTypesStore } from '@/stores/useCustomAccountTypesStore';
import {
  AVAILABLE_FINANCE_CURRENCIES,
  type FinanceCurrency,
  useFinancePreferencesStore,
} from '@/stores/useFinancePreferencesStore';
import { normalizeFinanceCurrency } from '@/utils/financeCurrency';
import type { AccountType } from '@/domain/finance/types';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useShallow } from 'zustand/react/shallow';
import { useLocalization } from '@/localization/useLocalization';

type TypeOption = {
  key: string;
  id: AccountKind;
  label: string;
  Icon: LucideIcon;
  customTypeId?: string;
};

type CustomIconOption = {
  id: AccountIconId;
  label: string;
  Icon: LucideIcon;
};

const ACCOUNT_ICON_COMPONENTS: Record<AccountIconId, LucideIcon> = {
  wallet: Wallet,
  'credit-card': CreditCard,
  'piggy-bank': PiggyBank,
  bank: Building,
  briefcase: Briefcase,
  coins: Coins,
  sparkles: Sparkles,
  bitcoin: Bitcoin,
  shield: Shield,
  'trending-up': TrendingUp,
};

const TYPE_OPTIONS: TypeOption[] = [
  { key: 'cash', id: 'cash', label: 'Cash', Icon: ACCOUNT_ICON_COMPONENTS.wallet },
  { key: 'card', id: 'card', label: 'Card', Icon: ACCOUNT_ICON_COMPONENTS['credit-card'] },
  { key: 'savings', id: 'savings', label: 'Savings', Icon: ACCOUNT_ICON_COMPONENTS['piggy-bank'] },
  { key: 'usd', id: 'usd', label: 'USD', Icon: DollarSign },
  { key: 'crypto', id: 'crypto', label: 'Crypto', Icon: Bitcoin },
  { key: 'other', id: 'other', label: 'Other', Icon: ACCOUNT_ICON_COMPONENTS.sparkles },
];

const CUSTOM_ICON_OPTIONS: CustomIconOption[] = [
  { id: 'wallet', label: 'Wallet', Icon: ACCOUNT_ICON_COMPONENTS.wallet },
  { id: 'credit-card', label: 'Card', Icon: ACCOUNT_ICON_COMPONENTS['credit-card'] },
  { id: 'piggy-bank', label: 'Savings', Icon: ACCOUNT_ICON_COMPONENTS['piggy-bank'] },
  { id: 'bank', label: 'Bank', Icon: ACCOUNT_ICON_COMPONENTS.bank },
  { id: 'briefcase', label: 'Business', Icon: ACCOUNT_ICON_COMPONENTS.briefcase },
  { id: 'coins', label: 'Coins', Icon: ACCOUNT_ICON_COMPONENTS.coins },
  { id: 'sparkles', label: 'Other', Icon: ACCOUNT_ICON_COMPONENTS.sparkles },
  { id: 'bitcoin', label: 'Crypto', Icon: ACCOUNT_ICON_COMPONENTS.bitcoin },
  { id: 'shield', label: 'Secure', Icon: ACCOUNT_ICON_COMPONENTS.shield },
  { id: 'trending-up', label: 'Growth', Icon: ACCOUNT_ICON_COMPONENTS['trending-up'] },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const ICON_SIZE = 18;

const mapDomainAccountTypeToKind = (type: AccountType): AccountKind => {
  switch (type) {
    case 'cash':
      return 'cash';
    case 'card':
      return 'card';
    case 'savings':
      return 'savings';
    case 'credit':
    case 'debt':
      return 'usd';
    case 'investment':
      return 'crypto';
    default:
      return 'other';
  }
};

const mapAccountKindToDomainType = (kind: AccountKind): AccountType => {
  switch (kind) {
    case 'cash':
      return 'cash';
    case 'card':
      return 'card';
    case 'savings':
      return 'savings';
    case 'crypto':
      return 'investment';
    case 'usd':
      return 'credit';
    default:
      return 'other';
  }
};

const CURRENCY_LABELS: Record<FinanceCurrency, string> = {
  UZS: 'Uzbekistani Som',
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  TRY: 'Turkish Lira',
  SAR: 'Saudi Riyal',
  AED: 'UAE Dirham',
  USDT: 'Tether (USDT)',
  RUB: 'Russian Ruble',
};

export default function AddAccountModal() {
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { strings } = useLocalization();
  const commonStrings = (strings as any).common ?? {};
  const accountStrings = (strings as any).financeScreens?.accounts?.modal ?? {};
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = Array.isArray(id) ? id[0] : id ?? null;

  const { accounts, createAccount, updateAccount, clearCustomTypeFromAccounts } = useFinanceDomainStore(
    useShallow((state) => ({
      accounts: state.accounts,
      createAccount: state.createAccount,
      updateAccount: state.updateAccount,
      clearCustomTypeFromAccounts: state.clearCustomTypeFromAccounts,
    })),
  );

  const baseCurrency = useFinancePreferencesStore((state) => state.baseCurrency);
  const {
    customTypes,
    addCustomType,
    removeCustomType,
  } = useCustomAccountTypesStore(
    useShallow((state) => ({
      customTypes: state.customTypes,
      addCustomType: state.addCustomType,
      removeCustomType: state.removeCustomType,
    })),
  );

  const editingAccount = useMemo(
    () => accounts.find((account) => account.id === editingId) ?? null,
    [accounts, editingId],
  );

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<FinanceCurrency>(baseCurrency);
  const [selectedType, setSelectedType] = useState<AccountKind>('cash');
  const [selectedCustomTypeId, setSelectedCustomTypeId] = useState<string | null>(null);
  const [customTypeName, setCustomTypeName] = useState('');
  const [customIconChoice, setCustomIconChoice] = useState<AccountIconId>('wallet');
  const [showAddType, setShowAddType] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const addTypeProgress = useSharedValue(0);
  const addTypeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: addTypeProgress.value,
    transform: [{ translateY: (1 - addTypeProgress.value) * 12 }],
  }));

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setAmount('');
    setSelectedCurrency(baseCurrency);
    setSelectedType('cash');
    setSelectedCustomTypeId(null);
    setCustomTypeName('');
    setCustomIconChoice('wallet');
    setShowAddType(false);
    addTypeProgress.value = 0;
    setFormMode('create');
  }, [addTypeProgress, baseCurrency]);

  useEffect(() => {
    resetForm();
    if (editingAccount) {
      setFormMode('edit');
      setName(editingAccount.name);
      setDescription('');
      setAmount(String(editingAccount.currentBalance ?? editingAccount.initialBalance ?? ''));
      setSelectedCurrency(normalizeFinanceCurrency(editingAccount.currency as FinanceCurrency, baseCurrency));

      // Check if this is a custom type account
      if (editingAccount.customTypeId && editingAccount.accountType === 'other') {
        const customType = customTypes.find((ct) => ct.id === editingAccount.customTypeId);
        if (customType) {
          setSelectedType('custom');
          setSelectedCustomTypeId(editingAccount.customTypeId);
        } else {
          // Custom type was deleted, fallback to 'other'
          const mappedKind = mapDomainAccountTypeToKind(editingAccount.accountType);
          setSelectedType(mappedKind);
        }
      } else {
        const mappedKind = mapDomainAccountTypeToKind(editingAccount.accountType);
        setSelectedType(mappedKind);
      }
    }
  }, [baseCurrency, editingAccount, resetForm, customTypes]);

  const currencyOptions = useMemo(
    () =>
      AVAILABLE_FINANCE_CURRENCIES.map((code) => ({
        code,
        label: accountStrings.currencyLabels?.[code] ?? CURRENCY_LABELS[code] ?? code,
      })),
    [accountStrings.currencyLabels],
  );

  const customTypeOptions = useMemo<TypeOption[]>(
    () =>
      customTypes.map((type) => ({
        key: `custom-${type.id}`,
        id: 'custom',
        label: type.label,
        Icon: ACCOUNT_ICON_COMPONENTS[type.icon] ?? ACCOUNT_ICON_COMPONENTS.wallet,
        customTypeId: type.id,
      })),
    [customTypes],
  );

  const typeOptions = useMemo<TypeOption[]>(() => {
    const baseTypes = TYPE_OPTIONS.map((option) => ({
      ...option,
      label: accountStrings.typeOptions?.[option.id] ?? option.label,
    }));
    const customLabeled = customTypeOptions.map((option) => ({
      ...option,
      label: option.customTypeId ? option.label : accountStrings.typeOptions?.[option.id] ?? option.label,
    }));
    return [...baseTypes, ...customLabeled];
  }, [accountStrings.typeOptions, customTypeOptions]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const toggleAddType = useCallback(() => {
    const next = !showAddType;
    setShowAddType(next);
    addTypeProgress.value = withTiming(next ? 1 : 0, { duration: 200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    if (!next) {
      setCustomTypeName('');
      setCustomIconChoice('wallet');
    }
  }, [addTypeProgress, showAddType]);

  const handleCreateCustomType = useCallback(() => {
    const trimmed = customTypeName.trim();
    if (!trimmed) return;
    const created = addCustomType(trimmed, customIconChoice);
    setSelectedType('custom');
    setSelectedCustomTypeId(created.id);
    setCustomTypeName('');
    setCustomIconChoice('wallet');
    toggleAddType();
  }, [addCustomType, customIconChoice, customTypeName, toggleAddType]);

  const handleDeleteCustomType = useCallback((typeId: string) => {
    removeCustomType(typeId);
    clearCustomTypeFromAccounts(typeId);
    if (selectedCustomTypeId === typeId) {
      setSelectedType('other');
      setSelectedCustomTypeId(null);
    }
  }, [removeCustomType, clearCustomTypeFromAccounts, selectedCustomTypeId]);

  const isEditMode = formMode === 'edit';
  const isSaveDisabled = !name.trim();

  const handleSubmit = useCallback(() => {
    const parsedAmount = Number(amount.replace(/[^0-9.-]+/g, '').trim() || '0');
    const payloadAmount = Number.isFinite(parsedAmount) ? parsedAmount : 0;

    if (isEditMode && editingAccount) {
      updateAccount(editingAccount.id, {
        name: name.trim(),
        accountType: mapAccountKindToDomainType(selectedType),
        currency: selectedCurrency,
        currentBalance: payloadAmount,
        customTypeId: selectedType === 'custom' ? selectedCustomTypeId ?? undefined : undefined,
      });
      router.back();
      return;
    }

    createAccount({
      userId: 'local-user',
      name: name.trim() || 'Account',
      accountType: mapAccountKindToDomainType(selectedType),
      currency: selectedCurrency,
      initialBalance: payloadAmount,
      linkedGoalId: undefined,
      isArchived: false,
      customTypeId: selectedType === 'custom' ? selectedCustomTypeId ?? undefined : undefined,
    });
    router.back();
  }, [
    amount,
    createAccount,
    editingAccount,
    isEditMode,
    name,
    router,
    selectedCurrency,
    selectedType,
    selectedCustomTypeId,
    updateAccount,
  ]);


  return (
    <>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['bottom',"top"]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
            {isEditMode ? accountStrings.titleEdit ?? 'Edit Account' : accountStrings.titleAdd ?? 'Add New Account'}
          </Text>
          <Pressable onPress={router.back} hitSlop={12}>
            <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>{commonStrings.close ?? 'Close'}</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.contentContainer, { paddingBottom: 24 + insets.bottom }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                {accountStrings.nameLabel ?? 'Name'}
              </Text>
              <AdaptiveGlassView style={[styles.inputGlass, { borderColor: theme.colors.border }]}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={accountStrings.namePlaceholder ?? 'Account name'}
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.input, { color: theme.colors.textPrimary }]}
                />
              </AdaptiveGlassView>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                {accountStrings.descriptionLabel ?? 'Description'}
              </Text>
              <AdaptiveGlassView
                style={[styles.inputGlass, styles.multilineGlass, { borderColor: theme.colors.border }]}
              >
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder={accountStrings.descriptionPlaceholder ?? 'Description'}
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  style={[styles.input, styles.multilineInput, { color: theme.colors.textPrimary }]}
                />
              </AdaptiveGlassView>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                {accountStrings.typeLabel ?? 'Type'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.typeScroll}
              >
                {typeOptions.map((option) => {
                  const isCustom = option.id === 'custom';
                  const isSelected =
                    option.id === selectedType && (!isCustom || option.customTypeId === selectedCustomTypeId);
                  return (
                    <TypeOptionItem
                      key={option.key}
                      option={option}
                      isSelected={isSelected}
                      onSelect={() => {
                        setSelectedType(option.id);
                        setSelectedCustomTypeId(option.customTypeId ?? null);
                      }}
                      onDelete={isCustom && option.customTypeId ? () => handleDeleteCustomType(option.customTypeId!) : undefined}
                      theme={theme}
                    />
                  );
                })}
                <View style={styles.typeItem}>
                  <Pressable
                    style={[styles.typePressable]}
                    onPress={toggleAddType}
                    android_ripple={{ color: theme.colors.borderMuted, borderless: false }}
                  >
                    <AdaptiveGlassView style={[styles.typeCard, { borderColor: theme.colors.border }]}>
                      <View style={styles.typeInner}>
                        <PlusCircle size={ICON_SIZE} color={theme.colors.textSecondary} strokeWidth={2} />
                        <Text style={[styles.typeLabel, { color: theme.colors.textSecondary }]}>
                          {accountStrings.addType ?? 'Add type'}
                        </Text>
                      </View>
                    </AdaptiveGlassView>
                  </Pressable>
                </View>
              </ScrollView>
              {showAddType && (
                <Animated.View
                  style={[styles.addTypeContainer, addTypeAnimatedStyle]}
                >
                  <AdaptiveGlassView style={[styles.inputGlass, { borderColor: theme.colors.border }]}>
                    <TextInput
                      value={customTypeName}
                      onChangeText={setCustomTypeName}
                      placeholder={accountStrings.newTypePlaceholder ?? 'New type name'}
                      placeholderTextColor={theme.colors.textMuted}
                      style={[styles.input, { color: theme.colors.textPrimary }]}
                    />
                  </AdaptiveGlassView>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.customIconRow}
                  >
                    {CUSTOM_ICON_OPTIONS.map((option) => {
                      const SelectedIcon = option.Icon;
                      const active = option.id === customIconChoice;
                      const label = accountStrings.iconOptions?.[option.id] ?? option.label;
                      return (
                        <View key={option.id} style={styles.customIconItem}>
                          <Pressable
                            onPress={() => setCustomIconChoice(option.id)}
                            android_ripple={{ color: theme.colors.borderMuted, borderless: false }}
                            style={({ pressed }) => [styles.customIconPressable, pressed && { opacity: 0.9 }]}
                          >
                            <AdaptiveGlassView
                              style={[
                                styles.customIconCard,
                                {
                                  borderColor: !active ? theme.colors.primary : theme.colors.border,
                                },
                              ]}
                            >
                              <View style={styles.customIconInner}>
                                <SelectedIcon size={ICON_SIZE} color={!active ? theme.colors.primary : theme.colors.textSecondary} />
                                <Text style={[styles.iconChoiceLabel, { color: !active ? theme.colors.primary : theme.colors.textSecondary }]}>
                                  {label}
                                </Text>
                              </View>
                            </AdaptiveGlassView>
                          </Pressable>
                        </View>
                      );
                    })}
                  </ScrollView>
                  <AnimatedPressable
                    disabled={!customTypeName.trim()}
                    onPress={handleCreateCustomType}
                    style={[
                      styles.primaryButton,
                      { backgroundColor: theme.colors.primary, opacity: customTypeName.trim() ? 1 : 0.5 },
                    ]}
                  >
                    <Text style={[styles.primaryButtonText, { color: theme.colors.textPrimary }]}>
                      {accountStrings.saveType ?? commonStrings.save ?? 'Save'}
                    </Text>
                  </AnimatedPressable>
                </Animated.View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                {accountStrings.currencyLabel ?? 'Currency'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.currencyScroll}
              >
                {currencyOptions.map((option) => {
                  const isSelected = option.code === selectedCurrency;
                  return (
                    <View key={option.code} style={styles.currencyItem}>
                      <Pressable
                        onPress={() => setSelectedCurrency(option.code)}
                        android_ripple={{ color: theme.colors.borderMuted, borderless: false }}
                        style={({ pressed }) => [styles.currencyPressable, pressed && { opacity: 0.9 }]}
                      >
                        <AdaptiveGlassView
                          style={[
                            styles.currencyCard,
                            {
                              borderColor: !isSelected ? theme.colors.primary : theme.colors.border,
                              backgroundColor: theme.colors.card,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.currencyCode,
                              { color: !isSelected ? theme.colors.primary : theme.colors.textSecondary },
                            ]}
                          >
                            {option.code}
                          </Text>
                          <Text
                            style={[
                              styles.currencyLabel,
                              { color: !isSelected ? theme.colors.primary : theme.colors.textSecondary },
                            ]}
                            numberOfLines={2}
                          >
                            {option.label}
                          </Text>
                        </AdaptiveGlassView>
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                {accountStrings.amountLabel ?? 'Amount'}
              </Text>
              <AdaptiveGlassView style={[styles.inputGlass, { borderColor: theme.colors.border }]}>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder={
                    (accountStrings.amountPlaceholder as string | undefined)?.replace('{currency}', selectedCurrency) ??
                    `Amount (${selectedCurrency})`
                  }
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.input, { color: theme.colors.textPrimary }]}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
              </AdaptiveGlassView>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <View style={styles.footerButtons}>
        <AnimatedPressable
          style={[
            styles.primaryButton,
            { backgroundColor: theme.colors.primary },
            isSaveDisabled && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSaveDisabled}
        >
          <Text style={[styles.primaryButtonText, { color: theme.colors.onPrimary }]}>
            {isEditMode
              ? accountStrings.primaryActionSave ?? commonStrings.save ?? 'Save'
              : accountStrings.primaryActionAdd ?? commonStrings.add ?? 'Add'}
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
          onPress={handleCancel}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>
            {commonStrings.cancel ?? 'Cancel'}
          </Text>
        </AnimatedPressable>
      </View>
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
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 20,
  },
  formGroup: {
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  inputGlass: {
    borderRadius: 16,
    borderWidth: 1,
  },
  multilineGlass: {
    minHeight: 110,
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    width: '100%',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 4,
    marginTop: 16,
    marginBottom: 28,
  },
  primaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    paddingVertical: 4,
  },
  typeScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  typeItem: {
    width: 120,
    paddingHorizontal: 4,
    marginRight: 8,
  },
  typePressable: {
    borderRadius: 14,
    width: '100%',
  },
  typeCard: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  typeInner: {
    alignItems: 'center',
    gap: 6,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 10,
    padding: 4,
  },
  addTypeContainer: {
    marginTop: 12,
    gap: 12,
  },
  customIconRow: {
    gap: 8,
  },
  customIconItem: {
    width: 100,
  },
  customIconPressable: {
    borderRadius: 14,
    width: '100%',
  },
  customIconCard: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    width: '100%',
  },
  customIconInner: {
    alignItems: 'center',
    gap: 6,
  },
  iconChoiceLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  currencyScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  currencyItem: {
    width: 140,
    paddingHorizontal: 4,
    marginRight: 8,
  },
  currencyPressable: {
    borderRadius: 14,
    width: '100%',
  },
  currencyCard: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
    width: '100%',
    gap: 6,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '800',
  },
  currencyLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
});
type TypeOptionItemProps = {
  option: TypeOption;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  theme: ReturnType<typeof useAppTheme>;
};

const TypeOptionItem: React.FC<TypeOptionItemProps> = ({ option, isSelected, onSelect, onDelete, theme }) => {
  const { Icon, label } = option;

  return (
    <View style={styles.typeItem}>
      <Pressable
        onPress={onSelect}
        android_ripple={{ color: theme.colors.borderMuted, borderless: false }}
        style={({ pressed }) => [styles.typePressable, pressed && { opacity: 0.9 }]}
      >
        <AdaptiveGlassView
          style={[
            styles.typeCard,
            {
              borderColor: isSelected ? theme.colors.primary : theme.colors.border,
            },
          ]}
        >
          {onDelete && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              style={styles.deleteButton}
              hitSlop={8}
            >
              <X size={14} color={theme.colors.textMuted} strokeWidth={2} />
            </Pressable>
          )}
          <View style={styles.typeInner}>
            <Icon size={ICON_SIZE} color={!isSelected ? theme.colors.primary : theme.colors.textSecondary} />
            <Text
              numberOfLines={2}
              style={[
                styles.typeLabel,
                { color: !isSelected ? theme.colors.primary : theme.colors.textSecondary },
              ]}
            >
              {label}
            </Text>
          </View>
        </AdaptiveGlassView>
      </Pressable>
    </View>
  );
};
