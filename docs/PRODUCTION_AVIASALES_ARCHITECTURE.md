# Venture Production Architecture & Aviasales API Integration Guide

## 1. Executive Summary & Core Logic

**Venture** solves a fundamental inefficiency in modern flight booking: traditional search engines only search from the single airport code you type into the box. If you live in **Tampa (TPA)** and want to fly to **Zurich (ZRH)**, a direct or low-cost charter might exist from **Orlando (MCO)** or **Miami (MIA)** that saves **$300+**, but traditional search engines never show it to you.

Venture implements **Reverse Multi-Hub Flight Discovery**:
1. **Home Base & Radius Discovery:** Given a home airport (e.g., Tampa `TPA` or Orlando `MCO`) and a driving/transit radius (e.g., 300 miles), Venture scans all commercial airports within that radius.
2. **Ground Transit Costing:** Calculates realistic overland transit time and ground fare (via Brightline, Amtrak, regional rail, express coaches, or self-drive fuel estimates).
3. **Flight Pricing:** Concurrently fetches flight fares from all candidate departure airports to the destination.
4. **Total Opportunity Cost Scoring:** Ranks routes by the true economic cost to the traveler:

$$\text{Total Cost} = \text{Flight Fare} + \text{Ground Transit Cost} + (\text{Ground Hours} \times \text{Time Value / Hour})$$

$$\text{Net Savings vs Home Base} = \text{Home Base Total Cost} - \text{Alternate Route Total Cost}$$

5. **Affiliate Monetization:** Every route includes deep booking links tied to your Travelpayouts partner marker (`708226`). When travelers book their flight or ground transit, commissions are credited to your account.

---

## 2. The Three Travelpayouts / Aviasales APIs

Travelpayouts provides three distinct API suites. Here is how they function and how they fit into production:

### A. Aviasales Data API (Cached Prices) — *Implemented in Venture*
* **Documentation:** [Aviasales Data API Docs](https://support.travelpayouts.com/hc/en-us/articles/203956163-Aviasales-Data-API)
* **Endpoints:**
  * `GET https://api.travelpayouts.com/aviasales/v3/prices_for_dates` (flexible date searches)
  * `GET https://api.travelpayouts.com/v2/prices/latest` (broadest cached route prices)
  * `GET https://api.travelpayouts.com/v1/prices/cheap` (cheapest route prices)
* **Auth:** Header `X-Access-Token: 779f149a19333130c3483d6d1e959e05`
* **Rate Limit:** 600 requests / minute.
* **Why it's essential for Venture:**
  Scanning 10 to 25 airports in real-time requires sub-second responses. Live GDS searches take 20–30 seconds and would time out or get blocked. The Data API queries Aviasales' vast cache of recent user searches, returning cached prices in ~150ms.
* **Production Logic:**
  1. Venture queries `v3/prices_for_dates`.
  2. If the destination has a metro code (e.g. `NYC` for `JFK/EWR/LGA`, `TYO` for `NRT/HND`, `PAR` for `CDG/ORY`, `MIL` for `MXP/LIN/BGY`), it automatically resolves the metro code to maximize cache hits.
  3. If `v3` has no record for an exact day, it falls back to `v2/prices/latest`.
  4. If live cache is cold for an obscure regional pair, Venture falls back to realistic route benchmarks so the user never sees a broken interface.

### B. Aviasales Flight Search API (Real-Time Search & Multi-City)
* **Documentation:** [Aviasales Flight Search API Docs](https://support.travelpayouts.com/hc/en-us/articles/30565016140434-Aviasales-Flight-Search-API-real-time-and-multi-city-search)
* **Workflow:** Asynchronous 2-step polling:
  1. `POST /v1/flight_search` with origin, destination, dates, passengers, and signature.
  2. Receive `search_id`.
  3. Poll `GET /v1/flight_search_results?uuid={search_id}` every 1–2 seconds until search completes.
* **Latency:** 15–30 seconds.
* **Production Role:**
  In a high-scale production setup, you keep the Data API for the initial 25-airport radar scan. Once the user clicks "Select Route" on the winning candidate (e.g. Orlando MCO), you can optionally fire the Real-Time Flight Search API to confirm live seat inventory and exact gate pricing before redirecting to checkout.

### C. Affiliates Balance & Payment API
* **Documentation:** [Affiliates Balance & Payment API](https://support.travelpayouts.com/hc/en-us/articles/5169505760402-API-of-affiliates-balance-and-payment)
* **Endpoint:** `GET https://api.travelpayouts.com/v2/affiliates/balance`
* **Purpose:** Allows your backend to programmatically monitor accumulated affiliate earnings, pending payouts, and conversion volume.

---

## 3. Credentials & Setup Configuration

Your credentials have been securely configured into `.env.local`:

```ini
# --- Data Source Toggle ---
# Set to "false" to fetch live data from Aviasales
# Set to "true" to switch to offline demo data
DEMO_MOCK=false
NEXT_PUBLIC_DEMO_MOCK=false

# --- Travelpayouts / Aviasales Credentials ---
TRAVELPAYOUTS_TOKEN=779f149a19333130c3483d6d1e959e05
TRAVELPAYOUTS_MARKER=708226
```

### Verification Command
You can test your live API token anytime via terminal:

```bash
curl -s -H "X-Access-Token: 779f149a19333130c3483d6d1e959e05" \
  "https://api.travelpayouts.com/aviasales/v3/prices_for_dates?origin=MCO&destination=NYC&currency=usd&limit=5"
```

---

## 4. Affiliate Redirect & Monetization Pipeline (`/api/go`)

### Critical Aviasales Search URL Format:
Aviasales' search engine requires strict **`DDMM`** (2-digit day + 2-digit month) format in the URL path slug:
* **Round-Trip Format:** `https://www.aviasales.com/search/{ORIGIN}{DEPART_DDMM}{DEST}{RETURN_DDMM}{PASSENGERS}?marker={MARKER}`
  * *Example:* Tampa (`TPA`) to Zurich (`ZRH`), depart Nov 9 (`0911`), return Nov 16 (`1611`), 1 passenger:
    `https://www.aviasales.com/search/TPA0911ZRH16111?marker=708226`
* **One-Way Format:** `https://www.aviasales.com/search/{ORIGIN}{DEPART_DDMM}{DEST}{PASSENGERS}?marker={MARKER}`
  * *Example:* Tampa (`TPA`) to Zurich (`ZRH`) on Jan 19 (`1901`):
    `https://www.aviasales.com/search/TPA1901ZRH1?marker=708226`
* **Why 8-digit dates break:** Passing 8-digit dates (e.g. `20270119` or `YYYYMMDD`) causes Aviasales to fail with *"Oops, the search failed to launch"* because it attempts to parse day 20 and month 27 (an invalid month). Venture uses a dedicated URL generator ([`aviasales-url.ts`](file:///Users/travelwolf/.gemini/antigravity/scratch/flightdeck/src/lib/aviasales-url.ts)) and a sanitizer in `/api/go` to ensure all links use valid `DDMM` formats.

### Redirect Flow:
```
User Clicks "Book Route"
      │
      ▼
/api/go?url=https%3A%2F%2Fwww.aviasales.com...&origin=TPA&destination=ZRH
      │
      ├─ 1. Validates target URL against strict domain allowlist (aviasales.com, ryanair.com, etc.)
      ├─ 2. Sanitizes any legacy/malformed 8-digit date slugs to strict DDMM format
      ├─ 3. Injects Partner Marker: ?marker=708226
      ├─ 4. Injects UTM tags: utm_source=flightdeck&utm_medium=affiliate&utm_campaign=reverse-search
      │
      ▼
HTTP 302 Redirect to Aviasales Search Results Page
(Sets 30-day affiliate cookie, attributing booking commission to Partner 708226)
```

---

## 5. Florida Hubs & International Testing Use Cases

Venture includes built-in presets and ground corridor data for all requested hubs:

| Hub / Origin | City | Nearby Candidate Airports within Radius | Key Overland Corridors |
| :--- | :--- | :--- | :--- |
| **TPA** | Tampa, FL | PIE (10 mi), SRQ (40 mi), MCO (80 mi), SFB (98 mi), RSW (110 mi), MIA (210 mi), FLL (200 mi) | I-4 Express to Orlando ($26, 1.4h), Brightline connect to South Florida ($45) |
| **MCO** | Orlando, FL | SFB (25 mi), DAB (55 mi), TPA (80 mi), PIE (90 mi), PBI (140 mi), FLL (180 mi), MIA (195 mi) | Brightline high-speed rail directly from MCO terminal to West Palm Beach, Fort Lauderdale & Miami ($79, 3.2h) |
| **ZRH** | Zurich, Switzerland | BSL (48 mi), GVA (140 mi), MXP (130 mi), STR (90 mi), MUC (160 mi) | SBB Swiss Federal Rail to Basel ($34, 1.1h), EuroCity scenic train across Alps to Milan MXP ($45, 3.2h) |
| **PRG** | Prague, Czechia | DRS (75 mi), VIE (160 mi), MUC (160 mi), BER (180 mi), BUD (275 mi) | RegioJet / České dráhy express rail to Vienna and Dresden |
| **BUD** | Budapest, Hungary | VIE (135 mi), BTS (100 mi), PRG (275 mi), BEG (190 mi) | MÁV / Railjet high-speed rail along the Danube corridor |
| **BKK** | Bangkok, Thailand | DMK (14 mi), UTP (85 mi), HKT (430 mi) | Suvarnabhumi Airport Rail Link (ARL) ($2, 0.4h), Airport Shuttle to Don Mueang |
| **NRT / HND** | Tokyo, Japan | HND (38 mi), NRT (38 mi), IBR (45 mi) | Keisei Skyliner ($22, 0.75h) & Tokyo Monorail ($4, 0.35h) |
| **CDG / ORY** | Paris, France | ORY (20 mi), BVA (45 mi), CRL (135 mi), BRU (160 mi) | RER B & TGV high-speed rail network |
| **FRA** | Frankfurt, Germany | HHN (65 mi), CGN (95 mi), DUS (115 mi), STR (95 mi), LUX (120 mi) | ICE high-speed rail directly beneath Frankfurt Airport Terminal 1 |
| **JFK / EWR / LGA** | New York, USA | EWR (20 mi), LGA (10 mi), SWF (60 mi), HPN (30 mi), PHL (85 mi) | AirTrain + LIRR / NJ Transit ($11–$15, 0.6–0.75h) |
| **FCO / CIA** | Rome, Italy | CIA (18 mi), NAP (120 mi), FLR (145 mi), BLQ (195 mi), PSA (170 mi) | Leonardo Express train ($8, 0.55h), Frecciarossa high-speed rail to Florence & Bologna |
| **MXP / LIN / BGY** | Milan, Italy | LIN (30 mi), BGY (50 mi), TRN (80 mi), VRN (95 mi), GOA (90 mi), ZRH (130 mi) | Malpensa Express train ($13, 0.75h), Orio Shuttle to Bergamo ($10, 0.67h) |

---

## 6. Production Scaling Best Practices

When deploying Venture to production:

1. **Two-Tier Caching:**
   * **Tier 1 (In-Memory LRU):** Caches live API responses for 15 minutes to prevent redundant calls during active sessions.
   * **Tier 2 (Redis / Upstash KV):** Caches route fare results for 12 hours. Since Aviasales Data API pricing updates periodically, a 12-hour TTL dramatically cuts API usage and guarantees sub-50ms response times.
2. **Concurrency Limiting:**
   * Never fire 25 simultaneous unthrottled requests to third-party APIs.
   * Venture uses a concurrent limiter (`createLimiter(5)`), ensuring you stay well below the 600 req/min limit.
3. **Graceful Degradation:**
   * If third-party APIs experience downtime or network blips, the backend automatically serves verified benchmark fares labeled as `DEMO (Benchmark)` so the user's search session never breaks.
4. **Environment Security:**
   * Keep `TRAVELPAYOUTS_TOKEN` strictly server-side. Never expose it with `NEXT_PUBLIC_` prefixes. Client components must only query `/api/reverse` and `/api/go`.
