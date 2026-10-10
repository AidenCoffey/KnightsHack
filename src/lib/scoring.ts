import type { Fare, GroundLeg, ScoredOrigin, Airport } from "@/types";

export interface ScoreInputs {
  fare: number;
  groundCost: number;
  groundHours: number;
  timeValuePerHour: number;
}

export function computeTotalCost(inputs: ScoreInputs): number {
  const { fare, groundCost, groundHours, timeValuePerHour } = inputs;
  const timeCost = groundHours * timeValuePerHour;
  return fare + groundCost + timeCost;
}

export function computeBreakdown(inputs: ScoreInputs): {
  fare: number;
  groundCost: number;
  timeCost: number;
  total: number;
} {
  const timeCost = inputs.groundHours * inputs.timeValuePerHour;
  return {
    fare: inputs.fare,
    groundCost: inputs.groundCost,
    timeCost,
    total: inputs.fare + inputs.groundCost + timeCost,
  };
}

export function scoreOrigin(
  airport: Airport,
  fare: Fare | null,
  groundLeg: GroundLeg,
  distanceMiles: number,
  timeValuePerHour: number,
  homeBaseCost: number,
  responseTimeMs: number,
  cacheHit: boolean
): ScoredOrigin {
  const fareAmount = fare?.price ?? 0;
  const inputs: ScoreInputs = {
    fare: fareAmount,
    groundCost: groundLeg.price,
    groundHours: groundLeg.duration,
    timeValuePerHour,
  };
  const breakdown = computeBreakdown(inputs);

  return {
    airport,
    fare,
    groundLeg,
    distanceMiles,
    totalCost: breakdown.total,
    breakdown: {
      fare: breakdown.fare,
      groundCost: breakdown.groundCost,
      timeCost: breakdown.timeCost,
    },
    savingsVsHome: homeBaseCost - breakdown.total,
    providerDebug: {
      provider: fare?.provider ?? "none",
      responseTimeMs,
      cacheHit,
      freshness: fare ? `Fetched ${fare.fetchedAt}` : "No data",
      formulaInputs: {
        fare: fareAmount,
        groundCost: groundLeg.price,
        groundHours: groundLeg.duration,
        timeValuePerHour,
        timeCost: breakdown.timeCost,
        total: breakdown.total,
      },
    },
  };
}

/** Format a score label for display */
export function formatSavings(savingsVsHome: number, currency: string): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  if (savingsVsHome > 0) {
    return `Save ${symbol}${Math.round(savingsVsHome)}`;
  } else if (savingsVsHome < 0) {
    return `+${symbol}${Math.round(Math.abs(savingsVsHome))} vs home`;
  }
  return "Same as home";
}

/** Color the savings for the map bubble */
export function savingsColor(savingsVsHome: number): string {
  if (savingsVsHome > 100) return "#16a34a"; // green-600
  if (savingsVsHome > 0) return "#65a30d";   // lime-600
  if (savingsVsHome > -50) return "#d97706";  // amber-600
  return "#dc2626";                            // red-600
}

export interface BreakEvenResult {
  hasBreakEven: boolean;
  breakEvenPerHour: number | null;
  message: string;
}

export function computeBreakEven(
  home: { fare: number; groundCost: number; groundHours: number },
  candidate: { fare: number; groundCost: number; groundHours: number },
  currency = "EUR"
): BreakEvenResult {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  const deltaMoney = home.fare + home.groundCost - (candidate.fare + candidate.groundCost);
  const deltaTime = candidate.groundHours - home.groundHours;

  if (Math.abs(deltaTime) < 0.05) {
    if (deltaMoney > 0) {
      return {
        hasBreakEven: false,
        breakEvenPerHour: null,
        message: `Always cheaper by ${symbol}${Math.round(deltaMoney)} (same ground time)`,
      };
    }
    return {
      hasBreakEven: false,
      breakEvenPerHour: null,
      message: `Always more expensive by ${symbol}${Math.round(Math.abs(deltaMoney))}`,
    };
  }

  if (deltaTime > 0) {
    if (deltaMoney > 0) {
      const be = deltaMoney / deltaTime;
      return {
        hasBreakEven: true,
        breakEvenPerHour: Math.round(be * 10) / 10,
        message: `Break-even at ${symbol}${Math.round(be)}/hr (cheaper if time <${symbol}${Math.round(be)}/hr)`,
      };
    }
    return {
      hasBreakEven: false,
      breakEvenPerHour: null,
      message: `More expensive & takes ${deltaTime.toFixed(1)}h longer`,
    };
  }

  // deltaTime < 0 (candidate is closer/faster)
  if (deltaMoney >= 0) {
    return {
      hasBreakEven: false,
      breakEvenPerHour: null,
      message: `Always cheaper & ${Math.abs(deltaTime).toFixed(1)}h faster`,
    };
  }

  const be = Math.abs(deltaMoney) / Math.abs(deltaTime);
  return {
    hasBreakEven: true,
    breakEvenPerHour: Math.round(be * 10) / 10,
    message: `Worth it if time >${symbol}${Math.round(be)}/hr (saves ${Math.abs(deltaTime).toFixed(1)}h)`,
  };
}
