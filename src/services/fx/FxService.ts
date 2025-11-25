import type { FinanceCurrency } from '@/stores/useFinancePreferencesStore';
import { DEFAULT_EXCHANGE_RATES } from '@/stores/useFinancePreferencesStore';
import { FX_PROVIDERS, type FxProviderId } from './providers';
import { getFinanceDaoRegistry } from '@/database/dao/financeDaoRegistry';

export type FxOverrideInput = {
  fromCurrency: FinanceCurrency;
  toCurrency: FinanceCurrency;
  rate: number;
};

const fallbackSnapshot = (baseCurrency: FinanceCurrency) => {
  const snapshot = { ...DEFAULT_EXCHANGE_RATES };
  snapshot[baseCurrency] = 1;
  return snapshot;
};

export class FxService {
  private static instance: FxService | null = null;

  static getInstance() {
    if (!FxService.instance) {
      FxService.instance = new FxService();
    }
    return FxService.instance;
  }

  private get dao() {
    return getFinanceDaoRegistry().fxRates;
  }

  async syncProvider(providerId: FxProviderId, date = new Date()) {
    const handler = FX_PROVIDERS[providerId];
    if (!handler) {
      throw new Error(`Unknown FX provider: ${providerId}`);
    }
    const payloads = await handler(date);
    payloads.forEach((payload) => {
      this.dao.upsert({
        fromCurrency: payload.fromCurrency,
        toCurrency: payload.toCurrency,
        rate: payload.rate,
        source: providerId,
        isOverridden: false,
        date: date.toISOString(),
      });
    });
    return payloads.length;
  }

  overrideRate(input: FxOverrideInput) {
    this.dao.upsert({
      fromCurrency: input.fromCurrency,
      toCurrency: input.toCurrency,
      rate: input.rate,
      source: 'manual',
      isOverridden: true,
      date: new Date().toISOString(),
    });
  }

  getRate(fromCurrency: FinanceCurrency, toCurrency: FinanceCurrency): number {
    if (fromCurrency === toCurrency) {
      return 1;
    }
    try {
      const records = this.dao.list();
      const latest = records
        .filter(
          (rate) =>
            rate.fromCurrency === fromCurrency &&
            rate.toCurrency === toCurrency,
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      if (latest) {
        return latest.rate;
      }
    } catch {
      // ignore and fallback
    }
    return DEFAULT_EXCHANGE_RATES[fromCurrency] ?? 1;
  }

  getSnapshot(baseCurrency: FinanceCurrency) {
    try {
      const records = this.dao.list();
      if (!records.length) {
        return fallbackSnapshot(baseCurrency);
      }
      const snapshot: Record<FinanceCurrency, number> = fallbackSnapshot(baseCurrency);
      records.forEach((rate) => {
        if (rate.toCurrency === baseCurrency) {
          snapshot[rate.fromCurrency as FinanceCurrency] = rate.rate;
        }
      });
      snapshot[baseCurrency] = 1;
      return snapshot;
    } catch {
      return fallbackSnapshot(baseCurrency);
    }
  }
}
