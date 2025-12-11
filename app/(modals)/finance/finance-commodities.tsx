import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

import { useAppTheme } from '@/constants/theme';
import { useFinancePreferencesStore } from '@/stores/useFinancePreferencesStore';
import { useLocalization } from '@/localization/useLocalization';
import { useShallow } from 'zustand/react/shallow';

// Static commodity prices in USD (approximate market values)
// These would typically come from an API in production
const COMMODITY_PRICES_USD = {
  gold: {
    perGram: 75.5, // ~$75.50 per gram
    trend: 0.8, // +0.8% daily change
  },
  bitcoin: {
    perUnit: 97_500, // ~$97,500 per BTC
    trend: 2.1, // +2.1% daily change
  },
};

const GOLD_WEIGHTS = [
  { grams: 1, labelKey: 'gram1' },
  { grams: 10, labelKey: 'gram10' },
  { grams: 100, labelKey: 'gram100' },
  { grams: 1000, labelKey: 'gram1000' },
] as const;

const FinanceCommoditiesModal = () => {
  const theme = useAppTheme();
  const router = useRouter();
  const { strings } = useLocalization();
  const commodityStrings = (strings.modals as any).commodities ?? {};
  const commonStrings = (strings as any).common ?? {};
  const closeLabel = commonStrings.close ?? 'Yopish';
  const styles = useMemo(() => createStyles(theme), [theme])

  const { globalCurrency, convertAmount } = useFinancePreferencesStore(
    useShallow((state) => ({
      globalCurrency: state.globalCurrency,
      convertAmount: state.convertAmount,
    })),
  );

  const isBaseCurrencyUSD = globalCurrency === 'USD';

  // Convert USD prices to base currency
  const goldPriceInBase = useMemo(() => {
    if (isBaseCurrencyUSD) return COMMODITY_PRICES_USD.gold.perGram;
    return convertAmount(COMMODITY_PRICES_USD.gold.perGram, 'USD', globalCurrency);
  }, [isBaseCurrencyUSD, convertAmount, globalCurrency]);

  const bitcoinPriceInBase = useMemo(() => {
    if (isBaseCurrencyUSD) return COMMODITY_PRICES_USD.bitcoin.perUnit;
    return convertAmount(COMMODITY_PRICES_USD.bitcoin.perUnit, 'USD', globalCurrency);
  }, [isBaseCurrencyUSD, convertAmount, globalCurrency]);

  const formatPrice = (price: number, currency?: string) => {
    const targetCurrency = currency ?? globalCurrency;
    const decimals = targetCurrency === 'UZS' ? 0 : 2;
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(price) + ' ' + targetCurrency;
  };

  const goldWeightLabels: Record<string, string> = {
    gram1: commodityStrings.gold?.gram1 ?? '1 gram',
    gram10: commodityStrings.gold?.gram10 ?? '10 gram',
    gram100: commodityStrings.gold?.gram100 ?? '100 gram',
    gram1000: commodityStrings.gold?.gram1000 ?? '1 kg',
  };

  const renderTrendIndicator = (trend: number) => {
    const isPositive = trend >= 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const trendColor = isPositive ? theme.colors.success : theme.colors.danger;
    return (
      <View style={[styles.trendBadge, { backgroundColor: `${trendColor}15` }]}>
        <TrendIcon size={14} color={trendColor} />
        <Text style={[styles.trendText, { color: trendColor }]}>
          {isPositive ? '+' : ''}{trend.toFixed(1)}%
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>{commodityStrings.title ?? 'Qimmatbaho narxlar'}</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.closeText}>{closeLabel}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Gold Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{commodityStrings.gold?.title ?? 'Oltin'}</Text>
            {renderTrendIndicator(COMMODITY_PRICES_USD.gold.trend)}
          </View>
          <View style={styles.card}>
            {GOLD_WEIGHTS.map((weight, index) => {
              const priceInBase = goldPriceInBase * weight.grams;
              const priceInUSD = COMMODITY_PRICES_USD.gold.perGram * weight.grams;
              return (
                <View
                  key={weight.grams}
                  style={[
                    styles.priceRow,
                    index < GOLD_WEIGHTS.length - 1 && styles.priceRowBorder,
                  ]}
                >
                  <Text style={styles.priceLabel}>{goldWeightLabels[weight.labelKey]}</Text>
                  <View style={styles.priceValues}>
                    <Text style={styles.priceMain}>{formatPrice(priceInBase)}</Text>
                    {!isBaseCurrencyUSD && (
                      <Text style={styles.priceSecondary}>{formatPrice(priceInUSD, 'USD')}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Bitcoin Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{commodityStrings.bitcoin?.title ?? 'Bitcoin'}</Text>
            {renderTrendIndicator(COMMODITY_PRICES_USD.bitcoin.trend)}
          </View>
          <View style={styles.card}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{commodityStrings.bitcoin?.perUnit ?? '1 BTC'}</Text>
              <View style={styles.priceValues}>
                <Text style={styles.priceMain}>{formatPrice(bitcoinPriceInBase)}</Text>
                {!isBaseCurrencyUSD && (
                  <Text style={styles.priceSecondary}>{formatPrice(COMMODITY_PRICES_USD.bitcoin.perUnit, 'USD')}</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          {commodityStrings.disclaimer ?? 'Narxlar taxminiy va real vaqtda yangilanmaydi. Investitsiya qarorlari uchun rasmiy manbalardan foydalaning.'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FinanceCommoditiesModal;

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
      gap: 24,
    },
    section: {
      gap: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    trendBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    trendText: {
      fontSize: 12,
      fontWeight: '600',
    },
    card: {
      borderRadius: 16,
      backgroundColor: theme.colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    priceRowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.borderMuted,
    },
    priceLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.colors.textPrimary,
    },
    priceValues: {
      alignItems: 'flex-end',
      gap: 2,
    },
    priceMain: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    priceSecondary: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    disclaimer: {
      fontSize: 12,
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: 12,
    },
  });
