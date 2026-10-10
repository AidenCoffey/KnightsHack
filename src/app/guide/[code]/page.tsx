"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Luggage,
  Sparkles,
  ShieldAlert,
  BookOpen,
  Coins,
  PhoneCall,
  Sun,
  Check,
  Copy,
  Search,
  ExternalLink,
  Compass,
  AlertTriangle,
  MapPin,
  Calendar,
  Share2,
} from "lucide-react";
import type { CountryCulturalInfo } from "@/types/cultural";
import { getCountryFlag, getCountryNameFromCode } from "@/lib/cultural-utils";
import { FALLBACK_AIRPORTS } from "@/lib/airport-data";

export default function DestinationGuidePage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = (params?.code as string) || "NRT";
  const code = decodeURIComponent(rawCode).toUpperCase();

  const [data, setData] = useState<CountryCulturalInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [phraseSearch, setPhraseSearch] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "packing" | "culture" | "safety" | "phrases" | "practical"
  >("overview");

  // Matched city / airport info if IATA code provided
  const airportInfo = useMemo(() => {
    return FALLBACK_AIRPORTS.find((a) => a.iata.toUpperCase() === code);
  }, [code]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(`/api/cultural-info/${encodeURIComponent(code)}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load destination guide (${res.status})`);
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
  }, [code]);

  const toggleItem = (itemKey: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

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

  const flag = getCountryFlag(data?.alpha2 || code);
  const countryName = data?.countryName || getCountryNameFromCode(data?.alpha2 || code);
  const destinationCity = airportInfo?.city || countryName;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917] antialiased">
      {/* Editorial Luxury Top Nav */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E8E2D5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#78716C] hover:text-[#1C1917] px-3 py-1.5 rounded-full border border-[#E8E2D5] bg-[#FFFFFF] hover:bg-[#F3EFE6] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Venture</span>
            </button>
            <div className="hidden sm:block h-4 w-px bg-[#E8E2D5]" />
            <span className="hidden sm:inline font-serif font-semibold tracking-tight text-sm text-[#1C1917]">
              TravelWolf Destination Dossier
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `${destinationCity} Travel Dossier`,
                    url: window.location.href,
                  });
                } else {
                  handleCopy(window.location.href, "share-link");
                }
              }}
              className="text-xs px-3 py-1.5 rounded-full border border-[#E8E2D5] bg-[#FFFFFF] hover:bg-[#F3EFE6] font-medium transition-colors text-[#78716C] hover:text-[#1C1917] flex items-center gap-1.5"
            >
              {copiedText === "share-link" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#2D5A46]" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share Dossier</span>
                </>
              )}
            </button>

            <button
              onClick={() => router.push(`/?destination=${encodeURIComponent(code)}`)}
              className="text-xs px-4 py-1.5 rounded-full bg-[#1C1917] hover:bg-[#292524] text-[#FAF7F2] font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Compass className="h-3.5 w-3.5 text-[#D97706]" />
              <span>Search Flights & Rail</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Hero Header Card */}
        <section className="bg-[#1C1917] text-[#FAF7F2] rounded-3xl p-6 sm:p-10 shadow-xl border border-[#292524] relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl sm:text-5xl">{flag}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-[#F3EFE6] text-[#B45309] px-3 py-1 rounded-full border border-[#E8E2D5]">
                Country & City Guide
              </span>
              {code.length === 3 && (
                <span className="text-xs font-mono font-bold text-[#D97706] bg-white/10 px-2.5 py-0.5 rounded-md">
                  {code} Gateway
                </span>
              )}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[#FAF7F2] leading-tight">
              {destinationCity} Travel Dossier & Cultural Intelligence
            </h1>

            <p className="text-sm sm:text-base text-[#A8A29E] leading-relaxed">
              Comprehensive cultural customs, local etiquette, climate expectations, emergency contacts,
              and essential packing items for {countryName}.
            </p>

            {/* Quick Metrics */}
            {data && (
              <div className="pt-4 flex flex-wrap items-center gap-3 text-xs">
                {data.currencyInfo && (
                  <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10">
                    <Coins className="h-4 w-4 text-[#D97706]" />
                    <span>
                      Currency: <strong>{data.currencyInfo.code}</strong> ({data.currencyInfo.name})
                    </span>
                  </div>
                )}
                {data.emergencyInfo && (
                  <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10">
                    <PhoneCall className="h-4 w-4 text-[#34D399]" />
                    <span>
                      Police: <strong>{data.emergencyInfo.police}</strong> · Ambulance:{" "}
                      <strong>{data.emergencyInfo.ambulance}</strong>
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10">
                  <Luggage className="h-4 w-4 text-[#93C5FD]" />
                  <span>
                    Pack List: <strong>{totalItems} items</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#E8E2D5] custom-scrollbar">
          {[
            { id: "overview", label: "Overview & Essentials", icon: Sparkles },
            { id: "packing", label: `Packing Checklist (${completedItems}/${totalItems})`, icon: Luggage },
            { id: "culture", label: "Customs & Etiquette", icon: BookOpen },
            { id: "safety", label: "Safety & Scams", icon: ShieldAlert },
            { id: "phrases", label: "Useful Phrases", icon: Compass },
            { id: "practical", label: "Currency & Emergency", icon: Coins },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isActive
                    ? "bg-[#1C1917] text-[#FAF7F2] shadow-sm"
                    : "bg-[#FFFFFF] text-[#78716C] hover:text-[#1C1917] border border-[#E8E2D5] hover:border-[#D6CEBF]"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-[#D97706]" : "text-[#78716C]"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
            <span className="h-8 w-8 border-3 border-[#B45309]/30 border-t-[#B45309] rounded-full animate-spin" />
            <p className="text-sm font-semibold text-[#1C1917]">
              Loading verified travel dossier for {destinationCity}…
            </p>
          </div>
        )}

        {error && !isLoading && (
          <div className="p-8 rounded-2xl bg-[#FEE2E2] border border-[#FECACA] text-center max-w-md mx-auto space-y-3">
            <AlertTriangle className="h-8 w-8 text-[#991B1B] mx-auto" />
            <h3 className="font-bold text-[#991B1B]">Unable to load travel guide</h3>
            <p className="text-xs text-[#7F1D1D]">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-2 text-xs font-semibold px-4 py-2 bg-[#991B1B] text-white rounded-full hover:bg-[#7F1D1D] transition-colors"
            >
              Return to search
            </button>
          </div>
        )}

        {!isLoading && data && (
          <div className="space-y-8">
            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Climate & Seasonality */}
                  <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-3xl p-6 space-y-4 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#B45309] uppercase tracking-wider">
                      <Sun className="h-4 w-4" />
                      <span>Seasonality & Climate</span>
                    </div>
                    <div className="text-xs leading-relaxed text-[#78716C] whitespace-pre-line bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D5]">
                      {data.weatherInfo || "Mild climate with distinct travel seasons."}
                    </div>
                  </div>

                  {/* Currency & Payment Customs */}
                  <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-3xl p-6 space-y-4 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#2D5A46] uppercase tracking-wider">
                      <Coins className="h-4 w-4" />
                      <span>Currency & Payment Customs</span>
                    </div>

                    {data.currencyInfo ? (
                      <div className="space-y-3">
                        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] flex items-center justify-between">
                          <div>
                            <div className="text-base font-bold text-[#1C1917]">
                              {data.currencyInfo.code} · {data.currencyInfo.name}
                            </div>
                            <div className="text-xs text-[#78716C] mt-0.5">
                              {data.currencyInfo.exchangeRate}
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-[#2D5A46] bg-[#E8F0EC] px-2.5 py-1 rounded-lg">
                            National Currency
                          </span>
                        </div>

                        {data.currencyInfo.tips && (
                          <div className="text-xs text-[#78716C] bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D5] space-y-1.5 leading-relaxed">
                            {data.currencyInfo.tips.split("\n").map((tip, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="text-[#B45309] font-bold">•</span>
                                <span>{tip.replace(/^[•\-\*]\s*/, "")}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-[#78716C]">Card payments widely accepted.</p>
                    )}
                  </div>
                </div>

                {/* Cultural Customs Highlights */}
                {data.localCustoms && data.localCustoms.length > 0 && (
                  <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-xl font-bold text-[#1C1917]">
                        Key Cultural Etiquette in {countryName}
                      </h3>
                      <button
                        onClick={() => setActiveTab("culture")}
                        className="text-xs font-semibold text-[#B45309] hover:underline"
                      >
                        View all customs &rarr;
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {data.localCustoms.slice(0, 3).map((custom, idx) => (
                        <div
                          key={idx}
                          className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D5] space-y-1.5 text-xs"
                        >
                          <div className="font-bold text-[#1C1917]">{custom.title}</div>
                          <p className="text-[#78716C] leading-relaxed text-[11px]">
                            {custom.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: PACKING CHECKLIST */}
            {activeTab === "packing" && (
              <div className="space-y-6">
                <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-[#1C1917]">
                        Pre-Departure Packing Checklist
                      </h3>
                      <p className="text-xs sm:text-sm text-[#78716C] mt-1">
                        Tailored essentials for traveling to {countryName}, including power adapters,
                        clothing norms, and transit cards.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#E8F0EC] text-[#2D5A46] border border-[#2D5A46]/20">
                        {packingPercentage}% Completed ({completedItems}/{totalItems})
                      </span>
                      <button
                        onClick={() => {
                          const all: Record<string, boolean> = {};
                          data.essentialItems?.forEach((g) =>
                            g.items.forEach((item) => (all[item] = true))
                          );
                          setCheckedItems(all);
                        }}
                        className="text-xs px-3.5 py-1.5 rounded-full border border-[#E8E2D5] bg-[#FAF7F2] hover:bg-[#F3EFE6] font-medium transition-colors text-[#1C1917]"
                      >
                        Check all
                      </button>
                      <button
                        onClick={() => setCheckedItems({})}
                        className="text-xs px-3.5 py-1.5 rounded-full border border-[#E8E2D5] bg-[#FAF7F2] hover:bg-[#F3EFE6] font-medium transition-colors text-[#78716C]"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#E8E2D5] rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      className="bg-[#2D5A46] h-2.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${packingPercentage}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Packing Categories */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {data.essentialItems?.map((group) => (
                      <div
                        key={group.title}
                        className="bg-[#FAF7F2] border border-[#E8E2D5] rounded-2xl p-5 space-y-3"
                      >
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#B45309] flex items-center gap-1.5">
                          <Luggage className="h-4 w-4" />
                          <span>{group.title}</span>
                        </h4>

                        <div className="space-y-2">
                          {group.items.map((item) => {
                            const isChecked = !!checkedItems[item];
                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => toggleItem(item)}
                                className={`w-full text-left flex items-start gap-3 p-3 rounded-xl text-xs transition-colors border ${
                                  isChecked
                                    ? "bg-[#E8F0EC]/70 border-[#2D5A46]/30 text-[#78716C] line-through"
                                    : "bg-[#FFFFFF] hover:bg-[#F3EFE6] border-[#E8E2D5] text-[#1C1917]"
                                }`}
                              >
                                <span
                                  className={`mt-0.5 h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                    isChecked
                                      ? "bg-[#2D5A46] border-[#2D5A46] text-white"
                                      : "border-[#D6CEBF] bg-white"
                                  }`}
                                >
                                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                                </span>
                                <span className="leading-relaxed">{item}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CULTURE & ETIQUETTE */}
            {activeTab === "culture" && (
              <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#1C1917]">
                    Customs & Taboos in {countryName}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#78716C] mt-1">
                    Respectful social guidelines to help you navigate daily interactions, restaurants,
                    and religious sites like a seasoned traveler.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.localCustoms?.map((custom, idx) => (
                    <div
                      key={idx}
                      className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8E2D5] space-y-2 text-xs"
                    >
                      <div className="font-bold text-sm text-[#1C1917] flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#D97706]" />
                        <span>{custom.title}</span>
                      </div>
                      <p className="text-[#78716C] leading-relaxed text-xs">
                        {custom.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: SAFETY & SCAMS */}
            {activeTab === "safety" && (
              <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#1C1917]">
                    Safety Protocol & Common Tourist Scams
                  </h3>
                  <p className="text-xs sm:text-sm text-[#78716C] mt-1">
                    Stay vigilant with verified alerts on frequent travel traps and general security best practices.
                  </p>
                </div>

                <div className="space-y-4">
                  {data.safetyTips?.map((tip, idx) => (
                    <div
                      key={idx}
                      className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8E2D5] flex items-start gap-4 text-xs"
                    >
                      <div className="p-2 rounded-xl bg-[#FEE2E2] text-[#991B1B] shrink-0 mt-0.5">
                        <ShieldAlert className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-[#1C1917]">{tip.title}</div>
                        <p className="text-[#78716C] leading-relaxed text-xs">
                          {tip.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: PHRASES */}
            {activeTab === "phrases" && (
              <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#1C1917]">
                      Essential Local Phrases
                    </h3>
                    <p className="text-xs sm:text-sm text-[#78716C] mt-1">
                      Basic conversational phrases with pronunciation keys. Click any phrase to copy it.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
                    <input
                      type="text"
                      placeholder="Search phrases or words…"
                      value={phraseSearch}
                      onChange={(e) => setPhraseSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] focus:border-[#B45309] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredPhrases.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleCopy(item.phrase, `phrase-${idx}`)}
                      className="bg-[#FAF7F2] hover:bg-[#F3EFE6] cursor-pointer p-4 rounded-2xl border border-[#E8E2D5] flex items-center justify-between transition-colors group shadow-xs"
                    >
                      <div>
                        <div className="text-sm font-bold text-[#1C1917]">{item.phrase}</div>
                        <div className="text-xs text-[#B45309] font-mono mt-0.5">
                          /{item.phonetic}/
                        </div>
                        <div className="text-xs text-[#78716C] mt-1">{item.translation}</div>
                      </div>

                      <button
                        type="button"
                        className="p-1.5 rounded-lg text-[#78716C] group-hover:text-[#1C1917] transition-colors"
                        title="Copy phrase"
                      >
                        {copiedText === `phrase-${idx}` ? (
                          <Check className="h-4 w-4 text-[#2D5A46]" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: PRACTICAL & EMERGENCY */}
            {activeTab === "practical" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Emergency Numbers */}
                  <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-3xl p-6 space-y-4 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#B45309] uppercase tracking-wider">
                      <PhoneCall className="h-4 w-4" />
                      <span>Emergency Hotlines</span>
                    </div>

                    {data.emergencyInfo ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5]">
                            <div className="text-[10px] text-[#78716C] uppercase font-bold">Police</div>
                            <div className="text-2xl font-mono font-bold text-[#1C1917] mt-1">
                              {data.emergencyInfo.police}
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5]">
                            <div className="text-[10px] text-[#78716C] uppercase font-bold">Ambulance / Fire</div>
                            <div className="text-2xl font-mono font-bold text-[#1C1917] mt-1">
                              {data.emergencyInfo.ambulance}
                            </div>
                          </div>
                        </div>

                        {data.emergencyInfo.embassy && (
                          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs text-[#78716C] leading-relaxed">
                            <span className="font-bold text-[#1C1917]">Consular & Embassy Contact: </span>
                            <span>{data.emergencyInfo.embassy}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-[#78716C]">Standard 112 international emergency hotline applies.</p>
                    )}
                  </div>

                  {/* Currency Rules */}
                  <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-3xl p-6 space-y-4 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#2D5A46] uppercase tracking-wider">
                      <Coins className="h-4 w-4" />
                      <span>Financial & Tipping Customs</span>
                    </div>

                    {data.currencyInfo?.tips ? (
                      <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D5] text-xs text-[#78716C] space-y-2 leading-relaxed">
                        {data.currencyInfo.tips.split("\n").map((line, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-[#B45309] font-bold">•</span>
                            <span>{line.replace(/^[•\-\*]\s*/, "")}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#78716C]">Standard electronic card payments accepted.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
