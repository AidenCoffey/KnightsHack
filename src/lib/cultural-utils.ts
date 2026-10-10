// Helper utilities for country flags and cultural information
import { resolveCountryKey } from "./cultural-fallback";

const COUNTRY_FLAGS: Record<string, string> = {
  JP: "🇯🇵",
  IT: "🇮🇹",
  GB: "🇬🇧",
  FR: "🇫🇷",
  ES: "🇪🇸",
  US: "🇺🇸",
  DE: "🇩🇪",
  NL: "🇳🇱",
  PT: "🇵🇹",
  CH: "🇨🇭",
  AT: "🇦🇹",
  CZ: "🇨🇿",
  GR: "🇬🇷",
  TR: "🇹🇷",
  AE: "🇦🇪",
  SG: "🇸🇬",
  TH: "🇹🇭",
  KR: "🇰🇷",
  AU: "🇦🇺",
  IE: "🇮🇪",
  CA: "🇨🇦",
  MX: "🇲🇽",
};

export function getCountryFlag(identifier?: string): string {
  if (!identifier) return "🌐";
  const resolved = resolveCountryKey(identifier).toUpperCase();
  if (COUNTRY_FLAGS[resolved]) {
    return COUNTRY_FLAGS[resolved];
  }
  return "🌐";
}

export function getCountryNameFromCode(identifier?: string): string {
  if (!identifier) return "Destination";
  const resolved = resolveCountryKey(identifier).toUpperCase();
  const map: Record<string, string> = {
    JP: "Japan",
    IT: "Italy",
    GB: "United Kingdom",
    FR: "France",
    ES: "Spain",
    US: "United States",
    DE: "Germany",
    NL: "Netherlands",
    PT: "Portugal",
    CH: "Switzerland",
    AT: "Austria",
    CZ: "Czech Republic",
    GR: "Greece",
    TR: "Turkey",
    AE: "United Arab Emirates",
    SG: "Singapore",
    TH: "Thailand",
    KR: "South Korea",
    AU: "Australia",
    IE: "Ireland",
    CA: "Canada",
    MX: "Mexico",
  };
  return map[resolved] || map[identifier.toUpperCase()] || identifier;
}
