import {
  AVAILABLE_FINANCE_CURRENCIES,
  type FinanceCurrency,
} from '@/stores/useFinancePreferencesStore';

const sanitizeCurrencyCode = (value?: string) => (value ?? '').trim().toUpperCase();

export const isFinanceCurrencyCode = (value?: string): value is FinanceCurrency => {
  if (!value) {
    return false;
  }
  const upper = sanitizeCurrencyCode(value);
  return AVAILABLE_FINANCE_CURRENCIES.includes(upper as FinanceCurrency);
};

export const normalizeFinanceCurrency = (
  value?: string,
  fallback: FinanceCurrency = 'USD',
): FinanceCurrency => {
  const upper = sanitizeCurrencyCode(value);
  return isFinanceCurrencyCode(upper) ? (upper as FinanceCurrency) : fallback;
};
