"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DateRangePickerProps {
  dateFrom: string;
  dateTo: string;
  tripType: "round" | "oneway";
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  compact?: boolean;
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseSafe(iso: string): Date | null {
  if (!iso) return null;
  try {
    const d = parseISO(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function formatDisplay(iso: string): string {
  const d = parseSafe(iso);
  if (!d) return "Select date";
  return format(d, "MMM d, yyyy");
}

export function DateRangePicker({
  dateFrom,
  dateTo,
  tripType,
  onDateFromChange,
  onDateToChange,
  compact = false,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => parseSafe(dateFrom) || new Date());
  const [selecting, setSelecting] = useState<"from" | "to">("from");
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const fromDate = parseSafe(dateFrom);
  const toDate = parseSafe(dateTo);
  const today = startOfDay(new Date());

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setViewMonth(fromDate || new Date());
      setSelecting("from");
      setHoverDate(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });
    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
  }, [viewMonth]);

  const previewEnd =
    tripType === "round" && selecting === "to" && fromDate && hoverDate && !isBefore(hoverDate, fromDate)
      ? hoverDate
      : toDate;

  const handleDayClick = (day: Date) => {
    const iso = toIso(day);
    if (isBefore(day, today)) return;

    if (tripType === "oneway") {
      onDateFromChange(iso);
      setOpen(false);
      return;
    }

    if (selecting === "from" || !fromDate || isBefore(day, fromDate)) {
      onDateFromChange(iso);
      if (toDate && isBefore(toDate, day)) {
        onDateToChange("");
      }
      setSelecting("to");
      return;
    }

    onDateToChange(iso);
    setSelecting("from");
    setOpen(false);
  };

  const isInRange = (day: Date) => {
    if (!fromDate || !previewEnd) return false;
    return (
      (isAfter(day, fromDate) || isSameDay(day, fromDate)) &&
      (isBefore(day, previewEnd) || isSameDay(day, previewEnd))
    );
  };

  const isRangeStart = (day: Date) => !!fromDate && isSameDay(day, fromDate);
  const isRangeEnd = (day: Date) => !!previewEnd && isSameDay(day, previewEnd);

  return (
    <div ref={rootRef} className="relative h-full min-w-0 w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full h-full text-left flex items-center transition-colors ${
          compact
            ? "gap-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] px-2.5 py-1.5 hover:border-[#B45309]"
            : "gap-0 rounded-2xl border border-[#E8E2D5] bg-[#FAF7F2] px-5 py-4 focus-within:border-[#B45309] hover:border-[#B45309]"
        } ${open ? "border-[#B45309] ring-2 ring-[#B45309]/15 bg-[#FFFFFF]" : ""}`}
      >
        {compact ? (
          <>
            <Calendar className="h-3.5 w-3.5 text-[#B45309] flex-shrink-0" />
            <div className="flex flex-1 items-center gap-2 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-bold text-[#78716C] uppercase tracking-wider">Depart</div>
                <div className="text-xs font-bold text-[#1C1917] truncate">{formatDisplay(dateFrom)}</div>
              </div>
              {tripType === "round" && (
                <div className="flex-1 min-w-0 border-l border-[#E8E2D5] pl-2">
                  <div className="text-[9px] font-bold text-[#78716C] uppercase tracking-wider">Return</div>
                  <div className="text-xs font-bold text-[#1C1917] truncate">{formatDisplay(dateTo)}</div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-[#78716C] uppercase tracking-wider mb-1 font-medium">
                <Calendar className="h-3.5 w-3.5 text-[#B45309]" />
                <span>Departure</span>
              </div>
              <div className="text-sm font-semibold text-[#1C1917]">{formatDisplay(dateFrom)}</div>
            </div>
            {tripType === "round" && (
              <>
                <div className="h-10 w-px bg-[#E8E2D5] mx-2" />
                <div className="flex-1 min-w-0 pl-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#78716C] uppercase tracking-wider mb-1 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-[#B45309]" />
                    <span>Return</span>
                  </div>
                  <div className="text-sm font-semibold text-[#1C1917]">{formatDisplay(dateTo)}</div>
                </div>
              </>
            )}
          </>
        )}
      </button>

      {open && (
        <div className="absolute z-[120] right-0 left-0 sm:left-auto top-full mt-2 w-[min(100vw-2rem,320px)] rounded-2xl border border-[#E8E2D5] bg-[#FFFFFF] shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
              className="h-8 w-8 rounded-lg border border-[#E8E2D5] bg-[#FAF7F2] text-[#78716C] hover:text-[#1C1917] hover:bg-[#F3EFE6] flex items-center justify-center"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="font-serif text-base font-bold text-[#1C1917] tracking-tight">
              {format(viewMonth, "MMMM yyyy")}
            </div>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="h-8 w-8 rounded-lg border border-[#E8E2D5] bg-[#FAF7F2] text-[#78716C] hover:text-[#1C1917] hover:bg-[#F3EFE6] flex items-center justify-center"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {tripType === "round" && (
            <p className="text-[11px] text-[#78716C] mb-2 text-center">
              {selecting === "from" ? "Select departure date" : "Select return date"}
            </p>
          )}

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div
                key={d}
                className="h-8 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-[#78716C]"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {weeks.flat().map((day) => {
              const disabled = isBefore(day, today);
              const outside = !isSameMonth(day, viewMonth);
              const start = isRangeStart(day);
              const end = isRangeEnd(day);
              const inRange = tripType === "round" && isInRange(day);
              const selected = start || (tripType === "round" && end);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => setHoverDate(day)}
                  onMouseLeave={() => setHoverDate(null)}
                  className={[
                    "relative h-9 w-full rounded-lg text-xs font-semibold transition-colors",
                    disabled ? "text-[#D6D3D1] cursor-not-allowed" : "cursor-pointer",
                    outside && !selected && !inRange ? "text-[#A8A29E]" : "",
                    !disabled && !selected && !inRange ? "hover:bg-[#F3EFE6] text-[#1C1917]" : "",
                    inRange && !selected ? "bg-[#FDF2E9] text-[#92400E]" : "",
                    selected ? "bg-[#B45309] text-white shadow-xs" : "",
                    isToday(day) && !selected ? "ring-1 ring-[#B45309]/40" : "",
                  ].join(" ")}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-[#F3EFE6] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                const d = defaultDepart();
                const r = defaultReturn();
                onDateFromChange(d);
                if (tripType === "round") onDateToChange(r);
                setOpen(false);
              }}
              className="text-[11px] font-semibold text-[#78716C] hover:text-[#B45309] transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-[#1C1917] text-[#FAF7F2] text-[11px] font-semibold hover:bg-[#292524] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function defaultDepart(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return toIso(d);
}

function defaultReturn(): string {
  const d = new Date();
  d.setDate(d.getDate() + 37);
  return toIso(d);
}
