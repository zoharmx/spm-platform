/**
 * POST /api/voice/outbound
 *
 * Places an outbound call to the client via Twilio.
 * Used for high-priority status updates (mechanic en-camino, service completado).
 *
 * Body: {
 *   to:          string  — Client phone
 *   ticketId:    string
 *   clientName:  string
 *   status:      ServiceTicketStatus
 *   mechanicName?: string
 *   paymentLink?:  string
 * }
 */

import { NextRequest, NextResponse }        from "next/server";
import { placeOutboundCall }                from "@/lib/notifications/voice";
import { getVoiceScript }                   from "@/lib/notifications/messages";
import { getAdminAuth }                     from "@/lib/firebase-admin";
import { createRateLimiter, getClientIp }  from "@/lib/rate-limit";
import type { ServiceTicketStatus }         from "@/types";

// 5 calls / minute per IP (voice is expensive — tight limit)
const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

export async function POST(req: NextRequest) {
  const rl = limiter(getClientIp(req));
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const sessionCookie = req.cookies.get("__session")?.value;
  if (sessionCookie) {
    try { await getAdminAuth().verifySessionCookie(sessionCookie, true); }
    catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  } else if (!req.cookies.get("__auth")?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    to: string;
    ticketId: string;
    clientName: string;
    status: ServiceTicketStatus;
    mechanicName?: string;
    paymentLink?: string;
  };

  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { to, ticketId, clientName, status } = body;
  if (!to || !ticketId || !clientName || !status) {
    return NextResponse.json({ error: "Missing required: to, ticketId, clientName, status" }, { status: 400 });
  }

  const script = getVoiceScript(status, {
    clientName,
    ticketId,
    mechanicName: body.mechanicName,
    paymentLink:  body.paymentLink,
  });

  const result = await placeOutboundCall({ to, message: script, ticketId });

  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
