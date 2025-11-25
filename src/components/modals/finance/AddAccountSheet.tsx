import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import {
  Bitcoin,
  Briefcase,
  Building,
  Check,
  ChevronRight,
  Coins,
  CreditCard,
  DollarSign,
  PiggyBank,
  PlusCircle,
  Shield,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';

import CustomModal, { CustomModalProps } from '@/components/modals/CustomModal';
import CustomBottomSheet, {
  BottomSheetHandle,
} from '@/components/modals/BottomSheet';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import type { AddAccountPayload, AccountIconId, AccountKind } from '@/types/accounts';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useCustomAccountTypesStore } from '@/stores/useCustomAccountTypesStore';
import {
  AVAILABLE_FINANCE_CURRENCIES,
  type FinanceCurrency,
  useFinancePreferencesStore,
} from '@/stores/useFinancePreferencesStore';
import { normalizeFinanceCurrency } from '@/utils/financeCurrency';

export type { AddAccountPayload } from '@/types/accounts';

interface AddAccountSheetProps {
  onSubmit: (payload: AddAccountPayload) => void;
  onEditSubmit?: (id: string, payload: AddAccountPayload) => void;
}

type TypeOption = {
  key: string;
  id: AccountKind;
  label: string;
  Icon: LucideIcon;
  customTypeId?: string;
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

type CustomIconOption = {
  id: AccountIconId;
  label: string;
  Icon: LucideIcon;
};

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

const modalProps: Partial<CustomModalProps> = {
  variant: 'form',
  enableDynamicSizing: false,
  fallbackSnapPoint: '90%',
  scrollable: true,
  scrollProps: { keyboardShouldPersistTaps: 'handled' },
  enablePanDownToClose: true,
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

type CurrencyOption = {
  code: FinanceCurrency;
  label: string;
};

const ITEM_SPACING = 12;
const ICON_SIZE = 18;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface AccountSheetAccountPreview {
  id: string;
  name: string;
  subtitle?: string;
  balance: number;
  currency: string;
  type: AccountKind;
  customTypeId?: string | null;
  customTypeLabel?: string;
  customIcon?: AccountIconId;
}

export interface AddAccountSheetHandle {
  expand: () => void;
  close: () => void;
  edit: (account: AccountSheetAccountPreview) => void;
}

interface TypeOptionItemProps {
  option: TypeOption;
  isSelected: boolean;
  onSelect: (option: TypeOption) => void;
  theme: ReturnType<typeof useAppTheme>;
}

const TypeOptionItem: React.FC<TypeOptionItemProps> = ({
  option,
  isSelected,
  onSelect,
  theme,
}) => {
  const { Icon, label } = option;

  return (
    <View style={styles.typeItem}>
      <Pressable
        onPress={() => onSelect(option)}
        android_ripple={{ color: theme.colors.borderMuted, borderless: false }}
        style={({ pressed }) => [
          styles.typePressable,
          pressed && { opacity: 0.9 },
        ]}
      >
        <AdaptiveGlassView
          style={[
            styles.typeCard,
            {
              borderColor: isSelected
                ? theme.colors.primary
                : theme.colors.border,
            },
          ]}
        >
          <View style={styles.typeInner}>
            <Icon
              size={ICON_SIZE}
              color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.typeLabel,
                {
                  color: isSelected
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
                },
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

const AddAccountSheet = forwardRef<AddAccountSheetHandle, AddAccountSheetProps>(
  ({ onSubmit, onEditSubmit }, ref) => {
    const theme = useAppTheme();
    const modalRef = useRef<BottomSheetHandle>(null);
    const customTypeSheetRef = useRef<BottomSheetHandle>(null);
    const currencySheetRef = useRef<BottomSheetHandle>(null);
    const baseCurrency = useFinancePreferencesStore((state) => state.baseCurrency);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState<FinanceCurrency>(baseCurrency);
    const [selectedType, setSelectedType] = useState<AccountKind>('cash');
    const [selectedCustomTypeId, setSelectedCustomTypeId] = useState<string | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [customTypeName, setCustomTypeName] = useState('');
    const [customIconChoice, setCustomIconChoice] = useState<AccountIconId>('wallet');
    const [currencyQuery, setCurrencyQuery] = useState('');
    const editingAccountId = useRef<string | null>(null);

    const customTypes = useCustomAccountTypesStore((state) => state.customTypes);
    const addCustomType = useCustomAccountTypesStore((state) => state.addCustomType);
    const upsertCustomType = useCustomAccountTypesStore((state) => state.upsertCustomType);

    const currencyOptions = useMemo<CurrencyOption[]>(() => {
      return AVAILABLE_FINANCE_CURRENCIES.map((code) => ({
        code,
        label: CURRENCY_LABELS[code] ?? code,
      }));
    }, []);

    const filteredCurrencies = useMemo(() => {
      if (!currencyQuery.trim()) {
        return currencyOptions;
      }
      const query = currencyQuery.trim().toLowerCase();
      return currencyOptions.filter((option) => {
        return (
          option.code.toLowerCase().includes(query) ||
          option.label.toLowerCase().includes(query)
        );
      });
    }, [currencyOptions, currencyQuery]);

    const customTypeSnapPoints = useMemo<(string | number)[]>(() => ['55%', '80%'], []);
    const currencySnapPoints = useMemo<(string | number)[]>(() => ['55%'], []);
    const animationConfigs = useMemo(
      () => ({
        duration: 400,
        easing: Easing.linear,
      }),
      [],
    );

    const handleResetForm = useCallback(() => {
      setName('');
      setDescription('');
      setAmount('');
      setSelectedCurrency(baseCurrency);
      setSelectedType('cash');
      setFormMode('create');
      setSelectedCustomTypeId(null);
      editingAccountId.current = null;
      customTypeSheetRef.current?.dismiss();
      currencySheetRef.current?.dismiss();
    }, [baseCurrency]);

    const handleOpenCustomTypeModal = useCallback(() => {
      setCustomTypeName('');
      setCustomIconChoice('wallet');
      customTypeSheetRef.current?.present();
    }, []);

    const handleCreateCustomType = useCallback(() => {
      const trimmed = customTypeName.trim();
      if (!trimmed) return;
      const created = addCustomType(trimmed, customIconChoice);
      setSelectedType('custom');
      setSelectedCustomTypeId(created.id);
      setCustomTypeName('');
      customTypeSheetRef.current?.dismiss();
    }, [addCustomType, customIconChoice, customTypeName]);

    const handleOpenCurrencyPicker = useCallback(() => {
      setCurrencyQuery('');
      currencySheetRef.current?.present();
    }, []);

    const handleCloseCurrencyPicker = useCallback(() => {
      currencySheetRef.current?.dismiss();
    }, []);

    const handleSelectCurrency = useCallback(
      (code: FinanceCurrency) => {
        setSelectedCurrency(code);
        handleCloseCurrencyPicker();
      },
      [handleCloseCurrencyPicker],
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

    const typeOptions = useMemo<TypeOption[]>(
      () => [...TYPE_OPTIONS, ...customTypeOptions],
      [customTypeOptions],
    );

    const selectedCurrencyLabel =
      currencyOptions.find((option) => option.code === selectedCurrency)?.label ?? selectedCurrency;

    const handleTypeSelect = useCallback((option: TypeOption) => {
      setSelectedType(option.id);
      if (option.id === 'custom') {
        setSelectedCustomTypeId(option.customTypeId ?? null);
      } else {
        setSelectedCustomTypeId(null);
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        expand: () => {
          handleResetForm();
          modalRef.current?.present();
        },
        edit: (account: AccountSheetAccountPreview) => {
          setFormMode('edit');
          editingAccountId.current = account.id;
          setName(account.name);
          setDescription(account.subtitle ?? '');
          setAmount(String(account.balance));
          setSelectedCurrency(normalizeFinanceCurrency(account.currency, baseCurrency));
          setSelectedType(account.type);
          if (account.type === 'custom') {
            setSelectedCustomTypeId(account.customTypeId ?? null);
            if (
              account.customTypeId &&
              account.customTypeLabel &&
              account.customIcon
            ) {
              upsertCustomType({
                id: account.customTypeId,
                label: account.customTypeLabel,
                icon: account.customIcon,
              });
            }
          } else {
            setSelectedCustomTypeId(null);
          }
          modalRef.current?.present();
        },
        close: () => modalRef.current?.dismiss(),
      }),
      [baseCurrency, handleResetForm, upsertCustomType],
    );

    const handleCancel = useCallback(() => {
      modalRef.current?.dismiss();
      handleResetForm();
    }, [handleResetForm]);

    const handleSubmit = useCallback(() => {
      const activeCustomType =
        selectedType === 'custom'
          ? customTypes.find((type) => type.id === selectedCustomTypeId)
          : undefined;

      if (selectedType === 'custom' && !activeCustomType) {
        customTypeSheetRef.current?.present();
        return;
      }

      const parsedAmount = Number(
        amount.replace(/[^0-9.-]+/g, '').trim() || '0',
      );

      const payload: AddAccountPayload = {
        name: name.trim(),
        description: description.trim(),
        amount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
        currency: selectedCurrency,
        type: selectedType,
        customTypeId: activeCustomType?.id,
        customTypeLabel: activeCustomType?.label,
        customIcon: activeCustomType?.icon,
      };

      if (formMode === 'edit' && editingAccountId.current) {
        onEditSubmit?.(editingAccountId.current, payload);
      } else {
        onSubmit(payload);
      }

      handleResetForm();
      modalRef.current?.dismiss();
    }, [
      amount,
      customTypes,
      description,
      formMode,
      handleResetForm,
      name,
      onEditSubmit,
      onSubmit,
      selectedCurrency,
      selectedCustomTypeId,
      selectedType,
    ]);

    const isEditMode = formMode === 'edit';
    const isCustomTypeValid = customTypeName.trim().length > 0;

    return (
      <>
        <CustomModal
          ref={modalRef}
          animationConfigs={animationConfigs}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          backgroundStyle={[
            styles.sheetBackground,
            {
              backgroundColor:
                theme.mode === 'dark'
                  ? 'rgba(22,22,28,0.92)'
                  : 'rgba(255,255,255,0.9)',
              borderColor: theme.colors.borderMuted,
            },
          ]}
          handleIndicatorStyle={[
            styles.handleIndicator,
            { backgroundColor: theme.colors.textMuted },
          ]}
          contentContainerStyle={styles.contentContainer}
          onDismiss={handleResetForm}
          {...modalProps}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
            style={styles.keyboardAvoider}
          >
            <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
              {isEditMode ? 'Edit Account' : 'Add New Account'}
            </Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Name</Text>
              <AdaptiveGlassView
                style={[
                  styles.inputGlass,
                  { borderColor: theme.colors.border },
                ]}
              >
                <BottomSheetTextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Account Name"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[
                    styles.input,
                    { color: theme.colors.textPrimary },
                  ]}
                />
              </AdaptiveGlassView>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Description</Text>
              <AdaptiveGlassView
                style={[
                  styles.inputGlass,
                  styles.multilineGlass,
                  { borderColor: theme.colors.border },
                ]}
              >
                <BottomSheetTextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Description"
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  style={[
                    styles.input,
                    styles.multilineInput,
                    { color: theme.colors.textPrimary },
                  ]}
                />
              </AdaptiveGlassView>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Type</Text>
              <View style={styles.typeGrid}>
                {typeOptions.map((option) => {
                  const isCustom = option.id === 'custom';
                  const isSelected =
                    option.id === selectedType &&
                    (!isCustom || option.customTypeId === selectedCustomTypeId);
                  return (
                    <TypeOptionItem
                      key={option.key}
                      option={option}
                      isSelected={isSelected}
                      onSelect={handleTypeSelect}
                      theme={theme}
                    />
                  );
                })}
              </View>
              <View style={styles.moreButtonContainer}>
                <Pressable
                  style={[styles.moreButton, { borderColor: theme.colors.border }]}
                  onPress={handleOpenCustomTypeModal}
                >
                  <PlusCircle size={18} color={theme.colors.textSecondary} strokeWidth={2} />
                  <Text style={[styles.moreButtonLabel, { color: theme.colors.textSecondary }]}>More</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Currency</Text>
              <Pressable
                onPress={handleOpenCurrencyPicker}
              >
                <AdaptiveGlassView
                  style={[
                    styles.currencySelector,
                    { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.currencySelectorCode, { color: theme.colors.textPrimary }]}>
                      {selectedCurrency}
                    </Text>
                    <Text
                      style={[styles.currencySelectorLabel, { color: theme.colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {selectedCurrencyLabel}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={theme.colors.textSecondary} />
                </AdaptiveGlassView>
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Amount</Text>
              <AdaptiveGlassView
                style={[
                  styles.inputGlass,
                  { borderColor: theme.colors.border },
                ]}
              >
                <BottomSheetTextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder={`Amount (${selectedCurrency})`}
                  placeholderTextColor={theme.colors.textMuted}
                  style={[
                    styles.input,
                    { color: theme.colors.textPrimary },
                  ]}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
              </AdaptiveGlassView>
            </View>

            <View style={styles.buttonRow}>
              <AnimatedPressable
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: theme.colors.primary,
                    shadowColor: '#000',
                    shadowOpacity: 0.25,
                    shadowRadius: 5,
                    shadowOffset: { width: 0, height: 3 },
                  },
                ]}
                onPress={handleSubmit}
              >
                <Text style={[styles.primaryButtonText, { color: theme.colors.white }]}>
                  {isEditMode ? 'Save' : 'Add'}
                </Text>
              </AnimatedPressable>

              <AnimatedPressable
                style={[
                  styles.secondaryButton,
                  { borderColor: theme.colors.border },
                ]}
                onPress={handleCancel}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </AnimatedPressable>
            </View>
          </KeyboardAvoidingView>
        </CustomModal>
        <CustomBottomSheet
          ref={currencySheetRef}
          snapPoints={currencySnapPoints}
          enableDynamicSizing
          enablePanDownToClose
          backgroundStyle={[
            styles.sheetBackground,
            {
              backgroundColor:
                theme.mode === 'dark'
                  ? 'rgba(22,22,28,0.92)'
                  : 'rgba(255,255,255,0.9)',
              borderColor: theme.colors.borderMuted,
            },
          ]}
          handleIndicatorStyle={[
            styles.handleIndicator,
            { backgroundColor: theme.colors.textMuted },
          ]}
          contentContainerStyle={styles.currencySheetContainer}
          onDismiss={() => setCurrencyQuery('')}
        >
          <Text style={[styles.currencySheetTitle, { color: theme.colors.textSecondary }]}>
            Select currency
          </Text>
          <AdaptiveGlassView
            style={[
              styles.inputGlass,
              { borderColor: theme.colors.border, marginBottom: 16 },
            ]}
          >
            <BottomSheetTextInput
              value={currencyQuery}
              onChangeText={setCurrencyQuery}
              placeholder="Search currency"
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, { color: theme.colors.textPrimary }]}
            />
          </AdaptiveGlassView>
          <ScrollView contentContainerStyle={styles.currencyList}>
            {filteredCurrencies.map((option) => {
              const isActive = option.code === selectedCurrency;
              return (
                <Pressable
                  key={option.code}
                  onPress={() => handleSelectCurrency(option.code)}
                  style={({ pressed }) => [styles.currencyRowPressable]}
                >
                  <AdaptiveGlassView
                    style={[
                      styles.currencyRowCard,
                      {
                        borderColor: isActive ? theme.colors.primary : theme.colors.border,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.currencySelectorCode, { color: theme.colors.textPrimary }]}>
                        {option.code}
                      </Text>
                      <Text
                        style={[styles.currencySelectorLabel, { color: theme.colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {option.label}
                      </Text>
                    </View>
                    {isActive && <Check size={18} color={theme.colors.primary} />}
                  </AdaptiveGlassView>
                </Pressable>
              );
            })}
          </ScrollView>
        </CustomBottomSheet>
        <CustomBottomSheet
          ref={customTypeSheetRef}
          snapPoints={customTypeSnapPoints}
          enableDynamicSizing={false}
          enablePanDownToClose
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          backgroundStyle={[
            styles.sheetBackground,
            {
              backgroundColor:
                theme.mode === 'dark'
                  ? 'rgba(22,22,28,0.92)'
                  : 'rgba(255,255,255,0.9)',
              borderColor: theme.colors.borderMuted,
            },
          ]}
          handleIndicatorStyle={[
            styles.handleIndicator,
            { backgroundColor: theme.colors.textMuted },
          ]}
          contentContainerStyle={styles.customSheetContainer}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
            style={styles.keyboardAvoider}
          >
            <Text style={[styles.customSheetTitle, { color: theme.colors.textSecondary }]}>
              Custom account type
            </Text>
            <AdaptiveGlassView
              style={[
                styles.inputGlass,
                { borderColor: theme.colors.border, marginHorizontal: 24 },
              ]}
            >
              <BottomSheetTextInput
                value={customTypeName}
                onChangeText={setCustomTypeName}
                placeholder="Type name"
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.input, { color: theme.colors.textPrimary }]}
              />
            </AdaptiveGlassView>
            <Text style={[styles.label, styles.customIconLabel, { color: theme.colors.textSecondary }]}>
              Icon
            </Text>
            <View style={styles.customIconGrid}>
              {CUSTOM_ICON_OPTIONS.map((option) => {
                const SelectedIcon = option.Icon;
                const isSelected = option.id === customIconChoice;
                return (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.iconChoice,
                      {
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.border,
                        backgroundColor: theme.colors.surface,
                      },
                      isSelected && { backgroundColor: theme.colors.primary + '12' },
                    ]}
                    onPress={() => setCustomIconChoice(option.id)}
                  >
                    <SelectedIcon
                      size={22}
                      color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.iconChoiceLabel,
                        {
                          color: isSelected ? theme.colors.primary : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <AnimatedPressable
              style={[
                styles.primaryButton,
                styles.createTypeButton,
                { backgroundColor: theme.colors.primary },
                !isCustomTypeValid && styles.createTypeButtonDisabled,
              ]}
              onPress={handleCreateCustomType}
              disabled={!isCustomTypeValid}
            >
              <Text style={[styles.primaryButtonText, { color: theme.colors.white }]}>Add type</Text>
            </AnimatedPressable>
          </KeyboardAvoidingView>
        </CustomBottomSheet>
      </>
    );
  },
);

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
  },
  handleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  inputGlass: {
    borderRadius: 16,
    overflow: 'hidden',
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -ITEM_SPACING / 2,
    paddingVertical: 4,
  },
  typeItem: {
    width: '33.3333%',
    paddingHorizontal: ITEM_SPACING / 2,
    marginBottom: ITEM_SPACING,
  },
  typePressable: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
  },
  typeCard: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    width: '100%',
  },
  typeInner: {
    alignItems: 'center',
    gap: 6,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  currencySelector: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencySelectorCode: {
    fontSize: 16,
    fontWeight: '700',
  },
  currencySelectorLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 24,
    marginTop: 16,
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
  keyboardAvoider: {
    flex: 1,
    paddingHorizontal: 12,
  },
  moreButtonContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  moreButton: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  moreButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  customSheetContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  currencySheetContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  currencySheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  currencyList: {
    paddingBottom: 16,
  },
  currencyRowPressable: {
    marginBottom: 12,
  },
  currencyRowCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customSheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  customIconLabel: {
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 12,
  },
  customIconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  iconChoice: {
    width: '30%',
    minWidth: 96,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  iconChoiceLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  createTypeButton: {
    marginHorizontal: 24,
    marginTop: 4,
    flex: 0,
    alignSelf: 'stretch',
  },
  createTypeButtonDisabled: {
    opacity: 0.4,
  },
});

AddAccountSheet.displayName = 'AddAccountSheet';

export default AddAccountSheet;
