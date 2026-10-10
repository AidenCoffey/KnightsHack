/**
 * scripts/build-airports.ts
 *
 * Downloads OurAirports public domain CSV and filters to:
 * - IATA code present
 * - scheduled_service = "yes"
 * - type = large_airport or medium_airport
 *
 * Writes to data/airports.json
 *
 * Usage: npm run build:airports
 */

import fs from "fs";
import path from "path";
import https from "https";

const OURAIRPORTS_CSV_URL =
  "https://davidmegginson.github.io/ourairports-data/airports.csv";
const OUTPUT_PATH = path.join(process.cwd(), "data", "airports.json");

interface AirportRow {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  type: "large_airport" | "medium_airport" | "small_airport";
}

function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Simple CSV parse (handles basic quoting)
    const values: string[] = [];
    let inQuote = false;
    let current = "";
    for (const ch of line) {
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        values.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    values.push(current);

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function download(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        download(res.headers.location!).then(resolve).catch(reject);
        return;
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function main() {
  console.log("Downloading OurAirports CSV…");
  const csv = await download(OURAIRPORTS_CSV_URL);

  console.log("Parsing…");
  const rows = parseCSV(csv);

  const airports: AirportRow[] = rows
    .filter(
      (r) =>
        r.iata_code &&
        r.iata_code.length === 3 &&
        r.scheduled_service === "yes" &&
        (r.type === "large_airport" || r.type === "medium_airport")
    )
    .map((r) => ({
      iata: r.iata_code,
      name: r.name,
      city: r.municipality || r.name,
      country: r.iso_country,
      lat: parseFloat(r.latitude_deg),
      lon: parseFloat(r.longitude_deg),
      type: r.type as AirportRow["type"],
    }))
    .filter((a) => !isNaN(a.lat) && !isNaN(a.lon));

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(airports, null, 2));
  console.log(`✅ Written ${airports.length} airports to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
