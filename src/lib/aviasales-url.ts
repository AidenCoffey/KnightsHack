/**
 * aviasales-url.ts — Official Aviasales / Travelpayouts Search URL Builder
 * 
 * Aviasales search route structure:
 * One-way:    https://www.aviasales.com/search/{ORIGIN}{DEPART_DDMM}{DEST}{PASSENGERS}?marker={MARKER}
 * Round-trip: https://www.aviasales.com/search/{ORIGIN}{DEPART_DDMM}{DEST}{RETURN_DDMM}{PASSENGERS}?marker={MARKER}
 * 
 * Critical: Dates MUST be in DDMM format (2-digit day + 2-digit month).
 * 8-digit dates (YYYYMMDD) cause Aviasales to fail with "search failed to launch".
 */

export interface AviasalesUrlParams {
  origin: string;
  destination: string;
  dateFrom: string; // YYYY-MM-DD or ISO string
  dateTo?: string | null; // YYYY-MM-DD or ISO string
  tripType?: "round" | "oneway";
  passengers?: number;
  marker?: string;
  tripClass?: "Y" | "C"; // Y = Economy (default), C = Business
}

export function formatDDMM(dateStr: string): string {
  if (!dateStr) return "";
  const clean = dateStr.slice(0, 10);
  const parts = clean.split("-");
  if (parts.length === 3) {
    const month = parts[1].padStart(2, "0");
    const day = parts[2].padStart(2, "0");
    return `${day}${month}`; // DDMM
  }
  // Fallback if already cleaned
  return dateStr.replace(/\D/g, "").slice(-4);
}

export function buildAviasalesSearchUrl(params: AviasalesUrlParams): string {
  const {
    origin,
    destination,
    dateFrom,
    dateTo,
    tripType,
    passengers = 1,
    marker = process.env.TRAVELPAYOUTS_MARKER || "708226",
  } = params;

  const orig = origin.trim().toUpperCase();
  const dest = destination.trim().toUpperCase();
  const depDDMM = formatDDMM(dateFrom);
  const retDDMM = dateTo ? formatDDMM(dateTo) : "";

  // Determine if this is round-trip
  const isRoundTrip = tripType ? tripType === "round" : Boolean(retDDMM);

  let pathSlug: string;
  if (isRoundTrip && retDDMM) {
    pathSlug = `${orig}${depDDMM}${dest}${retDDMM}${passengers}`;
  } else {
    pathSlug = `${orig}${depDDMM}${dest}${passengers}`;
  }

  const url = new URL(`https://www.aviasales.com/search/${pathSlug}`);
  url.searchParams.set("marker", marker);
  url.searchParams.set("utm_source", "flightdeck");
  url.searchParams.set("utm_medium", "affiliate");
  url.searchParams.set("utm_campaign", "reverse-search");
  url.searchParams.set("utm_content", `${orig}-${dest}`);

  return url.toString();
}
