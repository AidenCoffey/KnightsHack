/**
 * EstimateProvider — estimates ground transport cost based on distance.
 * Always labeled "Estimate" in the UI.
 * Uses data/ground.json for cost-per-km and speed by mode.
 */

import fs from "fs";
import path from "path";
import type { GroundLeg, GroundMode } from "@/types";
import type { GroundProvider } from "./types";
import { haversinemiles, milesToKm } from "../airports";

interface ModeConfig {
  mode: GroundMode;
  costPerKm: number;  // EUR
  avgSpeedKph: number;
  minDistanceKm: number;
  maxDistanceKm: number;
}

interface GroundConfig {
  modes: ModeConfig[];
}

let _config: GroundConfig | null = null;

function loadConfig(): GroundConfig {
  if (_config) return _config;
  try {
    const filePath = path.join(process.cwd(), "data", "ground.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    _config = JSON.parse(raw) as GroundConfig;
    return _config;
  } catch {
    // Hardcoded fallback
    _config = {
      modes: [
        { mode: "bus", costPerKm: 0.08, avgSpeedKph: 70, minDistanceKm: 0, maxDistanceKm: 400 },
        { mode: "train", costPerKm: 0.12, avgSpeedKph: 100, minDistanceKm: 30, maxDistanceKm: 600 },
        { mode: "drive", costPerKm: 0.15, avgSpeedKph: 100, minDistanceKm: 0, maxDistanceKm: 800 },
        { mode: "taxi", costPerKm: 0.9, avgSpeedKph: 60, minDistanceKm: 0, maxDistanceKm: 80 },
      ],
    };
    return _config;
  }
}

export class EstimateProvider implements GroundProvider {
  private fromLat: number;
  private fromLon: number;
  private airportLat: number;
  private airportLon: number;

  constructor(
    fromLat: number,
    fromLon: number,
    airportLat: number,
    airportLon: number
  ) {
    this.fromLat = fromLat;
    this.fromLon = fromLon;
    this.airportLat = airportLat;
    this.airportLon = airportLon;
  }

  async getLeg(fromCity: string, toAirport: string): Promise<GroundLeg> {
    const config = loadConfig();
    const distanceMiles = haversinemiles(
      this.fromLat, this.fromLon,
      this.airportLat, this.airportLon
    );
    const distanceKm = milesToKm(distanceMiles);

    // Pick the cheapest applicable mode
    const applicable = config.modes
      .filter((m) => distanceKm >= m.minDistanceKm && distanceKm <= m.maxDistanceKm)
      .sort((a, b) => a.costPerKm - b.costPerKm);

    const chosen = applicable[0] ?? config.modes[0];
    const price = Math.round(chosen.costPerKm * distanceKm * 100) / 100;
    const duration = distanceKm / chosen.avgSpeedKph;

    return {
      fromCity,
      toAirport,
      price: Math.max(price, 5), // minimum €5
      duration: Math.max(duration, 0.25), // minimum 15 min
      mode: chosen.mode,
      currency: "EUR",
      source: "Estimate",
    };
  }
}
