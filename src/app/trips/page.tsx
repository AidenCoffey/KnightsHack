"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Trash2,
  ExternalLink,
  Globe,
  Coins,
  AlertTriangle,
  Luggage,
  Sparkles,
  Check,
  StickyNote,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  TrendingUp,
  CheckSquare,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import type { SavedTrip } from "@/types/trips";
import type { CountryCulturalInfo } from "@/types/cultural";
import { getCountryFlag } from "@/lib/cultural-utils";
import { CULTURAL_FALLBACK_DATA, resolveCountryKey } from "@/lib/cultural-fallback";
import { getCurrencySymbol } from "@/lib/currency";
import { useSuitcaseTransition } from "@/components/SuitcaseTransitionProvider";

export default function MyTripsPage() {
  const { triggerTransition } = useSuitcaseTransition();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
  
  // Exactly 4 tabs: checklist, phrases, customs, forex
  const [activeCultureTab, setActiveCultureTab] = useState<
    Record<string, "checklist" | "phrases" | "customs" | "forex">
  >({});

  // Auto-saving notes state
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [notesStatus, setNotesStatus] = useState<Record<string, "idle" | "saving" | "saved">>({});
  const noteTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Packing checklist states
  const [checkedItemsByDest, setCheckedItemsByDest] = useState<Record<string, Record<string, boolean>>>({});
  
  // Cultural & Travelwolf API data per destination
  const [culturalDataByDest, setCulturalDataByDest] = useState<Record<string, CountryCulturalInfo>>({});

  // Forex rate cache per trip & currencies
  const [forexByTrip, setForexByTrip] = useState<Record<string, any>>({});
  const [isForexLoading, setIsForexLoading] = useState<Record<string, boolean>>({});

  // Trip to delete confirmation popup modal
  const [tripToDelete, setTripToDelete] = useState<SavedTrip | null>(null);

  // Global currency selector state (synced with Venture navbar)
  const [currency, setCurrency] = useState("USD");
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  // Close currency dropdown on outside click or Escape
  useEffect(() => {
    if (!currencyDropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
        setCurrencyDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCurrencyDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currencyDropdownOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCurr = localStorage.getItem("venture_currency");
      if (savedCurr && ["USD", "EUR", "GBP"].includes(savedCurr)) {
        setCurrency(savedCurr);
      }
    }
  }, []);

  const handleCurrencyChange = (newCurr: string) => {
    setCurrency(newCurr);
    if (typeof window !== "undefined") {
      localStorage.setItem("venture_currency", newCurr);
    }
  };

  // Format transit journey mode cleanly (e.g. "Bus then Plane", "Train then Plane", "Plane")
  const formatTransitJourney = (transferMode?: string) => {
    if (!transferMode) return "Plane";
    const mode = transferMode.toLowerCase().trim();
    if (mode === "bus") return "Bus then Plane";
    if (mode === "train" || mode === "rail") return "Train then Plane";
    if (mode === "flight" || mode === "plane" || mode === "direct") return "Plane";
    return `${transferMode} then Plane`;
  };

  // Clean tipping guidelines into crisp, readable points
  const getStructuredTippingNorms = (tipsText?: string) => {
    if (!tipsText) {
      return [
        { label: "Restaurants & Dining", text: "Service charge is typically included. 5–10% extra is customary for attentive service." },
        { label: "Taxis & Transport", text: "Round up to the nearest convenient bill or coin; tips are appreciated but not expected." },
        { label: "Cash Etiquette", text: "Carry modest local banknotes as small vendors and market stalls prefer cash." },
      ];
    }

    const rawList = tipsText
      .split(/[\n•\r]+/)
      .map((s) => s.trim().replace(/^[-*•\s]+/, ""))
      .filter((s) => s.length > 5);

    if (rawList.length === 0) {
      return [
        { label: "General Etiquette", text: "Standard international travel norms apply; round up for polite dining." },
      ];
    }

    const categories = ["Restaurants & Dining", "Taxis & Transport", "Cash & Small Vendors", "Hotel Concierge"];
    return rawList.slice(0, 3).map((text, idx) => ({
      label: categories[idx] || "Local Guideline",
      text,
    }));
  };

  // Load saved trips from SQLite backend
  const loadTrips = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trips");
      if (!res.ok) throw new Error(`Failed to load trips (${res.status})`);
      const data = await res.json();
      const loadedTrips: SavedTrip[] = data.trips || [];
      setTrips(loadedTrips);

      if (loadedTrips.length > 0 && !expandedTripId) {
        setExpandedTripId(loadedTrips[0].id);
      }

      // Initialize packing checklist states from local storage & API
      loadedTrips.forEach((trip) => {
        const destKey = trip.destinationIata.toUpperCase();
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem(`venture_packing_${destKey}`);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              setCheckedItemsByDest((prev) => ({ ...prev, [destKey]: parsed }));
            } catch {
              // Ignore cache parse error
            }
          }
        }

        // Sync from SQLite database backend
        fetch(`/api/packing-checklist?dest=${encodeURIComponent(destKey)}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((pData) => {
            if (pData?.checkedItems) {
              setCheckedItemsByDest((prev) => ({
                ...prev,
                [destKey]: { ...prev[destKey], ...pData.checkedItems },
              }));
            }
          })
          .catch(() => {});
      });
    } catch (err) {
      console.error("Error fetching trips:", err);
      setError("Unable to load saved trips from the local database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  // Fetch Travelwolf cultural info & full packing checklist when a trip is expanded
  useEffect(() => {
    if (!expandedTripId) return;
    const trip = trips.find((t) => t.id === expandedTripId);
    if (!trip) return;
    const destKey = trip.destinationIata.toUpperCase();
    if (culturalDataByDest[destKey]) return;

    fetch(`/api/cultural-info/${encodeURIComponent(destKey)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: CountryCulturalInfo) => {
        if (data) {
          setCulturalDataByDest((prev) => ({ ...prev, [destKey]: data }));
        }
      })
      .catch(() => {});
  }, [expandedTripId, trips, culturalDataByDest]);

  // Fetch live Forex API rates when a trip is expanded
  useEffect(() => {
    if (!expandedTripId) return;
    const trip = trips.find((t) => t.id === expandedTripId);
    if (!trip) return;

    const destKey = trip.destinationIata.toUpperCase();
    const culture = culturalDataByDest[destKey] || trip.culturalInfo;
    let targetCurrency = culture?.currencyInfo?.code || "EUR";

    // Fallbacks for known destinations if code is default
    if (!targetCurrency || targetCurrency === "EUR") {
      if (["NRT", "HND", "KIX"].includes(destKey)) targetCurrency = "JPY";
      else if (["IST", "SAW", "AYT"].includes(destKey)) targetCurrency = "TRY";
      else if (["BKK", "HKT"].includes(destKey)) targetCurrency = "THB";
      else if (["LHR", "LGW", "MAN"].includes(destKey)) targetCurrency = "GBP";
      else if (["JFK", "MCO", "MIA", "LAX", "ORD"].includes(destKey)) targetCurrency = "USD";
      else if (["ZRH", "GVA", "BSL"].includes(destKey)) targetCurrency = "CHF";
      else if (["PRG"].includes(destKey)) targetCurrency = "CZK";
      else if (["BUD"].includes(destKey)) targetCurrency = "HUF";
    }

    const fxKey = `${trip.id}_${currency}_${targetCurrency}`;
    if (forexByTrip[fxKey]) return;

    setIsForexLoading((prev) => ({ ...prev, [trip.id]: true }));
    fetch(`/api/forex?from=${encodeURIComponent(currency)}&to=${encodeURIComponent(targetCurrency)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setForexByTrip((prev) => ({ ...prev, [fxKey]: data }));
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsForexLoading((prev) => ({ ...prev, [trip.id]: false }));
      });
  }, [expandedTripId, trips, currency, culturalDataByDest, forexByTrip]);

  // Handle trip deletion
  const handleDeleteTrip = async (id: string) => {
    try {
      const res = await fetch(`/api/trips/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setTrips((prev) => prev.filter((t) => t.id !== id));
      setTripToDelete(null);
    } catch (err) {
      console.error("Delete trip error:", err);
      alert("Failed to delete trip.");
    }
  };

  // Debounced auto-save on notes (no save button)
  const handleNotesChange = (tripId: string, val: string) => {
    setEditingNotes((prev) => ({ ...prev, [tripId]: val }));
    setNotesStatus((prev) => ({ ...prev, [tripId]: "saving" }));

    if (noteTimers.current[tripId]) {
      clearTimeout(noteTimers.current[tripId]);
    }

    noteTimers.current[tripId] = setTimeout(async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: val }),
        });
        if (res.ok) {
          setTrips((prev) => prev.map((t) => (t.id === tripId ? { ...t, notes: val } : t)));
          setNotesStatus((prev) => ({ ...prev, [tripId]: "saved" }));
          setTimeout(() => {
            setNotesStatus((prev) => ({ ...prev, [tripId]: "idle" }));
          }, 2500);
        }
      } catch (err) {
        console.warn("Auto-save notes error:", err);
        setNotesStatus((prev) => ({ ...prev, [tripId]: "idle" }));
      }
    }, 600);
  };

  // Handle checklist checkbox toggle
  const handleToggleChecklistItem = (destIata: string, item: string) => {
    const destKey = destIata.toUpperCase();
    const currentChecks = checkedItemsByDest[destKey] || {};
    const nextChecks = {
      ...currentChecks,
      [item]: !currentChecks[item],
    };

    setCheckedItemsByDest((prev) => ({
      ...prev,
      [destKey]: nextChecks,
    }));

    if (typeof window !== "undefined") {
      localStorage.setItem(`venture_packing_${destKey}`, JSON.stringify(nextChecks));
    }

    fetch("/api/packing-checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destination: destKey,
        checkedItems: nextChecks,
      }),
    }).catch((err) => console.warn("Failed to sync checklist item:", err));
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917] flex flex-col font-sans selection:bg-[#B45309]/15 selection:text-[#1C1917]">
      {/* Top Navbar Header: Consistent across Venture */}
      <header className="shrink-0 border-b border-[#E8E2D5] bg-[#FAF7F2]/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Top Left: Brand → home */}
          <Link href="/" className="select-none group cursor-pointer">
            <span className="text-2xl font-serif font-bold tracking-tight text-[#1C1917] group-hover:text-[#B45309] transition-colors">
              Venture
            </span>
          </Link>

          {/* Top Right Cluster: Travel Readiness, My Trips, Currency */}
          <nav className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => {
                const firstTrip = trips[0];
                triggerTransition({
                  targetIata: firstTrip?.destinationIata || "ZRH",
                  targetCity: firstTrip?.destinationCity || "Zurich",
                  targetUrl: "/travel-readiness",
                });
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#FFFFFF] hover:bg-[#FAF7F2] text-[#78716C] hover:text-[#1C1917] border border-[#E8E2D5] hover:border-[#B45309]/50 transition-all shadow-xs cursor-pointer group"
              title="Open Travel Readiness Page"
            >
              <Luggage className="h-3.5 w-3.5 text-[#B45309] group-hover:scale-110 transition-transform" />
              <span>Travel Readiness</span>
            </button>

            {/* My Trips (Active on this screen) */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#1C1917] text-[#FAF7F2] border border-[#1C1917] shadow-xs select-none">
              <Sparkles className="h-3.5 w-3.5 text-[#D97706]" />
              <span>My Trips</span>
              {trips.length > 0 && (
                <span className="text-[10px] bg-[#D97706] text-[#FAF7F2] px-1.5 py-0.2 rounded-md ml-1 font-bold">
                  {trips.length}
                </span>
              )}
            </div>

            {/* Currency Selector Dropdown */}
            <div ref={currencyDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FFFFFF] hover:bg-[#FAF7F2] text-[#1C1917] border border-[#E8E2D5] hover:border-[#B45309]/50 transition-all shadow-xs cursor-pointer"
                title="Change Currency"
              >
                <span className="font-mono font-bold text-[#B45309]">
                  {currency === "USD" ? "$" : currency === "EUR" ? "€" : "£"}
                </span>
                <span>{currency}</span>
                <ChevronDown className="h-3.5 w-3.5 text-[#78716C]" />
              </button>

              {currencyDropdownOpen && (
                <div className="absolute top-full right-0 mt-1.5 w-32 bg-[#FFFFFF] border border-[#E8E2D5] rounded-xl shadow-lg py-1 z-50">
                  {(
                    [
                      { code: "USD", symbol: "$" },
                      { code: "EUR", symbol: "€" },
                      { code: "GBP", symbol: "£" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        handleCurrencyChange(item.code);
                        setCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF7F2] transition-colors cursor-pointer ${
                        currency === item.code ? "text-[#1C1917] font-bold bg-[#FAF7F2]" : "text-[#78716C]"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#B45309]">{item.symbol}</span>
                        <span>{item.code}</span>
                      </span>
                      {currency === item.code && <Check className="h-3.5 w-3.5 text-[#B45309]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1160px] w-full mx-auto px-4 sm:px-6 pt-8 pb-24">
        {/* Page Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E8E2D5] mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-[#B45309] mb-1">
              <Compass className="h-3.5 w-3.5" />
              <span>Verified Expeditions & Readiness</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#1C1917] tracking-tight">
              My Saved Trips
            </h1>
            <p className="text-xs sm:text-sm text-[#78716C] mt-1.5 max-w-xl leading-relaxed">
              Curated itineraries, ground rail connections, and luxury destination readiness dossiers.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1C1917] hover:bg-[#292524] text-[#FAF7F2] text-xs font-semibold transition-all shadow-sm hover:scale-[1.02] shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#D97706]" />
            <span>Search New Routes</span>
          </Link>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <span className="h-8 w-8 border-3 border-[#B45309]/30 border-t-[#B45309] rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold text-[#78716C]">Loading saved trips from local database…</p>
          </div>
        ) : error ? (
          <div className="p-5 rounded-2xl bg-[#FFF8F5] border border-[#F5D0C5] text-xs text-[#B45309]">
            {error}
          </div>
        ) : trips.length === 0 ? (
          <div className="py-20 bg-[#FFFFFF] border border-[#E8E2D5] rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xs">
            <div className="h-16 w-16 rounded-2xl bg-[#F3EFE6] flex items-center justify-center text-[#B45309] mb-4">
              <Compass className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-serif font-bold text-[#1C1917]">No Saved Trips Yet</h2>
            <p className="text-xs sm:text-sm text-[#78716C] max-w-md mt-2 mb-6 leading-relaxed">
              When exploring corridors on Venture, click <strong className="text-[#1C1917]">“Add to My Trips”</strong> on any result card. Your flight routes, rail connections, and destination readiness guides will be preserved here.
            </p>
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-[#1C1917] text-[#FAF7F2] text-xs font-semibold hover:bg-[#292524] transition-all shadow-md hover:scale-[1.02]"
            >
              Explore Flight & Rail Corridors
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {trips.map((trip) => {
              const isExpanded = expandedTripId === trip.id;
              const flag = getCountryFlag(trip.destinationIata);
              const activeTab = activeCultureTab[trip.id] || "checklist";

              // Resolve cultural dossier from Travelwolf API cache or fallback
              const destKey = trip.destinationIata.toUpperCase();
              const destCountryKey = resolveCountryKey(destKey);
              const fallbackCulture = CULTURAL_FALLBACK_DATA[destCountryKey] || CULTURAL_FALLBACK_DATA["JP"];
              const culture = culturalDataByDest[destKey] || (trip.culturalInfo?.usefulPhrases?.length ? trip.culturalInfo : fallbackCulture);

              // Checklist information pulled from Travelwolf API
              const tripChecks = checkedItemsByDest[destKey] || {};
              const essentialGroups = culture?.essentialItems || [
                {
                  title: "Documents",
                  items: [
                    "Passport valid for at least 6 months",
                    "Flight tickets & itinerary confirmation",
                    "Accommodation bookings",
                    "Travel insurance documents",
                  ],
                },
                {
                  title: "Electronics",
                  items: [
                    "Type power adapter & charger",
                    "Portable battery power bank",
                    "Offline navigation maps downloaded",
                  ],
                },
                {
                  title: "Clothing & Essentials",
                  items: [
                    "Comfortable walking shoes",
                    "Weather-appropriate clothing layers",
                    "Local currency & contactless card",
                  ],
                },
              ];

              // Count total items and packed items
              let totalPackingItems = 0;
              let packedItemsCount = 0;
              essentialGroups.forEach((grp) => {
                grp.items.forEach((it) => {
                  totalPackingItems++;
                  if (tripChecks[it]) packedItemsCount++;
                });
              });
              const packingPct = totalPackingItems > 0 ? Math.round((packedItemsCount / totalPackingItems) * 100) : 0;

              // Exactly 8 essential phrases
              const eightPhrases = (culture?.usefulPhrases && culture.usefulPhrases.length >= 8)
                ? culture.usefulPhrases.slice(0, 8)
                : [
                    ...(culture?.usefulPhrases || []),
                    { phrase: "Hello / Good day", phonetic: "Konnichiwa", translation: "Standard polite greeting" },
                    { phrase: "Thank you very much", phonetic: "Arigatō gozaimasu", translation: "Formal expression of gratitude" },
                    { phrase: "Please", phonetic: "Onegaishimasu", translation: "Polite request when asking" },
                    { phrase: "Excuse me / Sorry", phonetic: "Sumimasen", translation: "Used to get attention or apologize" },
                    { phrase: "How much is this?", phonetic: "Kore wa ikura desu ka?", translation: "Asking for price" },
                    { phrase: "Where is the station?", phonetic: "Eki wa doko desu ka?", translation: "Asking for transit direction" },
                    { phrase: "Check, please", phonetic: "O-kaikei o onegaishimasu", translation: "Asking for bill at restaurant" },
                    { phrase: "Delicious / Yes, please", phonetic: "Oishii desu", translation: "Complimenting meal or accepting" },
                  ].slice(0, 8);

              // Exactly 4 etiquette and customs items
              const fourCustoms = (() => {
                const items: Array<{ title: string; description: string; isTaboo?: boolean }> = [];
                if (culture?.localCustoms) {
                  culture.localCustoms.forEach((c) => items.push({ title: c.title, description: c.description, isTaboo: false }));
                }
                if (culture?.culturalTaboos) {
                  culture.culturalTaboos.forEach((t) => items.push({ title: t.title, description: t.description, isTaboo: true }));
                }
                return items.slice(0, 4);
              })();

              // Live Forex data for this trip
              let targetCurrency = culture?.currencyInfo?.code || "EUR";
              if (!targetCurrency || targetCurrency === "EUR") {
                if (["NRT", "HND", "KIX"].includes(destKey)) targetCurrency = "JPY";
                else if (["IST", "SAW", "AYT"].includes(destKey)) targetCurrency = "TRY";
                else if (["BKK", "HKT"].includes(destKey)) targetCurrency = "THB";
                else if (["LHR", "LGW", "MAN"].includes(destKey)) targetCurrency = "GBP";
                else if (["JFK", "MCO", "MIA", "LAX", "ORD"].includes(destKey)) targetCurrency = "USD";
                else if (["ZRH", "GVA", "BSL"].includes(destKey)) targetCurrency = "CHF";
                else if (["PRG"].includes(destKey)) targetCurrency = "CZK";
                else if (["BUD"].includes(destKey)) targetCurrency = "HUF";
              }
              const fxKey = `${trip.id}_${currency}_${targetCurrency}`;
              const fxData = forexByTrip[fxKey];
              const isFxLoading = isForexLoading[trip.id];

              return (
                <div
                  key={trip.id}
                  className={`rounded-3xl border transition-all duration-200 bg-[#FFFFFF] overflow-hidden ${
                    isExpanded
                      ? "border-[#B45309] shadow-md ring-1 ring-[#B45309]/20"
                      : "border-[#E8E2D5] hover:border-[#D6CEBF] shadow-xs"
                  }`}
                >
                  {/* Simplified Card Summary Header: Flag in top-left without container */}
                  <div
                    onClick={() => setExpandedTripId(isExpanded ? null : trip.id)}
                    className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF7F2]/60 transition-colors"
                  >
                    {/* Route Info */}
                    <div className="flex items-start gap-3.5">
                      {/* Flag directly in top left without container */}
                      <span className="text-3xl sm:text-4xl shrink-0 select-none leading-none pt-0.5">
                        {flag}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg sm:text-xl font-bold text-[#1C1917]">
                            {trip.originCity} ({trip.originIata})
                          </span>
                          <ArrowRight className="h-4 w-4 text-[#B45309] shrink-0" />
                          <span className="text-lg sm:text-xl font-bold text-[#1C1917]">
                            {trip.destinationCity} ({trip.destinationIata})
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F3EFE6] text-[#78716C] font-semibold border border-[#E8E2D5]">
                            {trip.destinationCountry}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#78716C] mt-2 flex-wrap">
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-[#B45309]" />
                            {trip.tripType === "oneway" || !trip.returnDate
                              ? `${trip.departDate} (One-way)`
                              : `${trip.departDate} ➔ ${trip.returnDate}`}
                          </span>

                          {/* Dynamic Transit representation: e.g. "Transit: Bus then Plane" or "Transit: Train then Plane" */}
                          <span className="flex items-center gap-1.5 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#2D5A46]" />
                            <span>Transit: {formatTransitJourney(trip.transferMode)}</span>
                          </span>

                          {trip.savingsVsHome !== undefined && trip.savingsVsHome > 0 && (
                            <span className="flex items-center gap-1 text-[#2D5A46] font-bold bg-[#E8F0EC] px-2 py-0.5 rounded-md border border-[#D1E4D8]">
                              <TrendingDown className="h-3 w-3" />
                              Saved {getCurrencySymbol(trip.currency || "EUR")}{Math.round(trip.savingsVsHome)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price, Optional Booking Link & Expand/Collapse Toggle */}
                    <div className="flex items-center justify-between sm:justify-end gap-3.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#E8E2D5]">
                      <div className="text-left sm:text-right pr-1">
                        <div className="text-[11px] text-[#78716C] font-medium uppercase tracking-wider">
                          Total Journey
                        </div>
                        <div className="text-xl font-bold text-[#1C1917]">
                          {getCurrencySymbol(trip.currency || "EUR")}
                          {Math.round(trip.totalCost || trip.farePrice || 0)}
                        </div>
                        {trip.farePrice && trip.totalCost && trip.farePrice !== trip.totalCost && (
                          <div className="text-[10px] text-[#78716C]">
                            Flight: {getCurrencySymbol(trip.currency || "EUR")}{Math.round(trip.farePrice)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {trip.bookingUrl && (
                          <a
                            href={trip.bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EFE6] border border-[#E8E2D5] text-[#1C1917] transition-colors"
                            title="Open flight booking link"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}

                        {/* Expand / Collapse Chevron */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedTripId(isExpanded ? null : trip.id);
                          }}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            isExpanded
                              ? "bg-[#1C1917] text-[#FAF7F2] border-[#1C1917]"
                              : "bg-[#FAF7F2] hover:bg-[#F3EFE6] text-[#78716C] border-[#E8E2D5]"
                          }`}
                          title={isExpanded ? "Collapse dossier" : "Expand travel readiness dossier & notes"}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Luxury Travel Readiness Snapshot & Notes */}
                  {isExpanded && (
                    <div className="border-t border-[#E8E2D5] bg-[#FAF7F2]/40 p-5 sm:p-7 space-y-6">
                      
                      {/* The 4 Tabs: Taking up the entire top width & styled like cohesive tabs */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 p-1.5 bg-[#F3EFE6] rounded-2xl border border-[#E8E2D5] gap-1.5 w-full shadow-2xs">
                        {[
                          { key: "checklist", label: "Packing Checklist", icon: CheckSquare, badge: `${packedItemsCount}/${totalPackingItems}` },
                          { key: "phrases", label: "Essential Phrases", icon: Globe, badge: "8" },
                          { key: "customs", label: "Etiquette & Customs", icon: Sparkles, badge: "4" },
                          { key: "forex", label: "Currency & Forex", icon: Coins, badge: `${currency}➔${targetCurrency}` },
                        ].map(({ key, label, icon: TabIcon, badge }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() =>
                              setActiveCultureTab((prev) => ({
                                ...prev,
                                [trip.id]: key as any,
                              }))
                            }
                            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              activeTab === key
                                ? "bg-[#FFFFFF] text-[#1C1917] shadow-xs font-bold border border-[#E8E2D5]"
                                : "text-[#78716C] hover:text-[#1C1917] hover:bg-[#FFFFFF]/50"
                            }`}
                          >
                            <TabIcon className={`h-4 w-4 shrink-0 ${activeTab === key ? "text-[#B45309]" : "text-[#78716C]"}`} />
                            <span className="truncate">{label}</span>
                            {badge && (
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${
                                  activeTab === key
                                    ? "bg-[#D97706] text-white"
                                    : "bg-[#E8F0EC] text-[#2D5A46]"
                                }`}
                              >
                                {badge}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Tab Content Display */}
                      <div className="min-h-[140px]">
                        
                        {/* TAB 1: COMPLETE PACKING CHECKLIST PULLING FROM TRAVELWOLF API (SCROLLABLE RIGHT TO LEFT) */}
                        {activeTab === "checklist" && (
                          <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <div className="text-xs font-bold text-[#1C1917]">
                                  Complete Packing Checklist · {trip.destinationCity}
                                </div>
                                <div className="text-[11px] text-[#78716C] mt-0.5">
                                  Synchronized from Travelwolf dossier. Scroll horizontally across all {essentialGroups.length} categories.
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-[#2D5A46]">
                                  {packedItemsCount} of {totalPackingItems} packed ({packingPct}%)
                                </span>
                                <div className="w-24 bg-[#E8E2D5] rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-[#2D5A46] h-full transition-all duration-300"
                                    style={{ width: `${packingPct}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Horizontally Scrollable Checklist Rail (Right-to-Left / Left-to-Right) */}
                            <div className="flex overflow-x-auto pb-4 pt-1 gap-4 scrollbar-thin scroll-smooth snap-x snap-mandatory">
                              {essentialGroups.map((group, gIdx) => (
                                <div
                                  key={gIdx}
                                  className="min-w-[280px] sm:min-w-[320px] max-w-[340px] shrink-0 snap-start bg-[#FFFFFF] border border-[#E8E2D5] rounded-2xl p-4 shadow-2xs flex flex-col justify-between"
                                >
                                  <div>
                                    <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#F3EFE6]">
                                      <div className="text-xs font-bold uppercase tracking-wider text-[#1C1917]">
                                        {group.title}
                                      </div>
                                      <span className="text-[10px] font-semibold text-[#78716C]">
                                        {group.items.length} items
                                      </span>
                                    </div>

                                    <div className="space-y-2">
                                      {group.items.map((item, iIdx) => {
                                        const isChecked = !!tripChecks[item];
                                        return (
                                          <div
                                            key={iIdx}
                                            onClick={() => handleToggleChecklistItem(trip.destinationIata, item)}
                                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 text-xs select-none ${
                                              isChecked
                                                ? "bg-[#E8F0EC]/80 border-[#A3C8B3] text-stone-600 line-through"
                                                : "bg-[#FAF7F2] border-[#E8E2D5] text-[#1C1917] hover:border-[#B45309]/50 hover:bg-[#FFFFFF]"
                                            }`}
                                          >
                                            <span
                                              className={`mt-0.5 h-4 w-4 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                                                isChecked
                                                  ? "bg-[#2D5A46] border-[#2D5A46] text-white"
                                                  : "bg-[#FFFFFF] border-[#D6CEBF]"
                                              }`}
                                            >
                                              {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                                            </span>
                                            <span className="leading-snug break-words flex-1 font-medium">{item}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* TAB 2: EXACTLY 8 ESSENTIAL PHRASES (Clean, NO copy buttons) */}
                        {activeTab === "phrases" && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs text-[#78716C]">
                              <span>8 Essential local expressions for polite daily interactions:</span>
                              <span className="text-[11px] font-serif italic text-[#B45309]">Verified Travelwolf phonetics</span>
                            </div>

                            {/* 8 Clean luxury phrases grid: No copy buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {eightPhrases.map((phrase, pIdx) => (
                                <div
                                  key={pIdx}
                                  className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D5] flex flex-col justify-between shadow-2xs hover:border-[#B45309]/40 transition-colors"
                                >
                                  <div>
                                    <div className="text-sm font-bold text-[#1C1917] tracking-tight">
                                      {phrase.phrase}
                                    </div>
                                    <div className="text-xs font-mono text-[#B45309] mt-0.5 font-medium">
                                      /{phrase.phonetic}/
                                    </div>
                                  </div>
                                  <div className="text-xs text-[#78716C] mt-3 pt-2 border-t border-[#F3EFE6] leading-relaxed">
                                    {phrase.translation}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* TAB 3: EXACTLY 4 ETIQUETTE & CUSTOMS */}
                        {activeTab === "customs" && (
                          <div className="space-y-4">
                            <div className="text-xs text-[#78716C]">
                              4 Key verified etiquette & cultural customs for {trip.destinationCountry}:
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              {fourCustoms.map((custom, cIdx) => (
                                <div
                                  key={cIdx}
                                  className={`p-4 rounded-2xl border shadow-2xs ${
                                    custom.isTaboo
                                      ? "bg-[#FFF8F5] border-[#F5D0C5]"
                                      : "bg-[#FFFFFF] border-[#E8E2D5]"
                                  }`}
                                >
                                  <div className="text-xs font-bold text-[#1C1917] mb-1.5 flex items-center gap-2">
                                    {custom.isTaboo ? (
                                      <AlertTriangle className="h-3.5 w-3.5 text-[#B45309]" />
                                    ) : (
                                      <Sparkles className="h-3.5 w-3.5 text-[#B45309]" />
                                    )}
                                    <span>{custom.title}</span>
                                  </div>
                                  <p className="text-xs text-[#78716C] leading-relaxed">
                                    {custom.description}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* TAB 4: CURRENCY & LIVE FOREX (BUY & SELL RATES, STRUCTURED TIPPING NORMS) */}
                        {activeTab === "forex" && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                              {/* 1. Live Market Rate & Calculations */}
                              <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D5] shadow-2xs flex flex-col justify-between">
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] mb-2 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                      <Coins className="h-3.5 w-3.5 text-[#B45309]" />
                                      <span>Mid-Market FX Rate</span>
                                    </span>
                                    <span className="h-2 w-2 rounded-full bg-[#2D5A46] animate-pulse" />
                                  </div>

                                  {isFxLoading ? (
                                    <div className="py-4 flex items-center gap-2 text-xs text-[#78716C]">
                                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#B45309]" />
                                      <span>Fetching live rates…</span>
                                    </div>
                                  ) : fxData ? (
                                    <div>
                                      <div className="text-xl font-bold font-mono text-[#1C1917]">
                                        1 {currency} = {fxData.midRate} {targetCurrency}
                                      </div>
                                      <div className="text-[11px] text-[#78716C] mt-1">
                                        Source: {fxData.source}
                                      </div>
                                      
                                      <div className="mt-3 pt-2.5 border-t border-[#F3EFE6] space-y-1 font-mono text-xs text-[#1C1917]">
                                        <div className="flex justify-between">
                                          <span className="text-[#78716C]">10 {currency}</span>
                                          <span className="font-semibold text-[#B45309]">{(10 * fxData.midRate).toFixed(2)} {targetCurrency}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-[#78716C]">50 {currency}</span>
                                          <span className="font-semibold text-[#B45309]">{(50 * fxData.midRate).toFixed(2)} {targetCurrency}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-[#78716C]">100 {currency}</span>
                                          <span className="font-semibold text-[#B45309]">{(100 * fxData.midRate).toFixed(2)} {targetCurrency}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="text-sm font-bold text-[#1C1917]">
                                        {culture?.currencyInfo?.code || "EUR"} ({culture?.currencyInfo?.name || "Euro"})
                                      </div>
                                      <div className="text-[11px] text-[#78716C] mt-1">
                                        {culture?.currencyInfo?.exchangeRate || "Active market reference"}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 2. Buy & Sell Rates (Replacing Card Acceptance) */}
                              <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D5] shadow-2xs flex flex-col justify-between">
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] mb-2 flex items-center gap-1.5">
                                    <CreditCard className="h-3.5 w-3.5 text-[#B45309]" />
                                    <span>Buy & Sell Rates</span>
                                  </div>

                                  {fxData ? (
                                    <div className="space-y-3">
                                      {/* Buy Rate (ATM / Local Cash) */}
                                      <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5]">
                                        <div className="text-[10px] uppercase font-bold text-[#2D5A46] flex items-center gap-1">
                                          <TrendingDown className="h-3 w-3" />
                                          <span>Buy Rate (You Receive)</span>
                                        </div>
                                        <div className="text-sm font-bold font-mono text-[#1C1917] mt-0.5">
                                          1 {currency} ≈ {fxData.buyRate} {targetCurrency}
                                        </div>
                                        <div className="text-[10px] text-[#78716C]">
                                          ATM withdrawals & local bank purchases
                                        </div>
                                      </div>

                                      {/* Sell Rate (Conversion Back) */}
                                      <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5]">
                                        <div className="text-[10px] uppercase font-bold text-[#B45309] flex items-center gap-1">
                                          <TrendingUp className="h-3 w-3" />
                                          <span>Sell Rate (Exchange Back)</span>
                                        </div>
                                        <div className="text-sm font-bold font-mono text-[#1C1917] mt-0.5">
                                          1 {currency} ≈ {fxData.sellRate} {targetCurrency}
                                        </div>
                                        <div className="text-[10px] text-[#78716C]">
                                          Leftover currency return conversion
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-[#78716C] py-2">
                                      Calculated benchmark with standard ~1.5% retail exchange spread.
                                    </div>
                                  )}
                                </div>

                                <div className="text-[10px] text-[#78716C] pt-2 border-t border-[#F3EFE6] mt-2">
                                  Inverse: 1 {targetCurrency} ≈ {fxData?.inverseRate || "0.02"} {currency}
                                </div>
                              </div>

                              {/* 3. Structured Luxury Tipping Norms (No sloppy text wall) */}
                              <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D5] shadow-2xs flex flex-col justify-between">
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] mb-2 flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5 text-[#B45309]" />
                                    <span>Tipping & Gratuity Norms</span>
                                  </div>

                                  <div className="space-y-2">
                                    {getStructuredTippingNorms(culture?.currencyInfo?.tips).map((norm, nIdx) => (
                                      <div key={nIdx} className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs">
                                        <div className="font-bold text-[#1C1917] text-[11px] mb-0.5 flex items-center gap-1.5">
                                          <span className="h-1.5 w-1.5 rounded-full bg-[#B45309]" />
                                          <span>{norm.label}</span>
                                        </div>
                                        <p className="text-[#78716C] text-[11px] leading-relaxed">
                                          {norm.text}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Custom Notes Section with DEBOUNCED AUTO-SAVE (No save button) */}
                      <div className="pt-4 border-t border-[#E8E2D5]">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                            <StickyNote className="h-3.5 w-3.5 text-[#B45309]" />
                            <span>My Itinerary Notes & Expedition Reminders</span>
                          </label>

                          {/* Subtle Auto-save Status Indicator */}
                          <div className="text-[11px] text-[#78716C] flex items-center gap-1 transition-all">
                            {notesStatus[trip.id] === "saving" ? (
                              <span className="flex items-center gap-1 text-[#B45309]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#B45309] animate-pulse" />
                                <span>Saving…</span>
                              </span>
                            ) : notesStatus[trip.id] === "saved" ? (
                              <span className="flex items-center gap-1 text-[#2D5A46] font-medium">
                                <Check className="h-3 w-3 stroke-[2.5]" />
                                <span>All changes saved</span>
                              </span>
                            ) : (
                              <span className="text-[#A8A29E]">Auto-saves automatically</span>
                            )}
                          </div>
                        </div>

                        <textarea
                          rows={2}
                          value={editingNotes[trip.id] ?? trip.notes ?? ""}
                          onChange={(e) => handleNotesChange(trip.id, e.target.value)}
                          placeholder="Add flight seat preferences, rail transfer timings, hotel reservations, or packing reminders for this expedition…"
                          className="w-full bg-[#FFFFFF] border border-[#E8E2D5] rounded-2xl p-3 text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#B45309] transition-colors resize-y shadow-2xs"
                        />
                      </div>

                      {/* Bottom Footer: Explore Readiness moved to bottom right, left of Delete Saved Trip */}
                      <div className="pt-2 flex items-center justify-end">
                        <div className="flex items-center gap-2.5">
                          {/* Explore Readiness Guide (to the left of Delete Saved Trip) */}
                          <button
                            type="button"
                            onClick={() => {
                              triggerTransition({
                                targetIata: trip.destinationIata,
                                targetCity: trip.destinationCity || trip.destinationIata,
                                targetUrl: `/travel-readiness?dest=${encodeURIComponent(trip.destinationIata)}&origin=${encodeURIComponent(trip.originIata)}`,
                                origin: trip.originIata,
                              });
                            }}
                            className="px-4 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#FAF7F2] text-[#1C1917] border border-[#E8E2D5] hover:border-[#B45309]/50 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs group cursor-pointer"
                            title="Open Full Travel Readiness Guide"
                          >
                            <Luggage className="h-3.5 w-3.5 text-[#B45309]" />
                            <span>Explore Travel Readiness</span>
                            <ArrowRight className="h-3 w-3 text-[#B45309] group-hover:translate-x-0.5 transition-transform" />
                          </button>

                          {/* Delete Saved Trip Button with distinct Red Tint */}
                          <button
                            type="button"
                            onClick={() => setTripToDelete(trip)}
                            className="px-4 py-2 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] hover:border-[#FCA5A5] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs group"
                            title="Delete saved trip"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-[#DC2626] transition-colors" />
                            <span>Delete Saved Trip</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Popup Modal */}
      <AnimatePresence>
        {tripToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTripToDelete(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-[#FFFFFF] border border-[#E8E2D5] rounded-3xl p-6 sm:p-7 shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center text-[#DC2626] shrink-0">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#1C1917]">
                    Delete Saved Trip?
                  </h3>
                  <p className="text-xs text-[#78716C] mt-1 leading-relaxed">
                    Are you sure you want to remove this trip from your saved collection? This action cannot be undone.
                  </p>
                </div>
              </div>

              {/* Trip Summary Details */}
              <div className="bg-[#FAF7F2] border border-[#E8E2D5] rounded-2xl p-4 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#1C1917] flex items-center gap-2">
                    <span>{getCountryFlag(tripToDelete.destinationIata)}</span>
                    <span>
                      {tripToDelete.originCity} ({tripToDelete.originIata}) → {tripToDelete.destinationCity} ({tripToDelete.destinationIata})
                    </span>
                  </div>
                  <div className="text-[11px] text-[#78716C] mt-1">
                    {tripToDelete.tripType === "oneway" || !tripToDelete.returnDate
                      ? `${tripToDelete.departDate} (One-way)`
                      : `${tripToDelete.departDate} ➔ ${tripToDelete.returnDate}`}
                  </div>
                </div>
                <div className="font-mono font-bold text-[#B45309] text-sm">
                  {getCurrencySymbol(tripToDelete.currency || "EUR")}
                  {Math.round(tripToDelete.totalCost || tripToDelete.farePrice || 0)}
                </div>
              </div>

              {/* Popup Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTripToDelete(null)}
                  className="px-4 py-2.5 rounded-lg border border-[#E8E2D5] bg-[#FFFFFF] hover:bg-[#FAF7F2] text-xs font-semibold text-[#1C1917] transition-all cursor-pointer"
                >
                  Keep Trip
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTrip(tripToDelete.id)}
                  className="px-5 py-2.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Confirm Delete</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
