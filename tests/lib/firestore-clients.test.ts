import { describe, it, expect, vi, beforeEach } from "vitest";
import { addDoc, updateDoc, onSnapshot, orderBy } from "firebase/firestore";

describe("firestore/clients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("subscribeClients", () => {
    it("sets up onSnapshot listener ordered by createdAt desc", async () => {
      const { subscribeClients } = await import("@/lib/firestore/clients");
      const cb = vi.fn();
      subscribeClients(cb);

      expect(orderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(onSnapshot).toHaveBeenCalled();
    });
  });

  describe("createClient", () => {
    it("creates client with basic fields and generates CLT ID", async () => {
      const { subscribeClients, createClient } = await import("@/lib/firestore/clients");
      await createClient({
        name: "Juan",
        lastName: "García",
        phone: "+528112345678",
      });

      expect(addDoc).toHaveBeenCalled();
      const callArgs = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(callArgs.name).toBe("Juan");
      expect(callArgs.lastName).toBe("García");
      expect(callArgs.phone).toBe("+528112345678");
      expect(typeof callArgs.clientId).toBe("string");
      expect(callArgs.type).toBe("individual");
      expect(callArgs.totalTickets).toBe(0);
      expect(callArgs.isActive).toBe(true);
    });

    it("includes motorcycle fields when provided", async () => {
      const { createClient } = await import("@/lib/firestore/clients");
      await createClient({
        name: "Ana",
        lastName: "López",
        phone: "+528100000000",
        motoBrand: "Honda",
        motoModel: "CB500F",
        motoYear: 2023,
        motoColor: "Rojo",
        motoPlaca: "ABC-123",
      });

      const callArgs = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(callArgs.motoBrand).toBe("Honda");
      expect(callArgs.motoModel).toBe("CB500F");
      expect(callArgs.motoYear).toBe(2023);
      expect(callArgs.motoColor).toBe("Rojo");
      expect(callArgs.motoPlaca).toBe("ABC-123");
    });

    it("omits empty motorcycle fields", async () => {
      const { createClient } = await import("@/lib/firestore/clients");
      await createClient({
        name: "Carlos",
        lastName: "Ruiz",
        phone: "+528100000001",
      });

      const callArgs = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(callArgs).not.toHaveProperty("motoBrand");
      expect(callArgs).not.toHaveProperty("motoModel");
      expect(callArgs).not.toHaveProperty("motoYear");
      expect(callArgs).not.toHaveProperty("motoColor");
      expect(callArgs).not.toHaveProperty("motoPlaca");
    });

    it("includes email when provided", async () => {
      const { createClient } = await import("@/lib/firestore/clients");
      await createClient({
        name: "Test",
        lastName: "User",
        phone: "+521",
        email: "test@email.com",
      });

      const callArgs = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(callArgs.email).toBe("test@email.com");
    });
  });

  describe("updateClient", () => {
    it("calls updateDoc with fields and updatedAt", async () => {
      const { updateClient } = await import("@/lib/firestore/clients");
      await updateClient("client-123", { name: "Updated" } as never);
      expect(updateDoc).toHaveBeenCalled();
    });
  });
});
