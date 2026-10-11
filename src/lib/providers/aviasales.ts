/**
 * AviasalesProvider — wraps the Travelpayouts Flight Data APIs
 * 
 * Official docs:
 * - Data API: https://support.travelpayouts.com/hc/en-us/articles/203956163-Aviasales-Data-API
 * - Real-Time Search: https://support.travelpayouts.com/hc/en-us/articles/30565016140434
 * 
 * Primary Endpoint: https://api.travelpayouts.com/aviasales/v3/prices_for_dates
 * Fallback Endpoint: https://api.travelpayouts.com/v2/prices/latest
 * Auth: token in X-Access-Token header
 * Marker: Travelpayouts Partner ID (708226) attached to booking links
 */

import { z } from "zod";
import type { Fare } from "@/types";
import type { FareProvider, FareParams } from "./types";
import { readCache, writeCache, formatCacheDate } from "../cache";
import { buildAviasalesSearchUrl } from "../aviasales-url";

const DEFAULT_MARKER = "708226";

// Metro area mapping: maps airport IATAs to metro codes to maximize Aviasales cache hits
const METRO_CODES: Record<string, string> = {
  JFK: "NYC",
  EWR: "NYC",
  LGA: "NYC",
  HND: "TYO",
  NRT: "TYO",
  CDG: "PAR",
  ORY: "PAR",
  MXP: "MIL",
  LIN: "MIL",
  BGY: "MIL",
  FCO: "ROM",
  CIA: "ROM",
  LHR: "LON",
  LGW: "LON",
  STN: "LON",
  LTN: "LON",
  MCO: "ORL",
  SFB: "ORL",
};

// Flexible parser for Aviasales records (supports v3 prices_for_dates and v2 prices/latest)
const AviasalesRecordSchema = z.object({
  origin: z.string().optional(),
  origin_airport: z.string().optional(),
  destination: z.string().optional(),
  destination_airport: z.string().optional(),
  departure_at: z.string().optional(),
  depart_date: z.string().optional(),
  return_at: z.string().optional().nullable(),
  return_date: z.string().optional().nullable(),
  price: z.number().optional(),
  value: z.number().optional(),
  transfers: z.number().optional(),
  number_of_changes: z.number().optional(),
  airline: z.string().optional(),
  gate: z.string().optional(),
  duration: z.number().optional(),
  duration_to: z.number().optional(),
  duration_back: z.number().optional(),
  trip_class: z.number().optional(),
  link: z.string().optional(),
  found_at: z.string().optional(),
});

/**
 * Minimum plausible round-trip prices (EUR) by route distance category.
 * Used to detect when the Travelpayouts cached API returns a one-way price
 * for a round-trip query (which happens when only one-way data is in cache).
 *
 * A round-trip can NEVER cost less than a realistic one-way for the same route.
 * If we see a price below this threshold for a round-trip query, we discard it.
 */
const ROUND_TRIP_MIN_EUR: Record<string, number> = {
  INTRA_EU: 40,      // e.g. Italy → Germany, Italy → Spain short-haul
  MEDIUM: 120,       // e.g. Europe → Turkey, Europe → North Africa
  LONG_HAUL: 400,    // e.g. Europe → Asia, Europe → North America
};

// Destinations requiring long-haul minimum pricing for round-trip sanity checks
const LONG_HAUL_DESTINATIONS = new Set([
  "NRT", "HND", "KIX", "ICN", "HKG", "SIN", "BKK", "DMK",
  "DXB", "AUH", "DOH", "BOM", "DEL", "PEK", "PVG",
  "JFK", "EWR", "LGA", "LAX", "SFO", "ORD", "ATL", "BOS", "MIA",
  "GRU", "EZE", "BOG", "LIM", "SCL",
  "SYD", "MEL", "AKL", "CPT", "NBO", "ADD",
]);

export class AviasalesProvider implements FareProvider {
  readonly name = "Aviasales";

  async getFares(params: FareParams): Promise<Fare[]> {
    const { origin, destination, dateFrom, dateTo, tripType, currency } = params;

    // 1. Try cache first with all parameters (prevents EUR/USD or round-trip/one-way contamination)
    const cached = await readCache(origin, destination, dateFrom, dateTo, tripType, currency);
    if (cached) {
      return cached.fares.map((f) => ({
        ...f,
        source: formatCacheDate(cached.fetchedAt) as Fare["source"],
      }));
    }

    const token = process.env.TRAVELPAYOUTS_TOKEN ?? "";
    const marker = process.env.TRAVELPAYOUTS_MARKER || DEFAULT_MARKER;

    if (!token) {
      console.warn("[Aviasales] No token — skipping live fetch");
      return [];
    }

    // 2. Try v3/prices_for_dates first
    let fares = await this.fetchV3Prices(params, token, marker);

    // 3. If v3 returned empty, try with metro code if applicable
    if (fares.length === 0) {
      const destMetro = METRO_CODES[destination.toUpperCase()];
      const origMetro = METRO_CODES[origin.toUpperCase()];
      if (destMetro || origMetro) {
        fares = await this.fetchV3Prices(
          {
            ...params,
            origin: origMetro ?? origin,
            destination: destMetro ?? destination,
          },
          token,
          marker
        );
      }
    }

    // 4. If still empty, fall back to v2/prices/latest (broadest cached route prices)
    if (fares.length === 0) {
      fares = await this.fetchV2Prices(params, token, marker);
    }

    // 5. Store valid results in cache
    if (fares.length > 0) {
      await writeCache(origin, destination, dateFrom, dateTo, tripType, currency, fares);
    }

    return fares;
  }

  /**
   * Travelpayouts v3/prices_for_dates endpoint
   */
  private async fetchV3Prices(
    params: FareParams,
    token: string,
    marker: string
  ): Promise<Fare[]> {
    const { origin, destination, dateFrom, dateTo, tripType, currency } = params;
    const isOneWay = tripType === "oneway" || !dateTo;

    const queryV3 = async (depDate: string, retDate?: string): Promise<Fare[]> => {
      const url = new URL("https://api.travelpayouts.com/aviasales/v3/prices_for_dates");
      url.searchParams.set("origin", origin);
      url.searchParams.set("destination", destination);
      url.searchParams.set("departure_at", depDate);
      if (!isOneWay && retDate) {
        url.searchParams.set("return_at", retDate);
      }
      url.searchParams.set("currency", currency.toLowerCase());
      url.searchParams.set("limit", "10");
      url.searchParams.set("sorting", "price");
      url.searchParams.set("unique", "false");
      url.searchParams.set("one_way", isOneWay ? "true" : "false");

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);

        const res = await fetch(url.toString(), {
          headers: { "X-Access-Token": token },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          return [];
        }

        const json = await res.json();
        if (!json || !Array.isArray(json.data)) {
          return [];
        }

        const fetchedAt = new Date().toISOString();
        const responseCurrency = json.currency?.toUpperCase() || currency.toUpperCase();

        const results: Fare[] = [];
        for (const item of json.data) {
          const parsed = AviasalesRecordSchema.safeParse(item);
          if (!parsed.success) continue;

          const record = parsed.data;
          const price = record.price ?? record.value;
          if (!price || price <= 0) continue;

          // For round-trip queries: reject records with no return date (one-way records)
          if (!isOneWay && !record.return_at && !record.return_date) {
            continue;
          }

          // Sanity check: Travelpayouts cached API sometimes returns a one-way price
          // for a round-trip query. Reject prices that are implausibly cheap for a round-trip.
          if (!isOneWay) {
            const destUpper = (record.destination_airport ?? record.destination ?? destination).toUpperCase();
            const isLongHaul = LONG_HAUL_DESTINATIONS.has(destUpper);
            const minPrice = isLongHaul
              ? ROUND_TRIP_MIN_EUR.LONG_HAUL
              : ROUND_TRIP_MIN_EUR.INTRA_EU;
            const minInCurrency = responseCurrency === "USD" ? minPrice * 1.08 : responseCurrency === "GBP" ? minPrice * 0.85 : minPrice;
            if (price < minInCurrency) {
              continue;
            }
          }

          const departDate = (record.departure_at ?? record.depart_date ?? dateFrom).slice(0, 10);
          const flightReturn = !isOneWay
            ? (record.return_at ?? record.return_date ?? dateTo)
            : undefined;
          const flightReturnStr = flightReturn ? flightReturn.slice(0, 10) : undefined;

          const flightOrigin = record.origin_airport ?? record.origin ?? origin;
          const flightDest = record.destination_airport ?? record.destination ?? destination;

          const bookingUrl = buildAviasalesSearchUrl({
            origin: flightOrigin,
            destination: flightDest,
            dateFrom: dateFrom || departDate,
            dateTo: isOneWay ? undefined : (dateTo || flightReturnStr),
            tripType: isOneWay ? "oneway" : "round",
            passengers: params.passengers || 1,
            marker,
          });

          results.push({
            provider: "Aviasales",
            origin: flightOrigin,
            destination: flightDest,
            departAt: dateFrom || departDate,
            returnAt: isOneWay ? undefined : (dateTo || flightReturnStr),
            price,
            currency: responseCurrency,
            includesBags: false,
            fetchedAt,
            source: "Live" as const,
            bookingUrl,
          });
        }

        return results;
      } catch {
        return [];
      }
    };

    // 1. First attempt: Query with exact dates (e.g. 2026-11-09 to 2026-11-16)
    if (dateFrom) {
      const exactResults = await queryV3(
        dateFrom,
        !isOneWay && dateTo ? dateTo : undefined
      );
      if (exactResults.length > 0) {
        return exactResults;
      }
    }

    // 2. Second attempt: Month-level flexible cache query (e.g. 2026-11)
    if (dateFrom) {
      const monthFrom = dateFrom.slice(0, 7);
      const monthTo = !isOneWay && dateTo ? dateTo.slice(0, 7) : undefined;
      const monthResults = await queryV3(monthFrom, monthTo);
      if (monthResults.length > 0) {
        return monthResults;
      }
    }

    return [];
  }

  /**
   * Travelpayouts v2/prices/latest endpoint fallback
   */
  private async fetchV2Prices(
    params: FareParams,
    token: string,
    marker: string
  ): Promise<Fare[]> {
    const { origin, destination, dateFrom, dateTo, tripType, currency } = params;
    const isOneWay = tripType === "oneway" || !dateTo;

    const url = new URL("https://api.travelpayouts.com/v2/prices/latest");
    url.searchParams.set("origin", origin);
    url.searchParams.set("destination", destination);
    url.searchParams.set("currency", currency.toLowerCase());
    url.searchParams.set("limit", "10");
    url.searchParams.set("sorting", "price");

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(url.toString(), {
        headers: { "X-Access-Token": token },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) return [];

      const json = await res.json();
      if (!json || !Array.isArray(json.data)) return [];

      const fetchedAt = new Date().toISOString();
      const responseCurrency = json.currency?.toUpperCase() || currency.toUpperCase();

      return json.data
        .map((item: unknown) => {
          const parsed = AviasalesRecordSchema.safeParse(item);
          if (!parsed.success) return null;
          const r = parsed.data;
          const price = r.price ?? r.value;
          if (!price || price <= 0) return null;

          // For round-trip, skip items without a return date
          if (!isOneWay && !r.return_date && !r.return_at) {
            return null;
          }

          const departDate = (r.depart_date ?? r.departure_at ?? dateFrom).slice(0, 10);
          // Reject records for completely different months
          if (dateFrom && departDate.slice(0, 7) !== dateFrom.slice(0, 7)) {
            return null;
          }

          // Sanity check
          if (!isOneWay) {
            const destUpper = (r.destination_airport ?? r.destination ?? destination).toUpperCase();
            const isLongHaul = LONG_HAUL_DESTINATIONS.has(destUpper);
            const minPrice = isLongHaul
              ? ROUND_TRIP_MIN_EUR.LONG_HAUL
              : ROUND_TRIP_MIN_EUR.INTRA_EU;
            const minInCurrency = responseCurrency === "USD" ? minPrice * 1.08 : responseCurrency === "GBP" ? minPrice * 0.85 : minPrice;
            if (price < minInCurrency) {
              return null;
            }
          }

          const flightOrigin = r.origin ?? origin;
          const flightDest = r.destination ?? destination;
          const returnDateVal = isOneWay
            ? undefined
            : (dateTo || (r.return_date ? r.return_date.slice(0, 10) : undefined));

          const bookingUrl = buildAviasalesSearchUrl({
            origin: flightOrigin,
            destination: flightDest,
            dateFrom: dateFrom || departDate,
            dateTo: returnDateVal,
            tripType: isOneWay ? "oneway" : "round",
            passengers: params.passengers || 1,
            marker,
          });

          return {
            provider: "Aviasales",
            origin: flightOrigin,
            destination: flightDest,
            departAt: dateFrom || departDate,
            returnAt: returnDateVal,
            price,
            currency: responseCurrency,
            includesBags: false,
            fetchedAt,
            source: "Live" as const,
            bookingUrl,
          };
        })
        .filter((f: Fare | null): f is Fare => f !== null);
    } catch {
      return [];
    }
  }
}
