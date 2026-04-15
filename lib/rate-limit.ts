/**
 * Simple in-memory rate limiter for Next.js API routes.
 *
 * Uses a Map keyed by identifier (typically IP + route) with a sliding
 * window algorithm. Works well for single-instance deployments (Vercel
 * serverless functions share nothing between invocations, but the per-
 * function state persists across warm invocations of the same instance).
 *
 * For multi-region production use, replace with Redis / Vercel KV.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // epoch ms
}

const store = new Map<string, RateLimitEntry>();

/** Purge expired entries to keep memory bounded. */
function purgeExpired() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check whether `identifier` is within the allowed `limit` per `windowMs`.
 *
 * @param identifier  Unique key, e.g. `${ip}:${route}`
 * @param limit       Max requests allowed in the window
 * @param windowMs    Window duration in milliseconds
 */
export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  // Lazily purge ~1% of the time to avoid performance spikes
  if (Math.random() < 0.01) purgeExpired();

  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Extract a best-effort client IP from a Next.js request.
 * Vercel sets `x-forwarded-for`; fall back to a placeholder.
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
