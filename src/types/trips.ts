import type { CountryCulturalInfo } from "./cultural";

export interface SavedTrip {
  id: string;
  createdAt: string;
  originIata: string;
  originCity: string;
  destinationIata: string;
  destinationCity: string;
  destinationCountry: string;
  departDate: string;
  returnDate?: string | null;
  tripType: "round" | "oneway";
  passengers?: number;
  farePrice?: number;
  currency: string;
  totalCost?: number;
  savingsVsHome?: number;
  transferMode?: string;
  transferPrice?: number;
  transferDurationHours?: number;
  airline?: string;
  bookingUrl?: string | null;
  notes?: string;
  culturalInfo?: CountryCulturalInfo;
}

export interface CreateTripInput {
  id?: string;
  originIata: string;
  originCity?: string;
  destinationIata: string;
  destinationCity?: string;
  destinationCountry?: string;
  departDate: string;
  returnDate?: string | null;
  tripType?: "round" | "oneway";
  passengers?: number;
  farePrice?: number;
  currency?: string;
  totalCost?: number;
  savingsVsHome?: number;
  transferMode?: string;
  transferPrice?: number;
  transferDurationHours?: number;
  airline?: string;
  bookingUrl?: string | null;
  notes?: string;
  culturalInfo?: CountryCulturalInfo;
}
