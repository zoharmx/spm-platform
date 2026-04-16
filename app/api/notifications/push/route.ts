/**
 * POST /api/notifications/push
 *
 * Send a FCM push notification to one or multiple tokens.
 * Tokens are stored in Firestore users/{uid}.fcmToken (string or string[]).
 *
 * Body: { tokens: string[], title, body, clickUrl?, data? }
 *   OR: { ticketId, status, clientName, tokens }  — auto-builds copy from status
 */

import { NextRequest, NextResponse } from "next/server";
import { sendPushMulti }             from "@/lib/notifications/push";
import { getPushCopy }               from "@/lib/notifications/messages";
import { getAdminAuth }              from "@/lib/firebase-admin";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import type { ServiceTicketStatus }  from "@/types";

const limiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

export async function POST(req: NextRequest) {
  const rl = limiter(getClientIp(req));
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  // Auth check
  const sessionCookie = req.cookies.get("__session")?.value;
  if (sessionCookie) {
    try { await getAdminAuth().verifySessionCookie(sessionCookie, true); }
    catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  } else if (!req.cookies.get("__auth")?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    tokens: string[];
    title?: string;
    body?: string;
    ticketId?: string;
    status?: ServiceTicketStatus;
    clientName?: string;
    clickUrl?: string;
    data?: Record<string, string>;
  };

  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { tokens } = body;
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return NextResponse.json({ error: "tokens array is required" }, { status: 400 });
  }

  // Auto-build title/body from ticket status if provided
  let title = body.title ?? "SanPedroMotoCare";
  let pushBody = body.body ?? "";

  if (body.status && body.clientName && body.ticketId) {
    const copy = getPushCopy(body.status, {
      clientName:  body.clientName,
      ticketId:    body.ticketId,
    });
    title    = copy.title;
    pushBody = copy.body;
  }

  if (!pushBody) {
    return NextResponse.json({ error: "body or (status + clientName + ticketId) required" }, { status: 400 });
  }

  const sent = await sendPushMulti(tokens, {
    title,
    body: pushBody,
    clickUrl: body.clickUrl ?? "/portal",
    data: body.data,
  });

  return NextResponse.json({ sent, total: tokens.length });
}
