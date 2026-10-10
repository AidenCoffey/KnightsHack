// Shared TypeScript types for FlightDeck

export type DistanceUnit = "miles" | "km";

export interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  type: "large_airport" | "medium_airport" | "small_airport";
}

export type FareSource = "Live" | "Recent (cached)" | `Last seen ${string}`;

export interface Fare {
  provider: string;
  origin: string;
  destination: string;
  departAt: string; // ISO date string
  returnAt?: string;
  price: number;
  currency: string;
  includesBags: boolean;
  fetchedAt: string; // ISO datetime
  source: FareSource;
  bookingUrl?: string;
}

export type GroundMode = "drive" | "train" | "bus" | "taxi";
export type GroundSource = "Real fare" | "Estimate";

export interface GroundLeg {
  fromCity: string;
  toAirport: string;
  price: number;
  duration: number; // hours
  mode: GroundMode;
  currency: string;
  source: GroundSource;
  captureDate?: string;
}

export interface ScoredOrigin {
  airport: Airport;
  fare: Fare | null;
  groundLeg: GroundLeg;
  distanceMiles: number;
  totalCost: number;
  breakdown: {
    fare: number;
    groundCost: number;
    timeCost: number;
  };
  savingsVsHome: number; // negative = costs more than flying from home
  providerDebug: ProviderDebug;
}

export interface ProviderDebug {
  provider: string;
  responseTimeMs: number;
  cacheHit: boolean;
  freshness: string;
  formulaInputs: {
    fare: number;
    groundCost: number;
    groundHours: number;
    timeValuePerHour: number;
    timeCost: number;
    total: number;
  };
}

export interface SearchParams {
  destination: string; // IATA
  homeAirport: string; // IATA
  dateFrom: string; // YYYY-MM-DD
  dateTo: string; // YYYY-MM-DD
  radiusMiles: number;
  timeValuePerHour: number;
  currency: string;
}

// NDJSON stream event types
export type StreamEvent =
  | { type: "progress"; checked: number; total: number }
  | { type: "result"; data: ScoredOrigin }
  | { type: "error"; originIata: string; message: string }
  | { type: "done"; total: number };

export * from "./cultural";

