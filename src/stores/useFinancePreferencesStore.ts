import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { mmkvStorageAdapter } from '@/utils/storage';
import { FxService, type FxProviderId } from '@/services/fx';

export type FinanceCurrency =
  | 'UZS'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'TRY'
  | 'SAR'
  | 'AED'
  | 'USDT'
  | 'RUB';

type ExchangeRateMap = Record<FinanceCurrency, number>;

export const AVAILABLE_FINANCE_CURRENCIES: FinanceCurrency[] = [
  'UZS',
  'USD',
  'EUR',
  'GBP',
  'TRY',
  'SAR',
  'AED',
  'USDT',
  'RUB',
];

export interface FinanceRegionPreset {
  id: string;
  label: string;
  description: string;
  currency: FinanceCurrency;
}

export const FINANCE_REGION_PRESETS = [
  {
    id: 'uzbekistan',
    label: 'Central Asia (Uzbekistan)',
    description: 'Som · Uzbekistan',
    currency: 'UZS',
  },
  {
    id: 'united-states',
    label: 'United States',
    description: 'US Dollar · USA',
    currency: 'USD',
  },
  {
    id: 'eurozone',
    label: 'European Union',
    description: 'Euro · EU countries',
    currency: 'EUR',
  },
  {
    id: 'united-kingdom',
    label: 'United Kingdom',
    description: 'British Pound · UK',
    currency: 'GBP',
  },
  {
    id: 'turkey',
    label: 'Turkey',
    description: 'Turkish Lira · Türkiye',
    currency: 'TRY',
  },
  {
    id: 'saudi-arabia',
    label: 'Saudi Arabia',
    description: 'Saudi Riyal · KSA',
    currency: 'SAR',
  },
  {
    id: 'united-arab-emirates',
    label: 'United Arab Emirates',
    description: 'UAE Dirham · UAE',
    currency: 'AED',
  },
  {
    id: 'russia',
    label: 'Russia',
    description: 'Ruble · Russia',
    currency: 'RUB',
  },
] as const satisfies readonly FinanceRegionPreset[];

export type FinanceRegion = (typeof FINANCE_REGION_PRESETS)[number]['id'];

const REGION_PRESET_MAP = (() => {
  const map = {} as Record<FinanceRegion, FinanceRegionPreset>;
  FINANCE_REGION_PRESETS.forEach((preset) => {
    map[preset.id as FinanceRegion] = preset;
  });
  return map;
})();

const DEFAULT_REGION_ID = FINANCE_REGION_PRESETS[0].id as FinanceRegion;

const resolveRegionPreset = (region: FinanceRegion): FinanceRegionPreset =>
  REGION_PRESET_MAP[region] ?? REGION_PRESET_MAP[DEFAULT_REGION_ID];

export const getFinanceRegionPreset = (region: FinanceRegion): FinanceRegionPreset =>
  resolveRegionPreset(region);

type DebtPreferenceType = 'lent' | 'borrowed';

interface FinancePreferencesStore {
  region: FinanceRegion;
  baseCurrency: FinanceCurrency;
  globalCurrency: FinanceCurrency;
  exchangeRates: ExchangeRateMap;
  defaultDebtAccounts: Record<DebtPreferenceType, string | undefined>;
  setRegion: (region: FinanceRegion, options?: { syncDisplayCurrency?: boolean }) => void;
  setGlobalCurrency: (currency: FinanceCurrency) => void;
  setExchangeRate: (currency: FinanceCurrency, rate: number) => void;
  setDefaultDebtAccount: (type: DebtPreferenceType, accountId: string) => void;
  convertAmount: (amount: number, fromCurrency?: FinanceCurrency, toCurrency?: FinanceCurrency) => number;
  formatCurrency: (
    amount: number,
    options?: Intl.NumberFormatOptions & {
      fromCurrency?: FinanceCurrency;
      toCurrency?: FinanceCurrency;
      convert?: boolean;
    },
  ) => string;
  hydrateFxRates: () => void;
  syncExchangeRates: (providerId: FxProviderId) => Promise<void>;
  overrideExchangeRate: (currency: FinanceCurrency, rate: number) => void;
}

export const DEFAULT_EXCHANGE_RATES: ExchangeRateMap = {
  UZS: 1,
  USD: 12_450,
  EUR: 13_600,
  GBP: 15_800,
  TRY: 375,
  SAR: 3_300,
  AED: 3_380,
  USDT: 12_450,
  RUB: 140,
};

const localeByCurrency: Record<FinanceCurrency, string> = {
  UZS: 'uz-UZ',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  TRY: 'tr-TR',
  SAR: 'ar-SA',
  AED: 'ar-AE',
  USDT: 'en-US',
  RUB: 'ru-RU',
};

const clampRate = (rate: number) => (rate > 0 ? rate : 1);

const getRateOrDefault = (rates: Partial<Record<FinanceCurrency, number>>, currency: FinanceCurrency) => {
  const value = rates[currency];
  return Number.isFinite(value) && value && value > 0 ? (value as number) : DEFAULT_EXCHANGE_RATES[currency] ?? 1;
};

const rebaseExchangeRates = (
  rates: ExchangeRateMap,
  nextBaseCurrency: FinanceCurrency,
): ExchangeRateMap => {
  const pivot = clampRate(getRateOrDefault(rates, nextBaseCurrency));
  const rebased = {} as ExchangeRateMap;

  AVAILABLE_FINANCE_CURRENCIES.forEach((currency) => {
    if (currency === nextBaseCurrency) {
      rebased[currency] = 1;
      return;
    }

    const currentValue = getRateOrDefault(rates, currency);
    rebased[currency] = clampRate(currentValue / pivot);
  });

  return rebased;
};

const inferRegionFromCurrency = (currency: FinanceCurrency): FinanceRegion => {
  const preset = FINANCE_REGION_PRESETS.find((item) => item.currency === currency);
  return (preset?.id as FinanceRegion) ?? DEFAULT_REGION_ID;
};

const DEFAULT_REGION = resolveRegionPreset(DEFAULT_REGION_ID);

const createFinancePreferencesStore: StateCreator<FinancePreferencesStore> = (set, get) => ({
  region: DEFAULT_REGION.id,
  baseCurrency: DEFAULT_REGION.currency,
  globalCurrency: 'USD',
  exchangeRates: { ...DEFAULT_EXCHANGE_RATES },
  defaultDebtAccounts: { borrowed: undefined, lent: undefined },

  setRegion: (region, options) => {
    set((state) => {
      const preset = REGION_PRESET_MAP[region];
      if (!preset) {
        return {};
      }

      const syncDisplayCurrency = options?.syncDisplayCurrency ?? true;
      return {
        region,
        baseCurrency: preset.currency,
        globalCurrency: syncDisplayCurrency ? preset.currency : state.globalCurrency,
        exchangeRates: rebaseExchangeRates(state.exchangeRates, preset.currency),
      };
    });
    get().hydrateFxRates();
  },

  setGlobalCurrency: (currency) => {
    set({ globalCurrency: currency });
  },

  setExchangeRate: (currency, rate) => {
    FxService.getInstance().overrideRate({
      fromCurrency: currency,
      toCurrency: get().baseCurrency,
      rate,
    });
    set((state) => ({
      exchangeRates: {
        ...state.exchangeRates,
        [currency]: currency === state.baseCurrency ? 1 : clampRate(rate),
      },
    }));
  },

  setDefaultDebtAccount: (type, accountId) =>
    set((state) => ({
      defaultDebtAccounts: {
        ...state.defaultDebtAccounts,
        [type]: accountId,
      },
    })),

  convertAmount: (amount, fromCurrency, toCurrency) => {
    if (!Number.isFinite(amount)) {
      return 0;
    }

    const state = get();
    const sourceCurrency = fromCurrency ?? state.baseCurrency;
    const targetCurrency = toCurrency ?? state.globalCurrency;
    if (sourceCurrency === targetCurrency) {
      return amount;
    }

    const fromRate = state.exchangeRates[sourceCurrency] ?? 1;
    const toRate = state.exchangeRates[targetCurrency] ?? 1;

    const baseValue = amount * fromRate;
    return baseValue / toRate;
  },

  formatCurrency: (amount, options) => {
    const state = get();
    const fromCurrency = options?.fromCurrency ?? state.baseCurrency;
    const targetCurrency = options?.convert
      ? options?.toCurrency ?? state.globalCurrency
      : fromCurrency;

    const value = options?.convert
      ? state.convertAmount(amount, fromCurrency, targetCurrency)
      : amount;

    const locale = localeByCurrency[targetCurrency] ?? 'en-US';
    const maximumFractionDigits = targetCurrency === 'UZS' ? 0 : 2;
    const minimumFractionDigits =
      options?.minimumFractionDigits ??
      (value % 1 === 0 ? 0 : Math.min(maximumFractionDigits, 2));

    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: targetCurrency,
      maximumFractionDigits,
      minimumFractionDigits,
      ...options,
    });

    return formatter.format(value);
  },
  hydrateFxRates: () => {
    try {
      const snapshot = FxService.getInstance().getSnapshot(get().baseCurrency);
      set({ exchangeRates: snapshot });
    } catch {
      // keep existing values
    }
  },
  syncExchangeRates: async (providerId: FxProviderId) => {
    await FxService.getInstance().syncProvider(providerId);
    get().hydrateFxRates();
  },
  overrideExchangeRate: (currency, rate) => {
    FxService.getInstance().overrideRate({
      fromCurrency: currency,
      toCurrency: get().baseCurrency,
      rate,
    });
    get().hydrateFxRates();
  },
});

export const useFinancePreferencesStore = create<FinancePreferencesStore>()(
  persist(createFinancePreferencesStore, {
    name: 'finance-preferences',
    storage: createJSONStorage(() => mmkvStorageAdapter),
    version: 2,
    migrate: (persistedState, version) => {
      if (!persistedState) {
        return persistedState;
      }

      if (version < 2) {
        const baseCurrency = (persistedState as Partial<FinancePreferencesStore>).baseCurrency ?? DEFAULT_REGION.currency;
        return {
          region: inferRegionFromCurrency(baseCurrency),
          ...persistedState,
        };
      }

      return persistedState;
    },
    partialize: (state) => ({
      region: state.region,
      baseCurrency: state.baseCurrency,
      globalCurrency: state.globalCurrency,
      exchangeRates: state.exchangeRates,
      defaultDebtAccounts: state.defaultDebtAccounts,
    }),
  }),
);
