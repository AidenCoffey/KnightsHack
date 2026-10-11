import { describe, it, expect } from "vitest";
import { FALLBACK_AIRPORTS } from "@/lib/airport-data";

describe("SuitcaseTransition destination & airport resolution", () => {
  it("resolves city name correctly for fallback airports", () => {
    const zrh = FALLBACK_AIRPORTS.find((a) => a.iata.toUpperCase() === "ZRH");
    expect(zrh?.city).toBe("Zurich");

    const nrt = FALLBACK_AIRPORTS.find((a) => a.iata.toUpperCase() === "NRT");
    expect(nrt?.city).toBe("Tokyo");

    const cdg = FALLBACK_AIRPORTS.find((a) => a.iata.toUpperCase() === "CDG");
    expect(cdg?.city).toBe("Paris");
  });

  it("safely extracts dest and origin from various travel-readiness URLs", () => {
    const extractParams = (urlStr: string) => {
      const parsed = new URL(urlStr, "http://localhost");
      const dest = parsed.searchParams.get("dest")?.toUpperCase() || "ZRH";
      const origin = parsed.searchParams.get("origin")?.toUpperCase() || "";
      const match = FALLBACK_AIRPORTS.find((a) => a.iata.toUpperCase() === dest);
      return {
        dest,
        city: match?.city || dest,
        origin,
      };
    };

    const res1 = extractParams("/travel-readiness");
    expect(res1.dest).toBe("ZRH");
    expect(res1.city).toBe("Zurich");

    const res2 = extractParams("/travel-readiness?dest=CDG&origin=MCO");
    expect(res2.dest).toBe("CDG");
    expect(res2.city).toBe("Paris");
    expect(res2.origin).toBe("MCO");

    const res3 = extractParams("/travel-readiness?dest=HND");
    expect(res3.dest).toBe("HND");
    expect(res3.city).toBe("Tokyo");
  });
});
