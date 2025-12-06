/**
 * Number formatting utilities for displaying numbers with space separators (1 000 format)
 * Used throughout the app for financial values, amounts, etc.
 */

/**
 * Formats a number with space as thousand separator
 * @param value - The number or string to format
 * @param maxDecimals - Maximum decimal places (default: 2)
 * @returns Formatted string (e.g., 1000 -> "1 000", 1000.506 -> "1 000.51")
 */
export const formatNumberWithSpaces = (value: number | string, maxDecimals: number = 2): string => {
  if (value === '' || value === null || value === undefined) return '';

  const num = typeof value === 'string' ? parseFloat(value.replace(/\s/g, '')) : value;
  if (isNaN(num)) return '';

  // Handle zero
  if (num === 0) return '0';

  // Round to maxDecimals places
  const roundedNum = Math.round(num * Math.pow(10, maxDecimals)) / Math.pow(10, maxDecimals);

  const parts = roundedNum.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  // Remove trailing zeros from decimal part
  if (parts[1]) {
    parts[1] = parts[1].replace(/0+$/, '');
    if (parts[1] === '') {
      return parts[0];
    }
  }

  return parts.join('.');
};

/**
 * Parses a space-formatted number string back to a number
 * @param value - The formatted string (e.g., "1 000.50")
 * @returns The numeric value (e.g., 1000.50)
 */
export const parseSpacedNumber = (value: string): number => {
  if (!value || value === '') return 0;
  const cleaned = value.replace(/\s/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Sanitizes input for number fields - allows only digits, dots, and handles formatting
 * @param text - Raw input text
 * @returns Object with cleaned value and formatted display value
 */
export const sanitizeNumberInput = (text: string): { cleaned: string; formatted: string; numericValue: number } => {
  // Remove spaces first
  const withoutSpaces = text.replace(/\s/g, '');

  // Allow only digits and one decimal point
  let cleaned = withoutSpaces.replace(/[^\d.]/g, '');

  // Handle multiple decimal points - keep only first
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }

  const numericValue = parseFloat(cleaned) || 0;
  const formatted = cleaned ? formatNumberWithSpaces(numericValue) : '';

  return { cleaned, formatted, numericValue };
};

/**
 * Formats a number for display with optional currency
 * @param value - The number to format
 * @param currency - Optional currency code to append
 * @returns Formatted string (e.g., "1 000.50 USD")
 */
export const formatAmountDisplay = (value: number, currency?: string): string => {
  const formatted = formatNumberWithSpaces(value);
  return currency ? `${formatted} ${currency}` : formatted;
};

/**
 * Abbreviation suffixes for large numbers
 */
const LARGE_NUMBER_SUFFIXES = [
  { value: 1e12, suffix: 'T' },  // Trillion
  { value: 1e9, suffix: 'B' },   // Billion
  { value: 1e6, suffix: 'M' },   // Million
  { value: 1e3, suffix: 'K' },   // Thousand
];

/**
 * Formats a large number with abbreviations (K, M, B, T)
 * Used for UI display when space is limited
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 1)
 * @param threshold - Minimum value to start abbreviating (default: 100000)
 * @returns Formatted string (e.g., 1500000 -> "1.5M", 1200 -> "1 200")
 */
export const formatCompactNumber = (
  value: number,
  decimals: number = 1,
  threshold: number = 100000
): string => {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  // If below threshold, use regular formatting
  if (absValue < threshold) {
    return formatNumberWithSpaces(value);
  }

  // Find appropriate suffix
  for (const { value: divisor, suffix } of LARGE_NUMBER_SUFFIXES) {
    if (absValue >= divisor) {
      const compactValue = absValue / divisor;
      // Format with specified decimals, removing trailing zeros
      const formatted = compactValue.toFixed(decimals).replace(/\.?0+$/, '');
      return `${sign}${formatted}${suffix}`;
    }
  }

  return formatNumberWithSpaces(value);
};

/**
 * Formats a percentage value, capping at a maximum display value
 * Used for UI display when percentages can be extremely large
 * @param value - The percentage value
 * @param maxDisplay - Maximum value to display before showing "999+" (default: 999)
 * @returns Formatted string (e.g., 150 -> "+150%", 10000 -> "999+%")
 */
export const formatPercentage = (
  value: number,
  maxDisplay: number = 999
): string => {
  const sign = value >= 0 ? '+' : '';
  const absValue = Math.abs(value);

  if (absValue > maxDisplay) {
    return `${sign}${maxDisplay}+%`;
  }

  // Format with 1 decimal if needed
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${sign}${formatted}%`;
};

/**
 * Formats currency amount with compact notation for large values
 * @param value - The amount to format
 * @param currency - Currency code
 * @param threshold - Threshold for compact notation (default: 1000000)
 * @returns Formatted string with currency
 */
export const formatCurrencyCompact = (
  value: number,
  currency: string,
  threshold: number = 1000000
): string => {
  const formatted = formatCompactNumber(value, 2, threshold);
  return `${formatted} ${currency}`;
};
