// apps/mobile/src/data/services/CurrencyService.ts
import Realm, { BSON } from 'realm';
import { Rate } from '@/utils/models/Rate';

export interface CurrencyRate {
  currency: string;
  rate: number;
  date: Date;
}

export interface ConversionResult {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  convertedAmount: number;
  rate: number;
  rateDate: Date;
  isHistorical: boolean;
}

class CurrencyService {
  private realm: Realm | null = null;
  private baseCurrency = 'USD';
  private cachedRates: Map<string, CurrencyRate> = new Map();
  
  // Common currencies with their symbols
  public readonly currencies = {
    USD: { symbol: '$', name: 'US Dollar', decimals: 2 },
    EUR: { symbol: '€', name: 'Euro', decimals: 2 },
    GBP: { symbol: '£', name: 'British Pound', decimals: 2 },
    UZS: { symbol: 'сум', name: 'Uzbek Som', decimals: 0 },
    RUB: { symbol: '₽', name: 'Russian Ruble', decimals: 2 },
    JPY: { symbol: '¥', name: 'Japanese Yen', decimals: 0 },
    CNY: { symbol: '¥', name: 'Chinese Yuan', decimals: 2 },
    CHF: { symbol: 'Fr', name: 'Swiss Franc', decimals: 2 },
    CAD: { symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
    AUD: { symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
  };

  initialize(realm: Realm) {
    this.realm = realm;
    this.loadCachedRates();
  }

  setBaseCurrency(currency: string) {
    this.baseCurrency = currency;
  }

  getBaseCurrency(): string {
    return this.baseCurrency;
  }

  /**
   * Load the most recent rates into cache for quick access
   */
  private loadCachedRates() {
    if (!this.realm) return;

    const rates = this.realm.objects<Rate>('Rate');
    
    // Store in cache
    this.cachedRates.clear();
    rates.forEach(rate => {
      const key = rate.currency;
      this.cachedRates.set(key, {
        currency: rate.currency,
        rate: rate.rateToUSD,
        date: rate.effectiveFrom,
      });
    });
  }

  /**
   * Get exchange rate for a specific date
   */
  getRate(
    fromCurrency: string,
    toCurrency: string,
    date?: Date
  ): number | null {
    if (fromCurrency === toCurrency) return 1;
    if (!this.realm) return null;

    const targetDate = date || new Date();
    
    // Get rates to USD
    const fromRate = this.findRate(fromCurrency, targetDate);
    const toRate = this.findRate(toCurrency, targetDate);
    
    if (fromRate && toRate) {
      // Convert through USD
      return fromRate.rateToUSD / toRate.rateToUSD;
    }

    // Fallback rates
    const fallbackRates: { [key: string]: number } = {
      'USD': 1,
      'UZS': 0.000079,
      'EUR': 1.08,
      'RUB': 0.011,
    };
    
    const fromRateUSD = fallbackRates[fromCurrency] || 1;
    const toRateUSD = fallbackRates[toCurrency] || 1;
    
    return fromRateUSD / toRateUSD;
  }

  private findRate(
    currency: string,
    date: Date
  ): Rate | null {
    if (!this.realm) return null;
    
    if (currency === 'USD') {
      // USD is always 1
      return {
        _id: new BSON.ObjectId(),
        currency: 'USD',
        rateToUSD: 1,
        effectiveFrom: date,
        source: 'manual',
        createdAt: date,
        updatedAt: date,
      } as Rate;
    }

    const rates = this.realm
      .objects<Rate>('Rate')
      .filtered(
        'currency == $0 AND effectiveFrom <= $1',
        currency,
        date
      )
      .sorted('effectiveFrom', true);

    return rates.length > 0 ? rates[0] : null;
  }

  /**
   * Convert amount between currencies
   */
  convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date?: Date,
    useHistoricalRate = false
  ): ConversionResult {
    if (fromCurrency === toCurrency) {
      return {
        amount,
        fromCurrency,
        toCurrency,
        convertedAmount: amount,
        rate: 1,
        rateDate: new Date(),
        isHistorical: false,
      };
    }

    const targetDate = useHistoricalRate && date ? date : new Date();
    const rate = this.getRate(fromCurrency, toCurrency, targetDate);

    if (!rate) {
      // No rate found, return original amount
      console.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency}`);
      return {
        amount,
        fromCurrency,
        toCurrency,
        convertedAmount: amount,
        rate: 1,
        rateDate: new Date(),
        isHistorical: false,
      };
    }

    const convertedAmount = this.roundByCurrency(amount * rate, toCurrency);

    return {
      amount,
      fromCurrency,
      toCurrency,
      convertedAmount,
      rate,
      rateDate: targetDate,
      isHistorical: useHistoricalRate,
    };
  }

  /**
   * Round amount based on currency decimals
   */
  roundByCurrency(amount: number, currency: string): number {
    const currencyInfo = this.currencies[currency as keyof typeof this.currencies];
    const decimals = currencyInfo?.decimals ?? 2;
    
    const factor = Math.pow(10, decimals);
    return Math.round(amount * factor) / factor;
  }

  /**
   * Format amount with currency symbol
   */
  format(amount: number, currency: string, options?: {
    showSymbol?: boolean;
    showCode?: boolean;
    compact?: boolean;
  }): string {
    const opts = {
      showSymbol: true,
      showCode: false,
      compact: false,
      ...options,
    };

    const currencyInfo = this.currencies[currency as keyof typeof this.currencies];
    if (!currencyInfo) {
      return `${currency} ${amount.toFixed(2)}`;
    }

    const rounded = this.roundByCurrency(amount, currency);
    
    if (opts.compact && Math.abs(rounded) >= 1000) {
      const formatted = this.formatCompact(rounded);
      if (opts.showSymbol) {
        return `${currencyInfo.symbol}${formatted}`;
      }
      if (opts.showCode) {
        return `${formatted} ${currency}`;
      }
      return formatted;
    }

    const formatted = rounded.toLocaleString('en-US', {
      minimumFractionDigits: currencyInfo.decimals,
      maximumFractionDigits: currencyInfo.decimals,
    });

    if (opts.showSymbol) {
      return `${currencyInfo.symbol}${formatted}`;
    }
    if (opts.showCode) {
      return `${formatted} ${currency}`;
    }
    return formatted;
  }

  private formatCompact(num: number): string {
    const absNum = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    
    if (absNum >= 1e9) {
      return `${sign}${(absNum / 1e9).toFixed(1)}B`;
    }
    if (absNum >= 1e6) {
      return `${sign}${(absNum / 1e6).toFixed(1)}M`;
    }
    if (absNum >= 1e3) {
      return `${sign}${(absNum / 1e3).toFixed(1)}K`;
    }
    return `${sign}${absNum}`;
  }

  /**
   * Save new exchange rate
   */
  saveRate(
    currency: string,
    rateToUSD: number,
    source: 'manual' | 'api' | 'bank' = 'manual',
    effectiveFrom?: Date
  ): Rate | null {
    if (!this.realm) return null;

    try {
      let newRate: Rate;
      
      this.realm.write(() => {
        // Create new rate
        newRate = this.realm!.create<Rate>('Rate', {
          _id: new BSON.ObjectId(),
          currency,
          rateToUSD,
          source,
          effectiveFrom: effectiveFrom || new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      // Reload cache
      this.loadCachedRates();
      
      return newRate!;
    } catch (error) {
      console.error('Error saving exchange rate:', error);
      return null;
    }
  }

  /**
   * Fetch rates from API (mock implementation)
   */
  async fetchLatestRates(): Promise<boolean> {
    try {
      // Mock API call - in production, use real API
      const mockRates = {
        EUR: 0.926,
        GBP: 0.79,
        UZS: 12650,
        RUB: 91,
        JPY: 149.5,
        CNY: 7.24,
      };

      // Save rates to database
      Object.entries(mockRates).forEach(([currency, rateFromUSD]) => {
        const rateToUSD = currency === 'UZS' ? 1 / rateFromUSD : 1 / rateFromUSD;
        this.saveRate(currency, rateToUSD, 'api');
      });

      return true;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      return false;
    }
  }

  /**
   * Get all available currencies from saved rates
   */
  getAvailableCurrencies(): string[] {
    if (!this.realm) return Object.keys(this.currencies);

    const currencySet = new Set<string>(['USD']); // Always include USD
    
    const rates = this.realm.objects<Rate>('Rate');
    rates.forEach(rate => {
      currencySet.add(rate.currency);
    });

    return Array.from(currencySet).sort();
  }

  /**
   * Calculate equivalent amounts in different currencies
   */
  getEquivalents(
    amount: number,
    fromCurrency: string,
    targetCurrencies?: string[]
  ): Record<string, number> {
    const targets = targetCurrencies || this.getAvailableCurrencies();
    const equivalents: Record<string, number> = {};

    targets.forEach(currency => {
      if (currency !== fromCurrency) {
        const result = this.convert(amount, fromCurrency, currency);
        equivalents[currency] = result.convertedAmount;
      }
    });

    return equivalents;
  }

  /**
   * Get rate history for a currency pair
   */
  getRateHistory(
    fromCurrency: string,
    toCurrency: string,
    days = 30
  ): { date: Date; rate: number }[] {
    if (!this.realm) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const history: { date: Date; rate: number }[] = [];
    
    // Get rates for each currency
    const fromRates = this.realm
      .objects<Rate>('Rate')
      .filtered(
        'currency == $0 AND effectiveFrom >= $1',
        fromCurrency,
        startDate
      )
      .sorted('effectiveFrom');
      
    const toRates = this.realm
      .objects<Rate>('Rate')
      .filtered(
        'currency == $0 AND effectiveFrom >= $1',
        toCurrency,
        startDate
      )
      .sorted('effectiveFrom');

    // Calculate exchange rates
    fromRates.forEach(fromRate => {
      const toRate = toRates.find(r => 
        r.effectiveFrom.toDateString() === fromRate.effectiveFrom.toDateString()
      );
      
      if (toRate) {
        history.push({
          date: fromRate.effectiveFrom,
          rate: fromRate.rateToUSD / toRate.rateToUSD,
        });
      }
    });

    return history;
  }

  /**
   * Check if rates need updating (older than 24 hours)
   */
  needsUpdate(): boolean {
    if (this.cachedRates.size === 0) return true;

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const rate of this.cachedRates.values()) {
      if (rate.date < dayAgo) {
        return true;
      }
    }

    return false;
  }
}

export default new CurrencyService();
