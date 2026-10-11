"use client";

import { useMemo, useState, useEffect } from "react";
import { CalendarDays, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface PriceCalendarHeatmapProps {
  baseDate?: string; // YYYY-MM-DD
  basePrice?: number;
  currency?: string;
  onSelectDate?: (date: string) => void;
  priceMap?: Record<string, number>;
  isLoading?: boolean;
}

function parseLocalDate(isoStr?: string): Date {
  if (!isoStr) return new Date();
  const parts = isoStr.split("-").map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0); // midday avoids UTC/DST rollover
  }
  return new Date();
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDeterministicDatePrice(iso: string, referenceBasePrice: number): number {
  let hash = 0;
  for (let i = 0; i < iso.length; i++) {
    hash = (hash << 5) - hash + iso.charCodeAt(i);
    hash |= 0;
  }
  const parts = iso.split("-").map(Number);
  const day = parts[2] || 1;
  const variance = Math.round(Math.sin(day * 1.5) * 22 + ((Math.abs(hash) % 19) - 9));
  return Math.max(39, Math.round(referenceBasePrice + variance));
}

export function PriceCalendarHeatmap({
  baseDate,
  basePrice = 110,
  currency = "EUR",
  onSelectDate,
  priceMap,
  isLoading = false,
}: PriceCalendarHeatmapProps) {
  const [showMonthView, setShowMonthView] = useState(false);

  // Month view anchor date (first day of the departure month)
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const d = parseLocalDate(baseDate);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Re-sync month view when baseDate changes
  useEffect(() => {
    const d = parseLocalDate(baseDate);
    setCurrentMonthDate(new Date(d.getFullYear(), d.getMonth(), 1));
  }, [baseDate]);

  // Clean 7-day flexible dates (±3 days, fits neatly in 7 columns with zero sliding)
  const days = useMemo(() => {
    const list = [];
    const centerDate = parseLocalDate(baseDate);

    for (let offset = -3; offset <= 3; offset++) {
      const d = new Date(centerDate);
      d.setDate(d.getDate() + offset);
      const iso = formatLocalDate(d);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const monthDay = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      let price: number;
      if (priceMap && typeof priceMap[iso] === "number") {
        price = priceMap[iso];
      } else if (iso === baseDate) {
        price = basePrice;
      } else {
        price = getDeterministicDatePrice(iso, basePrice);
      }

      list.push({
        iso,
        dayName,
        monthDay,
        offset,
        price,
        isBase: iso === baseDate,
      });
    }

    const minPrice = Math.min(...list.map((d) => d.price));
    return list.map((d) => ({
      ...d,
      isCheapest: d.price === minPrice,
    }));
  }, [baseDate, basePrice, priceMap]);

  // Month calendar grid calculation
  const monthGrid = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 for Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{
      iso: string;
      dayNum: number;
      price: number;
      isBase: boolean;
    } | null> = [];

    // Empty cells for alignment before day 1
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(null);
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day, 12, 0, 0);
      const iso = formatLocalDate(d);

      let price: number;
      if (priceMap && typeof priceMap[iso] === "number") {
        price = priceMap[iso];
      } else if (iso === baseDate) {
        price = basePrice;
      } else {
        price = getDeterministicDatePrice(iso, basePrice);
      }

      cells.push({
        iso,
        dayNum: day,
        price,
        isBase: iso === baseDate,
      });
    }

    const validPrices = cells.filter((c): c is NonNullable<typeof c> => c !== null).map((c) => c.price);
    const minMonthPrice = validPrices.length > 0 ? Math.min(...validPrices) : basePrice;

    return cells.map((cell) => {
      if (!cell) return null;
      return {
        ...cell,
        isCheapest: cell.price === minMonthPrice,
      };
    });
  }, [currentMonthDate, baseDate, basePrice, priceMap]);

  const symbol =
    currency.toUpperCase() === "EUR" ? "€" : currency.toUpperCase() === "GBP" ? "£" : "$";

  return (
    <div className="rounded-xl border border-[#E8E2D5] bg-[#FFFFFF] p-3 shadow-xs space-y-2.5">
      {/* Header with Title and Month View Toggle on the Top Right */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1C1917]">
          <CalendarDays className="h-4 w-4 text-[#B45309]" />
          <span>Flexible Dates</span>
          {isLoading && (
            <span className="h-3 w-3 border-2 border-[#B45309]/30 border-t-[#B45309] rounded-full animate-spin ml-1" />
          )}
        </div>

        {/* Month View Toggle Button in Top Right */}
        <button
          type="button"
          onClick={() => setShowMonthView((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
            showMonthView
              ? "bg-[#B45309] text-white shadow-xs"
              : "bg-[#F3EFE6] hover:bg-[#E8E2D5] text-[#1C1917] border border-[#E8E2D5]"
          }`}
          title={showMonthView ? "Switch back to 7-Day view" : "Open Month calendar view"}
        >
          <Calendar className="h-3 w-3" />
          <span>{showMonthView ? "7-Day View" : "Month View"}</span>
        </button>
      </div>

      {/* View 1: Clean 7-Day Columns (Default, no sliding, perfectly fits the container) */}
      {!showMonthView && (
        <div className="grid grid-cols-7 gap-1">
          {days.map((item) => {
            return (
              <button
                key={item.iso}
                type="button"
                onClick={() => onSelectDate?.(item.iso)}
                className={`p-1.5 rounded-lg border text-center transition-all flex flex-col items-center justify-between min-h-[58px] cursor-pointer ${
                  item.isBase
                    ? "border-[#B45309] bg-[#FEF3C7]/50 ring-1 ring-[#B45309]/30 shadow-xs"
                    : item.isCheapest
                    ? "border-[#059669] bg-[#ECFDF5] hover:bg-[#D1FAE5]"
                    : "border-[#E8E2D5] hover:border-[#B45309]/40 bg-[#FAF7F2] hover:bg-[#F3EFE6]"
                }`}
                title={
                  item.isBase
                    ? `Current departure: ${item.iso}`
                    : item.isCheapest
                    ? `Cheapest date nearby: ${item.iso} (${symbol}${item.price})`
                    : `Select ${item.iso} (${symbol}${item.price})`
                }
              >
                <span className="text-[10px] font-medium text-[#78716C]">{item.dayName}</span>
                <span className="text-[10px] text-[#1C1917] font-semibold">{item.monthDay}</span>
                <span
                  className={`text-[11px] font-bold ${
                    item.isCheapest
                      ? "text-[#059669]"
                      : item.isBase
                      ? "text-[#B45309]"
                      : "text-[#1C1917]"
                  }`}
                >
                  {symbol}{item.price}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* View 2: Month Calendar Grid View (Toggleable) */}
      {showMonthView && (
        <div className="space-y-2 pt-0.5">
          {/* Month Navigation Header */}
          <div className="flex items-center justify-between px-1">
            <span className="font-serif font-bold text-xs text-[#1C1917]">
              {currentMonthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setCurrentMonthDate(
                    new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1)
                  );
                }}
                className="p-1 rounded-md hover:bg-[#F3EFE6] text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
                title="Previous month"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentMonthDate(
                    new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1)
                  );
                }}
                className="p-1 rounded-md hover:bg-[#F3EFE6] text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
                title="Next month"
                aria-label="Next month"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((wd) => (
              <div key={wd} className="text-[10px] font-semibold text-[#78716C] py-0.5">
                {wd}
              </div>
            ))}

            {monthGrid.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="h-11" />;
              }

              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => onSelectDate?.(cell.iso)}
                  className={`h-11 p-1 rounded-lg border text-center transition-all flex flex-col items-center justify-between cursor-pointer ${
                    cell.isBase
                      ? "border-[#B45309] bg-[#FEF3C7]/60 ring-1 ring-[#B45309]/30 shadow-xs"
                      : cell.isCheapest
                      ? "border-[#059669] bg-[#ECFDF5] hover:bg-[#D1FAE5]"
                      : "border-[#E8E2D5] hover:border-[#B45309]/40 bg-[#FAF7F2] hover:bg-[#F3EFE6]"
                  }`}
                  title={`${cell.iso}: ${symbol}${cell.price}`}
                >
                  <span className="text-[10px] font-semibold text-[#1C1917]">{cell.dayNum}</span>
                  <span
                    className={`text-[10px] font-bold leading-none ${
                      cell.isCheapest
                        ? "text-[#059669]"
                        : cell.isBase
                        ? "text-[#B45309]"
                        : "text-[#78716C]"
                    }`}
                  >
                    {symbol}{cell.price}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
