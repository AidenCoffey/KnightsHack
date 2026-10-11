"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ScoredOrigin } from "@/types";
import {
  X,
  Plane,
  Train,
  Bus,
  Car,
  Clock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Bookmark,
  Check,
  TrendingDown,
  TrendingUp,
  Minus,
  Luggage,
  ArrowRight,
} from "lucide-react";
import { buildAviasalesSearchUrl } from "@/lib/aviasales-url";
import { formatCurrencyPrice } from "@/lib/currency";
import { useSuitcaseTransition } from "@/components/SuitcaseTransitionProvider";

interface TripDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ScoredOrigin | null;
  homeResult: ScoredOrigin | null;
  rank: number;
  currency: string;
  timeValue: number;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  tripType?: "round" | "oneway";
  passengers?: number;
  isSaved?: boolean;
  onSaveTrip?: (result: ScoredOrigin) => void;
  onSetBaseAirport?: (iata: string) => void;
  onOpenCulturalGuide?: (result: ScoredOrigin) => void;
}

function formatPrice(price: number, currency: string): string {
  return formatCurrencyPrice(price, currency);
}

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
      fullLabel: "Train / High-Speed Rail",
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

export function TripDetailModal({
  isOpen,
  onClose,
  result,
  homeResult,
  currency,
  timeValue = 15,
  destination,
  departDate,
  returnDate,
  tripType = "round",
  passengers = 1,
  isSaved = false,
  onSaveTrip,
}: TripDetailModalProps) {
  const { triggerTransition } = useSuitcaseTransition();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !result) return null;

  const savings = result.savingsVsHome;
  const isHome = homeResult?.airport.iata === result.airport.iata;
  const homeCity = homeResult?.airport.city || "Base Origin";
  const homeIata = homeResult?.airport.iata || "HOME";
  const modeInfo = getGroundModeInfo(result.groundLeg.mode);
  const GroundIcon = modeInfo.icon;

  const effectiveTripType = tripType ?? (returnDate ? "round" : "oneway");
  const departureDate = departDate || result.fare?.departAt || new Date().toISOString().split("T")[0];
  const returnDateVal = effectiveTripType === "round" ? (returnDate || result.fare?.returnAt) : undefined;

  const canonicalBookingUrl = destination
    ? buildAviasalesSearchUrl({
        origin: result.airport.iata,
        destination,
        dateFrom: departureDate,
        dateTo: returnDateVal,
        tripType: effectiveTripType,
        passengers,
      })
    : (result.fare?.bookingUrl || "");

  const bookUrl = canonicalBookingUrl
    ? `/api/go?url=${encodeURIComponent(canonicalBookingUrl)}&origin=${result.airport.iata}&destination=${destination ?? ""}`
    : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-[#FFFFFF] rounded-3xl shadow-2xl border border-[#E8E2D5] overflow-hidden z-10 my-auto text-[#1C1917] flex flex-col max-h-[92vh]"
        >
          {/* Header Bar */}
          <div className="relative flex items-start justify-start px-6 pt-5 pb-3 border-b border-[#E8E2D5] bg-[#FAF7F2]">
            <div className="text-left">
              <div className="flex items-center gap-2 font-mono text-[#1C1917] font-semibold text-lg">
                <span>{result.airport.iata}</span>
                {destination && (
                  <>
                    <ArrowRight className="h-4 w-4 text-[#B45309]" />
                    <span>{destination}</span>
                  </>
                )}
              </div>
              <div className="text-xs text-[#78716C] font-medium mt-1">
                {result.airport.name}
                {result.distanceMiles > 0
                  ? ` · ${Math.round(result.distanceMiles)} miles from ${homeCity}`
                  : ""}
              </div>
            </div>

            <button
              onClick={onClose}
              className="absolute top-3 right-4 p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#F3EFE6] transition-colors"
              title="Close popup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body (Scrollable) */}
          <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
            {/* Total Cost Banner */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5]">
              <div className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">
                Total All-In Journey Cost
              </div>
              <div className="text-3xl font-extrabold text-[#1C1917] tracking-tight mt-0.5">
                {formatPrice(result.totalCost, currency)}
              </div>
              <div className="text-[11px] text-[#78716C] mt-0.5">
                Flight fare + Ground transit + Opportunity time value
              </div>

              {/* Savings vs Home */}
              {!isHome && homeResult?.fare && (
                <div className={`mt-3 px-4 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-2 border ${
                  savings > 0
                    ? "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]"
                    : savings < -5
                    ? "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]"
                    : "bg-[#FFFFFF] text-[#78716C] border-[#E8E2D5]"
                }`}>
                  {savings > 0 ? (
                    <TrendingDown className="h-4 w-4 text-[#D97706]" />
                  ) : savings < -5 ? (
                    <TrendingUp className="h-4 w-4 text-[#DC2626]" />
                  ) : (
                    <Minus className="h-4 w-4 text-[#78716C]" />
                  )}
                  <div className="flex flex-col">
                    <span>
                      {savings > 0
                        ? `Save ${formatPrice(savings, currency)} Net Total`
                        : savings < -5
                        ? `${formatPrice(Math.abs(savings), currency)} more than home`
                        : "Similar total to home hub"}
                    </span>
                    <span className="text-[10px] font-normal opacity-75">
                      Benchmark against direct flight from {homeCity} ({homeIata})
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* The 3 Cost Pillars Breakdown */}
            <div className="space-y-2">
              <div className="text-xs uppercase font-bold text-[#78716C] tracking-wider">
                Trip Cost Composition
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Flight Ticket */}
                <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D5] shadow-xs space-y-1">
                  <div className="text-xs text-[#78716C] flex items-center gap-1.5 font-semibold">
                    <Plane className="h-3.5 w-3.5 text-[#2D5A46]" />
                    <span>Flight Fare</span>
                  </div>
                  <div className="text-xl font-bold text-[#1C1917]">
                    {result.fare ? formatPrice(result.fare.price, currency) : "N/A"}
                  </div>
                  <div className="text-[10px] text-[#0F766E] font-medium inline-flex items-center gap-1 bg-[#CCFBF1] px-2 py-0.5 rounded-full">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    <span>{result.fare?.source || "Carrier Partner"}</span>
                  </div>
                </div>

                {/* 2. Overland Transit */}
                <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D5] shadow-xs space-y-1">
                  <div className="text-xs text-[#78716C] flex items-center gap-1.5 font-semibold">
                    <GroundIcon className="h-3.5 w-3.5 text-[#0F766E]" />
                    <span>Overland Transit</span>
                  </div>
                  <div className="text-xl font-bold text-[#1C1917]">
                    {formatPrice(result.groundLeg.price, currency)}
                  </div>
                  <div className="text-[11px] text-[#78716C]">
                    ~{formatDuration(result.groundLeg.duration)} via {modeInfo.label}
                  </div>
                </div>

                {/* 3. Time Valuation */}
                <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D5] shadow-xs space-y-1">
                  <div className="text-xs text-[#78716C] flex items-center gap-1.5 font-semibold">
                    <Clock className="h-3.5 w-3.5 text-[#B45309]" />
                    <span>Time Opportunity</span>
                  </div>
                  <div className="text-xl font-bold text-[#1C1917]">
                    {formatPrice(result.breakdown.timeCost, currency)}
                  </div>
                  <div className="text-[11px] text-[#78716C]">
                    Calculated @ ${timeValue}/hr
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Overland Corridor & Journey Stepper */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#1C1917] flex items-center gap-1.5">
                  <GroundIcon className="h-4 w-4 text-[#0F766E]" />
                  <span>
                    {isHome
                      ? `Local Transit to ${result.airport.name}`
                      : `Connecting Overland Corridor: ${homeCity} ➔ ${result.airport.city}`}
                  </span>
                </span>
                <span className="font-mono text-xs font-bold text-[#2D5A46] bg-[#FFFFFF] border border-[#E8E2D5] px-2.5 py-0.5 rounded-lg shadow-2xs">
                  Transit Ticket: {formatPrice(result.groundLeg.price, currency)}
                </span>
              </div>

              {/* Stepper Graphic */}
              <div className="flex items-center gap-2 text-xs bg-[#FFFFFF] p-3 rounded-xl border border-[#E8E2D5]">
                <div className="flex items-center gap-1.5 font-semibold text-[#1C1917] shrink-0">
                  <MapPin className="h-4 w-4 text-[#2D5A46]" />
                  <span>{homeCity}</span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-2">
                  <div className="w-full flex items-center gap-1">
                    <div className="h-[2px] flex-1 bg-[#D6CEBF]" />
                    <span className="text-[10px] font-bold text-[#0F766E] px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E8E2D5] shadow-2xs whitespace-nowrap flex items-center gap-1.5">
                      <GroundIcon className="h-3 w-3" />
                      <span>{modeInfo.label} · ~{formatDuration(result.groundLeg.duration)}</span>
                    </span>
                    <div className="h-[2px] flex-1 bg-[#D6CEBF]" />
                  </div>
                  {result.distanceMiles > 0 && (
                    <span className="text-[10px] text-[#78716C] mt-1">
                      {Math.round(result.distanceMiles)} miles overland
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 font-semibold text-[#1C1917] shrink-0">
                  <Plane className="h-4 w-4 text-[#B45309]" />
                  <span>{result.airport.iata}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#78716C] pt-1">
                <span>Mode: <strong className="text-[#1C1917] font-semibold">{modeInfo.fullLabel}</strong></span>
                <span className="text-[10px] text-[#0F766E] font-semibold bg-[#CCFBF1] px-2 py-0.5 rounded-full border border-[#0F766E]/20">
                  {result.groundLeg.source === "Real fare" ? "Verified Timetable Fare" : "Model Cost Estimate"}
                </span>
              </div>
            </div>

          </div>

          {/* Modal Footer / Action CTA Bar */}
          <div className="px-6 py-4 bg-[#FAF7F2] border-t border-[#E8E2D5] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Add to My Trips */}
              {onSaveTrip && (
                <button
                  type="button"
                  onClick={() => onSaveTrip(result)}
                  className={`text-xs font-semibold px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 border ${
                    isSaved
                      ? "bg-[#E8F0EC] text-[#2D5A46] border-[#D1E4D8] font-bold hover:bg-[#FEE2E2] hover:text-[#DC2626] hover:border-[#FECACA]"
                      : "text-[#78716C] hover:text-[#1C1917] hover:bg-[#F3EFE6] border-[#E8E2D5]"
                  }`}
                  title={isSaved ? "Remove from My Trips" : "Add to My Trips"}
                >
                  {isSaved ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#2D5A46]" />
                      <span>Saved in My Trips</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-3.5 w-3.5 text-[#B45309]" />
                      <span>Add to my trips</span>
                    </>
                  )}
                </button>
              )}

              {/* Travel Readiness Link */}
              {destination && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    triggerTransition({
                      targetIata: destination,
                      targetUrl: `/travel-readiness?dest=${encodeURIComponent(destination)}&origin=${encodeURIComponent(result.airport.iata)}`,
                      origin: result.airport.iata,
                    });
                  }}
                  className="text-xs font-semibold text-[#64748B] hover:text-[#1C1917] hover:bg-[#FFFFFF] px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 border border-[#E2E8F0] cursor-pointer"
                  title="Open Travel Readiness Guide"
                >
                  <Luggage className="h-3.5 w-3.5 text-[#B45309]" />
                  <span>Readiness Guide</span>
                </button>
              )}
            </div>

            {bookUrl && (
              <a
                href={bookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#1C1917] bg-[#F59E0B] hover:bg-[#D97706] px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md ml-auto"
              >
                <span>Book</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
