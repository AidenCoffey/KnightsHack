import fs from "fs";
import path from "path";
import type { SavedTrip, CreateTripInput } from "@/types/trips";
import type { CountryCulturalInfo } from "@/types/cultural";
import { CULTURAL_FALLBACK_DATA, resolveCountryKey } from "./cultural-fallback";
import { getCountryNameFromCode } from "./cultural-utils";
import { FALLBACK_AIRPORTS } from "./airport-data";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "trips.db");
const JSON_BACKUP_PATH = path.join(DATA_DIR, "trips.json");
const PACKING_JSON_PATH = path.join(DATA_DIR, "packing.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Interface for SQLite DatabaseSync from node:sqlite
interface SqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): {
    run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
  };
}

let sqliteDbInstance: SqliteDatabase | null = null;
let sqliteInitAttempted = false;

function getSqliteDb(): SqliteDatabase | null {
  if (sqliteInitAttempted) return sqliteDbInstance;
  sqliteInitAttempted = true;

  try {
    // node:sqlite is built-in in Node 22.5+
    // Use dynamic require so bundlers don't complain during build
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DatabaseSync } = require("node:sqlite");
    if (typeof DatabaseSync === "function") {
      const db = new DatabaseSync(DB_PATH) as SqliteDatabase;
      db.exec(`
        CREATE TABLE IF NOT EXISTS trips (
          id TEXT PRIMARY KEY,
          created_at TEXT NOT NULL,
          origin_iata TEXT NOT NULL,
          origin_city TEXT NOT NULL,
          destination_iata TEXT NOT NULL,
          destination_city TEXT NOT NULL,
          destination_country TEXT NOT NULL,
          depart_date TEXT NOT NULL,
          return_date TEXT,
          trip_type TEXT NOT NULL,
          passengers INTEGER DEFAULT 1,
          fare_price REAL,
          currency TEXT DEFAULT 'USD',
          total_cost REAL,
          savings_vs_home REAL,
          transfer_mode TEXT,
          transfer_price REAL,
          transfer_duration_hours REAL,
          airline TEXT,
          booking_url TEXT,
          notes TEXT,
          cultural_info TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at);

        CREATE TABLE IF NOT EXISTS destination_packing (
          destination_iata TEXT PRIMARY KEY,
          checked_items TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      sqliteDbInstance = db;
      return db;
    }
  } catch (err) {
    console.warn("[trips-db] SQLite initialization note (using local persistent store):", err);
  }
  return null;
}

// Fallback JSON persistent storage
function readJsonTrips(): SavedTrip[] {
  try {
    if (!fs.existsSync(JSON_BACKUP_PATH)) {
      return [];
    }
    const raw = fs.readFileSync(JSON_BACKUP_PATH, "utf-8");
    return JSON.parse(raw) as SavedTrip[];
  } catch {
    return [];
  }
}

function writeJsonTrips(trips: SavedTrip[]): void {
  try {
    fs.writeFileSync(JSON_BACKUP_PATH, JSON.stringify(trips, null, 2), "utf-8");
  } catch (err) {
    console.error("[trips-db] Failed to write trips.json fallback:", err);
  }
}

const DEFAULT_COUNTRY_LANGUAGES: Record<string, { name: string; family?: string; facts?: string[]; scripts?: string }> = {
  JP: { name: "Japanese (日本語)", family: "Japonic", facts: ["Uses three writing scripts: Hiragana, Katakana, and Kanji.", "Politeness and honorifics (keigo) are essential in social interactions."], scripts: "Kanji, Hiragana, Katakana" },
  IT: { name: "Italian (Italiano)", family: "Romance (Indo-European)", facts: ["Evolved directly from Vulgar Latin.", "Hand gestures are famously integral to everyday spoken expression."], scripts: "Latin" },
  GB: { name: "English", family: "Germanic (Indo-European)", facts: ["Spoken worldwide with diverse regional British accents."], scripts: "Latin" },
  FR: { name: "French (Français)", family: "Romance (Indo-European)", facts: ["The official language of 29 nations.", "Known as the language of diplomacy and culinary arts."], scripts: "Latin" },
  ES: { name: "Spanish (Español / Castellano)", family: "Romance (Indo-European)", facts: ["Second most spoken native language in the world.", "Regional languages like Catalan, Basque, and Galician also hold official status."], scripts: "Latin" },
  DE: { name: "German (Deutsch)", family: "Germanic (Indo-European)", facts: ["Famous for compound words that express very specific concepts.", "Standard German (Hochdeutsch) is used in public life."], scripts: "Latin" },
  CH: { name: "Swiss German, French, Italian, Romansh", family: "Multilingual Confederation", facts: ["Switzerland has four national languages.", "Swiss German differs significantly in phonetics and vocabulary from Standard German."], scripts: "Latin" },
  AT: { name: "German (Österreichisches Deutsch)", family: "Germanic (Indo-European)", facts: ["Austrian German features charming colloquialisms and culinary vocabulary."], scripts: "Latin" },
  CZ: { name: "Czech (Čeština)", family: "Slavic (Indo-European)", facts: ["Features the unique consonant sound 'ř' which requires practice.", "Highly inflected grammar with 7 cases."], scripts: "Latin with diacritics" },
  PT: { name: "Portuguese (Português)", family: "Romance (Indo-European)", facts: ["European Portuguese has distinctive closed vowel sounds compared to Brazilian Portuguese."], scripts: "Latin" },
  NL: { name: "Dutch (Nederlands)", family: "Germanic (Indo-European)", facts: ["Closely related to German and English; over 90% of locals speak fluent English."], scripts: "Latin" },
  GR: { name: "Greek (Ελληνικά)", family: "Hellenic (Indo-European)", facts: ["Has a continuous written history spanning over 3,400 years.", "Uses the distinctive Greek alphabet."], scripts: "Greek" },
  TR: { name: "Turkish (Türkçe)", family: "Turkic", facts: ["An agglutinative language featuring vowel harmony.", "Uses a modified Latin alphabet introduced in 1928."], scripts: "Latin" },
  AE: { name: "Arabic (العربية)", family: "Semitic (Afroasiatic)", facts: ["Written from right to left; Modern Standard Arabic is used in official media while English is pervasive in Dubai."], scripts: "Arabic" },
  TH: { name: "Thai (ภาษาไทย)", family: "Kra-Dai", facts: ["A tonal language with 5 distinct tones.", "Features an intricate, elegant script without spaces between words."], scripts: "Thai" },
  KR: { name: "Korean (한국어)", family: "Koreanic", facts: ["Uses Hangul, one of the most scientifically designed phonetic alphabets in the world.", "Speech levels convey respect based on age and social status."], scripts: "Hangul" },
  US: { name: "English (American)", family: "Germanic (Indo-European)", facts: ["No official federal language by law, though English is overwhelmingly dominant."], scripts: "Latin" },
};

/**
 * Resolves destination cultural info (languages, phrases, customs, currency, etc.)
 */
export function resolveDestinationCulturalInfo(
  destinationIata: string,
  existingInfo?: CountryCulturalInfo
): CountryCulturalInfo {
  if (existingInfo && existingInfo.countryName && existingInfo.languages?.length) {
    return existingInfo;
  }

  const resolvedCode = resolveCountryKey(destinationIata);
  const fallback =
    CULTURAL_FALLBACK_DATA[resolvedCode] ||
    CULTURAL_FALLBACK_DATA[resolvedCode.toUpperCase()] ||
    CULTURAL_FALLBACK_DATA["JP"];

  const baseInfo: CountryCulturalInfo = fallback
    ? JSON.parse(JSON.stringify(fallback))
    : {
        countryId: resolvedCode,
        countryName: getCountryNameFromCode(destinationIata),
        alpha2: resolvedCode.slice(0, 2).toUpperCase(),
        localCustoms: [
          {
            title: "Local Etiquette",
            description: `Respect local traditions and dress codes in sacred and cultural heritage sites across ${getCountryNameFromCode(destinationIata)}.`,
          },
        ],
        culturalTaboos: [
          {
            title: "Social Norms",
            description: "Be mindful of personal space and avoid loud conversations on public transportation.",
          },
        ],
        usefulPhrases: [
          { phrase: "Hello", translation: "Hello", phonetic: "heh-loh" },
          { phrase: "Thank you", translation: "Thank you", phonetic: "thank yoo" },
          { phrase: "Please", translation: "Please", phonetic: "pleez" },
        ],
      };

  // Ensure language details are richly populated
  if (!baseInfo.languages || baseInfo.languages.length === 0) {
    const langConfig = DEFAULT_COUNTRY_LANGUAGES[resolvedCode] || DEFAULT_COUNTRY_LANGUAGES[baseInfo.alpha2] || {
      name: `Official Language of ${baseInfo.countryName}`,
      family: "National Language",
      facts: [`Primary language spoken in ${baseInfo.countryName}. English is widely used in tourist areas and major transit hubs.`],
    };

    baseInfo.languages = [
      {
        languageName: langConfig.name,
        interestingFacts: langConfig.facts || [],
        speakerInfo: {
          languageFamily: langConfig.family,
          writingDirection: resolvedCode === "AE" ? "Right-to-Left" : "Left-to-Right",
        },
      },
    ];
  }

  return baseInfo;
}

/**
 * Convert raw database row to SavedTrip interface
 */
function rowToSavedTrip(row: Record<string, unknown>): SavedTrip {
  let culturalInfo: CountryCulturalInfo | undefined = undefined;
  if (typeof row.cultural_info === "string" && row.cultural_info.trim()) {
    try {
      culturalInfo = JSON.parse(row.cultural_info) as CountryCulturalInfo;
    } catch {
      culturalInfo = undefined;
    }
  }

  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    originIata: String(row.origin_iata || ""),
    originCity: String(row.origin_city || ""),
    destinationIata: String(row.destination_iata || ""),
    destinationCity: String(row.destination_city || ""),
    destinationCountry: String(row.destination_country || ""),
    departDate: String(row.depart_date || ""),
    returnDate: row.return_date ? String(row.return_date) : null,
    tripType: (row.trip_type as "round" | "oneway") || "round",
    passengers: Number(row.passengers ?? 1),
    farePrice: row.fare_price !== null && row.fare_price !== undefined ? Number(row.fare_price) : undefined,
    currency: String(row.currency || "USD"),
    totalCost: row.total_cost !== null && row.total_cost !== undefined ? Number(row.total_cost) : undefined,
    savingsVsHome: row.savings_vs_home !== null && row.savings_vs_home !== undefined ? Number(row.savings_vs_home) : undefined,
    transferMode: row.transfer_mode ? String(row.transfer_mode) : undefined,
    transferPrice: row.transfer_price !== null && row.transfer_price !== undefined ? Number(row.transfer_price) : undefined,
    transferDurationHours: row.transfer_duration_hours !== null && row.transfer_duration_hours !== undefined ? Number(row.transfer_duration_hours) : undefined,
    airline: row.airline ? String(row.airline) : undefined,
    bookingUrl: row.booking_url ? String(row.booking_url) : null,
    notes: row.notes ? String(row.notes) : "",
    culturalInfo,
  };
}

/**
 * Retrieve all saved trips, ordered by creation date descending
 */
export function getAllTrips(): SavedTrip[] {
  const db = getSqliteDb();
  if (db) {
    try {
      const stmt = db.prepare("SELECT * FROM trips ORDER BY created_at DESC");
      const rows = stmt.all() as Record<string, unknown>[];
      return rows.map(rowToSavedTrip);
    } catch (err) {
      console.warn("[trips-db] SQLite query failed, falling back to JSON:", err);
    }
  }

  const jsonTrips = readJsonTrips();
  return jsonTrips.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Retrieve a single trip by ID
 */
export function getTripById(id: string): SavedTrip | null {
  if (!id) return null;
  const db = getSqliteDb();
  if (db) {
    try {
      const stmt = db.prepare("SELECT * FROM trips WHERE id = ?");
      const row = stmt.get(id) as Record<string, unknown> | undefined;
      if (row) {
        return rowToSavedTrip(row);
      }
      return null;
    } catch (err) {
      console.warn("[trips-db] SQLite getById failed, falling back to JSON:", err);
    }
  }

  const jsonTrips = readJsonTrips();
  return jsonTrips.find((t) => t.id === id) || null;
}

/**
 * Save (create or update) a trip in the database
 */
export function saveTrip(input: CreateTripInput): SavedTrip {
  const tripId = input.id || `trip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const createdAt = new Date().toISOString();

  // Resolve cities if not supplied
  const originAirport = FALLBACK_AIRPORTS.find((a) => a.iata === input.originIata.toUpperCase());
  const destAirport = FALLBACK_AIRPORTS.find((a) => a.iata === input.destinationIata.toUpperCase());

  const originCity = input.originCity || originAirport?.city || input.originIata;
  const destCity = input.destinationCity || destAirport?.city || input.destinationIata;
  const destCountry =
    input.destinationCountry ||
    destAirport?.country ||
    getCountryNameFromCode(input.destinationIata);

  // Automatically embed rich destination cultural and language information
  const enrichedCulturalInfo = resolveDestinationCulturalInfo(
    input.destinationIata,
    input.culturalInfo
  );

  const tripRecord: SavedTrip = {
    id: tripId,
    createdAt,
    originIata: input.originIata.toUpperCase(),
    originCity,
    destinationIata: input.destinationIata.toUpperCase(),
    destinationCity: destCity,
    destinationCountry: destCountry,
    departDate: input.departDate,
    returnDate: input.returnDate ?? null,
    tripType: input.tripType || (input.returnDate ? "round" : "oneway"),
    passengers: input.passengers ?? 1,
    farePrice: input.farePrice,
    currency: input.currency || "USD",
    totalCost: input.totalCost,
    savingsVsHome: input.savingsVsHome,
    transferMode: input.transferMode,
    transferPrice: input.transferPrice,
    transferDurationHours: input.transferDurationHours,
    airline: input.airline,
    bookingUrl: input.bookingUrl ?? null,
    notes: input.notes || "",
    culturalInfo: enrichedCulturalInfo,
  };

  const db = getSqliteDb();
  if (db) {
    try {
      const stmt = db.prepare(`
        INSERT INTO trips (
          id, created_at, origin_iata, origin_city, destination_iata, destination_city,
          destination_country, depart_date, return_date, trip_type, passengers,
          fare_price, currency, total_cost, savings_vs_home, transfer_mode,
          transfer_price, transfer_duration_hours, airline, booking_url, notes, cultural_info
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        ON CONFLICT(id) DO UPDATE SET
          origin_iata=excluded.origin_iata,
          origin_city=excluded.origin_city,
          destination_iata=excluded.destination_iata,
          destination_city=excluded.destination_city,
          destination_country=excluded.destination_country,
          depart_date=excluded.depart_date,
          return_date=excluded.return_date,
          trip_type=excluded.trip_type,
          passengers=excluded.passengers,
          fare_price=excluded.fare_price,
          currency=excluded.currency,
          total_cost=excluded.total_cost,
          savings_vs_home=excluded.savings_vs_home,
          transfer_mode=excluded.transfer_mode,
          transfer_price=excluded.transfer_price,
          transfer_duration_hours=excluded.transfer_duration_hours,
          airline=excluded.airline,
          booking_url=excluded.booking_url,
          notes=excluded.notes,
          cultural_info=excluded.cultural_info
      `);

      stmt.run(
        tripRecord.id,
        tripRecord.createdAt,
        tripRecord.originIata,
        tripRecord.originCity,
        tripRecord.destinationIata,
        tripRecord.destinationCity,
        tripRecord.destinationCountry,
        tripRecord.departDate,
        tripRecord.returnDate,
        tripRecord.tripType,
        tripRecord.passengers ?? 1,
        tripRecord.farePrice ?? null,
        tripRecord.currency,
        tripRecord.totalCost ?? null,
        tripRecord.savingsVsHome ?? null,
        tripRecord.transferMode ?? null,
        tripRecord.transferPrice ?? null,
        tripRecord.transferDurationHours ?? null,
        tripRecord.airline ?? null,
        tripRecord.bookingUrl ?? null,
        tripRecord.notes ?? "",
        JSON.stringify(tripRecord.culturalInfo)
      );
    } catch (err) {
      console.warn("[trips-db] SQLite insert/update failed:", err);
    }
  }

  // Always mirror to JSON for cross-platform backup and inspection
  const jsonTrips = readJsonTrips();
  const existingIdx = jsonTrips.findIndex((t) => t.id === tripRecord.id);
  if (existingIdx >= 0) {
    jsonTrips[existingIdx] = tripRecord;
  } else {
    jsonTrips.unshift(tripRecord);
  }
  writeJsonTrips(jsonTrips);

  return tripRecord;
}

/**
 * Delete a trip by ID
 */
export function deleteTrip(id: string): boolean {
  if (!id) return false;
  let deleted = false;

  const db = getSqliteDb();
  if (db) {
    try {
      const stmt = db.prepare("DELETE FROM trips WHERE id = ?");
      const res = stmt.run(id);
      if (res.changes > 0) {
        deleted = true;
      }
    } catch (err) {
      console.warn("[trips-db] SQLite delete failed:", err);
    }
  }

  const jsonTrips = readJsonTrips();
  const filtered = jsonTrips.filter((t) => t.id !== id);
  if (filtered.length !== jsonTrips.length) {
    writeJsonTrips(filtered);
    deleted = true;
  }

  return deleted;
}

/**
 * Update personal notes on a saved trip
 */
export function updateTripNotes(id: string, notes: string): SavedTrip | null {
  if (!id) return null;

  const db = getSqliteDb();
  if (db) {
    try {
      const stmt = db.prepare("UPDATE trips SET notes = ? WHERE id = ?");
      stmt.run(notes, id);
    } catch (err) {
      console.warn("[trips-db] SQLite updateTripNotes failed:", err);
    }
  }

  const jsonTrips = readJsonTrips();
  const trip = jsonTrips.find((t) => t.id === id);
  if (trip) {
    trip.notes = notes;
    writeJsonTrips(jsonTrips);
    return trip;
  }

  return getTripById(id);
}

/**
 * Retrieve saved packing checklist items for a destination from database
 */
export function getPackingChecklist(destinationIata: string): Record<string, boolean> {
  const normDest = (destinationIata || "").toUpperCase().trim();
  if (!normDest) return {};

  const db = getSqliteDb();
  if (db) {
    try {
      const stmt = db.prepare("SELECT checked_items FROM destination_packing WHERE destination_iata = ?");
      const row = stmt.get(normDest) as { checked_items?: string } | undefined;
      if (row && row.checked_items) {
        return JSON.parse(row.checked_items) as Record<string, boolean>;
      }
    } catch (err) {
      console.warn("[trips-db] SQLite getPackingChecklist error:", err);
    }
  }

  // Fallback to JSON persistent backup
  try {
    if (fs.existsSync(PACKING_JSON_PATH)) {
      const raw = fs.readFileSync(PACKING_JSON_PATH, "utf-8");
      const all = JSON.parse(raw) as Record<string, Record<string, boolean>>;
      if (all[normDest]) {
        return all[normDest];
      }
    }
  } catch (err) {
    console.warn("[trips-db] JSON getPackingChecklist fallback error:", err);
  }

  return {};
}

/**
 * Persist packing checklist items for a destination to SQLite database & JSON backup
 */
export function savePackingChecklist(
  destinationIata: string,
  checkedItems: Record<string, boolean>
): Record<string, boolean> {
  const normDest = (destinationIata || "").toUpperCase().trim();
  if (!normDest) return {};

  const jsonStr = JSON.stringify(checkedItems);
  const now = new Date().toISOString();

  const db = getSqliteDb();
  if (db) {
    try {
      const stmt = db.prepare(`
        INSERT INTO destination_packing (destination_iata, checked_items, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(destination_iata) DO UPDATE SET
          checked_items = excluded.checked_items,
          updated_at = excluded.updated_at
      `);
      stmt.run(normDest, jsonStr, now);
    } catch (err) {
      console.warn("[trips-db] SQLite savePackingChecklist error:", err);
    }
  }

  // Backup to JSON file
  try {
    let all: Record<string, Record<string, boolean>> = {};
    if (fs.existsSync(PACKING_JSON_PATH)) {
      try {
        all = JSON.parse(fs.readFileSync(PACKING_JSON_PATH, "utf-8"));
      } catch {
        all = {};
      }
    }
    all[normDest] = checkedItems;
    fs.writeFileSync(PACKING_JSON_PATH, JSON.stringify(all, null, 2), "utf-8");
  } catch (err) {
    console.error("[trips-db] JSON savePackingChecklist error:", err);
  }

  return checkedItems;
}

