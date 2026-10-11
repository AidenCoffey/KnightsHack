"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowLeftRight,
  SlidersHorizontal,
  Clock,
  Compass,
  ChevronDown,
  Users,
  Minus,
  Plus,
} from "lucide-react";
import type { SearchParams } from "@/types";
import { AirportCombobox } from "./AirportCombobox";
import { DateRangePicker } from "./DateRangePicker";

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
  timeValue: number;
  onTimeValueChange: (val: number) => void;
  currency?: string;
  onCurrencyChange?: (val: string) => void;
  currentHomeAirport?: string;
  currentDestination?: string;
  currentTripType?: "round" | "oneway";
  currentDateFrom?: string;
  currentDateTo?: string;
  currentPassengers?: number;
  currentRadiusMiles?: number;
  onOpenCulturalGuide?: () => void;
}

const defaultDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
};

const defaultReturnDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 37);
  return d.toISOString().split("T")[0];
};

export function SearchForm({
  onSearch,
  isLoading,
  timeValue,
  onTimeValueChange,
  currency = "USD",
  currentHomeAirport,
  currentDestination,
  currentTripType = "round",
  currentDateFrom,
  currentDateTo,
  currentPassengers = 1,
  currentRadiusMiles = 300,
}: SearchFormProps) {
  const [destination, setDestination] = useState(currentDestination || "");
  const [homeAirport, setHomeAirport] = useState(currentHomeAirport || "");
  const [tripType, setTripType] = useState<"round" | "oneway">(currentTripType);
  const [dateFrom, setDateFrom] = useState(currentDateFrom || defaultDate());
  const [dateTo, setDateTo] = useState(currentDateTo || defaultReturnDate());
  const [radiusMiles, setRadiusMiles] = useState(currentRadiusMiles);
  const [passengers, setPassengers] = useState(currentPassengers);
  const [showOptions, setShowOptions] = useState(false);

  // Sync draft fields only when committed search params change.
  // Do not depend on local draft state — that was snapping edits back before Update Search.
  useEffect(() => {
    if (currentTripType) setTripType(currentTripType);
  }, [currentTripType]);

  useEffect(() => {
    if (currentDateFrom) setDateFrom(currentDateFrom);
  }, [currentDateFrom]);

  useEffect(() => {
    if (currentDateTo) setDateTo(currentDateTo);
  }, [currentDateTo]);

  useEffect(() => {
    if (currentHomeAirport) setHomeAirport(currentHomeAirport);
  }, [currentHomeAirport]);

  useEffect(() => {
    if (currentDestination) setDestination(currentDestination);
  }, [currentDestination]);

  useEffect(() => {
    setPassengers(currentPassengers);
  }, [currentPassengers]);

  useEffect(() => {
    setRadiusMiles(currentRadiusMiles);
  }, [currentRadiusMiles]);

  const handleSwap = () => {
    const temp = homeAirport;
    setHomeAirport(destination);
    setDestination(temp);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !homeAirport) return;
    onSearch({
      destination: destination.toUpperCase(),
      homeAirport: homeAirport.toUpperCase(),
      dateFrom,
      dateTo: tripType === "round" ? dateTo : undefined,
      tripType,
      passengers,
      radiusMiles,
      timeValuePerHour: timeValue,
      currency,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      {/* Primary Search Bar: Compact, High-Density Venture Aesthetic */}
      <div className="bg-[#FFFFFF] border border-[#E8E2D5] shadow-xs rounded-2xl p-2.5 transition-all">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2">
          {/* Origin & Destination pair */}
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 relative min-w-0">
            <AirportCombobox
              label="Where from?"
              value={homeAirport}
              onChange={(code) => setHomeAirport(code)}
              type="origin"
              placeholder="Origin airport or city..."
              compact={true}
              excludeIata={destination}
            />

            {/* Swap Button — sits in the gap, no overlap */}
            <button
              type="button"
              onClick={handleSwap}
              title="Swap origin and destination"
              className="self-center h-7 w-7 rounded-lg border border-[#E8E2D5] bg-[#FAF7F2] hover:bg-[#FFFFFF] text-[#78716C] hover:text-[#B45309] flex items-center justify-center transition-all hover:rotate-180 duration-200 shadow-2xs flex-shrink-0 z-10"
            >
              <ArrowLeftRight className="h-3 w-3" />
            </button>

            <AirportCombobox
              label="Where to?"
              value={destination}
              onChange={(code) => setDestination(code)}
              type="destination"
              placeholder="Destination airport..."
              compact={true}
              excludeIata={homeAirport}
            />
          </div>

          {/* Dates, Trip Type & Action Controls — grows so one-way expands Depart, not airports */}
          <div className="flex flex-1 flex-wrap sm:flex-nowrap items-center gap-2 min-w-0">
            {/* Trip Type Toggle Pill */}
            <div className="flex items-center bg-[#FAF7F2] border border-[#E8E2D5] rounded-xl p-0.5 text-xs flex-shrink-0">
              <button
                type="button"
                onClick={() => setTripType("round")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tripType === "round"
                    ? "bg-[#FFFFFF] text-[#1C1917] shadow-xs"
                    : "text-[#78716C] hover:text-[#1C1917]"
                }`}
              >
                Round trip
              </button>
              <button
                type="button"
                onClick={() => setTripType("oneway")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tripType === "oneway"
                    ? "bg-[#FFFFFF] text-[#1C1917] shadow-xs"
                    : "text-[#78716C] hover:text-[#1C1917]"
                }`}
              >
                One way
              </button>
            </div>

            {/* Custom date range calendar */}
            <div className="flex flex-1 items-center min-w-[125px]">
              <DateRangePicker
                dateFrom={dateFrom}
                dateTo={dateTo}
                tripType={tripType}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                compact
              />
            </div>

            {/* Filters Toggle Button */}
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border transition-all flex-shrink-0 ${
                showOptions
                  ? "bg-[#F3EFE6] border-[#B45309] text-[#B45309]"
                  : "bg-[#FAF7F2] border-[#E8E2D5] text-[#78716C] hover:text-[#1C1917] hover:bg-[#FFFFFF]"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#B45309]" />
              <span>Filters</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#E8E2D5]/70 text-[#1C1917] font-bold">
                {radiusMiles} mi
              </span>
              <ChevronDown
                className={`h-3 w-3 transition-transform ${showOptions ? "rotate-180" : ""}`}
              />
            </button>

            {/* Update Search CTA */}
            <button
              type="submit"
              disabled={isLoading || !destination || !homeAirport}
              className="flex-shrink-0 flex items-center justify-center gap-1.5 bg-[#B45309] hover:bg-[#92400E] text-white font-bold rounded-xl px-4 py-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all hover:scale-[1.01]"
            >
              {isLoading ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Search className="h-3.5 w-3.5" />
                  <span>Update Search</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sleek, Compact Preferences & Filters Bar (No oversized cards, no duplicate price controls) */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="bg-[#FAF7F2] border border-[#E8E2D5] rounded-xl p-3 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Search Radius Slider */}
                <div className="bg-[#FFFFFF] p-2.5 rounded-lg border border-[#E8E2D5] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#1C1917]">
                      <Compass className="h-3.5 w-3.5 text-[#2D5A46]" />
                      <span>Hub Search Radius</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#2D5A46] bg-[#E8F0EC] px-2 py-0.5 rounded-full border border-[#2D5A46]/20">
                      {radiusMiles} miles
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={500}
                    step={25}
                    value={radiusMiles}
                    onChange={(e) => setRadiusMiles(Number(e.target.value))}
                    className="w-full accent-[#2D5A46] h-1.5 bg-[#E8E2D5] rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#78716C]">
                    <span>50 mi</span>
                    <span>300 mi (standard)</span>
                    <span>500 mi</span>
                  </div>
                </div>

                {/* Personal Time Valuation Slider */}
                <div className="bg-[#FFFFFF] p-2.5 rounded-lg border border-[#E8E2D5] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#1C1917]">
                      <Clock className="h-3.5 w-3.5 text-[#B45309]" />
                      <span>Time Valuation</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#B45309] bg-[#FDF2E9] px-2 py-0.5 rounded-full border border-[#B45309]/20">
                      ${timeValue}/hr
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={timeValue}
                    onChange={(e) => onTimeValueChange(Number(e.target.value))}
                    className="w-full accent-[#B45309] h-1.5 bg-[#E8E2D5] rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#78716C]">
                    <span>$0 (Budget)</span>
                    <span>$25/hr (Balanced)</span>
                    <span>$100/hr (Fastest)</span>
                  </div>
                </div>

                {/* Passenger Count */}
                <div className="bg-[#FFFFFF] p-2.5 rounded-lg border border-[#E8E2D5] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#1C1917]">
                      <Users className="h-3.5 w-3.5 text-[#B45309]" />
                      <span>Travelers</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#1C1917] bg-[#FAF7F2] px-2 py-0.5 rounded-full border border-[#E8E2D5]">
                      {passengers} {passengers === 1 ? "adult" : "adults"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[#78716C]">Adults (12+)</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPassengers(Math.max(1, passengers - 1))}
                        disabled={passengers <= 1}
                        className="h-7 w-7 rounded-md bg-[#FAF7F2] hover:bg-[#F3EFE6] disabled:opacity-30 border border-[#E8E2D5] flex items-center justify-center text-[#1C1917]"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-sm font-bold w-5 text-center text-[#1C1917]">{passengers}</span>
                      <button
                        type="button"
                        onClick={() => setPassengers(Math.min(9, passengers + 1))}
                        disabled={passengers >= 9}
                        className="h-7 w-7 rounded-md bg-[#FAF7F2] hover:bg-[#F3EFE6] disabled:opacity-30 border border-[#E8E2D5] flex items-center justify-center text-[#1C1917]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-[#78716C] pt-0.5">
                    <span>1 traveler</span>
                    <span>Up to 9</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
