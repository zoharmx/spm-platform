import { describe, it, expect, vi, beforeEach } from "vitest";
import { onSnapshot, orderBy } from "firebase/firestore";

describe("firestore/invoices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("subscribeInvoices", () => {
    it("sets up listener ordered by createdAt desc", async () => {
      const { subscribeInvoices } = await import("@/lib/firestore/invoices");
      subscribeInvoices(vi.fn());
      expect(orderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(onSnapshot).toHaveBeenCalled();
    });
  });
});
