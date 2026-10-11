import { describe, it, expect } from "vitest";
import { searchAirportsClient, getAirportByIata } from "@/lib/airport-data";
import { loadAirports, findAirport, getAirportsInRadius, haversinemiles } from "@/lib/airports";

describe("Airport data & search helpers", () => {
  it("finds airport by exact IATA code", () => {
    const fco = getAirportByIata("FCO");
    expect(fco).toBeDefined();
    expect(fco?.city).toBe("Rome");

    const jfk = getAirportByIata("jfk");
    expect(jfk).toBeDefined();
    expect(jfk?.iata).toBe("JFK");

    const tpa = getAirportByIata("TPA");
    expect(tpa).toBeDefined();
    expect(tpa?.city).toBe("Tampa");

    const mco = getAirportByIata("MCO");
    expect(mco).toBeDefined();
    expect(mco?.city).toBe("Orlando");
  });

  it("searches airports by city name", () => {
    const results = searchAirportsClient("London");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((a) => a.iata === "LHR")).toBe(true);
  });

  it("searches airports by partial code or country", () => {
    const results = searchAirportsClient("tokyo");
    expect(results.some((a) => a.iata === "NRT" || a.iata === "HND")).toBe(true);
  });

  it("returns popular destinations when query is empty", () => {
    const results = searchAirportsClient("");
    expect(results.length).toBeGreaterThan(0);
    expect(results.map((a) => a.iata)).toEqual(
      expect.arrayContaining(["CDG", "FRA", "FCO", "ZRH", "JFK"])
    );
    // Should not dump the Italy-first fallback slice
    expect(results[0]?.iata).not.toBe("FCO");
    expect(results.some((a) => a.iata === "CIA")).toBe(false);
  });

  it("excludes non-commercial/domestic airfields (UST, PGD, LAL) for long-haul routes", () => {
    const airports = loadAirports();
    const home = findAirport("TPA", airports)!;
    const dest = findAirport("ZRH", airports)!;

    const routeDistance = haversinemiles(home.lat, home.lon, dest.lat, dest.lon);
    const isIntercontinental = routeDistance > 1500;
    expect(isIntercontinental).toBe(true);

    const NON_COMMERCIAL = new Set(["UST", "PGD", "LAL", "VRB", "OPF", "DSI", "VLD", "BQK", "ABY", "GNV"]);
    const rawCandidates = getAirportsInRadius(home, airports, 300);

    const viableCandidates = isIntercontinental
      ? rawCandidates.filter((a) => a.type === "large_airport" && !NON_COMMERCIAL.has(a.iata))
      : rawCandidates.filter((a) => !NON_COMMERCIAL.has(a.iata));

    const iatas = viableCandidates.map((c) => c.iata);

    // Commercial gateways must be present
    expect(iatas).toContain("MCO");
    expect(iatas).toContain("MIA");
    expect(iatas).toContain("FLL");
    expect(iatas).toContain("RSW");

    // Non-transatlantic airfields must NOT be present
    expect(iatas).not.toContain("UST");
    expect(iatas).not.toContain("PGD");
    expect(iatas).not.toContain("LAL");
    expect(iatas).not.toContain("VRB");
    expect(iatas).not.toContain("OPF");
  });
});
