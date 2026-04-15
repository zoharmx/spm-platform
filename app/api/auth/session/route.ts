import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

// 5-day session — aligns with Firebase session cookie max lifetime
const SESSION_MAX_AGE_SEC = 5 * 24 * 60 * 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken } = body ?? {};

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const adminAuth = getAdminAuth();

    // Verify the ID token and create a Firebase session cookie.
    // createSessionCookie throws if the token is invalid/revoked.
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_SEC * 1000, // SDK expects milliseconds
    });

    const response = NextResponse.json({ ok: true });

    response.cookies.set("__session", sessionCookie, {
      httpOnly: true,                                      // not readable by JS
      secure: process.env.NODE_ENV === "production",       // HTTPS only in prod
      sameSite: "lax",                                     // CSRF mitigation
      maxAge: SESSION_MAX_AGE_SEC,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[auth/session] error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
