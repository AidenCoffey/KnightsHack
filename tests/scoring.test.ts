import { describe, it, expect } from "vitest";
import { computeTotalCost, computeBreakdown, formatSavings, savingsColor, computeBreakEven } from "@/lib/scoring";

describe("computeTotalCost", () => {
  it("sums fare + ground + time cost", () => {
    const total = computeTotalCost({
      fare: 100,
      groundCost: 15,
      groundHours: 2,
      timeValuePerHour: 20,
    });
    // 100 + 15 + (2 * 20) = 155
    expect(total).toBe(155);
  });

  it("with zero time value, total = fare + ground", () => {
    const total = computeTotalCost({
      fare: 89,
      groundCost: 10,
      groundHours: 1.5,
      timeValuePerHour: 0,
    });
    expect(total).toBe(99);
  });

  it("with zero ground cost and time, total = fare", () => {
    const total = computeTotalCost({
      fare: 150,
      groundCost: 0,
      groundHours: 0,
      timeValuePerHour: 50,
    });
    expect(total).toBe(150);
  });
});

describe("computeBreakdown", () => {
  it("correctly splits components", () => {
    const breakdown = computeBreakdown({
      fare: 80,
      groundCost: 12,
      groundHours: 1,
      timeValuePerHour: 15,
    });
    expect(breakdown.fare).toBe(80);
    expect(breakdown.groundCost).toBe(12);
    expect(breakdown.timeCost).toBe(15);
    expect(breakdown.total).toBe(107);
  });
});

describe("formatSavings", () => {
  it("shows savings for positive values", () => {
    expect(formatSavings(50, "EUR")).toContain("Save");
    expect(formatSavings(50, "EUR")).toContain("€50");
  });

  it("shows overage for negative values", () => {
    expect(formatSavings(-30, "EUR")).toContain("+€30");
    expect(formatSavings(-30, "EUR")).toContain("vs home");
  });

  it("shows same for near-zero", () => {
    expect(formatSavings(0, "EUR")).toBe("Same as home");
  });
});

describe("savingsColor", () => {
  it("green for high savings", () => {
    expect(savingsColor(150)).toBe("#16a34a");
  });

  it("red for large loss", () => {
    expect(savingsColor(-100)).toBe("#dc2626");
  });

  it("amber for small loss", () => {
    expect(savingsColor(-30)).toBe("#d97706");
  });
});

describe("computeBreakEven", () => {
  it("computes break-even rate when candidate saves fare but takes longer", () => {
    // Home: €150 fare, €10 ground, 0.5h
    // Candidate: €70 fare, €20 ground, 2.5h
    // deltaMoney = 160 - 90 = 70
    // deltaTime = 2.5 - 0.5 = 2.0h
    // breakEven = 70 / 2 = €35/hr
    const be = computeBreakEven(
      { fare: 150, groundCost: 10, groundHours: 0.5 },
      { fare: 70, groundCost: 20, groundHours: 2.5 },
      "EUR"
    );
    expect(be.hasBreakEven).toBe(true);
    expect(be.breakEvenPerHour).toBe(35);
    expect(be.message).toContain("€35/hr");
  });

  it("handles strictly more expensive and slower trips", () => {
    const be = computeBreakEven(
      { fare: 100, groundCost: 10, groundHours: 0.5 },
      { fare: 150, groundCost: 20, groundHours: 2.0 },
      "EUR"
    );
    expect(be.hasBreakEven).toBe(false);
    expect(be.message).toContain("More expensive");
  });

  it("handles identical travel time with savings", () => {
    const be = computeBreakEven(
      { fare: 150, groundCost: 10, groundHours: 0.5 },
      { fare: 100, groundCost: 10, groundHours: 0.5 },
      "EUR"
    );
    expect(be.hasBreakEven).toBe(false);
    expect(be.message).toContain("Always cheaper");
  });
});
