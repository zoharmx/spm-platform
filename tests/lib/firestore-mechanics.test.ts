import { describe, it, expect, vi, beforeEach } from "vitest";
import { addDoc, updateDoc, onSnapshot, orderBy, doc } from "firebase/firestore";

describe("firestore/mechanics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("subscribeMechanics", () => {
    it("sets up listener ordered by name asc", async () => {
      const { subscribeMechanics } = await import("@/lib/firestore/mechanics");
      subscribeMechanics(vi.fn());
      expect(orderBy).toHaveBeenCalledWith("name", "asc");
      expect(onSnapshot).toHaveBeenCalled();
    });
  });

  describe("createMechanic", () => {
    it("creates mechanic with correct fields", async () => {
      const { createMechanic } = await import("@/lib/firestore/mechanics");
      await createMechanic({
        name: "Carlos Méndez",
        phone: "+528100000000",
        zona: ["centro", "sur"],
        skills: ["frenos", "suspension"],
      });

      expect(addDoc).toHaveBeenCalled();
      const callArgs = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(callArgs.name).toBe("Carlos Méndez");
      expect(callArgs.phone).toBe("+528100000000");
      expect(callArgs.zona).toEqual(["centro", "sur"]);
      expect(callArgs.status).toBe("disponible");
      expect(callArgs.totalServicesCompleted).toBe(0);
    });
  });

  describe("updateMechanicStatus", () => {
    it("updates mechanic status", async () => {
      const { updateMechanicStatus } = await import("@/lib/firestore/mechanics");
      await updateMechanicStatus("mec-123", "en-servicio");
      expect(updateDoc).toHaveBeenCalled();
    });
  });
});
