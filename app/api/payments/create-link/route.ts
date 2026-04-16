/**
 * POST /api/payments/create-link
 *
 * Creates a Stripe Checkout Session for a completed service ticket,
 * saves the URL to Firestore, and optionally sends it via WhatsApp.
 *
 * Body: {
 *   ticketId:           string   — SPM-XXXX
 *   clientName:         string
 *   clientPhone:        string
 *   serviceDescription: string
 *   serviceType:        string
 *   amountMXN:          number   — Final cost in MXN
 *   sendWhatsApp?:      boolean  — Default true
 * }
 *
 * Response: { success, url, sessionId }
 */

import { NextRequest, NextResponse }       from "next/server";
import { createCheckoutSession }           from "@/lib/payments/stripe-client";
import { sendWhatsApp }                    from "@/lib/notifications/whatsapp";
import { getAdminAuth, getAdminDb }        from "@/lib/firebase-admin";
import { FieldValue }                      from "firebase-admin/firestore";
import { createRateLimiter, getClientIp }  from "@/lib/rate-limit";

// 10 links / minute per IP (generous for operators)
const limiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

export async function POST(req: NextRequest) {
  const rl = limiter(getClientIp(req));
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  // Auth
  const sessionCookie = req.cookies.get("__session")?.value;
  if (sessionCookie) {
    try { await getAdminAuth().verifySessionCookie(sessionCookie, true); }
    catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  } else if (!req.cookies.get("__auth")?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    ticketId: string;
    clientName: string;
    clientPhone: string;
    serviceDescription: string;
    serviceType: string;
    amountMXN: number;
    sendWhatsApp?: boolean;
  };

  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { ticketId, clientName, clientPhone, serviceDescription, serviceType, amountMXN } = body;

  if (!ticketId || !clientName || !clientPhone || !amountMXN) {
    return NextResponse.json(
      { error: "Missing required: ticketId, clientName, clientPhone, amountMXN" },
      { status: 400 }
    );
  }

  if (amountMXN <= 0 || amountMXN > 500_000) {
    return NextResponse.json({ error: "amountMXN must be between 1 and 500,000" }, { status: 400 });
  }

  // ── Create Stripe Checkout Session ─────────────────────────────────────────
  const checkout = await createCheckoutSession({
    ticketId,
    clientName:  clientName.slice(0, 200),
    clientPhone: clientPhone.replace(/\D/g, "").slice(0, 20),
    serviceDescription: (serviceDescription ?? "Servicio SPM").slice(0, 500),
    serviceType: (serviceType ?? "otro").slice(0, 50),
    amountMXN,
  });

  if (!checkout.success || !checkout.url) {
    return NextResponse.json(
      { error: checkout.error ?? "Failed to create Stripe session" },
      { status: 502 }
    );
  }

  // ── Persist payment URL on the ticket ──────────────────────────────────────
  try {
    const db = getAdminDb();
    const snap = await db
      .collection("service_tickets")
      .where("ticketId", "==", ticketId)
      .limit(1)
      .get();

    if (!snap.empty) {
      await snap.docs[0].ref.update({
        paymentLinkUrl:  checkout.url,
        stripeSessionId: checkout.sessionId,
        updatedAt:       FieldValue.serverTimestamp(),
      });
    }
  } catch (err) {
    // Non-fatal — the link was created, log and continue
    console.error(`[PaymentLink] Could not update Firestore for ${ticketId}:`, err);
  }

  // ── Send via WhatsApp ───────────────────────────────────────────────────────
  const shouldSendWA = body.sendWhatsApp !== false;
  let waSent = false;

  if (shouldSendWA && clientPhone) {
    const waMessage = [
      `💳 *Pago de servicio — ${ticketId}*`,
      ``,
      `Hola ${clientName.split(" ")[0]}, aquí está tu link de pago seguro por *$${amountMXN.toLocaleString("es-MX")} MXN*:`,
      ``,
      checkout.url,
      ``,
      `El link es válido por 24 horas.`,
      `— SanPedroMotoCare 🏍️`,
    ].join("\n");

    const wa = await sendWhatsApp({ to: clientPhone, body: waMessage });
    waSent = wa.success;
  }

  return NextResponse.json({
    success:      true,
    url:          checkout.url,
    sessionId:    checkout.sessionId,
    whatsappSent: waSent,
  });
}
