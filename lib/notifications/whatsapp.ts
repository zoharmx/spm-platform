/**
 * Twilio WhatsApp notification helper.
 *
 * Requirements (Vercel env vars):
 *   TWILIO_ACCOUNT_SID      — Twilio Account SID
 *   TWILIO_AUTH_TOKEN       — Twilio Auth Token
 *   TWILIO_WHATSAPP_NUMBER  — Sender number, e.g. whatsapp:+14155238886 (sandbox)
 *                             or whatsapp:+521XXXXXXXXXX (approved business number)
 *
 * Sandbox setup (testing):
 *   1. Go to twilio.com/console/sms/whatsapp/sandbox
 *   2. Send the sandbox join code from your phone
 *   3. Use whatsapp:+14155238886 as TWILIO_WHATSAPP_NUMBER
 *
 * Production:
 *   1. Apply for WhatsApp Business API at twilio.com/whatsapp
 *   2. Pre-approve message templates with Meta
 *   3. Use your approved WhatsApp number
 */

import twilio from "twilio";

function getClient() {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set");
  return twilio(sid, token);
}

function formatPhone(raw: string): string {
  // Ensure E.164 format and WhatsApp prefix
  const digits = raw.replace(/\D/g, "");
  // Add Mexico country code if 10-digit number
  const e164 = digits.startsWith("52") ? `+${digits}` : digits.length === 10 ? `+52${digits}` : `+${digits}`;
  return `whatsapp:${e164}`;
}

export interface SendWhatsAppParams {
  to: string;   // Client phone number (raw, will be formatted)
  body: string; // Message body (WhatsApp markdown supported: *bold*, _italic_)
}

export interface WhatsAppResult {
  success: boolean;
  sid?: string;
  error?: string;
}

/**
 * Send a WhatsApp message via Twilio.
 * Silently fails (logs + returns error) so it never blocks the main flow.
 */
export async function sendWhatsApp(params: SendWhatsAppParams): Promise<WhatsAppResult> {
  const from = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!from) {
    console.warn("[WhatsApp] TWILIO_WHATSAPP_NUMBER not set — skipping");
    return { success: false, error: "TWILIO_WHATSAPP_NUMBER not configured" };
  }

  try {
    const client = getClient();
    const message = await client.messages.create({
      from,
      to: formatPhone(params.to),
      body: params.body,
    });
    console.info(`[WhatsApp] Sent to ${params.to} | SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[WhatsApp] Failed to send to ${params.to}: ${msg}`);
    return { success: false, error: msg };
  }
}

/**
 * Send an SMS fallback when WhatsApp is not available.
 */
export async function sendSMS(to: string, body: string): Promise<WhatsAppResult> {
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) {
    console.warn("[SMS] TWILIO_PHONE_NUMBER not set — skipping");
    return { success: false, error: "TWILIO_PHONE_NUMBER not configured" };
  }

  try {
    const client = getClient();
    const digits = to.replace(/\D/g, "");
    const e164   = digits.startsWith("52") ? `+${digits}` : digits.length === 10 ? `+52${digits}` : `+${digits}`;
    const message = await client.messages.create({ from, to: e164, body });
    return { success: true, sid: message.sid };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[SMS] Failed to send to ${to}: ${msg}`);
    return { success: false, error: msg };
  }
}
