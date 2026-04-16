/**
 * Twilio Voice outbound call helper.
 *
 * Requirements:
 *   TWILIO_ACCOUNT_SID   — Twilio Account SID
 *   TWILIO_AUTH_TOKEN    — Twilio Auth Token
 *   TWILIO_PHONE_NUMBER  — Caller ID (Twilio number), e.g. +521XXXXXXXXXX
 *   NEXT_PUBLIC_APP_URL  — App base URL for TwiML webhook callbacks
 *
 * Twilio setup:
 *   1. Buy a Mexican phone number at twilio.com/console/phone-numbers
 *   2. Set TWILIO_PHONE_NUMBER to that number in E.164 format
 *   3. The /api/voice/say route serves TwiML (Twilio calls it when client answers)
 */

import twilio from "twilio";

function getClient() {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("Twilio credentials not configured");
  return twilio(sid, token);
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("52")) return `+${digits}`;
  if (digits.length === 10)    return `+52${digits}`;
  return `+${digits}`;
}

export interface OutboundCallParams {
  to: string;       // Destination phone number
  message: string;  // Text to speak (passed to /api/voice/say via query param)
  ticketId: string; // For logging / future call tracking
}

export interface CallResult {
  success: boolean;
  callSid?: string;
  error?: string;
}

/**
 * Place an outbound call. When the client answers, Twilio calls /api/voice/say
 * which returns TwiML with the message.
 */
export async function placeOutboundCall(params: OutboundCallParams): Promise<CallResult> {
  const from = process.env.TWILIO_PHONE_NUMBER;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://spm-platform.vercel.app";

  if (!from) {
    console.warn("[Voice] TWILIO_PHONE_NUMBER not set — skipping call");
    return { success: false, error: "TWILIO_PHONE_NUMBER not configured" };
  }

  const toFormatted = formatPhone(params.to);
  const twimlUrl = `${appUrl}/api/voice/say?msg=${encodeURIComponent(params.message)}&ticket=${encodeURIComponent(params.ticketId)}`;

  try {
    const client = getClient();
    const call = await client.calls.create({
      from,
      to: toFormatted,
      url: twimlUrl,
      statusCallback: `${appUrl}/api/voice/status`,
      statusCallbackMethod: "POST",
      machineDetection: "DetectMessageEnd", // Leave message on voicemail
    });

    console.info(`[Voice] Call placed to ${toFormatted} | SID: ${call.sid}`);
    return { success: true, callSid: call.sid };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Voice] Failed to call ${toFormatted}: ${msg}`);
    return { success: false, error: msg };
  }
}
