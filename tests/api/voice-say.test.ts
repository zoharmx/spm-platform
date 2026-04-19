import { describe, it, expect } from "vitest";
import { GET, POST } from "@/app/api/voice/say/route";
import { NextRequest } from "next/server";

function makeReq(method: string, msg?: string, ticket?: string): NextRequest {
  const params = new URLSearchParams();
  if (msg) params.set("msg", encodeURIComponent(msg));
  if (ticket) params.set("ticket", ticket);
  return new NextRequest(`http://localhost/api/voice/say?${params}`, { method });
}

describe("GET /api/voice/say", () => {
  it("returns valid TwiML XML", async () => {
    const res = await GET(makeReq("GET", "Hola mundo", "SPM-0001"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/xml");

    const body = await res.text();
    expect(body).toContain("<?xml");
    expect(body).toContain("<Response>");
    expect(body).toContain("<Say");
    expect(body).toContain("Polly.Mia");
    expect(body).toContain("es-MX");
    expect(body).toContain("Hola mundo");
    expect(body).toContain("<Hangup/>");
  });

  it("uses default message when none provided", async () => {
    const res = await GET(makeReq("GET"));
    const body = await res.text();
    expect(body).toContain("actualización de tu servicio");
  });

  it("escapes XML special characters", async () => {
    const res = await GET(makeReq("GET", '<script>alert("xss")</script>'));
    const body = await res.text();
    expect(body).not.toContain("<script>");
    expect(body).toContain("&lt;script&gt;");
  });

  it("truncates message to 1000 chars", async () => {
    const longMsg = "A".repeat(2000);
    const res = await GET(makeReq("GET", longMsg));
    const body = await res.text();
    const sayMatch = body.match(/<Say[^>]*>(.*?)<\/Say>/);
    expect(sayMatch).toBeTruthy();
    expect(sayMatch![1].length).toBeLessThanOrEqual(1000);
  });

  it("sanitizes ticket ID", async () => {
    const res = await GET(makeReq("GET", "test", "SPM-0001'; DROP TABLE--"));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/voice/say", () => {
  it("returns same TwiML as GET", async () => {
    const res = await POST(makeReq("POST", "Prueba POST"));
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("Prueba POST");
  });
});
