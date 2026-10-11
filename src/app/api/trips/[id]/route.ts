import { NextRequest, NextResponse } from "next/server";
import { getTripById, deleteTrip, updateTripNotes } from "@/lib/trips-db";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const trip = getTripById(params.id);
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }
    return NextResponse.json({ trip });
  } catch (err) {
    console.error("[api/trips/[id]] GET error:", err);
    return NextResponse.json({ error: "Failed to retrieve trip" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = deleteTrip(params.id);
    if (!success) {
      return NextResponse.json({ error: "Trip not found or already deleted" }, { status: 404 });
    }
    return NextResponse.json({ success: true, id: params.id });
  } catch (err) {
    console.error("[api/trips/[id]] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete trip" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const notes = typeof body.notes === "string" ? body.notes : "";
    const updated = updateTripNotes(params.id, notes);
    if (!updated) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, trip: updated });
  } catch (err) {
    console.error("[api/trips/[id]] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update trip notes" }, { status: 500 });
  }
}
