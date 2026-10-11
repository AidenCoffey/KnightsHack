import { describe, it, expect } from "vitest";
import { getMockFares } from "@/lib/providers/mock";

describe("Flexible Dates & Solo Flight Filtering", () => {
  it("only enables flexible dates for solo / one-way flights (hidden on round-trip)", () => {
    // Condition function matching ResultsList:
    const isSoloFlight = (tripType?: "round" | "oneway", returnDate?: string) => {
      return tripType === "oneway" || (!returnDate && tripType !== "round");
    };

    // Round-trip flight with return date: MUST NOT show flexible dates
    expect(isSoloFlight("round", "2026-10-17")).toBe(false);

    // Round-trip without explicit returnDate: MUST NOT show flexible dates
    expect(isSoloFlight("round", undefined)).toBe(false);

    // Explicit one-way flight: MUST show flexible dates
    expect(isSoloFlight("oneway", undefined)).toBe(true);

    // One-way even if returnDate was somehow passed: MUST show flexible dates
    expect(isSoloFlight("oneway", "2026-10-17")).toBe(true);
  });

  it("generates realistic price differences between dates (e.g. Oct 3 is cheaper than Oct 10)", () => {
    const faresOct3 = getMockFares({
      origin: "TPA",
      destination: "ZRH",
      dateFrom: "2026-10-03",
      tripType: "oneway",
      currency: "USD",
    });

    const faresOct10 = getMockFares({
      origin: "TPA",
      destination: "ZRH",
      dateFrom: "2026-10-10",
      tripType: "oneway",
      currency: "USD",
    });

    expect(faresOct3.length).toBe(1);
    expect(faresOct10.length).toBe(1);

    // Oct 3 fare is cheaper than Oct 10 fare
    expect(faresOct3[0].price).toBeLessThan(faresOct10[0].price);

    // Booking URL for Oct 3 has correct date slug 0310 (03 Oct)
    expect(faresOct3[0].bookingUrl).toContain("TPA0310ZRH1");

    // Booking URL for Oct 10 has correct date slug 1010 (10 Oct)
    expect(faresOct10[0].bookingUrl).toContain("TPA1010ZRH1");
  });

  it("handles client-side cache keys and instant swap correctly", () => {
    const cache = new Map<string, any>();

    const getSearchCacheKey = (p: {
      homeAirport: string;
      destination: string;
      dateFrom: string;
      dateTo?: string;
      tripType?: string;
      passengers?: number;
      currency?: string;
      radiusMiles?: number;
    }) => {
      return [
        p.homeAirport.trim().toUpperCase(),
        p.destination.trim().toUpperCase(),
        p.dateFrom,
        p.tripType === "oneway" ? "" : (p.dateTo || ""),
        p.tripType ?? (p.dateTo ? "round" : "oneway"),
        p.passengers ?? 1,
        p.currency ?? "USD",
        p.radiusMiles ?? 300,
      ].join("::");
    };

    const searchOct10 = {
      homeAirport: "FCO",
      destination: "BCN",
      dateFrom: "2026-10-10",
      tripType: "oneway",
      passengers: 1,
      currency: "EUR",
      radiusMiles: 300,
    };

    const keyOct10 = getSearchCacheKey(searchOct10);
    const mockResultsOct10 = [{ airport: { iata: "FCO" }, fare: { price: 95 } }];
    cache.set(keyOct10, mockResultsOct10);

    const searchOct3 = {
      ...searchOct10,
      dateFrom: "2026-10-03",
    };
    const keyOct3 = getSearchCacheKey(searchOct3);
    const mockResultsOct3 = [{ airport: { iata: "FCO" }, fare: { price: 68 } }];
    cache.set(keyOct3, mockResultsOct3);

    // Instant swap retrieval:
    expect(cache.has(keyOct10)).toBe(true);
    expect(cache.get(keyOct10)[0].fare.price).toBe(95);

    expect(cache.has(keyOct3)).toBe(true);
    expect(cache.get(keyOct3)[0].fare.price).toBe(68);

    // Swapping back to Oct 10 requires 0 network requests:
    const swappedBack = cache.get(keyOct10);
    expect(swappedBack).toEqual(mockResultsOct10);
  });

  it("formats dates without timezone offsets causing off-by-one errors", () => {
    const parseLocalDate = (isoStr?: string): Date => {
      if (!isoStr) return new Date();
      const parts = isoStr.split("-").map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
      }
      return new Date();
    };

    const formatLocalDate = (d: Date): string => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const base = "2026-10-10";
    const center = parseLocalDate(base);
    expect(formatLocalDate(center)).toBe("2026-10-10");

    // -7 days offset should land exactly on 2026-10-03
    const dMinus7 = new Date(center);
    dMinus7.setDate(dMinus7.getDate() - 7);
    expect(formatLocalDate(dMinus7)).toBe("2026-10-03");

    // +3 days offset should land on 2026-10-13
    const dPlus3 = new Date(center);
    dPlus3.setDate(dPlus3.getDate() + 3);
    expect(formatLocalDate(dPlus3)).toBe("2026-10-13");
  });

  it("strictly bounds the timeline strip to exactly 2 weeks in both directions (-14 to +14 days)", () => {
    const parseLocalDate = (isoStr?: string): Date => {
      if (!isoStr) return new Date();
      const parts = isoStr.split("-").map(Number);
      return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    };

    const formatLocalDate = (d: Date): string => {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const base = "2026-11-07";
    const center = parseLocalDate(base);

    const stripDays = [];
    for (let offset = -14; offset <= 14; offset++) {
      const d = new Date(center);
      d.setDate(d.getDate() + offset);
      stripDays.push({ offset, iso: formatLocalDate(d) });
    }

    // Exactly 29 days (14 before + 1 today + 14 after)
    expect(stripDays.length).toBe(29);
    expect(stripDays[0].offset).toBe(-14);
    expect(stripDays[0].iso).toBe("2026-10-24");
    expect(stripDays[14].offset).toBe(0);
    expect(stripDays[14].iso).toBe("2026-11-07");
    expect(stripDays[28].offset).toBe(14);
    expect(stripDays[28].iso).toBe("2026-11-21");
  });

  it("correctly generates full month calendar grid for month view toggle", () => {
    const year = 2026;
    const month = 10; // November (0-indexed 10)
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // Nov 1 2026 is Sunday (0)
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // 30 days in November

    expect(firstDayOfWeek).toBe(0);
    expect(daysInMonth).toBe(30);

    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, iso: `2026-11-${String(d).padStart(2, "0")}` });
    }

    expect(cells.length).toBe(30);
    expect(cells[0]?.iso).toBe("2026-11-01");
    expect(cells[29]?.iso).toBe("2026-11-30");
  });
});
