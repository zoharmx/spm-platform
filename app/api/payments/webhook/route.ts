/**
 * POST /api/payments/webhook
 *
 * Stripe webhook endpoint. Marks the ticket as "pagado" in Firestore
 * when a Checkout Session completes successfully.
 *
 * IMPORTANT: This route MUST receive the raw request body for signature
 * verification. Do NOT add body-parsing middleware.
 *
 * Stripe Dashboard setup:
 *   1. Webhooks → Add endpoint
 *   2. URL: https://spm-platform.vercel.app/api/payments/webhook
 *   3. Events to listen: checkout.session.completed
 *                        payment_intent.payment_failed  (optional, for alerts)
 *   4. Copy the "Signing secret" to STRIPE_WEBHOOK_SECRET in Vercel
 */

import { NextRequest, NextResponse }   from "next/server";
import { verifyWebhookSignature }      from "@/lib/payments/stripe-client";
import { getAdminDb }                  from "@/lib/firebase-admin";
import { FieldValue }                  from "firebase-admin/firestore";
import { sendWhatsApp }                from "@/lib/notifications/whatsapp";

export async function POST(req: NextRequest) {
  // Read raw body for signature verification
  const rawBody  = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  // ── Verify signature ───────────────────────────────────────────────────────
  let event;
  try {
    event = verifyWebhookSignature(rawBody, signature);
  } catch (err) {
    console.error("[StripeWebhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── Handle events ──────────────────────────────────────────────────────────
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        id: string;
        metadata?: { ticketId?: string; clientName?: string; clientPhone?: string; type?: string };
        amount_total?: number | null;
        payment_status?: string;
      };

      const ticketId    = session.metadata?.ticketId;
      const clientName  = session.metadata?.clientName ?? "Cliente";
      const clientPhone = session.metadata?.clientPhone;
      const amountMXN   = session.amount_total != null ? session.amount_total / 100 : null;
      const paymentType = session.metadata?.type ?? "servicio"; // "anticipo" | "servicio"

      if (!ticketId) {
        console.warn("[StripeWebhook] No ticketId in session metadata:", session.id);
        return NextResponse.json({ received: true });
      }

      const db   = getAdminDb();
      const snap = await db
        .collection("service_tickets")
        .where("ticketId", "==", ticketId)
        .limit(1)
        .get();

      if (!snap.empty) {
        const docRef = snap.docs[0].ref;

        if (paymentType === "anticipo") {
          // ── Anticipo: register deposit, do NOT advance to "pagado" ──────────
          await docRef.update({
            anticipoPagado: true,
            anticipo:       amountMXN ?? FieldValue.increment(0),
            updatedAt:      FieldValue.serverTimestamp(),
            statusHistory:  FieldValue.arrayUnion({
              status:    "diagnostico-pendiente",
              timestamp: new Date(),
              note:      `Anticipo de visita cobrado ($${amountMXN?.toLocaleString("es-MX") ?? "—"} MXN) — Session ${session.id}`,
            }),
          });

          console.info(`[StripeWebhook] Anticipo confirmed for ticket ${ticketId}`);

          if (clientPhone) {
            await sendWhatsApp({
              to: clientPhone,
              body: [
                `✅ *Visita confirmada — ${ticketId}*`,
                ``,
                `Hola ${clientName.split(" ")[0]}, recibimos tu anticipo de *$${amountMXN?.toLocaleString("es-MX") ?? "—"} MXN*.`,
                `Nuestro mecánico está en camino. Te avisaremos cuando salga.`,
                `— SanPedroMotoCare 🏍️`,
              ].join("\n"),
            });
          }
        } else {
          // ── Servicio: mark ticket as "pagado" ────────────────────────────────
          await docRef.update({
            status:        "pagado",
            paidAt:        FieldValue.serverTimestamp(),
            updatedAt:     FieldValue.serverTimestamp(),
            statusHistory: FieldValue.arrayUnion({
              status:    "pagado",
              timestamp: new Date(),
              note:      `Pago online vía Stripe — Session ${session.id}`,
            }),
          });

          console.info(`[StripeWebhook] Ticket ${ticketId} marked as pagado`);

          if (clientPhone) {
            await sendWhatsApp({
              to: clientPhone,
              body: [
                `✅ *Pago confirmado — ${ticketId}*`,
                ``,
                `Hola ${clientName.split(" ")[0]}, recibimos tu pago de *$${amountMXN?.toLocaleString("es-MX") ?? "—"} MXN*.`,
                `¡Gracias por confiar en SanPedroMotoCare!`,
                ``,
                `Hasta la próxima 🏍️`,
                `— SanPedroMotoCare`,
              ].join("\n"),
            });
          }
        }
      } else {
        console.warn(`[StripeWebhook] Ticket ${ticketId} not found in Firestore`);
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as {
        metadata?: { ticketId?: string; clientPhone?: string; clientName?: string };
        last_payment_error?: { message?: string };
      };

      const ticketId    = pi.metadata?.ticketId;
      const clientPhone = pi.metadata?.clientPhone;
      const clientName  = (pi.metadata?.clientName ?? "").split(" ")[0] || "Cliente";
      const reason      = pi.last_payment_error?.message ?? "Error desconocido";

      if (clientPhone) {
        await sendWhatsApp({
          to:   clientPhone,
          body: `❌ Hola ${clientName}, el pago de tu servicio *${ticketId}* no pudo procesarse (${reason}). Por favor intenta de nuevo o contáctanos.\n— SanPedroMotoCare`,
        });
      }

      console.warn(`[StripeWebhook] Payment failed for ticket ${ticketId}: ${reason}`);
    }
  } catch (err) {
    console.error("[StripeWebhook] Handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
