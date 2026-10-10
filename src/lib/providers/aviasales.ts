/**
 * AviasalesProvider — wraps the Travelpayouts Flight Price API
 * 
 * Official docs: https://support.travelpayouts.com/hc/en-us/articles/203956163
 * Endpoint: https://api.travelpayouts.com/aviasales/v3/prices_for_dates
 * Auth: token in X-Access-Token header
 * Rate limit: 600 req/min — we use p-limit(5) to stay well below
 * 
 * Results are labeled "Recent (cached)" per Aviasales data contract.
 */

import { z } from "zod";
import type { Fare } from "@/types";
import type { FareProvider, FareParams } from "./types";
import { readCache, writeCache, formatCacheDate } from "../cache";

const TOKEN = process.env.TRAVELPAYOUTS_TOKEN ?? "";

// Zod schema for a single Aviasales price record
const AviasalesPriceSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  depart_date: z.string(),
  return_date: z.string().optional().nullable(),
  number_of_changes: z.number(),
  value: z.number(),
  found_at: z.string(),
  currency: z.string().optional(),
});

const AviasalesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(AviasalesPriceSchema),
  currency: z.string().optional(),
});

export class AviasalesProvider implements FareProvider {
  readonly name = "Aviasales";

  async getFares(params: FareParams): Promise<Fare[]> {
    const { origin, destination, dateFrom, dateTo, currency } = params;

    // Try cache first
    const cached = await readCache(origin, destination, dateFrom);
    if (cached) {
      return cached.fares.map((f) => ({
        ...f,
        source: formatCacheDate(cached.fetchedAt) as Fare["source"],
      }));
    }

    const token = process.env.TRAVELPAYOUTS_TOKEN || TOKEN;

    if (!token) {
      console.warn("[Aviasales] No token — skipping live fetch");
      return [];
    }

    const url = new URL("https://api.travelpayouts.com/aviasales/v3/prices_for_dates");
    url.searchParams.set("origin", origin);
    url.searchParams.set("destination", destination);
    url.searchParams.set("departure_at", dateFrom);
    url.searchParams.set("return_at", dateTo);
    url.searchParams.set("currency", currency.toLowerCase());
    url.searchParams.set("limit", "5");
    url.searchParams.set("sorting", "price");
    url.searchParams.set("unique", "false");
    url.searchParams.set("one_way", "true");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let attempt = 0;
    while (attempt < 2) {
      try {
        const res = await fetch(url.toString(), {
          headers: { "X-Access-Token": token },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          throw new Error(`Aviasales HTTP ${res.status}`);
        }

        const raw = await res.json();
        const parsed = AviasalesResponseSchema.safeParse(raw);

        if (!parsed.success) {
          console.error("[Aviasales] Schema mismatch:", parsed.error.flatten());
          return [];
        }

        const fetchedAt = new Date().toISOString();
        const priceArray = parsed.data.data;
        const responseCurrency = parsed.data.currency ?? currency;
        const fares: Fare[] = priceArray
          .filter((p) => p.value > 0)
          .map((p) => ({
            provider: "Aviasales",
            origin: p.origin,
            destination: p.destination,
            departAt: p.depart_date,
            returnAt: p.return_date ?? undefined,
            price: p.value,
            currency: responseCurrency,
            includesBags: false,
            fetchedAt,
            source: "Recent (cached)" as const,
          }));

        await writeCache(origin, destination, dateFrom, fares);
        return fares;
      } catch (err) {
        attempt++;
        if (attempt >= 2) {
          console.error("[Aviasales] Failed after retry:", err);
          return [];
        }
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    return [];
  }
}
