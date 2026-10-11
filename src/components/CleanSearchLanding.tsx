"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
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
  Train,
  ArrowUpRight,
  BookOpen,
  Copy,
  Coins,
  PhoneCall,
  Sun,
  ShieldCheck,
  Luggage,
  Plane,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import type { SearchParams } from "@/types";
import type { CountryCulturalInfo } from "@/types/cultural";
import { AirportCombobox } from "./AirportCombobox";
import { DateRangePicker } from "./DateRangePicker";
import { FALLBACK_AIRPORTS } from "@/lib/airport-data";
import { CULTURAL_FALLBACK_DATA } from "@/lib/cultural-fallback";
import { useSuitcaseTransition } from "./SuitcaseTransitionProvider";

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
  isDemo?: boolean;
  onOpenCulturalGuide?: (iata?: string, city?: string) => void;
  savedTripsCount?: number;
  onOpenMyTrips?: () => void;
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
  { iata: "TPA", city: "Tampa", country: "USA" },
  { iata: "MCO", city: "Orlando", country: "USA" },
  { iata: "FCO", city: "Rome", country: "Italy" },
  { iata: "MXP", city: "Milan", country: "Italy" },
  { iata: "ZRH", city: "Zurich", country: "Switzerland" },
  { iata: "PRG", city: "Prague", country: "Czechia" },
  { iata: "BUD", city: "Budapest", country: "Hungary" },
  { iata: "CDG", city: "Paris", country: "France" },
  { iata: "FRA", city: "Frankfurt", country: "Germany" },
  { iata: "JFK", city: "New York", country: "USA" },
];

export const TEST_PRESETS = [
  {
    title: "Tampa → Zurich",
    origin: "TPA",
    originCity: "Tampa",
    dest: "ZRH",
    destCity: "Zurich",
    tag: "🌴 Florida to Alpine",
    desc: "Compare TPA departures vs driving to MCO or Brightline to MIA (save $280+)",
  },
  {
    title: "Orlando → Tokyo",
    origin: "MCO",
    originCity: "Orlando",
    dest: "NRT",
    destCity: "Tokyo",
    tag: "🎢 Pacific Gateway",
    desc: "Compare MCO direct/1-stop vs Tampa and South Florida regional gateways",
  },
  {
    title: "Tampa → Prague",
    origin: "TPA",
    originCity: "Tampa",
    dest: "PRG",
    destCity: "Prague",
    tag: "🏰 Central Europe",
    desc: "Florida home base to historic Czech capital via European trunk connections",
  },
  {
    title: "Tampa → Rome",
    origin: "TPA",
    originCity: "Tampa",
    dest: "FCO",
    destCity: "Rome",
    tag: "🏛️ Mediterranean",
    desc: "Transatlantic route pricing across TPA, MCO, and MIA departure options",
  },
  {
    title: "Orlando → New York",
    origin: "MCO",
    originCity: "Orlando",
    dest: "JFK",
    destCity: "New York",
    tag: "🗽 Sunshine Corridor",
    desc: "High-frequency East Coast corridor: MCO vs SFB vs TPA to JFK/EWR/LGA",
  },
  {
    title: "Tampa → Bangkok",
    origin: "TPA",
    originCity: "Tampa",
    dest: "BKK",
    destCity: "Bangkok",
    tag: "🍜 Southeast Asia",
    desc: "Long-haul comparison with multi-hub connections to Thailand",
  },
  {
    title: "Milan → Zurich",
    origin: "MXP",
    originCity: "Milan",
    dest: "ZRH",
    destCity: "Zurich",
    tag: "🏔️ Alpine Rail Link",
    desc: "Scenic EuroCity rail connection across the Alps vs direct flights",
  },
  {
    title: "Frankfurt → Budapest",
    origin: "FRA",
    originCity: "Frankfurt",
    dest: "BUD",
    destCity: "Budapest",
    tag: "🌉 Danube Link",
    desc: "Central European budget carrier vs regional overland rail test",
  },
  {
    title: "Rome → Paris",
    origin: "FCO",
    originCity: "Rome",
    dest: "CDG",
    destCity: "Paris",
    tag: "🗼 Western Trunk",
    desc: "Classic high-volume European corridor across FCO/CIA and CDG/ORY",
  },
  {
    title: "Zurich → Tokyo",
    origin: "ZRH",
    originCity: "Zurich",
    dest: "HND",
    destCity: "Tokyo Haneda",
    tag: "🍣 Global Flagship",
    desc: "Alpine hub nonstop vs overland train to Milan Malpensa",
  },
  {
    title: "Prague → Milan",
    origin: "PRG",
    originCity: "Prague",
    dest: "MXP",
    destCity: "Milan",
    tag: "🏰 Bohemia to Lombardy",
    desc: "Budget airline direct to Bergamo (BGY) vs Malpensa trunk link",
  },
];

const POPULAR_CARDS = [
  {
    iata: "ZRH",
    city: "Zurich",
    country: "Switzerland",
    dates: "Nov 12 — Nov 19",
    stops: "Nonstop / SBB Link",
    price: 490,
    airline: "Edelweiss / Swiss",
    tag: "Alpine Grandeur",
    category: "rail" as const,
    image: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=800&q=80",
    railSavings: "Transatlantic Swiss Nonstop with SBB rail link",
  },
  {
    iata: "PRG",
    city: "Prague",
    country: "Czech Republic",
    dates: "Nov 14 — Nov 21",
    stops: "1 Stop · Scenic Rail",
    price: 460,
    airline: "Lufthansa / Smartwings",
    tag: "Bohemian Castles",
    category: "europe" as const,
    image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80",
    railSavings: "Central European hub with overland rail link",
  },
  {
    iata: "BUD",
    city: "Budapest",
    country: "Hungary",
    dates: "Nov 9 — Nov 16",
    stops: "1 Stop · Danube Link",
    price: 440,
    airline: "Wizz Air / British Airways",
    tag: "Danube Splendor",
    category: "europe" as const,
    image: "https://images.unsplash.com/photo-1549877452-9c387954fbc2?auto=format&fit=crop&w=800&q=80",
    railSavings: "Danube regional corridor with rail connection",
  },
  {
    iata: "BKK",
    city: "Bangkok",
    country: "Thailand",
    dates: "Nov 10 — Nov 24",
    stops: "1 Stop · Airport Rail Link",
    price: 790,
    airline: "Qatar Airways / Emirates",
    tag: "Tropical Metropolis",
    category: "asia" as const,
    image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80",
    railSavings: "Long-haul flight paired with Airport Rail Link",
  },
  {
    iata: "NRT",
    city: "Tokyo",
    country: "Japan",
    dates: "Nov 9 — Nov 23",
    stops: "1 Stop · Shinkansen",
    price: 720,
    airline: "ANA / United",
    tag: "Neon Horizon",
    category: "asia" as const,
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
    railSavings: "Pacific corridor with Narita Express / Shinkansen link",
  },
  {
    iata: "JFK",
    city: "New York",
    country: "USA",
    dates: "Dec 3 — Dec 10",
    stops: "Nonstop Flight",
    price: 69,
    airline: "Delta / JetBlue",
    tag: "Winter Horizon",
    category: "transatlantic" as const,
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80",
    railSavings: "Direct East Coast corridor via JFK / LGA",
  },
  {
    iata: "MCO",
    city: "Orlando",
    country: "USA",
    dates: "Dec 5 — Dec 12",
    stops: "Nonstop Sunshine Shuttle",
    price: 79,
    airline: "JetBlue / Delta",
    tag: "Sunshine State",
    category: "rail" as const,
    image: "https://images.unsplash.com/photo-1575089976121-8ed7b2a54265?auto=format&fit=crop&w=800&q=80",
    railSavings: "High-frequency nonstop + Brightline high-speed rail",
  },
  {
    iata: "CDG",
    city: "Paris",
    country: "France",
    dates: "Nov 18 — Nov 25",
    stops: "Nonstop / TGV Link",
    price: 520,
    airline: "Air France / Delta",
    tag: "City of Light",
    category: "europe" as const,
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
    railSavings: "Direct transatlantic options + TGV rail link",
  },
  {
    iata: "FRA",
    city: "Frankfurt",
    country: "Germany",
    dates: "Nov 15 — Nov 22",
    stops: "Nonstop Flight",
    price: 530,
    airline: "Lufthansa / Condor",
    tag: "Central Hub",
    category: "europe" as const,
    image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80",
    railSavings: "Direct Frankfurt hub departures + DB ICE rail network",
  },
  {
    iata: "FCO",
    city: "Rome",
    country: "Italy",
    dates: "Nov 11 — Nov 18",
    stops: "1 Stop / Frecciarossa Link",
    price: 510,
    airline: "ITA Airways / Norse",
    tag: "Eternal City",
    category: "transatlantic" as const,
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80",
    railSavings: "Transatlantic flight + Frecciarossa high-speed link",
  },
  {
    iata: "MXP",
    city: "Milan",
    country: "Italy",
    dates: "Nov 16 — Nov 23",
    stops: "Nonstop Flight",
    price: 520,
    airline: "Emirates / Neos",
    tag: "Lombardy Trunk",
    category: "rail" as const,
    image: "https://images.unsplash.com/photo-1513581166391-887a96ddeafd?auto=format&fit=crop&w=800&q=80",
    railSavings: "Direct Lombardy trunk routing with Malpensa Express",
  },
];

interface RouteCorridorDetails {
  stops: string;
  savings: string;
  airline: string;
  price: number;
}

function getRouteCorridor(
  homeIata: string,
  destIata: string,
  defaultStops: string,
  defaultSavings: string,
  defaultAirline: string,
  defaultPrice: number
): RouteCorridorDetails {
  const isFlorida = ["TPA", "MCO", "MIA", "FLL"].includes(homeIata);
  const isEurope = ["FCO", "MXP", "ZRH", "PRG", "BUD", "CDG", "FRA", "LHR"].includes(homeIata);
  const isNewYork = ["JFK", "EWR", "LGA"].includes(homeIata);

  const homeObj = FALLBACK_AIRPORTS.find((a) => a.iata === homeIata);
  const destObj = FALLBACK_AIRPORTS.find((a) => a.iata === destIata);
  const homeCity = homeObj?.city || homeIata;

  // 1. Florida Origins (Orlando MCO, Tampa TPA, Miami MIA, Fort Lauderdale FLL)
  if (isFlorida) {
    if (destIata === "ZRH") return { stops: "Nonstop / SBB Link", savings: "Save $280 via MCO / Brightline to MIA link", airline: "Edelweiss / Swiss", price: 490 };
    if (destIata === "NRT") return { stops: "1 Stop · Pacific Gateway", savings: "Compare MCO direct vs Tampa & MIA regional gateways", airline: "ANA / United", price: 720 };
    if (destIata === "PRG") return { stops: "1 Stop · European Trunk", savings: "Florida home base to historic Czech capital via European trunk", airline: "Lufthansa / Smartwings", price: 460 };
    if (destIata === "FCO") return { stops: "1 Stop · Mediterranean", savings: "Transatlantic route pricing across TPA, MCO & MIA options", airline: "ITA Airways / Norse", price: 510 };
    if (destIata === "JFK") return { stops: "Nonstop Sunshine Corridor", savings: "High-frequency East Coast corridor (MCO/TPA direct)", airline: "Delta / JetBlue", price: 69 };
    if (destIata === "BKK") return { stops: "1 Stop · Long Haul", savings: "Save $240 via Miami or Orlando international connect", airline: "Qatar Airways / Emirates", price: 790 };
    if (destIata === "CDG") return { stops: "Nonstop / TGV Link", savings: "Direct transatlantic options via Florida gateways", airline: "Air France / Delta", price: 520 };
    if (destIata === "FRA") return { stops: "Nonstop Flight", savings: "Direct nonstop from Orlando MCO vs Tampa connect", airline: "Lufthansa / Condor", price: 530 };
    if (destIata === "MXP") return { stops: "1 Stop · Lombardy Trunk", savings: "Save $220 via South Florida hub options", airline: "Emirates / Neos", price: 520 };
    if (destIata === "BUD") return { stops: "1 Stop · Danube Link", savings: "Central European connection with regional rail savings", airline: "Wizz Air / British Airways", price: 440 };
  }

  // 2. New York Metro Origins (JFK, EWR, LGA)
  if (isNewYork) {
    if (destIata === "ZRH") return { stops: "Transatlantic Swiss Nonstop", savings: "Direct JFK/EWR departures with Swiss Alpine rail link", airline: "Swiss / Delta", price: 475 };
    if (destIata === "CDG") return { stops: "Nonstop Flagship", savings: "Direct transatlantic Air France / Delta corridor", airline: "Air France / Delta", price: 440 };
    if (destIata === "FCO") return { stops: "Nonstop Mediterranean", savings: "Direct JFK daily nonstop on ITA Airways & Norse", airline: "ITA Airways / Norse", price: 465 };
    if (destIata === "NRT") return { stops: "14h Pacific Nonstop", savings: "Direct flagship trunk connection from JFK (ANA / JAL)", airline: "ANA / United", price: 778 };
    if (destIata === "BKK") return { stops: "1 Stop · Middle East Hub", savings: "Save $290 via Qatar (Doha) or Emirates (Dubai) connect", airline: "Qatar Airways / Emirates", price: 825 };
    if (destIata === "BUD") return { stops: "1 Stop · Danube Corridor", savings: "Save $210 connecting via LOT Warsaw or Vienna rail", airline: "LOT Polish / Lufthansa", price: 455 };
    if (destIata === "PRG") return { stops: "1 Stop · European Gateway", savings: "Save $195 via Frankfurt hub + DB ICE rail link", airline: "Lufthansa / Air France", price: 445 };
    if (destIata === "FRA") return { stops: "Nonstop Flagship", savings: "Daily JFK to FRA nonstops on Lufthansa & Singapore Air", airline: "Lufthansa / Singapore Airlines", price: 495 };
    if (destIata === "MXP") return { stops: "Nonstop Flagship", savings: "Direct 8h JFK to Milan Malpensa daily flagship", airline: "Emirates / Delta", price: 490 };
    if (destIata === "MCO") return { stops: "Nonstop Sunshine Shuttle", savings: "Save $110 on morning JFK/LGA departures to Orlando", airline: "JetBlue / Delta", price: 79 };
    if (destIata === "MIA") return { stops: "Nonstop Sunshine Shuttle", savings: "Frequent nonstops from JFK/LGA + Brightline link", airline: "American / Delta", price: 89 };
    if (destIata === "TPA") return { stops: "Nonstop Gulf Coast", savings: "Direct JFK/EWR nonstops to Tampa International", airline: "Delta / JetBlue", price: 85 };
  }

  // 3. European Origins (MXP, ZRH, CDG, FRA, FCO, PRG, BUD, etc.)
  if (isEurope) {
    if (homeIata === "MXP" && destIata === "ZRH") return { stops: "EuroCity Direct Rail", savings: "Scenic EuroCity rail connection (3.5h) across Alps vs flights", airline: "Trenitalia / SBB", price: 45 };
    if (homeIata === "ZRH" && destIata === "MXP") return { stops: "Gotthard Base Tunnel Rail", savings: "Scenic EuroCity rail link across Gotthard Base Tunnel", airline: "SBB / Trenitalia", price: 45 };
    if (homeIata === "FCO" && destIata === "CDG") return { stops: "Western Trunk Flight", savings: "Classic high-volume European corridor across FCO and CDG", airline: "Air France / ITA Airways", price: 75 };
    if (homeIata === "FRA" && destIata === "BUD") return { stops: "Direct Danube Corridor", savings: "Central European budget carrier vs regional overland rail", airline: "Lufthansa / Wizz Air", price: 79 };
    if (homeIata === "PRG" && destIata === "MXP") return { stops: "Direct Flight / Rail", savings: "Budget direct to Bergamo (BGY) vs Malpensa trunk link", airline: "EasyJet / Wizz Air", price: 55 };
    if (homeIata === "ZRH" && destIata === "NRT") return { stops: "Global Flagship Nonstop", savings: "Alpine hub nonstop vs overland train to Milan Malpensa", airline: "Swiss / ANA", price: 680 };
    if (homeIata === "CDG" && destIata === "ZRH") return { stops: "TGV Lyria High-Speed", savings: "Direct high-speed rail Paris Gare de Lyon to Zurich HB (4h)", airline: "SNCF / TGV Lyria", price: 65 };
    if (homeIata === "FRA" && destIata === "ZRH") return { stops: "DB ICE High-Speed", savings: "Direct ICE train in 3h 30m vs airport security lines", airline: "Deutsche Bahn", price: 55 };
    if (homeIata === "FCO" && destIata === "MXP") return { stops: "Frecciarossa 1000", savings: "Direct high-speed train in 3h 10m directly between city centers", airline: "Trenitalia / Italo", price: 49 };
    if (homeIata === "FCO" && destIata === "ZRH") return { stops: "Scenic Alps Corridor", savings: "Frecciarossa + SBB EuroCity scenic Alpine connection", airline: "Trenitalia / SBB", price: 65 };
    if (homeIata === "PRG" && destIata === "BUD") return { stops: "Metropolitan EuroCity", savings: "Direct Danube rail corridor in 6h 45m along rivers", airline: "České dráhy / MÁV", price: 39 };
    if (homeIata === "BUD" && destIata === "PRG") return { stops: "Metropolitan EuroCity", savings: "Direct EuroCity train connecting Budapest & Prague", airline: "MÁV / České dráhy", price: 39 };

    if (destIata === "JFK") return { stops: "Transatlantic Flagship", savings: `Direct transatlantic corridor departing from ${homeCity}`, airline: "Air France / Lufthansa / ITA", price: 420 };
    if (destIata === "NRT") return { stops: "Nonstop Eurasian Flagship", savings: `Direct global trunk routing to Tokyo from ${homeCity}`, airline: "ANA / JAL / Swiss", price: 680 };
    if (destIata === "BKK") return { stops: "1 Stop · Asian Gateway", savings: "Save €220 via Middle East or direct Star Alliance", airline: "Qatar Airways / Emirates", price: 620 };
    if (destIata === "MCO" || destIata === "MIA") return { stops: "1 Stop · Sunshine Gateway", savings: "Transatlantic connection via London or direct seasonal", airline: "Virgin Atlantic / Lufthansa", price: 490 };

    const isEuropeanDest = ["FCO", "MXP", "ZRH", "PRG", "BUD", "CDG", "FRA"].includes(destIata);
    if (isEuropeanDest) {
      return {
        stops: "Direct / High-Speed Rail Link",
        savings: `Fast European corridor connection from ${homeCity}`,
        airline: "EasyJet / Lufthansa / Rail",
        price: 75,
      };
    }
  }

  // 4. Fallback for any other global origin
  const isDomestic = homeObj?.country && destObj?.country && homeObj.country === destObj.country;
  if (isDomestic) {
    return {
      stops: "Nonstop Domestic Corridor",
      savings: `Direct trunk connection departing from ${homeCity}`,
      airline: defaultAirline,
      price: Math.max(69, Math.round(defaultPrice * 0.45)),
    };
  }

  return {
    stops: defaultStops,
    savings: `Optimal routing pairing ${homeCity} departures with regional rail`,
    airline: defaultAirline,
    price: defaultPrice,
  };
}

const AIRPORT_TO_COUNTRY: Record<string, string> = {
  ZRH: "CH",
  PRG: "CZ",
  BUD: "HU",
  BKK: "TH",
  NRT: "JP",
  HND: "JP",
  CDG: "FR",
  FRA: "DE",
  JFK: "US",
  EWR: "US",
  FCO: "IT",
  MXP: "IT",
  TPA: "US",
  MCO: "US",
};

const SPOTLIGHT_DESTINATIONS = [
  { iata: "ZRH", city: "Zurich", country: "Switzerland", flag: "🇨🇭", countryKey: "CH" },
  { iata: "NRT", city: "Tokyo", country: "Japan", flag: "🇯🇵", countryKey: "JP" },
  { iata: "PRG", city: "Prague", country: "Czech Republic", flag: "🇨🇿", countryKey: "CZ" },
  { iata: "FCO", city: "Rome", country: "Italy", flag: "🇮🇹", countryKey: "IT" },
  { iata: "CDG", city: "Paris", country: "France", flag: "🇫🇷", countryKey: "FR" },
  { iata: "BUD", city: "Budapest", country: "Hungary", flag: "🇭🇺", countryKey: "HU" },
  { iata: "BKK", city: "Bangkok", country: "Thailand", flag: "🇹🇭", countryKey: "TH" },
  { iata: "JFK", city: "New York", country: "USA", flag: "🇺🇸", countryKey: "US" },
  { iata: "FRA", city: "Frankfurt", country: "Germany", flag: "🇩🇪", countryKey: "DE" },
  { iata: "MXP", city: "Milan", country: "Italy", flag: "🇮🇹", countryKey: "IT" },
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
  onOpenCulturalGuide,
  savedTripsCount = 0,
  onOpenMyTrips,
}: CleanSearchLandingProps) {
  const router = useRouter();
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
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [radiusDropdownOpen, setRadiusDropdownOpen] = useState(false);
  const [timeValueDropdownOpen, setTimeValueDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "rail" | "transatlantic" | "asia" | "europe">("all");
  const { triggerTransition } = useSuitcaseTransition();

  // Dropdown container refs for closing on click outside
  const tripRef = useRef<HTMLDivElement>(null);
  const passengersRef = useRef<HTMLDivElement>(null);
  const cabinRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const radiusRef = useRef<HTMLDivElement>(null);
  const timeValueRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (tripDropdownOpen && tripRef.current && !tripRef.current.contains(target)) {
        setTripDropdownOpen(false);
      }
      if (passengersDropdownOpen && passengersRef.current && !passengersRef.current.contains(target)) {
        setPassengersDropdownOpen(false);
      }
      if (cabinDropdownOpen && cabinRef.current && !cabinRef.current.contains(target)) {
        setCabinDropdownOpen(false);
      }
      if (currencyDropdownOpen && currencyRef.current && !currencyRef.current.contains(target)) {
        setCurrencyDropdownOpen(false);
      }
      if (radiusDropdownOpen && radiusRef.current && !radiusRef.current.contains(target)) {
        setRadiusDropdownOpen(false);
      }
      if (timeValueDropdownOpen && timeValueRef.current && !timeValueRef.current.contains(target)) {
        setTimeValueDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTripDropdownOpen(false);
        setPassengersDropdownOpen(false);
        setCabinDropdownOpen(false);
        setCurrencyDropdownOpen(false);
        setRadiusDropdownOpen(false);
        setTimeValueDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    tripDropdownOpen,
    passengersDropdownOpen,
    cabinDropdownOpen,
    currencyDropdownOpen,
    radiusDropdownOpen,
    timeValueDropdownOpen,
  ]);

  // Carousel Wheel state for popular travel destinations
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [isAutoCycling, setIsAutoCycling] = useState(true);

  const homeAirport = currentHomeAirport || "";
  const destination = currentDestination || "";

  const [isHovered, setIsHovered] = useState(false);
  const [isSoftRefreshing, setIsSoftRefreshing] = useState(false);
  const prevHomeAirportRef = useRef(homeAirport);

  // Soft refresh popular destinations whenever home airport changes
  useEffect(() => {
    if (prevHomeAirportRef.current !== homeAirport) {
      prevHomeAirportRef.current = homeAirport;
      setIsSoftRefreshing(true);
      if (carouselRef.current) {
        carouselRef.current.scrollTo({ left: 0, behavior: "smooth" });
      }
      const timer = setTimeout(() => {
        setIsSoftRefreshing(false);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [homeAirport]);

  // Smooth continuous slow auto-scroll advancing right-to-left
  useEffect(() => {
    if (!isAutoCycling) return;
    let animId: number;
    let lastTime = performance.now();
    const speed = 0.55; // gentle, luxurious slow glide

    const step = (time: number) => {
      const delta = Math.min(time - lastTime, 50);
      lastTime = time;

      if (!isHovered && !isSoftRefreshing && carouselRef.current) {
        const el = carouselRef.current;
        el.scrollLeft += speed * (delta / 16.67);
        // Seamless loop when reaching half width
        const halfWidth = el.scrollWidth / 2;
        if (halfWidth > 0 && el.scrollLeft >= halfWidth) {
          el.scrollLeft -= halfWidth;
        }
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isAutoCycling, isHovered, isSoftRefreshing]);

  const handleNavigateToReadiness = (destCode?: string, destCity?: string) => {
    const targetCode = destCode || destination || "ZRH";
    const destAirportObj = FALLBACK_AIRPORTS.find((a) => a.iata.toUpperCase() === targetCode.toUpperCase());
    const targetCityName = destCity || destAirportObj?.city || targetCode;
    const originForNav = homeAirport || "MCO";
    triggerTransition({
      targetIata: targetCode,
      targetCity: targetCityName,
      targetUrl: `/travel-readiness?dest=${encodeURIComponent(targetCode)}&origin=${encodeURIComponent(originForNav)}`,
      origin: originForNav,
    });
  };

  const handleSwap = () => {
    if (!homeAirport && !destination) return;
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
      dateTo: tripType === "round" ? dateTo : undefined,
      tripType,
      passengers,
      radiusMiles,
      timeValuePerHour: timeValue,
      currency,
    });
  };

  const handleQuickDestinationSelect = (destIata: string) => {
    if (!homeAirport) return;
    onDestinationChange(destIata);
    onSearch({
      destination: destIata.toUpperCase(),
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

  const currentHomeInfo = FALLBACK_AIRPORTS.find((a) => a.iata === homeAirport);
  const currentDestInfo = FALLBACK_AIRPORTS.find((a) => a.iata === destination);
  const currencySymbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";

  const formatPrice = (baseEur: number) => {
    if (currency === "USD") return `$${Math.round(baseEur * 1.08)}`;
    if (currency === "GBP") return `£${Math.round(baseEur * 0.86)}`;
    return `€${baseEur}`;
  };

  const filteredCards = POPULAR_CARDS.filter((card) => {
    if (card.iata === homeAirport) return false;
    if (["JFK", "EWR", "LGA"].includes(homeAirport) && ["JFK", "EWR", "LGA"].includes(card.iata)) return false;
    if (["MCO", "TPA", "MIA", "FLL"].includes(homeAirport) && ["MCO", "TPA", "MIA"].includes(card.iata)) return false;
    if (selectedCategory === "all") return true;
    return card.category === selectedCategory;
  });

  // Seamless duplication for infinite slow-cycling conveyer belt
  const displayCards = [...filteredCards, ...filteredCards];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917] flex flex-col font-sans selection:bg-[#B45309]/15 selection:text-[#1C1917]">
      {/* Clean Top Navbar: Brand and navigation grouped consistently in the top-left */}
      <header className="shrink-0 border-b border-[#E8E2D5] bg-[#FAF7F2]/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Top Left: Brand → home */}
          <Link
            href="/"
            className="select-none cursor-pointer"
          >
            <span className="text-2xl font-serif font-bold tracking-tight text-[#1C1917] hover:text-[#B45309] transition-colors">
              Venture
            </span>
          </Link>

          {/* Top Right Cluster: Travel Readiness, My Trips, and Currency Dropdown */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Travel Readiness Top Bar Link */}
            <button
              type="button"
              onClick={() => handleNavigateToReadiness()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#FFFFFF] hover:bg-[#FAF7F2] text-[#1C1917] border border-[#E8E2D5] hover:border-[#B45309]/50 transition-all shadow-xs cursor-pointer group"
              title="Open Destination Travel Readiness Page"
            >
              <Luggage className="h-3.5 w-3.5 text-[#B45309] group-hover:scale-110 transition-transform" />
              <span>Travel Readiness</span>
            </button>

            {/* My Saved Trips Link */}
            <Link
              href="/trips"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#FFFFFF] hover:bg-[#FAF7F2] text-[#1C1917] border border-[#E8E2D5] hover:border-[#B45309]/50 transition-all shadow-xs cursor-pointer group"
              title="Open My Saved Trips"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#B45309] group-hover:scale-110 transition-transform" />
              <span>My Trips</span>
              {savedTripsCount > 0 && (
                <span className="text-[10px] text-[#2D5A46] font-bold px-1.5 py-0.2 bg-[#E8F0EC] rounded-md border border-[#D1E4D8]">
                  {savedTripsCount}
                </span>
              )}
            </Link>

            {/* Currency Selector Dropdown */}
            <div ref={currencyRef} className="relative">
              <button
                type="button"
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FFFFFF] hover:bg-[#FAF7F2] text-[#1C1917] border border-[#E8E2D5] hover:border-[#B45309]/50 transition-all shadow-xs cursor-pointer"
                title="Change Currency"
              >
                <span className="font-mono font-bold text-[#B45309]">
                  {currency === "USD" ? "$" : currency === "EUR" ? "€" : "£"}
                </span>
                <span>{currency}</span>
                <ChevronDown className="h-3.5 w-3.5 text-[#78716C]" />
              </button>

              {currencyDropdownOpen && (
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
                        onCurrencyChange(item.code);
                        setCurrencyDropdownOpen(false);
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
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full">
        {/* First-viewport hero: brand + search as one centered composition */}
        <section className="min-h-[calc(100svh-4rem)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-[1160px] w-full mx-auto flex flex-col items-center">
            {/* Simple, Short & Catchy Travel Slogan Hero */}
            <div className="text-center pb-6 sm:pb-8 select-none flex flex-col items-center max-w-4xl mx-auto">
              <h1 className="font-serif text-7xl sm:text-8xl md:text-9xl lg:text-[9.5rem] xl:text-[10.5rem] text-[#1C1917] tracking-[-0.035em] font-bold mb-2 sm:mb-3 leading-[0.88]">
                Venture
              </h1>
              <p className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] text-[#1C1917] tracking-tight font-medium leading-[1.2]">
                Travel Smarter. <span className="italic font-serif text-[#B45309]">Venture Further.</span>
              </p>
              <p className="text-xs sm:text-sm md:text-base text-[#78716C] mt-3 sm:mt-4 max-w-lg mx-auto font-normal leading-relaxed text-center">
                Where others search one airport, we price your whole region — flight, ground, and time.
              </p>
            </div>

            {/* Elevated Search Console */}
            <div className="w-full bg-[#FFFFFF] border border-[#E8E2D5] rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-stone-900/5 relative z-20 mx-auto">
              {/* Top Options Bar: Left-aligned with Currency, dedicated Rail Radius, and dedicated Traveler Time Value */}
              <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-2.5 mb-5 sm:mb-6 text-xs text-[#78716C]">
            {/* Trip Type Dropdown */}
            <div ref={tripRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setTripDropdownOpen(!tripDropdownOpen);
                  setPassengersDropdownOpen(false);
                  setCabinDropdownOpen(false);
                  setCurrencyDropdownOpen(false);
                  setRadiusDropdownOpen(false);
                  setTimeValueDropdownOpen(false);
                }}
                className="flex items-center justify-between gap-1.5 w-[9.25rem] px-3.5 py-2 rounded-xl hover:bg-[#FAF7F2] text-[#1C1917] font-medium transition-colors text-sm border border-[#E8E2D5]"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <ArrowLeftRight className="h-3.5 w-3.5 shrink-0 text-[#78716C]" />
                  <span className="truncate">{tripType === "round" ? "Round trip" : "One way"}</span>
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#78716C]" />
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
            <div ref={passengersRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setPassengersDropdownOpen(!passengersDropdownOpen);
                  setTripDropdownOpen(false);
                  setCabinDropdownOpen(false);
                  setCurrencyDropdownOpen(false);
                  setRadiusDropdownOpen(false);
                  setTimeValueDropdownOpen(false);
                }}
                className="flex items-center justify-between gap-1.5 w-[8.75rem] px-3.5 py-2 rounded-xl hover:bg-[#FAF7F2] text-[#1C1917] font-medium transition-colors text-sm border border-[#E8E2D5]"
              >
                <span className="truncate">
                  {passengers} {passengers === 1 ? "passenger" : "passengers"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#78716C]" />
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
            <div ref={cabinRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setCabinDropdownOpen(!cabinDropdownOpen);
                  setTripDropdownOpen(false);
                  setPassengersDropdownOpen(false);
                  setCurrencyDropdownOpen(false);
                  setRadiusDropdownOpen(false);
                  setTimeValueDropdownOpen(false);
                }}
                className="flex items-center justify-between gap-1.5 w-[9.75rem] px-3.5 py-2 rounded-xl hover:bg-[#FAF7F2] text-[#1C1917] font-medium transition-colors text-sm border border-[#E8E2D5]"
              >
                <span className="truncate">{cabinClass}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#78716C]" />
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


            {/* Dedicated Rail Radius Dropdown */}
            <div ref={radiusRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setRadiusDropdownOpen(!radiusDropdownOpen);
                  setTripDropdownOpen(false);
                  setPassengersDropdownOpen(false);
                  setCabinDropdownOpen(false);
                  setCurrencyDropdownOpen(false);
                  setTimeValueDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-colors text-sm font-semibold border ${
                  radiusDropdownOpen
                    ? "bg-[#F3EFE6] text-[#2D5A46] border-[#2D5A46]/30 shadow-xs"
                    : "hover:bg-[#FAF7F2] text-[#1C1917] border-[#E8E2D5]"
                }`}
                title="Configure Regional Overland Rail Catchment Radius"
              >
                <Train className="h-3.5 w-3.5 text-[#2D5A46]" />
                <span>Rail Radius: {radiusMiles} mi</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {radiusDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-80 bg-[#FFFFFF] border border-[#E8E2D5] rounded-2xl p-4 shadow-2xl z-50 space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-[#1C1917]">Regional Rail Radius</span>
                    <span className="text-[#2D5A46] font-bold bg-[#E8F0EC] px-2 py-0.5 rounded-md border border-[#D1E4D8]">
                      {radiusMiles} miles
                    </span>
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
                  <div className="flex justify-between text-[10px] text-[#78716C]">
                    <span>100 mi</span>
                    <span>300 mi (standard)</span>
                    <span>500 mi</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[150, 300, 450].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setRadiusMiles(preset)}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                          radiusMiles === preset
                            ? "bg-[#2D5A46] text-[#FFFFFF] border-[#2D5A46]"
                            : "bg-[#FAF7F2] hover:bg-[#F3EFE6] text-[#1C1917] border-[#E8E2D5]"
                        }`}
                      >
                        {preset} mi
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#78716C] leading-normal pt-1 border-t border-[#F3EFE6]">
                    Expands the catchment area to search for high-speed rail corridors and secondary airport hubs.
                  </p>
                </div>
              )}
            </div>

            {/* Dedicated Traveler Time Value Dropdown */}
            <div ref={timeValueRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setTimeValueDropdownOpen(!timeValueDropdownOpen);
                  setTripDropdownOpen(false);
                  setPassengersDropdownOpen(false);
                  setCabinDropdownOpen(false);
                  setCurrencyDropdownOpen(false);
                  setRadiusDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-colors text-sm font-semibold border ${
                  timeValueDropdownOpen
                    ? "bg-[#FDF2E9] text-[#B45309] border-[#B45309]/30 shadow-xs"
                    : "hover:bg-[#FAF7F2] text-[#1C1917] border-[#E8E2D5]"
                }`}
                title="Configure Traveler Personal Time Valuation"
              >
                <Clock className="h-3.5 w-3.5 text-[#B45309]" />
                <span>Time Value: ${timeValue}/hr</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {timeValueDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-80 bg-[#FFFFFF] border border-[#E8E2D5] rounded-2xl p-4 shadow-2xl z-50 space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-[#1C1917]">Traveler Time Value</span>
                    <span className="text-[#B45309] font-bold bg-[#FDF2E9] px-2 py-0.5 rounded-md border border-[#F3EFE6]">
                      ${timeValue}/hr
                    </span>
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
                  <div className="flex justify-between text-[10px] text-[#78716C]">
                    <span>$0/hr (pure savings)</span>
                    <span>$25/hr</span>
                    <span>$60/hr (time sensitive)</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 pt-1">
                    {[
                      { val: 10, label: "$10/hr" },
                      { val: 15, label: "$15/hr" },
                      { val: 25, label: "$25/hr" },
                      { val: 40, label: "$40/hr" },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => onTimeValueChange(item.val)}
                        className={`py-1 rounded-lg text-[11px] font-medium border text-center transition-colors ${
                          timeValue === item.val
                            ? "bg-[#B45309] text-[#FFFFFF] border-[#B45309]"
                            : "bg-[#FAF7F2] hover:bg-[#F3EFE6] text-[#1C1917] border-[#E8E2D5]"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#78716C] leading-normal pt-1 border-t border-[#F3EFE6]">
                    Weights high-speed rail and transfer hours so overland options are only recommended when net savings justify your journey time.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Core Inputs Row: Origin Hub, Swap, Destination Hub, Dates Container.
              Date column keeps a fixed share so one-way expands Departure, not the airports. */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_1.25fr] gap-3 items-stretch">
              {/* Departure Airport / Hub */}
              <div className="min-w-0">
                <AirportCombobox
                  label="Where from?"
                  value={homeAirport}
                  onChange={(code) => onHomeAirportChange(code)}
                  type="origin"
                  placeholder="Where from?"
                  excludeIata={destination}
                />
              </div>

              {/* Elegant Circular Swap Button */}
              <div className="flex justify-center items-center -my-1 lg:my-0">
                <button
                  type="button"
                  onClick={handleSwap}
                  title="Swap departure and destination"
                  className="h-12 w-12 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EFE6] border border-[#E8E2D5] text-[#78716C] hover:text-[#1C1917] flex items-center justify-center transition-all hover:rotate-180 duration-300 shadow-xs"
                >
                  <ArrowLeftRight className="h-5 w-5" />
                </button>
              </div>

              {/* Destination Airport / Hub */}
              <div className="min-w-0">
                <AirportCombobox
                  label="Where to?"
                  value={destination}
                  onChange={(code) => onDestinationChange(code)}
                  type="destination"
                  placeholder="Where to?"
                  excludeIata={homeAirport}
                />
              </div>

              {/* Custom date range calendar */}
              <div className="h-full min-h-[4.5rem]">
                <DateRangePicker
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  tripType={tripType}
                  onDateFromChange={setDateFrom}
                  onDateToChange={setDateTo}
                />
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="flex justify-center pt-3">
              <button
                type="submit"
                disabled={isLoading || !destination || !homeAirport}
                className="min-w-[280px] px-10 py-4 rounded-xl bg-[#1C1917] hover:bg-[#292524] text-[#FAF7F2] font-semibold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-stone-900/15 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-[#FAF7F2]/30 border-t-[#FAF7F2] rounded-full animate-spin" />
                    <span>Analyzing Route Corridors…</span>
                  </>
                ) : (
                  <>
                    <Compass className="h-5 w-5 text-[#D97706] stroke-[2.2]" />
                    <span>Search Flights & Rail Corridors</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
          </div>
        </section>

        {/* Below-fold content */}
        <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 lg:px-10 pb-24">
        {/* Popular Destinations Auto-Scrolling Carousel Wheel */}
        <div className="mt-2 mb-14">
          {/* Section Header */}
          <div className="flex items-center justify-between gap-3 mb-5 px-1">
            <div className="flex items-center gap-2.5">
              <span
                className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                  isSoftRefreshing ? "bg-[#D97706] scale-125 animate-ping" : "bg-[#B45309]"
                }`}
              />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1917] tracking-tight">
                {homeAirport
                  ? `Popular destinations from ${currentHomeInfo?.city || homeAirport}`
                  : "Popular destinations"}
              </h2>
            </div>

            {isSoftRefreshing && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#B45309]/10 text-[#B45309] border border-[#B45309]/20 transition-all animate-pulse">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#B45309]" />
                <span>Updating deals…</span>
              </span>
            )}
          </div>

          {/* Seamless Scrolling Wheel / Carousel Container */}
          <div className="relative">
            {/* Soft refresh top shimmer indicator line */}
            {isSoftRefreshing && (
              <div className="absolute -top-2 left-0 right-0 h-1 bg-[#F3EFE6] rounded-full overflow-hidden z-20 shadow-xs">
                <div className="h-full w-1/2 bg-gradient-to-r from-[#2D5A46] via-[#D97706] to-[#B45309] rounded-full shimmer" />
              </div>
            )}

            {/* Horizontal Carousel Track: Cycles smoothly right to left, no scrollbar */}
            <div
              ref={carouselRef}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={`flex items-stretch gap-5 overflow-x-auto no-scrollbar py-3 px-1 transition-all duration-300 ease-out ${
                isSoftRefreshing
                  ? "opacity-35 blur-[1.5px] scale-[0.99] pointer-events-none"
                  : "opacity-100 blur-0 scale-100"
              }`}
            >
              {displayCards.map((card, cardIndex) => {
                const corridor = getRouteCorridor(
                  homeAirport,
                  card.iata,
                  card.stops,
                  card.railSavings,
                  card.airline,
                  card.price
                );

                return (
                  <div
                    key={`${card.iata}-${cardIndex}`}
                    className="w-[310px] sm:w-[350px] shrink-0 bg-[#FFFFFF] border border-[#E8E2D5] hover:border-[#B45309]/50 rounded-3xl overflow-hidden transition-all duration-300 group shadow-xs hover:shadow-xl hover:-translate-y-1 flex flex-col"
                  >
                    {/* Visual Destination Cover Image */}
                    <div
                      onClick={() => handleQuickDestinationSelect(card.iata)}
                      className="relative h-44 sm:h-48 w-full overflow-hidden bg-[#F3EFE6] cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={card.image}
                        alt={card.city}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                      {/* Top Badges Row */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                        {/* Theme Tag */}
                        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[#FAF7F2] border border-white/20">
                          {card.tag}
                        </span>

                        {/* Flight Path Pill */}
                        <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#1C1917] border border-white/50 shadow-xs flex items-center gap-1.5">
                          <Plane className="h-3 w-3 text-[#B45309]" />
                          <span>{homeAirport ? `${homeAirport} → ${card.iata}` : card.iata}</span>
                        </span>
                      </div>

                      {/* Bottom City & Price on Image */}
                      <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between text-white">
                        <div>
                          <div className="font-serif text-2xl font-bold tracking-tight drop-shadow-xs">
                            {card.city}
                          </div>
                          <div className="text-[11px] text-white/80 font-medium">
                            {card.country} · {card.iata}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-white leading-tight drop-shadow-xs">
                            {formatPrice(corridor.price ?? card.price)}
                          </div>
                          <div className="text-[9px] uppercase tracking-wider text-white/75 font-medium">
                            from
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Content & Details */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
                      <div className="space-y-2">
                        {/* Stops & Dates */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#1C1917] font-semibold flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[#2D5A46]" />
                            <span>{corridor.stops}</span>
                          </span>
                          <span className="text-[11px] text-[#78716C] font-medium">
                            {card.dates}
                          </span>
                        </div>

                        {/* Airline */}
                        <div className="text-[11px] text-[#78716C]">
                          Carrier: <span className="text-[#1C1917] font-medium">{corridor.airline ?? card.airline}</span>
                        </div>

                        {/* Rail / Overland Savings Banner */}
                        <div className="text-xs text-[#2D5A46] font-medium flex items-center gap-1.5 bg-[#E8F0EC] border border-[#D1E4D8] px-2.5 py-1.5 rounded-xl">
                          <Train className="h-3.5 w-3.5 shrink-0 text-[#2D5A46]" />
                          <span className="line-clamp-1">{corridor.savings}</span>
                        </div>
                      </div>

                      {/* Card Action Row: Cultural Guide + Search */}
                      <div className="pt-3 border-t border-[#F3EFE6] flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => handleNavigateToReadiness(card.iata, card.city)}
                          className="font-semibold text-[#78716C] hover:text-[#1C1917] flex items-center gap-1.5 py-1 px-1.5 rounded-lg hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                          title={`Open full Travel Readiness page for ${card.city}`}
                        >
                          <Luggage className="h-3.5 w-3.5 text-[#B45309]" />
                          <span>Travel Readiness</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickDestinationSelect(card.iata)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#1C1917] hover:bg-[#B45309] text-[#FAF7F2] font-semibold text-xs flex items-center gap-1 transition-all shadow-xs hover:shadow-md cursor-pointer"
                        >
                          <span>Explore Route</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HOW TO USE VENTURE · 3 SIMPLE STEPS                                       */}
        {/* ========================================================================= */}
        <section className="mt-16 bg-[#FFFFFF] border border-[#E8E2D5] rounded-3xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
          {/* Subtle Ambient Background Accent */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-[#FAF7F2] to-transparent rounded-full -mr-32 -mt-32 pointer-events-none" />

          {/* Section Header: Clean & Traveler-Focused */}
          <div className="max-w-2xl mb-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3EFE6] border border-[#E8E2D5] text-[10px] sm:text-[11px] font-bold text-[#B45309] uppercase tracking-wider mb-2.5">
              <Sparkles className="h-3 w-3" />
              <span>How Venture Works</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#1C1917] tracking-tight">
              Smarter Travel in <span className="italic text-[#B45309]">3 Simple Steps</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C] mt-2 leading-relaxed">
              Every hub in reach. Every mile on the ground. One true cost — so the smartest route rises first.
            </p>
          </div>

          {/* 3 Simple, Clean Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
            {/* Step 1 */}
            <div className="bg-[#FAF7F2] border border-[#E8E2D5] rounded-2xl p-6 flex flex-col justify-between hover:border-[#B45309]/40 transition-colors shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#B45309] bg-[#FFFFFF] px-2.5 py-0.5 rounded-full border border-[#E8E2D5]">
                    01
                  </span>
                  <div className="p-2 rounded-xl bg-[#FFFFFF] border border-[#E8E2D5] text-[#B45309]">
                    <MapPin className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-[#1C1917] mb-2">
                  Check Nearby Airports
                </h3>
                <p className="text-xs text-[#78716C] leading-relaxed">
                  Flying only from your local airport is often expensive. We check nearby major hubs you can reach by train or car to find lower airfare.
                </p>
              </div>
              <div className="pt-3.5 mt-5 border-t border-[#E8E2D5] text-[11px] text-[#2D5A46] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Compare nearby departure hubs</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#FAF7F2] border border-[#E8E2D5] rounded-2xl p-6 flex flex-col justify-between hover:border-[#B45309]/40 transition-colors shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#2D5A46] bg-[#FFFFFF] px-2.5 py-0.5 rounded-full border border-[#E8E2D5]">
                    02
                  </span>
                  <div className="p-2 rounded-xl bg-[#FFFFFF] border border-[#E8E2D5] text-[#2D5A46]">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-[#1C1917] mb-2">
                  Value Your Time
                </h3>
                <p className="text-xs text-[#78716C] leading-relaxed">
                  Set what your time is worth per hour. We only recommend train routes when the dollars you save are genuinely worth the extra travel time.
                </p>
              </div>
              <div className="pt-3.5 mt-5 border-t border-[#E8E2D5] text-[11px] text-[#2D5A46] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Savings that fit your schedule</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#FAF7F2] border border-[#E8E2D5] rounded-2xl p-6 flex flex-col justify-between hover:border-[#B45309]/40 transition-colors shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#D97706] bg-[#FFFFFF] px-2.5 py-0.5 rounded-full border border-[#E8E2D5]">
                    03
                  </span>
                  <div className="p-2 rounded-xl bg-[#FFFFFF] border border-[#E8E2D5] text-[#D97706]">
                    <Luggage className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-[#1C1917] mb-2">
                  Be Prepared for Your Travels
                </h3>
                <p className="text-xs text-[#78716C] leading-relaxed">
                  Get destination-tailored travel guides, packing guidance, and local transit tips so you arrive ready for a smooth journey.
                </p>
              </div>
              <div className="pt-3.5 mt-5 border-t border-[#E8E2D5] text-[11px] text-[#2D5A46] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Destination guides & travel readiness</span>
              </div>
            </div>
          </div>

          {/* Simple, Clean Value Strip with Real Traveler Numbers */}
          <div className="mt-8 pt-6 border-t border-[#E8E2D5] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-[#FAF7F2] py-3 px-3 rounded-xl border border-[#E8E2D5]">
              <div className="text-base sm:text-lg font-bold font-serif text-[#1C1917]">72%</div>
              <div className="text-[10px] text-[#78716C] uppercase tracking-wider font-semibold">Travelers Overpay</div>
            </div>
            <div className="bg-[#FAF7F2] py-3 px-3 rounded-xl border border-[#E8E2D5]">
              <div className="text-base sm:text-lg font-bold font-serif text-[#1C1917]">$320+</div>
              <div className="text-[10px] text-[#78716C] uppercase tracking-wider font-semibold">Avg Route Savings</div>
            </div>
            <div className="bg-[#FAF7F2] py-3 px-3 rounded-xl border border-[#E8E2D5]">
              <div className="text-base sm:text-lg font-bold font-serif text-[#1C1917]">3.5 hrs</div>
              <div className="text-[10px] text-[#78716C] uppercase tracking-wider font-semibold">Saved vs Detours</div>
            </div>
            <div className="bg-[#FAF7F2] py-3 px-3 rounded-xl border border-[#E8E2D5]">
              <div className="text-base sm:text-lg font-bold font-serif text-[#1C1917]">40+</div>
              <div className="text-[10px] text-[#78716C] uppercase tracking-wider font-semibold">Scenic Stopovers</div>
            </div>
          </div>
        </section>
        </div>
      </main>
    </div>
  );
}
