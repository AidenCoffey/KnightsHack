# Venture — 6-Minute Hackathon Prep

> One-page delivery plan: how to present, exact timing, demo script, and judge Q&A.  
> Technical depth lives in [HACKATHON_PRESENTATION.md](./HACKATHON_PRESENTATION.md) — this file is for **standing up and winning the room**.

---

## 1. The One Sentence You Must Own

**"Google Flights searches from an airport. Venture searches from where you are — and tells you if driving or taking the train to another hub is actually cheaper."**

If you forget everything else, say that, show Tampa → Zurich saving ~$400 via Orlando, then sit down.

---

## 2. How to Present (Style, Not Slides)

| Do | Don't |
| :--- | :--- |
| Speak like a product story: problem → aha → proof → why it matters | Dump architecture for 3 minutes before the demo |
| Demo is the star (~3 of 6 minutes) | Narrate every UI label |
| Use **one concrete number** repeatedly: **~$419 net savings** (TPA→ZRH via MCO) | Vague claims like "we save users money" |
| Stand slightly to the side of the screen; point at the winning card and the map | Read from notes while staring at the laptop |
| Pause 1 beat after the savings reveal — let judges react | Rush into Travel Readiness before they absorb the core insight |
| End with business + reliability (affiliate + offline fallback), not "thanks for your time" alone | End on a feature laundry list |

**Voice:** Confident, slightly conversational, zero jargon unless a judge asks.  
**Energy peaks:** (1) hand-raise hook, (2) savings reveal, (3) "and we monetize / don't die on stage."

**If you only have slides (optional, max 3):**
1. Title + one-liner  
2. Problem visual: TPA $845 vs MCO $380 + ground  
3. Architecture one-box (optional — only if judges want tech; prefer live app)

Prefer **live product over slides**. One backup screenshot of the winning TPA→ZRH result is enough if Wi‑Fi dies.

---

## 3. Exact 6-Minute Clock

| Time | Block | Goal |
| ---: | :--- | :--- |
| **0:00–0:45** | Hook + problem | Make the pain visceral |
| **0:45–1:30** | Solution + formula (one line) | Frame what they're about to see |
| **1:30–4:00** | Live demo (core) | Prove the aha |
| **4:00–5:00** | Demo (readiness + save + book) | Show product depth + monetization |
| **5:00–5:45** | Why we win / tech credibility | Judges remember "built for real" |
| **5:45–6:00** | Close + ask | Clear ask / thank you |

**Buffer rule:** If demo runs long, cut Scenic Stopovers and packing checklist details — keep savings + map + Book Route.

---

## 4. Minute-by-Minute Script (Memorize the Bold Lines)

### 0:00–0:45 — Hook

> **"Raise your hand if you've ever opened Google Flights for Tampa, then Orlando, then Miami, trying to find the cheap way out."**  
> Traditional search treats airports like islands. You live in a *region*. In Tampa to Zurich, home base can show **$850+** while Orlando is **~$380** — and Orlando is about **80 miles** away on Brightline or I‑4. Legacy tools never add that trade-off. We built **Venture**.

### 0:45–1:30 — Solution (no deep tech yet)

> Venture starts from **where you are**, scans every commercial airport in your driving/rail radius, adds **ground cost + your time**, and ranks by **true total cost**:  
> **Total = flight + ground + (hours × your $/hour).**  
> Then it goes further: cultural readiness, saved trips, and bookable affiliate links. You'll see it live.

*(Optional 5-second gesture toward the formula on a slide or Debug drawer — don't derive it.)*

### 1:30–4:00 — Live Demo (core — practice until muscle memory)

**Setup before you speak:** `localhost:3000` open, browser zoom ~110%, DevTools closed, My Trips empty or tidy.

1. **Click preset: Tampa → Zurich** (or pre-fill origin/dest/radius 300).  
2. **Narrate the stream:**  
   > "Watch — we're scanning Florida hubs live, not waiting for a spinner."  
3. **Point at the winning card (MCO / Orlando):**  
   > "Tampa baseline ~$845. Orlando ~$380. Add ~$25 ground and time at $15/hour — **Venture still nets about $419 in economic savings.** That's the product."  
4. **Open the map:** radius around Tampa → ground line to Orlando → flight arc to Zurich.  
   > "One view: catchment, overland, and the flight."  
5. *(If time)* briefly mention Scenic Stopovers / rail as "transit as part of the trip, not a penalty."

### 4:00–5:00 — Depth + money

1. **Save to My Trips** → open Travel Readiness / cultural dossier for Switzerland:  
   > "Booking is half the trip. We attach etiquette, emergencies, phrases, packing — so you leave ready."  
2. **Book Route** (or hover the link):  
   > "Booking goes through our `/api/go` gateway — sanitized dates, allowlisted domains, Travelpayouts marker — so we can monetize without open redirects."

### 5:00–5:45 — Credibility close

Pick **two** of these (not all):

- **Streaming NDJSON** so results appear as hubs complete (feels instant).  
- **Concurrency limiter + Aviasales cache** so scanning 10–25 airports doesn't melt rate limits.  
- **SQLite trips + cultural attach** on save.  
- **67 tests** + **benchmark fallback** so the demo (and users) never see a blank screen.  
- **Stack:** Next.js 14, Leaflet, Framer Motion, Travelpayouts/Aviasales + Ryanair path.

> **"We didn't just build a pretty search UI — we built a reverse multi-hub engine with a real cost model, a map that explains the trade-off, readiness after you pick, and a path to revenue."**

### 5:45–6:00 — Close

> **"Venture: search from where you are, not from one airport code. Happy to take questions."**

---

## 5. Demo Checklist (Night Before + 30 Minutes Before)

### Night before
- [ ] `npm test` — all green (expect ~67)  
- [ ] `npm run dev` — Tampa→Zurich preset works cold  
- [ ] Confirm fallback still shows ranked results if you kill the API key briefly  
- [ ] One backup: screenshot or short screen recording of the winning result + map  
- [ ] Memorize: **problem → $419 → map → readiness → book → close**

### 30 minutes before
- [ ] Laptop charged; power cable; dongle/HDMI tested  
- [ ] Wi‑Fi known; hotspot ready as backup  
- [ ] Browser: one tab Venture, bookmarks for `/my-trips` / readiness if needed  
- [ ] Zoom UI; hide bookmarks bar; Do Not Disturb / Slack muted  
- [ ] Pre-warm one search so cache is hot (faster on stage)  
- [ ] Water; notes = 5 bullets max on a sticky, not a script page

### On stage kill-switches
| Failure | What you say | What you do |
| :--- | :--- | :--- |
| Live API slow/empty | "We're on the offline benchmark path — same ranking logic." | Point at results that still stream |
| Map blank | "Core insight is in the ranked cards — map is the explainer." | Stay on ResultsList |
| Wrong city | Soft joke, click preset again | Don't debug live >15s |
| Total freeze | "Here's the recorded run — same Tampa→Zurich save." | Switch to backup video/screenshot |

---

## 6. What Judges Are Scoring (Aim Your Minutes)

Typical hackathon rubrics map cleanly to Venture:

| Criterion | Your proof in 6 minutes |
| :--- | :--- |
| **Problem clarity** | Hand-raise + TPA vs MCO story |
| **Innovation** | Reverse multi-hub + opportunity-cost ranking (not "another flight UI") |
| **Execution / demo** | Live stream, map, savings badge |
| **Technical depth** | SSE, providers, scoring, SQLite, affiliate gateway, tests |
| **Impact / business** | Real $ savings + Travelpayouts monetization |
| **Polish / UX** | Motion, map, readiness — show don't claim |

**Unique wedge vs Google Flights / Skyscanner:** they optimize airfare from one origin IATA. You optimize **traveler economics across a catchment**.

---

## 7. Anticipated Questions & Strong Answers

Memorize the **bold first sentence**; expand only if they dig in.

### Product & market

**Q: Isn't this just "search multiple airports"?**  
**A: "Manual multi-airport search doesn't price ground or time — we do, and we rank on total economic cost."**  
Google/Kayak may let you add nearby airports, but they don't model Brightline/$25/1.4h vs your hourly value, and they don't stream a regional radar with net-savings vs home base.

**Q: Who is the user?**  
**A: "Regional travelers near secondary cities — Tampa, secondary EU cities — who can reach a mega-hub in under ~3 hours."**  
Also price-sensitive leisure and digital nomads who already take trains to fly.

**Q: Why would someone drive 2 hours to save $200?**  
**A: "That's why time value is a slider — at $15/hr it might win; at $100/hr home base wins. We surface the break-even; we don't moralize."**

**Q: What about luggage, parking, risk of missed connection on the ground?**  
**A: "v1 models fare + corridor + time; next we'd add parking, reliability buffers, and minimum connection margins."**  
Honest scope = maturity, not weakness.

**Q: Competitor / why won't Google just ship this?**  
**A: "They optimize for booking volume from a typed airport; our wedge is catchment economics and intermodal corridors as first-class data."**  
Distribution is their moat; specialization + affiliate + readiness is ours for a hackathon/startup wedge.

### Technical

**Q: How do you get prices fast for 20 airports?**  
**A: "Cached Aviasales/Travelpayouts Data API (~hundreds of ms), concurrency capped at 5, results streamed as NDJSON so the UI fills in immediately."**  
Live GDS would be too slow for a multi-hub scan.

**Q: What if the API is down on stage?**  
**A: "Deterministic benchmark fallback — same scoring pipeline, so the product never blanks."**

**Q: How does scoring work?**  
**A: "C_total = flight + ground + hours × $/hr; savings = home C_total − alternate C_total. Positive savings gets the badge."**

**Q: How do you pick nearby airports?**  
**A: "Haversine distance from home coordinates against our airports dataset, filtered by the user's radius."**

**Q: Ryanair vs Aviasales?**  
**A: "Provider router — Aviasales for broad cache, Ryanair path for EU LCC coverage, benchmark as last resort."**

**Q: Where do trips live?**  
**A: "SQLite via node:sqlite with JSON backup sync — zero-ops persistence for saved itineraries and attached cultural dossiers."**

**Q: Security on Book?**  
**A: "Allowlisted redirect domains, DDMM date-slug sanitization, injected partner marker — no open redirect."**

**Q: Tests?**  
**A: "Sixty-seven Vitest tests across scoring, haversine, providers, currency/cache, trips DB/API, cultural."**

**Q: Why SSE/NDJSON not WebSockets?**  
**A: "One-way progress stream over HTTP is enough; simpler for a Next route and proxies."**

### Business & ethics

**Q: How do you make money?**  
**A: "Travelpayouts/Aviasales affiliate — marker 708226 on /api/go booking redirects."**

**Q: Are prices always bookable?**  
**A: "Data API is cache-based; we deep-link into search/checkout. Cache can differ from live seat — standard meta-search trade-off; we show freshness where we can."**

**Q: Ground prices accurate?**  
**A: "Corridor matrix with realistic rail/coach/drive estimates for key routes — not a full GDS for trains yet; enough to rank the trade-off correctly for the demo corridors."**

**Q: Cultural data source / accuracy?**  
**A: "Curated country dossiers via our cultural API with fallbacks — assistance layer, not legal advice; packing and etiquette for traveler confidence."**

### Curveballs

**Q: What would you build next week?**  
**A: "Parking + reliability buffers, more EU high-speed corridors, return-trip ground symmetry, and alerting when an alternate hub flips cheaper."**

**Q: Biggest risk?**  
**A: "Cache coverage on thin routes and corridor data completeness — mitigated by metro codes, provider fallback, and expanding the corridor dataset."**

**Q: What did you learn?**  
**A: "Perceived speed (streaming) matters as much as absolute latency when fan-out is 10–25 origins."**

**Q: Team / what did you build?**  
*(Customize.)* Be specific: e.g. "I own reverse search + scoring + demo narrative" / "I own map + readiness UI." Judges punish vague "we all did everything."

---

## 8. 60-Second Elevator (If They Cut You Short)

> Google Flights assumes one airport. Venture scans your whole region, adds train or drive cost and your time, and ranks by true total cost. Tampa to Zurich: Orlando can win by roughly **four hundred dollars** after ground. We stream results live, show it on a map, save trips with cultural readiness, and monetize through Aviasales affiliate links — with offline fallback so it always works. That's Venture.

---

## 9. Rehearsal Plan (Do This Twice)

1. **Full run with timer** (phone, 6:00). Record audio once — cut filler words.  
2. **Demo-only run** (3:00) with Wi‑Fi off once → practice fallback narration.  
3. **Q&A drill:** friend asks 5 random questions from §7; answer in ≤30 seconds each.  
4. **Cold open:** start from sleep/login once so day-of isn't the first boot.

**Target pace:** ~140 words/minute when explaining; slower on the savings number.

---

## 10. Day-Of Cheat Card (Print or Sticky Note)

```
HOOK     → islands vs region
FORMULA  → flight + ground + time×$/hr
DEMO     → Tampa→Zurich → $419 → MAP
DEPTH    → save → readiness → Book /api/go
CLOSE    → catchment search + revenue + fallback
IF BROKEN→ benchmark path, same ranking
```

---

## Related Docs

- [Full presentation & architecture diagrams](./HACKATHON_PRESENTATION.md)  
- [Backend](./BACKEND_ARCHITECTURE.md) · [Frontend](./FRONTEND_ARCHITECTURE.md) · [API](./API_REFERENCE.md) · [Aviasales production](./PRODUCTION_AVIASALES_ARCHITECTURE.md)
