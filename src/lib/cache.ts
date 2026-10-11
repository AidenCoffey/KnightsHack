import fs from "fs";
import path from "path";
import type { Fare } from "@/types";

const CACHE_DIR = path.join(process.cwd(), "data", "cache");

export function cacheKey(
  origin: string,
  destination: string,
  dateFrom: string,
  dateTo?: string | null,
  tripType: string = "round",
  currency: string = "EUR"
): string {
  const o = origin.trim().toUpperCase();
  const d = destination.trim().toUpperCase();
  const dep = dateFrom ? dateFrom.slice(0, 10) : "";
  const ret = dateTo ? dateTo.slice(0, 10) : "ow";
  const type = tripType || "round";
  const curr = currency ? currency.toUpperCase() : "EUR";
  return `${o}-${d}-${dep}-${ret}-${type}-${curr}`;
}

function cacheFilePath(key: string): string {
  return path.join(CACHE_DIR, `${key}.json`);
}

interface CacheEntry {
  fetchedAt: string;
  currency: string;
  tripType: string;
  fares: Fare[];
}

export async function readCache(
  origin: string,
  destination: string,
  dateFrom: string,
  dateTo?: string | null,
  tripType: string = "round",
  currency: string = "EUR"
): Promise<CacheEntry | null> {
  const key = cacheKey(origin, destination, dateFrom, dateTo, tripType, currency);
  const filePath = cacheFilePath(key);
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const entry = JSON.parse(raw) as CacheEntry;
    // Discard cache older than 12 hours so prices stay reasonably fresh
    if (!isCacheFresh(entry.fetchedAt, 12)) {
      return null;
    }
    // Verify currency match to prevent showing EUR prices when USD was requested
    if (entry.currency && currency && entry.currency.toUpperCase() !== currency.toUpperCase()) {
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

export async function writeCache(
  origin: string,
  destination: string,
  dateFrom: string,
  arg4?: string | null | Fare[],
  arg5?: string | Fare[],
  arg6?: string,
  arg7?: Fare[]
): Promise<void> {
  let dateTo: string | null = null;
  let tripType = "round";
  let currency = "EUR";
  let fares: Fare[] = [];

  if (Array.isArray(arg4)) {
    fares = arg4;
  } else {
    dateTo = typeof arg4 === "string" ? arg4 : null;
    tripType = typeof arg5 === "string" ? arg5 : "round";
    currency = typeof arg6 === "string" ? arg6 : "EUR";
    fares = Array.isArray(arg7) ? arg7 : [];
  }

  if (!fares || fares.length === 0) return;
  const key = cacheKey(origin, destination, dateFrom, dateTo, tripType, currency);
  const filePath = cacheFilePath(key);
  const entry: CacheEntry = {
    fetchedAt: new Date().toISOString(),
    currency: currency.toUpperCase(),
    tripType,
    fares,
  };
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), "utf-8");
  } catch (err) {
    console.warn("[cache] write failed:", err);
  }
}

/** Check if a cache entry is fresh (within maxAgeHours) */
export function isCacheFresh(fetchedAt: string, maxAgeHours = 12): boolean {
  const age = Date.now() - new Date(fetchedAt).getTime();
  return age < maxAgeHours * 60 * 60 * 1000;
}

/** Format a cache date for display: "Last seen Oct 10" */
export function formatCacheDate(fetchedAt: string): string {
  return `Last seen ${new Date(fetchedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}
