import { NextRequest, NextResponse } from "next/server";
import { loadAirports } from "@/lib/airports";
import type { Airport } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const airports = loadAirports();

  if (!q) {
    // Return top popular hubs if no query
    const popularIatas = [
      "FCO", "MXP", "NAP", "VCE", "BLQ",
      "LHR", "LGW", "CDG", "ORY", "AMS",
      "FRA", "MUC", "MAD", "BCN", "ZRH",
      "VIE", "JFK", "EWR", "LAX", "ORD",
      "NRT", "HND", "SIN", "BKK", "DXB"
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
    const country = (a.country || "").toLowerCase();

    let score = 0;
    if (iata === q) {
      score = 1000;
    } else if (iata.startsWith(q)) {
      score = 800;
    } else if (city === q) {
      score = 700;
    } else if (city.startsWith(q)) {
      score = 600;
    } else if (city.includes(q)) {
      score = 400;
    } else if (name.includes(q)) {
      score = 300;
    } else if (country === q) {
      score = 200;
    }

    if (score > 0) {
      // Prioritize large airports over medium/small
      if (a.type === "large_airport") score += 50;
      else if (a.type === "medium_airport") score += 20;

      matches.push({ airport: a, score });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  const results = matches.slice(0, 15).map((m) => m.airport);

  return NextResponse.json({ airports: results });
}
