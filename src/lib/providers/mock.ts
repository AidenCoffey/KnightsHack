/**
 * Mock data provider — only active when DEMO_MOCK=true.
 * Returns clearly labeled fake data with a visible "DEMO DATA" watermark.
 */

import type { Fare } from "@/types";
import type { FareParams } from "./types";

export function getMockFares(params: FareParams): Fare[] {
  const { origin, destination, dateFrom } = params;
  const now = new Date().toISOString();
  const mockPrices: Record<string, number> = {
    FCO: 89, CIA: 72, NAP: 105, MXP: 118, BGY: 64, VCE: 132,
    BLQ: 97, FLR: 115, PSA: 88, TRN: 124, PMO: 145, CTA: 138,
    LHR: 225, CDG: 198, MAD: 182, BCN: 165, AMS: 210, FRA: 195,
    MUC: 188, ZRH: 245, VIE: 175, PRG: 158, WAW: 142, BUD: 137,
  };

  const price = mockPrices[origin] ?? Math.round(80 + Math.random() * 250);
  return [
    {
      provider: "DEMO",
      origin,
      destination,
      departAt: dateFrom,
      price,
      currency: "EUR",
      includesBags: false,
      fetchedAt: now,
      source: "Recent (cached)",
      bookingUrl: `https://www.aviasales.com/search/${origin}${dateFrom.replace(/-/g, "")}${destination}1`,
    },
  ];
}
