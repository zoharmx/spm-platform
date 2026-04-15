import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

// 5 requests per minute per IP (quote form submissions)
const rateLimiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

// ── Field length limits ──────────────────────────────────────────────────────
const LIMITS = {
  name: 100,
  phone: 20,
  email: 254,
  address: 200,
  serviceType: 80,
  description: 1000,
  motoBrand: 60,
  motoYear: 4,
  source: 40,
} as const;

function truncate(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function isValidPhone(phone: string): boolean {
  return /^[\d\s\+\-\(\)]{7,20}$/.test(phone);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidYear(year: unknown): boolean {
  const n = Number(year);
  return Number.isInteger(n) && n >= 1900 && n <= new Date().getFullYear() + 1;
}

export async function POST(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const rl = rateLimiter(ip);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rl.retryAfter),
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  try {
    const body = await req.json();

    // ── Required field validation ──────────────────────────────────────────
    const name = truncate(body.name, LIMITS.name);
    const phone = truncate(body.phone, LIMITS.phone);
    const address = truncate(body.address, LIMITS.address);
    const serviceType = truncate(body.serviceType, LIMITS.serviceType);
    const description = truncate(body.description, LIMITS.description);

    if (!name || !phone || !address || !serviceType || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    // ── Optional fields ────────────────────────────────────────────────────
    const email = truncate(body.email, LIMITS.email);
    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const motoBrand = truncate(body.motoBrand, LIMITS.motoBrand);
    const source = truncate(body.source, LIMITS.source) || "landing-page";

    const motoYear = body.motoYear != null
      ? (isValidYear(body.motoYear) ? Number(body.motoYear) : null)
      : null;

    // ── Build explicitly-allowed lead document (no spread) ─────────────────
    const leadData = {
      name,
      phone,
      address,
      serviceType,
      description,
      ...(email ? { email } : {}),
      ...(motoBrand ? { motoBrand } : {}),
      ...(motoYear !== null ? { motoYear } : {}),
      source,
      status: "nuevo",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = getAdminDb();

    // ── Atomic ticket number via Firestore Transaction ─────────────────────
    const counterRef = db.collection("_counters").doc("service_tickets");
    const leadRef = db.collection("leads").doc();
    const ticketRef = db.collection("service_tickets").doc();

    let ticketId = "";

    await db.runTransaction(async (tx) => {
      const counterSnap = await tx.get(counterRef);
      const currentCount: number = counterSnap.exists
        ? (counterSnap.data()?.count ?? 0)
        : 0;
      const nextCount = currentCount + 1;
      ticketId = `SPM-${String(nextCount).padStart(4, "0")}`;

      // Upsert counter
      tx.set(counterRef, { count: nextCount }, { merge: true });

      // Persist lead (only whitelisted fields)
      tx.set(leadRef, { ...leadData, id: leadRef.id });

      // Persist ticket (only whitelisted fields)
      tx.set(ticketRef, {
        id: ticketRef.id,
        ticketId,
        status: "lead-recibido",
        clientName: name,
        clientPhone: phone,
        ...(email ? { clientEmail: email } : {}),
        serviceType,
        serviceDescription: description,
        serviceAddress: { street: address },
        ...(motoBrand ? { motoBrand } : {}),
        ...(motoYear !== null ? { motoYear } : {}),
        source,
        leadId: leadRef.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({
      success: true,
      ticketId,
      message: "Cotización enviada correctamente",
    });
  } catch (error) {
    console.error("Quote API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
