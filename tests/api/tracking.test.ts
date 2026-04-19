import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAdminDb } from "@/lib/firebase-admin";

describe("GET /api/tracking/[ticketId]", () => {
  const mockGet = vi.fn();
  const mockLimit = vi.fn(() => ({ get: mockGet }));
  const mockWhere = vi.fn(() => ({ limit: mockLimit }));
  const mockCollection = vi.fn(() => ({ where: mockWhere }));

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    (getAdminDb as ReturnType<typeof vi.fn>).mockReturnValue({
      collection: mockCollection,
    });
  });

  async function callGET(ticketId: string, ip = "127.0.0.1") {
    const { GET } = await import("@/app/api/tracking/[ticketId]/route");
    const req = new Request(`http://localhost/api/tracking/${ticketId}`, {
      headers: { "x-forwarded-for": ip },
    });
    return GET(req as never, { params: Promise.resolve({ ticketId }) });
  }

  it("returns 404 for non-existent ticket", async () => {
    mockGet.mockResolvedValue({ empty: true, docs: [] });

    const res = await callGET("SPM-9999", "10.0.0.1");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Ticket not found");
  });

  it("returns public fields for existing ticket", async () => {
    mockGet.mockResolvedValue({
      empty: false,
      docs: [{
        data: () => ({
          ticketId: "SPM-0001",
          status: "en-servicio",
          clientName: "Juan Pérez",
          mechanicName: "Carlos",
          mechanicPhone: "+5281000000",
          serviceType: "frenos",
          serviceAddress: { street: "Calle 1", colonia: "Centro", city: "MTY" },
          estimatedCost: 850,
          createdAt: { toDate: () => new Date("2024-01-15") },
          updatedAt: { toDate: () => new Date("2024-01-16") },
          clientEmail: "should-not-appear@test.com",
          stripeSessionId: "should-not-appear",
        }),
      }],
    });

    const res = await callGET("SPM-0001", "10.0.0.2");
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.ticketId).toBe("SPM-0001");
    expect(body.status).toBe("en-servicio");
    expect(body.clientName).toBe("Juan Pérez");
    expect(body.mechanicName).toBe("Carlos");
    expect(body.mechanicPhone).toBe("+5281000000");
    expect(body.estimatedCost).toBe(850);
    expect(body).not.toHaveProperty("clientEmail");
    expect(body).not.toHaveProperty("stripeSessionId");
  });

  it("hides mechanicPhone for non-active statuses", async () => {
    mockGet.mockResolvedValue({
      empty: false,
      docs: [{
        data: () => ({
          ticketId: "SPM-0002",
          status: "completado",
          clientName: "Ana",
          mechanicPhone: "+5281111111",
          createdAt: null,
          updatedAt: null,
        }),
      }],
    });

    const res = await callGET("SPM-0002", "10.0.0.3");
    const body = await res.json();
    expect(body.mechanicPhone).toBeUndefined();
  });

  it("uppercases ticket ID for query", async () => {
    mockGet.mockResolvedValue({ empty: true, docs: [] });

    await callGET("spm-0001", "10.0.0.4");
    expect(mockWhere).toHaveBeenCalledWith("ticketId", "==", "SPM-0001");
  });
});
