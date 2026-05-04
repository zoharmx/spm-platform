/**
 * POST /api/payments/webhook
 *
 * Stripe webhook endpoint. Records the payment on the ticket when a
 * Checkout Session completes successfully.
 *
 * Partial payments: if amountMXN < finalCost, the payment is recorded
 * as "parcial" in payments[] and totalPaid is updated. The ticket stays
 * in its current status. Only when totalPaid >= finalCost does the ticket
 * advance to "pagado".
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
  const rawBody   = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event;
  try {
    event = verifyWebhookSignature(rawBody, signature);
  } catch (err) {
    console.error("[StripeWebhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    // ── checkout.session.completed ─────────────────────────────────────────
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        id: string;
        metadata?: {
          ticketId?: string;
          clientName?: string;
          clientPhone?: string;
          type?: string;
        };
        amount_total?: number | null;
        payment_status?: string;
      };

      const ticketId    = session.metadata?.ticketId;
      const clientName  = session.metadata?.clientName ?? "Cliente";
      const clientPhone = session.metadata?.clientPhone;
      const amountMXN   = session.amount_total != null ? session.amount_total / 100 : null;
      const paymentType = session.metadata?.type ?? "servicio"; // "anticipo" | "servicio"

      if (!ticketId || amountMXN == null) {
        console.warn("[StripeWebhook] Missing ticketId or amount in session:", session.id);
        return NextResponse.json({ received: true });
      }

      const db   = getAdminDb();
      const snap = await db
        .collection("service_tickets")
        .where("ticketId", "==", ticketId)
        .limit(1)
        .get();

      if (snap.empty) {
        console.warn(`[StripeWebhook] Ticket ${ticketId} not found in Firestore`);
        return NextResponse.json({ received: true });
      }

      const docRef    = snap.docs[0].ref;
      const ticketDoc = snap.docs[0].data();

      // ── Anticipo ────────────────────────────────────────────────────────────
      if (paymentType === "anticipo") {
        await docRef.update({
          anticipoPagado: true,
          anticipo:       amountMXN,
          updatedAt:      FieldValue.serverTimestamp(),
          statusHistory:  FieldValue.arrayUnion({
            status:    "diagnostico-pendiente",
            timestamp: new Date(),
            note:      `Anticipo de visita cobrado ($${amountMXN.toLocaleString("es-MX")} MXN) — Session ${session.id}`,
          }),
        });

        console.info(`[StripeWebhook] Anticipo confirmed for ticket ${ticketId} — $${amountMXN} MXN`);

        if (clientPhone) {
          await sendWhatsApp({
            to: clientPhone,
            body: [
              `✅ *Visita confirmada — ${ticketId}*`,
              ``,
              `Hola ${clientName.split(" ")[0]}, recibimos tu anticipo de *$${amountMXN.toLocaleString("es-MX")} MXN*.`,
              `Nuestro mecánico está en camino. Te avisaremos cuando salga.`,
              `— SanPedroMotoCare 🏍️`,
            ].join("\n"),
          });
        }

        return NextResponse.json({ received: true });
      }

      // ── Servicio (pago parcial o final) ─────────────────────────────────────
      const previousTotal = (ticketDoc.totalPaid ?? 0) as number;
      const finalCost     = (ticketDoc.finalCost ?? 0) as number;
      const newTotalPaid  = previousTotal + amountMXN;

      // If finalCost is unknown, treat any completed payment as final.
      const isFullyPaid = finalCost > 0 ? newTotalPaid >= finalCost : true;
      const payType     = isFullyPaid ? "final" : "parcial";
      const remaining   = Math.max(0, finalCost - newTotalPaid);

      // Build payment record (same shape as recordPayment in lib/firestore/tickets.ts)
      const newPayment = {
        id:              `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type:            payType,
        method:          "stripe",
        amount:          amountMXN,
        stripeSessionId: session.id,
        registeredBy:    "stripe-webhook",
        createdAt:       new Date(),
      };

      const historyNote = isFullyPaid
        ? `Pago final vía Stripe — $${amountMXN.toLocaleString("es-MX")} MXN — Session ${session.id}`
        : `Pago parcial vía Stripe — $${amountMXN.toLocaleString("es-MX")} MXN (acumulado: $${newTotalPaid.toLocaleString("es-MX")} de $${finalCost.toLocaleString("es-MX")}) — Session ${session.id}`;

      const updates: Record<string, unknown> = {
        payments:      FieldValue.arrayUnion(newPayment),
        totalPaid:     newTotalPaid,
        updatedAt:     FieldValue.serverTimestamp(),
        statusHistory: FieldValue.arrayUnion({
          status:    isFullyPaid ? "pagado" : ticketDoc.status,
          timestamp: new Date(),
          note:      historyNote,
        }),
      };

      if (isFullyPaid) {
        updates.status        = "pagado";
        updates.paymentMethod = "stripe";
        updates.paidAt        = FieldValue.serverTimestamp();
      }

      await docRef.update(updates);

      // Update client's totalPaid (non-fatal if missing)
      const clientId = ticketDoc.clientId as string | undefined;
      if (clientId) {
        try {
          await db.collection("clients").doc(clientId).update({
            totalPaid:  FieldValue.increment(amountMXN),
            updatedAt:  FieldValue.serverTimestamp(),
          });
        } catch (e) {
          console.warn(`[StripeWebhook] Could not update client totalPaid for ${clientId}:`, e);
        }
      }

      console.info(
        `[StripeWebhook] Ticket ${ticketId} — ${payType} payment $${amountMXN} MXN` +
        ` (total: $${newTotalPaid}/${ finalCost || "?" } MXN, fully paid: ${isFullyPaid})`
      );

      // WhatsApp confirmation
      if (clientPhone) {
        const waBody = isFullyPaid
          ? [
              `✅ *Pago confirmado — ${ticketId}*`,
              ``,
              `Hola ${clientName.split(" ")[0]}, recibimos tu pago de *$${amountMXN.toLocaleString("es-MX")} MXN*.`,
              `¡Gracias por confiar en SanPedroMotoCare!`,
              ``,
              `Hasta la próxima 🏍️`,
              `— SanPedroMotoCare`,
            ].join("\n")
          : [
              `✅ *Pago parcial recibido — ${ticketId}*`,
              ``,
              `Hola ${clientName.split(" ")[0]}, recibimos tu pago de *$${amountMXN.toLocaleString("es-MX")} MXN*.`,
              `Saldo pendiente: *$${remaining.toLocaleString("es-MX")} MXN*.`,
              `En cuanto saldemos el resto, te confirmamos. ¡Gracias!`,
              `— SanPedroMotoCare 🏍️`,
            ].join("\n");

        await sendWhatsApp({ to: clientPhone, body: waBody });
      }
    }

    // ── payment_intent.payment_failed ──────────────────────────────────────
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
