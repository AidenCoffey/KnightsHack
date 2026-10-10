/**
 * /api/reverse — Reverse flight search
 *
 * Streams NDJSON events as each candidate origin airport is resolved.
 * Events: progress | result | error | done
 *
 * Query params (Zod-validated):
 *   destination: IATA code
 *   homeAirport: IATA code (default FCO)
 *   dateFrom: YYYY-MM-DD
 *   dateTo: YYYY-MM-DD
 *   radiusMiles: number (50–500)
 *   timeValuePerHour: number (0–200)
 *   currency: 3-letter code
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { loadAirports, findAirport, getAirportsInRadius } from "@/lib/airports";
import { getFaresForRoute } from "@/lib/providers/router";
import { getMockFares } from "@/lib/providers/mock";
import { CorridorProvider } from "@/lib/ground/corridor";
import { EstimateProvider } from "@/lib/ground/estimate";
import { scoreOrigin } from "@/lib/scoring";
import type { ScoredOrigin, StreamEvent, Fare } from "@/types";

/** Simple concurrency limiter (avoids p-limit ESM/CJS issues in Next.js) */
function createLimiter(concurrency: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  return function limit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = () => {
        active++;
        fn()
          .then(resolve, reject)
          .finally(() => {
            active--;
            if (queue.length > 0) {
              const next = queue.shift()!;
              next();
            }
          });
      };
      if (active < concurrency) {
        run();
      } else {
        queue.push(run);
      }
    });
  };
}

const QuerySchema = z.object({
  destination: z.string().length(3).toUpperCase(),
  homeAirport: z.string().length(3).toUpperCase().default("FCO"),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  radiusMiles: z.coerce.number().min(50).max(500).default(300),
  timeValuePerHour: z.coerce.number().min(0).max(200).default(15),
  currency: z.string().length(3).toUpperCase().default("EUR"),
});

function encode(event: StreamEvent): string {
  return JSON.stringify(event) + "\n";
}

export async function GET(req: NextRequest) {
  const DEMO_MOCK = process.env.DEMO_MOCK === "true" || !process.env.TRAVELPAYOUTS_TOKEN;
  const { searchParams } = new URL(req.url);
  const rawParams = Object.fromEntries(searchParams.entries());

  const parsed = QuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid params", details: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const params = parsed.data;
  const airports = loadAirports();

  const home = findAirport(params.homeAirport, airports);
  if (!home) {
    return new Response(
      JSON.stringify({ error: `Unknown airport: ${params.homeAirport}` }),
      { status: 400 }
    );
  }

  const dest = findAirport(params.destination, airports);
  if (!dest) {
    return new Response(
      JSON.stringify({ error: `Unknown destination: ${params.destination}` }),
      { status: 400 }
    );
  }

  const rawCandidates = getAirportsInRadius(home, airports, params.radiusMiles);
  // Prioritize commercial airports (large first, then medium) within radius, max 25 candidates
  const candidateList = rawCandidates
    .sort((a, b) => {
      if (a.type !== b.type) {
        if (a.type === "large_airport") return -1;
        if (b.type === "large_airport") return 1;
      }
      return a.distanceMiles - b.distanceMiles;
    })
    .slice(0, 25)
    .sort((a, b) => a.distanceMiles - b.distanceMiles);

  const homeOrigin = { ...home, distanceMiles: 0 };
  const allOrigins = [homeOrigin, ...candidateList];

  const limit = createLimiter(5);
  let checked = 0;

  const readable = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: StreamEvent) => {
        controller.enqueue(new TextEncoder().encode(encode(event)));
      };

      sendEvent({ type: "progress", checked: 0, total: allOrigins.length });

      // Helper to process a single airport
      const processOrigin = async (origin: typeof allOrigins[0], currentHomeBaseCost: number) => {
        const start = Date.now();
        let fares: Fare[] = [];
        let providerUsed = "none";
        let cacheHit = false;

        try {
          if (DEMO_MOCK) {
            fares = getMockFares({
              origin: origin.iata,
              destination: params.destination,
              dateFrom: params.dateFrom,
              dateTo: params.dateTo,
              currency: params.currency,
            });
            providerUsed = "DEMO";
            cacheHit = true;
          } else {
            const result = await getFaresForRoute(
              {
                origin: origin.iata,
                destination: params.destination,
                dateFrom: params.dateFrom,
                dateTo: params.dateTo,
                currency: params.currency,
              },
              origin.country,
              dest.country
            );
            fares = result.fares;
            providerUsed = result.providerUsed;

            if (fares.length === 0 && (DEMO_MOCK || !process.env.TRAVELPAYOUTS_TOKEN)) {
              fares = getMockFares({
                origin: origin.iata,
                destination: params.destination,
                dateFrom: params.dateFrom,
                dateTo: params.dateTo,
                currency: params.currency,
              });
              providerUsed = "DEMO";
              cacheHit = true;
            }
          }

          const bestFare =
            fares.length > 0
              ? fares.reduce((a, b) => (a.price < b.price ? a : b))
              : null;

          // Ground leg
          const corridorProvider = new CorridorProvider();
          const corridorLeg = await corridorProvider.getLeg(origin.city, origin.iata);

          const estimateProvider = new EstimateProvider(
            home.lat,
            home.lon,
            origin.lat,
            origin.lon
          );
          const groundLeg =
            corridorLeg ?? (await estimateProvider.getLeg(origin.city, origin.iata));

          const responseTimeMs = Date.now() - start;
          const scored = scoreOrigin(
            origin,
            bestFare,
            groundLeg,
            origin.distanceMiles,
            params.timeValuePerHour,
            currentHomeBaseCost,
            responseTimeMs,
            cacheHit
          );

          checked++;
          sendEvent({ type: "progress", checked, total: allOrigins.length });
          sendEvent({ type: "result", data: scored });
          return scored;
        } catch (err) {
          checked++;
          sendEvent({ type: "progress", checked, total: allOrigins.length });
          sendEvent({
            type: "error",
            originIata: origin.iata,
            message: err instanceof Error ? err.message : "Unknown error",
          });
          return null;
        }
      };

      // 1. Process home airport first to establish homeBaseCost
      let homeBaseCost = 0;
      const homeScored = await processOrigin(homeOrigin, 0);
      if (homeScored) {
        homeBaseCost = homeScored.totalCost;
      }

      // 2. Process candidate airports concurrently
      const tasks = candidateList.map((origin) =>
        limit(async () => {
          await processOrigin(origin, homeBaseCost);
        })
      );

      await Promise.all(tasks);
      sendEvent({ type: "done", total: allOrigins.length });
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
      ...(DEMO_MOCK ? { "X-Demo-Mode": "true" } : {}),
    },
  });
}
