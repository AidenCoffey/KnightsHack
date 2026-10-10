/**
 * CorridorTable — returns hand-collected real ground transport fares.
 * Source: data/corridors.json
 * Priority: always checked first before estimation.
 */

import fs from "fs";
import path from "path";
import type { GroundLeg } from "@/types";
import type { GroundProvider } from "./types";

interface CorridorEntry {
  fromCity: string;
  toAirport: string;
  price: number;
  duration: number; // hours
  mode: GroundLeg["mode"];
  currency: string;
  captureDate: string;
}

let _corridors: CorridorEntry[] | null = null;

function loadCorridors(): CorridorEntry[] {
  if (_corridors) return _corridors;
  try {
    const filePath = path.join(process.cwd(), "data", "corridors.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    _corridors = JSON.parse(raw) as CorridorEntry[];
    return _corridors;
  } catch {
    _corridors = [];
    return [];
  }
}

export class CorridorProvider implements GroundProvider {
  async getLeg(fromCity: string, toAirport: string): Promise<GroundLeg | null> {
    const corridors = loadCorridors();
    const entry = corridors.find(
      (c) =>
        c.fromCity.toLowerCase() === fromCity.toLowerCase() &&
        c.toAirport.toUpperCase() === toAirport.toUpperCase()
    );
    if (!entry) return null;
    return {
      fromCity: entry.fromCity,
      toAirport: entry.toAirport,
      price: entry.price,
      duration: entry.duration,
      mode: entry.mode,
      currency: entry.currency,
      source: "Real fare",
      captureDate: entry.captureDate,
    };
  }
}
