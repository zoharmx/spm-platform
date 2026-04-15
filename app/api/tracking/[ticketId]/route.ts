import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const TRACKING_RATE_LIMIT = 30; // requests per window
const TRACKING_WINDOW_MS = 60_000; // 1 minute

// Strict ticket ID format: SPM- followed by 1–8 digits
const TICKET_ID_RE = /^SPM-\d{1,8}$/i;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  // Rate limiting — prevents ticket enumeration attacks
  const ip = getClientIp(req);
  const rl = rateLimit(`tracking:${ip}`, TRACKING_RATE_LIMIT, TRACKING_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  try {
    const { ticketId } = await params;
    const normalizedId = ticketId.toUpperCase();

    // Validate format before hitting the database
    if (!TICKET_ID_RE.test(normalizedId)) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const db = getAdminDb();

    const snap = await db
      .collection("service_tickets")
      .where("ticketId", "==", normalizedId)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const data = snap.docs[0].data();

    // Expose mechanic phone only when actively dispatched
    const showMechanicPhone =
      data.status === "en-camino" || data.status === "en-servicio";

    return NextResponse.json({
      ticketId: data.ticketId,
      status: data.status,
      clientName: data.clientName ?? "Cliente",
      mechanicName: data.mechanicName,
      mechanicPhone: showMechanicPhone ? data.mechanicPhone : undefined,
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
    console.error("[api/tracking] error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
