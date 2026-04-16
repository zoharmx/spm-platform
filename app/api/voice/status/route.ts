/**
 * POST /api/voice/status
 *
 * Twilio status callback — logs call outcomes (completed, no-answer, busy, failed).
 * Configured as statusCallback in placeOutboundCall().
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, string> = {};
  try {
    const text = await req.text();
    for (const pair of text.split("&")) {
      const [k, v] = pair.split("=");
      if (k) body[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
    }
  } catch { /* ignore parse errors */ }

  const { CallSid, CallStatus, To, Duration } = body;
  console.info(`[TwiML] Status callback | SID=${CallSid} status=${CallStatus} to=${To} duration=${Duration}s`);

  // Future: update call log in Firestore here
  return new NextResponse("OK", { status: 200 });
}
