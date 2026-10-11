"use client";

import { useState } from "react";
import { Sparkles, Train, Calendar, DollarSign, ArrowRight, Compass, Check, MapPin } from "lucide-react";

export interface StopoverItem {
  id: string;
  name: string;
  homeAirport: string;
  destination: string;
  stopoverCity: string;
  stopoverAirport: string;
  groundMode: string;
  groundFare: number;
  groundDurationHours: number;
  extraDays: number;
  extraCost: number;
  description: string;
  flightFare: number;
  totalCost: number;
  captureDate: string;
}

const STOPOVERS: StopoverItem[] = [
  {
    id: "flr-scenic",
    name: "Tuscan Wine & Art Stopover",
    homeAirport: "FCO",
    destination: "NRT",
    stopoverCity: "Florence",
    stopoverAirport: "FLR",
    groundMode: "train",
    groundFare: 25,
    groundDurationHours: 1.5,
    extraDays: 2,
    extraCost: 120,
    description: "High-speed Frecciarossa train from Rome to Florence Santa Maria Novella. Spend 2 days exploring the Uffizi & Chianti hills before your international flight.",
    flightFare: 420,
    totalCost: 565,
    captureDate: "2024-11-15",
  },
  {
    id: "blq-scenic",
    name: "Bologna Culinary Capital Stopover",
    homeAirport: "FCO",
    destination: "NRT",
    stopoverCity: "Bologna",
    stopoverAirport: "BLQ",
    groundMode: "train",
    groundFare: 29,
    groundDurationHours: 2.1,
    extraDays: 1,
    extraCost: 85,
    description: "High-speed rail direct to Bologna Centrale. 24 hours of handmade tagliatelle, tortellini in brodo, and medieval porticoes before flying out.",
    flightFare: 360,
    totalCost: 474,
    captureDate: "2024-11-15",
  },
];

export function ScenicStopovers({
  cheapestCost,
  homeAirport = "FCO",
  destination = "NRT",
}: {
  cheapestCost?: number;
  homeAirport?: string;
  destination?: string;
}) {
  const [selectedId, setSelectedId] = useState<string>("flr-scenic");

  const activeStopover = STOPOVERS.find((s) => s.id === selectedId) ?? STOPOVERS[0];
  const baseline = cheapestCost || 850;
  const savingsVsBaseline = baseline - activeStopover.totalCost;

  return (
    <div className="rounded-2xl border-2 border-[#D97706]/40 bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7]/40 to-[#FAF7F2] p-4 space-y-3.5 shadow-xs">
      {/* Header with Luxury Travel Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#B45309] text-white shadow-xs">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5 flex-wrap">
              <span>Scenic Route & Cultural Stopovers</span>
              <span className="text-[10px] bg-[#2D5A46] text-white px-2 py-0.5 rounded-full font-bold">
                ✨ Turn Transfer into Vacation
              </span>
            </div>
            <p className="text-[11px] text-[#78716C] mt-0.5">
              Save hundreds by connecting via Italy&apos;s high-speed rail corridors before flying
            </p>
          </div>
        </div>
      </div>

      {/* Stopover Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {STOPOVERS.map((stopover) => {
          const isSelected = stopover.id === selectedId;
          return (
            <button
              key={stopover.id}
              onClick={() => setSelectedId(stopover.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? "border-[#B45309] bg-white ring-2 ring-[#B45309]/20 shadow-xs"
                  : "border-[#E8E2D5] bg-white/70 hover:bg-white hover:border-[#B45309]/60"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#1C1917] flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#B45309]" />
                  <span>{stopover.stopoverCity} ({stopover.stopoverAirport})</span>
                </span>
                {isSelected && (
                  <span className="h-4 w-4 rounded-full bg-[#B45309] text-white flex items-center justify-center">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#78716C]">
                +{stopover.extraDays} day{stopover.extraDays > 1 ? "s" : ""} layover · €{stopover.totalCost} total
              </div>
              <div className="text-[10px] font-bold text-[#2D5A46] mt-1">
                🚆 {stopover.groundDurationHours}h rail from {homeAirport}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Experience Breakdown */}
      <div className="rounded-xl bg-white border border-[#E8E2D5] p-3.5 space-y-3 shadow-xs">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917]">
            <Sparkles className="h-3.5 w-3.5 text-[#B45309]" />
            <span>{activeStopover.name}</span>
          </div>
          <p className="text-[11px] text-[#78716C] mt-1 leading-relaxed">
            {activeStopover.description}
          </p>
        </div>

        {/* Visual Route Steps */}
        <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-[#E8E2D5] flex items-center justify-between text-[11px] font-semibold text-[#1C1917]">
          <div className="flex items-center gap-1">
            <span>{homeAirport}</span>
          </div>
          <span className="text-[#B45309] font-bold">➔</span>
          <div className="flex items-center gap-1 text-[#2D5A46]">
            <Train className="h-3.5 w-3.5" />
            <span>{activeStopover.groundDurationHours}h Train</span>
          </div>
          <span className="text-[#B45309] font-bold">➔</span>
          <div className="flex items-center gap-1 text-[#B45309]">
            <span>{activeStopover.stopoverCity} ({activeStopover.extraDays}d)</span>
          </div>
          <span className="text-[#B45309] font-bold">➔</span>
          <div className="flex items-center gap-1">
            <span>Flight to {destination}</span>
          </div>
        </div>

        {/* Cost Breakdown Grid */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#E8E2D5] text-center">
          <div className="bg-[#FAF7F2] rounded-lg p-2 border border-[#E8E2D5]">
            <div className="text-[10px] text-[#78716C]">Train Ticket</div>
            <div className="text-xs font-bold text-[#1C1917] mt-0.5">€{activeStopover.groundFare}</div>
            <div className="text-[9px] text-[#78716C]">Frecciarossa Rail</div>
          </div>

          <div className="bg-[#FAF7F2] rounded-lg p-2 border border-[#E8E2D5]">
            <div className="text-[10px] text-[#78716C]">Flight from {activeStopover.stopoverAirport}</div>
            <div className="text-xs font-bold text-[#1C1917] mt-0.5">€{activeStopover.flightFare}</div>
            <div className="text-[9px] text-[#78716C]">to {destination}</div>
          </div>

          <div className="bg-[#E8F0EC] rounded-lg p-2 border border-[#2D5A46]/20">
            <div className="text-[10px] text-[#2D5A46] font-semibold">Total + Vacation</div>
            <div className="text-xs font-bold text-[#2D5A46] mt-0.5">
              €{activeStopover.totalCost}
            </div>
            <div className="text-[9px] font-bold text-[#2D5A46]">
              {savingsVsBaseline > 0 ? `Save €${savingsVsBaseline} vs Rome` : "All-inclusive"}
            </div>
          </div>
        </div>

        {/* Action / Explore CTA */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-[#78716C]">
          <span>Verified corridor schedule ({activeStopover.captureDate})</span>
          <a
            href={`/api/go?url=${encodeURIComponent(
              `https://www.aviasales.com/search/${activeStopover.stopoverAirport}1${destination}`
            )}&origin=${activeStopover.stopoverAirport}&destination=${destination}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#B45309] hover:text-[#92400E] inline-flex items-center gap-1 bg-[#FAF7F2] px-3 py-1 rounded-lg border border-[#E8E2D5] hover:border-[#B45309] transition-colors shadow-2xs"
          >
            <span>Explore stopover flights</span>
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
