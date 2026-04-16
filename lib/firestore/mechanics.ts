import {
  collection, onSnapshot, addDoc, updateDoc, doc,
  serverTimestamp, query, orderBy, type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { Mechanic, ServiceType } from "@/types";

const COL = "mechanics";

export function subscribeMechanics(cb: (m: Mechanic[]) => void): Unsubscribe {
  const db = getDb();
  const q = query(collection(db, COL), orderBy("name", "asc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Mechanic));
  });
}

export async function createMechanic(data: {
  name: string;
  phone?: string;
  email?: string;
  zona: string[];
  skills: ServiceType[];
}): Promise<void> {
  const db = getDb();
  const { getDoc, doc: fsDoc } = await import("firebase/firestore");
  const counterRef = fsDoc(db, "_counters", "mechanics");

  let mechanicId = "";
  const { runTransaction } = await import("firebase/firestore");
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const count = (snap.data()?.count ?? 0) + 1;
    mechanicId = `MEC-${String(count).padStart(3, "0")}`;
    tx.set(counterRef, { count }, { merge: true });
  });

  await addDoc(collection(db, COL), {
    mechanicId,
    ...data,
    status: "disponible",
    totalServicesCompleted: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateMechanicStatus(
  id: string,
  status: Mechanic["status"]
): Promise<void> {
  await updateDoc(doc(getDb(), COL, id), { status, updatedAt: serverTimestamp() });
}
