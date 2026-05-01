import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getSessionUser, hasMinimumRole } from "@/lib/auth-server";
import { FieldValue } from "firebase-admin/firestore";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

const limiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

type Params = { params: Promise<{ id: string }> };

// ── GET /api/products/[id] ────────────────────────────────────────────────────
// Public. Managers+ also receive costPrice.
export async function GET(req: NextRequest, { params }: Params) {
  if (!limiter(getClientIp(req)).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  const user = await getSessionUser(req);
  const isManager = user ? hasMinimumRole(user.role, "manager") : false;

  try {
    const snap = await getAdminDb().collection("products").doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data = snap.data()!;
    const product = {
      id: snap.id,
      sku: data.sku,
      name: data.name,
      shortName: data.shortName ?? null,
      category: data.category,
      unit: data.unit,
      compatibleModels: data.compatibleModels ?? [],
      vendorId: data.vendorId ?? null,
      salePrice: data.salePrice,
      stock: data.stock,
      minStock: data.minStock,
      imageUrls: data.imageUrls ?? [],
      isActive: data.isActive,
      isFeatured: data.isFeatured ?? false,
      tags: data.tags ?? [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    return NextResponse.json({
      product: isManager ? { ...product, costPrice: data.costPrice } : product,
    });
  } catch (err) {
    console.error("[GET /api/products/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── PUT /api/products/[id] ────────────────────────────────────────────────────
// Requires manager+
export async function PUT(req: NextRequest, { params }: Params) {
  if (!limiter(getClientIp(req)).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const user = await getSessionUser(req);
  if (!user || !hasMinimumRole(user.role, "manager")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  // Whitelist of updatable fields — never allow sku, createdAt
  const ALLOWED = [
    "name", "shortName", "category", "unit", "compatibleModels",
    "vendorId", "vendorSku", "costPrice", "salePrice", "stock",
    "minStock", "imageUrls", "isActive", "isFeatured", "tags",
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  try {
    await getAdminDb().collection("products").doc(id).update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PUT /api/products/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── DELETE /api/products/[id] ─────────────────────────────────────────────────
// Soft-delete (isActive = false). Requires admin.
export async function DELETE(req: NextRequest, { params }: Params) {
  if (!limiter(getClientIp(req)).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const user = await getSessionUser(req);
  if (!user || !hasMinimumRole(user.role, "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await getAdminDb().collection("products").doc(id).update({
      isActive: false,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/products/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
