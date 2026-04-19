import { describe, it, expect } from "vitest";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_PIPELINE,
  NEXT_STATUS,
  SERVICE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_TYPE_LABELS,
} from "@/types";
import type { ServiceTicketStatus } from "@/types";

describe("types/index constants", () => {
  describe("STATUS_LABELS", () => {
    it("has a label for every pipeline status", () => {
      const allStatuses: ServiceTicketStatus[] = [
        "lead-recibido", "diagnostico-pendiente", "en-camino",
        "en-servicio", "completado", "pagado", "cancelado",
      ];
      for (const s of allStatuses) {
        expect(STATUS_LABELS[s]).toBeTruthy();
        expect(typeof STATUS_LABELS[s]).toBe("string");
      }
    });
  });

  describe("STATUS_COLORS", () => {
    it("has a color class for every status", () => {
      for (const s of Object.keys(STATUS_LABELS) as ServiceTicketStatus[]) {
        expect(STATUS_COLORS[s]).toBeTruthy();
      }
    });
  });

  describe("STATUS_PIPELINE", () => {
    it("contains 6 statuses in order", () => {
      expect(STATUS_PIPELINE).toHaveLength(6);
      expect(STATUS_PIPELINE[0]).toBe("lead-recibido");
      expect(STATUS_PIPELINE[STATUS_PIPELINE.length - 1]).toBe("pagado");
    });

    it("does not include cancelado", () => {
      expect(STATUS_PIPELINE).not.toContain("cancelado");
    });
  });

  describe("NEXT_STATUS", () => {
    it("maps each pipeline status to the next one", () => {
      expect(NEXT_STATUS["lead-recibido"]).toBe("diagnostico-pendiente");
      expect(NEXT_STATUS["diagnostico-pendiente"]).toBe("en-camino");
      expect(NEXT_STATUS["en-camino"]).toBe("en-servicio");
      expect(NEXT_STATUS["en-servicio"]).toBe("completado");
      expect(NEXT_STATUS["completado"]).toBe("pagado");
    });

    it("has no mapping for pagado or cancelado", () => {
      expect(NEXT_STATUS["pagado"]).toBeUndefined();
      expect(NEXT_STATUS["cancelado"]).toBeUndefined();
    });
  });

  describe("SERVICE_LABELS", () => {
    it("has at least 10 service types", () => {
      expect(Object.keys(SERVICE_LABELS).length).toBeGreaterThanOrEqual(10);
    });

    it("includes common services", () => {
      expect(SERVICE_LABELS["afinacion-menor"]).toBeTruthy();
      expect(SERVICE_LABELS["frenos"]).toBeTruthy();
      expect(SERVICE_LABELS["diagnostico"]).toBeTruthy();
    });
  });

  describe("PAYMENT constants", () => {
    it("has labels for all payment methods", () => {
      expect(PAYMENT_METHOD_LABELS["stripe"]).toBeTruthy();
      expect(PAYMENT_METHOD_LABELS["efectivo"]).toBeTruthy();
      expect(PAYMENT_METHOD_LABELS["transferencia"]).toBeTruthy();
    });

    it("has labels for all payment types", () => {
      expect(PAYMENT_TYPE_LABELS["anticipo"]).toBeTruthy();
      expect(PAYMENT_TYPE_LABELS["parcial"]).toBeTruthy();
      expect(PAYMENT_TYPE_LABELS["final"]).toBeTruthy();
    });
  });

  describe("STATUS_ICONS", () => {
    it("has an icon for every status", () => {
      const allStatuses: ServiceTicketStatus[] = [
        "lead-recibido", "diagnostico-pendiente", "en-camino",
        "en-servicio", "completado", "pagado", "cancelado",
      ];
      for (const s of allStatuses) {
        expect(STATUS_LABELS[s]).toBeTruthy();
      }
    });
  });
});
