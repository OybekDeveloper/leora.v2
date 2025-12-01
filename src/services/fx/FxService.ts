import type { FinanceCurrency } from '@/stores/useFinancePreferencesStore';
import { DEFAULT_EXCHANGE_RATES } from '@/stores/useFinancePreferencesStore';
import { FX_PROVIDERS, LEGACY_PROVIDER_MAP, type FxProviderId } from './providers';
import { getFinanceDaoRegistry } from '@/database/dao/financeDaoRegistry';

// Default spread - 0.5%
const DEFAULT_SPREAD_PERCENT = 0.5;

export type FxOverrideInput = {
  fromCurrency: FinanceCurrency;
  toCurrency: FinanceCurrency;
  rate: number;
  rateBid?: number;
  rateAsk?: number;
};

export interface TransferRateInfo {
  rateMid: number;      // O'rta kurs
  rateBid: number;      // Sotib olish kursi (bank sotib oladi)
  rateAsk: number;      // Sotish kursi (bank sotadi)
  spreadPercent: number; // Spread foizi
}

export type FxDirection = 'buy' | 'sell';

// Fallback snapshot - baseCurrency ga nisbatan boshqa valyutalar kursi
const fallbackSnapshot = (baseCurrency: FinanceCurrency) => {
  const baseRates = { ...DEFAULT_EXCHANGE_RATES };
  const baseRate = baseRates[baseCurrency] || 1;

  // Barcha valyutalarni baseCurrency ga nisbatan qayta hisoblash
  const snapshot: Record<FinanceCurrency, number> = {} as Record<FinanceCurrency, number>;

  Object.entries(baseRates).forEach(([currency, rate]) => {
    if (currency === baseCurrency) {
      snapshot[currency as FinanceCurrency] = 1;
    } else {
      // rate / baseRate = 1 currency nechi baseCurrency bo'lishini ko'rsatadi
      snapshot[currency as FinanceCurrency] = rate / baseRate;
    }
  });

  return snapshot;
};

export class FxService {
  private static instance: FxService | null = null;
  private _spreadPercent: number = DEFAULT_SPREAD_PERCENT;

  static getInstance() {
    if (!FxService.instance) {
      FxService.instance = new FxService();
    }
    return FxService.instance;
  }

  private get dao() {
    return getFinanceDaoRegistry().fxRates;
  }

  // Spread foizini o'rnatish
  setSpreadPercent(percent: number) {
    this._spreadPercent = Math.max(0, Math.min(percent, 5)); // 0% - 5% oralig'ida
  }

  getSpreadPercent(): number {
    return this._spreadPercent;
  }

  async syncProvider(providerId: FxProviderId | string, date = new Date(), baseCurrency?: FinanceCurrency) {
    // Legacy provider nomlarini yangilariga aylantirish
    const actualProviderId = (LEGACY_PROVIDER_MAP[providerId] ?? providerId) as FxProviderId;

    const handler = FX_PROVIDERS[actualProviderId];
    if (!handler) {
      throw new Error(`Unknown FX provider: ${providerId}`);
    }

    const payloads = await handler(date, baseCurrency);
    payloads.forEach((payload) => {
      this.dao.upsert({
        fromCurrency: payload.fromCurrency,
        toCurrency: payload.toCurrency,
        rate: payload.rate,
        rateMid: payload.rateMid ?? payload.rate,
        rateBid: payload.rateBid,
        rateAsk: payload.rateAsk,
        nominal: payload.nominal ?? 1,
        source: actualProviderId,
        isOverridden: false,
        date: date.toISOString(),
      });
    });
    return payloads.length;
  }

  overrideRate(input: FxOverrideInput) {
    const spreadMultiplier = this._spreadPercent / 100;
    // Always create new record for journal history
    this.dao.create({
      fromCurrency: input.fromCurrency,
      toCurrency: input.toCurrency,
      rate: input.rate,
      rateMid: input.rate,
      rateBid: input.rateBid ?? input.rate * (1 - spreadMultiplier),
      rateAsk: input.rateAsk ?? input.rate * (1 + spreadMultiplier),
      source: 'manual',
      isOverridden: true,
      date: new Date().toISOString(),
    });
  }

  // Update existing rate by id (for editing journal entries)
  updateRate(id: string, rate: number) {
    const spreadMultiplier = this._spreadPercent / 100;
    return this.dao.update(id, {
      rate,
      rateMid: rate,
      rateBid: rate * (1 - spreadMultiplier),
      rateAsk: rate * (1 + spreadMultiplier),
    });
  }

  // Delete rate by id
  deleteRate(id: string) {
    return this.dao.delete(id);
  }

  getRate(fromCurrency: FinanceCurrency, toCurrency: FinanceCurrency): number {
    if (fromCurrency === toCurrency) {
      return 1;
    }
    try {
      const records = this.dao.list();

      // To'g'ridan-to'g'ri kursni qidirish
      const direct = records
        .filter(
          (rate) =>
            rate.fromCurrency === fromCurrency &&
            rate.toCurrency === toCurrency,
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      if (direct) {
        return direct.rate;
      }

      // Teskari kursni qidirish
      const inverse = records
        .filter(
          (rate) =>
            rate.fromCurrency === toCurrency &&
            rate.toCurrency === fromCurrency,
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      if (inverse && inverse.rate > 0) {
        return 1 / inverse.rate;
      }
    } catch {
      // ignore and fallback
    }

    // Fallback - DEFAULT_EXCHANGE_RATES dan hisoblash
    const fromRate = DEFAULT_EXCHANGE_RATES[fromCurrency] ?? 1;
    const toRate = DEFAULT_EXCHANGE_RATES[toCurrency] ?? 1;
    return fromRate / toRate;
  }

  // Transfer uchun kurs olish (bid/ask bilan)
  getTransferRate(fromCurrency: FinanceCurrency, toCurrency: FinanceCurrency): TransferRateInfo {
    if (fromCurrency === toCurrency) {
      return {
        rateMid: 1,
        rateBid: 1,
        rateAsk: 1,
        spreadPercent: 0,
      };
    }

    const spreadMultiplier = this._spreadPercent / 100;

    try {
      const records = this.dao.list();

      // To'g'ridan-to'g'ri kursni qidirish
      const direct = records
        .filter(
          (rate) =>
            rate.fromCurrency === fromCurrency &&
            rate.toCurrency === toCurrency,
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      if (direct) {
        const rateMid = direct.rateMid ?? direct.rate;
        return {
          rateMid,
          rateBid: direct.rateBid ?? rateMid * (1 - spreadMultiplier),
          rateAsk: direct.rateAsk ?? rateMid * (1 + spreadMultiplier),
          spreadPercent: this._spreadPercent,
        };
      }

      // Teskari kursni qidirish
      const inverse = records
        .filter(
          (rate) =>
            rate.fromCurrency === toCurrency &&
            rate.toCurrency === fromCurrency,
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      if (inverse && inverse.rate > 0) {
        const rateMid = 1 / (inverse.rateMid ?? inverse.rate);
        // Teskari kursda bid va ask ham teskarisiga aylanadi
        const inverseBid = inverse.rateAsk ? 1 / inverse.rateAsk : rateMid * (1 - spreadMultiplier);
        const inverseAsk = inverse.rateBid ? 1 / inverse.rateBid : rateMid * (1 + spreadMultiplier);
        return {
          rateMid,
          rateBid: inverseBid,
          rateAsk: inverseAsk,
          spreadPercent: this._spreadPercent,
        };
      }
    } catch {
      // ignore and fallback
    }

    // Fallback
    const rateMid = this.getRate(fromCurrency, toCurrency);
    return {
      rateMid,
      rateBid: rateMid * (1 - spreadMultiplier),
      rateAsk: rateMid * (1 + spreadMultiplier),
      spreadPercent: this._spreadPercent,
    };
  }

  // Konvertatsiya - yo'nalishni hisobga oladi
  convert(
    amount: number,
    fromCurrency: FinanceCurrency,
    toCurrency: FinanceCurrency,
    direction: FxDirection = 'sell',
  ): { convertedAmount: number; effectiveRate: number; rateInfo: TransferRateInfo } {
    if (fromCurrency === toCurrency) {
      return {
        convertedAmount: amount,
        effectiveRate: 1,
        rateInfo: { rateMid: 1, rateBid: 1, rateAsk: 1, spreadPercent: 0 },
      };
    }

    const rateInfo = this.getTransferRate(fromCurrency, toCurrency);

    // Direction bo'yicha kursni tanlash:
    // 'sell' = siz fromCurrency ni sotasiz, toCurrency olasiz = bank sizdan fromCurrency sotib oladi = rateBid
    // 'buy' = siz toCurrency ni sotib olasiz = bank sizga toCurrency sotadi = rateAsk
    const effectiveRate = direction === 'sell' ? rateInfo.rateBid : rateInfo.rateAsk;
    const convertedAmount = amount * effectiveRate;

    return {
      convertedAmount,
      effectiveRate,
      rateInfo,
    };
  }

  getSnapshot(baseCurrency: FinanceCurrency) {
    try {
      const records = this.dao.list();
      if (!records.length) {
        return fallbackSnapshot(baseCurrency);
      }

      const snapshot: Record<FinanceCurrency, number> = fallbackSnapshot(baseCurrency);

      // Eng yangi kurslarni topish
      const latestRates = new Map<string, { rate: number; toCurrency: string; date: Date }>();

      records.forEach((rate) => {
        const key = rate.fromCurrency;
        const rateDate = new Date(rate.date);
        const existing = latestRates.get(key);

        if (!existing || rateDate > existing.date) {
          latestRates.set(key, {
            rate: rate.rate,
            toCurrency: rate.toCurrency,
            date: rateDate,
          });
        }
      });

      // Kurslarni baseCurrency ga nisbatan hisoblash
      latestRates.forEach((data, fromCurrency) => {
        if (fromCurrency === baseCurrency) {
          snapshot[fromCurrency as FinanceCurrency] = 1;
          return;
        }

        if (data.toCurrency === baseCurrency) {
          // To'g'ridan-to'g'ri kurs mavjud
          snapshot[fromCurrency as FinanceCurrency] = data.rate;
        } else {
          // Bilvosita hisoblash kerak
          // fromCurrency -> data.toCurrency -> baseCurrency
          const pivotData = latestRates.get(baseCurrency);
          if (pivotData && pivotData.toCurrency === data.toCurrency) {
            // Ikkalasi ham bir xil toCurrency ga bog'langan
            // fromCurrency/baseCurrency = fromCurrency/toCurrency / baseCurrency/toCurrency
            snapshot[fromCurrency as FinanceCurrency] = data.rate / pivotData.rate;
          }
        }
      });

      snapshot[baseCurrency] = 1;
      return snapshot;
    } catch {
      return fallbackSnapshot(baseCurrency);
    }
  }
}
