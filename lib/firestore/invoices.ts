import {
  collection, onSnapshot, query, orderBy,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { ServiceTicket } from "@/types";

/**
 * Facturas = tickets en estado "completado" o "pagado".
 *
 * Usamos orderBy("createdAt") sin filtro de status para evitar el índice
 * compuesto (status + paidAt) que falla cuando paidAt no está presente en
 * el documento. El filtro de estado se aplica en el cliente.
 */
export function subscribeInvoices(
  cb: (tickets: ServiceTicket[]) => void
): Unsubscribe {
  const db = getDb();
  const q  = query(
    collection(db, "service_tickets"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ServiceTicket);
    // Mostrar completados Y pagados — ambos son facturables
    cb(all.filter(t => t.status === "completado" || t.status === "pagado"));
  });
}
