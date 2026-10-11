import { describe, it, expect } from "vitest";
import { getMockFares } from "@/lib/providers/mock";
import { loadAirports, findAirport, getAirportsInRadius } from "@/lib/airports";
import { buildAviasalesSearchUrl, formatDDMM } from "@/lib/aviasales-url";

describe("Aviasales Search URL Builder", () => {
  it("formats dates as strict DDMM instead of YYYYMMDD", () => {
    // Nov 9 -> 0911
    expect(formatDDMM("2026-11-09")).toBe("0911");
    // Jan 19 -> 1901
    expect(formatDDMM("2027-01-19")).toBe("1901");
  });

  it("builds valid round-trip Aviasales search URL without 8-digit date bugs", () => {
    const url = buildAviasalesSearchUrl({
      origin: "TPA",
      destination: "ZRH",
      dateFrom: "2026-11-09",
      dateTo: "2026-11-16",
      passengers: 1,
      marker: "708226",
    });

    // Must be DDMM format: TPA + 0911 + ZRH + 1611 + 1
    expect(url).toContain("https://www.aviasales.com/search/TPA0911ZRH16111");
    expect(url).toContain("marker=708226");
    expect(url).not.toContain("20261109");
    expect(url).not.toContain("20270119");
  });

  it("builds valid one-way Aviasales search URL", () => {
    const url = buildAviasalesSearchUrl({
      origin: "TPA",
      destination: "ZRH",
      dateFrom: "2027-01-19",
      passengers: 1,
      marker: "708226",
    });

    // Must be TPA + 1901 + ZRH + 1
    expect(url).toContain("https://www.aviasales.com/search/TPA1901ZRH1");
    expect(url).toContain("marker=708226");
    expect(url).not.toContain("20270119");
  });

  it("accurately handles user case: Madrid to Tokyo 11/09 to 11/16 round-trip (never one-way on 11/16)", () => {
    const roundTripUrl = buildAviasalesSearchUrl({
      origin: "MAD",
      destination: "NRT",
      dateFrom: "2026-11-09",
      dateTo: "2026-11-16",
      tripType: "round",
      passengers: 1,
      marker: "708226",
    });

    // Must be MAD + 0911 + NRT + 1611 + 1 (depart Nov 9, return Nov 16)
    expect(roundTripUrl).toBe(
      "https://www.aviasales.com/search/MAD0911NRT16111?marker=708226&utm_source=flightdeck&utm_medium=affiliate&utm_campaign=reverse-search&utm_content=MAD-NRT"
    );
    // Must NOT be the broken one-way departing on 11/16:
    expect(roundTripUrl).not.toContain("MAD1611NRT1");
  });

  it("accurately handles user case: Madrid to Tokyo 11/09 one-way", () => {
    const oneWayUrl = buildAviasalesSearchUrl({
      origin: "MAD",
      destination: "NRT",
      dateFrom: "2026-11-09",
      tripType: "oneway",
      passengers: 1,
      marker: "708226",
    });

    // Must be MAD + 0911 + NRT + 1 (depart Nov 9, 1 passenger)
    expect(oneWayUrl).toBe(
      "https://www.aviasales.com/search/MAD0911NRT1?marker=708226&utm_source=flightdeck&utm_medium=affiliate&utm_campaign=reverse-search&utm_content=MAD-NRT"
    );
  });

  it("forces one-way when tripType is explicitly oneway even if dateTo is present", () => {
    const url = buildAviasalesSearchUrl({
      origin: "MAD",
      destination: "NRT",
      dateFrom: "2026-11-09",
      dateTo: "2026-11-16",
      tripType: "oneway",
      passengers: 1,
    });

    expect(url).toContain("MAD0911NRT1");
    expect(url).not.toContain("1611");
  });
});

describe("Route Viability & Pricing Integrity", () => {
  it("returns NO fares for domestic-only / general aviation airfields to Europe", () => {
    // St. Augustine (UST) has NO transatlantic commercial service to Zurich
    const ustFares = getMockFares({
      origin: "UST",
      destination: "ZRH",
      dateFrom: "2026-11-09",
      dateTo: "2026-11-16",
      currency: "USD",
    });
    expect(ustFares).toEqual([]);

    // Punta Gorda (PGD) has Allegiant domestic only, NO service to Zurich
    const pgdFares = getMockFares({
      origin: "PGD",
      destination: "ZRH",
      dateFrom: "2026-11-09",
      dateTo: "2026-11-16",
      currency: "USD",
    });
    expect(pgdFares).toEqual([]);

    // Lakeland (LAL) has NO service to Zurich
    const lalFares = getMockFares({
      origin: "LAL",
      destination: "ZRH",
      dateFrom: "2026-11-09",
      dateTo: "2026-11-16",
      currency: "USD",
    });
    expect(lalFares).toEqual([]);
  });

  it("provides realistic transatlantic market pricing for valid Florida hubs", () => {
    const tpa = getMockFares({
      origin: "TPA",
      destination: "ZRH",
      dateFrom: "2026-11-09",
      dateTo: "2026-11-16",
      currency: "USD",
    });
    const mco = getMockFares({
      origin: "MCO",
      destination: "ZRH",
      dateFrom: "2026-11-09",
      dateTo: "2026-11-16",
      currency: "USD",
    });
    const mia = getMockFares({
      origin: "MIA",
      destination: "ZRH",
      dateFrom: "2026-11-09",
      dateTo: "2026-11-16",
      currency: "USD",
    });

    expect(tpa.length).toBe(1);
    expect(mco.length).toBe(1);
    expect(mia.length).toBe(1);

    // Realistic prices: Miami nonstop ~$490, Orlando direct ~$540, Tampa connecting ~$790
    expect(mia[0].price).toBeGreaterThanOrEqual(450);
    expect(mco[0].price).toBeGreaterThanOrEqual(500);
    expect(tpa[0].price).toBeGreaterThan(mco[0].price);

    // Deep links must use DDMM and include marker
    expect(tpa[0].bookingUrl).toContain("TPA0911ZRH16111");
    expect(tpa[0].bookingUrl).toContain("marker=708226");
  });

  it("handles one-way queries properly in mock provider without returnAt", () => {
    const tpaOneWay = getMockFares({
      origin: "TPA",
      destination: "ZRH",
      dateFrom: "2026-11-09",
      tripType: "oneway",
      currency: "USD",
    });

    expect(tpaOneWay.length).toBe(1);
    expect(tpaOneWay[0].returnAt).toBeUndefined();
    expect(tpaOneWay[0].bookingUrl).toContain("TPA0911ZRH1");
    expect(tpaOneWay[0].bookingUrl).not.toContain("1611");
  });

  it("finds nearby Florida airports within 150 miles of Tampa", () => {
    const airports = loadAirports();
    const tpa = findAirport("TPA", airports);
    expect(tpa).toBeDefined();

    if (tpa) {
      const candidates = getAirportsInRadius(tpa, airports, 150);
      const iatas = candidates.map((c) => c.iata);
      expect(iatas).toContain("PIE");
      expect(iatas).toContain("SRQ");
      expect(iatas).toContain("MCO");
      expect(iatas).toContain("SFB");
    }
  });

  it("finds nearby Florida airports within 200 miles of Orlando", () => {
    const airports = loadAirports();
    const mco = findAirport("MCO", airports);
    expect(mco).toBeDefined();

    if (mco) {
      const candidates = getAirportsInRadius(mco, airports, 200);
      const iatas = candidates.map((c) => c.iata);
      expect(iatas).toContain("SFB");
      expect(iatas).toContain("TPA");
      expect(iatas).toContain("DAB");
      expect(iatas).toContain("PBI");
    }
  });
});

// ============================================================
// NEW: TSF (Treviso) Accuracy Tests
// ============================================================
describe("TSF (Treviso Airport) Pricing Accuracy", () => {
  it("returns a realistic round-trip fare for TSF→NRT (should be ~€670, NOT €369)", () => {
    const fares = getMockFares({
      origin: "TSF",
      destination: "NRT",
      dateFrom: "2026-11-09",
      dateTo: "2026-11-16",
      tripType: "round",
      currency: "EUR",
    });

    expect(fares.length).toBe(1);
    const price = fares[0].price;

    // Real-world Aviasales shows €878 cheapest for Venice-area → Tokyo round-trip.
    // Our benchmark for TSF→NRT is $720 USD = ~€670 EUR.
    // It should NEVER be €369 (which was the broken one-way price showing as round-trip).
    expect(price).toBeGreaterThanOrEqual(600);
    expect(price).toBeLessThanOrEqual(950);

    // The booking URL must be round-trip (with return date segment 1611)
    expect(fares[0].bookingUrl).toContain("TSF0911NRT16111");
    expect(fares[0].returnAt).toBe("2026-11-16");
  });

  it("TSF one-way to Tokyo is cheaper than round-trip (roughly 58% of RT)", () => {
    const roundTrip = getMockFares({
      origin: "TSF",
      destination: "NRT",
      dateFrom: "2026-11-09",
      dateTo: "2026-11-16",
      tripType: "round",
      currency: "EUR",
    });
    const oneWay = getMockFares({
      origin: "TSF",
      destination: "NRT",
      dateFrom: "2026-11-09",
      tripType: "oneway",
      currency: "EUR",
    });

    expect(roundTrip.length).toBe(1);
    expect(oneWay.length).toBe(1);

    // One-way should be less than round-trip
    expect(oneWay[0].price).toBeLessThan(roundTrip[0].price);

    // One-way URL must NOT have a return date
    expect(oneWay[0].bookingUrl).not.toContain("1611");
    expect(oneWay[0].bookingUrl).toContain("TSF0911NRT1");
  });

  it("TSF→NRT round-trip EUR price is in a plausible range vs MXP→NRT", () => {
    const tsf = getMockFares({
      origin: "TSF",
      destination: "NRT",
      dateFrom: "2026-11-09",
      dateTo: "2026-11-16",
      tripType: "round",
      currency: "EUR",
    });
    const mxp = getMockFares({
      origin: "MXP",
      destination: "NRT",
      dateFrom: "2026-11-09",
      dateTo: "2026-11-16",
      tripType: "round",
      currency: "EUR",
    });

    expect(tsf.length).toBe(1);
    expect(mxp.length).toBe(1);

    // TSF requires a connecting flight, so should be >= MXP (direct options)
    // but shouldn't be dramatically more expensive
    expect(tsf[0].price).toBeGreaterThanOrEqual(mxp[0].price);
    expect(tsf[0].price).toBeLessThan(mxp[0].price * 2.0);
  });
});

// ============================================================
// NEW: Currency Conversion Accuracy Tests
// ============================================================
describe("Currency Conversion Accuracy", () => {
  it("EUR prices are lower than USD prices for the same route", () => {
    const usd = getMockFares({
      origin: "TPA",
      destination: "ZRH",
      dateFrom: "2026-11-09",
      dateTo: "2026-11-16",
      tripType: "round",
      currency: "USD",
    });
    const eur = getMockFares({
      origin: "TPA",
      destination: "ZRH",
      dateFrom: "2026-11-09",
      dateTo: "2026-11-16",
      tripType: "round",
      currency: "EUR",
    });

    expect(usd.length).toBe(1);
    expect(eur.length).toBe(1);

    // EUR should be roughly 93% of USD
    expect(eur[0].price).toBeLessThan(usd[0].price);
    expect(eur[0].currency).toBe("EUR");
    expect(usd[0].currency).toBe("USD");

    // Rate should be approximately 0.93 (within 5%)
    const impliedRate = eur[0].price / usd[0].price;
    expect(impliedRate).toBeGreaterThan(0.85);
    expect(impliedRate).toBeLessThan(0.98);
  });

  it("GBP prices are lower than EUR prices", () => {
    const eur = getMockFares({
      origin: "MXP",
      destination: "NRT",
      dateFrom: "2026-11-09",
      dateTo: "2026-11-16",
      tripType: "round",
      currency: "EUR",
    });
    const gbp = getMockFares({
      origin: "MXP",
      destination: "NRT",
      dateFrom: "2026-11-09",
      dateTo: "2026-11-16",
      tripType: "round",
      currency: "GBP",
    });

    expect(gbp[0].price).toBeLessThan(eur[0].price);
    expect(gbp[0].currency).toBe("GBP");
  });

  it("intercontinental round-trip EUR fares are always above minimum thresholds per route type", () => {
    // Europe→Asia: min €500 (realistic market floor for economy connecting fares)
    // MXP→NRT can be €539, TSF→NRT ~€670 — all are above €500
    const asiaRoutes = [
      { origin: "TSF", destination: "NRT" },
      { origin: "VCE", destination: "NRT" },
      { origin: "MXP", destination: "NRT" },
      { origin: "FCO", destination: "NRT" },
      { origin: "TSF", destination: "BKK" },
    ];

    for (const { origin, destination } of asiaRoutes) {
      const fares = getMockFares({
        origin,
        destination,
        dateFrom: "2026-11-09",
        dateTo: "2026-11-16",
        tripType: "round",
        currency: "EUR",
      });

      expect(fares.length, `${origin}→${destination} should have 1 fare`).toBe(1);
      expect(
        fares[0].price,
        `${origin}→${destination} Europe→Asia round-trip should be ≥€500, got €${fares[0].price}`
      ).toBeGreaterThanOrEqual(500);
    }

    // Europe→US: min €280 (competitive transatlantic market; MXP→JFK can be ~€316)
    const usRoutes = [
      { origin: "MXP", destination: "JFK" },
      { origin: "TSF", destination: "JFK" },
    ];

    for (const { origin, destination } of usRoutes) {
      const fares = getMockFares({
        origin,
        destination,
        dateFrom: "2026-11-09",
        dateTo: "2026-11-16",
        tripType: "round",
        currency: "EUR",
      });

      expect(fares.length, `${origin}→${destination} should have 1 fare`).toBe(1);
      expect(
        fares[0].price,
        `${origin}→${destination} Europe→US round-trip should be ≥€280, got €${fares[0].price}`
      ).toBeGreaterThanOrEqual(280);
    }
  });

  it("round-trip price is always greater than one-way price for same route", () => {
    const testRoutes = [
      { origin: "TSF", destination: "NRT" },
      { origin: "MXP", destination: "NRT" },
      { origin: "FCO", destination: "JFK" },
      { origin: "TPA", destination: "ZRH" },
    ];

    for (const { origin, destination } of testRoutes) {
      const rt = getMockFares({
        origin, destination,
        dateFrom: "2026-11-09", dateTo: "2026-11-16",
        tripType: "round", currency: "EUR",
      });
      const ow = getMockFares({
        origin, destination,
        dateFrom: "2026-11-09",
        tripType: "oneway", currency: "EUR",
      });

      expect(rt.length).toBe(1);
      expect(ow.length).toBe(1);

      expect(
        rt[0].price,
        `${origin}→${destination}: round-trip (€${rt[0].price}) must be > one-way (€${ow[0].price})`
      ).toBeGreaterThan(ow[0].price);
    }
  });

});

// ============================================================
// NEW: Ground Transfer Data Tests (corridors.json validation)
// ============================================================
describe("Ground Transfer Data Integrity", () => {
  it("corridors.json is valid JSON (no JS-style comments)", async () => {
    // This test catches the corridors.json bug where // comments break JSON.parse
    const { CorridorProvider } = await import("@/lib/ground/corridor");
    const provider = new CorridorProvider();

    // Venice→TSF should be in the corridors table
    const leg = await provider.getLeg("Venice", "TSF");
    expect(leg).not.toBeNull();

    if (leg) {
      expect(leg.price).toBeGreaterThan(0);
      expect(leg.duration).toBeGreaterThan(0);
      expect(leg.source).toBe("Real fare");
    }
  });

  it("Rome→FCO corridor returns train data (not estimate)", async () => {
    const { CorridorProvider } = await import("@/lib/ground/corridor");
    const provider = new CorridorProvider();
    const leg = await provider.getLeg("Rome", "FCO");

    expect(leg).not.toBeNull();
    if (leg) {
      expect(leg.mode).toBe("train");
      expect(leg.price).toBe(8);
      expect(leg.duration).toBe(0.55);
      expect(leg.currency).toBe("EUR");
      expect(leg.source).toBe("Real fare");
    }
  });

  it("Venice→TSF corridor returns bus data (not estimate)", async () => {
    const { CorridorProvider } = await import("@/lib/ground/corridor");
    const provider = new CorridorProvider();
    const leg = await provider.getLeg("Venice", "TSF");

    expect(leg).not.toBeNull();
    if (leg) {
      expect(leg.mode).toBe("bus");
      expect(leg.price).toBe(8);
      expect(leg.currency).toBe("EUR");
    }
  });

  it("returns null for unknown corridors (falls through to estimate)", async () => {
    const { CorridorProvider } = await import("@/lib/ground/corridor");
    const provider = new CorridorProvider();
    const leg = await provider.getLeg("NonExistentCity", "XXX");
    expect(leg).toBeNull();
  });
});
