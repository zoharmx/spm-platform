import { describe, it, expect } from "vitest";
import { getStatusMessage, getPushCopy, getVoiceScript } from "@/lib/notifications/messages";
import type { ServiceTicketStatus } from "@/types";

const baseData = {
  clientName: "Juan Pérez",
  ticketId: "SPM-0042",
  mechanicName: "Carlos",
};

const ALL_STATUSES: ServiceTicketStatus[] = [
  "lead-recibido",
  "diagnostico-pendiente",
  "en-camino",
  "en-servicio",
  "completado",
  "pagado",
  "cancelado",
];

describe("getStatusMessage", () => {
  it("returns a message for every status", () => {
    for (const status of ALL_STATUSES) {
      const msg = getStatusMessage(status, baseData);
      expect(msg).toBeTruthy();
      expect(typeof msg).toBe("string");
      expect(msg.length).toBeGreaterThan(10);
    }
  });

  it("uses first name only", () => {
    const msg = getStatusMessage("lead-recibido", baseData);
    expect(msg).toContain("Juan");
    expect(msg).not.toContain("Pérez");
  });

  it("includes ticket ID", () => {
    const msg = getStatusMessage("lead-recibido", baseData);
    expect(msg).toContain("SPM-0042");
  });

  it("includes mechanic name when provided", () => {
    const msg = getStatusMessage("en-camino", baseData);
    expect(msg).toContain("Carlos");
  });

  it("uses fallback when no mechanic", () => {
    const msg = getStatusMessage("en-camino", {
      clientName: "Ana",
      ticketId: "SPM-0001",
    });
    expect(msg).toContain("tu mecánico");
  });

  it("includes payment link for completado", () => {
    const msg = getStatusMessage("completado", {
      ...baseData,
      paymentLink: "https://pay.stripe.com/test_abc",
    });
    expect(msg).toContain("https://pay.stripe.com/test_abc");
  });

  it("does not include payment link section when absent", () => {
    const msg = getStatusMessage("completado", baseData);
    expect(msg).not.toContain("Paga en línea");
  });

  it("includes SPM branding in all messages", () => {
    for (const status of ALL_STATUSES) {
      const msg = getStatusMessage(status, baseData);
      expect(msg).toContain("SanPedroMotoCare");
    }
  });

  it("returns fallback for unknown status", () => {
    const msg = getStatusMessage("unknown-status" as ServiceTicketStatus, baseData);
    expect(msg).toContain("SPM-0042");
    expect(msg).toContain("SanPedroMotoCare");
  });
});

describe("getPushCopy", () => {
  it("returns title and body for every status", () => {
    for (const status of ALL_STATUSES) {
      const copy = getPushCopy(status, baseData);
      expect(copy.title).toBeTruthy();
      expect(copy.body).toBeTruthy();
    }
  });

  it("returns short titles (under 40 chars)", () => {
    for (const status of ALL_STATUSES) {
      const { title } = getPushCopy(status, baseData);
      expect(title.length).toBeLessThanOrEqual(40);
    }
  });

  it("includes ticket ID in body", () => {
    const { body } = getPushCopy("lead-recibido", baseData);
    expect(body).toContain("SPM-0042");
  });

  it("uses first name for pagado", () => {
    const { body } = getPushCopy("pagado", baseData);
    expect(body).toContain("Juan");
  });

  it("returns fallback for unknown status", () => {
    const copy = getPushCopy("unknown" as ServiceTicketStatus, baseData);
    expect(copy.title).toBe("SPM — Actualización");
    expect(copy.body).toContain("SPM-0042");
  });
});

describe("getVoiceScript", () => {
  it("returns script for en-camino", () => {
    const script = getVoiceScript("en-camino", baseData);
    expect(script).toContain("Juan");
    expect(script).toContain("Carlos");
    expect(script).toContain("SanPedroMotoCare");
  });

  it("returns script for completado", () => {
    const script = getVoiceScript("completado", baseData);
    expect(script).toContain("Juan");
    expect(script).toContain("completado");
  });

  it("returns generic fallback for other statuses", () => {
    const script = getVoiceScript("pagado", baseData);
    expect(script).toContain("SPM-0042");
    expect(script).toContain("SanPedroMotoCare");
  });

  it("uses fallback mechanic name when not provided", () => {
    const script = getVoiceScript("en-camino", {
      clientName: "María López",
      ticketId: "SPM-0100",
    });
    expect(script).toContain("nuestro mecánico");
  });
});
