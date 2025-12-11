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
import { FlashList as FlashListBase } from '@shopify/flash-list';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wallet } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { FINANCE_CATEGORIES, type FinanceCategory } from '@/constants/financeCategories';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import {
  type FilterState,
  useTransactionFilterStore,
} from '@/stores/useTransactionFilterStore';
import { formatNumberWithSpaces } from '@/utils/formatNumber';

const FlashList = FlashListBase as any;

type FilterOption = {
  id: string;
  label: string;
};

type CategoryOptionMeta = FilterOption & {
  icon: FinanceCategory['icon'];
  colorToken: FinanceCategory['colorToken'];
};

const FinanceFilterModal = () => {
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { strings } = useLocalization();
  const filterStrings = strings.financeScreens.transactions.filterSheet;
  const clearHint = filterStrings.clearHint ?? 'Hold to clear';
  const closeLabel = filterStrings.close ?? strings.common?.close ?? 'Close';
  const { accounts, categories } = useFinanceDomainStore();
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
    [],
  );

  const { filters, setFilters, resetFilters } = useTransactionFilterStore(
    (state) => ({
      filters: state.filters,
      setFilters: state.setFilters,
      resetFilters: state.resetFilters,
    }),
  );

  const [draftFilters, setDraftFilters] = useState<FilterState>(filters);
  const [datePickerState, setDatePickerState] = useState<{ target: 'from' | 'to'; value: Date } | null>(null);

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

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

  const resolvedAccountOptions = useMemo<FilterOption[]>(
    () => [{ id: 'all', label: filterStrings.all }, ...accounts.map((account) => ({ id: account.id, label: account.name }))],
    [accounts, filterStrings.all],
  );

  const resolvedCategoryOptions = useMemo<FilterOption[]>(
    () => [{ id: 'all', label: filterStrings.all }, ...categories.map((category) => ({ id: category, label: category }))],
    [categories, filterStrings.all],
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
          icon: (match?.icon ?? Wallet) as FinanceCategory['icon'],
          colorToken: (match?.colorToken ?? 'textSecondary') as FinanceCategory['colorToken'],
        };
      }),
    [resolvedCategoryOptions],
  );

  const handleOptionSelect = useCallback(
    (key: keyof FilterState, value: string) => {
      setDraftFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleAmountChange = useCallback(
    (key: 'minAmount' | 'maxAmount', text: string) => {
      // Faqat raqam va nuqta qabul qilish
      const cleaned = text.replace(/[^\d.]/g, '');
      // Bir nechta nuqtani oldini olish
      const parts = cleaned.split('.');
      const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
      const num = parseFloat(sanitized) || 0;
      setDraftFilters((prev) => ({
        ...prev,
        [key]: num > 0 ? formatNumberWithSpaces(num) : sanitized,
      }));
    },
    [],
  );

  const formatDateLabel = useCallback(
    (value: string) => (value ? dateFormatter.format(new Date(value)) : filterStrings.selectDate),
    [dateFormatter, filterStrings.selectDate],
  );

  const applyDateValue = useCallback(
    (target: 'from' | 'to', date: Date, keepOpen = false) => {
      setDraftFilters((prev) => ({
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

  const handleIosPickerChange = useCallback(
    (_: DateTimePickerEvent, date?: Date) => {
      if (datePickerState && date) {
        applyDateValue(datePickerState.target, date, true);
      }
    },
    [applyDateValue, datePickerState],
  );

  const openDatePicker = useCallback(
    (target: 'from' | 'to') => {
      const currentValue = draftFilters[target === 'from' ? 'dateFrom' : 'dateTo'];
      const baseDate = currentValue ? new Date(currentValue) : new Date();
      if (Platform.OS === 'android') {
        DateTimePickerAndroid.open({
          mode: 'date',
          value: baseDate,
          onChange: (event, date) => {
            if (event.type !== 'set' || !date) {
              return;
            }
            applyDateValue(target, date);
          },
        });
        return;
      }
      setDatePickerState({ target, value: baseDate });
    },
    [applyDateValue, draftFilters],
  );

  const clearDate = useCallback((target: 'from' | 'to') => {
    setDraftFilters((prev) => ({
      ...prev,
      dateFrom: target === 'from' ? '' : prev.dateFrom,
      dateTo: target === 'to' ? '' : prev.dateTo,
    }));
  }, []);

  const handleApply = useCallback(() => {
    setFilters(draftFilters);
    router.dismiss();
  }, [draftFilters, router, setFilters]);

  const handleReset = useCallback(() => {
    resetFilters();
    router.dismiss();
  }, [resetFilters, router]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          {filterStrings.title}
        </Text>
        <Pressable onPress={() => router.dismiss()} hitSlop={12}>
          <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>{closeLabel}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              {filterStrings.type}
            </Text>
            <View style={styles.row}>
              {typeOptions.map((option) => {
                const active = option.id === draftFilters.type;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => handleOptionSelect('type', option.id)}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor: active ? theme.colors.primary : 'transparent',
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        { color: active ? theme.colors.onPrimary : theme.colors.textPrimary },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.sectionFullWidth}>
            <Text style={[styles.label, styles.labelWithPadding, { color: theme.colors.textSecondary }]}>
              {filterStrings.category}
            </Text>
            <View style={styles.horizontalListContainer}>
              <FlashList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={categoryOptionsWithMeta}
                keyExtractor={(item: CategoryOptionMeta) => item.id}
                estimatedItemSize={100}
                renderItem={({ item: option }: { item: CategoryOptionMeta }) => {
                  const active = option.id === draftFilters.category;
                  const Icon = option.icon;
                  return (
                    <Pressable
                      onPress={() => handleOptionSelect('category', option.id)}
                      style={({ pressed }) => [
                        styles.chip,
                        {
                          borderColor: theme.colors.border,
                          backgroundColor: active ? theme.colors.primary : 'transparent',
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={styles.categoryChip}>
                        <Icon size={16} color={active ? theme.colors.onPrimary : theme.colors.textPrimary} />
                        <Text
                          style={[
                            styles.chipLabel,
                            { color: active ? theme.colors.onPrimary : theme.colors.textPrimary },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </View>
                    </Pressable>
                  );
                }}
                ListHeaderComponent={<View style={styles.listEdgeSpacer} />}
                ItemSeparatorComponent={() => <View style={styles.horizontalSeparator} />}
                ListFooterComponent={<View style={styles.listEdgeSpacer} />}
              />
            </View>
          </View>

          <View style={styles.sectionFullWidth}>
            <Text style={[styles.label, styles.labelWithPadding, { color: theme.colors.textSecondary }]}>
              {filterStrings.accounts}
            </Text>
            <View style={styles.horizontalListContainer}>
              <FlashList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={resolvedAccountOptions}
                keyExtractor={(item: FilterOption) => item.id}
                estimatedItemSize={80}
                renderItem={({ item: option }: { item: FilterOption }) => {
                  const active = option.id === draftFilters.account;
                  return (
                    <Pressable
                      onPress={() => handleOptionSelect('account', option.id)}
                      style={({ pressed }) => [
                        styles.chip,
                        {
                          borderColor: theme.colors.border,
                          backgroundColor: active ? theme.colors.primary : 'transparent',
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipLabel,
                          { color: active ? theme.colors.onPrimary : theme.colors.textPrimary },
                        ]}
                      >
                        {option.label}
                      </Text>
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
              {filterStrings.amount}
            </Text>
            <AdaptiveGlassView style={[styles.glass, { backgroundColor: theme.colors.card }]}>
              <View style={styles.inputRow}>
                <TextInput
                  value={draftFilters.minAmount}
                  onChangeText={(text) => handleAmountChange('minAmount', text)}
                  keyboardType="numeric"
                  placeholder={filterStrings.from}
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[styles.textInput, { color: theme.colors.textPrimary }]}
                />
                <Text style={[styles.separator, { color: theme.colors.textSecondary }]}>-</Text>
                <TextInput
                  value={draftFilters.maxAmount}
                  onChangeText={(text) => handleAmountChange('maxAmount', text)}
                  keyboardType="numeric"
                  placeholder={filterStrings.to}
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[styles.textInput, { color: theme.colors.textPrimary }]}
                />
              </View>
            </AdaptiveGlassView>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              {filterStrings.dateRange}
            </Text>
            <View style={styles.dateRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.dateButton,
                  { borderColor: theme.colors.border },
                  pressed && styles.pressed,
                ]}
                onPress={() => openDatePicker('from')}
                onLongPress={() => clearDate('from')}
              >
                <Text style={[styles.dateValue, { color: theme.colors.textPrimary }]}>
                  {formatDateLabel(draftFilters.dateFrom)}
                </Text>
                {draftFilters.dateFrom ? (
                  <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
                    {clearHint}
                  </Text>
                ) : null}
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.dateButton,
                  { borderColor: theme.colors.border },
                  pressed && styles.pressed,
                ]}
                onPress={() => openDatePicker('to')}
                onLongPress={() => clearDate('to')}
              >
                <Text style={[styles.dateValue, { color: theme.colors.textPrimary }]}>
                  {formatDateLabel(draftFilters.dateTo)}
                </Text>
                {draftFilters.dateTo ? (
                  <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
                    {clearHint}
                  </Text>
                ) : null}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { borderTopColor: theme.colors.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
          onPress={handleReset}
        >
          <Text style={[styles.secondaryLabel, { color: theme.colors.textPrimary }]}>
            {filterStrings.reset}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: theme.colors.primary },
            pressed && styles.pressed,
          ]}
          onPress={handleApply}
        >
          <Text style={[styles.primaryLabel, { color: theme.colors.onPrimary }]}>
            {filterStrings.apply}
          </Text>
        </Pressable>
      </View>

      {Platform.OS === 'ios' && datePickerState && (
        <Modal
          transparent
          animationType="fade"
          visible
          onRequestClose={() => setDatePickerState(null)}
        >
          <View style={styles.pickerOverlay}>
            <Pressable style={styles.backdrop} onPress={() => setDatePickerState(null)} />
            <AdaptiveGlassView style={[styles.pickerCard, { backgroundColor: theme.colors.card }]}>
              <DateTimePicker
                value={datePickerState.value}
                mode="date"
                display="inline"
                onChange={handleIosPickerChange}
              />
              <Pressable onPress={() => setDatePickerState(null)} style={styles.pickerDone}>
                <Text style={[styles.primaryLabel, { color: theme.colors.textPrimary }]}>
                  {closeLabel}
                </Text>
              </Pressable>
            </AdaptiveGlassView>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default FinanceFilterModal;

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
    gap: 12,
  },
  sectionFullWidth: {
    gap: 12,
    marginHorizontal: -20,
  },
  horizontalListContainer: {
    height: 52,
  },
  listEdgeSpacer: {
    width: 20,
  },
  horizontalSeparator: {
    width: 10,
  },
  labelWithPadding: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  glass: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },
  separator: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  hint: {
    marginTop: 4,
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    marginRight: 12,
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  pickerCard: {
    borderRadius: 16,
    padding: 16,
  },
  pickerDone: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
});
