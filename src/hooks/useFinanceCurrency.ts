import { useCallback } from 'react';

import {
  AVAILABLE_FINANCE_CURRENCIES,
  type FinanceCurrency,
  useFinancePreferencesStore,
} from '@/stores/useFinancePreferencesStore';

export const useFinanceCurrency = () => {
  const {
    baseCurrency,
    globalCurrency,
    exchangeRates,
    setGlobalCurrency,
    setExchangeRate,
    convertAmount,
    formatCurrency,
  } = useFinancePreferencesStore();

  const formatAccountAmount = useCallback(
    (amount: number, currency: FinanceCurrency) =>
      formatCurrency(amount, { fromCurrency: currency, convert: false }),
    [formatCurrency],
  );

  const formatGlobalAmount = useCallback(
    (amount: number, currency: FinanceCurrency) =>
      formatCurrency(amount, { fromCurrency: currency, toCurrency: globalCurrency, convert: true }),
    [formatCurrency, globalCurrency],
  );

  const getCurrencyLocale = useCallback(
    (currency: FinanceCurrency) => {
      switch (currency) {
        case 'UZS':
          return 'uz-UZ';
        case 'EUR':
          return 'de-DE';
        case 'GBP':
          return 'en-GB';
        default:
          return 'en-US';
      }
    },
    [],
  );

  return {
    baseCurrency,
    globalCurrency,
    exchangeRates,
    setGlobalCurrency,
    setExchangeRate,
    convertAmount,
    formatCurrency,
    formatAccountAmount,
    formatGlobalAmount,
    getCurrencyLocale,
    availableCurrencies: AVAILABLE_FINANCE_CURRENCIES,
  };
};
