import {
  collection, doc, onSnapshot, addDoc, updateDoc, getDoc,
  serverTimestamp, query, orderBy, where, type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { adjustStock } from "./products";
import type { PurchaseOrder, PurchaseOrderItem } from "@/types";

const COL = "purchase_orders";

export function subscribePurchaseOrders(
  cb: (orders: PurchaseOrder[]) => void
): Unsubscribe {
  const db = getDb();
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PurchaseOrder));
  });
}

export function subscribePurchaseOrdersByVendor(
  vendorId: string,
  cb: (orders: PurchaseOrder[]) => void
): Unsubscribe {
  const db = getDb();
  const q = query(
    collection(db, COL),
    where("vendorId", "==", vendorId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PurchaseOrder));
  });
}

export async function createPurchaseOrder(
  data: Omit<PurchaseOrder, "id" | "orderId" | "createdAt" | "updatedAt">
): Promise<string> {
  const db = getDb();
  const { runTransaction, doc: fsDoc } = await import("firebase/firestore");
  const counterRef = fsDoc(db, "_counters", "purchase_orders");

  let orderId = "";
  const year = new Date().getFullYear();
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const count = (snap.data()?.count ?? 0) + 1;
    orderId = `OC-${year}-${String(count).padStart(4, "0")}`;
    tx.set(counterRef, { count }, { merge: true });
  });

  const ref = await addDoc(collection(db, COL), {
    ...data,
    orderId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Mark a purchase order as fully received and increment stock for each item
 * that has a linked productId in the catalog.
 */
export async function receivePurchaseOrder(
  orderId: string,
  receivedBy: string,
  items?: PurchaseOrderItem[]
): Promise<void> {
  const db = getDb();
  const snap = await getDoc(doc(db, COL, orderId));
  if (!snap.exists()) throw new Error(`Purchase order ${orderId} not found`);

  const order = { id: snap.id, ...snap.data() } as PurchaseOrder;
  const toProcess = items ?? order.items;

  for (const item of toProcess) {
    if (!item.productId) continue;
    const qty = item.receivedQty ?? item.qty;
    if (qty <= 0) continue;

    await adjustStock(item.productId, qty, {
      type: "compra",
      reference: order.orderId,
      note: `Recepción OC ${order.orderId} — ${item.productName}`,
      unitCost: item.unitCost,
      createdBy: receivedBy,
    });
  }

  await updateDoc(doc(db, COL, orderId), {
    status: "recibida-completa",
    receivedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
