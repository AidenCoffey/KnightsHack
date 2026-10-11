"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ScoredOrigin } from "@/types";
import {
  TrendingDown,
  TrendingUp,
  Clock,
  Train,
  Bus,
  Car,
  Sparkles,
  ArrowUpDown,
  ChevronDown,
  MapPin,
  Eye,
  Bookmark,
  Check,
  type LucideIcon,
} from "lucide-react";
import { formatCurrencyPrice } from "@/lib/currency";
import { PriceCalendarHeatmap } from "./PriceCalendarHeatmap";
import { TripDetailModal } from "./TripDetailModal";

interface ResultsListProps {
  results: ScoredOrigin[];
  selected: ScoredOrigin | null;
  onSelect: (r: ScoredOrigin) => void;
  homeResult: ScoredOrigin | null;
  timeValue: number;
  currency: string;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  tripType?: "round" | "oneway";
  passengers?: number;
  isLoading: boolean;
  errors: string[];
  onSetBaseAirport?: (iata: string) => void;
  onOpenCulturalGuide?: (result?: ScoredOrigin) => void;
  savedOriginIatas?: string[];
  onSaveTrip?: (result: ScoredOrigin) => void;
  onSelectDate?: (date: string) => void;
  datePrices?: Record<string, number>;
}

type HeadlineFilterType = "all" | "savings" | "fast" | "train" | "bus" | "drive";
type SortOption = "best" | "savings" | "fare" | "time" | "time-long" | "distance" | "distance-far";

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "best", label: "Best Overall Value" },
  { value: "savings", label: "Highest Savings" },
  { value: "fare", label: "Cheapest Flight Only" },
  { value: "time", label: "Shortest Travel Time" },
  { value: "time-long", label: "Longest Travel Time" },
  { value: "distance", label: "Closest to Base" },
  { value: "distance-far", label: "Farthest from Base" },
];

function formatDuration(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getGroundModeInfo(mode: string = "train") {
  const m = mode.toLowerCase();
  if (m.includes("train") || m.includes("rail")) {
    return {
      label: "Train",
      fullLabel: "Train / Rail",
      icon: Train,
      textColor: "text-[#0F766E]",
      bgColor: "bg-[#CCFBF1]",
      borderColor: "border-[#0F766E]/20",
    };
  }
  if (m.includes("bus") || m.includes("coach")) {
    return {
      label: "Coach / Bus",
      fullLabel: "Express Coach / Bus",
      icon: Bus,
      textColor: "text-[#B45309]",
      bgColor: "bg-[#FEF3C7]",
      borderColor: "border-[#B45309]/20",
    };
  }
  if (m.includes("taxi") || m.includes("shuttle")) {
    return {
      label: "Taxi / Shuttle",
      fullLabel: "Airport Shuttle",
      icon: Car,
      textColor: "text-[#2563EB]",
      bgColor: "bg-[#DBEAFE]",
      borderColor: "border-[#2563EB]/20",
    };
  }
  return {
    label: "Self Drive",
    fullLabel: "Highway Drive",
    icon: Car,
    textColor: "text-[#475569]",
    bgColor: "bg-[#F1F5F9]",
    borderColor: "border-[#CBD5E1]",
  };
}

function formatPrice(price: number, currency: string): string {
  return formatCurrencyPrice(price, currency);
}

function ResultCard({
  result,
  rank,
  isSelected,
  onClick,
  onOpenModal,
  homeResult,
  currency,
  destination,
  isSaved = false,
  onSaveTrip,
}: {
  result: ScoredOrigin;
  rank: number;
  isSelected: boolean;
  onClick: () => void;
  onOpenModal: () => void;
  homeResult: ScoredOrigin | null;
  currency: string;
  destination?: string;
  isSaved?: boolean;
  onSaveTrip?: (result: ScoredOrigin) => void;
}) {
  const savings = result.savingsVsHome;
  const isHome = homeResult?.airport.iata === result.airport.iata;
  const modeInfo = getGroundModeInfo(result.groundLeg.mode);
  const GroundIcon = modeInfo.icon;
  const isBestRank = rank === 1;

  const handleCardClick = () => {
    if (isSelected) {
      onOpenModal();
    } else {
      onClick();
    }
  };

  const openDetails = () => {
    if (!isSelected) onClick();
    onOpenModal();
  };

  return (
    <motion.div
      layout
      id={`result-card-${result.airport.iata}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      onClick={handleCardClick}
      className={`group relative cursor-pointer rounded-2xl border transition-all duration-150 overflow-hidden ${
        isSelected
          ? "border-[#B45309] ring-2 ring-[#B45309]/30 bg-[#FFFDF9] shadow-md"
          : "border-[#E8E2D5] bg-[#FFFFFF] hover:border-[#B45309]/70 hover:shadow-md"
      }`}
    >
      {/* Top Banner for Best Deal or Home */}
      {isBestRank && result.fare && savings > 0 && (
        <div className="bg-[#FEF3C7] border-b border-[#FDE68A] text-[#92400E] text-[11px] font-bold px-3 py-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-[#D97706]" />
            Best Value Option
          </span>
          <span className="text-[#92400E]">Save {formatPrice(savings, currency)} net</span>
        </div>
      )}

      {isHome && (
        <div className="bg-[#E8F0EC] border-b border-[#2D5A46]/20 text-[#2D5A46] text-[11px] font-bold px-3 py-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-[#2D5A46]" />
            Current Base Hub
          </span>
          <span>Benchmark Origin</span>
        </div>
      )}

      <div className="p-3.5 space-y-2.5">
        {/* Row 1: Rank, Route, and All-in Cost */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 ${
                isBestRank
                  ? "bg-[#1C1917] text-[#FAF7F2]"
                  : isHome
                  ? "bg-[#2D5A46] text-white"
                  : "bg-[#F3EFE6] text-[#78716C] border border-[#E8E2D5]"
              }`}
            >
              {rank}
            </span>

            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-sm sm:text-base text-[#1C1917] tracking-tight truncate">
                {result.airport.city}
              </span>
              <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#E8E2D5] text-[#2D5A46] shrink-0">
                {result.airport.iata}
              </span>
              {destination && (
                <span className="text-xs text-[#78716C] font-normal flex items-center gap-1 shrink-0">
                  ➔ <span className="font-mono text-[#1C1917] font-semibold">{destination}</span>
                </span>
              )}
            </div>
          </div>

          {/* Large prominent all-in cost */}
          <div className="text-right flex-shrink-0">
            {result.fare ? (
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-[#1C1917]">
                  {formatPrice(result.totalCost, currency)}
                </span>
                <span className="text-[10px] text-[#78716C] font-medium">all-in</span>
              </div>
            ) : (
              <span className="text-xs text-[#78716C] italic bg-[#F3EFE6] px-2 py-0.5 rounded">
                No fare found
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Route breakdown preview & Net savings/comparison chip */}
        <div className="flex items-center justify-between gap-2 text-xs">
          {/* Left: Overland & Fare chips */}
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {isHome ? (
              <span className="text-[11px] font-medium text-[#2D5A46] bg-[#E8F0EC] px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Direct Departure Hub
              </span>
            ) : (
              <span className="text-[11px] font-medium text-[#475569] bg-[#F1F5F9] px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                <GroundIcon className="h-3 w-3 text-[#0F766E]" />
                <span>{modeInfo.label} ~{formatDuration(result.groundLeg.duration)}</span>
                {result.distanceMiles > 0 && (
                  <span className="text-[10px] text-[#94A3B8]">({Math.round(result.distanceMiles)} mi)</span>
                )}
              </span>
            )}

            {result.fare && (
              <span className="text-[11px] text-[#64748B] hidden sm:inline">
                {formatPrice(result.fare.price, currency)} flight + {formatPrice(result.groundLeg.price, currency)} ground
              </span>
            )}
          </div>

          {/* Right: Net comparison tag */}
          <div className="flex-shrink-0">
            {!isHome && homeResult?.fare && result.fare ? (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1 ${
                  savings > 0
                    ? "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                    : savings < -5
                    ? "bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]"
                    : "bg-[#FAF7F2] text-[#78716C] border border-[#E8E2D5]"
                }`}
              >
                {savings > 0 ? (
                  <>
                    <TrendingDown className="h-3 w-3 text-[#D97706]" />
                    <span>Save {formatPrice(savings, currency)} net</span>
                  </>
                ) : savings < -5 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-[#DC2626]" />
                    <span>+{formatPrice(Math.abs(savings), currency)} vs home</span>
                  </>
                ) : (
                  <span>Similar cost</span>
                )}
              </span>
            ) : isHome && result.fare ? (
              <span className="text-[11px] text-[#78716C]">
                {formatPrice(result.fare.price, currency)} baseline flight
              </span>
            ) : null}
          </div>
        </div>

        {/* Row 3: Action bar */}
        <div className="flex items-center justify-end pt-2 border-t border-[#F3EFE6] text-xs">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onSaveTrip && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveTrip(result);
                }}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isSaved
                    ? "bg-[#E8F0EC] text-[#2D5A46] border-[#D1E4D8] hover:bg-[#FEE2E2] hover:text-[#DC2626] hover:border-[#FECACA]"
                    : "text-[#78716C] hover:text-[#1C1917] hover:bg-[#F3EFE6] border-[#E8E2D5]"
                }`}
                title={isSaved ? "Remove from My Trips" : "Save to My Trips"}
              >
                {isSaved ? <Check className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openDetails();
              }}
              className="text-xs font-bold text-[#1C1917] bg-[#F59E0B] hover:bg-[#D97706] px-3 py-1 rounded-md transition-colors flex items-center gap-1 shadow-2xs hover:shadow-xs"
            >
              <Eye className="h-3 w-3" />
              <span>View</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ResultsList({
  results,
  selected,
  onSelect,
  homeResult,
  timeValue,
  currency,
  destination,
  departDate,
  returnDate,
  tripType = "round",
  passengers = 1,
  isLoading,
  errors,
  onSetBaseAirport,
  onOpenCulturalGuide,
  savedOriginIatas = [],
  onSaveTrip,
  onSelectDate,
  datePrices,
}: ResultsListProps) {
  const [headlineFilter, setHeadlineFilter] = useState<HeadlineFilterType>("all");
  const [sortBy, setSortBy] = useState<SortOption>("best");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [modalTarget, setModalTarget] = useState<{ result: ScoredOrigin; rank: number } | null>(null);

  // Close sort dropdown on click outside or Escape
  useEffect(() => {
    if (!sortDropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [sortDropdownOpen]);

  const withFares = useMemo(() => results.filter((r) => r.fare !== null), [results]);
  const isSoloFlight = tripType === "oneway" || (!returnDate && tripType !== "round");

  // Snap/scroll right side list to the selected card when clicked on the map
  useEffect(() => {
    if (!selected) return;

    const timer = setTimeout(() => {
      const cardEl = document.getElementById(`result-card-${selected.airport.iata}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 70);

    return () => clearTimeout(timer);
  }, [selected]);

  // Support opening enlarged route popup directly if event is triggered
  useEffect(() => {
    const handleOpenTripModal = (e: Event) => {
      const customEvt = e as CustomEvent<string>;
      const iata = customEvt.detail;
      const targetResult = withFares.find((r) => r.airport.iata === iata);
      if (targetResult) {
        const idx = withFares.findIndex((r) => r.airport.iata === iata);
        setModalTarget({ result: targetResult, rank: idx >= 0 ? idx + 1 : 1 });
      }
    };
    window.addEventListener("open-trip-modal", handleOpenTripModal);
    return () => window.removeEventListener("open-trip-modal", handleOpenTripModal);
  }, [withFares]);

  const modeOf = (r: ScoredOrigin) => r.groundLeg.mode.toLowerCase();

  // Filter & sort results
  const filteredResults = useMemo(() => {
    let list = [...withFares];

    if (headlineFilter === "savings") {
      list = list.filter((r) => r.savingsVsHome > 15);
    } else if (headlineFilter === "fast") {
      list = list.filter((r) => r.groundLeg.duration <= 2);
    } else if (headlineFilter === "train") {
      list = list.filter((r) => modeOf(r).includes("train") || modeOf(r).includes("rail"));
    } else if (headlineFilter === "bus") {
      list = list.filter((r) => modeOf(r).includes("bus") || modeOf(r).includes("coach"));
    } else if (headlineFilter === "drive") {
      list = list.filter(
        (r) =>
          modeOf(r).includes("drive") ||
          modeOf(r).includes("car") ||
          modeOf(r).includes("taxi") ||
          modeOf(r).includes("shuttle")
      );
    }

    list.sort((a, b) => {
      if (sortBy === "best") {
        return a.totalCost - b.totalCost;
      } else if (sortBy === "savings") {
        return b.savingsVsHome - a.savingsVsHome;
      } else if (sortBy === "fare") {
        const pA = a.fare?.price ?? 9999;
        const pB = b.fare?.price ?? 9999;
        return pA - pB;
      } else if (sortBy === "time") {
        return a.groundLeg.duration - b.groundLeg.duration;
      } else if (sortBy === "time-long") {
        return b.groundLeg.duration - a.groundLeg.duration;
      } else if (sortBy === "distance") {
        return a.distanceMiles - b.distanceMiles;
      } else if (sortBy === "distance-far") {
        return b.distanceMiles - a.distanceMiles;
      }
      return 0;
    });

    return list;
  }, [withFares, headlineFilter, sortBy]);

  const savingsCount = useMemo(() => withFares.filter((r) => r.savingsVsHome > 15).length, [withFares]);
  const fastGroundCount = useMemo(() => withFares.filter((r) => r.groundLeg.duration <= 2).length, [withFares]);
  const trainCount = useMemo(
    () => withFares.filter((r) => modeOf(r).includes("train") || modeOf(r).includes("rail")).length,
    [withFares]
  );
  const busCount = useMemo(
    () => withFares.filter((r) => modeOf(r).includes("bus") || modeOf(r).includes("coach")).length,
    [withFares]
  );
  const driveCount = useMemo(
    () =>
      withFares.filter(
        (r) =>
          modeOf(r).includes("drive") ||
          modeOf(r).includes("car") ||
          modeOf(r).includes("taxi") ||
          modeOf(r).includes("shuttle")
      ).length,
    [withFares]
  );

  if (!isLoading && results.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-center gap-4 bg-[#FAF7F2]">
        <div className="h-16 w-16 rounded-3xl bg-[#F3EFE6] text-[#B45309] border border-[#E8E2D5] flex items-center justify-center text-3xl shadow-xs">
          🧭
        </div>
        <div className="space-y-1">
          <div className="font-serif font-bold text-lg text-[#1C1917]">
            Explore Alternate Departure Hubs
          </div>
          <div className="text-xs text-[#78716C] max-w-[260px] leading-relaxed">
            Select your destination and home base to compare real flight and transfer prices across nearby gateways.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 bg-[#FAF7F2]">
      {/* Price Calendar Preview — strictly for solo / one-way flights (hidden on round trip) */}
      {withFares.length > 0 && isSoloFlight && (
        <PriceCalendarHeatmap
          baseDate={departDate}
          basePrice={withFares[0]?.fare?.price ?? 110}
          currency={currency}
          onSelectDate={onSelectDate}
          priceMap={datePrices}
          isLoading={isLoading}
        />
      )}

      {/* Built-in Filters & Sort */}
      {withFares.length > 0 && (
        <div className="space-y-2.5 bg-[#FFFFFF] border border-[#E2E8F0] p-3 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-[11px] px-0.5">
            <span className="font-semibold text-[#1C1917]">Filter by transfer</span>
            <span className="text-[#64748B]">
              {filteredResults.length} of {withFares.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: "all" as HeadlineFilterType, label: `All (${withFares.length})`, count: withFares.length, icon: null },
                { id: "train" as HeadlineFilterType, label: `Train (${trainCount})`, count: trainCount, icon: Train },
                { id: "bus" as HeadlineFilterType, label: `Bus (${busCount})`, count: busCount, icon: Bus },
                { id: "drive" as HeadlineFilterType, label: `Drive (${driveCount})`, count: driveCount, icon: Car },
                { id: "fast" as HeadlineFilterType, label: `Fast <2h (${fastGroundCount})`, count: fastGroundCount, icon: Clock },
                { id: "savings" as HeadlineFilterType, label: `Top Savings (${savingsCount})`, count: savingsCount, icon: Sparkles },
              ] satisfies Array<{ id: HeadlineFilterType; label: string; count: number; icon: LucideIcon | null }>
            )
              .filter((f) => f.id === "all" || f.count > 0)
              .map((f) => {
                const Icon = f.icon;
                const active = headlineFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setHeadlineFilter(active && f.id !== "all" ? "all" : f.id)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-colors inline-flex items-center gap-1 ${
                      active
                        ? f.id === "savings"
                          ? "bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]"
                          : "bg-[#1C1917] text-[#FAF7F2] border-[#1C1917]"
                        : "bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]"
                    }`}
                  >
                    {Icon ? <Icon className="h-3 w-3" /> : null}
                    {f.label}
                  </button>
                );
              })}
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0]">
            <span className="text-[11px] text-[#64748B] flex items-center gap-1 font-semibold shrink-0">
              <ArrowUpDown className="h-3 w-3 text-[#0D9488]" />
              Sort by
            </span>
            <div ref={sortDropdownRef} className="relative min-w-0 flex-1 max-w-[220px]">
              <button
                type="button"
                onClick={() => setSortDropdownOpen((open) => !open)}
                className="w-full flex items-center justify-between gap-1.5 bg-[#F8FAFC] text-[#1C1917] text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-[#CBD5E1] cursor-pointer hover:border-[#0D9488] transition-colors"
                aria-haspopup="listbox"
                aria-expanded={sortDropdownOpen}
              >
                <span className="truncate">
                  {SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Best Overall Value"}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-[#64748B] transition-transform ${
                    sortDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {sortDropdownOpen && (
                <div
                  role="listbox"
                  className="absolute top-full right-0 mt-1.5 w-full min-w-[200px] bg-[#FFFFFF] border border-[#E8E2D5] rounded-xl shadow-lg py-1 z-50"
                >
                    {SORT_OPTIONS.map((option) => {
                      const active = sortBy === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => {
                            setSortBy(option.value);
                            setSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF7F2] transition-colors cursor-pointer ${
                            active ? "text-[#1C1917] font-bold bg-[#FAF7F2]" : "text-[#78716C]"
                          }`}
                        >
                          <span>{option.label}</span>
                          {active && <Check className="h-3.5 w-3.5 text-[#B45309] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Cards List */}
      <div className="space-y-3">
        {filteredResults.length === 0 && withFares.length > 0 && (
          <div className="py-8 text-center bg-[#FFFFFF] rounded-2xl border border-dashed border-[#CBD5E1] p-6 space-y-2">
            <div className="text-sm font-bold text-[#1C1917]">No routes match this filter</div>
            <div className="text-xs text-[#64748B]">Clear the filter to see all options.</div>
            <button
              type="button"
              onClick={() => setHeadlineFilter("all")}
              className="text-xs bg-[#F59E0B] text-[#1C1917] font-bold px-3 py-1.5 rounded-lg mt-2"
            >
              Reset filters
            </button>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {filteredResults.map((result, idx) => (
            <ResultCard
              key={result.airport.iata}
              result={result}
              rank={idx + 1}
              isSelected={selected?.airport.iata === result.airport.iata}
              onClick={() => onSelect(result)}
              onOpenModal={() => setModalTarget({ result, rank: idx + 1 })}
              homeResult={homeResult}
              currency={currency}
              destination={destination}
              isSaved={savedOriginIatas.includes(result.airport.iata)}
              onSaveTrip={onSaveTrip}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="text-xs text-red-600 bg-red-50 rounded-xl p-3 border border-red-200">
          {errors.length} query error{errors.length !== 1 ? "s" : ""} occurred during scan
        </div>
      )}

      {/* Honest Disclaimer */}
      {withFares.length > 0 && (
        <p className="text-[10px] text-[#64748B] text-center pt-2 border-t border-[#E2E8F0]">
          Prices reflect live partner and corridor queries. Always verify final totals directly on carrier websites.
        </p>
      )}

      {/* Enlarged Route Intelligence Popup Modal */}
      <TripDetailModal
        isOpen={Boolean(modalTarget)}
        onClose={() => setModalTarget(null)}
        result={modalTarget?.result ?? null}
        homeResult={homeResult}
        rank={modalTarget?.rank ?? 1}
        currency={currency}
        timeValue={timeValue}
        destination={destination}
        departDate={departDate}
        returnDate={returnDate}
        tripType={tripType}
        passengers={passengers}
        isSaved={modalTarget ? savedOriginIatas.includes(modalTarget.result.airport.iata) : false}
        onSaveTrip={onSaveTrip}
        onSetBaseAirport={onSetBaseAirport}
        onOpenCulturalGuide={onOpenCulturalGuide}
      />
    </div>
  );
}
