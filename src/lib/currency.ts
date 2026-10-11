/**
 * currency.ts — Exchange rate utilities for FlightDeck
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
};

const RATES_FROM_EUR: Record<string, number> = {
  EUR: 1.0,
  USD: 1.081,
  GBP: 0.85,
  CHF: 0.943,
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
