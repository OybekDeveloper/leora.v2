import type { FinanceCurrency } from '@/stores/useFinancePreferencesStore';
import { DEFAULT_EXCHANGE_RATES } from '@/stores/useFinancePreferencesStore';

export type FxProviderId = 'central_bank_stub' | 'market_stub';

export interface ProviderResult {
  fromCurrency: FinanceCurrency;
  toCurrency: FinanceCurrency;
  rate: number;
}

type ProviderHandler = (date: Date) => Promise<ProviderResult[]>;

const cloneDefaultRates = () => ({ ...DEFAULT_EXCHANGE_RATES });

const centralBankStub: ProviderHandler = async (date) => {
  const baseRates = cloneDefaultRates();
  return Object.entries(baseRates).map(([currency, rate]) => ({
    fromCurrency: currency as FinanceCurrency,
    toCurrency: 'USD',
    rate,
  }));
};

const randomFactor = () => 0.98 + Math.random() * 0.04;

const marketStub: ProviderHandler = async () => {
  const baseRates = cloneDefaultRates();
  return Object.entries(baseRates).map(([currency, rate]) => ({
    fromCurrency: currency as FinanceCurrency,
    toCurrency: 'USD',
    rate: Number((rate * randomFactor()).toFixed(2)),
  }));
};

export const FX_PROVIDERS: Record<FxProviderId, ProviderHandler> = {
  central_bank_stub: centralBankStub,
  market_stub: marketStub,
};
