"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { ScoredOrigin, SearchParams, StreamEvent } from "@/types";
import { SearchForm } from "@/components/SearchForm";
import { MapView } from "@/components/MapView";
import { ResultsList } from "@/components/ResultsList";
import { CleanSearchLanding } from "@/components/CleanSearchLanding";
import { DestinationCulturalModal } from "@/components/DestinationCulturalModal";
import { FlightSearchSkyAnimation } from "@/components/FlightSearchSkyAnimation";
import { MyTripsModal } from "@/components/MyTripsModal";
import { useSuitcaseTransition } from "@/components/SuitcaseTransitionProvider";
import type { SavedTrip, CreateTripInput } from "@/types";
import {
  MapPin,
  Home as HomeIcon,
  ChevronDown,
  ChevronUp,
  List,
  Map as MapIcon,
  Compass,
  Luggage,
  Check,
  Bookmark,
} from "lucide-react";
import { FALLBACK_AIRPORTS } from "@/lib/airport-data";
import { convertCurrency, getCurrencySymbol } from "@/lib/currency";
import {
  getMemoryDestination,
  getMemoryHomeAirport,
  setMemoryDestination,
  setMemoryHomeAirport,
} from "@/lib/search-memory";

function HomeContent() {
  const [viewMode, setViewMode] = useState<"landing" | "results">("landing");
  const [isFlightAnimationActive, setIsFlightAnimationActive] = useState(false);
  const [isFlightReady, setIsFlightReady] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [culturalModalOpen, setCulturalModalOpen] = useState(false);
  const [culturalModalResult, setCulturalModalResult] = useState<ScoredOrigin | null>(null);

  const [results, setResults] = useState<ScoredOrigin[]>([]);
  const [selected, setSelected] = useState<ScoredOrigin | null>(null);
  /** Flight path + route camera only after the user picks a result */
  const [showRouteOnMap, setShowRouteOnMap] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(process.env.NEXT_PUBLIC_DEMO_MOCK === "true");
  const [progress, setProgress] = useState({ checked: 0, total: 0 });
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  // Empty on hard refresh; restored from in-memory store after soft navigations
  const [baseAirport, setBaseAirport] = useState(() => getMemoryHomeAirport());
  const [destinationAirport, setDestinationAirport] = useState(() => getMemoryDestination());
  const [currency, setCurrency] = useState("USD");
  const [resultsCurrencyOpen, setResultsCurrencyOpen] = useState(false);
  const resultsCurrencyRef = useRef<HTMLDivElement>(null);
  const [timeValue, setTimeValue] = useState(15);
  const [errors, setErrors] = useState<string[]>([]);
  const [activeMobileView, setActiveMobileView] = useState<"map" | "list">("list");
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const hasRestoredCurrency = useRef(false);
  const { triggerTransition } = useSuitcaseTransition();

  // Close results currency dropdown on outside click or Escape
  useEffect(() => {
    if (!resultsCurrencyOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (resultsCurrencyRef.current && !resultsCurrencyRef.current.contains(event.target as Node)) {
        setResultsCurrencyOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setResultsCurrencyOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [resultsCurrencyOpen]);

  // In-memory cache for search results to support instant swapping between dates
  const searchCacheRef = useRef<Map<string, ScoredOrigin[]>>(new Map());
  const [cachedDatePrices, setCachedDatePrices] = useState<Record<string, number>>({});

  const getSearchCacheKey = useCallback((p: SearchParams): string => {
    return [
      (p.homeAirport || "").trim().toUpperCase(),
      (p.destination || "").trim().toUpperCase(),
      p.dateFrom,
      p.tripType === "oneway" ? "" : (p.dateTo || ""),
      p.tripType ?? (p.dateTo ? "round" : "oneway"),
      p.passengers ?? 1,
      p.currency ?? "USD",
      p.radiusMiles ?? 300,
    ].join("::");
  }, []);

  const handleHomeAirportChange = useCallback((iata: string) => {
    const next = (iata || "").trim().toUpperCase();
    setBaseAirport(next);
    setMemoryHomeAirport(next);
  }, []);

  const handleDestinationChange = useCallback((iata: string) => {
    const next = (iata || "").trim().toUpperCase();
    setDestinationAirport(next);
    setMemoryDestination(next);
  }, []);

  // My Trips database state
  const [myTripsOpen, setMyTripsOpen] = useState(false);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  const fetchSavedTrips = useCallback(async () => {
    try {
      const res = await fetch("/api/trips");
      if (res.ok) {
        const data = await res.json();
        setSavedTrips(data.trips || []);
      }
    } catch (err) {
      console.error("[page] Failed to fetch saved trips:", err);
    }
  }, []);

  useEffect(() => {
    fetchSavedTrips();
  }, [fetchSavedTrips]);

  // Sync airports from URL (deep links) or in-memory session — never localStorage on hard refresh
  useEffect(() => {
    if (typeof window === "undefined") return;

    const qDest = urlSearchParams?.get("destination") || urlSearchParams?.get("dest");
    const qOrigin = urlSearchParams?.get("homeAirport") || urlSearchParams?.get("origin");

    if (qDest && qDest.trim()) {
      handleDestinationChange(qDest);
    } else {
      const remembered = getMemoryDestination();
      if (remembered) setDestinationAirport(remembered);
    }

    if (qOrigin && qOrigin.trim()) {
      handleHomeAirportChange(qOrigin);
    } else {
      const remembered = getMemoryHomeAirport();
      if (remembered) setBaseAirport(remembered);
    }

    if (!hasRestoredCurrency.current) {
      const savedCurrency = localStorage.getItem("flightdeck_currency");
      if (savedCurrency && ["USD", "EUR", "GBP"].includes(savedCurrency.toUpperCase())) {
        const next = savedCurrency.toUpperCase();
        // Default timeValue is authored in USD; convert when restoring a non-USD preference
        if (next !== "USD") {
          setTimeValue((tv) => Math.round(convertCurrency(tv, "USD", next)));
        }
        setCurrency(next);
      }
      hasRestoredCurrency.current = true;
    }
  }, [urlSearchParams, handleDestinationChange, handleHomeAirportChange]);

  // Convert stored result amounts into the currently selected display currency,
  // then re-rank when timeValue or currency changes.
  const homeAirportIata = searchParams?.homeAirport ?? baseAirport;

  const resultsInDisplayCurrency = results.map((r) => {
    if (!r.fare) return r;

    const fareFrom = r.fare.currency || searchParams?.currency || currency;
    const groundFrom = r.groundLeg.currency || fareFrom;
    const farePrice = Math.round(convertCurrency(r.fare.price, fareFrom, currency));
    const groundPrice =
      Math.round(convertCurrency(r.groundLeg.price, groundFrom, currency) * 10) / 10;

    return {
      ...r,
      fare: { ...r.fare, price: farePrice, currency },
      groundLeg: { ...r.groundLeg, price: groundPrice, currency },
    };
  });

  const rawHome = resultsInDisplayCurrency.find((r) => r.airport.iata === homeAirportIata);
  const homeDynamicTotal = rawHome?.fare
    ? rawHome.fare.price + rawHome.groundLeg.price + rawHome.groundLeg.duration * timeValue
    : null;

  const reRankedResults = resultsInDisplayCurrency
    .map((r) => {
      if (!r.fare) {
        return {
          ...r,
          totalCost: 999999,
          savingsVsHome: -999999,
        };
      }
      const timeCost = r.groundLeg.duration * timeValue;
      const totalCost = r.fare.price + r.groundLeg.price + timeCost;
      const savingsVsHome = homeDynamicTotal !== null ? homeDynamicTotal - totalCost : 0;
      return {
        ...r,
        totalCost,
        breakdown: {
          fare: r.fare.price,
          groundCost: r.groundLeg.price,
          timeCost,
        },
        savingsVsHome,
        providerDebug: {
          ...r.providerDebug,
          formulaInputs: {
            ...r.providerDebug.formulaInputs,
            timeValuePerHour: timeValue,
            timeCost,
            total: totalCost,
          },
        },
      };
    })
    .sort((a, b) => {
      if (!a.fare && !b.fare) return 0;
      if (!a.fare) return 1;
      if (!b.fare) return -1;
      return a.totalCost - b.totalCost;
    });

  const handleCurrencyChange = useCallback(
    (nextCurrency: string) => {
      const next = nextCurrency.toUpperCase();
      if (next === currency) return;
      setTimeValue((prev) => Math.round(convertCurrency(prev, currency, next)));
      setCurrency(next);
      if (typeof window !== "undefined") {
        localStorage.setItem("flightdeck_currency", next);
      }
    },
    [currency]
  );

  const executeSearch = useCallback(
    async (params: SearchParams) => {
      const cacheKey = getSearchCacheKey(params);
      const cached = searchCacheRef.current.get(cacheKey);

      // Instant cache swap: If results for this date & params were already computed, swap instantly!
      if (cached && cached.length > 0) {
        if (abortRef.current) abortRef.current.abort();
        setSearchParams(params);
        handleHomeAirportChange(params.homeAirport);
        handleDestinationChange(params.destination);
        setCurrency(params.currency);
        setResults(cached);
        setErrors([]);
        setSelected(null);
        setShowRouteOnMap(false);
        setIsLoading(false);
        setIsFlightReady(true);
        return;
      }

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setResults([]);
      setErrors([]);
      setSelected(null);
      setShowRouteOnMap(false);
      setIsLoading(true);
      setSearchParams(params);
      handleHomeAirportChange(params.homeAirport);
      handleDestinationChange(params.destination);
      setCurrency(params.currency);
      setProgress({ checked: 0, total: 0 });

      const accumulatedResults: ScoredOrigin[] = [];

      const qs = new URLSearchParams({
        destination: params.destination,
        homeAirport: params.homeAirport,
        dateFrom: params.dateFrom,
        radiusMiles: String(params.radiusMiles),
        timeValuePerHour: String(params.timeValuePerHour),
        currency: params.currency,
      });
      if (params.dateTo) qs.set("dateTo", params.dateTo);
      if (params.tripType) qs.set("tripType", params.tripType);
      if (params.passengers) qs.set("passengers", String(params.passengers));

      try {
        const res = await fetch(`/api/reverse?${qs}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Search failed: ${res.status}`);
        }

        const demoHeader = res.headers.get("X-Demo-Mode");
        if (demoHeader !== null) {
          setIsDemo(demoHeader === "true");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

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
            try {
              const event = JSON.parse(line) as StreamEvent;
              if (event.type === "progress") {
                setProgress({ checked: event.checked, total: event.total });
              } else if (event.type === "result") {
                accumulatedResults.push(event.data);
                setResults((prev) => [...prev, event.data]);
                // When first results arrive, allow flight exit
                setIsFlightReady(true);
              } else if (event.type === "error") {
                setErrors((prev) => [...prev, `${event.originIata}: ${event.message}`]);
              }
            } catch {
              // ignore malformed NDJSON lines
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setErrors((prev) => [...prev, `Search error: ${err.message}`]);
        }
      } finally {
        if (accumulatedResults.length > 0) {
          searchCacheRef.current.set(cacheKey, accumulatedResults);
          const fares = accumulatedResults
            .filter((r) => r.fare && typeof r.fare.price === "number")
            .map((r) => r.fare!.price);
          if (fares.length > 0) {
            const minFare = Math.min(...fares);
            setCachedDatePrices((prev) => ({
              ...prev,
              [params.dateFrom]: minFare,
            }));
          }
        }
        setIsLoading(false);
        setIsFlightReady(true);
      }
    },
    [handleHomeAirportChange, handleDestinationChange, getSearchCacheKey]
  );

  // Flexible dates: instantly swaps cached results or reloads for the clicked date
  const handleSelectFlexibleDate = useCallback(
    (newDate: string) => {
      if (!searchParams || searchParams.dateFrom === newDate) return;

      const nextParams: SearchParams = {
        ...searchParams,
        dateFrom: newDate,
      };

      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("dateFrom", newDate);
        window.history.replaceState({}, "", url.toString());
      }

      executeSearch(nextParams);
    },
    [searchParams, executeSearch]
  );

  // Premium, silky plane flight search sequence with guaranteed 3s buffer
  const handleSearchWithAnimation = useCallback(
    async (params: SearchParams) => {
      handleHomeAirportChange(params.homeAirport);
      handleDestinationChange(params.destination);
      setSearchParams(params);

      // Trigger the airplane flight sky sequence first
      setIsFlightAnimationActive(true);
      setIsFlightReady(false);

      // Start the actual route scan in the background
      executeSearch(params);

      // Defer background results/map mounting by 650ms so the plane's left-side entrance
      // runs at a flawless 60fps with zero Leaflet/DOM main-thread contention.
      // Since cruising has a 3-second guaranteed buffer, the map will be fully mounted
      // and painted over 2 full seconds before the plane accelerates off to the right!
      setTimeout(() => {
        setViewMode("results");
      }, 650);
    },
    [executeSearch, handleHomeAirportChange, handleDestinationChange]
  );

  // When plane exits screen to the right, clean up animation overlay
  const handleFlightAnimationComplete = useCallback(() => {
    setIsFlightAnimationActive(false);
  }, []);

  /** Logo click: return to landing. Same URL `/` so Link alone is a no-op in results. */
  const goHome = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
    setIsFlightAnimationActive(false);
    setIsFlightReady(false);
    setIsSearchExpanded(false);
    setSelected(null);
    setShowRouteOnMap(false);
    setCulturalModalOpen(false);
    setCulturalModalResult(null);
    setViewMode("landing");
  }, []);

  const handleSelectResult = useCallback((r: ScoredOrigin) => {
    setSelected(r);
    setShowRouteOnMap(true);
  }, []);

  const handleSetBaseAirport = useCallback(
    (newIata: string) => {
      handleHomeAirportChange(newIata);
      if (searchParams) {
        executeSearch({
          ...searchParams,
          homeAirport: newIata,
        });
      }
    },
    [searchParams, executeSearch, handleHomeAirportChange]
  );

  const currentBaseInfo = FALLBACK_AIRPORTS.find((a) => a.iata === homeAirportIata);
  const currentDestInfo = FALLBACK_AIRPORTS.find((a) => a.iata === destinationAirport);

  const [guideTargetIata, setGuideTargetIata] = useState<string | null>(null);
  const [guideTargetCity, setGuideTargetCity] = useState<string | undefined>(undefined);

  const handleOpenCulturalGuide = useCallback(
    (targetIata?: string, targetCity?: string, result?: ScoredOrigin) => {
      if (result) {
        setCulturalModalResult(result);
        setGuideTargetIata(result.airport.iata);
        setGuideTargetCity(result.airport.city);
      } else if (targetIata) {
        setCulturalModalResult(null);
        setGuideTargetIata(targetIata);
        setGuideTargetCity(targetCity);
      } else if (selected) {
        setCulturalModalResult(selected);
        setGuideTargetIata(selected.airport.iata);
        setGuideTargetCity(selected.airport.city);
      } else {
        setCulturalModalResult(null);
        setGuideTargetIata(destinationAirport);
        setGuideTargetCity(currentDestInfo?.city);
      }
      setCulturalModalOpen(true);
    },
    [selected, destinationAirport, currentDestInfo]
  );

  const handleSaveTrip = useCallback(
    async (result: ScoredOrigin) => {
      const departureDate =
        searchParams?.dateFrom ||
        result.fare?.departAt ||
        new Date().toISOString().split("T")[0];
      const returnDateVal =
        searchParams?.tripType === "round"
          ? searchParams?.dateTo || result.fare?.returnAt
          : undefined;

      const destCode = searchParams?.destination || destinationAirport;
      const destCity = currentDestInfo?.city || destCode;

      const payload: CreateTripInput = {
        originIata: result.airport.iata,
        originCity: result.airport.city,
        destinationIata: destCode,
        destinationCity: destCity,
        departDate: departureDate,
        returnDate: returnDateVal,
        tripType: searchParams?.tripType || (returnDateVal ? "round" : "oneway"),
        passengers: searchParams?.passengers ?? 1,
        farePrice: result.fare?.price,
        currency: currency,
        totalCost: result.totalCost,
        savingsVsHome: result.savingsVsHome,
        transferMode: result.groundLeg.mode,
        transferPrice: result.groundLeg.price,
        transferDurationHours: result.groundLeg.duration,
        airline: result.fare?.provider,
        bookingUrl: result.fare?.bookingUrl,
      };

      try {
        const res = await fetch("/api/trips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await fetchSavedTrips();
          showToast(`Trip ${result.airport.city} ➔ ${destCity} saved to My Trips!`);
        } else {
          showToast("Failed to save trip to database.");
        }
      } catch (err) {
        console.error("Failed to save trip:", err);
        showToast("Error saving trip to database.");
      }
    },
    [searchParams, destinationAirport, currentDestInfo, currency, fetchSavedTrips, showToast]
  );

  const handleSaveDestinationTrip = useCallback(
    async (destIata: string, destCity?: string, culturalInfo?: any) => {
      const departureDate =
        searchParams?.dateFrom || new Date().toISOString().split("T")[0];
      const returnDateVal =
        searchParams?.tripType === "round" ? searchParams?.dateTo : undefined;

      const payload: CreateTripInput = {
        originIata: homeAirportIata,
        originCity: currentBaseInfo?.city || homeAirportIata,
        destinationIata: destIata,
        destinationCity: destCity || destIata,
        departDate: departureDate,
        returnDate: returnDateVal,
        tripType: searchParams?.tripType || (returnDateVal ? "round" : "oneway"),
        farePrice: culturalModalResult?.fare?.price,
        currency: currency,
        culturalInfo,
      };

      try {
        const res = await fetch("/api/trips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await fetchSavedTrips();
          showToast(`Destination ${destCity || destIata} saved to My Trips!`);
        } else {
          showToast("Failed to save trip to database.");
        }
      } catch (err) {
        console.error("Failed to save destination trip:", err);
        showToast("Error saving trip to database.");
      }
    },
    [searchParams, homeAirportIata, currentBaseInfo, culturalModalResult, currency, fetchSavedTrips, showToast]
  );

  const homeResult = reRankedResults.find((r) => r.airport.iata === homeAirportIata) ?? null;
  const displaySelected = selected
    ? reRankedResults.find((r) => r.airport.iata === selected.airport.iata) ?? selected
    : null;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917] font-sans selection:bg-[#B45309]/15 selection:text-[#1C1917]">
      {/* Plane Flying Across Sky Search Overlay */}
      <AnimatePresence>
        {isFlightAnimationActive && (
          <FlightSearchSkyAnimation
            isActive={isFlightAnimationActive}
            isReady={isFlightReady}
            onAnimationComplete={handleFlightAnimationComplete}
            originCity={currentBaseInfo?.city || homeAirportIata}
            originIata={homeAirportIata}
            destinationCity={currentDestInfo?.city || destinationAirport}
            destinationIata={destinationAirport}
            progress={progress}
          />
        )}
      </AnimatePresence>

      {/* Top Shimmer Loading Bar in Cognac & Forest */}
      {isLoading && !isFlightAnimationActive && (
        <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-[#E8E2D5] overflow-hidden pointer-events-none">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
            className="h-full w-1/3 bg-gradient-to-r from-[#2D5A46] via-[#D97706] to-[#B45309] rounded-full"
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {viewMode === "landing" ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
          >
            <CleanSearchLanding
              onSearch={handleSearchWithAnimation}
              isLoading={isLoading || isFlightAnimationActive}
              timeValue={timeValue}
              onTimeValueChange={setTimeValue}
              currency={currency}
              onCurrencyChange={handleCurrencyChange}
              currentHomeAirport={baseAirport}
              currentDestination={destinationAirport}
              onHomeAirportChange={handleHomeAirportChange}
              onDestinationChange={handleDestinationChange}
              hasResults={results.length > 0}
              isDemo={isDemo}
              onOpenCulturalGuide={(iata, city) => handleOpenCulturalGuide(iata, city)}
              savedTripsCount={savedTrips.length}
              onOpenMyTrips={() => setMyTripsOpen(true)}
            />

            {/* Destination Cultural Briefing Modal */}
            <DestinationCulturalModal
              isOpen={culturalModalOpen}
              onClose={() => setCulturalModalOpen(false)}
              destinationIata={guideTargetIata || destinationAirport}
              destinationCity={guideTargetCity || currentDestInfo?.city}
              bookingUrl={culturalModalResult?.fare?.bookingUrl || null}
              farePrice={
                culturalModalResult?.fare
                  ? Math.round(
                      convertCurrency(
                        culturalModalResult.fare.price,
                        culturalModalResult.fare.currency || currency,
                        currency
                      )
                    )
                  : undefined
              }
              fareCurrency={currency}
              originIata={baseAirport}
              isSaved={savedTrips.some((t) => t.destinationIata === (guideTargetIata || destinationAirport))}
              onSaveTrip={handleSaveDestinationTrip}
            />
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="h-screen flex flex-col bg-[#FAF7F2] text-[#1C1917] overflow-hidden"
          >
            {/* Top Venture Results Header */}
            <header className="flex-shrink-0 border-b border-[#E8E2D5] bg-[#FAF7F2]/90 backdrop-blur-md z-20 shadow-xs">
              <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
                {/* Brand → landing (same route `/`; must reset viewMode, not only navigate) */}
                <Link
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    goHome();
                  }}
                  className="select-none group cursor-pointer relative z-10"
                  aria-label="Back to Venture home"
                >
                  <span className="text-2xl font-serif font-bold tracking-tight text-[#1C1917] group-hover:text-[#B45309] transition-colors">
                    Venture
                  </span>
                </Link>

                {/* Selected Criteria Summary Bar — locations + dates only, centered */}
                <div
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2.5 px-4 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#B45309] text-xs transition-colors cursor-pointer shadow-xs select-none whitespace-nowrap"
                  title="Click to modify flight search criteria"
                >
                  <span className="flex items-center gap-1.5 font-semibold text-[#1C1917]">
                    <HomeIcon className="h-3.5 w-3.5 text-[#2D5A46] shrink-0" />
                    <span className="hidden sm:inline">{currentBaseInfo?.city || homeAirportIata} </span>
                    <span>({homeAirportIata})</span>
                  </span>

                  <span className="text-[#B45309] font-bold">➔</span>

                  <span className="flex items-center gap-1 font-semibold text-[#1C1917]">
                    <MapPin className="h-3.5 w-3.5 text-[#B45309] shrink-0" />
                    <span className="hidden sm:inline">{currentDestInfo?.city || destinationAirport} </span>
                    <span>({destinationAirport})</span>
                  </span>

                  <span className="text-[#E8E2D5]">|</span>

                  <span className="text-[#78716C] font-medium">
                    {searchParams?.tripType === "oneway" || !searchParams?.dateTo
                      ? `${searchParams?.dateFrom || "Upcoming"} · One way`
                      : `${searchParams?.dateFrom} ➔ ${searchParams?.dateTo}`}
                  </span>

                  <span className="ml-0.5 text-[#B45309]" aria-hidden="true">
                    {isSearchExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </span>
                </div>

                {/* Right Controls: Scanning badge, Currency, Mobile switch */}
                <div className="relative z-10 flex items-center gap-2 sm:gap-2.5">
                  {/* Live Progress Pill */}
                  {isLoading && (
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-md bg-[#F3EFE6] border border-[#E8E2D5] text-xs text-[#B45309] font-semibold">
                      <span className="h-3 w-3 border-2 border-[#B45309]/30 border-t-[#B45309] rounded-full animate-spin" />
                      <span>Scanning hubs ({progress.checked}/{progress.total || 25})</span>
                    </div>
                  )}

                  {/* Travel Readiness Top Bar Link with Cute Suitcase Animation */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerTransition({
                        targetIata: destinationAirport,
                        targetCity: currentDestInfo?.city || destinationAirport,
                        targetUrl: `/travel-readiness?dest=${encodeURIComponent(destinationAirport)}&origin=${encodeURIComponent(baseAirport)}`,
                        origin: baseAirport,
                      });
                    }}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#FAF7F2] text-[#1C1917] border border-[#E8E2D5] hover:border-[#B45309]/50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    title="Open Dedicated Travel Readiness Page"
                  >
                    <Luggage className="h-3.5 w-3.5 text-[#B45309]" />
                    <span>Travel Readiness</span>
                  </button>

                  {/* My Saved Trips Top Bar Link */}
                  <Link
                    href="/trips"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#FAF7F2] text-[#1C1917] border border-[#E8E2D5] hover:border-[#B45309]/50 text-xs font-semibold shadow-xs transition-colors cursor-pointer group"
                    title="Open My Saved Trips & Culture Dashboard Page"
                  >
                    <Bookmark className="h-3.5 w-3.5 text-[#B45309]" />
                    <span>My Trips</span>
                    {savedTrips.length > 0 && (
                      <span className="text-[10px] text-[#2D5A46] font-bold px-1.5 py-0.2 bg-[#E8F0EC] rounded-md border border-[#D1E4D8]">
                        {savedTrips.length}
                      </span>
                    )}
                  </Link>

                  {/* Currency Selector Dropdown */}
                  <div ref={resultsCurrencyRef} className="relative hidden sm:block">
                    <button
                      type="button"
                      onClick={() => setResultsCurrencyOpen(!resultsCurrencyOpen)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FFFFFF] hover:bg-[#FAF7F2] text-[#1C1917] border border-[#E8E2D5] hover:border-[#B45309]/50 transition-all shadow-xs cursor-pointer"
                      title="Select Currency"
                    >
                      <span className="font-mono font-bold text-[#B45309]">
                        {currency === "USD" ? "$" : currency === "EUR" ? "€" : "£"}
                      </span>
                      <span>{currency}</span>
                      <ChevronDown className="h-3 w-3 text-[#78716C]" />
                    </button>

                    {resultsCurrencyOpen && (
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
                              setResultsCurrencyOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF7F2] transition-colors ${
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

                  {/* Mobile View Switcher (Map vs List) */}
                  <div className="flex md:hidden items-center bg-[#F3EFE6] p-0.5 rounded-lg border border-[#E8E2D5]">
                    <button
                      type="button"
                      onClick={() => setActiveMobileView("list")}
                      className={`p-1.5 rounded-md text-xs font-medium ${
                        activeMobileView === "list" ? "bg-[#FFFFFF] text-[#1C1917] shadow-xs" : "text-[#64748B]"
                      }`}
                      title="View Results List"
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMobileView("map")}
                      className={`p-1.5 rounded-md text-xs font-medium ${
                        activeMobileView === "map" ? "bg-[#FFFFFF] text-[#1C1917] shadow-xs" : "text-[#64748B]"
                      }`}
                      title="View Map"
                    >
                      <MapIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content: Split Map + Results Feed (60% Neutral Surface / 30% Ink Structure / 10% Accent) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex-1 flex overflow-hidden min-h-0 relative bg-[#F8FAFC]"
            >
              {/* Search form overlays the map (transform/opacity — no layout thrash) */}
              <motion.div
                initial={false}
                animate={{
                  opacity: isSearchExpanded ? 1 : 0,
                  y: isSearchExpanded ? 0 : -12,
                }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-x-0 top-0 z-40 border-b border-[#E8E2D5] bg-[#FFFFFF] px-4 py-3 shadow-md"
                style={{
                  pointerEvents: isSearchExpanded ? "auto" : "none",
                  willChange: "transform, opacity",
                }}
                aria-hidden={!isSearchExpanded}
              >
                <div className="max-w-screen-2xl mx-auto">
                  <SearchForm
                    onSearch={(params) => {
                      setIsSearchExpanded(false);
                      executeSearch(params);
                    }}
                    isLoading={isLoading}
                    timeValue={timeValue}
                    onTimeValueChange={setTimeValue}
                    currency={currency}
                    onCurrencyChange={handleCurrencyChange}
                    currentHomeAirport={baseAirport}
                    currentDestination={destinationAirport}
                    currentTripType={searchParams?.tripType ?? "round"}
                    currentDateFrom={searchParams?.dateFrom}
                    currentDateTo={searchParams?.dateTo}
                    currentPassengers={searchParams?.passengers ?? 1}
                    currentRadiusMiles={searchParams?.radiusMiles ?? 300}
                    onOpenCulturalGuide={() => handleOpenCulturalGuide()}
                  />
                </div>
              </motion.div>

              {/* Interactive Map (Left) */}
              <div
                className={`flex-1 relative min-w-0 h-full ${
                  activeMobileView === "list" ? "hidden md:block" : "block"
                }`}
              >
                <MapView
                  results={reRankedResults}
                  selected={displaySelected}
                  onSelect={handleSelectResult}
                  showRoute={showRouteOnMap}
                  homeAirport={homeAirportIata}
                  destination={searchParams?.destination ?? destinationAirport}
                  currency={currency}
                  isLoading={isLoading}
                  radiusMiles={searchParams?.radiusMiles ?? 300}
                />
              </div>

              {/* Results Sidebar / Feed (Right) */}
              <div
                className={`w-full md:w-[470px] lg:w-[500px] flex-shrink-0 md:border-l border-[#E2E8F0] overflow-y-auto bg-[#F8FAFC] custom-scrollbar ${
                  activeMobileView === "map" ? "hidden md:block" : "block"
                }`}
              >
                <ResultsList
                  results={reRankedResults}
                  selected={displaySelected}
                  onSelect={handleSelectResult}
                  homeResult={homeResult}
                  timeValue={timeValue}
                  currency={currency}
                  destination={searchParams?.destination ?? destinationAirport}
                  departDate={searchParams?.dateFrom}
                  returnDate={searchParams?.tripType === "oneway" ? undefined : searchParams?.dateTo}
                  tripType={searchParams?.tripType ?? (searchParams?.dateTo ? "round" : "oneway")}
                  passengers={searchParams?.passengers ?? 1}
                  isLoading={isLoading}
                  errors={errors}
                  onSetBaseAirport={handleSetBaseAirport}
                  onOpenCulturalGuide={(r) => handleOpenCulturalGuide(undefined, undefined, r)}
                  savedOriginIatas={savedTrips.map((t) => t.originIata)}
                  onSaveTrip={handleSaveTrip}
                  onSelectDate={handleSelectFlexibleDate}
                  datePrices={cachedDatePrices}
                />
              </div>
            </motion.div>

            {/* Destination Cultural Intelligence Modal */}
            <DestinationCulturalModal
              isOpen={culturalModalOpen}
              onClose={() => setCulturalModalOpen(false)}
              destinationIata={searchParams?.destination ?? destinationAirport}
              destinationCity={culturalModalResult?.airport.city || currentDestInfo?.city}
              bookingUrl={culturalModalResult?.fare?.bookingUrl}
              farePrice={
                culturalModalResult?.fare
                  ? Math.round(
                      convertCurrency(
                        culturalModalResult.fare.price,
                        culturalModalResult.fare.currency || currency,
                        currency
                      )
                    )
                  : undefined
              }
              fareCurrency={currency}
              originIata={culturalModalResult?.airport.iata ?? homeAirportIata}
              isSaved={savedTrips.some((t) => t.destinationIata === (searchParams?.destination ?? destinationAirport))}
              onSaveTrip={handleSaveDestinationTrip}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global My Saved Trips Database Modal (Accessible from both Landing & Results) */}
      <MyTripsModal
        isOpen={myTripsOpen}
        onClose={() => setMyTripsOpen(false)}
        onTripsUpdated={fetchSavedTrips}
      />

      {/* Global Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4.5 py-3 rounded-2xl bg-[#1C1917] text-[#FAF7F2] border border-[#292524] shadow-2xl text-xs font-semibold"
          >
            <Check className="h-4 w-4 text-[#2D5A46]" />
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => {
                setToastMessage(null);
                setMyTripsOpen(true);
              }}
              className="ml-2 px-2.5 py-1 rounded-md bg-[#B45309] hover:bg-[#D97706] text-white text-[11px] font-bold transition-colors"
            >
              View Trips
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
          <span className="h-8 w-8 border-3 border-[#B45309]/30 border-t-[#B45309] rounded-full animate-spin" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
