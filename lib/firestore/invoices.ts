import {
  collection, onSnapshot, query, orderBy,
  where, type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { ServiceTicket } from "@/types";

/**
 * Invoices in SPM are derived from paid service tickets — there's no
 * separate invoices collection. Each ticket with status "pagado" is an
 * invoice. This helper subscribes to those tickets for the Facturas module.
 */

/** Subscribe to all paid tickets (invoices), newest first. */
export function subscribeInvoices(
  cb: (tickets: ServiceTicket[]) => void
): Unsubscribe {
  const db = getDb();
  const q  = query(
    collection(db, "service_tickets"),
    where("status", "==", "pagado"),
    orderBy("paidAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ServiceTicket));
  });
}
