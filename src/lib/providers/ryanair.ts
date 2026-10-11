/**
 * RyanairProvider — uses Ryanair's unofficial fare-finder API.
 *
 * ⚠️  PROTOTYPE ONLY. This uses an unofficial, undocumented endpoint.
 * It may violate Ryanair's Terms of Service. Use only for hackathon demo.
 * Do NOT deploy commercially without proper licensing.
 *
 * Endpoint observed via browser DevTools:
 * https://www.ryanair.com/api/farfnd/v4/oneWayFares
 * (no auth required for basic queries)
 */

import { z } from "zod";
import type { Fare } from "@/types";
import type { FareProvider, FareParams } from "./types";
import { readCache, writeCache, formatCacheDate } from "../cache";

// Zod schema for Ryanair fare response
// NOTE: Field names inspected from real responses — may change without notice
const RyanairFareSchema = z.object({
  outbound: z.object({
    departureAirport: z.object({ iataCode: z.string() }),
    arrivalAirport: z.object({ iataCode: z.string() }),
    departureDate: z.string(),
    price: z.object({
      value: z.number(),
      currencyCode: z.string(),
    }),
  }),
});

const RyanairResponseSchema = z.object({
  fares: z.array(RyanairFareSchema).optional().default([]),
});

export class RyanairProvider implements FareProvider {
  readonly name = "Ryanair";

  async getFares(params: FareParams): Promise<Fare[]> {
    const { origin, destination, dateFrom, dateTo } = params;

    // Try cache first
    const cached = await readCache(`ry-${origin}`, destination, dateFrom);
    if (cached) {
      return cached.fares.map((f) => ({
        ...f,
        source: formatCacheDate(cached.fetchedAt) as Fare["source"],
      }));
    }

    const url = new URL("https://www.ryanair.com/api/farfnd/v4/oneWayFares");
    url.searchParams.set("departureAirportIataCode", origin);
    url.searchParams.set("arrivalAirportIataCode", destination);
    url.searchParams.set("outboundDepartureDateFrom", dateFrom);
    url.searchParams.set("outboundDepartureDateTo", dateTo || dateFrom);
    url.searchParams.set("language", "en");
    url.searchParams.set("market", "en-gb");
    url.searchParams.set("offset", "0");
    url.searchParams.set("limit", "5");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(url.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; FlightDeck/1.0; hackathon demo)",
          Accept: "application/json",
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Ryanair HTTP ${res.status}`);
      }

      const raw = await res.json();
      const parsed = RyanairResponseSchema.safeParse(raw);

      if (!parsed.success) {
        console.error("[Ryanair] Schema mismatch:", parsed.error.flatten());
        return [];
      }

      const fetchedAt = new Date().toISOString();
      const fares: Fare[] = parsed.data.fares
        .map((f) => ({
          provider: "Ryanair",
          origin: f.outbound.departureAirport.iataCode,
          destination: f.outbound.arrivalAirport.iataCode,
          departAt: f.outbound.departureDate,
          price: f.outbound.price.value,
          currency: f.outbound.price.currencyCode,
          includesBags: false,
          fetchedAt,
          source: "Live" as const,
        }))
        .filter((f) => f.price > 0);

      if (fares.length > 0) {
        await writeCache(`ry-${origin}`, destination, dateFrom, fares);
      }
      return fares;
    } catch (err) {
      clearTimeout(timeout);
      console.error("[Ryanair] Fetch failed:", err);
      // Fall back to stale cache
      const stale = await readCache(`ry-${origin}`, destination, dateFrom);
      if (stale) {
        return stale.fares.map((f) => ({
          ...f,
          source: formatCacheDate(stale.fetchedAt) as Fare["source"],
        }));
      }
      return [];
    }
  }
}
