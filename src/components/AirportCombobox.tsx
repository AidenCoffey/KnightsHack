"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, X, Check, Building2, Home } from "lucide-react";
import type { Airport } from "@/types";
import { FALLBACK_AIRPORTS, searchAirportsClient } from "@/lib/airport-data";

interface AirportComboboxProps {
  label: string;
  sublabel?: string;
  value: string; // IATA code
  onChange: (iata: string, airport?: Airport) => void;
  type?: "origin" | "destination";
  placeholder?: string;
  compact?: boolean;
  /** Other field's IATA — excluded so origin ≠ destination */
  excludeIata?: string;
}

export function AirportCombobox({
  label,
  sublabel,
  value,
  onChange,
  type = "origin",
  placeholder = "Search city, airport or code...",
  compact = false,
  excludeIata,
}: AirportComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Airport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedAirport = value
    ? FALLBACK_AIRPORTS.find((a) => a.iata.toUpperCase() === value.toUpperCase())
    : undefined;

  const fieldLabel = type === "origin" ? "Home base" : "Destination";
  const inputPlaceholder =
    placeholder || (type === "origin" ? "Where from?" : "Where to?");

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
        setQuery("");
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsFocused(false);
        setQuery("");
        inputRef.current?.blur();
      }
    }
    if (isOpen || isFocused) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isFocused]);

  const withoutExcluded = (airports: Airport[]) => {
    if (!excludeIata) return airports;
    const blocked = excludeIata.toUpperCase();
    return airports.filter((a) => a.iata.toUpperCase() !== blocked);
  };

  // Initial and query search
  useEffect(() => {
    if (!isOpen) return;

    const clientMatches = withoutExcluded(searchAirportsClient(query, 12));
    setResults(clientMatches);

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
              setResults(withoutExcluded(data.airports));
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
    }

    setIsLoading(false);
  }, [query, isOpen, excludeIata]);

  const showInput = isFocused || !value;

  // Auto-focus input whenever entering editing/typing mode
  useEffect(() => {
    if (isFocused) {
      inputRef.current?.focus();
    }
  }, [isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setIsOpen(true);
    setQuery("");
  };

  const handleSelect = (airport: Airport) => {
    onChange(airport.iata, airport);
    setIsOpen(false);
    setIsFocused(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
    setIsOpen(true);
    setIsFocused(true);
    inputRef.current?.focus();
  };

  const selectionPlaceholder = selectedAirport
    ? `${selectedAirport.city} (${selectedAirport.iata})`
    : value || inputPlaceholder;

  return (
    <div
      ref={rootRef}
      className={`relative flex-1 min-w-0 ${compact ? "sm:min-w-[120px]" : "min-w-[170px]"}`}
    >
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`airport-listbox-${type}`}
        onClick={() => {
          setIsFocused(true);
          setIsOpen(true);
        }}
        className={`w-full text-left transition-all duration-150 border flex items-center group h-full cursor-text ${
          compact
            ? "rounded-xl px-3 py-2 gap-2"
            : "rounded-2xl px-5 py-4 gap-3 min-h-[4.5rem]"
        } ${
          isOpen || isFocused
            ? "border-[#B45309] ring-2 ring-[#B45309]/15 bg-[#FFFFFF] shadow-sm"
            : "border-[#E8E2D5] bg-[#FFFFFF] hover:border-[#B45309] hover:shadow-xs"
        }`}
      >
        <div className="flex items-center justify-center text-[#78716C] flex-shrink-0">
          {type === "origin" ? (
            <Home
              className={`${compact ? "h-3.5 w-3.5" : "h-5 w-5"} text-[#2D5A46] group-hover:scale-105 transition-all`}
            />
          ) : (
            <MapPin
              className={`${compact ? "h-3.5 w-3.5" : "h-5 w-5"} text-[#B45309] group-hover:scale-105 transition-all`}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {showInput ? (
            <>
              <div
                className={`${compact ? "text-[10px]" : "text-xs"} font-semibold text-[#78716C] truncate`}
              >
                {fieldLabel}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (!isOpen) setIsOpen(true);
                }}
                onFocus={handleFocus}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsOpen(false);
                    setIsFocused(false);
                    setQuery("");
                    inputRef.current?.blur();
                  } else if (e.key === "Enter" && results.length > 0) {
                    e.preventDefault();
                    handleSelect(results[0]);
                  }
                }}
                placeholder={selectionPlaceholder}
                className={`w-full bg-transparent outline-none border-none p-0 ${
                  compact ? "text-xs" : "text-base"
                } font-bold text-[#1C1917] placeholder:text-[#A8A29E] placeholder:font-bold truncate font-sans`}
                aria-autocomplete="list"
                aria-controls={`airport-listbox-${type}`}
                autoComplete="off"
              />
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5 truncate">
                <span
                  className={`${compact ? "text-xs" : "text-base"} font-bold text-[#1C1917] truncate font-sans`}
                >
                  {selectedAirport?.city || value}
                </span>
                <span
                  className={`${compact ? "text-[10px]" : "text-xs"} font-mono text-[#B45309] font-bold`}
                >
                  {value}
                </span>
              </div>
              <div
                className={`${compact ? "text-[10px]" : "text-xs"} text-[#78716C] truncate font-normal`}
              >
                {selectedAirport?.name ||
                  sublabel ||
                  label ||
                  (type === "origin" ? "Select departure hub" : "Where to?")}
              </div>
            </>
          )}
        </div>

        {(Boolean(value) || Boolean(query)) && (
          <button
            type="button"
            onClick={handleClear}
            className="flex-shrink-0 p-1 rounded-md text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF7F2] transition-colors"
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Results only — typing happens in the field above */}
      {isOpen && (
        <div
          id={`airport-listbox-${type}`}
          role="listbox"
          className="absolute z-[100] left-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-[#E8E2D5] bg-[#FFFFFF] shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {isLoading && (
              <div className="flex items-center justify-center py-4 text-xs text-[#78716C] gap-2">
                <span className="h-3.5 w-3.5 border-2 border-[#B45309]/30 border-t-[#B45309] rounded-full animate-spin" />
                Searching airports...
              </div>
            )}

            {!isLoading && results.length === 0 && (
              <div className="py-6 text-center text-xs text-[#78716C]">
                {query.trim()
                  ? <>No matching airports found for &ldquo;{query}&rdquo;</>
                  : "Type a city, airport, or code"}
              </div>
            )}

            {!isLoading && results.length > 0 && !query.trim() && (
              <div className="px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#A8A29E]">
                Popular destinations
              </div>
            )}

            {results.map((airport) => {
              const isSelected = airport.iata.toUpperCase() === value.toUpperCase();
              return (
                <button
                  key={airport.iata}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => e.preventDefault()}
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
