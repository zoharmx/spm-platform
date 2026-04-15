import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const db = getAdminDb();

    // Query by ticketId field
    const snap = await db
      .collection("service_tickets")
      .where("ticketId", "==", ticketId.toUpperCase())
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const doc = snap.docs[0];
    const data = doc.data();

    // Return only public-safe fields
    return NextResponse.json({
      ticketId: data.ticketId,
      status: data.status,
      clientName: data.clientName ?? "Cliente",
      mechanicName: data.mechanicName,
      mechanicPhone: data.status === "en-camino" || data.status === "en-servicio"
        ? data.mechanicPhone
        : undefined,
      serviceType: data.serviceType,
      serviceAddress: {
        street: data.serviceAddress?.street,
        colonia: data.serviceAddress?.colonia,
        city: data.serviceAddress?.city,
      },
      estimatedCost: data.estimatedCost,
      createdAt: data.createdAt?.toDate?.()?.toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
    });
  } catch (error) {
    console.error("Tracking API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
