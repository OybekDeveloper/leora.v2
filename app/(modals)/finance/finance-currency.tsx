import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';

import { useAppTheme } from '@/constants/theme';
import { AVAILABLE_FINANCE_CURRENCIES, type FinanceCurrency, useFinancePreferencesStore } from '@/stores/useFinancePreferencesStore';
import { useLocalization } from '@/localization/useLocalization';
import { useShallow } from 'zustand/react/shallow';

const CURRENCY_LABELS: Record<FinanceCurrency, string> = {
  UZS: "O'zbek so'mi",
  USD: 'AQSH dollari',
  EUR: 'Yevro',
  GBP: 'Britaniya funti',
  TRY: 'Turk lirasi',
  SAR: 'Saudiya riyoli',
  AED: 'BAA dirhami',
  USDT: 'Tether (USDT)',
  RUB: 'Rossiya rubli',
};

const FinanceCurrencyModal = () => {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { strings } = useLocalization();
  const currencyStrings = strings.modals.financeCurrency;
  const commonStrings = (strings as any).common ?? {};
  const closeLabel = commonStrings.close ?? 'Close';
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { globalCurrency, setGlobalCurrency } = useFinancePreferencesStore(
    useShallow((state) => ({
      globalCurrency: state.globalCurrency,
      setGlobalCurrency: state.setGlobalCurrency,
    })),
  );

  const [selectedCurrency, setSelectedCurrency] = useState<FinanceCurrency>(globalCurrency);

  const handleSave = () => {
    setGlobalCurrency(selectedCurrency);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{currencyStrings.title}</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.closeText}>{closeLabel}</Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>{currencyStrings.displayCurrency}</Text>
        <View style={styles.card}>
          {AVAILABLE_FINANCE_CURRENCIES.map((currency) => {
            const isActive = currency === selectedCurrency;
            return (
              <Pressable
                key={currency}
                style={[
                  styles.currencyRow,
                  isActive && styles.currencyRowActive,
                ]}
                onPress={() => setSelectedCurrency(currency)}
              >
                <View style={styles.currencyInfo}>
                  <Text style={styles.currencyCode}>{currency}</Text>
                  <Text style={styles.currencyLabel}>{CURRENCY_LABELS[currency]}</Text>
                </View>
                {isActive && (
                  <Check size={20} color={theme.colors.primary} />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Pressable style={[styles.saveButton, { marginBottom: Math.max(insets.bottom, 20) }]} onPress={handleSave}>
        <Text style={styles.saveButtonLabel}>{currencyStrings.apply}</Text>
      </Pressable>
    </SafeAreaView>
  );
};

export default FinanceCurrencyModal;

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    closeText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    content: {
      padding: 20,
      gap: 16,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 6,
    },
    card: {
      borderRadius: 20,
      backgroundColor: theme.colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    currencyRow: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.borderMuted,
    },
    currencyRowActive: {
      backgroundColor: `${theme.colors.primary}10`,
    },
    currencyInfo: {
      gap: 2,
    },
    currencyCode: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    currencyLabel: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    saveButton: {
      margin: 20,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.onPrimary,
    },
  });
