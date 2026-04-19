import { describe, it, expect, vi, beforeEach } from "vitest";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, Timestamp, increment, onSnapshot, orderBy } from "firebase/firestore";

describe("firestore/tickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("subscribeTickets", () => {
    it("sets up listener ordered by createdAt desc", async () => {
      const { subscribeTickets } = await import("@/lib/firestore/tickets");
      subscribeTickets(vi.fn());
      expect(orderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(onSnapshot).toHaveBeenCalled();
    });
  });

  describe("assignMechanic", () => {
    it("updates mechanic fields on ticket", async () => {
      const mockRef = { id: "ticket-assign" };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockRef);
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const { assignMechanic } = await import("@/lib/firestore/tickets");
      await assignMechanic("ticket-assign", "mec-1", "Carlos");

      expect(updateDoc).toHaveBeenCalledWith(
        mockRef,
        expect.objectContaining({
          mechanicId: "mec-1",
          mechanicName: "Carlos",
        })
      );
    });

    it("sets null when mechanic is empty", async () => {
      const mockRef = { id: "ticket-unassign" };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockRef);
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const { assignMechanic } = await import("@/lib/firestore/tickets");
      await assignMechanic("ticket-unassign", "", "");

      expect(updateDoc).toHaveBeenCalledWith(
        mockRef,
        expect.objectContaining({
          mechanicId: null,
          mechanicName: null,
        })
      );
    });
  });

  describe("updateTicketFields", () => {
    it("updates specified fields with updatedAt", async () => {
      const mockRef = { id: "ticket-update" };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockRef);
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const { updateTicketFields } = await import("@/lib/firestore/tickets");
      await updateTicketFields("ticket-update", {
        estimatedCost: 500,
        finalCost: 800,
        diagnosis: "Pastillas desgastadas",
      });

      expect(updateDoc).toHaveBeenCalledWith(
        mockRef,
        expect.objectContaining({
          estimatedCost: 500,
          finalCost: 800,
          diagnosis: "Pastillas desgastadas",
        })
      );
    });
  });

  describe("advanceTicketStatus", () => {
    it("reads existing history and appends new event", async () => {
      const mockRef = { id: "doc-123", path: "service_tickets/doc-123" };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockRef);
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
        exists: () => true,
        data: () => ({
          statusHistory: [
            { status: "lead-recibido", timestamp: { seconds: 1000 }, userId: "u1" },
          ],
        }),
      });
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const { advanceTicketStatus } = await import("@/lib/firestore/tickets");
      await advanceTicketStatus("doc-123", "diagnostico-pendiente", "nota test", "user-abc");

      expect(getDoc).toHaveBeenCalledWith(mockRef);
      expect(updateDoc).toHaveBeenCalledWith(
        mockRef,
        expect.objectContaining({
          status: "diagnostico-pendiente",
          statusHistory: expect.arrayContaining([
            expect.objectContaining({ status: "lead-recibido" }),
            expect.objectContaining({ status: "diagnostico-pendiente", userId: "user-abc" }),
          ]),
        })
      );
    });

    it("throws when document does not exist", async () => {
      const mockRef = { id: "missing" };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockRef);
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
        exists: () => false,
        data: () => undefined,
      });

      const { advanceTicketStatus } = await import("@/lib/firestore/tickets");
      await expect(
        advanceTicketStatus("missing", "en-camino", "", "user-1")
      ).rejects.toThrow("not found");
    });

    it("omits note field when empty (avoids Firestore undefined error)", async () => {
      const mockRef = { id: "doc-456" };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockRef);
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
        exists: () => true,
        data: () => ({ statusHistory: [] }),
      });
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const { advanceTicketStatus } = await import("@/lib/firestore/tickets");
      await advanceTicketStatus("doc-456", "en-servicio", "", "user-x");

      const updateCall = (updateDoc as ReturnType<typeof vi.fn>).mock.calls[0][1];
      const newEvent = updateCall.statusHistory[0];
      expect(newEvent).not.toHaveProperty("note");
    });

    it("includes note when provided", async () => {
      const mockRef = { id: "doc-789" };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockRef);
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
        exists: () => true,
        data: () => ({ statusHistory: [] }),
      });
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const { advanceTicketStatus } = await import("@/lib/firestore/tickets");
      await advanceTicketStatus("doc-789", "completado", "Servicio OK", "user-y");

      const updateCall = (updateDoc as ReturnType<typeof vi.fn>).mock.calls[0][1];
      const newEvent = updateCall.statusHistory[0];
      expect(newEvent.note).toBe("Servicio OK");
      expect(updateCall).toHaveProperty("completedAt");
    });

    it("sets completedAt when advancing to completado", async () => {
      const mockRef = { id: "doc-comp" };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockRef);
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
        exists: () => true,
        data: () => ({ statusHistory: [] }),
      });
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const { advanceTicketStatus } = await import("@/lib/firestore/tickets");
      await advanceTicketStatus("doc-comp", "completado", "", "u1");

      const updateCall = (updateDoc as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(updateCall).toHaveProperty("completedAt");
    });

    it("does NOT set completedAt for other statuses", async () => {
      const mockRef = { id: "doc-other" };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockRef);
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
        exists: () => true,
        data: () => ({ statusHistory: [] }),
      });
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const { advanceTicketStatus } = await import("@/lib/firestore/tickets");
      await advanceTicketStatus("doc-other", "en-camino", "", "u1");

      const updateCall = (updateDoc as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(updateCall).not.toHaveProperty("completedAt");
    });
  });

  describe("recordPayment", () => {
    it("appends payment and updates totalPaid", async () => {
      const mockRef = { id: "ticket-pay" };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockRef);
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
        exists: () => true,
        data: () => ({
          payments: [],
          statusHistory: [],
          totalPaid: 0,
          finalCost: 1000,
          clientId: "client-1",
        }),
      });
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const { recordPayment } = await import("@/lib/firestore/tickets");
      await recordPayment("ticket-pay", {
        type: "parcial",
        method: "efectivo",
        amount: 500,
        registeredBy: "op-1",
        registeredByName: "Operador",
      });

      const updateCall = (updateDoc as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(updateCall.payments).toHaveLength(1);
      expect(updateCall.payments[0].amount).toBe(500);
      expect(updateCall.payments[0].method).toBe("efectivo");
      expect(updateCall.totalPaid).toBe(500);
    });

    it("marks as pagado when fully paid with final payment", async () => {
      const mockRef = { id: "ticket-full" };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockRef);
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
        exists: () => true,
        data: () => ({
          payments: [{ id: "PAY-1", amount: 500 }],
          statusHistory: [],
          totalPaid: 500,
          finalCost: 1000,
          clientId: "client-2",
        }),
      });
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const { recordPayment } = await import("@/lib/firestore/tickets");
      await recordPayment("ticket-full", {
        type: "final",
        method: "stripe",
        amount: 500,
        registeredBy: "op-2",
      });

      const updateCall = (updateDoc as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(updateCall.status).toBe("pagado");
      expect(updateCall.paymentMethod).toBe("stripe");
      expect(updateCall.statusHistory).toBeDefined();
    });

    it("does NOT mark as pagado for partial payments even if total >= finalCost", async () => {
      const mockRef = { id: "ticket-partial" };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockRef);
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
        exists: () => true,
        data: () => ({
          payments: [],
          statusHistory: [],
          totalPaid: 500,
          finalCost: 1000,
          clientId: "client-3",
        }),
      });
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const { recordPayment } = await import("@/lib/firestore/tickets");
      await recordPayment("ticket-partial", {
        type: "parcial",
        method: "efectivo",
        amount: 500,
        registeredBy: "op-3",
      });

      const updateCall = (updateDoc as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(updateCall.status).toBeUndefined();
    });

    it("sets anticipoPagado for anticipo payments", async () => {
      const mockRef = { id: "ticket-ant" };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockRef);
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
        exists: () => true,
        data: () => ({
          payments: [],
          statusHistory: [],
          totalPaid: 0,
          finalCost: 0,
          anticipo: 0,
        }),
      });
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const { recordPayment } = await import("@/lib/firestore/tickets");
      await recordPayment("ticket-ant", {
        type: "anticipo",
        method: "stripe",
        amount: 200,
        registeredBy: "op-4",
      });

      const updateCall = (updateDoc as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(updateCall.anticipoPagado).toBe(true);
      expect(updateCall.anticipo).toBe(200);
    });

    it("omits undefined optional fields from payment object", async () => {
      const mockRef = { id: "ticket-clean" };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockRef);
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
        exists: () => true,
        data: () => ({
          payments: [],
          statusHistory: [],
          totalPaid: 0,
          finalCost: 500,
        }),
      });
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const { recordPayment } = await import("@/lib/firestore/tickets");
      await recordPayment("ticket-clean", {
        type: "parcial",
        method: "efectivo",
        amount: 100,
        registeredBy: "op-5",
      });

      const payment = (updateDoc as ReturnType<typeof vi.fn>).mock.calls[0][1].payments[0];
      expect(payment).not.toHaveProperty("note");
      expect(payment).not.toHaveProperty("stripeSessionId");
      expect(payment).not.toHaveProperty("stripeUrl");
      expect(payment).not.toHaveProperty("registeredByName");
    });
  });

  describe("markAsPaidCash", () => {
    it("marks ticket as pagado with efectivo method", async () => {
      const mockRef = { id: "ticket-cash" };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockRef);
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
        exists: () => true,
        data: () => ({ statusHistory: [] }),
      });
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const { markAsPaidCash } = await import("@/lib/firestore/tickets");
      await markAsPaidCash("ticket-cash", "user-cash");

      const updateCall = (updateDoc as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(updateCall.status).toBe("pagado");
      expect(updateCall.paymentMethod).toBe("efectivo");
    });

    it("updates client totalPaid when clientId and finalCost provided", async () => {
      const mockRef = { id: "ticket-cash-2" };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockRef);
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
        exists: () => true,
        data: () => ({ statusHistory: [] }),
      });
      (updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const { markAsPaidCash } = await import("@/lib/firestore/tickets");
      await markAsPaidCash("ticket-cash-2", "user-1", {
        clientId: "client-abc",
        finalCost: 750,
      });

      expect(updateDoc).toHaveBeenCalledTimes(2);
    });
  });
});
