import { NextRequest, NextResponse } from "next/server";
import { getPackingChecklist, savePackingChecklist } from "@/lib/trips-db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dest = searchParams.get("dest") || searchParams.get("destination") || "NRT";

    const checkedItems = getPackingChecklist(dest);

    return NextResponse.json({
      destination: dest.toUpperCase(),
      checkedItems,
    });
  } catch (err) {
    console.error("[api/packing-checklist] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch packing checklist" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const destination = body.destination || body.dest || "NRT";
    const checkedItems = body.checkedItems || {};

    const saved = savePackingChecklist(destination, checkedItems);

    return NextResponse.json({
      success: true,
      destination: destination.toUpperCase(),
      checkedItems: saved,
    });
  } catch (err) {
    console.error("[api/packing-checklist] POST error:", err);
    return NextResponse.json(
      { error: "Failed to save packing checklist" },
      { status: 500 }
    );
  }
}
