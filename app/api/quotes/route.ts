import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import type { ServiceType, LeadSource, MotoType } from "@/types";

const QUOTES_RATE_LIMIT = 5;       // requests per window
const QUOTES_WINDOW_MS = 60_000;   // 1 minute

// Allowed values derived from the type system — prevents injection of arbitrary strings
const VALID_SERVICE_TYPES = new Set<string>([
  "afinacion-menor","afinacion-mayor","frenos","sistema-electrico",
  "suspension","cadena-y-sprockets","neumaticos","bateria",
  "carburador-inyeccion","motor","transmision","refaccion","diagnostico","otro",
]);

const VALID_MOTO_TYPES = new Set<string>([
  "naked","deportiva","touring","enduro","scooter","custom","otra",
]);

const VALID_SOURCES = new Set<string>([
  "google-ads","meta-ads","llamada-directa","whatsapp",
  "landing-page","referido","organico","otro",
]);

// Field length limits
const LIMITS = {
  name: 120,
  phone: 30,
  email: 254,
  address: 300,
  motoBrand: 80,
  motoYear: 4,
  description: 2000,
  preferredTime: 100,
};

function validateString(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLen) return null;
  return trimmed;
}

export async function POST(req: NextRequest) {
  // Rate limiting — 5 quotes/min per IP to prevent spam
  const ip = getClientIp(req);
  const rl = rateLimit(`quotes:${ip}`, QUOTES_RATE_LIMIT, QUOTES_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  try {
    const body = await req.json();

    // ── Validate & whitelist every field explicitly ──────────────────────────
    const name = validateString(body.name, LIMITS.name);
    const phone = validateString(body.phone, LIMITS.phone);
    const address = validateString(body.address, LIMITS.address);
    const description = validateString(body.description, LIMITS.description);
    const serviceType = VALID_SERVICE_TYPES.has(body.serviceType)
      ? (body.serviceType as ServiceType)
      : null;

    // Required fields
    if (!name || !phone || !address || !description || !serviceType) {
      return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 });
    }

    // Optional fields — validated and typed
    const email = validateString(body.email, LIMITS.email) ?? undefined;
    const motoBrand = validateString(body.motoBrand, LIMITS.motoBrand) ?? undefined;
    const motoYear = validateString(body.motoYear, LIMITS.motoYear) ?? undefined;
    const preferredTime = validateString(body.preferredTime, LIMITS.preferredTime) ?? undefined;
    const motoType: MotoType | undefined = VALID_MOTO_TYPES.has(body.motoType)
      ? (body.motoType as MotoType)
      : undefined;
    const source: LeadSource = VALID_SOURCES.has(body.source)
      ? (body.source as LeadSource)
      : "landing-page";

    const db = getAdminDb();

    // ── Atomic ticket number via Firestore transaction ───────────────────────
    // Replaces the racy count() + manual increment approach.
    const counterRef = db.collection("_counters").doc("service_tickets");

    const ticketId = await db.runTransaction(async (tx) => {
      const counterSnap = await tx.get(counterRef);
      const current: number = counterSnap.exists
        ? (counterSnap.data()!.count as number)
        : 0;
      const next = current + 1;
      tx.set(counterRef, { count: next }, { merge: true });
      return `SPM-${String(next).padStart(4, "0")}`;
    });

    // ── Persist lead (only whitelisted fields) ────────────────────────────────
    const leadRef = db.collection("leads").doc();
    const ticketRef = db.collection("service_tickets").doc();
    const now = FieldValue.serverTimestamp();

    const batch = db.batch();

    batch.set(leadRef, {
      id: leadRef.id,
      name,
      phone,
      email,
      address,
      serviceType,
      description,
      motoType,
      motoBrand,
      motoYear,
      preferredTime,
      source,
      status: "nuevo",
      createdAt: now,
      updatedAt: now,
    });

    batch.set(ticketRef, {
      id: ticketRef.id,
      ticketId,
      status: "lead-recibido",
      clientName: name,
      clientPhone: phone,
      clientEmail: email,
      serviceType,
      serviceDescription: description,
      serviceAddress: { street: address },
      motoBrand,
      motoYear,
      source,
      leadId: leadRef.id,
      createdAt: now,
      updatedAt: now,
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      ticketId,
      message: "Cotización enviada correctamente",
    });
  } catch (error) {
    console.error("[api/quotes] error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
