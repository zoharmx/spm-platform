import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAdminDb } from "@/lib/firebase-admin";

describe("POST /api/quotes", () => {
  const mockSet = vi.fn();
  const mockGet = vi.fn();
  const mockRunTransaction = vi.fn();
  const mockDoc = vi.fn(() => ({ id: "auto-id-123" }));
  const mockCollection = vi.fn(() => ({ doc: mockDoc }));

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mockRunTransaction.mockImplementation(async (cb: (tx: unknown) => Promise<void>) => {
      const tx = {
        get: mockGet.mockResolvedValue({ exists: true, data: () => ({ count: 5 }) }),
        set: mockSet,
      };
      await cb(tx);
    });

    (getAdminDb as ReturnType<typeof vi.fn>).mockReturnValue({
      collection: mockCollection,
      runTransaction: mockRunTransaction,
    });
  });

  async function callPOST(body: Record<string, unknown>, ip = "192.168.1.1") {
    const { POST } = await import("@/app/api/quotes/route");
    const req = new Request("http://localhost/api/quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": ip,
      },
      body: JSON.stringify(body),
    });
    return POST(req as never);
  }

  const validBody = {
    name: "Juan García",
    phone: "+528112345678",
    address: "Calle 5, Col. Centro, MTY",
    serviceType: "frenos",
    description: "Frenos traseros hacen ruido",
  };

  it("creates quote and ticket with valid data", async () => {
    const res = await callPOST(validBody, "10.1.0.1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.ticketId).toBe("SPM-0006");
    expect(body.message).toContain("Cotización");
  });

  it("returns 400 for missing required fields", async () => {
    const res = await callPOST({ name: "Juan" }, "10.1.0.2");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Missing required fields");
  });

  it("returns 400 for invalid phone", async () => {
    const res = await callPOST({ ...validBody, phone: "abc" }, "10.1.0.3");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid phone");
  });

  it("returns 400 for invalid email", async () => {
    const res = await callPOST(
      { ...validBody, email: "not-an-email" },
      "10.1.0.4"
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid email");
  });

  it("accepts valid optional email", async () => {
    const res = await callPOST(
      { ...validBody, email: "juan@test.com" },
      "10.1.0.5"
    );
    expect(res.status).toBe(200);
  });

  it("truncates long fields to limits", async () => {
    const res = await callPOST(
      { ...validBody, name: "A".repeat(200) },
      "10.1.0.6"
    );
    expect(res.status).toBe(200);
    const txCall = mockSet.mock.calls;
    const leadData = txCall.find((c: unknown[]) => {
      const data = c[1] as Record<string, unknown>;
      return data && typeof data === "object" && "name" in data && typeof data.name === "string" && data.name.length <= 100;
    });
    expect(leadData).toBeTruthy();
  });

  it("returns 429 when rate limited", async () => {
    const sameIp = "10.2.0.99";
    for (let i = 0; i < 5; i++) {
      await callPOST(validBody, sameIp);
    }
    const res = await callPOST(validBody, sameIp);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });

  it("handles server errors gracefully", async () => {
    mockRunTransaction.mockRejectedValue(new Error("Firestore down"));
    const res = await callPOST(validBody, "10.3.0.1");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Server error");
  });

  it("rejects non-numeric year values", async () => {
    const res = await callPOST(
      { ...validBody, motoYear: "abc" },
      "10.4.0.1"
    );
    expect(res.status).toBe(200);
  });

  it("validates year range", async () => {
    const res = await callPOST(
      { ...validBody, motoYear: 1800 },
      "10.4.0.2"
    );
    expect(res.status).toBe(200);
  });
});
