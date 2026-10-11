# 🎨 FlightDeck — Frontend Architecture & UI Systems

> Comprehensive technical breakdown of the FlightDeck client-side application, component hierarchy, streaming state lifecycle, geospatial visualization layer, and design system.

---

## 1. Architectural Overview & Component Hierarchy

FlightDeck's frontend is built on **Next.js 14 (App Router)**, **React 18**, **Tailwind CSS**, and **Framer Motion**. It is designed around sub-second perceived latency, progressive stream rendering, and multimodal route exploration.

```
src/app/page.tsx (Master Coordinator)
│
├── CleanSearchLanding.tsx (Primary Discovery View)
│   ├── SearchForm.tsx (Origin/Dest inputs, dates, radius slider, currency picker)
│   │   └── AirportCombobox.tsx (Fuzzy search with IATA, city, and country flags)
│   ├── TestPresetsGrid (1-click route presets: Tampa->Zurich, Rome->Tokyo, etc.)
│   ├── ScenicStopovers.tsx (Intermodal rail highlight cards)
│   └── DestinationCulturalModal.tsx (Inline country cultural teaser)
│
├── ResultsList.tsx (Ranked Multimodal Routes)
│   ├── OpportunityCostCard (Fare + ground cost + time valuation breakdown)
│   ├── BreakEvenPill (Calculated hourly value threshold)
│   ├── ProviderFreshnessBadge (Live Aviasales cache vs Benchmark indicator)
│   └── BookButton (Routes to /api/go affiliate gateway)
│
├── MapView.tsx (Lazy-Loaded Geospatial Visualizer)
│   └── MapViewInner.tsx (Leaflet Map Engine)
│       ├── RadiusCircle (Home base driving/rail catchment radius)
│       ├── GroundTransitPolyline (Train / highway connector from home to hub)
│       ├── FlightGreatCircleArc (Geodesic curved path to destination)
│       └── InteractiveHubMarker (Color-coded net savings bubble pins)
│
├── TravelReadinessDrawer / Page (src/app/travel-readiness/page.tsx)
│   ├── InteractivePackingList (Categorized checklist with progress bar)
│   ├── CulturalEtiquetteCards (Local customs, taboos, safety rules)
│   ├── UsefulPhrasesList (Phonetic spelling with 1-click clipboard copy)
│   └── CurrencyTippingGuide (Credit card prevalence & cash norms)
│
├── MyTripsModal.tsx (src/components/MyTripsModal.tsx & /my-trips)
│   ├── SavedItineraryCard (Stored routes, total savings counter, airline details)
│   └── TripNotesEditor (Local trip annotations persisted in SQLite)
│
└── DebugDrawer.tsx (Live API latency, cache hit ratios, formula inspector)
```

---

## 2. Real-Time Streaming Lifecycle (NDJSON / SSE)

Rather than waiting 5–10 seconds for all 10–25 candidate hubs to finish querying third-party flight APIs, FlightDeck uses **streaming NDJSON events** over HTTP.

```mermaid
sequenceDiagram
    autonumber
    actor User as Traveler
    participant Form as SearchForm / CleanSearchLanding
    participant Page as page.tsx Coordinator
    participant API as /api/reverse (Next.js)
    participant Results as ResultsList & MapView

    User->>Form: Submits search (e.g. Home: TPA, Dest: ZRH, Radius: 300mi)
    Form->>Page: onSearch(params)
    Page->>Page: Instantiates AbortController & sets isLoading(true)
    Page->>API: fetch('/api/reverse?...', { signal })
    
    API-->>Page: Event 1: {"type":"progress","checked":0,"total":9}
    Page->>Page: Updates progress indicator (0/9 hubs scanned)
    
    API-->>Page: Event 2: {"type":"result","data": ScoredOrigin (TPA Baseline)}
    Page->>Results: Adds baseline result; sets homeBaseCost
    
    API-->>Page: Event 3: {"type":"result","data": ScoredOrigin (MCO Orlando)}
    Page->>Results: Computes net savings; triggers Framer Motion insertion
    
    API-->>Page: Event 4: {"type":"result","data": ScoredOrigin (MIA Miami)}
    Page->>Results: Inserts and automatically sorts by lowest total cost
    
    API-->>Page: Event 5: {"type":"done","total":9}
    Page->>Page: Sets isLoading(false)
```

### Stream Consumption Implementation
Located in [`src/app/page.tsx`](file:///Users/travelwolf/.gemini/antigravity/scratch/flightdeck/src/app/page.tsx):
- Uses `response.body.getReader()` to decode raw byte chunks with `TextDecoder`.
- Handles chunk boundaries using buffer splitting on newline characters (`\n`).
- Emits real-time reactive state updates:
  ```typescript
  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const event: StreamEvent = JSON.parse(line);
      if (event.type === "result") {
        setResults((prev) => sortOrigins([...prev, event.data]));
      }
    }
  }
  ```

---

## 3. Geospatial Visualization Engine (`MapViewInner.tsx`)

FlightDeck renders an interactive, multi-layered map using **Leaflet** with dynamic client-only dynamic loading to avoid Next.js Server-Side Rendering (SSR) window errors.

### Visual Layers
1. **Home Base Catchment Radius:** A translucent SVG circle rendered around the traveler's home base (e.g., Tampa `TPA`) representing the user's selected search radius (e.g., 300 miles).
2. **Ground Transit Connectors:** A dashed line indicating overland travel (Brightline rail, ICE, or highway drive) from the home base to the alternate departure airport.
3. **Great Circle Geodesic Flight Arcs:** Curved SVG quadratic bezier arcs connecting each candidate departure hub to the destination (e.g., Orlando `MCO` $\to$ Zurich `ZRH`).
4. **Interactive Savings Markers:** Color-coded circular pin badges positioned directly above candidate airports:
   - 🟢 **Green (`#16a34a`):** Net savings $> \$100$.
   - 🟡 **Lime (`#65a30d`):** Net savings between $\$0$ and $\$100$.
   - 🟠 **Amber (`#d97706`):** Mild cost increase ($< \$50$).
   - 🔴 **Red (`#dc2626`):** Significantly more expensive than home base.

---

## 4. Reactive State & Opportunity Cost Controls

The user can manipulate economic trade-off variables in real time without triggering fresh server round-trips:

### 1. Hourly Time Value Slider (`timeValue`)
- Sliders range from **\$0/hr** (budget backpacker who values cash savings above all) to **\$100+/hr** (business traveler whose time is precious).
- **Client-Side Recalculation:** When the slider moves, `ResultsList` immediately recomputes the opportunity cost of ground travel:
  $$\text{Time Cost} = \text{Ground Transit Hours} \times \text{User Hourly Value}$$
- Results re-sort instantly using Framer Motion layout animations.

### 2. Multi-Currency Selector
- Supports `USD ($)`, `EUR (€)`, `GBP (£)`, `CHF (Fr)`, `JPY (¥)`, `CZK (Kč)`, `HUF (Ft)`, and `THB (฿)`.
- Live currency switches convert ground fares, flight prices, and savings labels instantly without losing search context.

### 3. LocalStorage Preferences Persistence
- The traveler's default home hub (`flightdeck_home_hub`) and preferred currency are cached in the browser's `localStorage` and automatically restored on return visits.

---

## 5. Travel Readiness & Cultural Intelligence Hub

Located in [`src/app/travel-readiness/page.tsx`](file:///Users/travelwolf/.gemini/antigravity/scratch/flightdeck/src/app/travel-readiness/page.tsx), this post-discovery interface turns FlightDeck into an all-in-one travel companion:

1. **Interactive Packing Checklist:**
   - Pre-populated lists tailored for the destination (e.g., power plug adapters for Switzerland Type J or UK Type G, local transit passes, weather attire).
   - Tracks check-off percentages with dynamic SVG completion progress rings.
2. **Local Customs & Taboos Dossier:**
   - Detailed dos and don'ts (e.g., tipping norms in Japan, quiet hours in Switzerland, temple dress codes in Thailand).
3. **Phonetic Phrasebook:**
   - Essential phrases (*Hello*, *Thank You*, *Emergency Assistance*, *Do you take card?*) with phonetic transcriptions and a 1-click clipboard copy utility.
4. **Emergency Quick-Dial Directory:**
   - Official police, ambulance, general emergency numbers, and embassy coordinates.

---

## 6. Design System & Accessibility

- **Modern Palette:** Deep slate surfaces (`bg-slate-900`, `bg-slate-850`), subtle borders (`border-slate-800`), and vibrant indigo/emerald accents (`bg-indigo-600`, `bg-emerald-500`).
- **Responsive Layout:**
  - **Desktop:** Split-screen layout with interactive search/results on the left and sticky geospatial radar map on the right.
  - **Mobile:** Tabbed switcher (`List View` vs `Map View`) optimized for touch navigation.
- **Micro-Interactions:** Smooth Framer Motion card insertions, hover elevation, and spring-based accordion expansions.
