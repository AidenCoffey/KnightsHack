"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Calendar,
  ArrowLeftRight,
  SlidersHorizontal,
  Clock,
  Compass,
  ChevronDown,
} from "lucide-react";
import type { SearchParams } from "@/types";
import { AirportCombobox } from "./AirportCombobox";

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
  timeValue: number;
  onTimeValueChange: (val: number) => void;
  currency?: string;
  onCurrencyChange?: (val: string) => void;
  currentHomeAirport?: string;
  currentDestination?: string;
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

const POPULAR_ORIGINS = [
  { iata: "FCO", label: "Rome" },
  { iata: "MXP", label: "Milan" },
  { iata: "NAP", label: "Naples" },
  { iata: "VCE", label: "Venice" },
  { iata: "BLQ", label: "Bologna" },
  { iata: "LHR", label: "London" },
  { iata: "CDG", label: "Paris" },
  { iata: "FRA", label: "Frankfurt" },
  { iata: "JFK", label: "New York" },
];

const POPULAR_DESTINATIONS = [
  { iata: "NRT", label: "Tokyo" },
  { iata: "BKK", label: "Bangkok" },
  { iata: "JFK", label: "New York" },
  { iata: "DXB", label: "Dubai" },
  { iata: "LAX", label: "Los Angeles" },
  { iata: "SIN", label: "Singapore" },
  { iata: "SYD", label: "Sydney" },
  { iata: "HKG", label: "Hong Kong" },
  { iata: "BCN", label: "Barcelona" },
  { iata: "LIS", label: "Lisbon" },
];

export function SearchForm({
  onSearch,
  isLoading,
  timeValue,
  onTimeValueChange,
  currency = "EUR",
  onCurrencyChange,
  currentHomeAirport,
  currentDestination,
}: SearchFormProps) {
  const [destination, setDestination] = useState(currentDestination || "NRT");
  const [homeAirport, setHomeAirport] = useState(currentHomeAirport || "FCO");
  const [dateFrom, setDateFrom] = useState(defaultDate());
  const [dateTo, setDateTo] = useState(defaultReturnDate());
  const [radiusMiles, setRadiusMiles] = useState(300);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);

  useEffect(() => {
    if (currentHomeAirport && currentHomeAirport !== homeAirport) {
      setHomeAirport(currentHomeAirport);
    }
  }, [currentHomeAirport, homeAirport]);

  useEffect(() => {
    if (currentDestination && currentDestination !== destination) {
      setDestination(currentDestination);
    }
  }, [currentDestination, destination]);

  const handleSwap = () => {
    const temp = homeAirport;
    setHomeAirport(destination);
    setDestination(temp);
  };

  const handleCurrencySelect = (c: string) => {
    setSelectedCurrency(c);
    if (onCurrencyChange) onCurrencyChange(c);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !homeAirport) return;
    onSearch({
      destination: destination.toUpperCase(),
      homeAirport: homeAirport.toUpperCase(),
      dateFrom,
      dateTo,
      radiusMiles,
      timeValuePerHour: timeValue,
      currency: selectedCurrency,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Primary Search Bar Container */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm rounded-2xl p-3 transition-all">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
          {/* Origin & Destination pair */}
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 relative">
            <AirportCombobox
              label="Where from?"
              value={homeAirport}
              onChange={(code) => setHomeAirport(code)}
              type="origin"
              popularSuggestions={POPULAR_ORIGINS}
              placeholder="Where from?"
            />

            {/* Swap Button */}
            <button
              type="button"
              onClick={handleSwap}
              title="Swap origin and destination"
              className="self-center h-8 w-8 rounded-full border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#FFFFFF] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition-all hover:rotate-180 duration-200 shadow-xs flex-shrink-0 z-10 -my-1 sm:my-0 sm:-mx-2"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </button>

            <AirportCombobox
              label="Where to?"
              value={destination}
              onChange={(code) => setDestination(code)}
              type="destination"
              popularSuggestions={POPULAR_DESTINATIONS}
              placeholder="Where to?"
            />
          </div>

          {/* Dates & Preferences */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Depart Date */}
            <div className="flex-1 sm:flex-initial flex items-center gap-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 min-w-[130px]">
              <Calendar className="h-4 w-4 text-[#0D9488] flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Depart
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#0F172A] outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Return Date */}
            <div className="flex-1 sm:flex-initial flex items-center gap-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 min-w-[130px]">
              <Calendar className="h-4 w-4 text-[#0D9488] flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Return
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#0F172A] outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Preferences Toggle Button */}
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold border transition-all ${
                showOptions
                  ? "bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]"
                  : "bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] hover:bg-[#FFFFFF]"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#0D9488]" />
              <span>Filters</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#0F172A] font-bold">
                {radiusMiles} mi
              </span>
              <ChevronDown
                className={`h-3 w-3 transition-transform ${showOptions ? "rotate-180" : ""}`}
              />
            </button>

            {/* Search CTA Button: Warm Amber with Deep Navy Text */}
            <button
              type="submit"
              disabled={isLoading || !destination || !homeAirport}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#0F172A] font-bold rounded-xl px-5 py-2.5 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all hover:scale-[1.01]"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 border-2 border-[#0F172A]/30 border-t-[#0F172A] rounded-full animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Update Search</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Currency Switcher */}
      <div className="flex items-center justify-between text-xs text-[#64748B] px-1 gap-2">
        <span className="text-[11px] font-medium">Alternate hub corridor search</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#64748B]">Currency:</span>
          {["EUR", "USD", "GBP"].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handleCurrencySelect(c)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                selectedCurrency === c
                  ? "bg-[#0F172A] text-white"
                  : "bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B]"
              }`}
            >
              {c === "EUR" ? "€ EUR" : c === "USD" ? "$ USD" : "£ GBP"}
            </button>
          ))}
        </div>
      </div>

      {/* Preferences / Options Panel */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-4 shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search Radius Slider */}
                <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
                      <Compass className="h-4 w-4 text-[#0D9488]" />
                      <span>Hub Search Radius</span>
                    </div>
                    <span className="text-xs font-bold text-[#0D9488] bg-[#CCFBF1] px-2 py-0.5 rounded-full">
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
                    className="w-full accent-[#0D9488] h-1.5 bg-[#E2E8F0] rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#64748B]">
                    <span>50 mi</span>
                    <span>300 mi (standard)</span>
                    <span>500 mi</span>
                  </div>
                </div>

                {/* Personal Time Valuation Slider */}
                <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
                      <Clock className="h-4 w-4 text-[#F59E0B]" />
                      <span>Time Valuation</span>
                    </div>
                    <span className="text-xs font-bold text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded-full">
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
                    className="w-full accent-[#F59E0B] h-1.5 bg-[#E2E8F0] rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#64748B]">
                    <span>$0 (Budget)</span>
                    <span>$25/hr (Balanced)</span>
                    <span>$100/hr (Fastest)</span>
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
