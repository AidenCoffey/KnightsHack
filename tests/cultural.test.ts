import { describe, it, expect } from "vitest";
import { resolveCountryKey, CULTURAL_FALLBACK_DATA } from "@/lib/cultural-fallback";
import { getCountryFlag, getCountryNameFromCode } from "@/lib/cultural-utils";

describe("Cultural Intelligence & Resolver", () => {
  it("resolves airport codes to country keys correctly", () => {
    expect(resolveCountryKey("NRT")).toBe("JP");
    expect(resolveCountryKey("HND")).toBe("JP");
    expect(resolveCountryKey("FCO")).toBe("IT");
    expect(resolveCountryKey("LHR")).toBe("GB");
    expect(resolveCountryKey("CDG")).toBe("FR");
    expect(resolveCountryKey("JFK")).toBe("US");
  });

  it("resolves alpha-3 codes to alpha-2", () => {
    expect(resolveCountryKey("JPN")).toBe("JP");
    expect(resolveCountryKey("ITA")).toBe("IT");
    expect(resolveCountryKey("GBR")).toBe("GB");
  });

  it("resolves country names to alpha-2", () => {
    expect(resolveCountryKey("Japan")).toBe("JP");
    expect(resolveCountryKey("Italy")).toBe("IT");
    expect(resolveCountryKey("United Kingdom")).toBe("GB");
  });

  it("contains rich fallback data for Japan from TravelWolf API", () => {
    const japanData = CULTURAL_FALLBACK_DATA["JP"];
    expect(japanData).toBeDefined();
    expect(japanData.countryName).toBe("Japan");
    expect(japanData.currencyInfo?.code).toBe("JPY");
    expect(japanData.emergencyInfo?.police).toBe("110");
    expect(japanData.emergencyInfo?.ambulance).toBe("119");
    expect(japanData.essentialItems?.length).toBeGreaterThan(0);
    expect(japanData.localCustoms?.length).toBeGreaterThan(0);
    expect(japanData.usefulPhrases?.length).toBeGreaterThan(0);
  });

  it("generates correct unicode country flags and names", () => {
    expect(getCountryFlag("JP")).toBe("🇯🇵");
    expect(getCountryFlag("IT")).toBe("🇮🇹");
    expect(getCountryFlag("GB")).toBe("🇬🇧");
    expect(getCountryFlag("FR")).toBe("🇫🇷");
    expect(getCountryFlag("JFK")).toBe("🇺🇸");
    expect(getCountryFlag("NRT")).toBe("🇯🇵");

    expect(getCountryNameFromCode("JP")).toBe("Japan");
    expect(getCountryNameFromCode("IT")).toBe("Italy");
    expect(getCountryNameFromCode("GB")).toBe("United Kingdom");
    expect(getCountryNameFromCode("JFK")).toBe("United States");
    expect(getCountryNameFromCode("NRT")).toBe("Japan");
    expect(getCountryNameFromCode("PRG")).toBe("Czech Republic");
    expect(getCountryNameFromCode("BUD")).toBe("Hungary");
    expect(getCountryFlag("PRG")).toBe("🇨🇿");
    expect(getCountryFlag("HU")).toBe("🇭🇺");
  });

  it("contains rich, comprehensive packing checklists (all 5 categories, 35+ items) for Czech Republic, Thailand, and all countries", () => {
    const czechData = CULTURAL_FALLBACK_DATA["CZ"];
    expect(czechData).toBeDefined();
    expect(czechData.countryName).toBe("Czech Republic");
    expect(czechData.essentialItems).toBeDefined();
    expect(czechData.essentialItems!.length).toBe(5);
    const czTotalItems = czechData.essentialItems!.reduce((acc, g) => acc + g.items.length, 0);
    expect(czTotalItems).toBe(45);

    const thaiData = CULTURAL_FALLBACK_DATA["TH"];
    expect(thaiData).toBeDefined();
    expect(thaiData.countryName).toBe("Thailand");
    expect(thaiData.essentialItems!.length).toBe(5);
    const thTotalItems = thaiData.essentialItems!.reduce((acc, g) => acc + g.items.length, 0);
    expect(thTotalItems).toBe(43);

    // Verify all countries in CULTURAL_FALLBACK_DATA have comprehensive categories and items
    for (const [code, dossier] of Object.entries(CULTURAL_FALLBACK_DATA)) {
      expect(dossier.essentialItems, `${code} missing essentialItems`).toBeDefined();
      expect(dossier.essentialItems!.length, `${code} should have 5 categories`).toBeGreaterThanOrEqual(5);
      const total = dossier.essentialItems!.reduce((acc, g) => acc + g.items.length, 0);
      expect(total, `${code} should have at least 35 items`).toBeGreaterThanOrEqual(35);
    }
  });
});
