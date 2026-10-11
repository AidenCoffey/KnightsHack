import { NextRequest, NextResponse } from "next/server";

export interface LiveAircraft {
  icao24: string;
  callsign: string;
  originCountry: string;
  lon: number;
  lat: number;
  altitudeMeters: number;
  velocityKmh: number;
  headingDeg: number;
  onGround: boolean;
}

// In-memory cache to respect OpenSky rate limits (1 req every 5s)
let cachedPlanes: LiveAircraft[] = [];
let lastFetchTime = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lamin = parseFloat(searchParams.get("lamin") || "36.0");
  const lamax = parseFloat(searchParams.get("lamax") || "48.0");
  const lomin = parseFloat(searchParams.get("lomin") || "6.0");
  const lomax = parseFloat(searchParams.get("lomax") || "19.0");

  const now = Date.now();
  if (now - lastFetchTime < 6000 && cachedPlanes.length > 0) {
    return NextResponse.json({ planes: cachedPlanes, source: "Live (cached 5s)" });
  }

  try {
    const url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Venture-Hackathon/1.0",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ planes: cachedPlanes, source: "Stale cache" });
    }

    const data = await res.json();
    if (!data.states || !Array.isArray(data.states)) {
      return NextResponse.json({ planes: cachedPlanes, source: "Stale cache" });
    }

    // Parse OpenSky state vectors:
    // [0: icao24, 1: callsign, 2: origin_country, 5: longitude, 6: latitude, 7: baro_altitude, 8: on_ground, 9: velocity, 10: true_track]
    const planes: LiveAircraft[] = data.states
      .filter((s: (string | number | boolean | null)[]) => s[5] != null && s[6] != null && !s[8])
      .slice(0, 75) // Limit to top 75 aircraft to keep Leaflet silky smooth
      .map((s: (string | number | boolean | null)[]) => ({
        icao24: String(s[0]),
        callsign: String(s[1] || "").trim() || "FLIGHT",
        originCountry: String(s[2] || ""),
        lon: Number(s[5]),
        lat: Number(s[6]),
        altitudeMeters: Math.round(Number(s[7] || 0)),
        velocityKmh: Math.round(Number(s[9] || 0) * 3.6),
        headingDeg: Math.round(Number(s[10] || 0)),
        onGround: Boolean(s[8]),
      }));

    cachedPlanes = planes;
    lastFetchTime = now;

    return NextResponse.json({ planes, source: "Live Radar (OpenSky)" });
  } catch (err) {
    console.warn("[radar] OpenSky fetch failed, returning cache:", err);
    return NextResponse.json({ planes: cachedPlanes, source: "Fallback cache" });
  }
}
