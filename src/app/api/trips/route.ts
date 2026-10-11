import { NextRequest, NextResponse } from "next/server";
import { getAllTrips, saveTrip } from "@/lib/trips-db";
import type { CreateTripInput } from "@/types/trips";

export const runtime = "nodejs";

export async function GET() {
  try {
    const trips = getAllTrips();
    return NextResponse.json({
      trips,
      total: trips.length,
    });
  } catch (err) {
    console.error("[api/trips] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch saved trips" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateTripInput;

    if (!body.originIata || !body.destinationIata || !body.departDate) {
      return NextResponse.json(
        { error: "Missing required trip fields (originIata, destinationIata, departDate)" },
        { status: 400 }
      );
    }

    const saved = saveTrip(body);

    return NextResponse.json(
      {
        success: true,
        trip: saved,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api/trips] POST error:", err);
    return NextResponse.json(
      { error: "Failed to save trip to database" },
      { status: 500 }
    );
  }
}
