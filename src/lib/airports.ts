/**
 * airports.ts — Server-only airport utilities
 * 
 * This file uses Node.js `fs` — DO NOT import in client components.
 * For client-side airport data, use @/lib/airport-data instead.
 */

import fs from "fs";
import path from "path";
import type { Airport } from "@/types";
import { FALLBACK_AIRPORTS } from "./airport-data";

// Re-export so existing imports still work from server-side code
export { FALLBACK_AIRPORTS } from "./airport-data";

// Haversine formula: returns distance in miles
export function haversinemiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function milesToKm(miles: number): number {
  return miles * 1.60934;
}

export function kmToMiles(km: number): number {
  return km / 1.60934;
}

let _airports: Airport[] | null = null;

export function loadAirports(): Airport[] {
  if (_airports) return _airports;
  try {
    const filePath = path.join(process.cwd(), "data", "airports.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw) as Airport[];
    if (Array.isArray(data) && data.length > 0) {
      _airports = data;
      return _airports;
    }
  } catch {
    // fall through to fallback
  }
  _airports = FALLBACK_AIRPORTS;
  return _airports;
}

export function getAirportsInRadius(
  home: Airport,
  allAirports: Airport[],
  radiusMiles: number
): Array<Airport & { distanceMiles: number }> {
  return allAirports
    .filter((a) => a.iata !== home.iata)
    .map((a) => ({
      ...a,
      distanceMiles: haversinemiles(home.lat, home.lon, a.lat, a.lon),
    }))
    .filter((a) => a.distanceMiles <= radiusMiles)
    .sort((a, b) => a.distanceMiles - b.distanceMiles);
}

export function findAirport(
  iata: string,
  airports: Airport[]
): Airport | undefined {
  return airports.find((a) => a.iata === iata.toUpperCase());
}
