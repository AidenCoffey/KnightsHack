"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  CheckSquare,
  Square,
  Copy,
  Check,
  PhoneCall,
  Coins,
  Sun,
  Globe,
  Sparkles,
  Luggage,
  BookOpen,
  Compass,
} from "lucide-react";
import type { CountryCulturalInfo } from "@/types/cultural";
import { getCountryFlag, getCountryNameFromCode } from "@/lib/cultural-utils";

interface DestinationCulturalModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinationIata: string;
  destinationCity?: string;
  bookingUrl?: string | null;
  farePrice?: number;
  fareCurrency?: string;
  originIata?: string;
}

type TabType = "packing" | "culture" | "safety" | "phrases" | "currency" | "emergency";

export function DestinationCulturalModal({
  isOpen,
  onClose,
  destinationIata,
  destinationCity,
  bookingUrl,
  farePrice,
  fareCurrency = "EUR",
  originIata,
}: DestinationCulturalModalProps) {
  const [data, setData] = useState<CountryCulturalInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("packing");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [phraseSearch, setPhraseSearch] = useState("");

  // Lock background body scroll whenever the modal is open, and restore on close
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Keyboard ESC to close modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Fetch cultural data whenever destinationIata changes and modal is open
  useEffect(() => {
    if (!isOpen || !destinationIata) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(`/api/cultural-info/${encodeURIComponent(destinationIata)}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load guide (${res.status})`);
        }
        return res.json();
      })
      .then((json: CountryCulturalInfo) => {
        if (isMounted) {
          setData(json);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load cultural info");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, destinationIata]);

  // Toggle packing checklist item
  const toggleItem = (itemKey: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Count packing items progress
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

  // Filtered phrases
  const filteredPhrases = useMemo(() => {
    if (!data?.usefulPhrases) return [];
    if (!phraseSearch.trim()) return data.usefulPhrases;
    const q = phraseSearch.toLowerCase().trim();
    return data.usefulPhrases.filter(
      (p) =>
        p.phrase.toLowerCase().includes(q) ||
        p.translation.toLowerCase().includes(q) ||
        p.phonetic.toLowerCase().includes(q)
    );
  }, [data, phraseSearch]);

  if (!isOpen) return null;

  const flag = getCountryFlag(data?.alpha2 || destinationIata);
  const countryName = data?.countryName || getCountryNameFromCode(data?.alpha2 || destinationIata);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl h-[88vh] max-h-[850px] flex flex-col rounded-3xl border border-[#E8E2D5] bg-[#FFFFFF] shadow-2xl overflow-hidden"
      >
        {/* Modal Top Header: Luxury Obsidian & Aged Gold Theme */}
        <div className="relative bg-[#1C1917] text-[#FAF7F2] p-5 sm:p-7 flex-shrink-0 border-b border-[#292524]">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF7F2] flex items-center justify-center transition-colors"
            title="Close dossier (Esc)"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-10">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-2xl sm:text-3xl">{flag}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F3EFE6] text-[#B45309] px-2.5 py-0.5 rounded-full border border-[#E8E2D5]">
                  TravelWolf Cultural Intelligence
                </span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#FAF7F2]">
                {countryName} Cultural Briefing & Travel Dossier
              </h2>
              <p className="text-xs sm:text-sm text-[#A8A29E] mt-0.5">
                {destinationCity ? `${destinationCity} (${destinationIata})` : destinationIata} · Everything you need to know before you fly
              </p>
            </div>

            {farePrice ? (
              <div className="sm:text-right bg-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-sm border border-white/15">
                <div className="text-[10px] text-[#D97706] uppercase tracking-wider font-semibold">
                  Selected Route Fare
                </div>
                <div className="text-lg sm:text-xl font-black text-[#FAF7F2]">
                  {fareCurrency === "EUR" ? "€" : fareCurrency === "GBP" ? "£" : "$"}
                  {Math.round(farePrice)}
                </div>
                {originIata && (
                  <div className="text-[10px] text-[#A8A29E]">
                    From {originIata} ➔ {destinationIata}
                  </div>
                )}
              </div>
            ) : (
              <a
                href={`/guide/${encodeURIComponent(destinationIata || "NRT")}`}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#FAF7F2] text-xs font-semibold border border-white/15 transition-colors"
              >
                <span>Open Dedicated Page</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#D97706]" />
              </a>
            )}
          </div>

          {/* Quick Metrics Chips */}
          {data && (
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
              {data.currencyInfo && (
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg">
                  <Coins className="h-3.5 w-3.5 text-[#D97706]" />
                  <span>
                    Currency: <strong>{data.currencyInfo.code}</strong> ({data.currencyInfo.name})
                  </span>
                </div>
              )}
              {data.emergencyInfo && (
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg">
                  <PhoneCall className="h-3.5 w-3.5 text-[#34D399]" />
                  <span>
                    Police: <strong>{data.emergencyInfo.police}</strong> · Ambulance:{" "}
                    <strong>{data.emergencyInfo.ambulance}</strong>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg">
                <Globe className="h-3.5 w-3.5 text-[#93C5FD]" />
                <span>Verified Travel Dossier</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs: Warm Sand Architecture */}
        <div className="flex-shrink-0 bg-[#F3EFE6] border-b border-[#E8E2D5] px-4 pt-2 flex items-center gap-1 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab("packing")}
            className={`py-2.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap rounded-t-xl ${
              activeTab === "packing"
                ? "bg-[#FAF7F2] text-[#1C1917] border-t border-x border-[#E8E2D5] font-bold shadow-xs"
                : "text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF7F2]/60"
            }`}
          >
            <Luggage className="h-4 w-4 text-[#B45309]" />
            <span>Packing Checklist</span>
            {totalItems > 0 && (
              <span className="text-[10px] bg-[#E8F0EC] text-[#2D5A46] px-1.5 py-0.2 rounded-full font-bold ml-1">
                {completedItems}/{totalItems}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("culture")}
            className={`py-2.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap rounded-t-xl ${
              activeTab === "culture"
                ? "bg-[#FAF7F2] text-[#1C1917] border-t border-x border-[#E8E2D5] font-bold shadow-xs"
                : "text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF7F2]/60"
            }`}
          >
            <Sparkles className="h-4 w-4 text-[#D97706]" />
            <span>Customs & Taboos</span>
          </button>

          <button
            onClick={() => setActiveTab("safety")}
            className={`py-2.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap rounded-t-xl ${
              activeTab === "safety"
                ? "bg-[#FAF7F2] text-[#1C1917] border-t border-x border-[#E8E2D5] font-bold shadow-xs"
                : "text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF7F2]/60"
            }`}
          >
            <ShieldAlert className="h-4 w-4 text-[#B45309]" />
            <span>Safety & Common Scams</span>
          </button>

          <button
            onClick={() => setActiveTab("phrases")}
            className={`py-2.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap rounded-t-xl ${
              activeTab === "phrases"
                ? "bg-[#FAF7F2] text-[#1C1917] border-t border-x border-[#E8E2D5] font-bold shadow-xs"
                : "text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF7F2]/60"
            }`}
          >
            <BookOpen className="h-4 w-4 text-[#2D5A46]" />
            <span>Useful Phrases</span>
          </button>

          <button
            onClick={() => setActiveTab("currency")}
            className={`py-2.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap rounded-t-xl ${
              activeTab === "currency"
                ? "bg-[#FAF7F2] text-[#1C1917] border-t border-x border-[#E8E2D5] font-bold shadow-xs"
                : "text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF7F2]/60"
            }`}
          >
            <Coins className="h-4 w-4 text-[#D97706]" />
            <span>Currency & Money</span>
          </button>

          <button
            onClick={() => setActiveTab("emergency")}
            className={`py-2.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap rounded-t-xl ${
              activeTab === "emergency"
                ? "bg-[#FAF7F2] text-[#1C1917] border-t border-x border-[#E8E2D5] font-bold shadow-xs"
                : "text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF7F2]/60"
            }`}
          >
            <PhoneCall className="h-4 w-4 text-[#2D5A46]" />
            <span>Emergency Contacts</span>
          </button>
        </div>

        {/* Modal Scrollable Body: Self-contained, overscroll-contain prevents scrolling behind */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7 custom-scrollbar bg-[#FAF7F2] overscroll-contain">
          {isLoading && (
            <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
              <div className="h-8 w-8 border-3 border-[#B45309]/20 border-t-[#B45309] rounded-full animate-spin" />
              <div className="text-sm font-semibold text-[#1C1917]">
                Retrieving TravelWolf cultural dossier…
              </div>
              <div className="text-xs text-[#78716C]">
                Loading verified cultural norms, emergency numbers, and travel checklists for {countryName}…
              </div>
            </div>
          )}

          {error && !isLoading && !data && (
            <div className="py-12 text-center max-w-md mx-auto space-y-3">
              <div className="p-3 bg-[#FEE2E2] text-[#991B1B] rounded-full w-fit mx-auto">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="text-base font-bold text-[#1C1917]">Unable to load dossier</div>
              <div className="text-xs text-[#78716C]">{error}</div>
            </div>
          )}

          {!isLoading && data && (
            <>
              {/* TAB 1: PACKING CHECKLIST */}
              {activeTab === "packing" && (
                <div className="space-y-6">
                  {/* Packing Progress Header */}
                  <div className="p-4 rounded-2xl border border-[#E8E2D5] bg-[#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <div className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
                        <span>Pre-Trip Packing Tracker</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E8F0EC] text-[#2D5A46]">
                          {packingPercentage}% Ready
                        </span>
                      </div>
                      <div className="text-xs text-[#78716C] mt-0.5">
                        {completedItems} of {totalItems} essentials checked off
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const all: Record<string, boolean> = {};
                          data.essentialItems?.forEach((g) =>
                            g.items.forEach((item) => (all[item] = true))
                          );
                          setCheckedItems(all);
                        }}
                        className="text-xs px-3 py-1.5 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] hover:bg-[#F3EFE6] font-medium transition-colors text-[#1C1917]"
                      >
                        Check all
                      </button>
                      <button
                        type="button"
                        onClick={() => setCheckedItems({})}
                        className="text-xs px-3 py-1.5 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] hover:bg-[#F3EFE6] font-medium transition-colors text-[#1C1917]"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#E8E2D5] rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="bg-[#2D5A46] h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${packingPercentage}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Checklist Groups */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.essentialItems?.map((group) => (
                      <div
                        key={group.title}
                        className="rounded-2xl border border-[#E8E2D5] bg-[#FFFFFF] p-4 sm:p-5 space-y-3 shadow-xs"
                      >
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#B45309] flex items-center gap-1.5">
                          <Luggage className="h-3.5 w-3.5" />
                          {group.title}
                        </h3>

                        <div className="space-y-2">
                          {group.items.map((item) => {
                            const isChecked = !!checkedItems[item];
                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => toggleItem(item)}
                                className={`w-full text-left flex items-start gap-2.5 p-2.5 rounded-xl text-xs transition-colors border ${
                                  isChecked
                                    ? "bg-[#E8F0EC]/60 border-[#2D5A46]/30 text-[#78716C] line-through"
                                    : "bg-[#FAF7F2] hover:bg-[#F3EFE6] border-[#E8E2D5] text-[#1C1917]"
                                }`}
                              >
                                {isChecked ? (
                                  <CheckSquare className="h-4 w-4 text-[#2D5A46] flex-shrink-0 mt-0.5" />
                                ) : (
                                  <Square className="h-4 w-4 text-[#78716C] flex-shrink-0 mt-0.5" />
                                )}
                                <span className="leading-relaxed">{item}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: CULTURE & TABOOS */}
              {activeTab === "culture" && (
                <div className="space-y-6">
                  {/* Weather snapshot banner */}
                  {data.weatherInfo && (
                    <div className="p-4 sm:p-5 rounded-2xl border border-[#E8E2D5] bg-[#FFFFFF] flex items-start gap-3 shadow-xs">
                      <Sun className="h-5 w-5 text-[#D97706] flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-[#1C1917]">Climate & Seasonal Expectations</div>
                        <div className="text-xs text-[#78716C] whitespace-pre-line mt-1.5 leading-relaxed">
                          {data.weatherInfo}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Local Customs */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#D97706]" />
                      Local Customs to Know & Respect
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.localCustoms?.map((custom) => (
                        <div
                          key={custom.title}
                          className="p-4 rounded-2xl border border-[#E8E2D5] bg-[#FFFFFF] space-y-1.5 shadow-xs"
                        >
                          <div className="text-xs font-bold text-[#1C1917]">{custom.title}</div>
                          <div className="text-xs text-[#78716C] leading-relaxed">
                            {custom.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cultural Taboos */}
                  {data.culturalTaboos && data.culturalTaboos.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h3 className="text-sm font-bold text-[#991B1B] flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-[#DC2626]" />
                        Taboos & Behaviors to Avoid
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {data.culturalTaboos.map((taboo) => (
                          <div
                            key={taboo.title}
                            className="p-4 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] space-y-1.5"
                          >
                            <div className="text-xs font-bold text-[#991B1B]">{taboo.title}</div>
                            <div className="text-xs text-[#B91C1C] leading-relaxed">
                              {taboo.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SAFETY & SCAMS */}
              {activeTab === "safety" && (
                <div className="space-y-6">
                  {/* General Safety Tips */}
                  {data.safetyTips && data.safetyTips.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-[#2D5A46]" />
                        General Traveler Safety Tips
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {data.safetyTips.map((tip) => (
                          <div
                            key={tip.title}
                            className="p-4 rounded-2xl border border-[#E8E2D5] bg-[#FFFFFF] space-y-1 shadow-xs"
                          >
                            <div className="text-xs font-bold text-[#1C1917]">{tip.title}</div>
                            <div className="text-xs text-[#78716C] leading-relaxed">
                              {tip.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Common Scams */}
                  {data.commonScams && data.commonScams.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h3 className="text-sm font-bold text-[#92400E] flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-[#D97706]" />
                        Tourist Scams to Watch Out For
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {data.commonScams.map((scam) => (
                          <div
                            key={scam.title}
                            className="p-4 rounded-2xl border border-[#FDE68A] bg-[#FEF3C7]/40 space-y-1"
                          >
                            <div className="text-xs font-bold text-[#92400E]">{scam.title}</div>
                            <div className="text-xs text-[#78350F] leading-relaxed">
                              {scam.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: USEFUL PHRASES */}
              {activeTab === "phrases" && (
                <div className="space-y-4">
                  {/* Search bar */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search phrases (e.g., hello, thank you, bill)..."
                      value={phraseSearch}
                      onChange={(e) => setPhraseSearch(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-[#E8E2D5] bg-[#FFFFFF] text-xs text-[#1C1917] placeholder:text-[#78716C] outline-none focus:border-[#B45309]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredPhrases.map((phrase, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border border-[#E8E2D5] bg-[#FFFFFF] flex items-start justify-between gap-3 shadow-xs"
                      >
                        <div>
                          <div className="text-xs font-semibold text-[#78716C]">
                            {phrase.translation}
                          </div>
                          <div className="text-base font-bold text-[#1C1917] mt-0.5">
                            {phrase.phrase}
                          </div>
                          <div className="text-[11px] text-[#B45309] font-mono mt-0.5">
                            /{phrase.phonetic}/
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopy(phrase.phrase, `phrase-${idx}`)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF7F2] border border-[#E8E2D5] flex items-center gap-1 transition-colors"
                        >
                          {copiedText === `phrase-${idx}` ? (
                            <>
                              <Check className="h-3 w-3 text-[#2D5A46]" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: CURRENCY & MONEY */}
              {activeTab === "currency" && data.currencyInfo && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl border border-[#E8E2D5] bg-[#FFFFFF] space-y-2 shadow-xs">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#B45309] flex items-center gap-1.5">
                        <Coins className="h-4 w-4" />
                        Currency Information
                      </div>
                      <div className="text-xl font-bold text-[#1C1917]">
                        {data.currencyInfo.name} ({data.currencyInfo.code})
                      </div>
                      {data.currencyInfo.exchangeRate && (
                        <div className="text-xs text-[#78716C]">
                          <strong>Exchange Rate:</strong> {data.currencyInfo.exchangeRate}
                        </div>
                      )}
                    </div>

                    <div className="p-5 rounded-2xl border border-[#E8E2D5] bg-[#FFFFFF] space-y-2 shadow-xs">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#2D5A46] flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" />
                        Tipping & Payment Customs
                      </div>
                      <div className="text-xs text-[#78716C] whitespace-pre-line leading-relaxed">
                        {data.currencyInfo.tips || "Carry cash and verify cards with your bank before traveling."}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: EMERGENCY CONTACTS */}
              {activeTab === "emergency" && data.emergencyInfo && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Police */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-[#E8E2D5] bg-[#FFFFFF] flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="text-xs font-semibold text-[#78716C]">Police Emergency</div>
                        <div className="text-2xl font-black text-[#1C1917] mt-1 font-mono">
                          {data.emergencyInfo.police}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(data.emergencyInfo?.police || "", "police")}
                        className="mt-3 text-xs font-semibold text-[#B45309] flex items-center gap-1"
                      >
                        {copiedText === "police" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedText === "police" ? "Copied" : "Copy number"}
                      </button>
                    </div>

                    {/* Ambulance */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-[#E8E2D5] bg-[#FFFFFF] flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="text-xs font-semibold text-[#78716C]">Ambulance / Medical</div>
                        <div className="text-2xl font-black text-[#1C1917] mt-1 font-mono">
                          {data.emergencyInfo.ambulance}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(data.emergencyInfo?.ambulance || "", "ambulance")}
                        className="mt-3 text-xs font-semibold text-[#B45309] flex items-center gap-1"
                      >
                        {copiedText === "ambulance" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedText === "ambulance" ? "Copied" : "Copy number"}
                      </button>
                    </div>

                    {/* Embassy */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-[#E8E2D5] bg-[#FFFFFF] flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="text-xs font-semibold text-[#78716C]">Embassy / Assistance</div>
                        <div className="text-xs font-bold text-[#1C1917] mt-1 leading-relaxed">
                          {data.emergencyInfo.embassy || "Consult local consular services"}
                        </div>
                      </div>
                      {data.emergencyInfo.embassy && (
                        <button
                          type="button"
                          onClick={() => handleCopy(data.emergencyInfo?.embassy || "", "embassy")}
                          className="mt-3 text-xs font-semibold text-[#B45309] flex items-center gap-1"
                        >
                          {copiedText === "embassy" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copiedText === "embassy" ? "Copied" : "Copy details"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex-shrink-0 bg-[#F3EFE6] border-t border-[#E8E2D5] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#78716C]">
              Verified travel dossier curated by{" "}
              <strong className="font-bold text-[#1C1917]">
                TravelWolf & Venture
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href={`/guide/${encodeURIComponent(destinationIata || "NRT")}`}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-[#E8E2D5] bg-[#FFFFFF] hover:bg-[#FAF7F2] text-[#1C1917] transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#B45309]" />
              <span>Full Page Dossier</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-[#E8E2D5] bg-[#FFFFFF] hover:bg-[#FAF7F2] text-[#78716C] hover:text-[#1C1917] transition-colors"
            >
              Close
            </button>

            {bookingUrl && (
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold px-5 py-2.5 rounded-xl bg-[#1C1917] hover:bg-[#292524] text-[#FAF7F2] flex items-center gap-1.5 shadow-md transition-all"
              >
                Proceed to Carrier Booking <ExternalLink className="h-3.5 w-3.5 text-[#D97706]" />
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
