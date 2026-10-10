"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, PlaneTakeoff, X, Check, Building2 } from "lucide-react";
import type { Airport } from "@/types";
import { FALLBACK_AIRPORTS, searchAirportsClient } from "@/lib/airport-data";

interface AirportComboboxProps {
  label: string;
  sublabel?: string;
  value: string; // IATA code
  onChange: (iata: string, airport?: Airport) => void;
  type?: "origin" | "destination";
  popularSuggestions?: Array<{ iata: string; label: string }>;
  placeholder?: string;
}

export function AirportCombobox({
  label,
  sublabel,
  value,
  onChange,
  type = "origin",
  popularSuggestions = [],
  placeholder = "Search city, airport or code...",
}: AirportComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Airport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Find currently selected airport details
  const selectedAirport = FALLBACK_AIRPORTS.find(
    (a) => a.iata.toUpperCase() === value.toUpperCase()
  );

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Initial and query search
  useEffect(() => {
    if (!isOpen) return;

    // Instant client-side search first
    const clientMatches = searchAirportsClient(query, 12);
    setResults(clientMatches);

    // If query is longer, query server API for full 3,244 airports
    if (query.trim().length >= 2) {
      setIsLoading(true);
      const controller = new AbortController();
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/airports?q=${encodeURIComponent(query)}`, {
            signal: controller.signal,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.airports && Array.isArray(data.airports) && data.airports.length > 0) {
              setResults(data.airports);
            }
          }
        } catch {
          // ignore aborted/network error
        } finally {
          setIsLoading(false);
        }
      }, 150);

      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    } else {
      setIsLoading(false);
    }
  }, [query, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setQuery("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleSelect = (airport: Airport) => {
    onChange(airport.iata, airport);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className="relative flex-1 min-w-[200px]">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={`w-full text-left transition-all duration-150 rounded-2xl px-4 py-3 border flex items-center gap-3 group ${
          isOpen
            ? "border-[#B45309] ring-2 ring-[#B45309]/15 bg-[#FFFFFF] shadow-sm"
            : "border-[#E8E2D5] bg-[#FAF7F2] hover:bg-[#FFFFFF] hover:border-[#B45309]"
        }`}
      >
        <div className="flex items-center justify-center text-[#78716C] flex-shrink-0">
          {type === "origin" ? (
            <div className="h-4 w-4 rounded-full border-2 border-[#2D5A46] group-hover:scale-105 transition-all" />
          ) : (
            <MapPin className="h-4 w-4 text-[#B45309] group-hover:scale-105 transition-all" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 truncate">
            <span className="text-sm font-bold text-[#1C1917] truncate font-sans">
              {selectedAirport?.city || value}
            </span>
            <span className="text-[11px] font-mono text-[#B45309] font-bold">
              {value}
            </span>
          </div>
          <div className="text-[11px] text-[#78716C] truncate font-normal">
            {selectedAirport?.name || (type === "origin" ? "Select departure hub" : "Where to?")}
          </div>
        </div>
      </button>

      {/* Dropdown Popup */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 left-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-[#E8E2D5] bg-[#FFFFFF] shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Search Input */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#78716C]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm bg-[#FAF7F2] focus:bg-[#FFFFFF] outline-none border border-[#E8E2D5] focus:border-[#B45309] text-[#1C1917] placeholder:text-[#78716C] transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick popular chips */}
          {popularSuggestions.length > 0 && !query && (
            <div className="mb-2 pb-2 border-b border-[#E8E2D5]">
              <div className="text-[11px] font-semibold text-[#78716C] mb-1.5 px-1">
                Popular {type === "origin" ? "Bases" : "Destinations"}:
              </div>
              <div className="flex flex-wrap gap-1">
                {popularSuggestions.map((item) => (
                  <button
                    key={item.iata}
                    type="button"
                    onClick={() => {
                      const match = FALLBACK_AIRPORTS.find((a) => a.iata === item.iata);
                      if (match) handleSelect(match);
                      else onChange(item.iata);
                      setIsOpen(false);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5 font-medium ${
                      value === item.iata
                        ? "bg-[#FEF3C7] text-[#92400E] border-[#D97706] font-bold"
                        : "bg-[#FAF7F2] hover:bg-[#F3EFE6] border-[#E8E2D5] text-[#1C1917]"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="font-mono text-[10px] text-[#2D5A46] font-bold">{item.iata}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results List */}
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {isLoading && (
              <div className="flex items-center justify-center py-4 text-xs text-[#78716C] gap-2">
                <span className="h-3.5 w-3.5 border-2 border-[#B45309]/30 border-t-[#B45309] rounded-full animate-spin" />
                Searching airports...
              </div>
            )}

            {!isLoading && results.length === 0 && (
              <div className="py-6 text-center text-xs text-[#78716C]">
                No matching airports found for &ldquo;{query}&rdquo;
              </div>
            )}

            {results.map((airport) => {
              const isSelected = airport.iata.toUpperCase() === value.toUpperCase();
              return (
                <button
                  key={airport.iata}
                  type="button"
                  onClick={() => handleSelect(airport)}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2 transition-all ${
                    isSelected
                      ? "bg-[#FEF3C7] text-[#92400E]"
                      : "hover:bg-[#FAF7F2] text-[#1C1917]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-lg bg-[#FAF7F2] border border-[#E8E2D5] flex items-center justify-center text-[#78716C] flex-shrink-0">
                      <Building2 className="h-3.5 w-3.5 text-[#2D5A46]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-bold text-[#1C1917]">
                          {airport.city || airport.name}
                        </span>
                        <span className="text-[#D6CEBF]">·</span>
                        <span className="text-[#78716C] font-normal">
                          {airport.country}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#78716C] truncate">
                        {airport.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#E8E2D5] text-[#2D5A46]">
                      {airport.iata}
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-[#D97706]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
