import { NextRequest, NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { createRateLimiter } from "@/lib/rate-limit";

const rateLimiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

const STAFF_ROLES = new Set(["admin", "manager", "operador", "mecanico"]);

// ── Auth ─────────────────────────────────────────────────────────────────────

async function verifyStaff(
  req: NextRequest
): Promise<{ uid: string; name: string; role: string } | null> {
  const sessionCookie = req.cookies.get("__session")?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    const uid = decoded.uid;

    // Role lives in Firestore users/{uid}, not as a custom claim
    const db = getAdminDb();
    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) return null;

    const data = userSnap.data()!;
    const role = (data.role as string) ?? "";
    if (!STAFF_ROLES.has(role)) return null;

    return { uid, name: (data.displayName as string) ?? decoded.email ?? uid, role };
  } catch {
    return null;
  }
}

// ── Firestore context ─────────────────────────────────────────────────────────

async function buildOperationalContext(userMessage: string): Promise<string> {
  const db = getAdminDb();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Fetch last 60 tickets (enough for daily ops view)
  const ticketsSnap = await db
    .collection("service_tickets")
    .orderBy("createdAt", "desc")
    .limit(60)
    .get();

  type TicketDoc = Record<string, unknown>;
  const allTickets = ticketsSnap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as TicketDoc
  );

  const activeTickets = allTickets.filter(
    (t) => !["pagado", "cancelado"].includes(t.status as string)
  );

  const completedToday = allTickets.filter((t) => {
    if (!["pagado", "completado"].includes(t.status as string)) return false;
    const ts = (t.updatedAt as { toDate?: () => Date } | undefined)?.toDate?.();
    return ts !== undefined && ts >= todayStart;
  });

  const revenueToday = completedToday.reduce(
    (sum, t) => sum + ((t.finalCost as number) ?? 0),
    0
  );

  // Status breakdown
  const byStatus: Record<string, number> = {};
  for (const t of activeTickets) {
    const s = t.status as string;
    byStatus[s] = (byStatus[s] ?? 0) + 1;
  }

  // Mechanics
  const mechSnap = await db.collection("mechanics").orderBy("name").get();
  type MechanicDoc = Record<string, unknown>;
  const mechanics = mechSnap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as MechanicDoc
  );

  const available = mechanics.filter((m) => m.status === "disponible").length;

  const mechLines = mechanics
    .map((m) => {
      const skills = Array.isArray(m.skills)
        ? (m.skills as string[]).slice(0, 3).join(", ")
        : "-";
      const zonas = Array.isArray(m.zona)
        ? (m.zona as string[]).join(", ")
        : (m.zona as string) ?? "-";
      return `  • ${m.name} [${m.status}] | Zona: ${zonas} | Skills: ${skills}`;
    })
    .join("\n");

  const ticketLines = activeTickets
    .slice(0, 25)
    .map(
      (t) =>
        `  • ${t.ticketId} [${t.status}] ${t.serviceType} | ${t.clientName ?? "sin nombre"} | Mecánico: ${t.mechanicName ?? "SIN ASIGNAR"} | $${t.finalCost ?? t.estimatedCost ?? "?"}`
    )
    .join("\n");

  // If message mentions a specific ticket (SPM-XXXX), include full detail
  let ticketDetail = "";
  const match = userMessage.match(/SPM-(\d+)/i);
  if (match) {
    const targetId = `SPM-${match[1].padStart(4, "0")}`;
    const found = allTickets.find(
      (t) =>
        typeof t.ticketId === "string" &&
        t.ticketId.toUpperCase() === targetId.toUpperCase()
    );
    if (found) {
      ticketDetail = `\nDETALLE COMPLETO DE ${targetId}:\n${JSON.stringify(
        {
          ticketId: found.ticketId,
          status: found.status,
          serviceType: found.serviceType,
          serviceDescription: found.serviceDescription,
          clientName: found.clientName,
          clientPhone: found.clientPhone,
          mechanicName: found.mechanicName,
          serviceAddress: found.serviceAddress,
          estimatedCost: found.estimatedCost,
          finalCost: found.finalCost,
          diagnosis: found.diagnosis,
          workDone: found.workDone,
          parts: found.parts,
          totalPaid: found.totalPaid,
          paymentMethod: found.paymentMethod,
          createdAt: (found.createdAt as { toDate?: () => Date } | undefined)
            ?.toDate?.()
            ?.toLocaleString("es-MX"),
        },
        null,
        2
      )}`;
    }
  }

  // If asking about clients, include recent list
  let clientLines = "";
  if (/clientes?|clients?/i.test(userMessage)) {
    const clientsSnap = await db
      .collection("clients")
      .orderBy("createdAt", "desc")
      .limit(12)
      .get();
    clientLines = `\nCLIENTES RECIENTES:\n${clientsSnap.docs
      .map((d) => {
        const c = d.data();
        return `  • ${c.name} ${c.lastName ?? ""} | Tel: ${c.phone} | Tickets: ${c.totalTickets ?? 0} | Pagado: $${c.totalPaid ?? 0}`;
      })
      .join("\n")}`;
  }

  const statusSummary = Object.entries(byStatus)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  return `OPERACIÓN EN TIEMPO REAL (${now.toLocaleString("es-MX")}):

ESTADÍSTICAS:
  • Tickets activos: ${activeTickets.length} (${statusSummary || "ninguno"})
  • Completados hoy: ${completedToday.length}
  • Ingresos del día: $${revenueToday.toLocaleString("es-MX")} MXN
  • Mecánicos disponibles: ${available} / ${mechanics.length}

MECÁNICOS:
${mechLines || "  (sin mecánicos)"}

TICKETS ACTIVOS (últimos 25):
${ticketLines || "  (no hay tickets activos)"}
${ticketDetail}${clientLines}`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const staff = await verifyStaff(req);
  if (!staff) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rl = rateLimiter(staff.uid);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 });
    }

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "IA no configurada" }, { status: 500 });
    }

    const context = await buildOperationalContext(message);

    const systemPrompt = `Eres el asistente operativo de SanPedroMotoCare. Ayudas al equipo a gestionar la operación en tiempo real con acceso directo a la base de datos del negocio.

Estás hablando con: ${staff.name} (${staff.role})

Tus capacidades:
1. Responder preguntas sobre la operación actual (tickets, mecánicos, clientes, ingresos)
2. Buscar tickets por ID (SPM-XXXX) o por cliente/mecánico
3. Identificar cuellos de botella (tickets sin mecánico, servicios retrasados)
4. Dar resúmenes ejecutivos y métricas del día
5. Sugerir acciones para optimizar la operación

${context}

REGLAS DE RESPUESTA:
- Responde siempre en español
- Sé conciso y ejecutivo. Usa bullet points para listas
- Dinero en formato $X,XXX MXN
- Tickets en formato SPM-XXXX
- Si hay tickets SIN MECÁNICO ASIGNADO, menciónalo con urgencia
- Máximo 4 párrafos o 10 bullet points por respuesta`;

    const client = new Mistral({ apiKey });

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...(history ?? [])
        .slice(-8)
        .map((msg: { role: string; content: string }) => ({
          role: (msg.role === "assistant" ? "assistant" : "user") as
            | "assistant"
            | "user",
          content: msg.content,
        })),
      { role: "user" as const, content: message },
    ];

    const result = await client.chat.complete({
      model: "mistral-small-latest",
      messages,
    });

    const reply = result.choices?.[0]?.message?.content ?? "";

    if (!reply) console.error("[crm/ai] Empty reply from Mistral");

    return NextResponse.json({ reply });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[crm/ai] Error:", msg);
    return NextResponse.json(
      { error: "Error al procesar tu solicitud. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
