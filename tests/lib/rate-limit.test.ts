import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });
    const r1 = limiter("ip-1");
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r1.retryAfter).toBe(0);
  });

  it("blocks requests at the limit", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });
    limiter("ip-2");
    limiter("ip-2");
    const r3 = limiter("ip-2");
    expect(r3.success).toBe(false);
    expect(r3.remaining).toBe(0);
    expect(r3.retryAfter).toBeGreaterThan(0);
  });

  it("allows requests again after window expires", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 10_000 });
    limiter("ip-3");
    const blocked = limiter("ip-3");
    expect(blocked.success).toBe(false);

    vi.advanceTimersByTime(11_000);
    const allowed = limiter("ip-3");
    expect(allowed.success).toBe(true);
    expect(allowed.remaining).toBe(0);
  });

  it("tracks different keys independently", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    const r1 = limiter("ip-a");
    const r2 = limiter("ip-b");
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);

    const r3 = limiter("ip-a");
    expect(r3.success).toBe(false);
  });

  it("calculates retryAfter correctly", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 30_000 });
    limiter("ip-retry");

    vi.advanceTimersByTime(10_000);
    const blocked = limiter("ip-retry");
    expect(blocked.success).toBe(false);
    expect(blocked.retryAfter).toBe(20);
  });

  it("remaining decrements correctly", () => {
    const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 });
    expect(limiter("ip-rem").remaining).toBe(4);
    expect(limiter("ip-rem").remaining).toBe(3);
    expect(limiter("ip-rem").remaining).toBe(2);
    expect(limiter("ip-rem").remaining).toBe(1);
    expect(limiter("ip-rem").remaining).toBe(0);
    expect(limiter("ip-rem").success).toBe(false);
  });
});

describe("getClientIp", () => {
  it("extracts IP from x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("192.168.1.1");
  });

  it("extracts IP from x-real-ip when x-forwarded-for is absent", () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "10.0.0.5" },
    });
    expect(getClientIp(req)).toBe("10.0.0.5");
  });

  it("returns 'unknown' when no headers are present", () => {
    const req = new Request("http://localhost");
    expect(getClientIp(req)).toBe("unknown");
  });

  it("trims whitespace from forwarded IP", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "  172.16.0.1  , 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("172.16.0.1");
  });
});
