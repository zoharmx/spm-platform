import {
  collection, onSnapshot, addDoc, updateDoc, doc,
  serverTimestamp, query, orderBy, type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { Client } from "@/types";

const COL = "clients";

export function subscribeClients(cb: (c: Client[]) => void): Unsubscribe {
  const db = getDb();
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Client));
  });
}

export async function createClient(data: {
  name: string;
  lastName: string;
  phone: string;
  email?: string;
  motoBrand?: string;
  motoModel?: string;
  motoYear?: number;
  motoColor?: string;
  motoPlaca?: string;
}): Promise<void> {
  const db = getDb();
  const { runTransaction, doc: fsDoc } = await import("firebase/firestore");
  const counterRef = fsDoc(db, "_counters", "clients");

  let clientId = "";
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const count = (snap.data()?.count ?? 0) + 1;
    clientId = `CLT-${String(count).padStart(6, "0")}`;
    tx.set(counterRef, { count }, { merge: true });
  });

  const { motoBrand, motoModel, motoYear, motoColor, motoPlaca, ...clientData } = data;

  await addDoc(collection(db, COL), {
    clientId,
    ...clientData,
    ...(motoBrand ? { motoBrand } : {}),
    ...(motoModel ? { motoModel } : {}),
    ...(motoYear ? { motoYear } : {}),
    ...(motoColor ? { motoColor } : {}),
    ...(motoPlaca ? { motoPlaca } : {}),
    type: "individual",
    totalTickets: 0,
    totalPaid: 0,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateClient(
  id: string,
  fields: Partial<Client>
): Promise<void> {
  await updateDoc(doc(getDb(), COL, id), {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}
