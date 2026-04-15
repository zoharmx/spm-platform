import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Basic validation
    if (!body.name || !body.phone || !body.address || !body.serviceType || !body.description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getAdminDb();

    // Save lead to Firestore
    const leadRef = db.collection("leads").doc();
    await leadRef.set({
      ...body,
      id: leadRef.id,
      source: body.source ?? "landing-page",
      status: "nuevo",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Also create a service ticket
    const ticketCount = await db.collection("service_tickets").count().get();
    const ticketNumber = String((ticketCount.data().count ?? 0) + 1).padStart(4, "0");
    const ticketId = `SPM-${ticketNumber}`;

    const ticketRef = db.collection("service_tickets").doc();
    await ticketRef.set({
      id: ticketRef.id,
      ticketId,
      status: "lead-recibido",
      clientName: `${body.name}`,
      clientPhone: body.phone,
      clientEmail: body.email,
      serviceType: body.serviceType,
      serviceDescription: body.description,
      serviceAddress: { street: body.address },
      motoBrand: body.motoBrand,
      motoYear: body.motoYear,
      source: body.source ?? "landing-page",
      leadId: leadRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      ticketId,
      message: "Cotización enviada correctamente",
    });
  } catch (error) {
    console.error("Quote API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
