// app/(modals)/finance/fx-override.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import {
  AVAILABLE_FINANCE_CURRENCIES,
  type FinanceCurrency,
  useFinancePreferencesStore,
} from '@/stores/useFinancePreferencesStore';
import { useShallow } from 'zustand/react/shallow';
import type { FxProviderId } from '@/services/fx/providers';

export default function FxOverrideModal() {
  const router = useRouter();
  const theme = useAppTheme();
  const { strings, locale } = useLocalization();
  const fxStrings = strings.financeScreens.review.fxQuick;
  const styles = createStyles(theme);

  const { syncExchangeRates, overrideExchangeRate, baseCurrency: financePreferencesBaseCurrency } =
    useFinancePreferencesStore(
      useShallow((state) => ({
        syncExchangeRates: state.syncExchangeRates,
        overrideExchangeRate: state.overrideExchangeRate,
        baseCurrency: state.baseCurrency,
      })),
    );

  const [selectedProvider, setSelectedProvider] = useState<FxProviderId>('central_bank_stub');
  const [fxSyncing, setFxSyncing] = useState(false);
  const [fxStatus, setFxStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [overrideRateInput, setOverrideRateInput] = useState('');
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const providerOptions = useMemo(
    () => [
      { id: 'central_bank_stub' as FxProviderId, label: fxStrings.providers.central_bank_stub },
      { id: 'market_stub' as FxProviderId, label: fxStrings.providers.market_stub },
    ],
    [fxStrings.providers],
  );

  const [overrideCurrency, setOverrideCurrency] = useState<FinanceCurrency>(() => {
    const fallback =
      AVAILABLE_FINANCE_CURRENCIES.find((code) => code !== financePreferencesBaseCurrency) ??
      financePreferencesBaseCurrency;
    return fallback as FinanceCurrency;
  });

  useEffect(() => {
    if (overrideCurrency === financePreferencesBaseCurrency) {
      const fallback =
        AVAILABLE_FINANCE_CURRENCIES.find((code) => code !== financePreferencesBaseCurrency) ??
        financePreferencesBaseCurrency;
      setOverrideCurrency(fallback as FinanceCurrency);
    }
  }, [financePreferencesBaseCurrency, overrideCurrency]);

  const lastSyncLabel = useMemo(() => {
    if (!lastSyncAt) {
      return null;
    }
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(lastSyncAt);
  }, [lastSyncAt, locale]);

  const handleQuickSync = useCallback(async () => {
    setFxStatus(null);
    try {
      setFxSyncing(true);
      await syncExchangeRates(selectedProvider);
      setLastSyncAt(new Date());
      const providerLabel = providerOptions.find((option) => option.id === selectedProvider)?.label ?? '';
      setFxStatus({
        type: 'success',
        message: fxStrings.syncSuccess.replace('{provider}', providerLabel),
      });
    } catch (error) {
      setFxStatus({ type: 'error', message: fxStrings.syncError });
    } finally {
      setFxSyncing(false);
    }
  }, [fxStrings.syncError, fxStrings.syncSuccess, providerOptions, selectedProvider, syncExchangeRates]);

  const handleApplyOverride = useCallback(() => {
    const normalizedValue = Number(overrideRateInput.replace(/\s+/g, '').replace(',', '.'));
    if (overrideCurrency === financePreferencesBaseCurrency) {
      setOverrideError(fxStrings.overrideBaseError);
      return;
    }
    if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
      setOverrideError(fxStrings.overrideError);
      return;
    }
    overrideExchangeRate(overrideCurrency, normalizedValue);
    setFxStatus({
      type: 'success',
      message: fxStrings.overrideSuccess.replace('{currency}', overrideCurrency),
    });
    setOverrideRateInput('');
    setOverrideError(null);
    // Close modal after successful override
    setTimeout(() => router.back(), 500);
  }, [
    financePreferencesBaseCurrency,
    fxStrings.overrideBaseError,
    fxStrings.overrideError,
    fxStrings.overrideSuccess,
    overrideCurrency,
    overrideExchangeRate,
    overrideRateInput,
    router,
  ]);

  const overrideCurrencyOptions = useMemo(
    () => AVAILABLE_FINANCE_CURRENCIES.filter((code) => code !== financePreferencesBaseCurrency),
    [financePreferencesBaseCurrency],
  );

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>{fxStrings.title}</Text>
        <Pressable onPress={handleClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
          <X size={24} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Provider Selection */}
          <View>
            <Text style={styles.fxQuickLabel}>{fxStrings.providerLabel}</Text>
            <View style={styles.fxProviderRow}>
              {providerOptions.map((option) => {
                const isActive = option.id === selectedProvider;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setSelectedProvider(option.id)}
                    style={({ pressed }) => [
                      styles.fxProviderChip,
                      {
                        borderColor: isActive ? theme.colors.primary : theme.colors.border,
                        backgroundColor: isActive ? `${theme.colors.primary}22` : theme.colors.card,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.fxProviderChipText,
                        { color: isActive ? theme.colors.primary : theme.colors.textSecondary },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.fxQuickRow}>
            <Pressable
              onPress={handleQuickSync}
              disabled={fxSyncing}
              style={({ pressed }) => [
                styles.fxActionButton,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.fxActionLabel, { color: theme.colors.textPrimary }]}>
                {fxSyncing ? fxStrings.syncing : fxStrings.syncButton}
              </Text>
              {fxSyncing ? (
                <ActivityIndicator color={theme.colors.primary} size="small" />
              ) : (
                <Text style={[styles.fxActionDescription, { color: theme.colors.textSecondary }]}>
                  {fxStrings.syncDescription}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Status Messages */}
          {fxStatus ? (
            <Text
              style={[
                styles.fxStatusText,
                { color: fxStatus.type === 'error' ? theme.colors.danger : theme.colors.success },
              ]}
            >
              {fxStatus.message}
            </Text>
          ) : null}
          {lastSyncLabel ? (
            <Text style={[styles.fxStatusMuted, { color: theme.colors.textSecondary }]}>
              {fxStrings.lastSync.replace('{value}', lastSyncLabel)}
            </Text>
          ) : null}

          {/* Override Section */}
          <View style={styles.divider} />
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>{fxStrings.overrideTitle}</Text>
          <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
            {fxStrings.overrideHint.replace('{base}', financePreferencesBaseCurrency)}
          </Text>

          {/* Currency Selection */}
          <View style={styles.currencyChipGrid}>
            {overrideCurrencyOptions.map((code) => {
              const isActive = code === overrideCurrency;
              return (
                <Pressable
                  key={code}
                  onPress={() => setOverrideCurrency(code)}
                  style={({ pressed }) => [
                    styles.currencyChip,
                    {
                      borderColor: isActive ? theme.colors.primary : theme.colors.border,
                      backgroundColor: isActive ? `${theme.colors.primary}22` : theme.colors.card,
                    },
                    pressed && styles.pressed,
                  ]}
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

          {/* Rate Input */}
          <TextInput
            value={overrideRateInput}
            onChangeText={setOverrideRateInput}
            placeholder={fxStrings.overridePlaceholder}
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="decimal-pad"
            style={[
              styles.modalInput,
              {
                color: theme.colors.textPrimary,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.card,
              },
            ]}
          />

          {/* Error Message */}
          {overrideError ? (
            <Text style={[styles.fxStatusText, { color: theme.colors.danger }]}>{overrideError}</Text>
          ) : null}

      </ScrollView>

      {/* Actions */}
      <View style={styles.modalActions}>
        <Pressable
          style={({ pressed }) => [styles.modalSecondaryButton, { borderColor: theme.colors.border }, pressed && styles.pressed]}
          onPress={handleClose}
        >
          <Text style={[styles.modalSecondaryLabel, { color: theme.colors.textSecondary }]}>
            {fxStrings.overrideCancel}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.modalPrimaryButton,
            { backgroundColor: theme.colors.primary },
            pressed && styles.pressed,
          ]}
          onPress={handleApplyOverride}
        >
          <Text style={styles.modalPrimaryLabel}>{fxStrings.overrideConfirm}</Text>
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
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 20,
      gap: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginTop: 8,
    },
    modalSubtitle: {
      fontSize: 13,
      lineHeight: 20,
    },
    fxQuickLabel: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    fxProviderRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    fxProviderChip: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    fxProviderChipText: {
      fontSize: 12,
      fontWeight: '600',
    },
    fxQuickRow: {
      flexDirection: 'row',
      gap: 12,
    },
    fxActionButton: {
      flex: 1,
      borderRadius: 16,
      padding: 14,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 6,
    },
    fxActionLabel: {
      fontSize: 14,
      fontWeight: '700',
    },
    fxActionDescription: {
      fontSize: 12,
      lineHeight: 16,
    },
    fxStatusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    fxStatusMuted: {
      fontSize: 11,
      marginTop: -2,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
      marginVertical: 8,
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
    modalInput: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
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
