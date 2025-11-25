// app/(modals)/finance/transaction-monitor.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { X } from 'lucide-react-native';

import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useFinanceCurrency } from '@/hooks/useFinanceCurrency';
import { useShallow } from 'zustand/react/shallow';

export default function TransactionMonitorModal() {
  const router = useRouter();
  const theme = useAppTheme();
  const { strings, locale } = useLocalization();
  const reviewStrings = strings.financeScreens.review;
  const styles = createStyles(theme);

  const { accounts, transactions } = useFinanceDomainStore(
    useShallow((state) => ({
      accounts: state.accounts,
      transactions: state.transactions,
    })),
  );

  const { formatCurrency: formatFinanceCurrency, globalCurrency } = useFinanceCurrency();

  const [monitorAccountIds, setMonitorAccountIds] = useState<string[]>([]);
  const [monitorTypes, setMonitorTypes] = useState<('income' | 'expense' | 'transfer')[]>([]);
  const [monitorSearch, setMonitorSearch] = useState('');
  const [monitorDateFrom, setMonitorDateFrom] = useState<Date | null>(null);
  const [monitorDateTo, setMonitorDateTo] = useState<Date | null>(null);
  const [monitorDatePicker, setMonitorDatePicker] = useState<{
    target: 'from' | 'to';
    value: Date;
  } | null>(null);

  const monitorTypeOptions: ('income' | 'expense' | 'transfer')[] = ['income', 'expense', 'transfer'];

  const monitorDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }),
    [locale],
  );

  const formatMonitorDate = useCallback(
    (date: Date | null) => (date ? monitorDateFormatter.format(date) : reviewStrings.monitorNoDate),
    [monitorDateFormatter, reviewStrings.monitorNoDate],
  );

  const applyMonitorDate = useCallback((target: 'from' | 'to', value: Date) => {
    if (target === 'from') {
      setMonitorDateFrom(value);
    } else {
      setMonitorDateTo(value);
    }
    setMonitorDatePicker(null);
  }, []);

  const openMonitorDatePicker = useCallback(
    (target: 'from' | 'to') => {
      const baseValue = (target === 'from' ? monitorDateFrom : monitorDateTo) ?? new Date();
      if (Platform.OS === 'android') {
        DateTimePickerAndroid.open({
          value: baseValue,
          mode: 'date',
          onChange: (event, selected) => {
            if (event.type === 'set' && selected) {
              applyMonitorDate(target, selected);
            }
          },
        });
        return;
      }
      setMonitorDatePicker({ target, value: baseValue });
    },
    [applyMonitorDate, monitorDateFrom, monitorDateTo],
  );

  const handleMonitorIosPicker = useCallback(
    (event: DateTimePickerEvent, selected?: Date) => {
      if (event.type === 'dismissed') {
        setMonitorDatePicker(null);
        return;
      }
      if (selected && monitorDatePicker) {
        applyMonitorDate(monitorDatePicker.target, selected);
      }
    },
    [applyMonitorDate, monitorDatePicker],
  );

  const monitorFilteredTransactions = useMemo(() => {
    return transactions
      .filter((transaction) => {
        if (monitorAccountIds.length) {
          const refs = [transaction.accountId, transaction.fromAccountId, transaction.toAccountId].filter(
            Boolean,
          ) as string[];
          if (!refs.some((id) => monitorAccountIds.includes(id))) {
            return false;
          }
        }
        if (monitorTypes.length && !monitorTypes.includes(transaction.type)) {
          return false;
        }
        if (monitorSearch.trim()) {
          const haystack = `${transaction.description ?? ''} ${transaction.categoryId ?? ''}`.toLowerCase();
          if (!haystack.includes(monitorSearch.trim().toLowerCase())) {
            return false;
          }
        }
        const txnDate = new Date(transaction.date);
        if (monitorDateFrom && txnDate < monitorDateFrom) {
          return false;
        }
        if (monitorDateTo && txnDate > monitorDateTo) {
          return false;
        }
        return true;
      })
      .slice(0, 20);
  }, [
    monitorAccountIds,
    monitorTypes,
    monitorDateFrom,
    monitorDateTo,
    monitorSearch,
    transactions,
  ]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleReset = useCallback(() => {
    setMonitorAccountIds([]);
    setMonitorTypes([]);
    setMonitorSearch('');
    setMonitorDateFrom(null);
    setMonitorDateTo(null);
  }, []);

  const toggleAccountId = useCallback((accountId: string) => {
    setMonitorAccountIds((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId],
    );
  }, []);

  const toggleType = useCallback((type: 'income' | 'expense' | 'transfer') => {
    setMonitorTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type],
    );
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
          {reviewStrings.monitorTitle}
        </Text>
        <Pressable onPress={handleClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
          <X size={24} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.monitorHeader}>
        <TextInput
          value={monitorSearch}
          onChangeText={setMonitorSearch}
          placeholder={reviewStrings.monitorSearchPlaceholder}
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.monitorInput, { borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
        />
      </View>

      <ScrollView
        style={styles.monitorScroll}
        contentContainerStyle={styles.monitorScrollContent}
        showsVerticalScrollIndicator={false}
      >
          {/* Accounts Section */}
          <View style={styles.monitorSection}>
            <Text style={[styles.accountFilterSectionTitle, { color: theme.colors.textSecondary }]}>
              {reviewStrings.monitorAccounts}
            </Text>
            <View style={styles.monitorChipGrid}>
              {accounts.map((account) => {
                const isActive = monitorAccountIds.includes(account.id);
                return (
                  <Pressable
                    key={account.id}
                    style={({ pressed }) => [
                      styles.monitorChip,
                      {
                        borderColor: isActive ? theme.colors.primary : theme.colors.border,
                        backgroundColor: isActive ? `${theme.colors.primary}22` : theme.colors.card,
                      },
                      pressed && styles.pressed,
                    ]}
                    onPress={() => toggleAccountId(account.id)}
                  >
                    <Text
                      style={[
                        styles.monitorChipText,
                        { color: isActive ? theme.colors.primary : theme.colors.textSecondary },
                      ]}
                    >
                      {account.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Transaction Types Section */}
          <View style={styles.monitorSection}>
            <Text style={[styles.accountFilterSectionTitle, { color: theme.colors.textSecondary }]}>
              {reviewStrings.monitorTypesTitle}
            </Text>
            <View style={styles.monitorChipGrid}>
              {monitorTypeOptions.map((type) => {
                const isActive = monitorTypes.includes(type);
                return (
                  <Pressable
                    key={type}
                    style={({ pressed }) => [
                      styles.monitorChip,
                      {
                        borderColor: isActive ? theme.colors.primary : theme.colors.border,
                        backgroundColor: isActive ? `${theme.colors.primary}22` : theme.colors.card,
                      },
                      pressed && styles.pressed,
                    ]}
                    onPress={() => toggleType(type)}
                  >
                    <Text
                      style={[
                        styles.monitorChipText,
                        { color: isActive ? theme.colors.primary : theme.colors.textSecondary },
                      ]}
                    >
                      {reviewStrings.monitorTypes[type]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Date Range Section */}
          <View style={[styles.monitorSection, styles.monitorDatesRow]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.accountFilterSectionTitle, { color: theme.colors.textSecondary }]}>
                {reviewStrings.monitorDateFrom}
              </Text>
              <Pressable
                style={[styles.monitorDateInput, { borderColor: theme.colors.border }]}
                onPress={() => openMonitorDatePicker('from')}
              >
                <Text style={{ color: theme.colors.textPrimary }}>{formatMonitorDate(monitorDateFrom)}</Text>
              </Pressable>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.accountFilterSectionTitle, { color: theme.colors.textSecondary }]}>
                {reviewStrings.monitorDateTo}
              </Text>
              <Pressable
                style={[styles.monitorDateInput, { borderColor: theme.colors.border }]}
                onPress={() => openMonitorDatePicker('to')}
              >
                <Text style={{ color: theme.colors.textPrimary }}>{formatMonitorDate(monitorDateTo)}</Text>
              </Pressable>
            </View>
          </View>

          {/* Results Section */}
          <View style={styles.monitorSection}>
            <Text style={[styles.accountFilterSectionTitle, { color: theme.colors.textSecondary }]}>
              {reviewStrings.monitorResults}
            </Text>
            {monitorFilteredTransactions.length ? (
              monitorFilteredTransactions.map((transaction) => (
                <View key={transaction.id} style={[styles.monitorTransactionCard, { borderColor: theme.colors.border }]}>
                  <Text style={[styles.monitorRowTitle, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                    {transaction.description ?? transaction.categoryId ?? '—'}
                  </Text>
                  <Text
                    style={{ color: transaction.type === 'income' ? theme.colors.success : theme.colors.danger }}
                  >
                    {transaction.type === 'income' ? '+' : '−'}{' '}
                    {formatFinanceCurrency(transaction.amount, {
                      fromCurrency: (transaction.currency ?? globalCurrency) as any,
                      convert: false,
                    })}
                  </Text>
                  <Text style={[styles.monitorRowTime, { color: theme.colors.textMuted }]}>
                    {new Date(transaction.date).toLocaleString()}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ color: theme.colors.textSecondary }}>{reviewStrings.monitorEmpty}</Text>
            )}
          </View>
      </ScrollView>

      {/* iOS Date Picker */}
      {monitorDatePicker && Platform.OS === 'ios' && (
        <DateTimePicker
          value={monitorDatePicker.value}
          mode="date"
          display="spinner"
          onChange={handleMonitorIosPicker}
        />
      )}

      {/* Footer Actions */}
      <View style={styles.monitorFooter}>
        <Pressable
          style={({ pressed }) => [styles.modalSecondaryButton, { borderColor: theme.colors.border }, pressed && styles.pressed]}
          onPress={handleReset}
        >
          <Text style={[styles.modalSecondaryLabel, { color: theme.colors.textSecondary }]}>
            {reviewStrings.monitorReset}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.modalPrimaryButton,
            { backgroundColor: theme.colors.primary },
            pressed && styles.pressed,
          ]}
          onPress={handleClose}
        >
          <Text style={styles.modalPrimaryLabel}>{reviewStrings.monitorApply}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    closeButton: {
      padding: 4,
      borderRadius: 8,
    },
    pressed: {
      opacity: 0.7,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
    },
    monitorHeader: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    monitorInput: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
    },
    monitorScroll: {
      flex: 1,
    },
    monitorScrollContent: {
      gap: 20,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    monitorSection: {
      gap: 10,
    },
    accountFilterSectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginTop: 8,
      marginBottom: 4,
    },
    monitorChipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 6,
    },
    monitorChip: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    monitorChipText: {
      fontSize: 12,
      fontWeight: '600',
    },
    monitorDatesRow: {
      flexDirection: 'row',
      gap: 12,
    },
    monitorDateInput: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      minHeight: 46,
      justifyContent: 'center',
    },
    monitorTransactionCard: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 16,
      padding: 12,
      backgroundColor: theme.colors.card,
      gap: 4,
    },
    monitorRowTitle: {
      fontSize: 14,
      fontWeight: '600',
    },
    monitorRowTime: {
      fontSize: 11,
    },
    monitorFooter: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      paddingBottom: 16,
      paddingTop: 8,
    },
    modalSecondaryButton: {
      flex: 1,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: 'center',
      paddingVertical: 12,
    },
    modalSecondaryLabel: {
      fontSize: 14,
      fontWeight: '600',
    },
    modalPrimaryButton: {
      flex: 1,
      borderRadius: 16,
      alignItems: 'center',
      paddingVertical: 12,
    },
    modalPrimaryLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.onPrimary,
    },
  });
