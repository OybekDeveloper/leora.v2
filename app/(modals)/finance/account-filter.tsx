// app/(modals)/finance/account-filter.tsx
import React, { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import {
  AVAILABLE_FINANCE_CURRENCIES,
  type FinanceCurrency,
} from '@/stores/useFinancePreferencesStore';
import { useShallow } from 'zustand/react/shallow';

export default function AccountFilterModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    selectedAccountIds?: string;
    balanceCurrency?: FinanceCurrency;
  }>();

  const theme = useAppTheme();
  const { strings } = useLocalization();
  const reviewStrings = strings.financeScreens.review;
  const styles = createStyles(theme);

  const { accounts } = useFinanceDomainStore(
    useShallow((state) => ({
      accounts: state.accounts,
    })),
  );

  // Parse initial values from params
  const initialSelectedIds = params.selectedAccountIds
    ? params.selectedAccountIds.split(',').filter(Boolean)
    : [];
  const initialCurrency = (params.balanceCurrency as FinanceCurrency) || 'USD';

  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(initialSelectedIds);
  const [balanceCurrency, setBalanceCurrency] = useState<FinanceCurrency>(initialCurrency);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleApply = useCallback(() => {
    // Navigate back with updated params
    router.setParams({
      selectedAccountIds: selectedAccountIds.join(','),
      balanceCurrency,
    });
    router.back();
  }, [router, selectedAccountIds, balanceCurrency]);

  const handleSelectAll = useCallback(() => {
    setSelectedAccountIds([]);
  }, []);

  const toggleAccount = useCallback((accountId: string) => {
    setSelectedAccountIds((prev) => {
      if (!prev.length) {
        // If all accounts selected, deselect all except clicked
        return accounts.filter((acc) => acc.id !== accountId).map((acc) => acc.id);
      }
      if (prev.includes(accountId)) {
        const next = prev.filter((id) => id !== accountId);
        return next;
      }
      return [...prev, accountId];
    });
  }, [accounts]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
          {reviewStrings.accountFilterTitle}
        </Text>
        <Pressable onPress={handleClose} hitSlop={12}>
          <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>Close</Text>
        </Pressable>
      </View>

      <View style={styles.content}>

          {/* Currency Selection */}
          <Text style={[styles.accountFilterSectionTitle, { color: theme.colors.textSecondary }]}>
            {reviewStrings.accountFilterCurrencyLabel}
          </Text>
          <View style={styles.currencyChipGrid}>
            {AVAILABLE_FINANCE_CURRENCIES.map((code) => {
              const isActive = balanceCurrency === code;
              return (
                <Pressable
                  key={code}
                  style={({ pressed }) => [
                    styles.currencyChip,
                    {
                      borderColor: isActive ? theme.colors.primary : theme.colors.border,
                      backgroundColor: isActive ? `${theme.colors.primary}22` : theme.colors.card,
                    },
                    pressed && styles.pressed,
                  ]}
                  onPress={() => setBalanceCurrency(code)}
                >
                  <Text
                    style={[
                      styles.currencyChipText,
                      { color: isActive ? theme.colors.primary : theme.colors.textSecondary },
                    ]}
                  >
                    {code}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Account Selection */}
          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            {accounts.map((account) => {
              const isSelected =
                selectedAccountIds.length === 0 || selectedAccountIds.includes(account.id);
              return (
                <Pressable
                  key={account.id}
                  style={({ pressed }) => [styles.accountFilterRow, pressed && styles.pressed]}
                  onPress={() => toggleAccount(account.id)}
                >
                  <Text style={[styles.accountFilterName, { color: theme.colors.textPrimary }]}>
                    {account.name}
                  </Text>
                  <Text style={{ color: isSelected ? theme.colors.primary : theme.colors.textSecondary }}>
                    {isSelected ? '✓' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

      </View>

      {/* Actions */}
      <View style={styles.modalActions}>
        <Pressable
          style={({ pressed }) => [styles.modalSecondaryButton, { borderColor: theme.colors.border }, pressed && styles.pressed]}
          onPress={handleSelectAll}
        >
          <Text style={[styles.modalSecondaryLabel, { color: theme.colors.textSecondary }]}>
            {reviewStrings.accountFilterSelectAll}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.modalPrimaryButton,
            { backgroundColor: theme.colors.primary },
            pressed && styles.pressed,
          ]}
          onPress={handleApply}
        >
          <Text style={[styles.modalPrimaryLabel, { color: theme.colors.onPrimary }]}>{reviewStrings.accountFilterApply}</Text>
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
    closeText: {
      fontSize: 14,
      fontWeight: '500',
    },
    pressed: {
      opacity: 0.7,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
      gap: 16,
    },
    accountFilterSectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginTop: 8,
      marginBottom: 4,
    },
    currencyChipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    currencyChip: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    currencyChipText: {
      fontSize: 13,
      fontWeight: '600',
    },
    accountFilterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
    },
    accountFilterName: {
      fontSize: 14,
      fontWeight: '600',
    },
    modalActions: {
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
