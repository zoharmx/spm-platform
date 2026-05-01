import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getSessionUser, hasMinimumRole } from "@/lib/auth-server";
import { FieldValue } from "firebase-admin/firestore";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

const limiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

// ── GET /api/vendors ──────────────────────────────────────────────────────────
// Requires operador+
export async function GET(req: NextRequest) {
  if (!limiter(getClientIp(req)).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const user = await getSessionUser(req);
  if (!user || !hasMinimumRole(user.role, "operador")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snap = await getAdminDb()
      .collection("vendors")
      .orderBy("name", "asc")
      .get();

    const vendors = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ vendors });
  } catch (err) {
    console.error("[GET /api/vendors]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── POST /api/vendors ─────────────────────────────────────────────────────────
// Requires manager+
export async function POST(req: NextRequest) {
  if (!limiter(getClientIp(req)).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const user = await getSessionUser(req);
  if (!user || !hasMinimumRole(user.role, "manager")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const name = String(body.name ?? "").trim().slice(0, 150);
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  try {
    const db = getAdminDb();
    const counterRef = db.collection("_counters").doc("vendors");

    let vendorId = "";
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(counterRef);
      const count = (snap.data()?.count ?? 0) + 1;
      vendorId = `PROV-${String(count).padStart(4, "0")}`;
      tx.set(counterRef, { count }, { merge: true });
    });

    const ref = await db.collection("vendors").add({
      vendorId,
      name,
      rfc: body.rfc ? String(body.rfc).slice(0, 20) : null,
      contactName: body.contactName ? String(body.contactName).slice(0, 100) : null,
      phone: body.phone ? String(body.phone).slice(0, 20) : null,
      email: body.email ? String(body.email).slice(0, 254) : null,
      address: body.address ?? null,
      notes: body.notes ? String(body.notes).slice(0, 500) : null,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: ref.id, vendorId }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/vendors]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
