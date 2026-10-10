import { describe, it, expect } from "vitest";
import { searchAirportsClient, getAirportByIata } from "@/lib/airport-data";

describe("Airport data & search helpers", () => {
  it("finds airport by exact IATA code", () => {
    const fco = getAirportByIata("FCO");
    expect(fco).toBeDefined();
    expect(fco?.city).toBe("Rome");

    const jfk = getAirportByIata("jfk");
    expect(jfk).toBeDefined();
    expect(jfk?.iata).toBe("JFK");
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

  it("returns defaults when query is empty", () => {
    const results = searchAirportsClient("");
    expect(results.length).toBeGreaterThan(0);
  });
});
