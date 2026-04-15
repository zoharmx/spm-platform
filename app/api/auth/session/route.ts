import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

// Session cookie duration: 5 days
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

/**
 * POST /api/auth/session
 * Receives a Firebase ID token from the client, verifies it server-side,
 * and sets an HttpOnly session cookie using Firebase Admin's createSessionCookie.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const adminAuth = getAdminAuth();

    // Verify the ID token and create a server-side session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const isProd = process.env.NODE_ENV === "production";

    const response = NextResponse.json({ status: "ok" });
    response.cookies.set("__session", sessionCookie, {
      maxAge: SESSION_DURATION_MS / 1000,
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Session API error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 401 }
    );
  }
}

/**
 * DELETE /api/auth/session
 * Clears the session cookie on sign-out.
 */
export async function DELETE() {
  const response = NextResponse.json({ status: "ok" });
  response.cookies.set("__session", "", {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return response;
}
