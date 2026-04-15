import { NextResponse } from "next/server";

/**
 * GET /api/debug/firebase-config
 * Returns the public Firebase client config values currently loaded in Vercel.
 * These are NEXT_PUBLIC_ vars — they are already embedded in the client bundle.
 * This endpoint exists only to verify env var values without needing Vercel dashboard access.
 *
 * Safe to expose: apiKey and these IDs are public by design in Firebase.
 * REMOVE this endpoint once the auth issue is diagnosed.
 */
export async function GET() {
  return NextResponse.json({
    projectId:    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID    ?? "❌ NOT SET",
    authDomain:   process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN   ?? "❌ NOT SET",
    databaseURL:  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL  ?? "❌ NOT SET",
    storageBucket:process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?? "❌ NOT SET",
    appId:        (process.env.NEXT_PUBLIC_FIREBASE_APP_ID       ?? "❌ NOT SET").slice(0, 20) + "…",
    apiKeyPrefix: (process.env.NEXT_PUBLIC_FIREBASE_API_KEY      ?? "❌ NOT SET").slice(0, 8)  + "…",
  });
}
