import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAdminAuth } from "@/lib/firebase-admin";

describe("/api/auth/session", () => {
  const mockCreateSessionCookie = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    (getAdminAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      createSessionCookie: mockCreateSessionCookie,
    });
  });

  describe("POST", () => {
    async function callPOST(body: Record<string, unknown>) {
      const { POST } = await import("@/app/api/auth/session/route");
      const req = new Request("http://localhost/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return POST(req as never);
    }

    it("returns 400 when idToken is missing", async () => {
      const res = await callPOST({});
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Missing idToken");
    });

    it("returns 400 when idToken is not a string", async () => {
      const res = await callPOST({ idToken: 123 });
      expect(res.status).toBe(400);
    });

    it("creates session cookie and sets it on response", async () => {
      mockCreateSessionCookie.mockResolvedValue("session_cookie_value");
      const res = await callPOST({ idToken: "valid_firebase_token" });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("ok");

      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toContain("__session=session_cookie_value");
      expect(setCookie).toContain("HttpOnly");
    });

    it("returns 401 when Firebase rejects the token", async () => {
      mockCreateSessionCookie.mockRejectedValue(new Error("Invalid ID token"));
      const res = await callPOST({ idToken: "bad_token" });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Failed to create session");
    });
  });

  describe("DELETE", () => {
    it("clears session cookie", async () => {
      const { DELETE } = await import("@/app/api/auth/session/route");
      const res = await DELETE();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("ok");

      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toContain("__session=");
      expect(setCookie).toContain("Max-Age=0");
    });
  });
});
