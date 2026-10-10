import fs from "fs";
import path from "path";
import type { Fare } from "@/types";

const CACHE_DIR = path.join(process.cwd(), "data", "cache");

function cacheKey(origin: string, destination: string, dateFrom: string): string {
  return `${origin}-${destination}-${dateFrom}`;
}

function cacheFilePath(key: string): string {
  return path.join(CACHE_DIR, `${key}.json`);
}

interface CacheEntry {
  fetchedAt: string;
  fares: Fare[];
}

export async function readCache(
  origin: string,
  destination: string,
  dateFrom: string
): Promise<CacheEntry | null> {
  const key = cacheKey(origin, destination, dateFrom);
  const filePath = cacheFilePath(key);
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

export async function writeCache(
  origin: string,
  destination: string,
  dateFrom: string,
  fares: Fare[]
): Promise<void> {
  const key = cacheKey(origin, destination, dateFrom);
  const filePath = cacheFilePath(key);
  const entry: CacheEntry = {
    fetchedAt: new Date().toISOString(),
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
export function isCacheFresh(fetchedAt: string, maxAgeHours = 24): boolean {
  const age = Date.now() - new Date(fetchedAt).getTime();
  return age < maxAgeHours * 60 * 60 * 1000;
}

/** Format a cache date for display: "Last seen Dec 3" */
export function formatCacheDate(fetchedAt: string): string {
  return `Last seen ${new Date(fetchedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}
