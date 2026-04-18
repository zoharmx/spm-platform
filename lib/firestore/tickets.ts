import {
  collection, doc, onSnapshot, updateDoc, addDoc,
  serverTimestamp, query, orderBy, Timestamp, increment,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { ServiceTicket, ServiceTicketStatus, TicketEvent } from "@/types";

const COL = "service_tickets";

/** Subscribe to all tickets ordered by creation date (newest first). */
export function subscribeTickets(
  cb: (tickets: ServiceTicket[]) => void
): Unsubscribe {
  const db = getDb();
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ServiceTicket));
  });
}

/** Advance a ticket to the next status and append to statusHistory. */
export async function advanceTicketStatus(
  ticketId: string,
  newStatus: ServiceTicketStatus,
  note: string,
  userId: string
): Promise<void> {
  const db = getDb();
  const ref = doc(db, COL, ticketId);
  const event: TicketEvent = {
    status: newStatus,
    timestamp: Timestamp.now(),
    note: note || undefined,
    userId,
  };
  await updateDoc(ref, {
    status: newStatus,
    updatedAt: serverTimestamp(),
    ...(newStatus === "completado" ? { completedAt: serverTimestamp() } : {}),
    statusHistory: [] as TicketEvent[], // will be handled below
  });
  // Use arrayUnion-like pattern via direct field update
  const snap = await import("firebase/firestore").then(({ getDoc }) =>
    getDoc(ref)
  );
  const existing: TicketEvent[] = snap.data()?.statusHistory ?? [];
  await updateDoc(ref, {
    statusHistory: [...existing, event],
  });
}

/** Assign a mechanic to a ticket. */
export async function assignMechanic(
  ticketId: string,
  mechanicId: string,
  mechanicName: string
): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COL, mechanicId ? ticketId : ticketId), {
    mechanicId: mechanicId || null,
    mechanicName: mechanicName || null,
    updatedAt: serverTimestamp(),
  });
}

/** Update editable fields on a ticket. */
export async function updateTicketFields(
  ticketId: string,
  fields: Partial<Pick<ServiceTicket, "estimatedCost" | "finalCost" | "diagnosis" | "workDone" | "mechanicId" | "mechanicName" | "anticipo">>
): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COL, ticketId), {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}

/** Create a new ticket directly (CRM-initiated, not via quote form). Requires a linked clientId. */
export async function createTicketDirect(data: {
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceType: string;
  serviceDescription: string;
  serviceAddress: string;
  source?: string;
}): Promise<string> {
  const db = getDb();

  const { getDoc, doc: fsDoc, runTransaction } = await import("firebase/firestore");
  const counterRef = fsDoc(db, "_counters", "service_tickets");

  let ticketId = "";
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const count = (snap.data()?.count ?? 0) + 1;
    ticketId = `SPM-${String(count).padStart(4, "0")}`;
    tx.set(counterRef, { count }, { merge: true });
  });

  await addDoc(collection(db, COL), {
    ticketId,
    status: "lead-recibido",
    clientId: data.clientId,
    clientName: data.clientName,
    clientPhone: data.clientPhone,
    ...(data.clientEmail ? { clientEmail: data.clientEmail } : {}),
    serviceType: data.serviceType,
    serviceDescription: data.serviceDescription,
    serviceAddress: { street: data.serviceAddress },
    source: data.source ?? "crm-directo",
    statusHistory: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Increment client ticket counter
  await updateDoc(doc(db, "clients", data.clientId), {
    totalTickets: increment(1),
    updatedAt: serverTimestamp(),
  });

  return ticketId;
}

/** Mark a ticket as paid in cash (no Stripe). Also updates client totalPaid. */
export async function markAsPaidCash(
  ticketId: string,
  userId: string,
  options?: { clientId?: string; finalCost?: number }
): Promise<void> {
  const db = getDb();
  const ref = doc(db, COL, ticketId);

  const { getDoc } = await import("firebase/firestore");
  const snap = await getDoc(ref);
  const existing: TicketEvent[] = snap.data()?.statusHistory ?? [];
  const event: TicketEvent = {
    status: "pagado",
    timestamp: Timestamp.now(),
    note: "Pago en efectivo registrado",
    userId,
  };

  await updateDoc(ref, {
    status: "pagado",
    paymentMethod: "efectivo",
    paidAt: serverTimestamp(),
    statusHistory: [...existing, event],
    updatedAt: serverTimestamp(),
  });

  if (options?.clientId && options?.finalCost) {
    await updateDoc(doc(db, "clients", options.clientId), {
      totalPaid: increment(options.finalCost),
      updatedAt: serverTimestamp(),
    });
  }
}
