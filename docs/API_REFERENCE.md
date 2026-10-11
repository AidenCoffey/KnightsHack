# 🌐 Venture — Complete API Reference

> Comprehensive specification for all Venture REST and streaming API endpoints, request schemas, response formats, and integration curl commands.

---

## 1. Summary of API Endpoints

| Endpoint | Method | Runtime | Purpose |
| :--- | :--- | :--- | :--- |
| **[`/api/reverse`](#1-get-apireverse)** | `GET` | Node.js | Reverse multi-hub flight scanner (Streams NDJSON events). |
| **[`/api/go`](#2-get-apigo)** | `GET` | Node.js | Affiliate monetization & `DDMM` URL sanitizing redirector. |
| **[`/api/trips`](#3-get--post-apitrips)** | `GET` / `POST` | Node.js | Trip itinerary database (CRUD with SQLite persistence). |
| **[`/api/trips/[id]`](#4-get--delete-apitripsid)** | `GET` / `DELETE`| Node.js | Fetch or delete an individual saved trip by ID. |
| **[`/api/cultural-info/[country]`](#5-get-apicultural-infocountry)** | `GET` | Node.js | Cultural intelligence, etiquette, taboos, and emergency guide. |
| **[`/api/radar`](#6-get-apiradar)** | `GET` | Node.js | Proximity airport discovery radar around a coordinate. |
| **[`/api/airports`](#7-get-apiairports)** | `GET` | Node.js | Fuzzy search and autocomplete airport catalog. |

---

## 2. Endpoint Details

### 1. `GET /api/reverse`
Scans all commercial departure hubs within the requested radius of the home base, retrieves live airfares and overland transit costs concurrently, and streams ranked results using newline-delimited JSON (NDJSON).

#### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `destination` | `string` | **Yes** | — | 3-letter IATA code of destination (e.g. `ZRH`, `NRT`, `JFK`). |
| `homeAirport` | `string` | No | `FCO` | 3-letter IATA code of home base (e.g. `TPA`, `MCO`). |
| `dateFrom` | `string` | **Yes** | — | Departure date (`YYYY-MM-DD`). |
| `dateTo` | `string` | No | — | Return date (`YYYY-MM-DD`) for round trips. |
| `tripType` | `string` | No | `round` | `'round'` or `'oneway'`. |
| `passengers` | `number` | No | `1` | Number of travelers (1–9). |
| `radiusMiles` | `number` | No | `300` | Search radius in miles around home base (50–500). |
| `timeValuePerHour` | `number` | No | `15` | Personal time valuation in chosen currency ($/hr). |
| `currency` | `string` | No | `EUR` | Display currency (`USD`, `EUR`, `GBP`, `CHF`, `JPY`, etc.). |

#### Stream Event Types
1. **`progress`**: Initial scan broadcast indicating candidate airports found.
   ```json
   { "type": "progress", "checked": 0, "total": 9 }
   ```
2. **`result`**: Discovered route with airfare, ground transit, and opportunity cost scoring.
   ```json
   {
     "type": "result",
     "data": {
       "airport": { "iata": "MCO", "city": "Orlando", "name": "Orlando Int'l" },
       "fare": { "price": 380, "currency": "USD", "provider": "aviasales", "airline": "Swiss" },
       "groundLeg": { "mode": "train", "duration": 1.4, "price": 26, "carrier": "Brightline" },
       "distanceMiles": 80.5,
       "totalCost": 427,
       "breakdown": { "fare": 380, "groundCost": 26, "timeCost": 21 },
       "savingsVsHome": 418
     }
   }
   ```
3. **`done`**: Emitted when all candidate hubs have completed querying.
   ```json
   { "type": "done", "total": 9 }
   ```

#### Example Request
```bash
curl -N "http://localhost:3000/api/reverse?homeAirport=TPA&destination=ZRH&dateFrom=2026-11-09&radiusMiles=300&currency=USD"
```

---

### 2. `GET /api/go`
Affiliate redirect gateway that verifies domain security, rewrites date slugs to Aviasales' strict `DDMM` format, and attaches partner marker tags.

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `url` | `string` | **Yes** | Target search or booking URL to redirect to. |
| `origin` | `string` | No | Origin IATA code for fallback generation. |
| `destination` | `string` | No | Destination IATA code for fallback generation. |
| `departDate` | `string` | No | Departure date (`YYYY-MM-DD`). |
| `returnDate` | `string` | No | Return date (`YYYY-MM-DD`). |
| `marker` | `string` | No | Partner marker (defaults to configured `708226`). |

#### Response
- **Status:** `302 Found`
- **Header:** `Location: https://www.aviasales.com/search/MCO0911ZRH16111?marker=708226&utm_source=venture`

#### Example Request
```bash
curl -I "http://localhost:3000/api/go?url=https%3A%2F%2Fwww.aviasales.com%2Fsearch%2FMCO20261109ZRH1"
```

---

### 3. `GET` & `POST /api/trips`
Interface for managing saved trips persisted in the SQLite database with automatic JSON backup sync.

#### `GET /api/trips`
Returns all saved itineraries ordered chronologically by newest creation date.

##### Example Response
```json
{
  "trips": [
    {
      "id": "trip_1728584400000_abc123",
      "createdAt": "2026-10-10T14:30:00.000Z",
      "originIata": "MCO",
      "originCity": "Orlando",
      "destinationIata": "ZRH",
      "destinationCity": "Zurich",
      "destinationCountry": "Switzerland",
      "departDate": "2026-11-09",
      "farePrice": 380,
      "savingsVsHome": 418,
      "transferMode": "train",
      "culturalInfo": { ... }
    }
  ],
  "total": 1
}
```

#### `POST /api/trips`
Saves a new itinerary to `data/trips.db` and attaches the destination cultural dossier automatically if not provided.

##### Example Request
```bash
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -d '{
    "originIata": "MCO",
    "originCity": "Orlando",
    "destinationIata": "ZRH",
    "destinationCity": "Zurich",
    "destinationCountry": "Switzerland",
    "departDate": "2026-11-09",
    "farePrice": 380,
    "totalCost": 427,
    "savingsVsHome": 418,
    "transferMode": "train",
    "airline": "Swiss International Air Lines"
  }'
```

---

### 4. `GET` & `DELETE /api/trips/[id]`
Retrieve or remove an itinerary using its unique trip ID.

#### Example Delete Request
```bash
curl -X DELETE "http://localhost:3000/api/trips/trip_1728584400000_abc123"
```
```json
{ "success": true, "deletedId": "trip_1728584400000_abc123" }
```

---

### 5. `GET /api/cultural-info/[country]`
Generates or retrieves destination-specific cultural intelligence for any country code or airport IATA.

#### Example Request
```bash
curl "http://localhost:3000/api/cultural-info/ZRH"
```

##### Example Response (Excerpt)
```json
{
  "countryId": "CH",
  "countryName": "Switzerland",
  "alpha2": "CH",
  "currencyInfo": {
    "name": "Swiss Franc (CHF)",
    "code": "CHF",
    "tips": "Service is legally included in restaurant bills, but rounding up 5-10% is customary for great service."
  },
  "emergencyInfo": {
    "police": "117",
    "ambulance": "144",
    "general": "112"
  },
  "localCustoms": [
    {
      "title": "Punctuality & Quiet Hours",
      "description": "Quiet hours (Ruhezeit) are strictly respected after 10:00 PM and all day on Sundays."
    }
  ],
  "usefulPhrases": [
    { "phrase": "Grüezi", "translation": "Hello (Swiss German)", "phonetic": "GREW-tsee" }
  ]
}
```

---

### 6. `GET /api/radar`
Scans for all airports within a given latitude and longitude radius.

#### Query Parameters
- `lat`: Target latitude (e.g. `27.9755`).
- `lon`: Target longitude (e.g. `-82.5332`).
- `radius`: Distance in miles (default `300`).

---

### 7. `GET /api/airports`
Autocomplete airport search powered by `data/airports.json`.

#### Query Parameters
- `q`: Search query string matching IATA code, city, or airport name (e.g. `?q=Orlando` or `?q=MCO`).
