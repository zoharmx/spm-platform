/**
 * GET/POST /api/voice/say
 *
 * TwiML webhook — Twilio calls this URL when the client answers the outbound call.
 * Responds with TwiML <Say> to read the message aloud, then hangs up.
 *
 * Query params: msg (message text), ticket (ticket ID for logging)
 *
 * Voice: Polly.Mia (MX Spanish — AWS Polly, natural female voice)
 * Fallback: Polly.Andrés (MX Spanish male)
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return sayHandler(req);
}

export async function POST(req: NextRequest) {
  return sayHandler(req);
}

function sayHandler(req: NextRequest): NextResponse {
  const { searchParams } = new URL(req.url);

  // Decode and sanitize message — max 1000 chars, strip XML special chars
  const rawMsg  = decodeURIComponent(searchParams.get("msg") ?? "Tienes una actualización de tu servicio. Revisa tu WhatsApp para más detalles. Gracias.");
  const message = rawMsg
    .slice(0, 1000)
    .replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c] ?? c));

  const ticket = (searchParams.get("ticket") ?? "").replace(/[^A-Z0-9-]/g, "").slice(0, 20);

  console.info(`[TwiML] /say called | ticket=${ticket}`);

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Mia" language="es-MX">${message}</Say>
  <Pause length="1"/>
  <Say voice="Polly.Mia" language="es-MX">Para más información visita sanpedromotocare punto mx. Hasta luego.</Say>
  <Hangup/>
</Response>`;

  return new NextResponse(twiml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Allow Twilio to call this endpoint without CSRF issues
      "X-Content-Type-Options": "nosniff",
    },
  });
}
