"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ScoredOrigin, SearchParams, StreamEvent } from "@/types";
import { SearchForm } from "@/components/SearchForm";
import { MapView } from "@/components/MapView";
import { ResultsList } from "@/components/ResultsList";
import { DebugDrawer } from "@/components/DebugDrawer";
import { CleanSearchLanding } from "@/components/CleanSearchLanding";
import { DestinationCulturalModal } from "@/components/DestinationCulturalModal";
import { FlightSearchSkyAnimation } from "@/components/FlightSearchSkyAnimation";
import {
  MapPin,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  List,
  Map as MapIcon,
  Compass,
} from "lucide-react";
import { FALLBACK_AIRPORTS } from "@/lib/airport-data";

export default function Home() {
  const [viewMode, setViewMode] = useState<"landing" | "results">("landing");
  const [isFlightAnimationActive, setIsFlightAnimationActive] = useState(false);
  const [isFlightReady, setIsFlightReady] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [culturalModalOpen, setCulturalModalOpen] = useState(false);
  const [culturalModalResult, setCulturalModalResult] = useState<ScoredOrigin | null>(null);

  const [results, setResults] = useState<ScoredOrigin[]>([]);
  const [selected, setSelected] = useState<ScoredOrigin | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(process.env.NEXT_PUBLIC_DEMO_MOCK === "true");
  const [progress, setProgress] = useState({ checked: 0, total: 0 });
  const [debugOpen, setDebugOpen] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [baseAirport, setBaseAirport] = useState("FCO");
  const [destinationAirport, setDestinationAirport] = useState("NRT");
  const [currency, setCurrency] = useState("EUR");
  const [timeValue, setTimeValue] = useState(15);
  const [errors, setErrors] = useState<string[]>([]);
  const [activeMobileView, setActiveMobileView] = useState<"map" | "list">("list");
  const abortRef = useRef<AbortController | null>(null);

  // Dynamic re-ranking and re-scoring when timeValue slider changes
  const homeAirportIata = searchParams?.homeAirport ?? baseAirport;
  const rawHome = results.find((r) => r.airport.iata === homeAirportIata);
  const homeDynamicTotal = rawHome?.fare
    ? rawHome.fare.price + rawHome.groundLeg.price + rawHome.groundLeg.duration * timeValue
    : null;

  const reRankedResults = results
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

  // Keyboard shortcut: D to open debug drawer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "d" || e.key === "D") {
        if (
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA"
        ) {
          setDebugOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const executeSearch = useCallback(async (params: SearchParams) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setResults([]);
    setErrors([]);
    setSelected(null);
    setIsLoading(true);
    setSearchParams(params);
    setBaseAirport(params.homeAirport);
    setDestinationAirport(params.destination);
    setCurrency(params.currency);
    setProgress({ checked: 0, total: 0 });

    const qs = new URLSearchParams({
      destination: params.destination,
      homeAirport: params.homeAirport,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      radiusMiles: String(params.radiusMiles),
      timeValuePerHour: String(params.timeValuePerHour),
      currency: params.currency,
    });

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
      setIsLoading(false);
      setIsFlightReady(true);
    }
  }, []);

  // Premium, silky plane flight search sequence with guaranteed 3s buffer
  const handleSearchWithAnimation = useCallback(
    async (params: SearchParams) => {
      setBaseAirport(params.homeAirport);
      setDestinationAirport(params.destination);
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
    [executeSearch]
  );

  // When plane exits screen to the right, clean up animation overlay
  const handleFlightAnimationComplete = useCallback(() => {
    setIsFlightAnimationActive(false);
  }, []);

  const handleSetBaseAirport = useCallback(
    (newIata: string) => {
      setBaseAirport(newIata);
      if (searchParams) {
        executeSearch({
          ...searchParams,
          homeAirport: newIata,
        });
      }
    },
    [searchParams, executeSearch]
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

  const homeResult = searchParams
    ? results.find((r) => r.airport.iata === searchParams.homeAirport)
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
              onCurrencyChange={setCurrency}
              currentHomeAirport={baseAirport}
              currentDestination={destinationAirport}
              onHomeAirportChange={setBaseAirport}
              onDestinationChange={setDestinationAirport}
              hasResults={results.length > 0}
              onOpenMap={() => setViewMode("results")}
              isDemo={isDemo}
              onOpenCulturalGuide={(iata, city) => handleOpenCulturalGuide(iata, city)}
            />

            {/* Destination Cultural Briefing Modal */}
            <DestinationCulturalModal
              isOpen={culturalModalOpen}
              onClose={() => setCulturalModalOpen(false)}
              destinationIata={guideTargetIata || destinationAirport}
              destinationCity={guideTargetCity || currentDestInfo?.city}
              bookingUrl={culturalModalResult?.fare?.bookingUrl || null}
              farePrice={culturalModalResult?.fare?.price}
              fareCurrency={currency}
              originIata={baseAirport}
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
            <header className="flex-shrink-0 border-b border-[#E8E2D5] bg-[#FFFFFF] z-20 shadow-xs">
              <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
                {/* Brand & Back Button */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setViewMode("landing")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#F3EFE6] text-xs font-semibold text-[#1C1917] transition-colors border border-[#E8E2D5]"
                    title="Return to search"
                  >
                    <ArrowLeft className="h-4 w-4 text-[#B45309]" />
                    <span>New search</span>
                  </button>

                  <div className="hidden sm:flex items-center gap-2 border-l border-[#E8E2D5] pl-3">
                    <span className="font-serif font-bold text-lg text-[#1C1917] tracking-tight">
                      Venture
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#F3EFE6] border border-[#E8E2D5] text-[#78716C]">
                      Atlas View
                    </span>
                  </div>
                </div>

                {/* Selected Criteria Summary Bar */}
                <div
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                  className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#FFFFFF] hover:bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#B45309] text-xs transition-colors cursor-pointer shadow-xs select-none"
                  title="Click to modify flight search criteria"
                >
                  {/* Origin */}
                  <span className="flex items-center gap-1.5 font-semibold text-[#1C1917]">
                    <span className="h-2 w-2 rounded-full border-2 border-[#2D5A46]" />
                    <span>{currentBaseInfo?.city || homeAirportIata} ({homeAirportIata})</span>
                  </span>

                  <span className="text-[#B45309] font-bold">➔</span>

                  {/* Destination */}
                  <span className="flex items-center gap-1 font-semibold text-[#1C1917]">
                    <MapPin className="h-3.5 w-3.5 text-[#B45309]" />
                    <span>{currentDestInfo?.city || destinationAirport} ({destinationAirport})</span>
                  </span>

                  <span className="text-[#E8E2D5] hidden md:inline">|</span>

                  {/* Date */}
                  <span className="text-[#78716C] font-medium hidden md:inline">
                    {searchParams?.dateFrom}
                  </span>

                  {/* Radius & Time Value */}
                  <span className="text-[#78716C] hidden lg:inline">
                    · {searchParams?.radiusMiles || 300} mi · ${timeValue}/hr
                  </span>

                  {/* Modify toggle */}
                  <span className="ml-1 text-xs font-bold text-[#B45309] flex items-center gap-0.5">
                    <span>{isSearchExpanded ? "Close" : "Modify"}</span>
                    {isSearchExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </span>
                </div>

                {/* Right Controls: Scanning badge, Currency, Mobile switch */}
                <div className="flex items-center gap-2">
                  {/* Live Progress Pill */}
                  {isLoading && (
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3EFE6] border border-[#E8E2D5] text-xs text-[#B45309] font-semibold">
                      <span className="h-3 w-3 border-2 border-[#B45309]/30 border-t-[#B45309] rounded-full animate-spin" />
                      <span>Scanning hubs ({progress.checked}/{progress.total || 25})</span>
                    </div>
                  )}

                  {/* Currency selector */}
                  <div className="hidden sm:flex items-center bg-[#F3EFE6] border border-[#E8E2D5] rounded-full p-0.5 text-xs">
                    {(["EUR", "USD", "GBP"] as const).map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => {
                          setCurrency(curr);
                          if (searchParams) {
                            executeSearch({ ...searchParams, currency: curr });
                          }
                        }}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          currency === curr
                            ? "bg-[#FFFFFF] text-[#1C1917] shadow-xs font-semibold"
                            : "text-[#78716C] hover:text-[#1C1917]"
                        }`}
                      >
                        {curr === "EUR" ? "€ EUR" : curr === "USD" ? "$ USD" : "£ GBP"}
                      </button>
                    ))}
                  </div>

                  {/* Mobile View Switcher (Map vs List) */}
                  <div className="flex md:hidden items-center bg-[#F3EFE6] p-0.5 rounded-full border border-[#E8E2D5]">
                    <button
                      type="button"
                      onClick={() => setActiveMobileView("list")}
                      className={`p-1.5 rounded-full text-xs font-medium ${
                        activeMobileView === "list" ? "bg-[#FFFFFF] text-[#0F172A] shadow-xs" : "text-[#64748B]"
                      }`}
                      title="View Results List"
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMobileView("map")}
                      className={`p-1.5 rounded-full text-xs font-medium ${
                        activeMobileView === "map" ? "bg-[#FFFFFF] text-[#0F172A] shadow-xs" : "text-[#64748B]"
                      }`}
                      title="View Map"
                    >
                      <MapIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </header>

            {/* Collapsible Search Form Drawer */}
            <AnimatePresence>
              {isSearchExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 border-b border-[#E2E8F0] bg-[#FFFFFF] z-10 px-4 py-4 overflow-hidden shadow-lg"
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
                      onCurrencyChange={setCurrency}
                      currentHomeAirport={baseAirport}
                      currentDestination={destinationAirport}
                      onOpenCulturalGuide={() => handleOpenCulturalGuide()}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content: Split Map + Results Feed (60% Neutral Surface / 30% Ink Structure / 10% Accent) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex-1 flex overflow-hidden min-h-0 relative bg-[#F8FAFC]"
            >
              {/* Interactive Map (Left) */}
              <div
                className={`flex-1 relative min-w-0 h-full ${
                  activeMobileView === "list" ? "hidden md:block" : "block"
                }`}
              >
                <MapView
                  results={reRankedResults}
                  selected={selected}
                  onSelect={setSelected}
                  homeAirport={homeAirportIata}
                  destination={searchParams?.destination ?? destinationAirport}
                  isLoading={isLoading}
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
                  selected={selected}
                  onSelect={setSelected}
                  homeResult={homeResult ?? null}
                  timeValue={timeValue}
                  currency={currency}
                  destination={searchParams?.destination ?? destinationAirport}
                  departDate={searchParams?.dateFrom}
                  isLoading={isLoading}
                  errors={errors}
                  onSetBaseAirport={handleSetBaseAirport}
                  onOpenCulturalGuide={(r) => handleOpenCulturalGuide(undefined, undefined, r)}
                />
              </div>
            </motion.div>

            {/* Debug drawer */}
            <DebugDrawer
              open={debugOpen}
              onClose={() => setDebugOpen(false)}
              selected={selected}
              timeValue={timeValue}
            />

            {/* Destination Cultural Intelligence Modal */}
            <DestinationCulturalModal
              isOpen={culturalModalOpen}
              onClose={() => setCulturalModalOpen(false)}
              destinationIata={searchParams?.destination ?? destinationAirport}
              destinationCity={culturalModalResult?.airport.city || currentDestInfo?.city}
              bookingUrl={culturalModalResult?.fare?.bookingUrl}
              farePrice={culturalModalResult?.fare?.price}
              fareCurrency={culturalModalResult?.fare?.currency || currency}
              originIata={culturalModalResult?.airport.iata ?? homeAirportIata}
            />

            {/* Debug hint */}
            {!debugOpen && results.length > 0 && (
              <div className="fixed bottom-3 left-4 text-[11px] text-[#64748B] bg-[#FFFFFF]/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#E2E8F0] shadow-sm pointer-events-none">
                Press <kbd className="font-mono text-[#0F172A] font-bold">D</kbd> for scoring formula breakdown
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
