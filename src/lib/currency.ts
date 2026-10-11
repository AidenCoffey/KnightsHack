/**
 * currency.ts — Exchange rate utilities for Venture
 *
 * Provides clean conversion between EUR, USD, and GBP for fares and ground transport.
 */

export type SupportedCurrency = "EUR" | "USD" | "GBP";

// Reference exchange rates (Oct 2026 market baseline)
// 1 EUR = ~1.08 USD, 1 EUR = ~0.85 GBP
// 1 USD = ~0.93 EUR, 1 USD = ~0.79 GBP
// 1 GBP = ~1.18 EUR, 1 GBP = ~1.27 USD
const RATES_TO_EUR: Record<string, number> = {
  EUR: 1.0,
  USD: 0.925,
  GBP: 1.176,
  CHF: 1.06,
  CZK: 0.0395,
  HUF: 0.0025,
  PLN: 0.2325,
  SEK: 0.0877,
  NOK: 0.0855,
  DKK: 0.134,
  RON: 0.201,
  BGN: 0.511,
  RSD: 0.00855,
  TRY: 0.027,
  JPY: 0.00606,
  CAD: 0.667,
  AUD: 0.617,
  THB: 0.0274,
  MAD: 0.0926,
};

const RATES_FROM_EUR: Record<string, number> = {
  EUR: 1.0,
  USD: 1.081,
  GBP: 0.85,
  CHF: 0.943,
  CZK: 25.3,
  HUF: 400.0,
  PLN: 4.30,
  SEK: 11.4,
  NOK: 11.7,
  DKK: 7.46,
  RON: 4.97,
  BGN: 1.956,
  RSD: 117.0,
  TRY: 37.0,
  JPY: 165.0,
  CAD: 1.50,
  AUD: 1.62,
  THB: 36.5,
  MAD: 10.8,
};

/**
 * Converts an amount from one currency to another.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  if (from === to) return amount;

  const toEur = RATES_TO_EUR[from] ?? 1.0;
  const fromEur = RATES_FROM_EUR[to] ?? 1.0;

  const inEur = amount * toEur;
  const result = inEur * fromEur;

  return Math.round(result * 100) / 100;
}

/**
 * Returns the currency symbol for display.
 */
export function getCurrencySymbol(currency: string): string {
  switch (currency.toUpperCase()) {
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "USD":
    default:
      return "$";
  }
}

/**
 * Formats a monetary price with the appropriate symbol.
 * When fromCurrency differs from currency, converts the amount first.
 */
export function formatCurrencyPrice(
  price: number,
  currency: string,
  fromCurrency?: string
): string {
  const symbol = getCurrencySymbol(currency);
  const amount =
    fromCurrency && fromCurrency.toUpperCase() !== currency.toUpperCase()
      ? convertCurrency(price, fromCurrency, currency)
      : price;
  return `${symbol}${Math.round(amount)}`;
}
