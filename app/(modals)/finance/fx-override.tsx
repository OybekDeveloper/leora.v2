// app/(modals)/finance/fx-override.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Pencil, History, Trash2, Check } from 'lucide-react-native';

import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import {
  AVAILABLE_FINANCE_CURRENCIES,
  type FinanceCurrency,
  useFinancePreferencesStore,
} from '@/stores/useFinancePreferencesStore';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useShallow } from 'zustand/react/shallow';
import { type FxProviderId, getProviderForRegion } from '@/services/fx/providers';
import { FxService } from '@/services/fx/FxService';
import type { FxRate } from '@/domain/finance/types';

export default function FxOverrideModal() {
  const router = useRouter();
  const theme = useAppTheme();
  const { strings, locale } = useLocalization();
  const fxStrings = strings.financeScreens.review.fxQuick;
  const styles = createStyles(theme);

  const { syncExchangeRates, overrideExchangeRate, baseCurrency: financePreferencesBaseCurrency, region } =
    useFinancePreferencesStore(
      useShallow((state) => ({
        syncExchangeRates: state.syncExchangeRates,
        overrideExchangeRate: state.overrideExchangeRate,
        baseCurrency: state.baseCurrency,
        region: state.region,
      })),
    );

  const fxRates = useFinanceDomainStore((state) => state.fxRates);

  const defaultProvider = getProviderForRegion(region);
  const [selectedProvider, setSelectedProvider] = useState<FxProviderId>(defaultProvider);
  const [fxSyncing, setFxSyncing] = useState(false);
  const [fxStatus, setFxStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [overrideRateInput, setOverrideRateInput] = useState('');
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editingRateValue, setEditingRateValue] = useState('');

  // Format rate for display
  const formatRate = useCallback(
    (rate: number) => {
      const maxFractionDigits = financePreferencesBaseCurrency === 'UZS' ? 0 : 4;
      return new Intl.NumberFormat(locale, {
        maximumFractionDigits: maxFractionDigits,
        minimumFractionDigits: 0,
      }).format(rate);
    },
    [financePreferencesBaseCurrency, locale]
  );

  // Format timestamp for journal
  const formatJournalDate = useCallback(
    (dateString: string) => {
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dateString));
    },
    [locale]
  );

  // Source label mapping
  const getSourceLabel = useCallback((source: string) => {
    const labels: Record<string, string> = {
      cbu: 'CBU',
      cbr: 'CBR',
      tcmb: 'TCMB',
      sama: 'SAMA',
      cbuae: 'CBUAE',
      ecb: 'ECB',
      fed: 'FED',
      boe: 'BOE',
      market_api: 'Market',
      manual: (fxStrings as any).journalManual ?? 'Manual',
    };
    return labels[source] ?? source.toUpperCase();
  }, [fxStrings]);

  // Handle edit override from history modal - start inline editing
  const handleStartEditJournal = useCallback((rate: FxRate) => {
    setEditingRateId(rate.id);
    setEditingRateValue(String(rate.rate));
  }, []);

  // Save edited journal entry
  const handleSaveEditJournal = useCallback(() => {
    if (!editingRateId) return;
    const normalizedValue = Number(editingRateValue.replace(/\s+/g, '').replace(',', '.'));
    if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
      return;
    }
    FxService.getInstance().updateRate(editingRateId, normalizedValue);
    setEditingRateId(null);
    setEditingRateValue('');
  }, [editingRateId, editingRateValue]);

  // Cancel editing
  const handleCancelEditJournal = useCallback(() => {
    setEditingRateId(null);
    setEditingRateValue('');
  }, []);

  // Delete journal entry
  const handleDeleteJournalEntry = useCallback((rate: FxRate) => {
    Alert.alert(
      (fxStrings as any).deleteTitle ?? 'Delete Rate',
      (fxStrings as any).deleteMessage ?? `Delete rate ${rate.fromCurrency} → ${rate.toCurrency}?`,
      [
        { text: (fxStrings as any).deleteCancel ?? 'Cancel', style: 'cancel' },
        {
          text: (fxStrings as any).deleteConfirm ?? 'Delete',
          style: 'destructive',
          onPress: () => {
            FxService.getInstance().deleteRate(rate.id);
          },
        },
      ]
    );
  }, [fxStrings]);

  // Handle edit override from history modal - use as new rate
  const handleEditFromHistory = useCallback((rate: FxRate) => {
    setOverrideCurrency(rate.fromCurrency as FinanceCurrency);
    setOverrideRateInput(String(rate.rate));
    setHistoryModalVisible(false);
  }, []);

  const providerOptions = useMemo(
    () => [
      { id: defaultProvider, label: fxStrings.providers.central_bank ?? 'Central Bank' },
      { id: 'market_api' as FxProviderId, label: fxStrings.providers.market ?? 'Market API' },
    ],
    [fxStrings.providers, defaultProvider],
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

  // Get current rate for selected currency pair
  const currentRateForSelected = useMemo(() => {
    const relevantRates = fxRates.filter(
      (rate) => rate.fromCurrency === overrideCurrency && rate.toCurrency === financePreferencesBaseCurrency
    );
    if (relevantRates.length === 0) return null;
    // Get latest by updatedAt
    return relevantRates.reduce((latest, rate) =>
      new Date(rate.updatedAt) > new Date(latest.updatedAt) ? rate : latest
    );
  }, [fxRates, overrideCurrency, financePreferencesBaseCurrency]);

  // Get all manual override rates for history modal
  const manualOverrideRates = useMemo(() => {
    return fxRates
      .filter((rate) => rate.isOverridden && rate.toCurrency === financePreferencesBaseCurrency)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [fxRates, financePreferencesBaseCurrency]);

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

          {/* Current Rate for Selected Pair */}
          {currentRateForSelected && (
            <View
              style={[
                styles.currentRateCard,
                currentRateForSelected.isOverridden && styles.currentRateCardOverridden,
                { backgroundColor: currentRateForSelected.isOverridden ? `${theme.colors.primary}08` : theme.colors.card },
              ]}
            >
              <View style={styles.currentRateContent}>
                <Text style={[styles.currentRateLabel, { color: theme.colors.textSecondary }]}>
                  {(fxStrings as any).currentRate ?? 'Current Rate'}
                </Text>
                <View style={styles.currentRateRow}>
                  <Text style={[styles.currentRateValue, { color: theme.colors.textPrimary }]}>
                    1 {overrideCurrency} = {formatRate(currentRateForSelected.rate)} {financePreferencesBaseCurrency}
                  </Text>
                </View>
                <View style={styles.currentRateMeta}>
                  <View
                    style={[
                      styles.journalSourceBadge,
                      {
                        backgroundColor: currentRateForSelected.isOverridden
                          ? `${theme.colors.primary}20`
                          : theme.colors.background,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.journalSourceText,
                        { color: currentRateForSelected.isOverridden ? theme.colors.primary : theme.colors.textMuted },
                      ]}
                    >
                      {getSourceLabel(currentRateForSelected.source)}
                    </Text>
                  </View>
                  <Text style={[styles.journalDate, { color: theme.colors.textMuted }]}>
                    {formatJournalDate(currentRateForSelected.updatedAt)}
                  </Text>
                </View>
              </View>
              {currentRateForSelected.isOverridden && (
                <Pressable
                  onPress={() => {
                    setOverrideRateInput(String(currentRateForSelected.rate));
                  }}
                  style={({ pressed }) => [styles.journalEditButton, pressed && styles.pressed]}
                  hitSlop={8}
                >
                  <Pencil size={16} color={theme.colors.primary} />
                </Pressable>
              )}
            </View>
          )}

          {/* History Button */}
          {manualOverrideRates.length > 0 && (
            <Pressable
              onPress={() => setHistoryModalVisible(true)}
              style={({ pressed }) => [
                styles.historyButton,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                pressed && styles.pressed,
              ]}
            >
              <History size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.historyButtonText, { color: theme.colors.textPrimary }]}>
                {(fxStrings as any).historyButton ?? 'Manual Rates History'}
              </Text>
              <View style={styles.historyBadge}>
                <Text style={[styles.historyBadgeText, { color: theme.colors.primary }]}>
                  {manualOverrideRates.length}
                </Text>
              </View>
            </Pressable>
          )}

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

      {/* History Modal */}
      <Modal
        visible={historyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              {(fxStrings as any).historyTitle ?? 'Manual Rates History'}
            </Text>
            <Pressable
              onPress={() => setHistoryModalVisible(false)}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <X size={24} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.historyScrollContent}>
            {manualOverrideRates.length === 0 ? (
              <View style={styles.emptyHistory}>
                <History size={48} color={theme.colors.textMuted} />
                <Text style={[styles.emptyHistoryText, { color: theme.colors.textMuted }]}>
                  {(fxStrings as any).noHistory ?? 'No manual rates yet'}
                </Text>
              </View>
            ) : (
              manualOverrideRates.map((rate) => {
                const isEditing = editingRateId === rate.id;
                return (
                  <View
                    key={rate.id}
                    style={[
                      styles.historyItem,
                      { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                      isEditing && { borderColor: theme.colors.primary },
                    ]}
                  >
                    <View style={styles.historyItemContent}>
                      <View style={styles.historyItemHeader}>
                        <Text style={[styles.historyCurrency, { color: theme.colors.textPrimary }]}>
                          {rate.fromCurrency} → {rate.toCurrency}
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editingRateValue}
                            onChangeText={setEditingRateValue}
                            keyboardType="decimal-pad"
                            autoFocus
                            style={[
                              styles.historyEditInput,
                              {
                                color: theme.colors.primary,
                                borderColor: theme.colors.primary,
                                backgroundColor: theme.colors.background,
                              },
                            ]}
                          />
                        ) : (
                          <Text style={[styles.historyRate, { color: theme.colors.primary }]}>
                            {formatRate(rate.rate)}
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.historyDate, { color: theme.colors.textMuted }]}>
                        {formatJournalDate(rate.updatedAt)}
                      </Text>
                    </View>
                    {isEditing ? (
                      <View style={styles.historyEditActions}>
                        <Pressable
                          onPress={handleCancelEditJournal}
                          style={({ pressed }) => [styles.historyActionButton, pressed && styles.pressed]}
                          hitSlop={8}
                        >
                          <X size={18} color={theme.colors.textMuted} />
                        </Pressable>
                        <Pressable
                          onPress={handleSaveEditJournal}
                          style={({ pressed }) => [styles.historyActionButton, pressed && styles.pressed]}
                          hitSlop={8}
                        >
                          <Check size={18} color={theme.colors.success} />
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.historyEditActions}>
                        <Pressable
                          onPress={() => handleDeleteJournalEntry(rate)}
                          style={({ pressed }) => [styles.historyActionButton, pressed && styles.pressed]}
                          hitSlop={8}
                        >
                          <Trash2 size={18} color={theme.colors.danger} />
                        </Pressable>
                        <Pressable
                          onPress={() => handleStartEditJournal(rate)}
                          style={({ pressed }) => [styles.historyActionButton, pressed && styles.pressed]}
                          hitSlop={8}
                        >
                          <Pencil size={18} color={theme.colors.primary} />
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    // Current rate card styles
    currentRateCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    currentRateCardOverridden: {
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    currentRateContent: {
      flex: 1,
      gap: 6,
    },
    currentRateLabel: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    currentRateRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    currentRateValue: {
      fontSize: 18,
      fontWeight: '700',
    },
    currentRateMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 2,
    },
    // History button styles
    historyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 12,
      padding: 14,
      borderWidth: StyleSheet.hairlineWidth,
    },
    historyButtonText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
    },
    historyBadge: {
      backgroundColor: `${theme.colors.primary}15`,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    historyBadgeText: {
      fontSize: 12,
      fontWeight: '700',
    },
    // Journal styles
    journalContainer: {
      gap: 8,
    },
    journalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      padding: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    journalItemOverridden: {
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    journalItemContent: {
      flex: 1,
      gap: 4,
    },
    journalItemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    journalCurrency: {
      fontSize: 15,
      fontWeight: '700',
    },
    journalEquals: {
      fontSize: 14,
    },
    journalRate: {
      fontSize: 15,
      fontWeight: '600',
    },
    journalItemMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    journalSourceBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    journalSourceText: {
      fontSize: 10,
      fontWeight: '600',
    },
    journalDate: {
      fontSize: 11,
    },
    journalEditButton: {
      padding: 8,
      borderRadius: 8,
    },
    // History modal styles
    historyScrollContent: {
      padding: 20,
      gap: 12,
    },
    emptyHistory: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      gap: 16,
    },
    emptyHistoryText: {
      fontSize: 15,
      fontWeight: '500',
    },
    historyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      padding: 14,
      borderWidth: StyleSheet.hairlineWidth,
    },
    historyItemContent: {
      flex: 1,
      gap: 4,
    },
    historyItemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    historyCurrency: {
      fontSize: 15,
      fontWeight: '600',
    },
    historyRate: {
      fontSize: 16,
      fontWeight: '700',
    },
    historyDate: {
      fontSize: 12,
    },
    historyEditButton: {
      padding: 10,
      borderRadius: 8,
      marginLeft: 8,
    },
    historyEditInput: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      fontSize: 16,
      fontWeight: '700',
      minWidth: 100,
      textAlign: 'right',
    },
    historyEditActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginLeft: 8,
    },
    historyActionButton: {
      padding: 8,
      borderRadius: 8,
    },
  });
