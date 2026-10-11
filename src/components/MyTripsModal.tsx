"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Trash2,
  ExternalLink,
  Globe,
  Coins,
  AlertTriangle,
  Luggage,
  Sparkles,
  Check,
  CheckSquare,
  StickyNote,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Compass,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import type { SavedTrip } from "@/types/trips";
import type { CountryCulturalInfo } from "@/types/cultural";
import { getCountryFlag } from "@/lib/cultural-utils";
import { CULTURAL_FALLBACK_DATA, resolveCountryKey } from "@/lib/cultural-fallback";
import { getCurrencySymbol } from "@/lib/currency";
import { useSuitcaseTransition } from "@/components/SuitcaseTransitionProvider";

interface MyTripsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTripToSearch?: (trip: SavedTrip) => void;
  onTripsUpdated?: () => void;
}

export function MyTripsModal({
  isOpen,
  onClose,
  onSelectTripToSearch,
  onTripsUpdated,
}: MyTripsModalProps) {
  const { triggerTransition } = useSuitcaseTransition();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
  
  // Exactly 4 tabs: checklist, phrases, customs, forex
  const [activeCultureTab, setActiveCultureTab] = useState<
    Record<string, "checklist" | "phrases" | "customs" | "forex">
  >({});

  // Auto-saving notes
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [notesStatus, setNotesStatus] = useState<Record<string, "idle" | "saving" | "saved">>({});
  const noteTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const [tripToDelete, setTripToDelete] = useState<SavedTrip | null>(null);
  const [checkedItemsByDest, setCheckedItemsByDest] = useState<Record<string, Record<string, boolean>>>({});
  const [culturalDataByDest, setCulturalDataByDest] = useState<Record<string, CountryCulturalInfo>>({});
  const [forexByTrip, setForexByTrip] = useState<Record<string, any>>({});
  const [isForexLoading, setIsForexLoading] = useState<Record<string, boolean>>({});

  // Lock background body scroll
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (tripToDelete) {
          setTripToDelete(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, tripToDelete]);

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

  // Fetch saved trips from backend database
  const loadTrips = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trips");
      if (!res.ok) throw new Error(`Failed to load trips (${res.status})`);
      const data = await res.json();
      const loaded: SavedTrip[] = data.trips || [];
      setTrips(loaded);

      if (loaded.length > 0 && !expandedTripId) {
        setExpandedTripId(loaded[0].id);
      }

      // Sync packing checklists
      loaded.forEach((trip) => {
        const destKey = trip.destinationIata.toUpperCase();
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem(`venture_packing_${destKey}`);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              setCheckedItemsByDest((prev) => ({ ...prev, [destKey]: parsed }));
            } catch {
              // Ignore
            }
          }
        }

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
    if (isOpen) {
      loadTrips();
    }
  }, [isOpen]);

  // Fetch Travelwolf API data when trip is expanded
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

  // Fetch Forex API data when trip is expanded
  useEffect(() => {
    if (!expandedTripId) return;
    const trip = trips.find((t) => t.id === expandedTripId);
    if (!trip) return;

    const destKey = trip.destinationIata.toUpperCase();
    const culture = culturalDataByDest[destKey] || trip.culturalInfo;
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

    const fxKey = `${trip.id}_USD_${targetCurrency}`;
    if (forexByTrip[fxKey]) return;

    setIsForexLoading((prev) => ({ ...prev, [trip.id]: true }));
    fetch(`/api/forex?from=USD&to=${encodeURIComponent(targetCurrency)}`)
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
  }, [expandedTripId, trips, culturalDataByDest, forexByTrip]);

  const handleDeleteTrip = async (id: string) => {
    try {
      const res = await fetch(`/api/trips/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete trip");
      setTrips((prev) => prev.filter((t) => t.id !== id));
      setTripToDelete(null);
      if (expandedTripId === id) setExpandedTripId(null);
      if (onTripsUpdated) onTripsUpdated();
    } catch (err) {
      console.error("Error deleting trip:", err);
      alert("Failed to delete trip. Please try again.");
    }
  };

  // Debounced auto-save on notes
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
          if (onTripsUpdated) onTripsUpdated();
        }
      } catch (err) {
        console.warn("Auto-save notes error:", err);
        setNotesStatus((prev) => ({ ...prev, [tripId]: "idle" }));
      }
    }, 600);
  };

  const handleToggleChecklist = (destIata: string, item: string) => {
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
    }).catch(() => {});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#000000]/40 backdrop-blur-xs transition-opacity"
      />

      {/* Main Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#FFFFFF] border border-[#E8E2D5] rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
      >
        {/* Header */}
        <div className="shrink-0 px-6 py-4.5 bg-[#FFFFFF] border-b border-[#E8E2D5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] text-[#B45309]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif font-bold text-[#1C1917]">
                  My Saved Trips
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F0EC] text-[#2D5A46] border border-[#D1E4D8]">
                  {trips.length} {trips.length === 1 ? "Trip" : "Trips"}
                </span>
              </div>
              <p className="text-xs text-[#78716C] mt-0.5">
                Curated expeditions and luxury destination readiness snapshots.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#FAF7F2] text-[#78716C] hover:text-[#1C1917] transition-colors"
            title="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <span className="h-7 w-7 border-3 border-[#B45309]/30 border-t-[#B45309] rounded-full animate-spin mb-3" />
              <p className="text-xs font-semibold text-[#78716C]">Loading saved trips from SQLite...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-[#FFF8F5] border border-[#F5D0C5] text-xs text-[#B45309]">
              {error}
            </div>
          ) : trips.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <div className="p-4 rounded-full bg-[#FAF7F2] border border-[#E8E2D5] text-[#B45309] mb-3">
                <Compass className="h-8 w-8" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#1C1917]">No Saved Trips Yet</h3>
              <p className="text-xs text-[#78716C] max-w-sm mt-1 mb-5">
                Search flight corridors and click “Add to My Trips” on any card to save itineraries and cultural guides here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {trips.map((trip) => {
                const isExpanded = expandedTripId === trip.id;
                const flag = getCountryFlag(trip.destinationIata);
                const activeTab = activeCultureTab[trip.id] || "checklist";

                const destKey = trip.destinationIata.toUpperCase();
                const destCountryKey = resolveCountryKey(destKey);
                const fallbackCulture = CULTURAL_FALLBACK_DATA[destCountryKey] || CULTURAL_FALLBACK_DATA["JP"];
                const culture = culturalDataByDest[destKey] || (trip.culturalInfo?.usefulPhrases?.length ? trip.culturalInfo : fallbackCulture);

                const tripChecks = checkedItemsByDest[destKey] || {};
                const essentialGroups = culture?.essentialItems || [
                  {
                    title: "Documents",
                    items: [
                      "Passport valid for at least 6 months",
                      "Flight tickets & itinerary confirmation",
                      "Accommodation bookings",
                    ],
                  },
                  {
                    title: "Electronics",
                    items: [
                      "Power adapter & portable power bank",
                      "Offline maps & transit directions",
                    ],
                  },
                ];

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
                      { phrase: "Hello", phonetic: "Konnichiwa", translation: "Standard polite greeting" },
                      { phrase: "Thank you", phonetic: "Arigatō gozaimasu", translation: "Expression of gratitude" },
                      { phrase: "Please", phonetic: "Onegaishimasu", translation: "Polite request" },
                      { phrase: "Excuse me", phonetic: "Sumimasen", translation: "To get attention or apologize" },
                      { phrase: "How much?", phonetic: "Ikura desu ka?", translation: "Asking for price" },
                      { phrase: "Where is station?", phonetic: "Eki wa doko desu ka?", translation: "Asking for direction" },
                      { phrase: "Check, please", phonetic: "O-kaikei", translation: "Asking for bill" },
                      { phrase: "Delicious", phonetic: "Oishii desu", translation: "Complimenting meal" },
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
                const fxKey = `${trip.id}_USD_${targetCurrency}`;
                const fxData = forexByTrip[fxKey];
                const isFxLoading = isForexLoading[trip.id];

                return (
                  <div
                    key={trip.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-[#FFFFFF] ${
                      isExpanded
                        ? "border-[#B45309] shadow-md ring-1 ring-[#B45309]/20"
                        : "border-[#E8E2D5] hover:border-[#D6CEBF] shadow-2xs"
                    }`}
                  >
                    {/* Simplified Header: No Search Route, No Readiness, No Delete in top */}
                    <div
                      onClick={() => setExpandedTripId(isExpanded ? null : trip.id)}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF7F2]/60 transition-colors"
                    >
                      <div className="flex items-start gap-3.5">
                        <span className="text-3xl shrink-0 select-none leading-none pt-0.5">
                          {flag}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-base text-[#1C1917]">
                              {trip.originCity} ({trip.originIata})
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-[#B45309]" />
                            <span className="font-bold text-base text-[#1C1917]">
                              {trip.destinationCity} ({trip.destinationIata})
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3EFE6] text-[#78716C] font-semibold border border-[#E8E2D5]">
                              {trip.destinationCountry}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-[#78716C] mt-1.5 flex-wrap">
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar className="h-3.5 w-3.5 text-[#B45309]" />
                              {trip.tripType === "oneway" || !trip.returnDate
                                ? `${trip.departDate} (One-way)`
                                : `${trip.departDate} ➔ ${trip.returnDate}`}
                            </span>

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

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8E2D5]">
                        <div className="text-left sm:text-right pr-1">
                          <div className="text-[10px] text-[#78716C] uppercase tracking-wider font-semibold">
                            Total Journey
                          </div>
                          <div className="text-lg font-bold text-[#1C1917]">
                            {getCurrencySymbol(trip.currency || "EUR")}
                            {Math.round(trip.totalCost || trip.farePrice || 0)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {trip.bookingUrl && (
                            <a
                              href={trip.bookingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EFE6] border border-[#E8E2D5] text-[#1C1917] transition-colors"
                              title="Booking link"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedTripId(isExpanded ? null : trip.id);
                            }}
                            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                              isExpanded
                                ? "bg-[#1C1917] text-[#FAF7F2] border-[#1C1917]"
                                : "bg-[#FAF7F2] hover:bg-[#F3EFE6] text-[#78716C] border-[#E8E2D5]"
                            }`}
                            title={isExpanded ? "Collapse" : "Expand"}
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Cultural & Readiness Snapshot */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-[#E8E2D5] bg-[#FAF7F2]/40 p-4 sm:p-6 space-y-5"
                        >
                          {/* The 4 Tabs: Taking up the entire top width & styled like cohesive tabs */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 p-1 bg-[#F3EFE6] rounded-2xl border border-[#E8E2D5] gap-1 w-full shadow-2xs">
                            {[
                              { id: "checklist", label: "Packing Checklist", icon: CheckSquare, badge: `${packedItemsCount}/${totalPackingItems}` },
                              { id: "phrases", label: "Essential Phrases", icon: Globe, badge: "8" },
                              { id: "customs", label: "Etiquette & Customs", icon: Sparkles, badge: "4" },
                              { id: "forex", label: "Currency & Forex", icon: Coins, badge: "Live FX" },
                            ].map((tab) => {
                              const Icon = tab.icon;
                              const isActive = activeTab === tab.id;
                              return (
                                <button
                                  key={tab.id}
                                  type="button"
                                  onClick={() =>
                                    setActiveCultureTab((prev) => ({
                                      ...prev,
                                      [trip.id]: tab.id as any,
                                    }))
                                  }
                                  className={`w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                    isActive
                                      ? "bg-[#FFFFFF] text-[#1C1917] shadow-xs font-bold border border-[#E8E2D5]"
                                      : "text-[#78716C] hover:text-[#1C1917] hover:bg-[#FFFFFF]/50"
                                  }`}
                                >
                                  <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-[#B45309]" : "text-[#78716C]"}`} />
                                  <span className="truncate">{tab.label}</span>
                                  {tab.badge && (
                                    <span
                                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${
                                        isActive ? "bg-[#D97706] text-white" : "bg-[#E8F0EC] text-[#2D5A46]"
                                      }`}
                                    >
                                      {tab.badge}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Tab 1: Checklist from Travelwolf API (Horizontal Rail) */}
                          {activeTab === "checklist" && (
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-[#78716C]">
                                <span>Packing checklist from Travelwolf dossier for {trip.destinationCity}:</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-[#2D5A46]">
                                    {packedItemsCount} of {totalPackingItems} packed ({packingPct}%)
                                  </span>
                                  <div className="w-20 bg-[#E8E2D5] rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-[#2D5A46] h-full transition-all duration-300"
                                      style={{ width: `${packingPct}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="flex overflow-x-auto pb-3 pt-1 gap-3 scrollbar-thin scroll-smooth snap-x snap-mandatory">
                                {essentialGroups.map((group, gIdx) => (
                                  <div
                                    key={gIdx}
                                    className="min-w-[240px] sm:min-w-[270px] max-w-[290px] shrink-0 snap-start bg-[#FFFFFF] border border-[#E8E2D5] rounded-xl p-3.5 shadow-2xs flex flex-col justify-between"
                                  >
                                    <div>
                                      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#F3EFE6]">
                                        <div className="text-xs font-bold uppercase tracking-wider text-[#1C1917]">
                                          {group.title}
                                        </div>
                                        <span className="text-[10px] font-semibold text-[#78716C]">
                                          {group.items.length} items
                                        </span>
                                      </div>
                                      <div className="space-y-1.5">
                                        {group.items.map((item, iIdx) => {
                                          const isChecked = !!tripChecks[item];
                                          return (
                                            <div
                                              key={iIdx}
                                              onClick={() => handleToggleChecklist(trip.destinationIata, item)}
                                              className={`p-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer select-none transition-colors ${
                                                isChecked
                                                  ? "bg-[#E8F0EC]/80 border-[#A3C8B3] text-stone-600 line-through"
                                                  : "bg-[#FAF7F2] border-[#E8E2D5] text-[#1C1917] hover:border-[#B45309]/50"
                                              }`}
                                            >
                                              <span
                                                className={`h-3.5 w-3.5 rounded flex items-center justify-center shrink-0 border ${
                                                  isChecked
                                                    ? "bg-[#2D5A46] border-[#2D5A46] text-white"
                                                    : "bg-[#FFFFFF] border-[#D6CEBF]"
                                                }`}
                                              >
                                                {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                                              </span>
                                              <span className="truncate">{item}</span>
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

                          {/* Tab 2: Exactly 8 Phrases (No copy button) */}
                          {activeTab === "phrases" && (
                            <div className="space-y-3">
                              <div className="text-xs text-[#78716C]">
                                8 Essential local expressions with phonetics:
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                                {eightPhrases.map((phrase, pIdx) => (
                                  <div
                                    key={pIdx}
                                    className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E8E2D5] shadow-2xs"
                                  >
                                    <div className="text-xs font-bold text-[#1C1917]">{phrase.phrase}</div>
                                    <div className="text-[11px] font-mono text-[#B45309] mt-0.5">/{phrase.phonetic}/</div>
                                    <div className="text-[11px] text-[#78716C] mt-2 pt-1.5 border-t border-[#F3EFE6]">
                                      {phrase.translation}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tab 3: Exactly 4 Customs */}
                          {activeTab === "customs" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {fourCustoms.map((c, idx) => (
                                <div
                                  key={idx}
                                  className={`p-3.5 rounded-xl border ${
                                    c.isTaboo ? "bg-[#FFF8F5] border-[#F5D0C5]" : "bg-[#FFFFFF] border-[#E8E2D5]"
                                  }`}
                                >
                                  <div className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5 mb-1">
                                    {c.isTaboo ? (
                                      <AlertTriangle className="h-3.5 w-3.5 text-[#B45309]" />
                                    ) : (
                                      <Sparkles className="h-3.5 w-3.5 text-[#B45309]" />
                                    )}
                                    <span>{c.title}</span>
                                  </div>
                                  <p className="text-xs text-[#78716C] leading-relaxed">{c.description}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Tab 4: Currency & Live Forex API (Buy/Sell Rates & Structured Tipping) */}
                          {activeTab === "forex" && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {/* 1. Mid Rate */}
                              <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E8E2D5] flex flex-col justify-between">
                                <div>
                                  <div className="text-[10px] uppercase font-bold text-[#78716C] mb-1 flex items-center justify-between">
                                    <span>Live Mid-Market FX</span>
                                    <span className="h-2 w-2 rounded-full bg-[#2D5A46] animate-pulse" />
                                  </div>
                                  {isFxLoading ? (
                                    <div className="text-xs text-[#78716C] flex items-center gap-1 py-1">
                                      <RefreshCw className="h-3 w-3 animate-spin text-[#B45309]" />
                                      <span>Loading FX…</span>
                                    </div>
                                  ) : fxData ? (
                                    <div>
                                      <div className="text-base font-bold font-mono text-[#1C1917]">
                                        1 USD = {fxData.midRate} {targetCurrency}
                                      </div>
                                      <div className="text-[10px] text-[#78716C] mt-0.5">{fxData.source}</div>
                                      <div className="mt-2 pt-2 border-t border-[#F3EFE6] space-y-0.5 font-mono text-[11px]">
                                        <div className="flex justify-between">
                                          <span className="text-[#78716C]">10 USD</span>
                                          <span className="font-semibold text-[#B45309]">{(10 * fxData.midRate).toFixed(2)} {targetCurrency}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-[#78716C]">100 USD</span>
                                          <span className="font-semibold text-[#B45309]">{(100 * fxData.midRate).toFixed(2)} {targetCurrency}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="text-xs font-bold text-[#1C1917]">
                                        {culture?.currencyInfo?.code || "EUR"} ({culture?.currencyInfo?.name || "Euro"})
                                      </div>
                                      <div className="text-[10px] text-[#78716C] mt-1">
                                        {culture?.currencyInfo?.exchangeRate || "Active market reference"}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 2. Buy & Sell Rates (Replacing Cards Acceptance) */}
                              <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E8E2D5] flex flex-col justify-between">
                                <div>
                                  <div className="text-[10px] uppercase font-bold text-[#78716C] mb-1.5 flex items-center gap-1">
                                    <CreditCard className="h-3 w-3 text-[#B45309]" />
                                    <span>Forex Buy & Sell Rates</span>
                                  </div>
                                  {fxData ? (
                                    <div className="space-y-2">
                                      <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E8E2D5]">
                                        <div className="text-[9px] uppercase font-bold text-[#2D5A46] flex items-center gap-1">
                                          <TrendingDown className="h-2.5 w-2.5" />
                                          <span>Buy Rate (You Get)</span>
                                        </div>
                                        <div className="text-xs font-bold font-mono text-[#1C1917] mt-0.5">
                                          1 USD ≈ {fxData.buyRate} {targetCurrency}
                                        </div>
                                      </div>
                                      <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E8E2D5]">
                                        <div className="text-[9px] uppercase font-bold text-[#B45309] flex items-center gap-1">
                                          <TrendingUp className="h-2.5 w-2.5" />
                                          <span>Sell Rate (Exchange Back)</span>
                                        </div>
                                        <div className="text-xs font-bold font-mono text-[#1C1917] mt-0.5">
                                          1 USD ≈ {fxData.sellRate} {targetCurrency}
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-[11px] text-[#78716C]">
                                      Standard spread: ~1.5% retail exchange spread.
                                    </div>
                                  )}
                                </div>
                                <div className="text-[10px] text-[#78716C] pt-1.5 border-t border-[#F3EFE6] mt-1">
                                  Inverse: 1 {targetCurrency} ≈ {fxData?.inverseRate || "0.02"} USD
                                </div>
                              </div>

                              {/* 3. Clean Structured Tipping Norms */}
                              <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E8E2D5] flex flex-col justify-between">
                                <div>
                                  <div className="text-[10px] uppercase font-bold text-[#78716C] mb-1.5 flex items-center gap-1">
                                    <Sparkles className="h-3 w-3 text-[#B45309]" />
                                    <span>Tipping Norms</span>
                                  </div>
                                  <div className="space-y-1.5">
                                    {getStructuredTippingNorms(culture?.currencyInfo?.tips).map((norm, nIdx) => (
                                      <div key={nIdx} className="p-1.5 rounded-lg bg-[#FAF7F2] border border-[#E8E2D5] text-[11px]">
                                        <div className="font-bold text-[#1C1917] text-[10px] mb-0.5 flex items-center gap-1">
                                          <span className="h-1 w-1 rounded-full bg-[#B45309]" />
                                          <span>{norm.label}</span>
                                        </div>
                                        <p className="text-[#78716C] text-[10px] leading-tight">
                                          {norm.text}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Personal Notes with DEBOUNCED AUTO-SAVE */}
                          <div className="pt-3 border-t border-[#E8E2D5]">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                                <StickyNote className="h-3.5 w-3.5 text-[#B45309]" />
                                <span>Expedition Notes</span>
                              </div>
                              <div className="text-[11px] text-[#78716C]">
                                {notesStatus[trip.id] === "saving" ? (
                                  <span className="text-[#B45309]">Saving…</span>
                                ) : notesStatus[trip.id] === "saved" ? (
                                  <span className="text-[#2D5A46] font-medium flex items-center gap-1">
                                    <Check className="h-3 w-3" /> Saved
                                  </span>
                                ) : (
                                  <span className="text-[#A8A29E]">Auto-saves</span>
                                )}
                              </div>
                            </div>
                            <textarea
                              value={editingNotes[trip.id] !== undefined ? editingNotes[trip.id] : trip.notes || ""}
                              onChange={(e) => handleNotesChange(trip.id, e.target.value)}
                              placeholder="Add flight seat preferences, train tickets, hotel bookings, or itinerary notes..."
                              rows={2}
                              className="w-full text-xs p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E2D5] focus:outline-none focus:border-[#B45309] text-[#1C1917] placeholder:text-[#A8A29E]"
                            />
                          </div>

                          {/* Bottom Actions: Explore Readiness moved to bottom right, left of Delete Saved Trip */}
                          <div className="pt-2 flex items-center justify-end">
                            <div className="flex items-center gap-2">
                              {/* Explore Travel Readiness guide button to the left */}
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  triggerTransition({
                                    targetIata: trip.destinationIata,
                                    targetCity: trip.destinationCity || trip.destinationIata,
                                    targetUrl: `/travel-readiness?dest=${encodeURIComponent(trip.destinationIata)}&origin=${encodeURIComponent(trip.originIata)}`,
                                    origin: trip.originIata,
                                  });
                                }}
                                className="px-3 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#FAF7F2] text-[#1C1917] border border-[#E8E2D5] hover:border-[#B45309]/50 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs group cursor-pointer"
                                title="Explore full travel readiness dossier"
                              >
                                <Luggage className="h-3.5 w-3.5 text-[#B45309]" />
                                <span>Explore Readiness</span>
                                <ArrowRight className="h-3 w-3 text-[#B45309] group-hover:translate-x-0.5 transition-transform" />
                              </button>

                              {/* Delete Button with Distinct Red Tint */}
                              <button
                                type="button"
                                onClick={() => setTripToDelete(trip)}
                                className="px-3.5 py-1.5 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] hover:border-[#FCA5A5] text-xs font-semibold text-[#DC2626] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs group"
                                title="Delete saved trip"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-[#DC2626] transition-colors" />
                                <span>Delete Saved Trip</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-3.5 bg-[#FFFFFF] border-t border-[#E8E2D5] flex items-center justify-between text-xs text-[#78716C]">
          <span>Personal Travel Dossier</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F3EFE6] border border-[#E8E2D5] text-xs font-semibold text-[#1C1917] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>

      {/* Confirmation Popup Modal for Trip Deletion */}
      <AnimatePresence>
        {tripToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTripToDelete(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-[#FFFFFF] border border-[#E8E2D5] rounded-3xl p-6 sm:p-7 shadow-2xl z-20 space-y-5"
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
                    Are you sure you want to delete this trip to {tripToDelete.destinationCity}? This will permanently remove your itinerary and notes.
                  </p>
                </div>
              </div>

              <div className="bg-[#FAF7F2] border border-[#E8E2D5] rounded-2xl p-4 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#1C1917] flex items-center gap-2">
                    <span>{getCountryFlag(tripToDelete.destinationIata)}</span>
                    <span>
                      {tripToDelete.originCity} ({tripToDelete.originIata}) → {tripToDelete.destinationCity} ({tripToDelete.destinationIata})
                    </span>
                  </div>
                  <div className="text-[11px] text-[#78716C] mt-1">
                    {tripToDelete.departDate}
                  </div>
                </div>
                <div className="font-mono font-bold text-[#B45309] text-sm">
                  {getCurrencySymbol(tripToDelete.currency || "EUR")}
                  {Math.round(tripToDelete.totalCost || tripToDelete.farePrice || 0)}
                </div>
              </div>

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
                  className="px-5 py-2.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
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
