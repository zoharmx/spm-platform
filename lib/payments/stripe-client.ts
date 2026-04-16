/**
 * Stripe payment helper — Checkout Sessions.
 *
 * Requirements:
 *   STRIPE_SECRET_KEY      — sk_live_xxx or sk_test_xxx
 *   STRIPE_WEBHOOK_SECRET  — whsec_xxx (from Stripe Dashboard → Webhooks)
 *   NEXT_PUBLIC_APP_URL    — App base URL for success/cancel redirects
 *
 * Stripe setup:
 *   1. Create account at stripe.com
 *   2. Enable MXN currency in Dashboard → Settings → Currencies
 *   3. Get Secret Key from Dashboard → Developers → API Keys
 *   4. Create Webhook endpoint:
 *        URL: https://spm-platform.vercel.app/api/payments/webhook
 *        Events: checkout.session.completed, payment_intent.payment_failed
 *   5. Copy the Webhook Signing Secret to STRIPE_WEBHOOK_SECRET
 *
 * Architecture:
 *   - We use Checkout Sessions (not Payment Links) for full per-ticket metadata
 *   - Sessions expire in 24 hours; a new one is generated on demand
 *   - On completion, the webhook marks the ticket as "pagado" in Firestore
 */

import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    _stripe = new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
  }
  return _stripe;
}

export interface CreateCheckoutParams {
  ticketId: string;
  clientName: string;
  clientPhone: string;
  serviceDescription: string;
  serviceType: string;
  amountMXN: number;       // Final cost in MXN (whole number, e.g. 850)
  type?: "anticipo" | "servicio"; // anticipo = deposit before field visit; default "servicio"
}

export interface CheckoutResult {
  success: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
}

/**
 * Create a Stripe Checkout Session for a completed service ticket.
 * Returns the hosted payment page URL to share with the client.
 */
export async function createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://spm-platform.vercel.app";

  try {
    const stripe  = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      currency: "mxn",
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: `Servicio ${params.ticketId} — SanPedroMotoCare`,
              description: params.serviceDescription,
              metadata: { serviceType: params.serviceType },
            },
            unit_amount: Math.round(params.amountMXN * 100), // Stripe uses centavos
          },
          quantity: 1,
        },
      ],
      metadata: {
        ticketId:    params.ticketId,
        clientName:  params.clientName,
        clientPhone: params.clientPhone,
        platform:    "spm-platform",
        type:        params.type ?? "servicio",
      },
      customer_email: undefined, // Can add clientEmail if available
      success_url: `${appUrl}/portal/pagar?status=success&ticket=${params.ticketId}`,
      cancel_url:  `${appUrl}/portal/pagar?status=cancelled&ticket=${params.ticketId}`,
      expires_at:  Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h
      payment_intent_data: {
        description: `SPM ${params.ticketId} — ${params.clientName}`,
        metadata: {
          ticketId:    params.ticketId,
          clientPhone: params.clientPhone,
        },
      },
    });

    console.info(`[Stripe] Session created for ${params.ticketId} | ID: ${session.id}`);
    return {
      success:   true,
      url:       session.url ?? undefined,
      sessionId: session.id,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Stripe] Failed to create session for ${params.ticketId}: ${msg}`);
    return { success: false, error: msg };
  }
}

/**
 * Verify a Stripe webhook signature.
 * Must be called with the RAW request body string (not parsed JSON).
 */
export function verifyWebhookSignature(rawBody: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  return getStripe().webhooks.constructEvent(rawBody, signature, secret);
}
