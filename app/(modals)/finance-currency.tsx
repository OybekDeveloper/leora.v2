import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAppTheme } from '@/constants/theme';
import { useFinanceCurrency } from '@/hooks/useFinanceCurrency';
import { AVAILABLE_FINANCE_CURRENCIES, type FinanceCurrency } from '@/stores/useFinancePreferencesStore';

const FinanceCurrencyModal = () => {
  const theme = useAppTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {
    baseCurrency,
    globalCurrency,
    exchangeRates,
    setGlobalCurrency,
    setExchangeRate,
  } = useFinanceCurrency();

  const [selectedCurrency, setSelectedCurrency] = useState<FinanceCurrency>(globalCurrency);
  const [draftRates, setDraftRates] = useState<Record<FinanceCurrency, string>>(() => {
    const initial: Partial<Record<FinanceCurrency, string>> = {};
    AVAILABLE_FINANCE_CURRENCIES.forEach((currency) => {
      initial[currency] = String(exchangeRates[currency] ?? 1);
    });
    return initial as Record<FinanceCurrency, string>;
  });

  const handleChangeRate = (currency: FinanceCurrency, value: string) => {
    setDraftRates((prev) => ({
      ...prev,
      [currency]: value.replace(/[^0-9.]/g, ''),
    }));
  };

  const handleSave = () => {
    AVAILABLE_FINANCE_CURRENCIES.forEach((currency) => {
      if (currency === baseCurrency) {
        return;
      }
      const parsed = Number.parseFloat(draftRates[currency]);
      if (Number.isFinite(parsed) && parsed > 0) {
        setExchangeRate(currency, parsed);
      }
    });
    setGlobalCurrency(selectedCurrency);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Global currency</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={22} color={theme.colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Display currency</Text>
        <View style={styles.card}>
          {AVAILABLE_FINANCE_CURRENCIES.map((currency) => (
            <Pressable
              key={currency}
              style={[
                styles.currencyRow,
                currency === selectedCurrency && styles.currencyRowActive,
              ]}
              onPress={() => setSelectedCurrency(currency)}
            >
              <View>
                <Text style={styles.currencyCode}>{currency}</Text>
                <Text style={styles.currencyHint}>
                  {currency === baseCurrency ? 'Base currency' : 'Convert to this currency'}
                </Text>
              </View>
              <View
                style={[
                  styles.radio,
                  currency === selectedCurrency && styles.radioActive,
                ]}
              >
                {currency === selectedCurrency && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Exchange rates (1 unit)</Text>
        <View style={styles.card}>
          {AVAILABLE_FINANCE_CURRENCIES.map((currency) => (
            <View key={`rate-${currency}`} style={styles.rateRow}>
              <View>
                <Text style={styles.rateLabel}>{currency}</Text>
                <Text style={styles.rateHint}>
                  {currency === baseCurrency
                    ? 'Fixed reference'
                    : `1 ${currency} =`}
                </Text>
              </View>
              {currency === baseCurrency ? (
                <Text style={styles.rateValue}>{exchangeRates[baseCurrency]} {baseCurrency}</Text>
              ) : (
                <View style={styles.rateInputWrapper}>
                  <TextInput
                    value={draftRates[currency]}
                    onChangeText={(text) => handleChangeRate(currency, text)}
                    keyboardType="numeric"
                    style={styles.rateInput}
                  />
                  <Text style={styles.rateSuffix}>{baseCurrency}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonLabel}>Apply</Text>
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
      backgroundColor:
        theme.mode === 'dark' ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.04)',
    },
    currencyCode: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    currencyHint: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioActive: {
      borderColor: theme.colors.primary,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
    rateRow: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.borderMuted,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rateLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    rateHint: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    rateValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    rateInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    rateInput: {
      width: 90,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      paddingHorizontal: 10,
      paddingVertical: 6,
      color: theme.colors.textPrimary,
      fontSize: 14,
    },
    rateSuffix: {
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
