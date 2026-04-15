/**
 * In-memory sliding window rate limiter.
 * Stores request timestamps per key (e.g. IP address).
 * Works for single-process / single-instance deployments (Vercel Serverless
 * functions are stateless between cold starts — for multi-instance production
 * consider swapping the store for Redis / Upstash).
 */

interface RateLimitOptions {
  /** Maximum number of requests allowed in the window. */
  limit: number;
  /** Window duration in milliseconds. */
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  /** Remaining requests in the current window. */
  remaining: number;
  /** Seconds until the oldest request expires (for Retry-After header). */
  retryAfter: number;
}

// Map of key → sorted array of request timestamps (ms)
const store = new Map<string, number[]>();

/**
 * Creates a rate limiter with the given options.
 *
 * @example
 * const limiter = createRateLimiter({ limit: 20, windowMs: 60_000 });
 * const result = limiter(ipAddress);
 * if (!result.success) return new Response("Too Many Requests", { status: 429 });
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { limit, windowMs } = options;

  return function check(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Retrieve and prune timestamps outside the current window
    const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart);

    if (timestamps.length >= limit) {
      // How many seconds until the oldest request rolls out of the window
      const oldestInWindow = timestamps[0];
      const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000);
      return { success: false, remaining: 0, retryAfter };
    }

    // Record this request
    timestamps.push(now);
    store.set(key, timestamps);

    return {
      success: true,
      remaining: limit - timestamps.length,
      retryAfter: 0,
    };
  };
}

/**
 * Extracts the best available IP from a Next.js request.
 * Falls back to "unknown" if none is found.
 */
export function getClientIp(req: Request): string {
  // Standard forwarded headers (set by Vercel / proxies)
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
