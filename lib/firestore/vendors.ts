import {
  collection, doc, onSnapshot, addDoc, updateDoc,
  serverTimestamp, query, orderBy, where, type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { Vendor } from "@/types";

const COL = "vendors";

export function subscribeVendors(cb: (v: Vendor[]) => void): Unsubscribe {
  const db = getDb();
  const q = query(collection(db, COL), orderBy("name", "asc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Vendor));
  });
}

export function subscribeActiveVendors(cb: (v: Vendor[]) => void): Unsubscribe {
  const db = getDb();
  const q = query(
    collection(db, COL),
    where("isActive", "==", true),
    orderBy("name", "asc")
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Vendor));
  });
}

export async function createVendor(
  data: Omit<Vendor, "id" | "vendorId" | "createdAt" | "updatedAt">
): Promise<string> {
  const db = getDb();
  const { runTransaction, doc: fsDoc } = await import("firebase/firestore");
  const counterRef = fsDoc(db, "_counters", "vendors");

  let vendorId = "";
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const count = (snap.data()?.count ?? 0) + 1;
    vendorId = `PROV-${String(count).padStart(4, "0")}`;
    tx.set(counterRef, { count }, { merge: true });
  });

  const ref = await addDoc(collection(db, COL), {
    ...data,
    vendorId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateVendor(
  id: string,
  fields: Partial<Omit<Vendor, "id" | "vendorId" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(getDb(), COL, id), {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}
