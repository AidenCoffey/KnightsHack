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
  });
});
