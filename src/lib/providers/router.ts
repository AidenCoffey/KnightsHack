/**
 * Provider router: selects the best fare provider per route.
 * 
 * Rules:
 * - Europe-to-Europe: try Ryanair first (live), fall back to Aviasales (cached)
 * - Everything else: Aviasales only
 */

import type { Fare } from "@/types";
import type { FareProvider, FareParams } from "./types";
import { AviasalesProvider } from "./aviasales";
import { RyanairProvider } from "./ryanair";

const EUROPEAN_COUNTRIES = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE",
  "IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
  "NO","CH","IS","GB","AL","BA","MK","ME","RS","XK","MD","UA","BY",
  "TR","AM","GE","AZ","AD","LI","MC","SM","VA",
]);

// Map IATA to country code using the airports data
// We pass in country directly from the airport object
function isEuropean(countryCode: string): boolean {
  return EUROPEAN_COUNTRIES.has(countryCode.toUpperCase());
}

const aviasales = new AviasalesProvider();
const ryanair = new RyanairProvider();

export async function getFaresForRoute(
  params: FareParams,
  originCountry: string,
  destinationCountry: string
): Promise<{ fares: Fare[]; providerUsed: string }> {
  const bothEuropean = isEuropean(originCountry) && isEuropean(destinationCountry);

  if (bothEuropean) {
    // Try Ryanair first
    try {
      const fares = await ryanair.getFares(params);
      if (fares.length > 0) {
        return { fares, providerUsed: "Ryanair" };
      }
    } catch {
      // fall through to Aviasales
    }
  }

  // Aviasales for all routes
  const fares = await aviasales.getFares(params);
  return { fares, providerUsed: "Aviasales" };
}
