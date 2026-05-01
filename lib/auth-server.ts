import { getAdminAuth, getAdminDb } from "./firebase-admin";
import type { NextRequest } from "next/server";
import type { UserRole } from "@/types";

const ROLE_WEIGHTS: Record<UserRole, number> = {
  viewer: 1,
  mecanico: 2,
  operador: 3,
  manager: 4,
  admin: 5,
};

export async function getSessionUser(
  req: NextRequest
): Promise<{ uid: string; role: UserRole } | null> {
  const cookie = req.cookies.get("__session")?.value;
  if (!cookie) return null;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(cookie, true);
    const snap = await getAdminDb().collection("users").doc(decoded.uid).get();
    const role = (snap.data()?.role ?? "viewer") as UserRole;
    return { uid: decoded.uid, role };
  } catch {
    return null;
  }
}

export function hasMinimumRole(role: UserRole, minimum: UserRole): boolean {
  return ROLE_WEIGHTS[role] >= ROLE_WEIGHTS[minimum];
}
