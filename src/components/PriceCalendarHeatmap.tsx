"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";

interface PriceCalendarHeatmapProps {
  baseDate?: string; // YYYY-MM-DD
  basePrice?: number;
  currency?: string;
  onSelectDate?: (date: string) => void;
}

export function PriceCalendarHeatmap({
  baseDate,
  basePrice = 110,
  currency = "EUR",
  onSelectDate,
}: PriceCalendarHeatmapProps) {
  const days = useMemo(() => {
    const list = [];
    const dateObj = new Date(baseDate || new Date().toISOString().split("T")[0]);

    for (let offset = -3; offset <= 3; offset++) {
      const d = new Date(dateObj);
      d.setDate(d.getDate() + offset);
      const iso = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const monthDay = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      // Realistic price variation curve
      const variance = Math.sin(offset * 1.5) * 25 + (offset === 0 ? 0 : (offset % 2 === 0 ? -12 : 18));
      const price = Math.max(49, Math.round(basePrice + variance));

      list.push({
        iso,
        dayName,
        monthDay,
        offset,
        price,
        isBase: offset === 0,
      });
    }

    const minPrice = Math.min(...list.map((d) => d.price));
    return list.map((d) => ({
      ...d,
      isCheapest: d.price === minPrice,
    }));
  }, [baseDate, basePrice]);

  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span>Flexible Dates (±3 Days)</span>
        </div>
        <span className="text-[10px] text-muted-foreground">Depart nearby dates</span>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((item) => {
          return (
            <button
              key={item.iso}
              onClick={() => onSelectDate?.(item.iso)}
              className={`p-1.5 rounded-lg border text-center transition-all flex flex-col items-center justify-between min-h-[58px] ${
                item.isBase
                  ? "border-primary bg-primary/10 shadow-sm"
                  : item.isCheapest
                  ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                  : "border-border hover:border-primary/40 bg-muted/20 hover:bg-muted/40"
              }`}
            >
              <span className="text-[10px] font-medium text-muted-foreground">{item.dayName}</span>
              <span className="text-[10px] text-foreground font-semibold">{item.monthDay}</span>
              <span
                className={`text-[11px] font-bold ${
                  item.isCheapest
                    ? "text-emerald-600 dark:text-emerald-400"
                    : item.isBase
                    ? "text-primary"
                    : "text-foreground"
                }`}
              >
                {symbol}{item.price}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
