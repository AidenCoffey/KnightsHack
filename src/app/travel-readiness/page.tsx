"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Luggage,
  Sparkles,
  ShieldAlert,
  BookOpen,
  Coins,
  PhoneCall,
  Zap,
  Globe,
  Check,
  ArrowRight,
  AlertTriangle,
  Train,
  CheckCircle2,
  ChevronDown,
  Search,
  ArrowRightLeft,
  CreditCard,
  Building,
  MapPin,
  X,
  Plane,
  ExternalLink,
  SlidersHorizontal,
  Flame,
  ArrowUpRight,
} from "lucide-react";
import type { Airport } from "@/types";
import type { CountryCulturalInfo } from "@/types/cultural";
import { getCountryFlag, getCountryNameFromCode } from "@/lib/cultural-utils";
import { FALLBACK_AIRPORTS } from "@/lib/airport-data";
import { CULTURAL_FALLBACK_DATA, resolveCountryKey, createUniversalCountryFallback } from "@/lib/cultural-fallback";
interface ForexData {
  from: string;
  to: string;
  midRate: number;
  buyRate: number;
  sellRate: number;
  inverseRate: number;
  spreadPercent: number;
  source: string;
  fromMeta: { name: string; symbol: string; country: string };
  toMeta: { name: string; symbol: string; country: string };
  lastUpdated: string;
}

// Popular destination carousel cards with high-res imagery
const POPULAR_CAROUSEL_DESTINATIONS = [
  {
    iata: "NRT",
    city: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    currency: "JPY",
    tag: "Neon & Tradition",
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
    desc: "Ancient shrines, Shinkansen bullet rail, and Tokyo metropolitan energy.",
  },
  {
    iata: "FCO",
    city: "Rome",
    country: "Italy",
    flag: "🇮🇹",
    currency: "EUR",
    tag: "Imperial History",
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80",
    desc: "Vatican City, cobblestone piazzas, and iconic Italian culinary heritage.",
  },
  {
    iata: "ZRH",
    city: "Zurich",
    country: "Switzerland",
    flag: "🇨🇭",
    currency: "CHF",
    tag: "Alpine Grandeur",
    image: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=800&q=80",
    desc: "Lake Zurich, clockwork SBB rail spine, and pristine mountain vistas.",
  },
  {
    iata: "PRG",
    city: "Prague",
    country: "Czechia",
    flag: "🇨🇿",
    currency: "CZK",
    tag: "Bohemian Castles",
    image: "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=800&q=80",
    desc: "Charles Bridge, Gothic spires, and historic Old Town squares.",
  },
  {
    iata: "CDG",
    city: "Paris",
    country: "France",
    flag: "🇫🇷",
    currency: "EUR",
    tag: "City of Light",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
    desc: "The Seine, Haussmannian boulevards, and world-class bistros.",
  },
  {
    iata: "BUD",
    city: "Budapest",
    country: "Hungary",
    flag: "🇭🇺",
    currency: "HUF",
    tag: "Danube Splendor",
    image: "https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=800&q=80",
    desc: "Thermal bathhouses, Danube river vistas, and grand Parliament halls.",
  },
  {
    iata: "BKK",
    city: "Bangkok",
    country: "Thailand",
    flag: "🇹🇭",
    currency: "THB",
    tag: "Tropical Temples",
    image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80",
    desc: "Golden wats, bustling night markets, and Chao Phraya river ferries.",
  },
  {
    iata: "FRA",
    city: "Frankfurt",
    country: "Germany",
    flag: "🇩🇪",
    currency: "EUR",
    tag: "Continental Crossroads",
    image: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=800&q=80",
    desc: "Main river skylines, ICE train connections, and historic Römerberg.",
  },
  {
    iata: "JFK",
    city: "New York",
    country: "United States",
    flag: "🇺🇸",
    currency: "USD",
    tag: "Empire Metropolis",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80",
    desc: "Manhattan skyline, Broadway, Central Park, and 24-hour transit.",
  },
  {
    iata: "LHR",
    city: "London",
    country: "United Kingdom",
    flag: "🇬🇧",
    currency: "GBP",
    tag: "Royal Heritage",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
    desc: "Westminster, the Tube transit spine, and timeless British culture.",
  },
];

// Curated list of searchable countries with metadata and gateway hubs
interface SearchableCountry {
  countryCode: string;
  countryName: string;
  flag: string;
  primaryIata: string;
  capitalCity: string;
  currency: string;
  power: string;
  region: "Europe" | "Asia" | "Americas" | "Middle East" | "Oceania" | "Africa";
}

const SEARCHABLE_COUNTRIES: SearchableCountry[] = [
  { countryCode: "CZ", countryName: "Czech Republic", flag: "🇨🇿", primaryIata: "PRG", capitalCity: "Prague", currency: "CZK", power: "230V Type C/E", region: "Europe" },
  { countryCode: "JP", countryName: "Japan", flag: "🇯🇵", primaryIata: "NRT", capitalCity: "Tokyo", currency: "JPY", power: "100V Type A/B", region: "Asia" },
  { countryCode: "IT", countryName: "Italy", flag: "🇮🇹", primaryIata: "FCO", capitalCity: "Rome", currency: "EUR", power: "230V Type C/F/L", region: "Europe" },
  { countryCode: "FR", countryName: "France", flag: "🇫🇷", primaryIata: "CDG", capitalCity: "Paris", currency: "EUR", power: "230V Type C/E", region: "Europe" },
  { countryCode: "CH", countryName: "Switzerland", flag: "🇨🇭", primaryIata: "ZRH", capitalCity: "Zurich", currency: "CHF", power: "230V Type J", region: "Europe" },
  { countryCode: "HU", countryName: "Hungary", flag: "🇭🇺", primaryIata: "BUD", capitalCity: "Budapest", currency: "HUF", power: "230V Type C/F", region: "Europe" },
  { countryCode: "TH", countryName: "Thailand", flag: "🇹🇭", primaryIata: "BKK", capitalCity: "Bangkok", currency: "THB", power: "230V Type A/B/C/O", region: "Asia" },
  { countryCode: "DE", countryName: "Germany", flag: "🇩🇪", primaryIata: "FRA", capitalCity: "Frankfurt", currency: "EUR", power: "230V Type C/F", region: "Europe" },
  { countryCode: "GB", countryName: "United Kingdom", flag: "🇬🇧", primaryIata: "LHR", capitalCity: "London", currency: "GBP", power: "230V Type G", region: "Europe" },
  { countryCode: "US", countryName: "United States", flag: "🇺🇸", primaryIata: "JFK", capitalCity: "New York", currency: "USD", power: "120V Type A/B", region: "Americas" },
  { countryCode: "ES", countryName: "Spain", flag: "🇪🇸", primaryIata: "MAD", capitalCity: "Madrid", currency: "EUR", power: "230V Type C/F", region: "Europe" },
  { countryCode: "NL", countryName: "Netherlands", flag: "🇳🇱", primaryIata: "AMS", capitalCity: "Amsterdam", currency: "EUR", power: "230V Type C/F", region: "Europe" },
  { countryCode: "AT", countryName: "Austria", flag: "🇦🇹", primaryIata: "VIE", capitalCity: "Vienna", currency: "EUR", power: "230V Type C/F", region: "Europe" },
  { countryCode: "PT", countryName: "Portugal", flag: "🇵🇹", primaryIata: "LIS", capitalCity: "Lisbon", currency: "EUR", power: "230V Type C/F", region: "Europe" },
  { countryCode: "GR", countryName: "Greece", flag: "🇬🇷", primaryIata: "ATH", capitalCity: "Athens", currency: "EUR", power: "230V Type C/F", region: "Europe" },
  { countryCode: "KR", countryName: "South Korea", flag: "🇰🇷", primaryIata: "ICN", capitalCity: "Seoul", currency: "KRW", power: "220V Type C/F", region: "Asia" },
  { countryCode: "SG", countryName: "Singapore", flag: "🇸🇬", primaryIata: "SIN", capitalCity: "Singapore", currency: "SGD", power: "230V Type G", region: "Asia" },
  { countryCode: "AE", countryName: "United Arab Emirates", flag: "🇦🇪", primaryIata: "DXB", capitalCity: "Dubai", currency: "AED", power: "230V Type G", region: "Middle East" },
  { countryCode: "AU", countryName: "Australia", flag: "🇦🇺", primaryIata: "SYD", capitalCity: "Sydney", currency: "AUD", power: "230V Type I", region: "Oceania" },
  { countryCode: "CA", countryName: "Canada", flag: "🇨🇦", primaryIata: "YYZ", capitalCity: "Toronto", currency: "CAD", power: "120V Type A/B", region: "Americas" },
  { countryCode: "TR", countryName: "Turkey", flag: "🇹🇷", primaryIata: "IST", capitalCity: "Istanbul", currency: "TRY", power: "230V Type C/F", region: "Europe" },
  { countryCode: "IE", countryName: "Ireland", flag: "🇮🇪", primaryIata: "DUB", capitalCity: "Dublin", currency: "EUR", power: "230V Type G", region: "Europe" },
  { countryCode: "NO", countryName: "Norway", flag: "🇳🇴", primaryIata: "OSL", capitalCity: "Oslo", currency: "NOK", power: "230V Type C/F", region: "Europe" },
  { countryCode: "SE", countryName: "Sweden", flag: "🇸🇪", primaryIata: "ARN", capitalCity: "Stockholm", currency: "SEK", power: "230V Type C/F", region: "Europe" },
  { countryCode: "DK", countryName: "Denmark", flag: "🇩🇰", primaryIata: "CPH", capitalCity: "Copenhagen", currency: "DKK", power: "230V Type C/E/F/K", region: "Europe" },
  { countryCode: "BE", countryName: "Belgium", flag: "🇧🇪", primaryIata: "BRU", capitalCity: "Brussels", currency: "EUR", power: "230V Type C/E", region: "Europe" },
  { countryCode: "PL", countryName: "Poland", flag: "🇵🇱", primaryIata: "WAW", capitalCity: "Warsaw", currency: "PLN", power: "230V Type C/E", region: "Europe" },
  { countryCode: "MX", countryName: "Mexico", flag: "🇲🇽", primaryIata: "MEX", capitalCity: "Mexico City", currency: "MXN", power: "127V Type A/B", region: "Americas" },
  { countryCode: "BR", countryName: "Brazil", flag: "🇧🇷", primaryIata: "GRU", capitalCity: "São Paulo", currency: "BRL", power: "127/220V Type N", region: "Americas" },
  { countryCode: "ID", countryName: "Indonesia", flag: "🇮🇩", primaryIata: "DPS", capitalCity: "Bali / Jakarta", currency: "IDR", power: "230V Type C/F", region: "Asia" },
  { countryCode: "VN", countryName: "Vietnam", flag: "🇻🇳", primaryIata: "HAN", capitalCity: "Hanoi", currency: "VND", power: "220V Type A/C", region: "Asia" },
  { countryCode: "IS", countryName: "Iceland", flag: "🇮🇸", primaryIata: "KEF", capitalCity: "Reykjavik", currency: "ISK", power: "230V Type C/F", region: "Europe" },
  { countryCode: "NZ", countryName: "New Zealand", flag: "🇳🇿", primaryIata: "AKL", capitalCity: "Auckland", currency: "NZD", power: "230V Type I", region: "Oceania" },
];

const POPULAR_QUICK_JUMPS = [
  { iata: "PRG", city: "Prague", country: "Czechia", flag: "🇨🇿" },
  { iata: "NRT", city: "Tokyo", country: "Japan", flag: "🇯🇵" },
  { iata: "FCO", city: "Rome", country: "Italy", flag: "🇮🇹" },
  { iata: "CDG", city: "Paris", country: "France", flag: "🇫🇷" },
  { iata: "ZRH", city: "Zurich", country: "Switzerland", flag: "🇨🇭" },
  { iata: "BKK", city: "Bangkok", country: "Thailand", flag: "🇹🇭" },
  { iata: "LHR", city: "London", country: "UK", flag: "🇬🇧" },
  { iata: "JFK", city: "New York", country: "USA", flag: "🇺🇸" },
  { iata: "SIN", city: "Singapore", country: "Singapore", flag: "🇸🇬" },
  { iata: "MAD", city: "Madrid", country: "Spain", flag: "🇪🇸" },
];

type ModuleType = "culture" | "phrases" | "forex" | "packing" | "safety" | "transit";

function TravelReadinessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Selected destination state
  const initialDest = searchParams?.get("dest")?.toUpperCase() || "PRG";
  const initialType = (searchParams?.get("type")?.toLowerCase() === "country" || 
    SEARCHABLE_COUNTRIES.some(c => c.countryCode.toUpperCase() === initialDest || c.countryName.toUpperCase() === initialDest))
    ? "country"
    : "airport";

  const [selectedIata, setSelectedIata] = useState<string>(initialDest);
  const [destinationType, setDestinationType] = useState<"airport" | "country">(initialType);
  const [originIata, setOriginIata] = useState<string>("MCO");

  const [data, setData] = useState<CountryCulturalInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [packingSyncState, setPackingSyncState] = useState<"synced" | "saving" | null>("synced");

  // Module Swapper State: Packing Essentials is the first priority module
  const [activeModule, setActiveModule] = useState<ModuleType>("packing");

  // Country / Airport unified search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [apiAirports, setApiAirports] = useState<Airport[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Bottom "Explore More" Carousel auto-scroll ticker state (identical to home page)
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  // Duplicated destinations for seamless infinite marquee loop
  const displayCarouselDestinations = useMemo(
    () => [...POPULAR_CAROUSEL_DESTINATIONS, ...POPULAR_CAROUSEL_DESTINATIONS],
    []
  );

  // Forex state
  const [forexBaseCurrency, setForexBaseCurrency] = useState<string>("USD");
  const [forexData, setForexData] = useState<ForexData | null>(null);
  const [isForexLoading, setIsForexLoading] = useState(false);
  const [calcAmount, setCalcAmount] = useState<number>(100);

  // Saved trips count and header currency dropdown state for consistent navbar
  const [savedTripsCount, setSavedTripsCount] = useState<number>(0);
  const [headerCurrencyDropdownOpen, setHeaderCurrencyDropdownOpen] = useState(false);
  const headerCurrencyRef = useRef<HTMLDivElement>(null);

  // Close header currency dropdown on outside click or Escape
  useEffect(() => {
    if (!headerCurrencyDropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (headerCurrencyRef.current && !headerCurrencyRef.current.contains(event.target as Node)) {
        setHeaderCurrencyDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setHeaderCurrencyDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [headerCurrencyDropdownOpen]);

  useEffect(() => {
    fetch("/api/trips")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.trips)) setSavedTripsCount(d.trips.length);
      })
      .catch(() => {});
  }, []);

  // Global keyboard shortcuts (Cmd+K, /, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsDropdownOpen(true);
      } else if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsDropdownOpen(true);
      } else if (e.key === "Escape") {
        setIsDropdownOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync origin hub from local storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedOrigin = localStorage.getItem("venture_origin") || localStorage.getItem("venture_home_hub");
      if (storedOrigin) {
        setOriginIata(storedOrigin);
      }
    }
  }, []);

  // Sync when query param changes
  useEffect(() => {
    const qDest = (searchParams?.get("dest") || searchParams?.get("destination"))?.toUpperCase();
    const qType = searchParams?.get("type")?.toLowerCase();

    if (qDest && qDest !== selectedIata) {
      setSelectedIata(qDest);
    }

    if (qType === "country") {
      setDestinationType("country");
    } else if (qType === "airport") {
      setDestinationType("airport");
    } else if (qDest) {
      const isCountryMatch = SEARCHABLE_COUNTRIES.some(
        (c) => c.countryCode.toUpperCase() === qDest || c.countryName.toUpperCase() === qDest
      );
      if (isCountryMatch) {
        setDestinationType("country");
      }
    }

    const qOrigin = (searchParams?.get("origin") || searchParams?.get("homeAirport"))?.toUpperCase();
    if (qOrigin && qOrigin !== originIata) {
      setOriginIata(qOrigin);
    }
  }, [searchParams, selectedIata, originIata]);

  // Destination switch handler (updates URL & state cleanly)
  const handleSelectDestination = (iata: string, type: "airport" | "country" = "airport") => {
    setSelectedIata(iata);
    setDestinationType(type);
    setIsDropdownOpen(false);
    setSearchQuery("");
    if (typeof window !== "undefined") {
      localStorage.setItem("venture_destination", iata);
    }
    router.push(`/travel-readiness?dest=${encodeURIComponent(iata)}${type === "country" ? "&type=country" : ""}`, { scroll: false });
  };

  // Change origin hub
  const handleSetOrigin = (iata: string) => {
    setOriginIata(iata);
    if (typeof window !== "undefined") {
      localStorage.setItem("venture_origin", iata);
    }
  };

  // Swap origin and destination
  const handleSwapOriginDest = () => {
    const prevOrigin = originIata;
    const prevDest = selectedIata;
    setOriginIata(prevDest);
    setSelectedIata(prevOrigin);
    setDestinationType("airport");
    if (typeof window !== "undefined") {
      localStorage.setItem("venture_origin", prevDest);
      localStorage.setItem("venture_destination", prevOrigin);
    }
    router.push(`/travel-readiness?dest=${encodeURIComponent(prevOrigin)}`, { scroll: false });
  };

  // Sync packing checklist from Database and localStorage
  useEffect(() => {
    if (!selectedIata) return;
    const cacheKey = `venture_packing_${selectedIata.toUpperCase()}`;

    // Instant local cache load
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          setCheckedItems(JSON.parse(cached));
        } catch {
          // ignore
        }
      }
    }

    // Database sync
    fetch(`/api/packing-checklist?dest=${encodeURIComponent(selectedIata)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch packing checklist");
        return res.json();
      })
      .then((resJson) => {
        if (resJson.checkedItems && typeof resJson.checkedItems === "object") {
          setCheckedItems(resJson.checkedItems);
          if (typeof window !== "undefined") {
            localStorage.setItem(cacheKey, JSON.stringify(resJson.checkedItems));
          }
          setPackingSyncState("synced");
        }
      })
      .catch((err) => {
        console.warn("[travel-readiness] packing fetch error:", err);
      });
  }, [selectedIata]);

  // Carousel Auto-Scrolling: Continuous smooth requestAnimationFrame ticker (same as home page)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    const speed = 0.55; // gentle, luxurious slow glide

    const step = (time: number) => {
      const delta = Math.min(time - lastTime, 50);
      lastTime = time;

      if (!isCarouselHovered && carouselRef.current) {
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
  }, [isCarouselHovered]);

  const scrollCarouselLeft = () => {
    carouselRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  };

  const scrollCarouselRight = () => {
    carouselRef.current?.scrollBy({ left: 320, behavior: "smooth" });
  };

  // Fetch cultural dossier data (with 0ms local fallback)
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const countryKey = resolveCountryKey(selectedIata);
    if (CULTURAL_FALLBACK_DATA[countryKey]) {
      setData(CULTURAL_FALLBACK_DATA[countryKey]);
    } else {
      setData(createUniversalCountryFallback(countryKey, getCountryNameFromCode(countryKey)));
    }

    fetch(`/api/cultural-info/${encodeURIComponent(selectedIata)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((json: CountryCulturalInfo) => {
        if (isMounted) {
          setData(json);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedIata]);

  // Determine target currency
  const targetCurrency = useMemo(() => {
    if (data?.currencyInfo?.code) return data.currencyInfo.code;
    const countryKey = resolveCountryKey(selectedIata);
    switch (countryKey) {
      case "JP":
        return "JPY";
      case "CH":
        return "CHF";
      case "CZ":
        return "CZK";
      case "HU":
        return "HUF";
      case "TH":
        return "THB";
      case "GB":
        return "GBP";
      case "US":
        return "USD";
      case "CA":
        return "CAD";
      case "AU":
        return "AUD";
      default:
        return "EUR";
    }
  }, [data, selectedIata]);

  // Fetch live Forex rates (Frankfurter / ECB feed)
  useEffect(() => {
    let isMounted = true;
    setIsForexLoading(true);

    fetch(`/api/forex?from=${encodeURIComponent(forexBaseCurrency)}&to=${encodeURIComponent(targetCurrency)}`)
      .then((res) => {
        if (!res.ok) throw new Error("FX Fetch failed");
        return res.json();
      })
      .then((json: ForexData) => {
        if (isMounted) {
          setForexData(json);
          setIsForexLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsForexLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [forexBaseCurrency, targetCurrency]);

  const airportInfo = useMemo(() => {
    return FALLBACK_AIRPORTS.find((a) => a.iata.toUpperCase() === selectedIata.toUpperCase());
  }, [selectedIata]);

  const originAirportInfo = useMemo(() => {
    return FALLBACK_AIRPORTS.find((a) => a.iata.toUpperCase() === originIata.toUpperCase());
  }, [originIata]);

  const flag = getCountryFlag(data?.alpha2 || selectedIata);
  const countryName = data?.countryName || getCountryNameFromCode(data?.alpha2 || selectedIata);
  const cityName = airportInfo?.city || data?.countryName || selectedIata;

  // Debounced search for global airports from /api/airports?q=...
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setApiAirports([]);
      setIsSearchingApi(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearchingApi(true);
      fetch(`/api/airports?q=${encodeURIComponent(q)}`)
        .then((res) => (res.ok ? res.json() : { airports: [] }))
        .then((resp) => {
          if (Array.isArray(resp.airports)) {
            setApiAirports(resp.airports);
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsSearchingApi(false);
        });
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Simple Country & Airport Search Matching (matches countries and their airports)
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return { matchedCountries: [], matchedAirports: [] };
    }

    // Top matched countries
    const matchedCountries = SEARCHABLE_COUNTRIES.filter(
      (c) =>
        c.countryName.toLowerCase().includes(q) ||
        c.countryCode.toLowerCase() === q ||
        c.capitalCity.toLowerCase().includes(q) ||
        c.primaryIata.toLowerCase().includes(q)
    ).slice(0, 3);

    // Country codes associated with matched country names
    const matchedCountryCodes = new Set(
      SEARCHABLE_COUNTRIES
        .filter(
          (c) =>
            c.countryName.toLowerCase().includes(q) ||
            c.countryCode.toLowerCase() === q ||
            c.capitalCity.toLowerCase().includes(q)
        )
        .map((c) => c.countryCode.toUpperCase())
    );

    // Merge fallback airports and live api airports
    const airportMap = new Map<string, Airport>();
    FALLBACK_AIRPORTS.forEach((a) => airportMap.set(a.iata.toUpperCase(), a));
    apiAirports.forEach((a) => airportMap.set(a.iata.toUpperCase(), a));
    const allAirports = Array.from(airportMap.values());

    // Score and match airports so searching "japan" shows all airports in Japan
    const scoredAirports = allAirports
      .map((a) => {
        const iata = a.iata.toLowerCase();
        const city = (a.city || "").toLowerCase();
        const name = (a.name || "").toLowerCase();
        const countryCode = (a.country || "").toUpperCase();
        const countryFullName = getCountryNameFromCode(countryCode).toLowerCase();

        let score = 0;
        if (iata === q) {
          score += 1000;
        } else if (iata.startsWith(q)) {
          score += 700;
        } else if (city === q) {
          score += 600;
        } else if (city.startsWith(q)) {
          score += 500;
        } else if (countryFullName === q) {
          // Exact country match like "japan"
          score += 480;
        } else if (matchedCountryCodes.has(countryCode)) {
          // Country name match from SEARCHABLE_COUNTRIES
          score += 450;
        } else if (countryFullName.startsWith(q) || countryFullName.includes(q)) {
          score += 350;
        } else if (city.includes(q)) {
          score += 300;
        } else if (name.includes(q)) {
          score += 200;
        } else if (countryCode.toLowerCase() === q) {
          score += 150;
        }

        if (score > 0) {
          if (a.type === "large_airport") score += 30;
          else if (a.type === "medium_airport") score += 10;
        }

        return { airport: a, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((item) => item.airport);

    return { matchedCountries, matchedAirports: scoredAirports };
  }, [searchQuery, apiAirports]);

  // Packing items completion tracker
  const { totalItems, completedItems, packingPercentage } = useMemo(() => {
    if (!data?.essentialItems) return { totalItems: 0, completedItems: 0, packingPercentage: 0 };
    let total = 0;
    let completed = 0;
    data.essentialItems.forEach((group) => {
      group.items.forEach((item) => {
        total++;
        if (checkedItems[item]) completed++;
      });
    });
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { totalItems: total, completedItems: completed, packingPercentage: percentage };
  }, [data, checkedItems]);

  const toggleItem = (itemKey: string) => {
    const nextState = {
      ...checkedItems,
      [itemKey]: !checkedItems[itemKey],
    };
    setCheckedItems(nextState);
    setPackingSyncState("saving");

    const cacheKey = `venture_packing_${selectedIata.toUpperCase()}`;
    if (typeof window !== "undefined") {
      localStorage.setItem(cacheKey, JSON.stringify(nextState));
    }

    // Save checklist state to SQLite database & JSON backup
    fetch("/api/packing-checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destination: selectedIata,
        checkedItems: nextState,
      }),
    })
      .then((res) => {
        if (res.ok) {
          setPackingSyncState("synced");
        }
      })
      .catch((err) => {
        console.warn("[travel-readiness] failed to save packing to DB:", err);
        setPackingSyncState(null);
      });
  };

  const handleSearchCorridorsToDest = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("venture_destination", selectedIata);
      localStorage.setItem("venture_home_hub", originIata);
      localStorage.setItem("venture_origin", originIata);
    }
    router.push(`/?destination=${encodeURIComponent(selectedIata)}&homeAirport=${encodeURIComponent(originIata)}`);
  };

  // Module configuration for top swapper — Packing Essentials is 1st!
  const MODULE_TABS = [
    {
      id: "packing" as ModuleType,
      label: "Packing Essentials",
      icon: Luggage,
    },
    {
      id: "culture" as ModuleType,
      label: "Customs & Taboos",
      icon: Sparkles,
    },
    {
      id: "phrases" as ModuleType,
      label: "Pocket Phrasebook",
      icon: BookOpen,
    },
    {
      id: "forex" as ModuleType,
      label: "Live Forex & Cash",
      icon: Coins,
    },
    {
      id: "safety" as ModuleType,
      label: "Safety & Scams",
      icon: ShieldAlert,
    },
    {
      id: "transit" as ModuleType,
      label: "Transit & Power",
      icon: Zap,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917] flex flex-col font-sans selection:bg-[#B45309]/15 selection:text-[#1C1917]">
      {/* Top Navigation Bar: Brand on left, Navigation cluster on right (consistent with endpoint /) */}
      <header className="shrink-0 border-b border-[#E8E2D5] bg-[#FAF7F2]/90 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Top Left: Brand → home */}
          <Link
            href="/"
            className="select-none group cursor-pointer"
          >
            <span className="text-2xl font-serif font-bold tracking-tight text-[#1C1917] group-hover:text-[#B45309] transition-colors">
              Venture
            </span>
          </Link>

          {/* Top Right: Navigation Links + Currency Selector */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Travel Readiness (Active on this screen — not clickable) */}
            <div
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#1C1917] text-[#FAF7F2] border border-[#1C1917] shadow-xs select-none"
              aria-current="page"
              title="You are on Travel Readiness"
            >
              <Luggage className="h-3.5 w-3.5 text-[#D97706]" />
              <span>Travel Readiness</span>
            </div>

            <Link
              href="/trips"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#FFFFFF] hover:bg-[#FAF7F2] text-[#78716C] hover:text-[#1C1917] border border-[#E8E2D5] hover:border-[#B45309]/50 transition-all shadow-xs cursor-pointer group"
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
            <div ref={headerCurrencyRef} className="relative">
              <button
                type="button"
                onClick={() => setHeaderCurrencyDropdownOpen(!headerCurrencyDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FFFFFF] hover:bg-[#FAF7F2] text-[#1C1917] border border-[#E8E2D5] hover:border-[#B45309]/50 transition-all shadow-xs cursor-pointer"
                title="Change Currency"
              >
                <span className="font-mono font-bold text-[#B45309]">
                  {forexBaseCurrency === "USD" ? "$" : forexBaseCurrency === "EUR" ? "€" : "£"}
                </span>
                <span>{forexBaseCurrency}</span>
                <ChevronDown className="h-3.5 w-3.5 text-[#78716C]" />
              </button>

              {headerCurrencyDropdownOpen && (
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
                        setForexBaseCurrency(item.code);
                        setHeaderCurrencyDropdownOpen(false);
                        if (typeof window !== "undefined") {
                          localStorage.setItem("venture_currency", item.code);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF7F2] transition-colors cursor-pointer ${
                        forexBaseCurrency === item.code ? "text-[#1C1917] font-bold bg-[#FAF7F2]" : "text-[#78716C]"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#B45309]">{item.symbol}</span>
                        <span>{item.code}</span>
                      </span>
                      {forexBaseCurrency === item.code && <Check className="h-3.5 w-3.5 text-[#B45309]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container with Smooth Page Entrance Animation */}
      <motion.main
        initial={{ opacity: 0, y: 55 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 pt-6 pb-20 space-y-7"
      >
        
        {/* Selected Destination Hero Banner (Shifted to top) */}
        <section className="relative rounded-3xl overflow-hidden border border-[#292524] shadow-xl bg-[#1C1917] text-[#FAF7F2]">
          <div className="relative z-10 p-5 sm:p-6 lg:p-7">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              <div className="lg:col-span-8 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl filter drop-shadow-md">{flag}</span>
                </div>

                {destinationType === "country" ? (
                  <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-white">
                    {countryName}
                  </h1>
                ) : (
                  <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-white">
                    {cityName}, <span className="font-normal text-white/80">{countryName}</span>
                  </h1>
                )}

                <p className="text-xs sm:text-sm text-[#D6CEBF] max-w-2xl leading-relaxed">
                  Curated travel essentials for{" "}
                  <strong className="text-white font-semibold">
                    {destinationType === "country" ? countryName : cityName}
                  </strong>
                  . Explore packing checklists, cultural etiquette, live currency exchange, and transit tips below.
                </p>
              </div>

              {/* Action Button & Route Context */}
              <div className="lg:col-span-4 bg-white/5 border border-white/15 rounded-2xl p-4 backdrop-blur-md space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#A8A29E]">
                  <span>Flight Corridor</span>
                  <span className="text-white font-mono font-bold">{originIata} ➔ {selectedIata}</span>
                </div>

                <button
                  type="button"
                  onClick={handleSearchCorridorsToDest}
                  className="w-full py-2 px-3.5 rounded-xl bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <Compass className="h-3.5 w-3.5 transition-transform group-hover:rotate-45" />
                  <span>Search Flights</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                </button>

                <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs text-left">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#A8A29E]">Currency</div>
                    <div className="text-white font-semibold truncate text-[11px]">
                      {targetCurrency} ({data?.currencyInfo?.name?.split(" ")[0] || "Local"})
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#A8A29E]">Charging Port</div>
                    <div className="text-white font-semibold truncate text-[11px]">
                      {resolveCountryKey(selectedIata) === "CH"
                        ? "Type J / Europlug (230V)"
                        : resolveCountryKey(selectedIata) === "JP"
                        ? "Type A/B (100V)"
                        : resolveCountryKey(selectedIata) === "GB"
                        ? "Type G 3-Pin (230V)"
                        : resolveCountryKey(selectedIata) === "US"
                        ? "Type A/B (120V)"
                        : "Europlug (Type C/E, 230V)"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Bar Section (Positioned between Hero Banner and Travel Information Navigation) */}
        <section ref={searchContainerRef} className="relative z-30">
          <div className="relative w-full">
            <div className="flex items-center gap-3 bg-[#FFFFFF] border border-[#E8E2D5] focus-within:border-[#B45309] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#B45309]/15 rounded-2xl px-4 py-3 sm:py-3.5 transition-all shadow-xs">
              <Search className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-[#B45309] shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) setIsDropdownOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (searchResults.matchedCountries.length > 0) {
                      const c = searchResults.matchedCountries[0];
                      handleSelectDestination(c.primaryIata, "country");
                    } else if (searchResults.matchedAirports.length > 0) {
                      const a = searchResults.matchedAirports[0];
                      handleSelectDestination(a.iata, "airport");
                    }
                  }
                }}
                placeholder="Search country (e.g. Japan, Italy) or airport (e.g. PRG, NRT, JFK)..."
                className="w-full bg-transparent text-xs sm:text-sm md:text-base font-medium text-[#1C1917] outline-none placeholder:text-[#A8A29E]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setIsDropdownOpen(false);
                  }}
                  className="text-[#78716C] hover:text-[#1C1917] p-1 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Dropdown Results */}
            {isDropdownOpen && searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#FFFFFF] border border-[#E8E2D5] rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="max-h-[300px] overflow-y-auto divide-y divide-[#F2ECE1] custom-scrollbar pr-0.5">
                  {/* Countries */}
                  {searchResults.matchedCountries.length > 0 && (
                    <div className="p-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] px-3 py-1.5 flex items-center gap-1.5">
                        <Globe className="h-3 w-3 text-[#B45309]" />
                        <span>Countries ({searchResults.matchedCountries.length})</span>
                      </div>
                      <div className="space-y-0.5">
                        {searchResults.matchedCountries.map((c) => (
                          <button
                            key={c.countryCode}
                            type="button"
                            onClick={() => handleSelectDestination(c.primaryIata, "country")}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF7F2] flex items-center justify-between transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-lg shrink-0">{c.flag}</span>
                              <div className="truncate">
                                <div className="text-xs sm:text-sm font-bold text-[#1C1917] group-hover:text-[#B45309] truncate">
                                  {c.countryName}
                                </div>
                                <div className="text-[11px] text-[#78716C] truncate">
                                  Gateway: {c.capitalCity} ({c.primaryIata})
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[#2D5A46] bg-[#E8F0EC] px-2 py-0.5 rounded shrink-0">
                              Country
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Airports */}
                  {searchResults.matchedAirports.length > 0 && (
                    <div className="p-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] px-3 py-1.5 flex items-center gap-1.5">
                        <Plane className="h-3 w-3 text-[#2D5A46]" />
                        <span>Airports ({searchResults.matchedAirports.length})</span>
                      </div>
                      <div className="space-y-0.5">
                        {searchResults.matchedAirports.map((a) => (
                          <button
                            key={a.iata}
                            type="button"
                            onClick={() => handleSelectDestination(a.iata, "airport")}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF7F2] flex items-center justify-between transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-lg shrink-0">{getCountryFlag(a.country)}</span>
                              <div className="truncate">
                                <div className="text-xs sm:text-sm font-semibold text-[#1C1917] group-hover:text-[#B45309] truncate">
                                  {a.city}, {getCountryNameFromCode(a.country)}
                                </div>
                                <div className="text-[11px] text-[#78716C] truncate max-w-[280px] sm:max-w-[400px]">
                                  {a.name}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[#1C1917] bg-black/5 px-2 py-0.5 rounded shrink-0">
                              {a.iata}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty */}
                  {searchResults.matchedCountries.length === 0 && searchResults.matchedAirports.length === 0 && (
                    <div className="p-5 text-center text-xs sm:text-sm text-[#78716C]">
                      No results found for &ldquo;{searchQuery}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION: Interactive Module Swapper (Navigation of Travel Information - full row & larger) */}
        <section className="sticky top-16 z-20 bg-[#FAF7F2]/95 backdrop-blur-md py-2.5 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 w-full">
            {MODULE_TABS.map((tab) => {
              const isActive = activeModule === tab.id;
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveModule(tab.id)}
                  className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                    isActive
                      ? "bg-[#1C1917] text-[#FAF7F2] shadow-md font-bold"
                      : "bg-[#FFFFFF] text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF7F2] border border-[#E8E2D5]"
                  }`}
                >
                  <IconComp className={`h-4 w-4 shrink-0 ${isActive ? "text-[#D97706]" : "text-[#78716C]"}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ACTIVE MODULE CONTAINER (Swapped on demand — NO deep vertical scroll!) */}
        <div className="min-h-[460px]">
          <AnimatePresence mode="wait">
            {/* MODULE 1: Customs & Taboos */}
            {activeModule === "culture" && (
              <motion.div
                key="culture"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Cultural Taboos Warning Card (Guaranteed bold title & description) */}
                <div className="bg-[#FFF8F5] border border-[#F5D0C5] rounded-2xl p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-[#B45309] mb-1">
                    <AlertTriangle className="h-4.5 w-4.5 text-[#B45309]" />
                    <span>Crucial Cultural Taboos to Avoid in {countryName}</span>
                  </div>
                  <p className="text-xs text-stone-600 mb-3.5">
                    Respecting these local cultural red lines guarantees smooth interactions with locals, transit staff, and temple caretakers.
                  </p>

                  {data?.culturalTaboos && data.culturalTaboos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
                      {data.culturalTaboos.map((taboo, idx) => {
                        const title =
                          typeof taboo === "string"
                            ? taboo
                            : taboo.title || (taboo as any).taboo || (taboo as any).name || (taboo as any).rule || "Cultural Taboo";
                        const desc =
                          typeof taboo === "string"
                            ? ""
                            : taboo.description || (taboo as any).details || (taboo as any).desc || (taboo as any).explanation || "";

                        return (
                          <div
                            key={idx}
                            className="bg-[#FFFFFF] p-3.5 sm:p-4 rounded-xl border border-[#F5D0C5] text-xs shadow-xs flex flex-col justify-between"
                          >
                            <div>
                              <div className="font-bold text-[#B45309] text-xs sm:text-sm mb-1 flex items-start gap-1.5">
                                <span className="text-[#B45309] font-mono text-xs">⚠️</span>
                                <span>{title}</span>
                              </div>
                              {desc ? (
                                <p className="text-stone-700 leading-relaxed text-xs">{desc}</p>
                              ) : (
                                <p className="text-stone-500 italic text-xs leading-relaxed">
                                  Strictly observe local etiquette and avoid this behavior in public and sacred spaces.
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-stone-600 p-3.5 bg-white rounded-xl border border-[#F5D0C5]">
                      No severe unique taboos flagged. Maintain standard polite international conduct.
                    </div>
                  )}
                </div>

                {/* Social Customs & Behavioral Protocols */}
                {data?.localCustoms && data.localCustoms.length > 0 && (
                  <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-2xl p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-4 w-4 text-[#2D5A46]" />
                      <h3 className="text-sm sm:text-base font-bold text-[#1C1917]">
                        Social Customs & Behavioral Protocols
                      </h3>
                    </div>
                    <p className="text-xs text-[#78716C] mb-3.5">
                      Everyday manners and expected gestures across hospitality, dining, and public transit.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
                      {data.localCustoms.map((custom, idx) => {
                        const title =
                          typeof custom === "string"
                            ? custom
                            : custom.title || (custom as any).name || "Local Custom";
                        const desc =
                          typeof custom === "string"
                            ? ""
                            : custom.description || (custom as any).details || (custom as any).desc || "";

                        return (
                          <div
                            key={idx}
                            className="bg-[#FAF7F2] p-3.5 sm:p-4 rounded-xl border border-[#E8E2D5] text-xs flex flex-col justify-between"
                          >
                            <div>
                              <div className="font-bold text-[#1C1917] text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#2D5A46] shrink-0" />
                                <span>{title}</span>
                              </div>
                              <p className="text-[#78716C] leading-relaxed text-xs">{desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* MODULE 2: Pocket Phrasebook */}
            {activeModule === "phrases" && (
              <motion.div
                key="phrases"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F3EFE6] gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[#B45309]" />
                      <h3 className="text-sm sm:text-base font-bold text-[#1C1917]">
                        Pocket Phrasebook & Conversational Phonetics
                      </h3>
                    </div>
                    <p className="text-xs text-[#78716C] mt-0.5">
                      Essential everyday phrases in <strong>{countryName}</strong> formatted with English meaning, phonetic pronunciation, and native script.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#78716C] bg-[#FAF7F2] px-2.5 py-0.5 rounded-full border border-[#E8E2D5] self-start sm:self-auto">
                    {data?.usefulPhrases?.length || 0} Key Phrases
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5 pt-1">
                  {data?.usefulPhrases && data.usefulPhrases.length > 0 ? (
                    data.usefulPhrases.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 sm:p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#B45309]/40 transition-all flex flex-col justify-between"
                      >
                        {/* Top: English Meaning / Translation */}
                        <div className="pb-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#78716C] block">
                            Translation / Meaning
                          </span>
                          <div className="text-xs sm:text-sm font-bold text-[#1C1917] mt-0.5">
                            {item.phrase}
                          </div>
                        </div>

                        {/* Middle: Phonetic Pronunciation Guide */}
                        <div className="py-2 my-1 border-t border-b border-[#E8E2D5]/70">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#A8A29E] block">
                            Pronunciation Guide
                          </span>
                          <div className="text-xs font-mono font-semibold text-[#B45309] mt-0.5">
                            {item.phonetic ? `/${item.phonetic}/` : "—"}
                          </div>
                        </div>

                        {/* Bottom: Native Local Script (End of Phrase) */}
                        <div className="pt-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#78716C] block">
                            Local Script
                          </span>
                          <div className="text-sm sm:text-base font-medium text-[#1C1917] mt-0.5 font-sans">
                            {item.translation || item.phrase}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-6 text-xs text-[#78716C]">
                      Basic international English is widely understood in metropolitan areas.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* MODULE 3: Live Forex & Cash */}
            {activeModule === "forex" && (
              <motion.div
                key="forex"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#F3EFE6]">
                  <div>
                    <div className="flex items-center gap-2">
                      <Coins className="h-4.5 w-4.5 text-[#D97706]" />
                      <h3 className="text-sm sm:text-base font-bold text-[#1C1917]">
                        Live Currency Exchange Rates & Cash Intelligence
                      </h3>
                    </div>
                    <p className="text-xs text-[#78716C] mt-0.5">
                      Official live market rates sourced via European Central Bank & Interbank data feeds. Displays actual traveler Buy and Sell rates.
                    </p>
                  </div>

                  {/* Currency Pair Switcher */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#78716C]">Base:</span>
                    {["USD", "EUR", "GBP"].map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setForexBaseCurrency(curr)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          forexBaseCurrency === curr
                            ? "bg-[#1C1917] text-[#FAF7F2] shadow-xs"
                            : "bg-[#FAF7F2] text-[#78716C] hover:text-[#1C1917] border border-[#E8E2D5]"
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Exchange Rate Cards: Mid Rate, Buy Rate, Sell Rate */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-3.5">
                  {/* Mid-Market Rate Card */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] relative overflow-hidden">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#78716C] mb-1 flex items-center justify-between">
                      <span>Interbank Mid Rate</span>
                      <span className="text-[9px] bg-white px-1.5 py-0.5 rounded-full border border-[#E8E2D5] font-mono text-[#2D5A46] font-bold">
                        Official
                      </span>
                    </div>
                    <div className="font-serif text-xl sm:text-2xl font-bold text-[#1C1917] my-0.5">
                      1 {forexBaseCurrency} = {forexData?.midRate ?? "—"} {targetCurrency}
                    </div>
                    <p className="text-[11px] text-[#78716C]">
                      Zero-spread institutional benchmark rate. Source: {forexData?.source || "European Central Bank"}.
                    </p>
                  </div>

                  {/* Traveler Buy Rate Card */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#E8F0EC]/60 border border-[#D1E4D8] relative overflow-hidden">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#2D5A46] mb-1 flex items-center justify-between">
                      <span>Traveler Buy Rate</span>
                      <span className="text-[9px] bg-[#2D5A46] text-white px-1.5 py-0.5 rounded-full font-bold">
                        ATM / Cash
                      </span>
                    </div>
                    <div className="font-serif text-xl sm:text-2xl font-bold text-[#1C1917] my-0.5">
                      {forexData?.buyRate ?? "—"} {targetCurrency}
                    </div>
                    <p className="text-[11px] text-stone-600">
                      Rate received converting {forexBaseCurrency} to {targetCurrency} at bank/ATM (~1.5% spread).
                    </p>
                  </div>

                  {/* Traveler Sell Rate Card */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#FFF8F5] border border-[#F5D0C5] relative overflow-hidden">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#B45309] mb-1 flex items-center justify-between">
                      <span>Traveler Sell Rate</span>
                      <span className="text-[9px] bg-[#B45309] text-white px-1.5 py-0.5 rounded-full font-bold">
                        Leftover FX
                      </span>
                    </div>
                    <div className="font-serif text-xl sm:text-2xl font-bold text-[#1C1917] my-0.5">
                      {forexData?.sellRate ?? "—"} {targetCurrency}
                    </div>
                    <p className="text-[11px] text-stone-600">
                      Rate converting leftover {targetCurrency} cash back into {forexBaseCurrency}.
                    </p>
                  </div>
                </div>

                {/* Interactive Currency Converter & Practical Guidance */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 pt-1">
                  <div className="lg:col-span-6 bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E2D5] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1C1917] flex items-center gap-1.5">
                        <ArrowRightLeft className="h-3.5 w-3.5 text-[#B45309]" />
                        Interactive Traveler Calculator
                      </span>
                      <span className="text-[10px] text-[#78716C]">Live conversion</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-[#78716C] block mb-1">
                          Amount in {forexBaseCurrency}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-bold text-[#78716C]">
                            {forexData?.fromMeta?.symbol || "$"}
                          </span>
                          <input
                            type="number"
                            min="1"
                            value={calcAmount}
                            onChange={(e) => setCalcAmount(Math.max(1, Number(e.target.value) || 0))}
                            className="w-full pl-7 pr-3 py-1.5 bg-white border border-[#E8E2D5] rounded-lg text-sm font-bold text-[#1C1917] outline-none focus:border-[#B45309]"
                          />
                        </div>
                      </div>

                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-[#78716C] block mb-1">
                          Received in {targetCurrency}
                        </label>
                        <div className="py-1.5 px-3 bg-white border border-[#E8E2D5] rounded-lg text-sm font-bold text-[#2D5A46]">
                          {forexData?.buyRate ? (calcAmount * forexData.buyRate).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"} {targetCurrency}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#78716C] flex items-center justify-between pt-0.5">
                      <span>Inverse rate:</span>
                      <span className="font-mono font-semibold text-[#1C1917]">
                        1 {targetCurrency} ≈ {forexData?.inverseRate ?? "—"} {forexBaseCurrency}
                      </span>
                    </div>
                  </div>

                  {/* Right: Cash vs Card Practical Traveler Guidance */}
                  <div className="lg:col-span-6 bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E2D5] space-y-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1C1917] flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-[#2D5A46]" />
                      Local Payment Protocols for {countryName}
                    </span>

                    <div className="text-xs space-y-2 text-[#78716C] leading-relaxed">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-[#1C1917] shrink-0">• Cards vs Cash:</span>
                        <span>
                          {data?.currencyInfo?.tips
                            ? data.currencyInfo.tips.split("\n")[0]?.replace(/^•\s*/, "")
                            : "Contactless cards widely accepted in hotels, stores, and transit hubs."}
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="font-bold text-[#1C1917] shrink-0">• ATM Access:</span>
                        <span>
                          Use bank-operated ATMs or 7-Eleven / postal ATMs for the lowest foreign transaction fees. Avoid standalone tourist exchange booths.
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="font-bold text-[#1C1917] shrink-0">• Tipping:</span>
                        <span>
                          {data?.currencyInfo?.tips && data.currencyInfo.tips.includes("tipping")
                            ? "Strictly no tipping or discretionary tipping only where customary."
                            : "Service charges are generally included in dining checks. Small round-ups are optional."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* MODULE 4: Packing Essentials */}
            {activeModule === "packing" && (
              <motion.div
                key="packing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#F3EFE6] gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Luggage className="h-4 w-4 text-[#B45309]" />
                      <h3 className="text-base font-bold text-[#1C1917]">
                        Curated Packing Essentials Checklist
                      </h3>
                    </div>
                    <p className="text-xs text-[#78716C] mt-0.5">
                      Tailored specifically for climate and infrastructure in <strong>{countryName}</strong>.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#2D5A46]">
                      {completedItems} of {totalItems} packed ({packingPercentage}%)
                    </span>
                    <div className="w-20 sm:w-24 h-2 bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E8E2D5]">
                      <div
                        className="h-full bg-gradient-to-r from-[#2D5A46] to-[#D97706] transition-all duration-300"
                        style={{ width: `${packingPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Horizontally Scrollable Checklist Rail (One line like My Trips) */}
                <div className="flex overflow-x-auto pb-4 pt-1 gap-4 scrollbar-thin scroll-smooth snap-x snap-mandatory">
                  {data?.essentialItems && data.essentialItems.length > 0 ? (
                    data.essentialItems.map((group, gIdx) => (
                      <div
                        key={gIdx}
                        className="min-w-[280px] sm:min-w-[320px] max-w-[340px] shrink-0 snap-start bg-[#FAF7F2] border border-[#E8E2D5] rounded-2xl p-4 sm:p-4.5 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#E8E2D5]">
                            <div className="text-xs font-bold uppercase tracking-wider text-[#1C1917]">
                              {group.title}
                            </div>
                            <span className="text-[10px] font-semibold text-[#78716C]">
                              {group.items.length} items
                            </span>
                          </div>

                          <div className="space-y-2">
                            {group.items.map((item, iIdx) => {
                              const isChecked = !!checkedItems[item];
                              return (
                                <div
                                  key={iIdx}
                                  onClick={() => toggleItem(item)}
                                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 text-xs ${
                                    isChecked
                                      ? "bg-[#E8F0EC]/80 border-[#A3C8B3] text-stone-600 line-through"
                                      : "bg-[#FFFFFF] border-[#E8E2D5] text-[#1C1917] hover:border-[#B45309]/50 hover:shadow-2xs"
                                  }`}
                                >
                                  <span
                                    className={`mt-0.5 h-4 w-4 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                                      isChecked
                                        ? "bg-[#2D5A46] border-[#2D5A46] text-white"
                                        : "bg-[#FAF7F2] border-[#D6CEBF]"
                                    }`}
                                  >
                                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                                  </span>
                                  <span className="leading-relaxed break-words flex-1 select-none">{item}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-6 text-xs text-[#78716C]">
                      Standard international packing checklist recommended.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* MODULE 5: Safety Advisories & Transit Scams */}
            {activeModule === "safety" && (
              <motion.div
                key="safety"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-3xl p-6 sm:p-7 shadow-xs space-y-4"
              >
                <div className="pb-3 border-b border-[#F3EFE6]">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-[#B45309]" />
                    <h3 className="text-base font-bold text-[#1C1917]">
                      Safety Advisories & Transit Scams
                    </h3>
                  </div>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    Proactive intelligence compiled from embassy advisories and frequent explorer field logs.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  {((data?.safetyTips && data.safetyTips.length > 0) || (data?.commonScams && data.commonScams.length > 0)) ? (
                    [...(data?.safetyTips || []), ...(data?.commonScams || [])].map((warn, idx) => (
                      <div key={idx} className="bg-[#FAF7F2] p-4 sm:p-5 rounded-2xl border border-[#E8E2D5] text-xs">
                        <div className="font-bold text-[#1C1917] text-sm mb-1.5 flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 text-[#D97706] shrink-0" />
                          <span>{warn.title}</span>
                        </div>
                        <p className="text-[#78716C] leading-relaxed">{warn.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-xs text-[#78716C] p-4 bg-[#FAF7F2] rounded-2xl">
                      General safety level: High. Observe standard personal awareness around crowded transit terminals.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* MODULE 6: Logistics, Power Grid & Transit */}
            {activeModule === "transit" && (
              <motion.div
                key="transit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-5"
              >
                {/* Charging Ports & Plugs */}
                <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 pb-3 border-b border-[#F3EFE6]">
                    <Zap className="h-4 w-4 text-[#B45309]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1917]">
                      Charging Ports & Plugs
                    </h4>
                  </div>
                  <div className="text-xs space-y-3 text-[#1C1917]">
                    <div>
                      <div className="text-[10px] font-bold text-[#78716C] uppercase">Voltage</div>
                      <div className="font-bold text-sm">
                        {resolveCountryKey(selectedIata) === "US"
                          ? "120V / 60Hz"
                          : resolveCountryKey(selectedIata) === "JP"
                          ? "100V / 50-60Hz"
                          : "230V / 50Hz"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#78716C] uppercase">Charging Ports & Plugs</div>
                      <div className="font-semibold text-xs">
                        {resolveCountryKey(selectedIata) === "CH"
                          ? "Type J & Type C (Europlug)"
                          : resolveCountryKey(selectedIata) === "JP"
                          ? "Type A (2-pin flat ungrounded)"
                          : resolveCountryKey(selectedIata) === "GB"
                          ? "Type G (3-pin rectangular)"
                          : "Type C, E & F (Standard European)"}
                      </div>
                    </div>
                    <p className="text-[11px] text-[#78716C] leading-relaxed">
                      Laptops and modern USB-C smartphone chargers are universal dual-voltage (100–240V). Pack a compact pin adapter.
                    </p>
                  </div>
                </div>

                {/* Emergency Contacts */}
                <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 pb-3 border-b border-[#F3EFE6]">
                    <PhoneCall className="h-4 w-4 text-[#2D5A46]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1917]">
                      Emergency Dispatch
                    </h4>
                  </div>
                  <div className="text-xs space-y-3 text-[#1C1917]">
                    <div>
                      <div className="text-[10px] font-bold text-[#78716C] uppercase">Police</div>
                      <div className="font-mono font-bold text-base text-[#B45309]">
                        {data?.emergencyInfo?.police || "112"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#78716C] uppercase">Ambulance & Fire</div>
                      <div className="font-mono font-bold text-base text-[#2D5A46]">
                        {data?.emergencyInfo?.ambulance || "112"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#78716C] uppercase">Consular Embassy</div>
                      <div className="text-[11px] text-[#78716C] truncate">
                        {data?.emergencyInfo?.embassy || "Contact home country consulate in capital city."}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Airport Transit Connections */}
                <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 pb-3 border-b border-[#F3EFE6]">
                    <Train className="h-4 w-4 text-[#D97706]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1917]">
                      Airport Ground Express
                    </h4>
                  </div>
                  <div className="text-xs space-y-3 text-[#1C1917]">
                    <div>
                      <div className="text-[10px] font-bold text-[#78716C] uppercase">Terminal Rail Link</div>
                      <div className="font-semibold">
                        {resolveCountryKey(selectedIata) === "CH"
                          ? "Direct SBB trains beneath Zurich Terminal"
                          : resolveCountryKey(selectedIata) === "JP"
                          ? "Narita Express (N'EX) & Keisei Skyliner"
                          : resolveCountryKey(selectedIata) === "IT"
                          ? "Leonardo Express from FCO to Roma Termini"
                          : resolveCountryKey(selectedIata) === "FR"
                          ? "RER B line direct from CDG to Paris Châtelet"
                          : "Airport Express Railway & Metro Connection"}
                      </div>
                    </div>
                    <p className="text-[11px] text-[#78716C] leading-relaxed">
                      Avoid unregulated taxi solicitation in terminal arrivals. Follow official Ground Transportation and Rail signage.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION: Explore More Destinations Carousel (Seamless Smooth Auto-Cycling Wheel like home page) */}
        <section className="pt-8 border-t border-[#E8E2D5] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-[#B45309]" />
                <h3 className="text-sm sm:text-base font-bold text-[#1C1917]">
                  Popular Travel Destinations
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#B45309]/10 text-[#B45309] px-2 py-0.5 rounded-full border border-[#B45309]/20">
                  Explore More
                </span>
              </div>
              <p className="text-xs text-[#78716C] mt-0.5">
                Explore curated world destinations with cultural guides and travel readiness.
              </p>
            </div>
          </div>

          {/* Seamless Scrolling Wheel / Carousel Container */}
          <div className="relative">
            <div
              ref={carouselRef}
              onMouseEnter={() => setIsCarouselHovered(true)}
              onMouseLeave={() => setIsCarouselHovered(false)}
              className="flex items-stretch gap-4 overflow-x-auto no-scrollbar py-3 px-1"
            >
              {displayCarouselDestinations.map((card, idx) => {
                const isCurrent = selectedIata === card.iata;
                return (
                  <div
                    key={`${card.iata}-${idx}`}
                    onClick={() => handleSelectDestination(card.iata)}
                    className={`w-[270px] sm:w-[290px] shrink-0 rounded-2xl overflow-hidden transition-all duration-300 group cursor-pointer flex flex-col border shadow-xs hover:shadow-lg hover:-translate-y-1 ${
                      isCurrent
                        ? "border-[#B45309] ring-2 ring-[#B45309]/30 bg-[#FFFFFF]"
                        : "border-[#E8E2D5] bg-[#FFFFFF] hover:border-[#B45309]/50"
                    }`}
                  >
                    {/* Visual Destination Cover Image */}
                    <div className="relative h-36 w-full overflow-hidden bg-[#F3EFE6]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={card.image}
                        alt={card.city}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                      {/* Top Badges Row */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[#FAF7F2] border border-white/20">
                          {card.tag}
                        </span>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white/95 text-[#1C1917] shadow-xs">
                          {card.iata}
                        </span>
                      </div>

                      {/* Bottom City & Flag */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                        <div className="flex items-center gap-1.5 text-base font-serif font-bold">
                          <span>{card.flag}</span>
                          <span>{card.city}</span>
                          <span className="text-xs font-sans font-light text-white/80">· {card.country}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-3.5 flex flex-col justify-between flex-1">
                      <p className="text-[11px] text-[#78716C] leading-snug line-clamp-2">
                        {card.desc}
                      </p>
                      <div className="mt-3 pt-2 border-t border-[#F3EFE6] flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-[#1C1917]">
                          Currency: <span className="text-[#B45309] font-mono">{card.currency}</span>
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            isCurrent ? "text-[#2D5A46]" : "text-[#78716C] group-hover:text-[#B45309]"
                          }`}
                        >
                          {isCurrent ? "Selected Destination ✓" : "View Readiness →"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </motion.main>
    </div>
  );
}

export default function TravelReadinessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
          <span className="h-8 w-8 border-3 border-[#B45309]/30 border-t-[#B45309] rounded-full animate-spin" />
        </div>
      }
    >
      <TravelReadinessContent />
    </Suspense>
  );
}
