"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ArrowLeftRight,
  Sparkles,
  MapPin,
  Clock,
  Compass,
  ChevronDown,
  Check,
  Plus,
  Minus,
  Info,
  Map as MapIcon,
  Train,
  ArrowUpRight,
  Globe,
  BookOpen,
  Copy,
  Coins,
  PhoneCall,
  Sun,
  ShieldCheck,
  Luggage,
} from "lucide-react";
import type { SearchParams } from "@/types";
import type { CountryCulturalInfo } from "@/types/cultural";
import { AirportCombobox } from "./AirportCombobox";
import { FALLBACK_AIRPORTS } from "@/lib/airport-data";

interface CleanSearchLandingProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
  timeValue: number;
  onTimeValueChange: (val: number) => void;
  currency: string;
  onCurrencyChange: (c: string) => void;
  currentHomeAirport: string;
  currentDestination: string;
  onHomeAirportChange: (iata: string) => void;
  onDestinationChange: (iata: string) => void;
  hasResults: boolean;
  onOpenMap: () => void;
  isDemo?: boolean;
  onOpenCulturalGuide?: (iata?: string, city?: string) => void;
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

const POPULAR_BASES = [
  { iata: "FCO", city: "Rome", country: "Italy" },
  { iata: "MXP", city: "Milan", country: "Italy" },
  { iata: "LHR", city: "London", country: "UK" },
  { iata: "CDG", city: "Paris", country: "France" },
  { iata: "FRA", city: "Frankfurt", country: "Germany" },
  { iata: "JFK", city: "New York", country: "USA" },
  { iata: "BCN", city: "Barcelona", country: "Spain" },
];

const POPULAR_CARDS = [
  {
    iata: "BUD",
    city: "Budapest",
    country: "Hungary",
    dates: "Nov 9 — Nov 16",
    stops: "Direct · Rail Link",
    price: 89,
    airline: "Wizz Air / Ryanair",
    tag: "Danube Splendor",
    image: "https://images.unsplash.com/photo-1549877452-9c387954fbc2?auto=format&fit=crop&w=800&q=80",
    railSavings: "Save €140 via regional gateway",
  },
  {
    iata: "BCN",
    city: "Barcelona",
    country: "Spain",
    dates: "Nov 12 — Nov 19",
    stops: "Nonstop Flight",
    price: 64,
    airline: "Vueling / Iberia",
    tag: "Mediterranean Coast",
    image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80",
    railSavings: "Direct corridor option",
  },
  {
    iata: "NRT",
    city: "Tokyo",
    country: "Japan",
    dates: "Nov 9 — Nov 23",
    stops: "1 Stop · High-Speed Shinkansen",
    price: 490,
    airline: "ANA / Emirates",
    tag: "Autumn Harvest",
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
    railSavings: "Save €310 via Milan MXP",
  },
  {
    iata: "JFK",
    city: "New York",
    country: "USA",
    dates: "Dec 3 — Dec 10",
    stops: "Nonstop Flight",
    price: 345,
    airline: "ITA Airways / Delta",
    tag: "Winter Horizon",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80",
    railSavings: "Direct transatlantic",
  },
  {
    iata: "DXB",
    city: "Dubai",
    country: "UAE",
    dates: "Nov 15 — Nov 22",
    stops: "Nonstop Flight",
    price: 280,
    airline: "Emirates / flydubai",
    tag: "Desert Luxury",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
    railSavings: "Save €195 via Bologna hub",
  },
  {
    iata: "LIS",
    city: "Lisbon",
    country: "Portugal",
    dates: "Nov 18 — Nov 25",
    stops: "Nonstop Flight",
    price: 95,
    airline: "TAP Air Portugal",
    tag: "Atlantic Heritage",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
    railSavings: "Scenic Iberian link",
  },
];

const SPOTLIGHT_DESTINATIONS = [
  { iata: "NRT", city: "Tokyo", country: "Japan", flag: "🇯🇵" },
  { iata: "BCN", city: "Barcelona", country: "Spain", flag: "🇪🇸" },
  { iata: "BUD", city: "Budapest", country: "Hungary", flag: "🇭🇺" },
  { iata: "FCO", city: "Rome", country: "Italy", flag: "🇮🇹" },
  { iata: "LIS", city: "Lisbon", country: "Portugal", flag: "🇵🇹" },
  { iata: "DXB", city: "Dubai", country: "UAE", flag: "🇦🇪" },
  { iata: "JFK", city: "New York", country: "USA", flag: "🇺🇸" },
  { iata: "CDG", city: "Paris", country: "France", flag: "🇫🇷" },
];

export function CleanSearchLanding({
  onSearch,
  isLoading,
  timeValue,
  onTimeValueChange,
  currency,
  onCurrencyChange,
  currentHomeAirport,
  currentDestination,
  onHomeAirportChange,
  onDestinationChange,
  hasResults,
  onOpenMap,
  onOpenCulturalGuide,
}: CleanSearchLandingProps) {
  const [tripType, setTripType] = useState<"round" | "oneway">("round");
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState("Economy");
  const [radiusMiles, setRadiusMiles] = useState(300);
  const [dateFrom, setDateFrom] = useState(defaultDate());
  const [dateTo, setDateTo] = useState(defaultReturnDate());

  // Dropdown states
  const [tripDropdownOpen, setTripDropdownOpen] = useState(false);
  const [passengersDropdownOpen, setPassengersDropdownOpen] = useState(false);
  const [cabinDropdownOpen, setCabinDropdownOpen] = useState(false);
  const [radiusDropdownOpen, setRadiusDropdownOpen] = useState(false);

  // TravelWolf Destination Intelligence State
  const [activeGuideIata, setActiveGuideIata] = useState("NRT");
  const [guideData, setGuideData] = useState<CountryCulturalInfo | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [copiedPhrase, setCopiedPhrase] = useState<string | null>(null);

  const homeAirport = currentHomeAirport || "FCO";
  const destination = currentDestination || "NRT";

  // Fetch TravelWolf Cultural Info for the highlighted destination
  useEffect(() => {
    let isCurrent = true;
    setGuideLoading(true);

    fetch(`/api/cultural-info/${encodeURIComponent(activeGuideIata)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load guide");
        return res.json();
      })
      .then((data: CountryCulturalInfo) => {
        if (isCurrent) {
          setGuideData(data);
          setGuideLoading(false);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setGuideLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [activeGuideIata]);

  const handleSwap = () => {
    onHomeAirportChange(destination);
    onDestinationChange(homeAirport);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!destination || !homeAirport) return;
    onSearch({
      destination: destination.toUpperCase(),
      homeAirport: homeAirport.toUpperCase(),
      dateFrom,
      dateTo,
      radiusMiles,
      timeValuePerHour: timeValue,
      currency,
    });
  };

  const handleQuickDestinationSelect = (destIata: string) => {
    onDestinationChange(destIata);
    onSearch({
      destination: destIata.toUpperCase(),
      homeAirport: homeAirport.toUpperCase(),
      dateFrom,
      dateTo,
      radiusMiles,
      timeValuePerHour: timeValue,
      currency,
    });
  };

  const handleCopyPhrase = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhrase(text);
    setTimeout(() => setCopiedPhrase(null), 2000);
  };

  const currentHomeInfo = FALLBACK_AIRPORTS.find((a) => a.iata === homeAirport);
  const currencySymbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  const selectedSpotlight = SPOTLIGHT_DESTINATIONS.find((s) => s.iata === activeGuideIata) || SPOTLIGHT_DESTINATIONS[0];

  // Helper to parse weather lines cleanly
  const weatherLines = guideData?.weatherInfo
    ? guideData.weatherInfo.split("\n").filter((l) => l.trim().length > 0)
    : [];
  const seasonBullets = weatherLines.filter((l) => l.includes(":") || l.startsWith("•"));

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917] flex flex-col font-sans selection:bg-[#B45309]/15 selection:text-[#1C1917]">
      {/* Clean, Gutted Top Navbar: Strictly functional, no extra badges or clutter */}
      <header className="shrink-0 border-b border-[#E8E2D5] bg-[#FAF7F2]/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand: Pure, Elegant Serif Wordmark */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="cursor-pointer select-none"
          >
            <span className="text-2xl font-serif font-bold tracking-tight text-[#1C1917]">
              Venture
            </span>
          </div>

          {/* Center: Only Active Search Results Navigation (if present) */}
          <div className="flex items-center gap-2">
            {hasResults && (
              <button
                type="button"
                onClick={onOpenMap}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#FFFFFF] hover:bg-[#FAF7F2] text-[#B45309] border border-[#E8E2D5] transition-colors shadow-xs"
              >
                <MapIcon className="h-3.5 w-3.5" />
                <span>View Route Map</span>
              </button>
            )}
          </div>

          {/* Right: Functional Currency Switcher */}
          <div className="flex items-center">
            <div className="flex items-center bg-[#F3EFE6] border border-[#E8E2D5] rounded-full p-1 text-xs">
              {(["EUR", "USD", "GBP"] as const).map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => onCurrencyChange(curr)}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                    currency === curr
                      ? "bg-[#FFFFFF] text-[#1C1917] shadow-xs font-semibold"
                      : "text-[#78716C] hover:text-[#1C1917]"
                  }`}
                >
                  {curr === "EUR" ? "€ EUR" : curr === "USD" ? "$ USD" : "£ GBP"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1120px] w-full mx-auto px-4 sm:px-6 pt-8 pb-24">
        {/* Editorial Hero Header */}
        <div className="text-center pt-4 pb-8 select-none">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F3EFE6] border border-[#E8E2D5] text-[11px] font-semibold text-[#78716C] mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B45309]" />
            <span className="tracking-wide uppercase text-[10px] text-[#78716C]">
              Intelligent Flight & Overland Discovery
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-[#1C1917] tracking-tight font-medium leading-[1.12] max-w-3xl mx-auto">
            Smarter Journeys Beyond <span className="italic font-serif text-[#B45309]">Single Airports</span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-[#78716C] mt-3.5 max-w-xl mx-auto leading-relaxed font-normal">
            Pair long-haul flights with Europe&apos;s high-speed rail corridors. Discover lower fares, panoramic overland connections, and effortless departures.
          </p>
        </div>

        {/* Elevated Search Console */}
        <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-3xl p-5 sm:p-7 shadow-xl shadow-stone-900/5 relative z-20 mt-1">
          {/* Top Options Bar */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4 text-xs text-[#78716C]">
            {/* Trip Type Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setTripDropdownOpen(!tripDropdownOpen);
                  setPassengersDropdownOpen(false);
                  setCabinDropdownOpen(false);
                  setRadiusDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#FAF7F2] text-[#1C1917] font-medium transition-colors text-xs border border-[#E8E2D5]"
              >
                <ArrowLeftRight className="h-3.5 w-3.5 text-[#78716C]" />
                <span>{tripType === "round" ? "Round trip" : "One way"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-[#78716C]" />
              </button>

              {tripDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-36 bg-[#FFFFFF] border border-[#E8E2D5] rounded-xl shadow-xl py-1 z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setTripType("round");
                      setTripDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF7F2] ${
                      tripType === "round" ? "text-[#1C1917] font-bold" : "text-[#78716C]"
                    }`}
                  >
                    <span>Round trip</span>
                    {tripType === "round" && <Check className="h-3.5 w-3.5 text-[#B45309]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTripType("oneway");
                      setTripDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF7F2] ${
                      tripType === "oneway" ? "text-[#1C1917] font-bold" : "text-[#78716C]"
                    }`}
                  >
                    <span>One way</span>
                    {tripType === "oneway" && <Check className="h-3.5 w-3.5 text-[#B45309]" />}
                  </button>
                </div>
              )}
            </div>

            {/* Passenger Count Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setPassengersDropdownOpen((prev) => !prev);
                  setTripDropdownOpen(false);
                  setCabinDropdownOpen(false);
                  setRadiusDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#FAF7F2] text-[#1C1917] font-medium transition-colors text-xs border border-[#E8E2D5]"
              >
                <span>
                  {passengers} {passengers === 1 ? "passenger" : "passengers"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-[#78716C]" />
              </button>

              {passengersDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-44 bg-[#FFFFFF] border border-[#E8E2D5] rounded-xl shadow-xl p-3 z-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#1C1917]">Adults (12+)</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPassengers(Math.max(1, passengers - 1))}
                        disabled={passengers <= 1}
                        className="h-6 w-6 rounded-md bg-[#FAF7F2] hover:bg-[#F3EFE6] disabled:opacity-30 border border-[#E8E2D5] flex items-center justify-center text-[#1C1917]"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{passengers}</span>
                      <button
                        type="button"
                        onClick={() => setPassengers(Math.min(9, passengers + 1))}
                        disabled={passengers >= 9}
                        className="h-6 w-6 rounded-md bg-[#FAF7F2] hover:bg-[#F3EFE6] disabled:opacity-30 border border-[#E8E2D5] flex items-center justify-center text-[#1C1917]"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cabin Class Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setCabinDropdownOpen(!cabinDropdownOpen);
                  setTripDropdownOpen(false);
                  setPassengersDropdownOpen(false);
                  setRadiusDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#FAF7F2] text-[#1C1917] font-medium transition-colors text-xs border border-[#E8E2D5]"
              >
                <span>{cabinClass}</span>
                <ChevronDown className="h-3.5 w-3.5 text-[#78716C]" />
              </button>

              {cabinDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-44 bg-[#FFFFFF] border border-[#E8E2D5] rounded-xl shadow-xl py-1 z-50">
                  {["Economy", "Premium economy", "Business", "First"].map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => {
                        setCabinClass(cls);
                        setCabinDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF7F2] ${
                        cabinClass === cls ? "text-[#1C1917] font-bold" : "text-[#78716C]"
                      }`}
                    >
                      <span>{cls}</span>
                      {cabinClass === cls && <Check className="h-3.5 w-3.5 text-[#B45309]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Overland Radius & Time Value Slider */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setRadiusDropdownOpen(!radiusDropdownOpen);
                  setTripDropdownOpen(false);
                  setPassengersDropdownOpen(false);
                  setCabinDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors text-xs font-semibold border ${
                  radiusDropdownOpen
                    ? "bg-[#F3EFE6] text-[#B45309] border-[#B45309]/30"
                    : "hover:bg-[#FAF7F2] text-[#1C1917] border-[#E8E2D5]"
                }`}
              >
                <Train className="h-3.5 w-3.5 text-[#2D5A46]" />
                <span>Rail Radius: {radiusMiles} mi</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {radiusDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-80 bg-[#FFFFFF] border border-[#E8E2D5] rounded-2xl p-4 shadow-2xl z-50 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-[#1C1917] font-semibold mb-1.5">
                      <span>Regional Gateway Radius</span>
                      <span className="text-[#2D5A46] font-bold">{radiusMiles} miles</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={500}
                      step={50}
                      value={radiusMiles}
                      onChange={(e) => setRadiusMiles(Number(e.target.value))}
                      className="w-full accent-[#2D5A46] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#78716C] mt-1">
                      <span>100 mi</span>
                      <span>300 mi</span>
                      <span>500 mi</span>
                    </div>
                  </div>

                  <div className="border-t border-[#E8E2D5] pt-3">
                    <div className="flex justify-between text-xs text-[#1C1917] font-semibold mb-1.5">
                      <span>Traveler Time Value</span>
                      <span className="text-[#B45309] font-bold">${timeValue}/hr</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={60}
                      step={5}
                      value={timeValue}
                      onChange={(e) => onTimeValueChange(Number(e.target.value))}
                      className="w-full accent-[#B45309] cursor-pointer"
                    />
                    <p className="text-[10px] text-[#78716C] mt-1 leading-normal">
                      Weights high-speed rail and transfer hours so overland options are only recommended when net savings justify your journey time.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Core Inputs Row: Origin Hub, Swap, Destination Hub, Dates Container */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_1.25fr] gap-2.5 items-center">
              {/* Departure Airport / Hub */}
              <div className="min-w-0">
                <AirportCombobox
                  label="Where from?"
                  value={homeAirport}
                  onChange={(code) => onHomeAirportChange(code)}
                  type="origin"
                  popularSuggestions={POPULAR_BASES.map((b) => ({
                    iata: b.iata,
                    label: `${b.city} (${b.iata})`,
                  }))}
                  placeholder="Where from?"
                />
              </div>

              {/* Elegant Circular Swap Button */}
              <div className="flex justify-center -my-1 lg:my-0">
                <button
                  type="button"
                  onClick={handleSwap}
                  title="Swap departure and destination"
                  className="h-10 w-10 rounded-full bg-[#FAF7F2] hover:bg-[#F3EFE6] border border-[#E8E2D5] text-[#78716C] hover:text-[#1C1917] flex items-center justify-center transition-all hover:rotate-180 duration-300 shadow-xs"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </button>
              </div>

              {/* Destination Airport / Hub */}
              <div className="min-w-0">
                <AirportCombobox
                  label="Where to?"
                  value={destination}
                  onChange={(code) => onDestinationChange(code)}
                  type="destination"
                  popularSuggestions={POPULAR_CARDS.map((d) => ({
                    iata: d.iata,
                    label: `${d.city} (${d.iata})`,
                  }))}
                  placeholder="Where to?"
                />
              </div>

              {/* Split Date Container */}
              <div className="flex items-center rounded-2xl border border-[#E8E2D5] bg-[#FAF7F2] px-4 py-3 text-xs focus-within:border-[#B45309] transition-colors">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#78716C] uppercase tracking-wider mb-0.5 font-medium">
                    <Calendar className="h-3 w-3 text-[#B45309]" />
                    <span>Departure</span>
                  </div>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-[#1C1917] outline-none cursor-pointer"
                  />
                </div>

                <div className="h-8 w-px bg-[#E8E2D5] mx-1.5" />

                <div className="flex-1 min-w-0 pl-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#78716C] uppercase tracking-wider mb-0.5 font-medium">
                    <Calendar className="h-3 w-3 text-[#B45309]" />
                    <span>Return</span>
                  </div>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-[#1C1917] outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={isLoading || !destination || !homeAirport}
                className="min-w-[210px] px-8 py-3.5 rounded-full bg-[#1C1917] hover:bg-[#292524] text-[#FAF7F2] font-semibold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-stone-900/15 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-[#FAF7F2]/30 border-t-[#FAF7F2] rounded-full animate-spin" />
                    <span>Analyzing Route Corridors…</span>
                  </>
                ) : (
                  <>
                    <Compass className="h-4 w-4 text-[#D97706] stroke-[2.2]" />
                    <span>Search Flights & Rail Corridors</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ========================================================================= */}
        {/* DESTINATION INTELLIGENCE & TRAVEL DOSSIER (Powered by TravelWolf API)      */}
        {/* ========================================================================= */}
        <section className="mt-14 bg-[#FFFFFF] border border-[#E8E2D5] rounded-3xl p-6 sm:p-8 shadow-xs">
          {/* Section Header: Luxury Editorial Styling */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-[#B45309] mb-1">
                Traveler Dossier & Local Etiquette
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#1C1917] tracking-tight">
                Destination Intelligence
              </h2>
              <p className="text-xs sm:text-sm text-[#78716C] mt-1 max-w-xl">
                Quick essentials on packing, customs, and arrival tips before you fly. Explore the complete in-depth dossier on the dedicated guide page.
              </p>
            </div>

            <a
              href={`/guide/${encodeURIComponent(selectedSpotlight.iata)}`}
              className="px-5 py-2.5 rounded-full bg-[#1C1917] hover:bg-[#292524] text-[#FAF7F2] text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors shrink-0"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#D97706]" />
              <span>Explore Full {selectedSpotlight.city} Guide</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#A8A29E]" />
            </a>
          </div>

          {/* Destination Selector Tabs: Refined, Comfortable Pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-5 custom-scrollbar">
            {SPOTLIGHT_DESTINATIONS.map((dest) => (
              <button
                key={dest.iata}
                type="button"
                onClick={() => setActiveGuideIata(dest.iata)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all flex items-center gap-2 ${
                  activeGuideIata === dest.iata
                    ? "bg-[#1C1917] text-[#FAF7F2] border-[#1C1917] shadow-xs"
                    : "bg-[#FAF7F2] text-[#78716C] border-[#E8E2D5] hover:border-[#D6CEBF] hover:text-[#1C1917]"
                }`}
              >
                <span className="text-sm">{dest.flag}</span>
                <span>{dest.city}</span>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    activeGuideIata === dest.iata ? "text-[#D97706]" : "text-[#78716C]"
                  }`}
                >
                  {dest.iata}
                </span>
              </button>
            ))}
          </div>

          {/* Dossier Content Body */}
          {guideLoading ? (
            <div className="py-14 flex flex-col items-center justify-center gap-2 text-xs text-[#78716C]">
              <span className="h-6 w-6 border-2 border-[#B45309]/30 border-t-[#B45309] rounded-full animate-spin" />
              <span>Loading TravelWolf cultural dossier…</span>
            </div>
          ) : guideData ? (
            <div className="space-y-6">
              {/* Top 3 Core Insights Grid: Clean, Uncluttered, Digestible */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. What to Pack & Bring */}
                <div className="bg-[#FAF7F2] border border-[#E8E2D5] rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#B45309]">
                        <Luggage className="h-4 w-4" />
                        <span>What to Pack & Bring</span>
                      </div>
                      <span className="text-[10px] bg-[#E8F0EC] text-[#2D5A46] font-bold px-2 py-0.5 rounded-full">
                        Essentials
                      </span>
                    </div>

                    <div className="space-y-2 mt-1">
                      {guideData.essentialItems && guideData.essentialItems.length > 0 ? (
                        guideData.essentialItems
                          .flatMap((g) => g.items)
                          .slice(0, 3)
                          .map((item, idx) => (
                            <div
                              key={idx}
                              className="text-xs bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E8E2D5] flex items-start gap-2"
                            >
                              <span className="mt-0.5 h-3.5 w-3.5 rounded bg-[#FAF7F2] border border-[#D6CEBF] flex items-center justify-center shrink-0">
                                <Check className="h-2.5 w-2.5 text-[#2D5A46]" />
                              </span>
                              <span className="text-[#1C1917] text-[11px] leading-snug">
                                {item}
                              </span>
                            </div>
                          ))
                      ) : (
                        <p className="text-xs text-[#78716C]">Standard international travel packing advised.</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E8E2D5] text-[11px] text-[#78716C] flex items-center justify-between">
                    <span>Luggage Checklist</span>
                    <a
                      href={`/guide/${encodeURIComponent(selectedSpotlight.iata)}`}
                      className="text-[#B45309] font-semibold hover:underline flex items-center gap-0.5"
                    >
                      <span>Full packing tracker</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                {/* 2. Seasonality & Climate */}
                <div className="bg-[#FAF7F2] border border-[#E8E2D5] rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#2D5A46] mb-3">
                      <Sun className="h-4 w-4" />
                      <span>Best Season to Visit</span>
                    </div>

                    <div className="space-y-2 mt-1">
                      {seasonBullets.length > 0 ? (
                        seasonBullets.slice(0, 3).map((bullet, idx) => {
                          const clean = bullet.replace(/^[•\-\*]\s*/, "");
                          const parts = clean.split(":");
                          const seasonName = parts[0];
                          const seasonDesc = parts.slice(1).join(":");
                          return (
                            <div key={idx} className="text-xs space-y-0.5 bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E8E2D5]">
                              <span className="font-semibold text-[#1C1917] bg-[#F3EFE6] px-1.5 py-0.5 rounded text-[10px] border border-[#E8E2D5] mr-1.5 inline-block">
                                {seasonName}
                              </span>
                              <span className="text-[#78716C] text-[11px] leading-snug block mt-0.5">
                                {seasonDesc}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-[#78716C] leading-relaxed">
                          {guideData.weatherInfo || "Mild climate with distinct travel seasons."}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E8E2D5] text-[11px] text-[#78716C] flex items-center justify-between">
                    <span>Travel Window</span>
                    <span className="text-[#2D5A46] font-semibold">TravelWolf Climate</span>
                  </div>
                </div>

                {/* 3. Currency & Emergency Numbers */}
                <div className="bg-[#FAF7F2] border border-[#E8E2D5] rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#78716C] mb-3">
                      <Coins className="h-4 w-4 text-[#D97706]" />
                      <span>Money & Emergency</span>
                    </div>

                    <div className="space-y-2 mt-1">
                      {guideData.currencyInfo && (
                        <div className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E8E2D5] flex items-center justify-between">
                          <div>
                            <div className="font-bold text-[#1C1917] text-xs">
                              {guideData.currencyInfo.code} · {guideData.currencyInfo.name}
                            </div>
                            <div className="text-[10px] text-[#78716C]">
                              Cash & contactless cards
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-[#2D5A46] bg-[#E8F0EC] px-2 py-0.5 rounded">
                            Official Currency
                          </span>
                        </div>
                      )}

                      {guideData.emergencyInfo && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-[#FFFFFF] p-2 rounded-xl border border-[#E8E2D5]">
                            <div className="text-[9px] text-[#78716C] uppercase font-bold">Police</div>
                            <div className="font-mono font-bold text-sm text-[#1C1917]">
                              {guideData.emergencyInfo.police}
                            </div>
                          </div>
                          <div className="bg-[#FFFFFF] p-2 rounded-xl border border-[#E8E2D5]">
                            <div className="text-[9px] text-[#78716C] uppercase font-bold">Ambulance</div>
                            <div className="font-mono font-bold text-sm text-[#1C1917]">
                              {guideData.emergencyInfo.ambulance}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E8E2D5] text-[11px] text-[#78716C] flex items-center justify-between">
                    <span>Emergency Routing</span>
                    <span className="text-[#2D5A46] font-semibold">Ready to Assist</span>
                  </div>
                </div>
              </div>

              {/* Local Customs & Useful Phrases Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Local Customs */}
                <div className="bg-[#FAF7F2] border border-[#E8E2D5] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-[#D97706]" />
                      Cultural Etiquette in {guideData.countryName}
                    </span>
                    <a
                      href={`/guide/${encodeURIComponent(selectedSpotlight.iata)}`}
                      className="text-[11px] text-[#B45309] font-semibold hover:underline flex items-center gap-0.5"
                    >
                      <span>Read all</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </div>

                  <div className="space-y-2">
                    {guideData.localCustoms && guideData.localCustoms.length > 0 ? (
                      guideData.localCustoms.slice(0, 2).map((custom, idx) => (
                        <div
                          key={idx}
                          className="bg-[#FFFFFF] p-3 rounded-xl border border-[#E8E2D5] text-xs space-y-1 shadow-xs"
                        >
                          <div className="font-bold text-[#1C1917]">{custom.title}</div>
                          <div className="text-[#78716C] leading-relaxed text-[11px]">
                            {custom.description}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#78716C]">Observe local cultural etiquette at monuments and sacred sites.</p>
                    )}
                  </div>
                </div>

                {/* Practical Local Phrases */}
                <div className="bg-[#FAF7F2] border border-[#E8E2D5] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                      <Globe className="h-4 w-4 text-[#2D5A46]" />
                      Key Local Phrases
                    </span>
                    <span className="text-[10px] text-[#78716C]">Click to copy</span>
                  </div>

                  <div className="space-y-2">
                    {guideData.usefulPhrases && guideData.usefulPhrases.length > 0 ? (
                      guideData.usefulPhrases.slice(0, 2).map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleCopyPhrase(item.phrase)}
                          className="bg-[#FFFFFF] hover:bg-[#F3EFE6] cursor-pointer p-3 rounded-xl border border-[#E8E2D5] flex items-center justify-between transition-colors group shadow-xs"
                        >
                          <div>
                            <div className="text-xs font-bold text-[#1C1917] flex items-center gap-2">
                              <span>{item.phrase}</span>
                              <span className="text-[11px] font-normal text-[#B45309] font-mono">
                                /{item.phonetic}/
                              </span>
                            </div>
                            <div className="text-[11px] text-[#78716C] mt-0.5">{item.translation}</div>
                          </div>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-[#78716C] group-hover:text-[#1C1917] transition-colors"
                            title="Copy phrase"
                          >
                            {copiedPhrase === item.phrase ? (
                              <Check className="h-3.5 w-3.5 text-[#2D5A46]" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#78716C]">English widely spoken in major transit gateways.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Banner to set destination */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F3EFE6] border border-[#E8E2D5] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-[#1C1917]">
                  <strong>Planning your journey to {selectedSpotlight.city}?</strong> Search verified high-speed rail corridors and flight routes starting from {currentHomeInfo?.city || homeAirport}.
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/guide/${encodeURIComponent(selectedSpotlight.iata)}`}
                    className="px-4 py-2 rounded-full border border-[#E8E2D5] bg-[#FFFFFF] hover:bg-[#FAF7F2] text-[#1C1917] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-[#B45309]" />
                    <span>View Dossier Page</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      onDestinationChange(selectedSpotlight.iata);
                      window.scrollTo({ top: 120, behavior: "smooth" });
                    }}
                    className="px-5 py-2 rounded-full bg-[#1C1917] hover:bg-[#292524] text-[#FAF7F2] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Set Destination & Search</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#D97706]" />
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {/* Curated Expeditions Showcase */}
        <div className="mt-14">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-serif text-2xl font-medium text-[#1C1917] tracking-tight">
                Curated Journeys from{" "}
                <span className="italic text-[#B45309]">
                  {currentHomeInfo?.city || homeAirport}
                </span>
              </h2>
              <p className="text-xs text-[#78716C] mt-0.5">
                Handpicked global destinations featuring optimized overland connections and direct flights.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#78716C]">
              <Info className="h-3.5 w-3.5 text-[#B45309]" />
              <span>Explore route or cultural guide</span>
            </div>
          </div>

          {/* Quick Hub Switcher Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-5 custom-scrollbar">
            {POPULAR_BASES.map((base) => (
              <button
                key={base.iata}
                type="button"
                onClick={() => onHomeAirportChange(base.iata)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  homeAirport === base.iata
                    ? "bg-[#1C1917] text-[#FAF7F2] border-[#1C1917] shadow-xs"
                    : "bg-[#FFFFFF] text-[#78716C] border-[#E8E2D5] hover:border-[#D6CEBF] hover:text-[#1C1917]"
                }`}
              >
                {base.city} ({base.iata})
              </button>
            ))}
          </div>

          {/* High-End Destination Cards Grid with Travel Photography */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {POPULAR_CARDS.map((card) => (
              <div
                key={card.iata}
                className="bg-[#FFFFFF] border border-[#E8E2D5] hover:border-[#B45309]/50 rounded-2xl overflow-hidden transition-all duration-200 group shadow-xs hover:shadow-lg flex flex-col"
              >
                {/* Visual Destination Cover Image */}
                <div
                  onClick={() => handleQuickDestinationSelect(card.iata)}
                  className="relative h-40 w-full overflow-hidden bg-[#F3EFE6] cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.image}
                    alt={card.city}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                  {/* Top Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#1C1917]/80 backdrop-blur-md text-[#FAF7F2] border border-white/20">
                      {card.tag}
                    </span>
                  </div>

                  {/* Bottom City & Country on Image */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                    <div>
                      <div className="font-serif text-xl font-bold tracking-tight">
                        {card.city}
                      </div>
                      <div className="text-[11px] text-white/80">
                        {card.country} · {card.iata}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white leading-tight">
                        {currencySymbol}{card.price}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-white/70">
                        from
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Content & Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#1C1917] font-semibold flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#2D5A46]" />
                        <span>{card.stops}</span>
                      </span>
                      <span className="text-[11px] text-[#78716C]">{card.dates}</span>
                    </div>

                    <div className="text-[11px] text-[#2D5A46] font-medium flex items-center gap-1 bg-[#E8F0EC] px-2 py-0.5 rounded-md w-fit">
                      <Train className="h-3 w-3" />
                      <span>{card.railSavings}</span>
                    </div>
                  </div>

                  {/* Card Action Row: Cultural Guide + Search */}
                  <div className="pt-2.5 border-t border-[#F3EFE6] flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => onOpenCulturalGuide?.(card.iata, card.city)}
                      className="font-semibold text-[#78716C] hover:text-[#1C1917] flex items-center gap-1 transition-colors"
                      title={`Open cultural guide for ${card.city}`}
                    >
                      <BookOpen className="h-3.5 w-3.5 text-[#B45309]" />
                      <span>Cultural Guide</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDestinationSelect(card.iata)}
                      className="text-[#B45309] font-bold flex items-center gap-0.5 hover:underline transition-colors"
                    >
                      <span>Explore</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* The 3 Core Travel Principles */}
        <div className="mt-16 border-t border-[#E8E2D5] pt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[#78716C]">
          <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E8E2D5]">
            <div className="text-[#1C1917] font-serif font-bold text-base mb-1.5 flex items-center gap-2">
              <Compass className="h-4 w-4 text-[#B45309]" />
              Overland & Rail Discovery
            </div>
            <p className="leading-relaxed">
              Link Trenitalia Frecciarossa, SNCF TGV, and DB ICE networks with international flights to discover routes inaccessible through standard airport engines.
            </p>
          </div>

          <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E8E2D5]">
            <div className="text-[#1C1917] font-serif font-bold text-base mb-1.5 flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#2D5A46]" />
              Door-to-Door Transparency
            </div>
            <p className="leading-relaxed">
              Every route factors in high-speed rail tickets, regional transfer costs, and airport shuttles so you always see your realistic total expedition cost.
            </p>
          </div>

          <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E8E2D5]">
            <div className="text-[#1C1917] font-serif font-bold text-base mb-1.5 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#D97706]" />
              Time-Valued Optimization
            </div>
            <p className="leading-relaxed">
              Your customizable hourly time valuation guarantees you will only be offered overland detours when fare savings significantly outweigh the extra travel hours.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
