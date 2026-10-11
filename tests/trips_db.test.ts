import { describe, it, expect, beforeEach } from "vitest";
import {
  getAllTrips,
  getTripById,
  saveTrip,
  deleteTrip,
  updateTripNotes,
  resolveDestinationCulturalInfo,
  getPackingChecklist,
  savePackingChecklist,
} from "../src/lib/trips-db";

describe("trips-db backend database", () => {
  const sampleTripInput = {
    originIata: "MCO",
    originCity: "Orlando",
    destinationIata: "NRT",
    destinationCity: "Tokyo",
    destinationCountry: "Japan",
    departDate: "2026-11-15",
    returnDate: "2026-11-28",
    tripType: "round" as const,
    farePrice: 650,
    currency: "USD",
    totalCost: 710,
    savingsVsHome: 240,
    transferMode: "train",
    transferPrice: 60,
    transferDurationHours: 1.5,
    airline: "Zipair",
    bookingUrl: "https://venture.travel/book/test",
    notes: "Must visit Akihabara & try ramen!",
  };

  it("resolves cultural info and languages for a destination", () => {
    const info = resolveDestinationCulturalInfo("NRT");
    expect(info).toBeDefined();
    expect(info.countryName).toBe("Japan");
    expect(info.languages?.length).toBeGreaterThan(0);
    expect(info.usefulPhrases?.length).toBeGreaterThan(0);
  });

  it("saves a new trip with destination language and cultural information embedded", () => {
    const saved = saveTrip(sampleTripInput);
    expect(saved.id).toBeDefined();
    expect(saved.originIata).toBe("MCO");
    expect(saved.destinationIata).toBe("NRT");
    expect(saved.culturalInfo).toBeDefined();
    expect(saved.culturalInfo?.countryName).toBe("Japan");
    expect(saved.culturalInfo?.usefulPhrases?.length).toBeGreaterThan(0);
    expect(saved.culturalInfo?.localCustoms?.length).toBeGreaterThan(0);
    expect(saved.notes).toBe("Must visit Akihabara & try ramen!");

    // Verify it can be retrieved by id
    const found = getTripById(saved.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(saved.id);
    expect(found?.destinationCity).toBe("Tokyo");
    expect(found?.culturalInfo?.countryName).toBe("Japan");

    // Clean up
    deleteTrip(saved.id);
  });

  it("updates personal notes on a saved trip", () => {
    const saved = saveTrip({
      ...sampleTripInput,
      destinationIata: "ZRH",
      destinationCity: "Zurich",
    });

    const updated = updateTripNotes(saved.id, "Pack hiking boots and Swiss adapter!");
    expect(updated).not.toBeNull();
    expect(updated?.notes).toBe("Pack hiking boots and Swiss adapter!");

    const refreshed = getTripById(saved.id);
    expect(refreshed?.notes).toBe("Pack hiking boots and Swiss adapter!");

    deleteTrip(saved.id);
  });

  it("lists all saved trips", () => {
    const trip1 = saveTrip({ ...sampleTripInput, destinationIata: "CDG" });
    const trip2 = saveTrip({ ...sampleTripInput, destinationIata: "FCO" });

    const all = getAllTrips();
    expect(all.length).toBeGreaterThanOrEqual(2);
    expect(all.some((t) => t.id === trip1.id)).toBe(true);
    expect(all.some((t) => t.id === trip2.id)).toBe(true);

    deleteTrip(trip1.id);
    deleteTrip(trip2.id);
  });

  it("deletes a saved trip", () => {
    const saved = saveTrip(sampleTripInput);
    expect(getTripById(saved.id)).not.toBeNull();

    const result = deleteTrip(saved.id);
    expect(result).toBe(true);
    expect(getTripById(saved.id)).toBeNull();
  });

  it("persists and retrieves packing checklist items in database", () => {
    const testItems = {
      "Slip-on shoes": true,
      "Type A power adapter": true,
      "Passport": false,
    };

    const saved = savePackingChecklist("NRT", testItems);
    expect(saved["Slip-on shoes"]).toBe(true);

    const retrieved = getPackingChecklist("NRT");
    expect(retrieved["Slip-on shoes"]).toBe(true);
    expect(retrieved["Type A power adapter"]).toBe(true);
    expect(retrieved["Passport"]).toBe(false);
  });
});
