import { NextRequest, NextResponse } from "next/server";
import { loadAirports } from "@/lib/airports";
import { getCountryNameFromCode } from "@/lib/cultural-utils";
import type { Airport } from "@/types";

// Airports whose dataset `city` is the host municipality rather than the metro they serve
const METRO_ALIASES: Record<string, string[]> = {
  NRT: ["tokyo"],
  STN: ["london"],
  LTN: ["london"],
  SEN: ["london"],
  BVA: ["paris"],
  MXP: ["milan"],
  LIN: ["milan"],
  BGY: ["milan"],
  EWR: ["new york"],
  IAD: ["washington"],
  BWI: ["washington"],
  OAK: ["san francisco"],
  SJC: ["san francisco"],
  BUR: ["los angeles"],
  SNA: ["los angeles"],
  LGB: ["los angeles"],
  FLL: ["miami"],
  PBI: ["miami"],
  DWC: ["dubai"],
  VCP: ["são paulo", "sao paulo"],
  SAW: ["istanbul"],
  TPE: ["taipei"],
  DFW: ["dallas"],
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const airports = loadAirports();

  if (!q) {
    // Popular destinations until the user starts typing
    const popularIatas = [
      "CDG", "FRA", "FCO", "MXP", "ZRH", "PRG",
      "BUD", "JFK", "MCO", "TPA", "NRT", "BKK",
    ];
    const popular = popularIatas
      .map((code) => airports.find((a) => a.iata === code))
      .filter((a): a is Airport => Boolean(a));
    return NextResponse.json({ airports: popular });
  }

  // Scoring match
  const matches: Array<{ airport: Airport; score: number }> = [];

  for (const a of airports) {
    const iata = a.iata.toLowerCase();
    const city = (a.city || "").toLowerCase();
    const name = (a.name || "").toLowerCase();
    const countryCode = (a.country || "").toLowerCase();
    const countryFullName = getCountryNameFromCode(a.country).toLowerCase();
    const metros = METRO_ALIASES[a.iata] ?? [];

    let score = 0;
    if (iata === q) {
      score = 1000;
    } else if (iata.startsWith(q)) {
      score = 800;
    } else if (city === q || metros.includes(q)) {
      score = 700;
    } else if (city.startsWith(q) || metros.some((m) => m.startsWith(q))) {
      score = 600;
    } else if (countryFullName === q) {
      score = 550;
    } else if (countryFullName.startsWith(q) || countryFullName.includes(q)) {
      score = 450;
    } else if (city.includes(q)) {
      score = 400;
    } else if (name.includes(q)) {
      score = 300;
    } else if (countryCode === q) {
      score = 250;
    }

    if (score > 0) {
      // Prioritize large airports over medium/small
      if (a.type === "large_airport") score += 50;
      else if (a.type === "medium_airport") score += 20;

      matches.push({ airport: a, score });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  const results = matches.slice(0, 20).map((m) => m.airport);

  return NextResponse.json({ airports: results });
}
