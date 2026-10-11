import { describe, it, expect } from "vitest";
import { convertCurrency, formatCurrencyPrice, getCurrencySymbol } from "@/lib/currency";
import { cacheKey } from "@/lib/cache";

describe("Currency Utilities", () => {
  it("returns correct symbols for currencies", () => {
    expect(getCurrencySymbol("EUR")).toBe("€");
    expect(getCurrencySymbol("USD")).toBe("$");
    expect(getCurrencySymbol("GBP")).toBe("£");
  });

  it("formats prices correctly with symbols", () => {
    expect(formatCurrencyPrice(963, "USD")).toBe("$963");
    expect(formatCurrencyPrice(860, "EUR")).toBe("€860");
    expect(formatCurrencyPrice(750, "GBP")).toBe("£750");
  });

  it("formats prices with conversion when source currency differs", () => {
    // $919 USD -> EUR should be ~€850, not €919
    const eurLabel = formatCurrencyPrice(919, "EUR", "USD");
    expect(eurLabel.startsWith("€")).toBe(true);
    const eurAmount = Number(eurLabel.slice(1));
    expect(eurAmount).toBeGreaterThanOrEqual(840);
    expect(eurAmount).toBeLessThanOrEqual(860);

    // $919 USD -> GBP should be ~£728
    const gbpLabel = formatCurrencyPrice(919, "GBP", "USD");
    expect(gbpLabel.startsWith("£")).toBe(true);
    const gbpAmount = Number(gbpLabel.slice(1));
    expect(gbpAmount).toBeGreaterThanOrEqual(710);
    expect(gbpAmount).toBeLessThanOrEqual(750);

    // Same currency: no conversion
    expect(formatCurrencyPrice(919, "USD", "USD")).toBe("$919");
  });

  it("converts between EUR and USD with accurate rates", () => {
    // €100 EUR should convert to ~$108 USD
    const usd = convertCurrency(100, "EUR", "USD");
    expect(usd).toBeGreaterThanOrEqual(106);
    expect(usd).toBeLessThanOrEqual(110);

    // $100 USD should convert to ~$93 EUR
    const eur = convertCurrency(100, "USD", "EUR");
    expect(eur).toBeGreaterThanOrEqual(91);
    expect(eur).toBeLessThanOrEqual(94);
  });

  it("converts between EUR and GBP with accurate rates", () => {
    // €100 EUR should convert to ~$85 GBP
    const gbp = convertCurrency(100, "EUR", "GBP");
    expect(gbp).toBeGreaterThanOrEqual(83);
    expect(gbp).toBeLessThanOrEqual(87);
  });

  it("converts Central and Eastern European currencies (HUF, CZK, PLN) accurately to USD", () => {
    // 8,000 HUF (Budapest) should be ~$21-$24 USD, NOT $8,644
    const hufUsd = convertCurrency(8000, "HUF", "USD");
    expect(hufUsd).toBeGreaterThanOrEqual(19);
    expect(hufUsd).toBeLessThanOrEqual(25);

    // 1,300 CZK (Prague) should be ~$50-$60 USD, NOT $1,400
    const czkUsd = convertCurrency(1300, "CZK", "USD");
    expect(czkUsd).toBeGreaterThanOrEqual(48);
    expect(czkUsd).toBeLessThanOrEqual(60);

    // 210 PLN (Wroclaw/Krakow) should be ~$50-$58 USD, NOT $227
    const plnUsd = convertCurrency(210, "PLN", "USD");
    expect(plnUsd).toBeGreaterThanOrEqual(48);
    expect(plnUsd).toBeLessThanOrEqual(58);
  });

  it("returns same amount when from and to currencies match", () => {
    expect(convertCurrency(500, "USD", "USD")).toBe(500);
    expect(convertCurrency(500, "EUR", "EUR")).toBe(500);
  });
});

describe("Cache Key Partitioning", () => {
  it("creates distinct cache keys for round-trip vs one-way", () => {
    const rtKey = cacheKey("CIA", "NRT", "2026-11-09", "2026-11-16", "round", "USD");
    const owKey = cacheKey("CIA", "NRT", "2026-11-09", undefined, "oneway", "USD");

    expect(rtKey).not.toBe(owKey);
    expect(rtKey).toContain("2026-11-16");
    expect(rtKey).toContain("round");
    expect(owKey).toContain("ow");
    expect(owKey).toContain("oneway");
  });

  it("creates distinct cache keys for USD vs EUR", () => {
    const usdKey = cacheKey("MXP", "NRT", "2026-11-09", "2026-11-16", "round", "USD");
    const eurKey = cacheKey("MXP", "NRT", "2026-11-09", "2026-11-16", "round", "EUR");

    expect(usdKey).not.toBe(eurKey);
    expect(usdKey).toContain("USD");
    expect(eurKey).toContain("EUR");
  });
});
