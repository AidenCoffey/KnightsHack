# 🎮 Venture — Live Demo Runbook & Rehearsal Checklist

> **Goal:** Flawless 3-minute live product demo execution with zero awkward pauses, zero blank screens, and maximum judge impact.

---

## 📋 1. Pre-Flight Setup Checklist (T-minus 15 Minutes)

Before you walk up to present, ensure your laptop is configured exactly as follows:

| Item | Action | Verified? |
| :--- | :--- | :---: |
| **Dev Server Running** | Run `npm run dev` in `/Users/travelwolf/.gemini/antigravity/scratch/flightdeck`. Confirm server responds at `http://localhost:3000`. | [ ] |
| **Browser Tabs Prepared** | Have exactly 2 tabs open in Google Chrome or Safari: <br>• **Tab 1:** `presentation.html`Presentation slide deck. <br>• **Tab 2:** `http://localhost:3000` (Venture live web app). | [ ] |
| **Display Zoom** | Set browser zoom to **110%** or **125%** so typography and prices are easily readable from 20 feet away. | [ ] |
| **DevTools Closed** | Close Chrome DevTools / Console to keep the screen uncluttered and clean. | [ ] |
| **Do Not Disturb** | Turn on macOS **Do Not Disturb / Focus Mode** to block Slack, Discord, or iMessage notifications. | [ ] |
| **Database Cleaned** | Make sure `trips.db` is initialized and tidy (no duplicate test clutter). | [ ] |
| **Audio / Mute** | Mute system alert audio so accidental keyboard chimes don't trigger during the demo. | [ ] |

---

## 🎬 2. The 3-Minute Demo Choreography (Step-by-Step)

### Step 1: Reveal the Live Interface (0:00 into Demo)
- **Screen:** Switch seamlessly from `presentation.html` (Slide 5) to `http://localhost:3000`.
- **Narration:** *"This isn't a Figma prototype or video capture—this is a live, production Next.js 14 application."*

### Step 2: Select the Flagship Route (0:20)
- **Origin:** Select or type **Tampa (`TPA`)**.
- **Destination:** Select or type **Zurich (`ZRH`)**.
- **Catchment Radius:** Leave at or adjust to **300 miles**.
- **Action:** Click **"Discover Routes"** / Search button.

### Step 3: Highlight the Streaming Pipeline (0:40)
- **What happens:** Cards begin popping into the feed asynchronously.
- **Narration:** *"Notice what happens: We don't freeze the screen with a loading spinner. Our backend uses Server-Sent Events with NDJSON streaming. As each candidate hub like Orlando, Miami, and Fort Lauderdale finishes fare evaluation, it mounts to the screen in real-time."*

### Step 4: The Core "Aha" Moment (1:10)
- **Action:** Point directly at the top winning card: **Orlando (MCO)**.
- **Point out the numbers:**
  - Raw Tampa direct baseline: **$845**
  - Orlando international airfare: **$380**
  - Overland transit fare: **$25 (Brightline high-speed rail)**
  - Opportunity cost of time: **1.3 hours @ $15/hr ($19.50)**
  - **Net Traveler Savings:** **+$420.50** (nearly 50% discount!).
- **Action:** Toggle or drag the **Hourly Wage Slider** slightly.
- **Narration:** *"Even if a traveler values their time at $50 or $100 an hour, taking Brightline to Orlando still saves hundreds of dollars."*

### Step 5: The Geospatial Radar Map (1:50)
- **Action:** Click or expand the **Interactive Map**.
- **Point out:**
  1. The **blue circle** showing the 300-mile overland catchment radius around Tampa.
  2. The **amber line** depicting the ground corridor connecting Tampa to Orlando International.
  3. The **great-circle arc** tracing the transatlantic flight directly into Zurich Airport.
- **Narration:** *"For the first time, travelers see their entire regional transit catchment in a single unified geospatial radar."*

### Step 6: Travel Readiness & Cultural Intelligence (2:20)
- **Action:** Click the **Swiss Cultural Dossier** button on the card.
- **Point out:**
  - Emergency numbers: Police (117), Medical (144), General EU (112).
  - Cultural taboos: Sunday noise restrictions, Swiss rail punctuality.
  - Essential phonetic phrases: *"Grüezi mitenand"*.
  - Electrical plug standards: Type C & J.
- **Narration:** *"Legacy flight engines leave travelers at checkout. Venture equips travelers with everything they need before they set foot on the plane."*

### Step 7: Persistence & Monetization (2:45)
- **Action 1:** Click **"Save to My Trips"** → Open the My Trips drawer.
  - *"Instantly saved to our native Node 22 SQLite database (`trips.db`)."*
- **Action 2:** Hover or click **"Book Route"**.
  - *"Every booking redirects through our secure `/api/go` gateway, formatting clean `DDMM` date slugs and attaching our Travelpayouts / Aviasales affiliate marker `708226` to generate $15 to $35 in commission per booking."*

---

## 🛡️ 3. Stage Kill-Switches & Fallback Scenarios

| Scenario | What Could Go Wrong | The Immediate Solution |
| :--- | :--- | :--- |
| **Wi-Fi Dies Completely** | Venue Wi-Fi drops mid-presentation. | **Built-in Fallback:** The backend automatically catches network failures and seamlessly serves deterministic benchmark fares. The UI will stream without any error messages. |
| **Aviasales API 429 Rate Limit** | Too many live queries in a short window. | **Built-in Limiter:** Our `p-limit: 5` concurrency throttler and two-tier in-memory cache prevent rate spikes. |
| **Port 3000 Crashes** | Accidentally closed the terminal. | Open terminal, run `npm run dev`, refresh `http://localhost:3000`. It restarts in under 2 seconds. |
| **Running Short on Time (< 1 Min Left)** | Moderator signals 1 minute remaining. | **Skip Step 6 (Cultural Dossier)**. Go straight from the $420 savings reveal to the monetization `/api/go` link and close! |
