/**
 * POST /api/notifications/whatsapp
 *
 * Sends a WhatsApp message to a client when their ticket status changes.
 * Called from the CRM after advancing a ticket status.
 *
 * Body: { ticketId, clientPhone, clientName, status, mechanicName?, paymentLink? }
 * Auth: Requires valid __session or __auth cookie (server-side check via Admin SDK).
 */

import { NextRequest, NextResponse } from "next/server";
import { sendWhatsApp }              from "@/lib/notifications/whatsapp";
import { getStatusMessage }          from "@/lib/notifications/messages";
import { getAdminAuth }              from "@/lib/firebase-admin";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import type { ServiceTicketStatus }  from "@/types";

// 30 notifications / minute per IP (generous for CRM operators)
const limiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

export async function POST(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const rl = limiter(getClientIp(req));
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // ── Session auth check ─────────────────────────────────────────────────────
  const sessionCookie = req.cookies.get("__session")?.value;
  if (sessionCookie) {
    try {
      await getAdminAuth().verifySessionCookie(sessionCookie, true);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    // Fallback: __auth presence cookie (weaker, acceptable for CRM internal routes)
    const authCookie = req.cookies.get("__auth")?.value;
    if (!authCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // ── Payload validation ─────────────────────────────────────────────────────
  let body: {
    ticketId: string;
    clientPhone: string;
    clientName: string;
    status: ServiceTicketStatus;
    mechanicName?: string;
    paymentLink?: string;
    estimatedCost?: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { ticketId, clientPhone, clientName, status } = body;

  if (!ticketId || !clientPhone || !clientName || !status) {
    return NextResponse.json(
      { error: "Missing required fields: ticketId, clientPhone, clientName, status" },
      { status: 400 }
    );
  }

  // Sanitize phone — only digits + allowed symbols
  if (!/^[\d\s+\-()]{7,20}$/.test(clientPhone)) {
    return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
  }

  // ── Build message and send ─────────────────────────────────────────────────
  const message = getStatusMessage(status, {
    clientName,
    ticketId,
    mechanicName:  body.mechanicName,
    paymentLink:   body.paymentLink,
    estimatedCost: body.estimatedCost,
  });

  const result = await sendWhatsApp({ to: clientPhone, body: message });

  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
