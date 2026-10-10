import { NextRequest, NextResponse } from "next/server";
import { CULTURAL_FALLBACK_DATA, resolveCountryKey } from "@/lib/cultural-fallback";
import type { CountryCulturalInfo } from "@/types/cultural";

// In-memory cache for fast repeated responses
const memoryCache = new Map<string, { data: CountryCulturalInfo; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export async function GET(
  request: NextRequest,
  { params }: { params: { country: string } }
) {
  const rawCountry = params.country || "";
  if (!rawCountry) {
    return NextResponse.json({ error: "Missing country parameter" }, { status: 400 });
  }

  const resolvedKey = resolveCountryKey(rawCountry);

  // Check cache first
  const cached = memoryCache.get(resolvedKey) || memoryCache.get(rawCountry.toUpperCase());
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: {
        "X-Data-Source": "memory-cache",
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    });
  }

  // Attempt to fetch from TravelWolf Cultural Info API
  const candidates = [rawCountry, resolvedKey];
  for (const query of candidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const apiUrl = `https://travelwolf.co/api/cultural-info/countries/${encodeURIComponent(query)}`;
      const res = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "FlightDeck-TravelWolf-Integration/1.0",
        },
        next: { revalidate: 86400 },
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = (await res.json()) as CountryCulturalInfo;
        if (data && (data.countryName || data.essentialItems)) {
          memoryCache.set(resolvedKey, { data, timestamp: Date.now() });
          memoryCache.set(rawCountry.toUpperCase(), { data, timestamp: Date.now() });

          return NextResponse.json(data, {
            headers: {
              "X-Data-Source": "travelwolf-live",
              "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
            },
          });
        }
      }
    } catch {
      // Continue to fallback if fetch fails or times out
    }
  }

  // Fallback to our curated offline cultural dataset
  const fallback = CULTURAL_FALLBACK_DATA[resolvedKey] || CULTURAL_FALLBACK_DATA["JP"];
  if (fallback) {
    return NextResponse.json(fallback, {
      headers: {
        "X-Data-Source": "curated-fallback",
        "Cache-Control": "public, s-maxage=86400",
      },
    });
  }

  return NextResponse.json(
    { error: `No cultural guide found for ${rawCountry}` },
    { status: 404 }
  );
}
