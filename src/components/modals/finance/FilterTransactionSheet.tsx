import React, {
  ForwardedRef,
  forwardRef,
  useCallback,
  useImperativeHandle,
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
  View,
} from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import type { LucideIcon } from 'lucide-react-native';
import { Wallet } from 'lucide-react-native';

import CustomModal, { CustomModalProps } from '@/components/modals/CustomModal';
import { BottomSheetHandle } from '@/components/modals/BottomSheet';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import {
  FINANCE_CATEGORIES,
  type FinanceCategory,
} from '@/constants/financeCategories';

type ThemeColors = ReturnType<typeof useAppTheme>['colors'];

type FilterOption = {
  id: string;
  label: string;
};

type CategoryOptionMeta = FilterOption & {
  icon: LucideIcon;
  colorToken: FinanceCategory['colorToken'];
};

export type FilterState = {
  category: string;
  account: string;
  type: string;
  minAmount: string;
  maxAmount: string;
  dateFrom: string;
  dateTo: string;
};

export interface FilterTransactionSheetHandle {
  open: () => void;
  close: () => void;
  reset: () => void;
}

interface FilterTransactionSheetProps {
  onApply?: (filters: FilterState) => void;
  onReset?: () => void;
  accountOptions?: FilterOption[];
  categoryOptions?: FilterOption[];
}

const createInitialState = (): FilterState => ({
  category: 'all',
  account: 'all',
  type: 'all',
  minAmount: '',
  maxAmount: '',
  dateFrom: '',
  dateTo: '',
});

const modalProps: Partial<CustomModalProps> = {
  variant: 'form',
  enableDynamicSizing: false,
  fallbackSnapPoint: '92%',
  scrollable: false,
  contentContainerStyle: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 },
};

const FilterTransactionSheet = forwardRef(
  (
    { onApply, onReset, accountOptions, categoryOptions }: FilterTransactionSheetProps,
    ref: ForwardedRef<FilterTransactionSheetHandle>,
  ) => {
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const filterStrings = strings.financeScreens.transactions.filterSheet;
  const modalRef = useRef<BottomSheetHandle>(null);
  const [filters, setFilters] = useState<FilterState>(() => createInitialState());
  const insets = useSafeAreaInsets();
  const [datePickerState, setDatePickerState] = useState<{ target: 'from' | 'to'; value: Date } | null>(null);
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
    [],
  );
  const typeOptions = useMemo<FilterOption[]>(
    () => [
      { id: 'all', label: filterStrings.all },
      { id: 'income', label: filterStrings.typeOptions.income },
      { id: 'outcome', label: filterStrings.typeOptions.expense },
      { id: 'transfer', label: filterStrings.typeOptions.transfer },
      { id: 'debt', label: filterStrings.typeOptions.debt ?? 'Debt' },
    ],
    [filterStrings],
  );

  const resolvedCategoryOptions = useMemo(
    () => (categoryOptions?.length ? categoryOptions : [{ id: 'all', label: filterStrings.all }]),
    [categoryOptions, filterStrings],
  );

  const resolvedAccountOptions = useMemo(
    () => (accountOptions?.length ? accountOptions : [{ id: 'all', label: filterStrings.all }]),
    [accountOptions, filterStrings],
  );

  const categoryOptionsWithMeta = useMemo<CategoryOptionMeta[]>(
    () =>
      resolvedCategoryOptions.map((option) => {
        if (option.id === 'all') {
          return { ...option, icon: Wallet, colorToken: 'textSecondary' } as CategoryOptionMeta;
        }
        const match = FINANCE_CATEGORIES.find(
          (category) => category.name.toLowerCase() === option.label.toLowerCase(),
        );
        return {
          ...option,
          icon: (match?.icon ?? Wallet) as LucideIcon,
          colorToken: (match?.colorToken ?? 'textSecondary') as FinanceCategory['colorToken'],
        };
      }),
    [resolvedCategoryOptions],
  );

  const handleOpen = useCallback(() => {
    modalRef.current?.present();
  }, []);

  const handleClose = useCallback(() => {
    modalRef.current?.dismiss();
  }, []);

  const handleReset = useCallback(() => {
    setFilters(createInitialState());
    onReset?.();
  }, [onReset]);

  const handleApply = useCallback(() => {
    onApply?.(filters);
    handleClose();
  }, [filters, handleClose, onApply]);

  useImperativeHandle(
    ref,
    () => ({
      open: handleOpen,
      close: handleClose,
      reset: handleReset,
    }),
    [handleClose, handleOpen, handleReset],
  );

  const handleOptionSelect = useCallback(
    (key: keyof FilterState, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const formatDateLabel = useCallback(
    (value: string) => (value ? dateFormatter.format(new Date(value)) : filterStrings.selectDate),
    [dateFormatter, filterStrings.selectDate],
  );

  const applyDateValue = useCallback(
    (target: 'from' | 'to', date: Date, keepOpen = false) => {
      setFilters((prev) => ({
        ...prev,
        dateFrom: target === 'from' ? date.toISOString() : prev.dateFrom,
        dateTo: target === 'to' ? date.toISOString() : prev.dateTo,
      }));
      setDatePickerState((prev) => {
        if (!keepOpen) {
          return null;
        }
        return prev ? { target, value: date } : { target, value: date };
      });
    },
    [],
  );

  const openDatePicker = useCallback(
    (target: 'from' | 'to') => {
      const source = target === 'from' ? filters.dateFrom : filters.dateTo;
      const initial = source ? new Date(source) : new Date();
      if (Platform.OS === 'android') {
        DateTimePickerAndroid.open({
          value: initial,
          mode: 'date',
          onChange: (event, selected) => {
            if (event.type === 'set' && selected) {
              applyDateValue(target, selected);
            }
          },
        });
        return;
      }
      setDatePickerState({ target, value: initial });
    },
    [applyDateValue, filters.dateFrom, filters.dateTo],
  );

  const closeDatePicker = useCallback(() => setDatePickerState(null), []);

  const handleIosDateChange = useCallback(
    (event: DateTimePickerEvent, selected?: Date) => {
      if (event.type === 'dismissed') {
        closeDatePicker();
        return;
      }
      if (selected && datePickerState) {
        applyDateValue(datePickerState.target, selected, true);
      }
    },
    [applyDateValue, closeDatePicker, datePickerState],
  );

  return (
    <>
      <CustomModal ref={modalRef} {...modalProps}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <SafeAreaView
          edges={['bottom']}
          style={[styles.safeArea, { paddingBottom: insets.bottom + 24 }]}
        >
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.sheetTitle, { color: theme.colors.textPrimary }]}>
              {filterStrings.title}
            </Text>
            <View style={styles.sections}>
              <FilterSection label={filterStrings.dateRange}>
                <View style={styles.dateRow}>
                  <Pressable
                    style={[styles.dateInput, { borderColor: theme.colors.borderMuted }]}
                    onPress={() => openDatePicker('from')}
                  >
                    <Text style={{ color: theme.colors.textPrimary }}>
                      {formatDateLabel(filters.dateFrom)}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.dateInput, { borderColor: theme.colors.borderMuted }]}
                    onPress={() => openDatePicker('to')}
                  >
                    <Text style={{ color: theme.colors.textPrimary }}>
                      {formatDateLabel(filters.dateTo)}
                    </Text>
                  </Pressable>
                </View>
              </FilterSection>

              <FilterSection label={filterStrings.type}>
                <FilterOptionRow
                  options={typeOptions}
                  selectedId={filters.type}
                  onSelect={(value) => handleOptionSelect('type', value)}
                  themeColors={theme.colors}
                  scrollable
                />
              </FilterSection>

              <FilterSection label={filterStrings.category}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryList}
                >
                  {categoryOptionsWithMeta.map((option) => {
                    const isActive = option.id === filters.category;
                    const IconComponent = option.icon as React.ComponentType<{
                      size?: number;
                      color?: string;
                    }>;
                    const accentColor = theme.colors[option.colorToken] ?? theme.colors.primary;
                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => handleOptionSelect('category', option.id)}
                        style={({ pressed }) => [
                          styles.categoryCard,
                          pressed && styles.pressedOpacity,
                        ]}
                      >
                        <AdaptiveGlassView
                          style={[
                            styles.glassSurface,
                            styles.categoryCardInner,
                            isActive && {
                              borderColor: accentColor,
                              backgroundColor:
                                theme.mode === 'dark'
                                  ? 'rgba(255,255,255,0.08)'
                                  : 'rgba(0,0,0,0.04)',
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.categoryIconWrapper,
                              {
                                backgroundColor: isActive
                                  ? accentColor
                                  : theme.mode === 'dark'
                                    ? 'rgba(255,255,255,0.08)'
                                    : 'rgba(0,0,0,0.05)',
                              },
                            ]}
                          >
                            <IconComponent
                              size={18}
                              color={isActive ? theme.colors.background : theme.colors.textSecondary}
                            />
                          </View>
                          <Text
                            style={[
                              styles.categoryCardLabel,
                              { color: isActive ? theme.colors.textPrimary : theme.colors.textMuted },
                            ]}
                            numberOfLines={2}
                          >
                            {option.label}
                          </Text>
                        </AdaptiveGlassView>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </FilterSection>

              <FilterSection label={filterStrings.accounts}>
                <FilterOptionRow
                  options={resolvedAccountOptions}
                  selectedId={filters.account}
                  onSelect={(value) => handleOptionSelect('account', value)}
                  themeColors={theme.colors}
                  scrollable
                />
              </FilterSection>

              <FilterSection label={filterStrings.amount}>
                <View style={styles.amountRow}>
                  <BottomSheetTextInput
                    value={filters.minAmount}
                    onChangeText={(value) => handleOptionSelect('minAmount', value)}
                    placeholder={filterStrings.from}
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="numeric"
                    style={[
                      styles.amountInput,
                      {
                        borderColor: theme.colors.borderMuted,
                        color: theme.colors.textPrimary,
                        backgroundColor: theme.colors.card,
                      },
                    ]}
                  />
                  <BottomSheetTextInput
                    value={filters.maxAmount}
                    onChangeText={(value) => handleOptionSelect('maxAmount', value)}
                    placeholder={filterStrings.to}
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="numeric"
                    style={[
                      styles.amountInput,
                      {
                        borderColor: theme.colors.borderMuted,
                        color: theme.colors.textPrimary,
                        backgroundColor: theme.colors.card,
                      },
                    ]}
                  />
                </View>
              </FilterSection>
            </View>

            <View style={styles.actionsContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    borderColor: theme.colors.borderMuted,
                    backgroundColor: theme.colors.background,
                  },
                  pressed && styles.pressedOpacity,
                ]}
                onPress={handleReset}
              >
                <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>
                  {filterStrings.reset}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.applyButton,
                  { backgroundColor: theme.colors.primary },
                  pressed && styles.pressedOpacity,
                ]}
                onPress={handleApply}
              >
                <Text style={[styles.actionText, { color: theme.colors.onPrimary }]}>
                  {filterStrings.apply}
                </Text>
              </Pressable>
            </View>
            <View style={{ height: insets.bottom + 24 }} />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
      </CustomModal>
      {Platform.OS === 'ios' && datePickerState && (
        <Modal transparent visible animationType="fade" onRequestClose={closeDatePicker}>
          <View style={styles.pickerModal}>
            <Pressable style={styles.pickerBackdrop} onPress={closeDatePicker} />
            <AdaptiveGlassView style={[styles.glassSurface, styles.pickerCard]}>
              <DateTimePicker
                value={datePickerState.value}
                mode="date"
                display="inline"
                onChange={handleIosDateChange}
              />
              <Pressable style={styles.pickerDoneButton} onPress={closeDatePicker}>
                <Text style={styles.pickerDoneText}>{filterStrings.apply}</Text>
              </Pressable>
            </AdaptiveGlassView>
          </View>
        </Modal>
      )}
    </>
  );
  },
);

FilterTransactionSheet.displayName = 'FilterTransactionSheet';

type FilterSectionProps = {
  label: string;
  children: React.ReactNode;
};

const FilterSection: React.FC<FilterSectionProps> = ({ label, children }) => {
  const theme = useAppTheme();
  return (
    <AdaptiveGlassView
      style={[styles.glassSurface, styles.sectionCard, { borderColor: theme.colors.borderMuted }]}
    >
      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{label}</Text>
      {children}
    </AdaptiveGlassView>
  );
};

type FilterOptionRowProps = {
  options: FilterOption[];
  selectedId: string;
  onSelect: (value: string) => void;
  themeColors: ThemeColors;
  wrap?: boolean;
  scrollable?: boolean;
};

const FilterOptionRow: React.FC<FilterOptionRowProps> = ({
  options,
  selectedId,
  onSelect,
  themeColors,
  wrap = false,
  scrollable = false,
}) => {
  const content = options.map((option) => {
    const isActive = option.id === selectedId;
    return (
      <Pressable
        key={option.id}
        onPress={() => onSelect(option.id)}
        style={({ pressed }) => [
          styles.optionPill,
          {
            backgroundColor: isActive ? themeColors.primary : 'rgba(255,255,255,0.04)',
            borderColor: isActive ? themeColors.primary : themeColors.border,
          },
          pressed && styles.pressedOpacity,
        ]}
      >
        <Text
          style={[
            styles.optionLabel,
            {
              color: isActive ? themeColors.white : themeColors.textSecondary,
            },
          ]}
        >
          {option.label}
        </Text>
      </Pressable>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.optionRow, styles.optionRowScroll]}
      >
        {content}
      </ScrollView>
    );
  }

  return (
    <View
      style={[
        styles.optionRow,
        wrap && styles.optionRowWrap,
      ]}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    gap: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sections: {
    gap: 16,
  },
  categoryList: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 12,
  },
  categoryCard: {
    marginRight: 12,
    borderRadius: 18,
  },
  categoryCardInner: {
    width: 110,
    height: 100,
    borderRadius: 18,
    padding: 14,
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  glassSurface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  sectionCard: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionRowScroll: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  optionRowWrap: {
    flexWrap: 'wrap',
    rowGap: 10,
  },
  optionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    gap: 12,
  },
  amountInput: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  applyButton: {
    borderWidth: 0,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  pressedOpacity: {
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
    borderRadius: 28,
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

export default FilterTransactionSheet;
