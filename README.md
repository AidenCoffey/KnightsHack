# Venture — Curated Flight & Overland Travel Atlas

> **Curiosity-driven expedition flight & rail discovery. Discover cheaper long-haul departures via regional hubs & ground transit corridors with all-in trip economics.**

Venture is a premium travel discovery platform and atlas designed for modern travelers. Venture reverses conventional flight search: instead of being trapped in a single airport silo, it scans all commercial departure hubs within a traveler's overland transit radius, factors in ground transit costs (high-speed rail, express coach, drive) and travel time, and calculates the true opportunity cost to determine if departing from an alternate hub delivers net savings and an elevated journey.

---

## ⚡ The Core Problem & Value Proposition

Traditional flight search engines (Google Flights, Skyscanner) search from a single airport silo. If you live in **Tampa (TPA)** and want to fly to **Zurich (ZRH)**, a direct or low-cost flight might exist from **Orlando (MCO)** or **Miami (MIA)** that saves **$300+**, but traditional search engines never show it to you.

Venture implements **Reverse Multi-Hub Flight Discovery**:
1. **Home Base & Radius Discovery:** Scans all commercial airports within a customizable driving/rail radius (up to 300+ miles).
2. **Ground Corridor Costing:** Computes realistic overland transit time and ground fare (Brightline, Amtrak, Frecciarossa, SBB, ICE, TGV, express coaches, or driving fuel).
3. **Flight Pricing:** Concurrently queries live flight fare caches via the Travelpayouts / Aviasales Data API with metro-code resolution.
4. **True Opportunity Cost Formula:** Evaluates routes using the true economic cost to the traveler:
   $$\text{Total Cost} = \text{Flight Fare} + \text{Ground Transit Cost} + (\text{Ground Hours} \times \text{User Hourly Value})$$
   $$\text{Net Savings vs Home Base} = \text{Home Base Total Cost} - \text{Alternate Route Total Cost}$$
5. **Travel Readiness & Cultural Intelligence:** Generates destination-specific dossiers (etiquette, cultural taboos, emergency contacts, local phrases with phonetic guides, packing checklists).
6. **Affiliate Monetization:** Safe redirects via `/api/go` sanitize query parameters into strict `DDMM` date slugs and inject partner marker (`708226`) for commission tracking.

---

## 📚 Modular Documentation Index

The technical documentation has been modularized into focused deep-dive guides:

| Document | Focus & Highlights |
| :--- | :--- |
| **[6-Minute Pitch Script & Timing](file:///Users/travelwolf/.gemini/antigravity/scratch/flightdeck/docs/PITCH_SCRIPT_AND_TIMING.md)** | Verbatim minute-by-minute pitch script, audience opening hook, demo commentary, and closing ask. |
| **[Live Demo Runbook](file:///Users/travelwolf/.gemini/antigravity/scratch/flightdeck/docs/DEMO_RUNBOOK.md)** | Pre-flight laptop checklist, step-by-step click choreography, and stage fallback kill-switches. |
| **[Judge Q&A Defense Bank](file:///Users/travelwolf/.gemini/antigravity/scratch/flightdeck/docs/JUDGE_QA_DEFENSE.md)** | 12 battle-tested answers to the toughest judge questions (Google moat, luggage logistics, API limits, unit economics). |
| **[Frontend Architecture](file:///Users/travelwolf/.gemini/antigravity/scratch/flightdeck/docs/FRONTEND_ARCHITECTURE.md)** | Component hierarchy, NDJSON streaming consumption, Leaflet geospatial visualization, reactive opportunity cost sliders, Framer Motion animations, and Travel Readiness UI. |
| **[Backend Architecture](file:///Users/travelwolf/.gemini/antigravity/scratch/flightdeck/docs/BACKEND_ARCHITECTURE.md)** | Next.js server runtime, Haversine proximity scanning, concurrency limiting (`createLimiter(5)`), provider routing, ground corridor matrix, and `/api/go` monetization pipeline. |
| **[Database & Data Models](file:///Users/travelwolf/.gemini/antigravity/scratch/flightdeck/docs/DATABASE_AND_DATA_MODELS.md)** | Native SQLite dual-engine persistence (`trips.db` via `node:sqlite`), automated JSON backup sync, SQL schema definitions, TypeScript interfaces, and static dataset schemas. |
| **[API Reference](file:///Users/travelwolf/.gemini/antigravity/scratch/flightdeck/docs/API_REFERENCE.md)** | Complete HTTP API documentation for `/api/reverse`, `/api/go`, `/api/trips`, `/api/cultural-info`, `/api/radar`, and `/api/airports` with curl examples. |
| **[Hackathon Presentation Guide](file:///Users/travelwolf/.gemini/antigravity/scratch/flightdeck/docs/HACKATHON_PRESENTATION.md)** | Presentation pitch deck, high-impact Mermaid architecture diagrams, ER schemas, data flow sequence diagrams, and demo walkthrough. |
| **[Production Aviasales Integration](file:///Users/travelwolf/.gemini/antigravity/scratch/flightdeck/docs/PRODUCTION_AVIASALES_ARCHITECTURE.md)** | Deep dive into the 3 Travelpayouts APIs, `DDMM` URL path formatting rules, two-tier caching, and rate limiting. |

---

## 🛠️ System Overview & API Routing

```
Client (Next.js 14 / React / Leaflet)
  │
  ├──► /api/reverse               -> Server-Sent Events (SSE) scanner across candidate hubs
  ├──► /api/go                    -> DDMM URL sanitizer & Travelpayouts affiliate redirect
  ├──► /api/trips & /api/trips/:id -> SQLite persistent trip storage with attached cultural info
  ├──► /api/cultural-info/:country -> Destination customs, taboos, phrases, and emergency data
  ├──► /api/radar                 -> Proximity airport discovery
  └──► /api/airports              -> Airport autocomplete search
```

---

## 🧪 Testing & Quality Assurance

Venture includes an automated test suite with **79 passing tests** across 10 test suites using Vitest:

```bash
npm test
```

```
✓ tests/airports.test.ts (5 tests)
✓ tests/cultural.test.ts (6 tests)
✓ tests/currency_and_cache.test.ts (8 tests)
✓ tests/flexible_dates.test.ts (6 tests)
✓ tests/haversine.test.ts (7 tests)
✓ tests/providers.test.ts (22 tests)
✓ tests/scoring.test.ts (13 tests)
✓ tests/suitcase_transition.test.ts (2 tests)
✓ tests/trips_api.test.ts (4 tests)
✓ tests/trips_db.test.ts (6 tests)

Test Files  10 passed (10)
     Tests  79 passed (79)
```

---

## 🚀 Quickstart

### 1. Prerequisites
- Node.js 18+ (Node 22.5+ recommended for native `node:sqlite`)
- npm or yarn

### 2. Installation & Run
```bash
# Enter directory
cd flightdeck

# Install dependencies
npm install

# Run automated tests
npm test

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to launch Venture.
