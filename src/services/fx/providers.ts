import type { FinanceCurrency, FinanceRegion } from '@/stores/useFinancePreferencesStore';
import { DEFAULT_EXCHANGE_RATES, FINANCE_REGION_PRESETS } from '@/stores/useFinancePreferencesStore';

// Provider ID lari - har bir region uchun markaziy bank
export type FxProviderId =
  | 'cbu'           // O'zbekiston - Central Bank of Uzbekistan
  | 'cbr'           // Rossiya - Central Bank of Russia
  | 'tcmb'          // Turkiya - Central Bank of Turkey
  | 'sama'          // Saudiya Arabistoni - Saudi Arabian Monetary Authority
  | 'cbuae'         // BAA - Central Bank of UAE
  | 'ecb'           // Yevropa - European Central Bank
  | 'fed'           // AQSH - Federal Reserve
  | 'boe'           // Britaniya - Bank of England
  | 'market_api'    // Umumiy bozor kurslari
  | 'manual';       // Qo'lda kiritish

export interface ProviderResult {
  fromCurrency: FinanceCurrency;
  toCurrency: FinanceCurrency;
  rate: number;
  rateMid?: number;   // O'rta kurs (markaziy bank rasmiy kursi)
  rateBid?: number;   // Sotib olish kursi (bank sotib oladi)
  rateAsk?: number;   // Sotish kursi (bank sotadi)
  nominal?: number;   // Nominal (odatda 1)
}

type ProviderHandler = (date: Date, baseCurrency?: FinanceCurrency) => Promise<ProviderResult[]>;

// Default spread - 0.5%
const DEFAULT_SPREAD_PERCENT = 0.5;

const cloneDefaultRates = () => ({ ...DEFAULT_EXCHANGE_RATES });

// Spreadni hisoblash
const applySpread = (rate: number, spreadPercent: number = DEFAULT_SPREAD_PERCENT) => ({
  rateMid: rate,
  rateBid: Number((rate * (1 - spreadPercent / 100)).toFixed(4)),
  rateAsk: Number((rate * (1 + spreadPercent / 100)).toFixed(4)),
});

// Region bo'yicha provider tanlash
export const getProviderForRegion = (regionId: FinanceRegion): FxProviderId => {
  const providerMap: Record<FinanceRegion, FxProviderId> = {
    'uzbekistan': 'cbu',
    'russia': 'cbr',
    'turkey': 'tcmb',
    'saudi-arabia': 'sama',
    'united-arab-emirates': 'cbuae',
    'eurozone': 'ecb',
    'united-states': 'fed',
    'united-kingdom': 'boe',
  };
  return providerMap[regionId] ?? 'market_api';
};

// Region bo'yicha base currency olish
export const getBaseCurrencyForRegion = (regionId: FinanceRegion): FinanceCurrency => {
  const preset = FINANCE_REGION_PRESETS.find(p => p.id === regionId);
  return (preset?.currency ?? 'USD') as FinanceCurrency;
};

// ============================================
// MARKAZIY BANK API LARI
// ============================================

// O'zbekiston - CBU.uz API
const fetchCbuRates = async (_date: Date, _baseCurrency: FinanceCurrency = 'UZS'): Promise<ProviderResult[]> => {
  try {
    const dateStr = _date.toISOString().split('T')[0];
    const url = `https://cbu.uz/uz/arkhiv-kursov-valyut/json/all/${dateStr}/`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`CBU API error: ${response.status}`);
    }

    const data = await response.json();

    return data.map((item: any) => {
      const rate = parseFloat(item.Rate);
      const nominal = parseInt(item.Nominal, 10) || 1;
      const normalizedRate = rate / nominal;
      const spread = applySpread(normalizedRate);

      return {
        fromCurrency: item.Ccy as FinanceCurrency,
        toCurrency: 'UZS' as FinanceCurrency,
        rate: normalizedRate,
        ...spread,
        nominal,
      };
    });
  } catch (error) {
    console.warn('[FX] CBU API xatosi, fallback ishlatilmoqda:', error);
    return createFallbackRates('UZS');
  }
};

// Rossiya - CBR.ru API
const fetchCbrRates = async (_date: Date, _baseCurrency: FinanceCurrency = 'RUB'): Promise<ProviderResult[]> => {
  try {
    const dateStr = _date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\./g, '/');
    const url = `https://www.cbr.ru/scripts/XML_daily.asp?date_req=${dateStr}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`CBR API error: ${response.status}`);

    const text = await response.text();
    // XML parsing (soddalashtirilgan)
    const results: ProviderResult[] = [];

    // XML dan valyutalarni ajratib olish
    const currencyMatches = text.matchAll(/<Valute[^>]*>[\s\S]*?<CharCode>(\w+)<\/CharCode>[\s\S]*?<Nominal>(\d+)<\/Nominal>[\s\S]*?<Value>([\d,]+)<\/Value>[\s\S]*?<\/Valute>/g);

    for (const match of currencyMatches) {
      const code = match[1];
      const nominal = parseInt(match[2], 10);
      const rate = parseFloat(match[3].replace(',', '.'));
      const normalizedRate = rate / nominal;

      if (['USD', 'EUR', 'GBP', 'TRY', 'UZS', 'AED', 'SAR'].includes(code)) {
        const spread = applySpread(normalizedRate);
        results.push({
          fromCurrency: code as FinanceCurrency,
          toCurrency: 'RUB',
          rate: normalizedRate,
          ...spread,
          nominal,
        });
      }
    }

    return results.length ? results : createFallbackRates('RUB');
  } catch (error) {
    console.warn('[FX] CBR API xatosi, fallback ishlatilmoqda:', error);
    return createFallbackRates('RUB');
  }
};

// Turkiya - TCMB API
const fetchTcmbRates = async (_date: Date, _baseCurrency: FinanceCurrency = 'TRY'): Promise<ProviderResult[]> => {
  try {
    const url = 'https://www.tcmb.gov.tr/kurlar/today.xml';
    const response = await fetch(url);
    if (!response.ok) throw new Error(`TCMB API error: ${response.status}`);

    const text = await response.text();
    const results: ProviderResult[] = [];

    // XML parsing
    const currencyMatches = text.matchAll(/<Currency[^>]*CurrencyCode="(\w+)"[^>]*>[\s\S]*?<Unit>(\d+)<\/Unit>[\s\S]*?<ForexBuying>([\d.]+)<\/ForexBuying>[\s\S]*?<ForexSelling>([\d.]+)<\/ForexSelling>[\s\S]*?<\/Currency>/g);

    for (const match of currencyMatches) {
      const code = match[1];
      const nominal = parseInt(match[2], 10);
      const rateBid = parseFloat(match[3]) / nominal;
      const rateAsk = parseFloat(match[4]) / nominal;
      const rateMid = (rateBid + rateAsk) / 2;

      if (['USD', 'EUR', 'GBP', 'SAR', 'AED', 'RUB'].includes(code)) {
        results.push({
          fromCurrency: code as FinanceCurrency,
          toCurrency: 'TRY',
          rate: rateMid,
          rateMid,
          rateBid,
          rateAsk,
          nominal,
        });
      }
    }

    return results.length ? results : createFallbackRates('TRY');
  } catch (error) {
    console.warn('[FX] TCMB API xatosi, fallback ishlatilmoqda:', error);
    return createFallbackRates('TRY');
  }
};

// Fallback rates - API ishlamasa ishlatiladi
const createFallbackRates = (baseCurrency: FinanceCurrency): ProviderResult[] => {
  const baseRates = cloneDefaultRates();
  const baseRate = baseRates[baseCurrency] || 1;

  return Object.entries(baseRates)
    .filter(([currency]) => currency !== baseCurrency)
    .map(([currency, rate]) => {
      // Base valyutaga nisbatan kursni hisoblash
      const relativeRate = rate / baseRate;
      const spread = applySpread(relativeRate);

      return {
        fromCurrency: currency as FinanceCurrency,
        toCurrency: baseCurrency,
        rate: relativeRate,
        ...spread,
        nominal: 1,
      };
    });
};

// Stub provider - test va development uchun
const createStubProvider = (baseCurrency: FinanceCurrency): ProviderHandler => {
  return async (_date, _base) => {
    const target = _base || baseCurrency;
    return createFallbackRates(target);
  };
};

const randomFactor = () => 0.98 + Math.random() * 0.04;

// Market API - bozor kurslari (spreadli)
const fetchMarketRates = async (_date: Date, baseCurrency: FinanceCurrency = 'USD'): Promise<ProviderResult[]> => {
  const baseRates = cloneDefaultRates();
  const baseRate = baseRates[baseCurrency] || 1;

  return Object.entries(baseRates)
    .filter(([currency]) => currency !== baseCurrency)
    .map(([currency, rate]) => {
      const relativeRate = (rate / baseRate) * randomFactor();
      const spread = applySpread(relativeRate);

      return {
        fromCurrency: currency as FinanceCurrency,
        toCurrency: baseCurrency,
        rate: Number(relativeRate.toFixed(4)),
        ...spread,
        nominal: 1,
      };
    });
};

// ============================================
// PROVIDER RO'YXATI
// ============================================

export const FX_PROVIDERS: Record<FxProviderId, ProviderHandler> = {
  // Haqiqiy markaziy bank API lari
  cbu: fetchCbuRates,           // O'zbekiston
  cbr: fetchCbrRates,           // Rossiya
  tcmb: fetchTcmbRates,         // Turkiya

  // Stub providerlar (API mavjud bo'lmagan regionlar uchun)
  sama: createStubProvider('SAR'),   // Saudiya
  cbuae: createStubProvider('AED'),  // BAA
  ecb: createStubProvider('EUR'),    // Yevropa
  fed: createStubProvider('USD'),    // AQSH
  boe: createStubProvider('GBP'),    // Britaniya

  // Umumiy providerlar
  market_api: fetchMarketRates,
  manual: async () => [],
};

// Backward compatibility uchun eski provider nomlari
export const LEGACY_PROVIDER_MAP: Record<string, FxProviderId> = {
  'central_bank_stub': 'cbu',
  'market_stub': 'market_api',
};
