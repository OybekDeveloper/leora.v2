import React, { useMemo, useState, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TrendingUp, TrendingDown, Plus, Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppTheme } from '@/constants/theme';
import { useFinancePreferencesStore } from '@/stores/useFinancePreferencesStore';
import { useLocalization } from '@/localization/useLocalization';
import { useShallow } from 'zustand/react/shallow';

const STORAGE_KEY = 'finance_commodities_widgets';

// Static commodity prices in USD (approximate market values)
const COMMODITY_PRICES_USD = {
  // Precious Metals
  gold: {
    perGram: 75.5,
    trend: 0.8,
  },
  silver: {
    perGram: 0.95,
    trend: -0.3,
  },
  // Cryptocurrencies
  bitcoin: {
    perUnit: 97_500,
    trend: 2.1,
  },
  ethereum: {
    perUnit: 4_000,
    trend: 1.8,
  },
  // Energy & Commodities
  oil: {
    perBarrel: 73,
    trend: -0.5,
  },
  cotton: {
    perTon: 1_900,
    trend: 0.2,
  },
};

// Currency exchange rates (to USD as base)
const CURRENCY_RATES_TO_USD = {
  EUR: { rate: 1.05, trend: 0.3 },   // 1 EUR = 1.05 USD
  GBP: { rate: 1.27, trend: 0.1 },   // 1 GBP = 1.27 USD
  RUB: { rate: 0.0099, trend: -0.2 }, // 1 RUB = 0.0099 USD
  TRY: { rate: 0.028, trend: -0.5 },  // 1 TRY = 0.028 USD
  UZS: { rate: 0.000078, trend: 0.1 }, // 1 UZS = 0.000078 USD
};

type CurrencyCode = keyof typeof CURRENCY_RATES_TO_USD;

const AVAILABLE_CURRENCIES: CurrencyCode[] = ['EUR', 'GBP', 'RUB', 'TRY', 'UZS'];

const GOLD_WEIGHTS = [
  { grams: 1, labelKey: 'gram1' },
  { grams: 10, labelKey: 'gram10' },
  { grams: 100, labelKey: 'gram100' },
  { grams: 1000, labelKey: 'gram1000' },
] as const;

const SILVER_WEIGHTS = [
  { grams: 1, labelKey: 'gram1' },
  { grams: 10, labelKey: 'gram10' },
  { grams: 100, labelKey: 'gram100' },
  { grams: 1000, labelKey: 'gram1000' },
] as const;

// Widget types that can be toggled
type WidgetType = 'silver' | 'currencies' | 'commodities';

const FinanceCommoditiesModal = () => {
  const theme = useAppTheme();
  const router = useRouter();
  const { strings } = useLocalization();
  const commodityStrings = (strings.modals as any).commodities ?? {};
  const commonStrings = (strings as any).common ?? {};
  const closeLabel = commonStrings.close ?? 'Yopish';
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [enabledWidgets, setEnabledWidgets] = useState<Record<WidgetType, boolean>>({
    silver: false,
    currencies: false,
    commodities: false,
  });
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);

  // Load saved widgets on mount
  React.useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          setEnabledWidgets(JSON.parse(data));
        } catch {}
      }
    });
  }, []);

  const toggleWidget = useCallback((widget: WidgetType) => {
    setEnabledWidgets((prev) => {
      const updated = { ...prev, [widget]: !prev[widget] };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

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

  const silverPriceInBase = useMemo(() => {
    if (isBaseCurrencyUSD) return COMMODITY_PRICES_USD.silver.perGram;
    return convertAmount(COMMODITY_PRICES_USD.silver.perGram, 'USD', globalCurrency);
  }, [isBaseCurrencyUSD, convertAmount, globalCurrency]);

  const bitcoinPriceInBase = useMemo(() => {
    if (isBaseCurrencyUSD) return COMMODITY_PRICES_USD.bitcoin.perUnit;
    return convertAmount(COMMODITY_PRICES_USD.bitcoin.perUnit, 'USD', globalCurrency);
  }, [isBaseCurrencyUSD, convertAmount, globalCurrency]);

  const ethereumPriceInBase = useMemo(() => {
    if (isBaseCurrencyUSD) return COMMODITY_PRICES_USD.ethereum.perUnit;
    return convertAmount(COMMODITY_PRICES_USD.ethereum.perUnit, 'USD', globalCurrency);
  }, [isBaseCurrencyUSD, convertAmount, globalCurrency]);

  const oilPriceInBase = useMemo(() => {
    if (isBaseCurrencyUSD) return COMMODITY_PRICES_USD.oil.perBarrel;
    return convertAmount(COMMODITY_PRICES_USD.oil.perBarrel, 'USD', globalCurrency);
  }, [isBaseCurrencyUSD, convertAmount, globalCurrency]);

  const cottonPriceInBase = useMemo(() => {
    if (isBaseCurrencyUSD) return COMMODITY_PRICES_USD.cotton.perTon;
    return convertAmount(COMMODITY_PRICES_USD.cotton.perTon, 'USD', globalCurrency);
  }, [isBaseCurrencyUSD, convertAmount, globalCurrency]);

  // Get currency rate relative to global currency
  const getCurrencyRateInBase = useCallback((currency: CurrencyCode) => {
    const rateToUSD = CURRENCY_RATES_TO_USD[currency].rate;
    // Convert: 1 [currency] = X USD, then convert X USD to global currency
    if (isBaseCurrencyUSD) {
      return rateToUSD;
    }
    return convertAmount(rateToUSD, 'USD', globalCurrency);
  }, [isBaseCurrencyUSD, convertAmount, globalCurrency]);

  // Filter currencies - don't show global currency in the list
  const displayCurrencies = useMemo(() => {
    return AVAILABLE_CURRENCIES.filter(c => c !== globalCurrency);
  }, [globalCurrency]);

  const formatPrice = (price: number, currency?: string) => {
    const targetCurrency = currency ?? globalCurrency;
    const decimals = targetCurrency === 'UZS' ? 0 : (price < 1 ? 4 : 2);
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

  const silverWeightLabels: Record<string, string> = {
    gram1: commodityStrings.silver?.gram1 ?? '1 gram',
    gram10: commodityStrings.silver?.gram10 ?? '10 gram',
    gram100: commodityStrings.silver?.gram100 ?? '100 gram',
    gram1000: commodityStrings.silver?.gram1000 ?? '1 kg',
  };

  const currencyLabels: Record<string, string> = {
    USD: commodityStrings.currencies?.usd ?? 'AQSh dollari',
    EUR: commodityStrings.currencies?.eur ?? 'Evro',
    GBP: commodityStrings.currencies?.gbp ?? 'Funt sterling',
    RUB: commodityStrings.currencies?.rub ?? 'Rossiya rubli',
    TRY: commodityStrings.currencies?.try ?? 'Turk lirasi',
    UZS: commodityStrings.currencies?.uzs ?? "O'zbek so'mi",
  };

  const widgetLabels: Record<WidgetType, string> = {
    silver: commodityStrings.silver?.title ?? 'Kumush',
    currencies: commodityStrings.currencies?.title ?? 'Valyuta kurslari',
    commodities: commodityStrings.commodities?.title ?? 'Tovar narxlari',
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

  const renderWidgetSelector = () => {
    const widgets: WidgetType[] = ['silver', 'currencies', 'commodities'];

    return (
      <View style={styles.widgetSelector}>
        <Pressable
          style={styles.widgetSelectorHeader}
          onPress={() => setShowWidgetSelector(!showWidgetSelector)}
        >
          <View style={styles.widgetSelectorLeft}>
            <Plus size={18} color={theme.colors.primary} />
            <Text style={styles.widgetSelectorTitle}>
              {commodityStrings.addWidgets ?? "Qo'shimcha ma'lumotlar"}
            </Text>
          </View>
          {showWidgetSelector ? (
            <ChevronUp size={20} color={theme.colors.textSecondary} />
          ) : (
            <ChevronDown size={20} color={theme.colors.textSecondary} />
          )}
        </Pressable>

        {showWidgetSelector && (
          <View style={styles.widgetOptions}>
            {widgets.map((widget) => (
              <Pressable
                key={widget}
                style={[
                  styles.widgetOption,
                  enabledWidgets[widget] && styles.widgetOptionActive,
                ]}
                onPress={() => toggleWidget(widget)}
              >
                <Text
                  style={[
                    styles.widgetOptionText,
                    enabledWidgets[widget] && styles.widgetOptionTextActive,
                  ]}
                >
                  {widgetLabels[widget]}
                </Text>
                {enabledWidgets[widget] && (
                  <Check size={16} color={theme.colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        )}
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
        {/* Gold Section - Always visible */}
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

        {/* Cryptocurrencies Section - Always visible */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{commodityStrings.crypto?.title ?? 'Kriptovalyutalar'}</Text>
          </View>
          <View style={styles.card}>
            {/* Bitcoin */}
            <View style={[styles.priceRow, styles.priceRowBorder]}>
              <View style={styles.cryptoLabel}>
                <Text style={styles.priceLabel}>{commodityStrings.bitcoin?.title ?? 'Bitcoin'}</Text>
                {renderTrendIndicator(COMMODITY_PRICES_USD.bitcoin.trend)}
              </View>
              <View style={styles.priceValues}>
                <Text style={styles.priceMain}>{formatPrice(bitcoinPriceInBase)}</Text>
                {!isBaseCurrencyUSD && (
                  <Text style={styles.priceSecondary}>{formatPrice(COMMODITY_PRICES_USD.bitcoin.perUnit, 'USD')}</Text>
                )}
              </View>
            </View>
            {/* Ethereum */}
            <View style={styles.priceRow}>
              <View style={styles.cryptoLabel}>
                <Text style={styles.priceLabel}>{commodityStrings.ethereum?.title ?? 'Ethereum'}</Text>
                {renderTrendIndicator(COMMODITY_PRICES_USD.ethereum.trend)}
              </View>
              <View style={styles.priceValues}>
                <Text style={styles.priceMain}>{formatPrice(ethereumPriceInBase)}</Text>
                {!isBaseCurrencyUSD && (
                  <Text style={styles.priceSecondary}>{formatPrice(COMMODITY_PRICES_USD.ethereum.perUnit, 'USD')}</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Widget Selector */}
        {renderWidgetSelector()}

        {/* Silver Section - Toggleable */}
        {enabledWidgets.silver && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{commodityStrings.silver?.title ?? 'Kumush'}</Text>
              {renderTrendIndicator(COMMODITY_PRICES_USD.silver.trend)}
            </View>
            <View style={styles.card}>
              {SILVER_WEIGHTS.map((weight, index) => {
                const priceInBase = silverPriceInBase * weight.grams;
                const priceInUSD = COMMODITY_PRICES_USD.silver.perGram * weight.grams;
                return (
                  <View
                    key={weight.grams}
                    style={[
                      styles.priceRow,
                      index < SILVER_WEIGHTS.length - 1 && styles.priceRowBorder,
                    ]}
                  >
                    <Text style={styles.priceLabel}>{silverWeightLabels[weight.labelKey]}</Text>
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
        )}

        {/* Currency Exchange Rates Section - Toggleable */}
        {enabledWidgets.currencies && displayCurrencies.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{commodityStrings.currencies?.title ?? 'Valyuta kurslari'}</Text>
            </View>
            <View style={styles.card}>
              {displayCurrencies.map((currency, index) => {
                const rateData = CURRENCY_RATES_TO_USD[currency];
                const rateInBase = getCurrencyRateInBase(currency);
                return (
                  <View
                    key={currency}
                    style={[
                      styles.priceRow,
                      index < displayCurrencies.length - 1 && styles.priceRowBorder,
                    ]}
                  >
                    <View style={styles.cryptoLabel}>
                      <Text style={styles.priceLabel}>{currencyLabels[currency]}</Text>
                      {renderTrendIndicator(rateData.trend)}
                    </View>
                    <View style={styles.priceValues}>
                      <Text style={styles.priceMain}>{formatPrice(rateInBase)}</Text>
                      <Text style={styles.priceSecondary}>1 {currency}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Commodities Section (Oil & Cotton) - Toggleable */}
        {enabledWidgets.commodities && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{commodityStrings.commodities?.title ?? 'Tovar narxlari'}</Text>
            </View>
            <View style={styles.card}>
              {/* Oil */}
              <View style={[styles.priceRow, styles.priceRowBorder]}>
                <View style={styles.cryptoLabel}>
                  <Text style={styles.priceLabel}>{commodityStrings.oil?.title ?? 'Neft (Brent)'}</Text>
                  {renderTrendIndicator(COMMODITY_PRICES_USD.oil.trend)}
                </View>
                <View style={styles.priceValues}>
                  <Text style={styles.priceMain}>{formatPrice(oilPriceInBase)}</Text>
                  {!isBaseCurrencyUSD && (
                    <Text style={styles.priceSecondary}>{formatPrice(COMMODITY_PRICES_USD.oil.perBarrel, 'USD')}</Text>
                  )}
                  <Text style={styles.unitLabel}>{commodityStrings.oil?.unit ?? 'per barrel'}</Text>
                </View>
              </View>
              {/* Cotton */}
              <View style={styles.priceRow}>
                <View style={styles.cryptoLabel}>
                  <Text style={styles.priceLabel}>{commodityStrings.cotton?.title ?? 'Paxta'}</Text>
                  {renderTrendIndicator(COMMODITY_PRICES_USD.cotton.trend)}
                </View>
                <View style={styles.priceValues}>
                  <Text style={styles.priceMain}>{formatPrice(cottonPriceInBase)}</Text>
                  {!isBaseCurrencyUSD && (
                    <Text style={styles.priceSecondary}>{formatPrice(COMMODITY_PRICES_USD.cotton.perTon, 'USD')}</Text>
                  )}
                  <Text style={styles.unitLabel}>{commodityStrings.cotton?.unit ?? 'per ton'}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

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
    cryptoLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    unitLabel: {
      fontSize: 11,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    disclaimer: {
      fontSize: 12,
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: 12,
    },
    // Widget selector styles
    widgetSelector: {
      borderRadius: 16,
      backgroundColor: theme.colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    widgetSelectorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    widgetSelectorLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    widgetSelectorTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    widgetOptions: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.borderMuted,
      padding: 12,
      gap: 8,
    },
    widgetOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
    },
    widgetOptionActive: {
      backgroundColor: `${theme.colors.primary}15`,
    },
    widgetOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    widgetOptionTextActive: {
      color: theme.colors.primary,
    },
  });
