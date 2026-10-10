"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ScoredOrigin } from "@/types";
import { formatSavings, savingsColor, computeBreakEven } from "@/lib/scoring";
import {
  ExternalLink,
  TrendingDown,
  TrendingUp,
  Minus,
  Info,
  Clock,
  Compass,
  ListFilter,
  Calendar,
  Search,
  X,
  Train,
  Plane,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
  MapPin,
  Tag,
  BookOpen,
} from "lucide-react";
import { CompleteTripRow } from "./CompleteTripRow";
import { ScenicStopovers } from "./ScenicStopovers";
import { PriceCalendarHeatmap } from "./PriceCalendarHeatmap";
import { getCountryFlag, getCountryNameFromCode } from "@/lib/cultural-utils";

interface ResultsListProps {
  results: ScoredOrigin[];
  selected: ScoredOrigin | null;
  onSelect: (r: ScoredOrigin) => void;
  homeResult: ScoredOrigin | null;
  timeValue: number;
  currency: string;
  destination?: string;
  departDate?: string;
  isLoading: boolean;
  errors: string[];
  onSetBaseAirport?: (iata: string) => void;
  onOpenCulturalGuide?: (result?: ScoredOrigin) => void;
}

type HeadlineFilterType = "all" | "savings" | "fast" | "train" | "budget" | "live";
type SortOption = "best" | "savings" | "fare" | "time" | "distance";

function SourceBadge({ source }: { source: string }) {
  const isLive = source === "Live";
  const isRecent = source === "Recent (cached)";

  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${
        isLive
          ? "bg-[#CCFBF1] text-[#0F766E] font-semibold"
          : isRecent
          ? "bg-[#FEF3C7] text-[#92400E] font-semibold"
          : "bg-[#F1F5F9] text-[#64748B]"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {isLive ? "Live Fare" : isRecent ? "Recent" : source}
    </span>
  );
}

function GroundBadge({ source, mode }: { source: string; mode?: string }) {
  const isTrain = mode?.toLowerCase().includes("train") || mode?.toLowerCase().includes("rail");
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#F1F5F9] text-[#0F172A] inline-flex items-center gap-1">
      {isTrain ? <Train className="h-2.5 w-2.5 text-[#0D9488]" /> : null}
      {source === "Real fare" ? "Verified" : "Est."}
    </span>
  );
}

function formatPrice(price: number, currency: string): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${Math.round(price)}`;
}

function ResultCard({
  result,
  rank,
  isSelected,
  onClick,
  homeResult,
  currency,
  destination,
  onSetBaseAirport,
  onOpenCulturalGuide,
}: {
  result: ScoredOrigin;
  rank: number;
  isSelected: boolean;
  onClick: () => void;
  homeResult: ScoredOrigin | null;
  currency: string;
  destination?: string;
  onSetBaseAirport?: (iata: string) => void;
  onOpenCulturalGuide?: (result: ScoredOrigin) => void;
}) {
  const savings = result.savingsVsHome;
  const isHome = homeResult?.airport.iata === result.airport.iata;

  const breakEven =
    !isHome && homeResult?.fare && result.fare
      ? computeBreakEven(
          {
            fare: homeResult.fare.price,
            groundCost: homeResult.groundLeg.price,
            groundHours: homeResult.groundLeg.duration,
          },
          {
            fare: result.fare.price,
            groundCost: result.groundLeg.price,
            groundHours: result.groundLeg.duration,
          },
          currency
        )
      : null;

  const bookUrl = result.fare?.bookingUrl
    ? `/api/go?url=${encodeURIComponent(result.fare.bookingUrl)}&origin=${result.airport.iata}&destination=${destination ?? ""}`
    : destination
    ? `/api/go?url=${encodeURIComponent(
        `https://www.aviasales.com/search/${result.airport.iata}1${destination}`
      )}&origin=${result.airport.iata}&destination=${destination}`
    : null;

  const isBestRank = rank === 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      onClick={onClick}
      className={`relative cursor-pointer rounded-2xl border transition-all duration-150 overflow-hidden ${
        isSelected
          ? "border-[#B45309] ring-2 ring-[#B45309]/20 bg-[#FFFFFF] shadow-md"
          : "border-[#E8E2D5] bg-[#FFFFFF] hover:border-[#D6CEBF] hover:shadow-sm"
      }`}
    >
      {/* Top Banner for Best Deal or Home in Field Explorer styling */}
      {isBestRank && result.fare && savings > 0 && (
        <div className="bg-[#FEF3C7] border-b border-[#FDE68A] text-[#92400E] text-xs font-semibold px-3.5 py-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#D97706]" />
            #1 Best Value Departure Option
          </span>
          <span className="font-bold text-[#92400E]">Save {formatPrice(savings, result.fare.currency)}</span>
        </div>
      )}

      {isHome && (
        <div className="bg-[#E8F0EC] border-b border-[#2D5A46]/20 text-[#2D5A46] text-xs font-semibold px-3.5 py-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-[#2D5A46]" />
            Current Base Departure Hub
          </span>
          <span>Benchmark Origin</span>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Main Header: Rank, Route, Total Price */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span
              className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 ${
                isBestRank
                  ? "bg-[#1C1917] text-[#FAF7F2]"
                  : isHome
                  ? "bg-[#2D5A46] text-white"
                  : "bg-[#F3EFE6] text-[#78716C] border border-[#E8E2D5]"
              }`}
            >
              #{rank}
            </span>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-base text-[#1C1917] tracking-tight">
                  {result.airport.city}
                </span>
                <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#E8E2D5] text-[#2D5A46]">
                  {result.airport.iata}
                </span>
                {destination && (
                  <span className="text-xs text-[#78716C] font-normal flex items-center gap-1">
                    ➔ <span className="font-mono text-[#1C1917] font-semibold">{destination}</span>
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#78716C] truncate max-w-[210px]">
                {result.airport.name}
              </div>
            </div>
          </div>

          {/* Total Cost Display */}
          <div className="text-right flex-shrink-0">
            {result.fare ? (
              <>
                <div className="text-xl font-bold tracking-tight text-[#1C1917]">
                  {formatPrice(result.totalCost, result.fare.currency)}
                </div>
                <div className="text-[10px] text-[#78716C] font-medium">
                  all-in cost
                </div>
              </>
            ) : (
              <div className="text-xs text-[#78716C] italic bg-[#F3EFE6] px-2 py-1 rounded">
                No fare found
              </div>
            )}
          </div>
        </div>

        {/* Savings / Cost comparison banner */}
        {result.fare && (
          <div className="pt-0.5">
            {!isHome && homeResult?.fare ? (
              <div
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold flex items-center justify-between gap-1.5 ${
                  savings > 0
                    ? "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                    : savings < -5
                    ? "bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]"
                    : "bg-[#FAF7F2] text-[#78716C] border border-[#E8E2D5]"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {savings > 0 ? (
                    <TrendingDown className="h-3.5 w-3.5 text-[#D97706] flex-shrink-0" />
                  ) : savings < -5 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-[#DC2626] flex-shrink-0" />
                  ) : (
                    <Minus className="h-3.5 w-3.5 flex-shrink-0 text-[#78716C]" />
                  )}
                  <span>
                    {savings > 0
                      ? `Save ${formatPrice(savings, result.fare.currency)} net`
                      : savings < -5
                      ? `${formatPrice(Math.abs(savings), result.fare.currency)} more than home`
                      : "Similar cost to home airport"}
                  </span>
                </div>
                <span className="text-[10px] opacity-75 font-normal">
                  vs {homeResult.airport.iata}
                </span>
              </div>
            ) : isHome ? (
              <div className="text-[11px] text-[#78716C] bg-[#FAF7F2] px-3 py-1.5 rounded-xl flex items-center justify-between border border-[#E8E2D5]">
                <span>Baseline origin price</span>
                <span className="font-semibold text-[#1C1917]">
                  {formatPrice(result.fare.price, result.fare.currency)} flight
                </span>
              </div>
            ) : null}
          </div>
        )}

        {/* Journey Breakdown: Ground Leg + Flight Leg + Time Cost */}
        {result.fare && (
          <div className="grid grid-cols-3 gap-1.5 text-center bg-[#FAF7F2] p-2 rounded-xl border border-[#E8E2D5]">
            {/* Leg 1: Flight */}
            <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-[#FFFFFF] border border-[#E8E2D5]">
              <div className="text-[10px] text-[#78716C] flex items-center gap-1 font-semibold mb-0.5">
                <Plane className="h-3 w-3 text-[#2D5A46]" />
                Flight
              </div>
              <div className="text-xs font-bold text-[#1C1917]">
                {formatPrice(result.fare.price, result.fare.currency)}
              </div>
              <SourceBadge source={result.fare.source} />
            </div>

            {/* Leg 2: Ground */}
            <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-[#FFFFFF] border border-[#E8E2D5]">
              <div className="text-[10px] text-[#78716C] flex items-center gap-1 font-semibold mb-0.5">
                <Train className="h-3 w-3 text-[#2D5A46]" />
                Transfer
              </div>
              <div className="text-xs font-bold text-[#1C1917]">
                {formatPrice(result.groundLeg.price, result.groundLeg.currency)}
              </div>
              <GroundBadge source={result.groundLeg.source} mode={result.groundLeg.mode} />
            </div>

            {/* Leg 3: Time value */}
            <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-[#FFFFFF] border border-[#E8E2D5]">
              <div className="text-[10px] text-[#78716C] flex items-center gap-1 font-semibold mb-0.5">
                <Clock className="h-3 w-3 text-[#B45309]" />
                Time cost
              </div>
              <div className="text-xs font-bold text-[#1C1917]">
                {formatPrice(result.breakdown.timeCost, result.fare.currency)}
              </div>
              <span className="text-[10px] text-[#78716C] font-normal">
                {(result.groundLeg.duration * 60).toFixed(0)}m ride
              </span>
            </div>
          </div>
        )}

        {/* Break-even explanation */}
        {breakEven && (
          <div className="text-[11px] text-[#78716C] bg-[#FAF7F2] border border-[#E8E2D5] rounded-xl px-3 py-1.5 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-[#2D5A46] flex-shrink-0" />
            <span className="leading-tight">{breakEven.message}</span>
          </div>
        )}

        {/* Card Actions: Book Flight & Set as Base Origin */}
        <div className="flex items-center justify-between pt-1 gap-2 border-t border-[#E8E2D5]">
          <div className="text-[11px] text-[#78716C] flex items-center gap-1 truncate">
            {result.distanceMiles === 0 ? (
              <span className="font-semibold text-[#2D5A46]">Home departure hub</span>
            ) : (
              <span>
                {Math.round(result.distanceMiles)} mi away · {result.groundLeg.mode}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Quick Set as Base Button */}
            {!isHome && onSetBaseAirport && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetBaseAirport(result.airport.iata);
                }}
                className="text-[11px] font-semibold text-[#78716C] hover:text-[#1C1917] hover:bg-[#F3EFE6] border border-[#E8E2D5] px-2.5 py-1 rounded-lg transition-colors"
                title={`Set ${result.airport.city} (${result.airport.iata}) as your new base location`}
              >
                Set as base
              </button>
            )}

            {/* Learn More: Destination Travel Guide */}
            {destination && onOpenCulturalGuide && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCulturalGuide(result);
                }}
                className="text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 border border-[#E2E8F0]"
                title="Learn about destination"
              >
                <BookOpen className="h-3 w-3 text-[#0D9488]" />
                <span className="hidden sm:inline">Guide</span>
              </button>
            )}

            {/* Book CTA (10% High-Energy Accent: Warm Amber with Deep Navy Text for WCAG Contrast) */}
            {bookUrl && (
              <a
                href={bookUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-bold text-[#0F172A] bg-[#F59E0B] hover:bg-[#D97706] px-3.5 py-1 rounded-full transition-colors flex items-center gap-1 shadow-xs hover:shadow-sm"
              >
                <span>Book</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
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
  isLoading,
  errors,
  onSetBaseAirport,
  onOpenCulturalGuide,
}: ResultsListProps) {
  const [viewTab, setViewTab] = useState<"ranking" | "scenic">("ranking");
  const [searchQuery, setSearchQuery] = useState("");
  const [headlineFilter, setHeadlineFilter] = useState<HeadlineFilterType>("all");
  const [sortBy, setSortBy] = useState<SortOption>("best");

  const withFares = useMemo(() => results.filter((r) => r.fare !== null), [results]);
  const noFares = useMemo(() => results.filter((r) => r.fare === null), [results]);
  const bestFarePrice = withFares[0]?.totalCost;

  // Filter & Search results
  const filteredResults = useMemo(() => {
    let list = [...withFares];

    if (headlineFilter === "savings") {
      list = list.filter((r) => r.savingsVsHome > 15);
    } else if (headlineFilter === "fast") {
      list = list.filter((r) => r.groundLeg.duration <= 2);
    } else if (headlineFilter === "train") {
      list = list.filter((r) => r.groundLeg.mode.toLowerCase().includes("train"));
    } else if (headlineFilter === "budget") {
      list = list.filter((r) => r.fare && r.fare.price <= 180);
    } else if (headlineFilter === "live") {
      list = list.filter((r) => r.fare?.source === "Live");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const cityMatch = r.airport.city.toLowerCase().includes(q);
        const iataMatch = r.airport.iata.toLowerCase().includes(q);
        const nameMatch = r.airport.name.toLowerCase().includes(q);
        const modeMatch = r.groundLeg.mode.toLowerCase().includes(q);
        const sourceMatch = r.fare?.source.toLowerCase().includes(q);
        const savingsMatch =
          q.includes("save") || q.includes("deal")
            ? r.savingsVsHome > 0
            : false;
        const trainMatch = q.includes("train") && r.groundLeg.mode.toLowerCase().includes("train");

        return cityMatch || iataMatch || nameMatch || modeMatch || sourceMatch || savingsMatch || trainMatch;
      });
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
      } else if (sortBy === "distance") {
        return a.distanceMiles - b.distanceMiles;
      }
      return 0;
    });

    return list;
  }, [withFares, headlineFilter, searchQuery, sortBy]);

  const savingsCount = useMemo(() => withFares.filter((r) => r.savingsVsHome > 15).length, [withFares]);
  const fastGroundCount = useMemo(() => withFares.filter((r) => r.groundLeg.duration <= 2).length, [withFares]);
  const trainCount = useMemo(() => withFares.filter((r) => r.groundLeg.mode.toLowerCase().includes("train")).length, [withFares]);

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
      {/* Top Header Switcher: Ranking vs Scenic */}
      <div className="flex items-center justify-between gap-2 border-b border-[#E8E2D5] pb-3">
        <div className="flex items-center gap-1 bg-[#F3EFE6] p-1 rounded-full border border-[#E8E2D5]">
          <button
            onClick={() => setViewTab("ranking")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              viewTab === "ranking"
                ? "bg-[#FFFFFF] text-[#1C1917] shadow-xs"
                : "text-[#78716C] hover:text-[#1C1917]"
            }`}
          >
            <ListFilter className="h-3.5 w-3.5" />
            <span>Options ({withFares.length})</span>
          </button>
          <button
            onClick={() => setViewTab("scenic")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              viewTab === "scenic"
                ? "bg-[#FFFFFF] text-[#1C1917] shadow-xs"
                : "text-[#78716C] hover:text-[#1C1917]"
            }`}
          >
            <Compass className="h-3.5 w-3.5 text-[#B45309]" />
            <span>Scenic Route</span>
          </button>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-bold text-[#2D5A46] bg-[#E8F0EC] border border-[#2D5A46]/25 px-2.5 py-1 rounded-full">
            ${timeValue}/hr valuation
          </span>
        </div>
      </div>

      {viewTab === "scenic" ? (
        <div className="space-y-3">
          <ScenicStopovers
            cheapestCost={bestFarePrice}
            homeAirport={homeResult?.airport.iata ?? "FCO"}
            destination={destination ?? "NRT"}
          />
          <CompleteTripRow
            origin={homeResult?.airport.iata ?? "FCO"}
            destination={destination}
            onOpenCulturalGuide={() => onOpenCulturalGuide?.(homeResult ?? undefined)}
          />
        </div>
      ) : (
        <>
          {/* Price Calendar Preview */}
          {withFares.length > 0 && (
            <PriceCalendarHeatmap
              baseDate={departDate}
              basePrice={withFares[0]?.fare?.price ?? 110}
              currency={currency}
            />
          )}

          {/* Search & Headline Filters Toolbar */}
          {withFares.length > 0 && (
            <div className="space-y-3 bg-[#FFFFFF] border border-[#E2E8F0] p-3.5 rounded-2xl shadow-xs">
              {/* Text Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by city, code, train, deal headline..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm bg-[#F8FAFC] focus:bg-[#FFFFFF] outline-none border border-[#CBD5E1] focus:border-[#F59E0B] text-[#0F172A] placeholder:text-[#64748B] transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Clickable Headline Badges & Filters */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#64748B] px-0.5">
                  <span className="font-semibold flex items-center gap-1 text-[#0F172A]">
                    <Tag className="h-3 w-3 text-[#0D9488]" />
                    Filter Categories:
                  </span>
                  <span>
                    {filteredResults.length} of {withFares.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setHeadlineFilter("all")}
                    className={`text-[11px] px-3 py-1 rounded-full border font-semibold transition-colors ${
                      headlineFilter === "all"
                        ? "bg-[#0F172A] text-white border-[#0F172A]"
                        : "bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]"
                    }`}
                  >
                    All ({withFares.length})
                  </button>

                  {savingsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setHeadlineFilter(headlineFilter === "savings" ? "all" : "savings")}
                      className={`text-[11px] px-3 py-1 rounded-full border font-semibold transition-colors flex items-center gap-1 ${
                        headlineFilter === "savings"
                          ? "bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]"
                          : "bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#92400E] border-[#FDE68A]"
                      }`}
                    >
                      <Sparkles className="h-3 w-3 text-[#F59E0B]" />
                      Top Savings ({savingsCount})
                    </button>
                  )}

                  {fastGroundCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setHeadlineFilter(headlineFilter === "fast" ? "all" : "fast")}
                      className={`text-[11px] px-3 py-1 rounded-full border font-semibold transition-colors flex items-center gap-1 ${
                        headlineFilter === "fast"
                          ? "bg-[#0D9488] text-white border-[#0D9488]"
                          : "bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      Fast Transfer &lt;2h ({fastGroundCount})
                    </button>
                  )}

                  {trainCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setHeadlineFilter(headlineFilter === "train" ? "all" : "train")}
                      className={`text-[11px] px-3 py-1 rounded-full border font-semibold transition-colors flex items-center gap-1 ${
                        headlineFilter === "train"
                          ? "bg-[#0D9488] text-white border-[#0D9488]"
                          : "bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]"
                      }`}
                    >
                      <Train className="h-3 w-3" />
                      Train Routes ({trainCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Sorting Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] text-xs">
                <span className="text-[11px] text-[#64748B] flex items-center gap-1 font-semibold">
                  <ArrowUpDown className="h-3 w-3 text-[#0D9488]" />
                  Sort by:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-[#F8FAFC] text-[#0F172A] text-xs font-semibold rounded-lg px-2.5 py-1 outline-none border border-[#CBD5E1] cursor-pointer hover:border-[#0D9488]"
                >
                  <option value="best">Best Overall Value</option>
                  <option value="savings">Highest Savings</option>
                  <option value="fare">Cheapest Flight Only</option>
                  <option value="time">Shortest Ground Trip</option>
                  <option value="distance">Closest to Base</option>
                </select>
              </div>
            </div>
          )}

          {/* Results Cards List */}
          <div className="space-y-3">
            {filteredResults.length === 0 && withFares.length > 0 && (
              <div className="py-8 text-center bg-[#FFFFFF] rounded-2xl border border-dashed border-[#CBD5E1] p-6 space-y-2">
                <div className="text-2xl">🔍</div>
                <div className="text-sm font-bold text-[#0F172A]">
                  No routes match &ldquo;{searchQuery || headlineFilter}&rdquo;
                </div>
                <div className="text-xs text-[#64748B]">
                  Try clearing your search query or headline filter to see all options.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setHeadlineFilter("all");
                  }}
                  className="text-xs bg-[#F59E0B] text-[#0F172A] font-bold px-3 py-1.5 rounded-lg mt-2"
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
                  homeResult={homeResult}
                  currency={currency}
                  destination={destination}
                  onSetBaseAirport={onSetBaseAirport}
                  onOpenCulturalGuide={onOpenCulturalGuide}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Partner Complete Trip Row */}
          {withFares.length > 0 && (
            <div className="pt-2">
              <CompleteTripRow
                origin={selected?.airport.iata ?? homeResult?.airport.iata ?? "FCO"}
                destination={destination}
                onOpenCulturalGuide={() => onOpenCulturalGuide?.(selected ?? undefined)}
              />
            </div>
          )}

          {/* Airports with no fares found */}
          {noFares.length > 0 && !isLoading && (
            <div className="text-[11px] text-[#64748B] pt-2 border-t border-[#E2E8F0]">
              {noFares.length} candidate airport{noFares.length !== 1 ? "s" : ""} had no route fares:{" "}
              {noFares.map((r) => r.airport.iata).join(", ")}
            </div>
          )}

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
        </>
      )}
    </div>
  );
}
