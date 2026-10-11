import { describe, it, expect } from "vitest";
import { GET as getTrips, POST as postTrip } from "../src/app/api/trips/route";
import {
  GET as getTripById,
  DELETE as deleteTripById,
  PATCH as patchTripById,
} from "../src/app/api/trips/[id]/route";
import { NextRequest } from "next/server";

describe("trips API route endpoints", () => {
  it("creates a trip via POST /api/trips and returns 201 with cultural info embedded", async () => {
    const payload = {
      originIata: "MCO",
      originCity: "Orlando",
      destinationIata: "FCO",
      destinationCity: "Rome",
      departDate: "2026-12-10",
      returnDate: "2026-12-20",
      tripType: "round",
      farePrice: 580,
      currency: "USD",
      notes: "Trip to the Colosseum",
    };

    const req = new NextRequest("http://localhost:3000/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await postTrip(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.trip.id).toBeDefined();
    expect(data.trip.originIata).toBe("MCO");
    expect(data.trip.destinationIata).toBe("FCO");
    expect(data.trip.culturalInfo?.countryName).toBe("Italy");
    expect(data.trip.culturalInfo?.usefulPhrases?.length).toBeGreaterThan(0);

    const tripId = data.trip.id;

    // Test GET /api/trips/[id]
    const getReq = new NextRequest(`http://localhost:3000/api/trips/${tripId}`);
    const getRes = await getTripById(getReq, { params: { id: tripId } });
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.trip.id).toBe(tripId);

    // Test PATCH /api/trips/[id]
    const patchReq = new NextRequest(`http://localhost:3000/api/trips/${tripId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: "Updated: Colosseum tour booked for 10am" }),
    });
    const patchRes = await patchTripById(patchReq, { params: { id: tripId } });
    expect(patchRes.status).toBe(200);
    const patchData = await patchRes.json();
    expect(patchData.trip.notes).toBe("Updated: Colosseum tour booked for 10am");

    // Test DELETE /api/trips/[id]
    const delReq = new NextRequest(`http://localhost:3000/api/trips/${tripId}`, {
      method: "DELETE",
    });
    const delRes = await deleteTripById(delReq, { params: { id: tripId } });
    expect(delRes.status).toBe(200);
    const delData = await delRes.json();
    expect(delData.success).toBe(true);
  });

  it("returns 400 when required fields are missing on POST", async () => {
    const req = new NextRequest("http://localhost:3000/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await postTrip(req);
    expect(res.status).toBe(400);
  });

  it("lists all saved trips on GET /api/trips", async () => {
    const res = await getTrips();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.trips)).toBe(true);
    expect(typeof data.total).toBe("number");
  });

  it("saves and retrieves packing checklist via /api/packing-checklist", async () => {
    const { GET: getChecklist, POST: postChecklist } = await import("../src/app/api/packing-checklist/route");

    const postReq = new NextRequest("http://localhost:3000/api/packing-checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destination: "NRT",
        checkedItems: {
          "Slip-on shoes": true,
          "Passport": true,
        },
      }),
    });

    const postRes = await postChecklist(postReq);
    expect(postRes.status).toBe(200);
    const postData = await postRes.json();
    expect(postData.success).toBe(true);
    expect(postData.checkedItems["Slip-on shoes"]).toBe(true);

    const getReq = new NextRequest("http://localhost:3000/api/packing-checklist?dest=NRT");
    const getRes = await getChecklist(getReq);
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.destination).toBe("NRT");
    expect(getData.checkedItems["Slip-on shoes"]).toBe(true);
    expect(getData.checkedItems["Passport"]).toBe(true);
  });
});

