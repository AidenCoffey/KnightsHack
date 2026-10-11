# 💾 FlightDeck — Database & Data Models

> Technical reference for FlightDeck's dual-engine persistence layer (SQLite + JSON Backup), static datasets, TypeScript interfaces, and schema definitions.

---

## 1. Dual-Engine Persistence Architecture

To guarantee zero setup friction, high-performance querying, and seamless portability across both local developer machines and containerized cloud servers, FlightDeck employs a **Dual-Engine Persistence Strategy** implemented in [`src/lib/trips-db.ts`](file:///Users/travelwolf/.gemini/antigravity/scratch/flightdeck/src/lib/trips-db.ts):

```mermaid
flowchart TD
    Operation["Trip Storage Request (saveTrip / getAllTrips / getTripById)"]
    Detect{"Is native node:sqlite Available?"}
    
    subgraph PrimaryEngine["Primary Engine: Native SQLite (node:sqlite)"]
        SQLiteConn["DatabaseSync('data/trips.db')"]
        ExecuteSQL["Execute Prepared SQL Statement with ACID Guarantees"]
        IndexedRead["Fast Query with idx_trips_created_at Index"]
    end

    subgraph FallbackEngine["Fallback Engine: Atomic JSON Store"]
        JSONFile["data/trips.json"]
        ReadWriteJSON["fs.readFileSync / fs.writeFileSync"]
    end

    SyncCopy["Automatic JSON Backup Sync"]

    Operation --> Detect
    Detect -->|Yes (Node 22.5+ Native)| SQLiteConn --> ExecuteSQL --> SyncCopy
    Detect -->|No (Legacy Runtimes)| ReadWriteJSON
```

### Why This Architecture?
- **Zero Native Compilation:** Does not rely on `better-sqlite3` or Python build steps (`node-gyp`), eliminating cross-platform compilation failures.
- **ACID Safety:** When running under Node 22.5+, native SQLite provides atomic transactions, write-ahead logging, and sub-millisecond indexed reads.
- **Fail-Safe JSON Mirroring:** Every successful SQLite write automatically updates `data/trips.json` as a disaster-recovery backup.

---

## 2. SQLite Schema Definition (`trips.db`)

The `trips` table stores saved itineraries, multimodal price breakdowns, user notes, and embedded cultural dossiers:

```sql
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
```

### Field Definitions

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `PRIMARY KEY` | Unique trip identifier (e.g., `trip_1728584400000_abc123`). |
| `created_at` | `TEXT` | `NOT NULL` | ISO 8601 creation timestamp. |
| `origin_iata` | `TEXT` | `NOT NULL` | 3-letter IATA code of departure airport (e.g. `MCO`). |
| `origin_city` | `TEXT` | `NOT NULL` | City name of departure hub (e.g. `Orlando`). |
| `destination_iata`| `TEXT` | `NOT NULL` | 3-letter IATA code of arrival airport (e.g. `ZRH`). |
| `destination_city`| `TEXT` | `NOT NULL` | City name of arrival airport (e.g. `Zurich`). |
| `destination_country`| `TEXT` | `NOT NULL` | Country name of arrival destination. |
| `depart_date` | `TEXT` | `NOT NULL` | Departure date in `YYYY-MM-DD` format. |
| `return_date` | `TEXT` | `NULLABLE` | Optional return date in `YYYY-MM-DD` format. |
| `trip_type` | `TEXT` | `NOT NULL` | `'round'` or `'oneway'`. |
| `passengers` | `INTEGER` | `DEFAULT 1` | Total traveler count. |
| `fare_price` | `REAL` | `NULLABLE` | Base flight airfare. |
| `currency` | `TEXT` | `DEFAULT 'USD'` | Currency symbol used at save time. |
| `total_cost` | `REAL` | `NULLABLE` | Multimodal total cost (flight + transit + time valuation). |
| `savings_vs_home` | `REAL`| `NULLABLE` | Net dollar/euro savings versus home base. |
| `transfer_mode` | `TEXT` | `NULLABLE` | Overland transfer type (`train`, `coach`, `drive`). |
| `transfer_price`| `REAL` | `NULLABLE` | Overland transit ticket price. |
| `transfer_duration_hours` | `REAL` | `NULLABLE` | Overland transit travel time in hours. |
| `airline` | `TEXT` | `NULLABLE` | Operating airline name or code. |
| `booking_url` | `TEXT` | `NULLABLE` | Sanitized affiliate booking redirect URL. |
| `notes` | `TEXT` | `NULLABLE` | User-edited notes and trip planning itinerary. |
| `cultural_info` | `TEXT` | `NULLABLE` | Serialized JSON string of the attached `CountryCulturalInfo`. |

---

## 3. Core TypeScript Interfaces

### SavedTrip & CreateTripInput (`src/types/trips.ts`)
```typescript
export interface SavedTrip {
  id: string;
  createdAt: string;
  originIata: string;
  originCity: string;
  destinationIata: string;
  destinationCity: string;
  destinationCountry: string;
  departDate: string;
  returnDate?: string | null;
  tripType: "round" | "oneway";
  passengers?: number;
  farePrice?: number;
  currency: string;
  totalCost?: number;
  savingsVsHome?: number;
  transferMode?: string;
  transferPrice?: number;
  transferDurationHours?: number;
  airline?: string;
  bookingUrl?: string | null;
  notes?: string;
  culturalInfo?: CountryCulturalInfo;
}

export type CreateTripInput = Omit<SavedTrip, "id" | "createdAt"> & {
  id?: string;
};
```

### ScoredOrigin & Multimodal Breakdown (`src/types/index.ts`)
```typescript
export interface ScoredOrigin {
  airport: Airport;
  fare: Fare | null;
  groundLeg: GroundLeg;
  distanceMiles: number;
  totalCost: number;
  breakdown: {
    fare: number;
    groundCost: number;
    timeCost: number;
  };
  savingsVsHome: number;
  providerDebug: {
    provider: string;
    responseTimeMs: number;
    cacheHit: boolean;
    freshness: string;
    formulaInputs: {
      fare: number;
      groundCost: number;
      groundHours: number;
      timeValuePerHour: number;
      timeCost: number;
      total: number;
    };
  };
}
```

---

## 4. Cultural Intelligence Dossier Schema (`src/types/cultural.ts`)

```typescript
export interface CountryCulturalInfo {
  countryId: string;       // e.g. "CH"
  countryName: string;     // e.g. "Switzerland"
  alpha2: string;          // e.g. "CH"
  flagUrl?: string;
  currencyInfo?: {
    name: string;          // e.g. "Swiss Franc (CHF)"
    code: string;          // e.g. "CHF"
    tips?: string;         // Tipping expectations
    cards?: string;        // Credit card acceptance norms
  };
  emergencyInfo?: {
    police: string;        // e.g. "117"
    ambulance: string;     // e.g. "144"
    general?: string;      // e.g. "112"
    embassy?: string;
  };
  essentialItems?: Array<{
    title: string;         // e.g. "Electronics & Adaptors"
    items: string[];       // e.g. ["Type J Power Plug Adapter", "SBB Rail Pass"]
  }>;
  localCustoms?: Array<{
    title: string;
    description: string;
  }>;
  culturalTaboos?: Array<{
    title: string;
    description: string;
  }>;
  usefulPhrases?: Array<{
    phrase: string;
    translation: string;
    phonetic: string;
  }>;
}
```

---

## 5. Static Datasets

### A. Global Airport Catalog (`data/airports.json`)
Contains 200+ global commercial airports indexed by IATA code:
```json
{
  "iata": "MCO",
  "name": "Orlando International Airport",
  "city": "Orlando",
  "country": "United States",
  "lat": 28.429399,
  "lon": -81.308998,
  "metro": "ORL",
  "isHub": true,
  "tier": 1
}
```

### B. High-Speed Ground Corridors (`data/corridors.json`)
Explicit transit timings and fares between major airport pairs:
```json
{
  "origin": "TPA",
  "destination": "MCO",
  "mode": "train",
  "carrier": "Brightline / Express Shuttle",
  "durationHours": 1.4,
  "priceUSD": 26,
  "isHighSpeed": true
}
```
