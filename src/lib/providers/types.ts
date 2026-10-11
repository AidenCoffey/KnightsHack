import { z } from "zod";
import type { Fare, FareSource } from "@/types";

// Zod schema for a validated fare
export const FareSchema = z.object({
  provider: z.string(),
  origin: z.string().length(3),
  destination: z.string().length(3),
  departAt: z.string(),
  returnAt: z.string().optional(),
  price: z.number().positive(),
  currency: z.string().length(3),
  includesBags: z.boolean(),
  fetchedAt: z.string(),
  source: z.union([
    z.literal("Live"),
    z.literal("Recent (cached)"),
    z.string().startsWith("Last seen"),
  ]) as z.ZodType<FareSource>,
  bookingUrl: z.string().url().optional(),
});

export type ValidatedFare = z.infer<typeof FareSchema>;

export interface FareProvider {
  name: string;
  getFares(params: FareParams): Promise<Fare[]>;
}

export interface FareParams {
  origin: string;     // IATA
  destination: string; // IATA
  dateFrom: string;   // YYYY-MM-DD
  dateTo?: string;     // YYYY-MM-DD (optional for one-way)
  tripType?: "round" | "oneway";
  passengers?: number;
  currency: string;
}
