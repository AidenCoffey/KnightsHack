import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { CULTURAL_FALLBACK_DATA, resolveCountryKey, createUniversalCountryFallback } from "@/lib/cultural-fallback";
import { getCountryNameFromCode } from "@/lib/cultural-utils";
import type { CountryCulturalInfo } from "@/types/cultural";

// In-memory cache for fast repeated responses
const memoryCache = new Map<string, { data: CountryCulturalInfo; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

let offlineCountriesCache: Record<string, any> | null = null;

function getOfflineCountryData(codeOrIata: string): any | null {
  if (!offlineCountriesCache) {
    try {
      const filePath = path.join(process.cwd(), "data", "cultural-countries.json");
      if (fs.existsSync(filePath)) {
        offlineCountriesCache = JSON.parse(fs.readFileSync(filePath, "utf8"));
      }
    } catch (err) {
      console.warn("[cultural-info] Failed to read cultural-countries.json:", err);
    }
  }
  if (!offlineCountriesCache) return null;
  const key = codeOrIata.toUpperCase();
  return offlineCountriesCache[key] || null;
}

function normalizeCardItem(item: any): { title: string; description: string } {
  if (typeof item === "string") {
    // If it's a raw string like "Do not leave chopsticks upright in rice (funeral association)"
    const parts = item.split(/[:\-\(]/);
    if (parts.length > 1 && parts[0].length < 35) {
      return {
        title: parts[0].trim(),
        description: item.substring(parts[0].length).replace(/^[:\-\s]+/, "").trim(),
      };
    }
    return { title: item, description: "" };
  }
  if (!item || typeof item !== "object") {
    return { title: "Travel Etiquette", description: "" };
  }

  const title =
    item.title ||
    item.taboo ||
    item.name ||
    item.rule ||
    item.tip ||
    item.custom ||
    item.heading ||
    "Cultural Note";

  const description =
    item.description ||
    item.details ||
    item.desc ||
    item.body ||
    item.text ||
    item.explanation ||
    "";

  return { title, description };
}

function normalizePhrases(phrases: any[] = []) {
  return phrases.map((p) => {
    if (typeof p === "string") {
      return { phrase: p, translation: p, phonetic: "" };
    }
    return {
      phrase: p.phrase || p.meaning || p.english || p.title || "",
      phonetic: p.phonetic || p.pronunciation || p.reading || "",
      translation: p.translation || p.script || p.target || p.local || "",
    };
  });
}

function sanitizeCulturalData(data: any): CountryCulturalInfo {
  return {
    countryId: data.countryId || "",
    countryName: data.countryName || "Destination",
    alpha2: data.alpha2 || "XX",
    weatherInfo: data.weatherInfo || "",
    currencyInfo: data.currencyInfo || {
      name: "Local Currency",
      code: "USD",
      exchangeRate: "",
      tips: "",
    },
    emergencyInfo: data.emergencyInfo || {
      police: "112",
      ambulance: "112",
      embassy: "",
    },
    essentialItems: Array.isArray(data.essentialItems) ? data.essentialItems : [],
    localCustoms: Array.isArray(data.localCustoms)
      ? data.localCustoms.map(normalizeCardItem)
      : [],
    culturalTaboos: Array.isArray(data.culturalTaboos)
      ? data.culturalTaboos.map(normalizeCardItem)
      : [],
    safetyTips: Array.isArray(data.safetyTips)
      ? data.safetyTips.map(normalizeCardItem)
      : [],
    commonScams: Array.isArray(data.commonScams)
      ? data.commonScams.map(normalizeCardItem)
      : [],
    usefulPhrases: Array.isArray(data.usefulPhrases)
      ? normalizePhrases(data.usefulPhrases)
      : [],
  };
}

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

  // 1. Check full TravelWolf offline database (data/cultural-countries.json) which has all 108 countries
  const offlineCountry = getOfflineCountryData(resolvedKey) || getOfflineCountryData(rawCountry);
  if (offlineCountry && offlineCountry.essentialItems && offlineCountry.essentialItems.length >= 4) {
    const sanitized = sanitizeCulturalData(offlineCountry);
    memoryCache.set(resolvedKey, { data: sanitized, timestamp: Date.now() });
    memoryCache.set(rawCountry.toUpperCase(), { data: sanitized, timestamp: Date.now() });
    return NextResponse.json(sanitized, {
      headers: {
        "X-Data-Source": "travelwolf-offline-dossier",
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    });
  }

  // 2. Check our premium curated offline cultural dataset
  const fallback = CULTURAL_FALLBACK_DATA[resolvedKey];
  if (fallback) {
    const sanitized = sanitizeCulturalData(fallback);
    memoryCache.set(resolvedKey, { data: sanitized, timestamp: Date.now() });
    return NextResponse.json(sanitized, {
      headers: {
        "X-Data-Source": "curated-field-dossier",
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    });
  }

  // 3. Attempt external live API if not in offline database
  const candidates = [rawCountry, resolvedKey];
  for (const query of candidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const apiUrl = `https://travelwolf.co/api/cultural-info/countries/${encodeURIComponent(query)}`;
      const res = await fetch(apiUrl, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
        next: { revalidate: 86400 },
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const rawJson = await res.json();
        if (rawJson && (rawJson.countryName || rawJson.essentialItems)) {
          const sanitized = sanitizeCulturalData(rawJson);
          memoryCache.set(resolvedKey, { data: sanitized, timestamp: Date.now() });
          memoryCache.set(rawCountry.toUpperCase(), { data: sanitized, timestamp: Date.now() });

          return NextResponse.json(sanitized, {
            headers: {
              "X-Data-Source": "travelwolf-live-api",
              "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
            },
          });
        }
      }
    } catch {
      // Continue to default fallback
    }
  }

  // Universal fallback tailored to the destination if not in curated dataset
  const universalDossier = createUniversalCountryFallback(
    resolvedKey,
    getCountryNameFromCode(resolvedKey)
  );
  const sanitized = sanitizeCulturalData(universalDossier);
  memoryCache.set(resolvedKey, { data: sanitized, timestamp: Date.now() });
  return NextResponse.json(sanitized, {
    headers: {
      "X-Data-Source": "universal-country-fallback",
      "Cache-Control": "public, s-maxage=86400",
    },
  });
}
