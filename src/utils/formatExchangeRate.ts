/**
 * Format exchange rate in user-friendly way
 *
 * Rules:
 * - If rate < 1, show inverse: "1 TO = X FROM" (e.g., "1 TRY = 13,000 UZS" when rate is 0.000077)
 * - If rate >= 1, show as-is: "1 FROM = X TO" (e.g., "1 USD = 12,450 UZS")
 *
 * This ensures that the "1" is always on the "larger" currency side, making it intuitive to read.
 *
 * @param rate - Exchange rate from FROM currency to TO currency
 * @param fromCurrency - Source currency code (e.g., "UZS", "USD")
 * @param toCurrency - Target currency code (e.g., "TRY", "USD")
 * @returns Formatted exchange rate string (e.g., "1 TRY = 13,000 UZS")
 *
 * @example
 * formatExchangeRate(0.000077, "UZS", "TRY") // "1 TRY = 13,000 UZS"
 * formatExchangeRate(12450, "USD", "UZS") // "1 USD = 12,450 UZS"
 * formatExchangeRate(0.94, "USD", "EUR") // "1 EUR = 1.06 USD"
 */
export const formatExchangeRate = (
  rate: number,
  fromCurrency: string,
  toCurrency: string
): string => {
  if (!Number.isFinite(rate) || rate === 0) {
    return `1 ${fromCurrency} = — ${toCurrency}`;
  }

  // Agar rate juda kichik bo'lsa (<1), teskari ko'rsatamiz
  if (rate < 1) {
    const inverseRate = 1 / rate;
    const decimals = getDecimalPlaces(inverseRate, toCurrency);
    const formattedRate = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(inverseRate);
    return `1 ${toCurrency} = ${formattedRate} ${fromCurrency}`;
  }

  // Aks holda, oddiy ko'rsatamiz
  const decimals = getDecimalPlaces(rate, toCurrency);
  const formattedRate = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(rate);
  return `1 ${fromCurrency} = ${formattedRate} ${toCurrency}`;
};

/**
 * Determine appropriate decimal places based on value and currency
 */
function getDecimalPlaces(value: number, currency: string): number {
  // UZS har doim kasrsiz
  if (currency === 'UZS') return 0;

  // Boshqa valyutalar uchun qiymatga qarab (maksimum 2 kasr raqam)
  if (value >= 100) return 2; // 12,450.00 UZS yoki 13,000.00 UZS
  if (value >= 10) return 2; // 13.50 TRY
  if (value >= 1) return 2; // 1.06 USD
  return 4; // 0.0077 (juda kichik qiymatlar uchun ko'proq)
}
