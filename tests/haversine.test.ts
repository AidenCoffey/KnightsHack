import { describe, it, expect } from "vitest";
import { haversinemiles, milesToKm, kmToMiles } from "@/lib/airports";

describe("haversinemiles", () => {
  it("returns 0 for same point", () => {
    expect(haversinemiles(51.5, -0.1, 51.5, -0.1)).toBe(0);
  });

  it("London to Paris is approximately 213 miles", () => {
    // London LHR: 51.4775, -0.4614
    // Paris CDG: 49.0097, 2.5479
    const dist = haversinemiles(51.4775, -0.4614, 49.0097, 2.5479);
    expect(dist).toBeGreaterThan(200);
    expect(dist).toBeLessThan(225);
  });

  it("Rome FCO to Milan MXP is approximately 317 miles", () => {
    // FCO: 41.8003, 12.2389
    // MXP: 45.6306, 8.7281
    const dist = haversinemiles(41.8003, 12.2389, 45.6306, 8.7281);
    expect(dist).toBeGreaterThan(300);
    expect(dist).toBeLessThan(340);
  });

  it("FCO to itself is 0", () => {
    expect(haversinemiles(41.8003, 12.2389, 41.8003, 12.2389)).toBe(0);
  });

  it("is symmetric", () => {
    const a = haversinemiles(41.8003, 12.2389, 45.6306, 8.7281);
    const b = haversinemiles(45.6306, 8.7281, 41.8003, 12.2389);
    expect(Math.abs(a - b)).toBeLessThan(0.001);
  });
});

describe("unit conversion", () => {
  it("1 mile = 1.60934 km", () => {
    expect(milesToKm(1)).toBeCloseTo(1.60934, 4);
  });

  it("round-trip conversion is stable", () => {
    const original = 213.5;
    expect(kmToMiles(milesToKm(original))).toBeCloseTo(original, 4);
  });
});
