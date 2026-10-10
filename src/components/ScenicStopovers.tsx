"use client";

import { useState } from "react";
import { Sparkles, Train, Calendar, DollarSign, ArrowRight, Compass, Check } from "lucide-react";

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
    description: "High-speed Frecciarossa train from Rome to Florence. Spend 2 days exploring the Uffizi & Chianti hills before your long-haul flight.",
    flightFare: 420,
    totalCost: 565,
    captureDate: "2024-11-15",
  },
  {
    id: "blq-scenic",
    name: "Bologna Culinary Capital Stopover",
    homeAirport: "FCO",
    destination: "BKK",
    stopoverCity: "Bologna",
    stopoverAirport: "BLQ",
    groundMode: "train",
    groundFare: 29,
    groundDurationHours: 2.1,
    extraDays: 1,
    extraCost: 85,
    description: "High-speed rail direct to Bologna Centrale. 24 hours of handmade tagliatelle, ragù, and porticoes before taking off.",
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
  const baseline = cheapestCost || 380;
  const difference = activeStopover.totalCost - baseline;

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>Cheapest vs. Scenic Stopover</span>
              <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded font-semibold">
                Explore More
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Turn your commute into a mini-vacation with curated ground corridors
            </p>
          </div>
        </div>
      </div>

      {/* Stopover Selector */}
      <div className="grid grid-cols-2 gap-2">
        {STOPOVERS.map((stopover) => {
          const isSelected = stopover.id === selectedId;
          return (
            <button
              key={stopover.id}
              onClick={() => setSelectedId(stopover.id)}
              className={`p-2 rounded-lg border text-left transition-all ${
                isSelected
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 shadow-sm"
                  : "border-border bg-card/60 hover:bg-card"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-foreground">
                  {stopover.stopoverCity} ({stopover.stopoverAirport})
                </span>
                {isSelected && <Check className="h-3.5 w-3.5 text-amber-600" />}
              </div>
              <div className="text-[10px] text-muted-foreground">
                +{stopover.extraDays} day{stopover.extraDays > 1 ? "s" : ""} • +€{stopover.extraCost}
              </div>
            </button>
          );
        })}
      </div>

      {/* Comparison Details */}
      <div className="rounded-lg bg-card/80 border border-border p-3 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-xs font-bold text-foreground">{activeStopover.name}</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              {activeStopover.description}
            </p>
          </div>
        </div>

        {/* Breakdown bar */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-center">
          <div className="bg-muted/40 rounded p-1.5">
            <div className="text-[10px] text-muted-foreground">Train Corridor</div>
            <div className="text-xs font-semibold">€{activeStopover.groundFare}</div>
            <div className="text-[9px] text-muted-foreground">
              {activeStopover.groundDurationHours}h high-speed
            </div>
          </div>
          <div className="bg-muted/40 rounded p-1.5">
            <div className="text-[10px] text-muted-foreground">Flight from {activeStopover.stopoverAirport}</div>
            <div className="text-xs font-semibold">€{activeStopover.flightFare}</div>
            <div className="text-[9px] text-muted-foreground">to {destination}</div>
          </div>
          <div className="bg-amber-500/10 rounded p-1.5">
            <div className="text-[10px] text-amber-700 dark:text-amber-400">Total + Stay</div>
            <div className="text-xs font-bold text-amber-700 dark:text-amber-300">
              €{activeStopover.totalCost}
            </div>
            <div className="text-[9px] text-muted-foreground">
              {difference > 0 ? `+€${difference} vs cheapest` : "Matches cheapest"}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground">
          <span>Real corridor fare captured {activeStopover.captureDate}</span>
          <a
            href={`/api/go?url=${encodeURIComponent(
              `https://www.aviasales.com/search/${activeStopover.stopoverAirport}1${destination}`
            )}&origin=${activeStopover.stopoverAirport}&destination=${destination}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
          >
            Explore route <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
