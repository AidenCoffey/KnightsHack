import type { GroundLeg, GroundMode } from "@/types";

export interface GroundProvider {
  getLeg(fromCity: string, toAirport: string): Promise<GroundLeg | null>;
}
