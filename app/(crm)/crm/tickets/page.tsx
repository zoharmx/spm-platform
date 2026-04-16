"use client";

import { useState, useEffect, useMemo } from "react";
import CrmShell from "@/components/crm/CrmShell";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  subscribeTickets, advanceTicketStatus, updateTicketFields, createTicketDirect,
} from "@/lib/firestore/tickets";
import { subscribeMechanics } from "@/lib/firestore/mechanics";
import type { ServiceTicket, ServiceTicketStatus, Mechanic } from "@/types";
import {
  STATUS_LABELS, STATUS_COLORS, SERVICE_LABELS, NEXT_STATUS,
} from "@/types";
import {
  Plus, Search, Filter, ChevronRight, X, Loader2,
  User, Phone, MapPin, Wrench, Clock, CheckCircle2,
  AlertCircle, DollarSign, ChevronDown,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// ── Status filter tabs ─────────────────────────────────────────
const FILTER_TABS: { label: string; value: ServiceTicketStatus | "todos" | "activos" }[] = [
  { label: "Todos", value: "todos" },
  { label: "Activos", value: "activos" },
  { label: "Lead", value: "lead-recibido" },
  { label: "Diagnóstico", value: "diagnostico-pendiente" },
  { label: "En camino", value: "en-camino" },
  { label: "En servicio", value: "en-servicio" },
  { label: "Completado", value: "completado" },
  { label: "Pagado", value: "pagado" },
  { label: "Cancelado", value: "cancelado" },
];

const ACTIVE_STATUSES: ServiceTicketStatus[] = [
  "lead-recibido", "diagnostico-pendiente", "en-camino", "en-servicio",
];

// ── Small components ───────────────────────────────────────────
function StatusBadge({ status }: { status: ServiceTicketStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function formatDate(ts: unknown): string {
  if (!ts) return "—";
  const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string);
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" });
}

// ── Create Ticket Modal ────────────────────────────────────────
function CreateTicketModal({
  open, onClose, isDark,
}: { open: boolean; onClose: () => void; isDark: boolean }) {
  const [form, setForm] = useState({
    clientName: "", clientPhone: "", clientEmail: "",
    serviceType: "diagnostico", serviceDescription: "", serviceAddress: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientName || !form.clientPhone || !form.serviceAddress || !form.serviceDescription) {
      toast.error("Completa todos los campos requeridos");
      return;
    }
    setLoading(true);
    try {
      const id = await createTicketDirect({
        clientName: form.clientName,
        clientPhone: form.clientPhone,
        clientEmail: form.clientEmail || undefined,
        serviceType: form.serviceType,
        serviceDescription: form.serviceDescription,
        serviceAddress: form.serviceAddress,
        source: "crm-directo",
      });
      toast.success(`Ticket ${id} creado`);
      setForm({ clientName: "", clientPhone: "", clientEmail: "", serviceType: "diagnostico", serviceDescription: "", serviceAddress: "" });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Error al crear el ticket");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--color-spm-red)]/30 focus:border-[var(--color-spm-red)] ${
    isDark ? "bg-slate-800 border-white/10 text-white placeholder:text-slate-500" : "bg-white border-gray-200 text-slate-900 placeholder:text-slate-400"
  }`;
  const labelCls = `block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto ${isDark ? "bg-slate-900" : "bg-white"}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${isDark ? "border-white/5" : "border-gray-100"}`}>
          <h3 className={`font-display font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>Nuevo Ticket</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className={labelCls}>Nombre cliente *</label>
              <input className={inputCls} placeholder="Juan García" value={form.clientName}
                onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className={labelCls}>Teléfono *</label>
              <input className={inputCls} placeholder="+52 81 0000-0000" value={form.clientPhone}
                onChange={e => setForm(p => ({ ...p, clientPhone: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Email (opcional)</label>
            <input type="email" className={inputCls} placeholder="cliente@email.com" value={form.clientEmail}
              onChange={e => setForm(p => ({ ...p, clientEmail: e.target.value }))} />
          </div>

          <div>
            <label className={labelCls}>Tipo de servicio *</label>
            <select className={inputCls} value={form.serviceType}
              onChange={e => setForm(p => ({ ...p, serviceType: e.target.value }))}>
              {(Object.entries(SERVICE_LABELS) as [string, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Dirección del servicio *</label>
            <input className={inputCls} placeholder="Calle, Colonia, Ciudad" value={form.serviceAddress}
              onChange={e => setForm(p => ({ ...p, serviceAddress: e.target.value }))} />
          </div>

          <div>
            <label className={labelCls}>Descripción del problema *</label>
            <textarea rows={3} className={inputCls + " resize-none"} placeholder="Describe el problema..."
              value={form.serviceDescription}
              onChange={e => setForm(p => ({ ...p, serviceDescription: e.target.value }))} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${isDark ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-gray-200 text-slate-600 hover:bg-gray-50"}`}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[var(--color-spm-red)] hover:bg-[var(--color-spm-red-dark)] text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              Crear Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Ticket Detail Drawer ───────────────────────────────────────
function TicketDrawer({
  ticket, mechanics, isDark, userId, onClose,
}: {
  ticket: ServiceTicket | null;
  mechanics: Mechanic[];
  isDark: boolean;
  userId: string;
  onClose: () => void;
}) {
  const [note, setNote]         = useState("");
  const [saving, setSaving]     = useState(false);
  const [editCost, setEditCost] = useState(false);
  const [costs, setCosts]       = useState({ estimated: "", final: "", anticipo: "" });
  const [diagnosis, setDiagnosis] = useState("");
  const [selectedMechanic, setSelectedMechanic] = useState("");

  useEffect(() => {
    if (ticket) {
      setCosts({
        estimated: ticket.estimatedCost?.toString() ?? "",
        final:     ticket.finalCost?.toString()     ?? "",
        anticipo:  ticket.anticipo?.toString()       ?? "",
      });
      setDiagnosis(ticket.diagnosis ?? "");
      setSelectedMechanic(ticket.mechanicId ?? "");
    }
  }, [ticket?.id]);

  if (!ticket) return null;

  const nextStatus = NEXT_STATUS[ticket.status];

  async function handleAdvance() {
    if (!nextStatus) return;
    setSaving(true);
    try {
      await advanceTicketStatus(ticket!.id, nextStatus, note, userId);
      toast.success(`Estado → ${STATUS_LABELS[nextStatus]}`);
      setNote("");
    } catch { toast.error("Error al actualizar estado"); }
    finally { setSaving(false); }
  }

  async function handleCancel() {
    setSaving(true);
    try {
      await advanceTicketStatus(ticket!.id, "cancelado", note || "Cancelado desde CRM", userId);
      toast.success("Ticket cancelado");
    } catch { toast.error("Error"); }
    finally { setSaving(false); }
  }

  async function handleSaveFields() {
    setSaving(true);
    try {
      const mechanic = mechanics.find(m => m.id === selectedMechanic);
      await updateTicketFields(ticket!.id, {
        ...(costs.estimated !== "" ? { estimatedCost: Number(costs.estimated) } : {}),
        ...(costs.final      !== "" ? { finalCost:     Number(costs.final)     } : {}),
        ...(costs.anticipo   !== "" ? { anticipo:      Number(costs.anticipo)  } : {}),
        ...(diagnosis        !== "" ? { diagnosis }                              : {}),
        ...(selectedMechanic        ? { mechanicId: selectedMechanic, mechanicName: mechanic?.name } : {}),
      });
      toast.success("Actualizado");
      setEditCost(false);
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  }

  const inputCls = `w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all focus:ring-1 focus:ring-[var(--color-spm-red)]/30 focus:border-[var(--color-spm-red)] ${
    isDark ? "bg-slate-800 border-white/10 text-white placeholder:text-slate-500" : "bg-white border-gray-200 text-slate-900"
  }`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col ${
        isDark ? "bg-slate-900" : "bg-white"
      }`}>
        {/* Header */}
        <div className={`sticky top-0 flex items-center justify-between px-5 py-4 border-b z-10 ${
          isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-100"
        }`}>
          <div>
            <p className="font-display font-bold text-base text-[var(--color-spm-red)]">{ticket.ticketId}</p>
            <StatusBadge status={ticket.status} />
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"><X size={18} /></button>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* Client info */}
          <div className={`p-4 rounded-2xl ${isDark ? "bg-slate-800/60" : "bg-slate-50"}`}>
            <div className="flex items-center gap-2 mb-3">
              <User size={14} className="text-[var(--color-spm-red)]" />
              <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>Cliente</span>
            </div>
            <p className={`font-semibold text-sm mb-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>{ticket.clientName ?? "—"}</p>
            {(ticket as unknown as { clientPhone?: string }).clientPhone && (
              <p className={`text-xs flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <Phone size={11} />{(ticket as unknown as { clientPhone?: string }).clientPhone}
              </p>
            )}
            <p className={`text-xs flex items-center gap-1 mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              <MapPin size={11} />{ticket.serviceAddress?.street ?? "Sin dirección"}
            </p>
          </div>

          {/* Service info */}
          <div className={`p-4 rounded-2xl ${isDark ? "bg-slate-800/60" : "bg-slate-50"}`}>
            <div className="flex items-center gap-2 mb-2">
              <Wrench size={14} className="text-[var(--color-spm-red)]" />
              <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>Servicio</span>
            </div>
            <p className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
              {SERVICE_LABELS[ticket.serviceType as keyof typeof SERVICE_LABELS] ?? ticket.serviceType}
            </p>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{ticket.serviceDescription}</p>
            {ticket.diagnosis && (
              <p className={`text-xs mt-2 italic ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Diagnóstico: {ticket.diagnosis}
              </p>
            )}
          </div>

          {/* Assign mechanic */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Mecánico asignado
            </label>
            <select className={inputCls} value={selectedMechanic}
              onChange={e => setSelectedMechanic(e.target.value)}>
              <option value="">Sin asignar</option>
              {mechanics.filter(m => m.status !== "inactivo").map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.status === "disponible" ? "✓ Disponible" : m.status}
                </option>
              ))}
            </select>
          </div>

          {/* Costs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Costos
              </span>
              <button onClick={() => setEditCost(!editCost)}
                className="text-xs text-[var(--color-spm-red)] hover:underline">
                {editCost ? "Cancelar" : "Editar"}
              </button>
            </div>
            {editCost ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Estimado $</label>
                    <input type="number" className={inputCls} placeholder="0"
                      value={costs.estimated} onChange={e => setCosts(p => ({ ...p, estimated: e.target.value }))} />
                  </div>
                  <div>
                    <label className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Anticipo $</label>
                    <input type="number" className={inputCls} placeholder="0"
                      value={costs.anticipo} onChange={e => setCosts(p => ({ ...p, anticipo: e.target.value }))} />
                  </div>
                  <div>
                    <label className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Final $</label>
                    <input type="number" className={inputCls} placeholder="0"
                      value={costs.final} onChange={e => setCosts(p => ({ ...p, final: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Diagnóstico / notas internas</label>
                  <textarea rows={2} className={inputCls + " resize-none mt-1"}
                    value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
                </div>
              </div>
            ) : (
              <div className={`grid grid-cols-3 gap-3 p-3 rounded-xl ${isDark ? "bg-slate-800/60" : "bg-slate-50"}`}>
                {[
                  { label: "Estimado", value: ticket.estimatedCost },
                  { label: "Anticipo",  value: ticket.anticipo },
                  { label: "Final",     value: ticket.finalCost },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
                    <p className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
                      {value != null ? `$${value.toLocaleString("es-MX")}` : "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save fields button */}
          <button onClick={handleSaveFields} disabled={saving}
            className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Guardar cambios
          </button>

          {/* Status advance */}
          {ticket.status !== "pagado" && ticket.status !== "cancelado" && (
            <div className={`p-4 rounded-2xl border ${isDark ? "border-white/5 bg-slate-800/40" : "border-gray-100 bg-slate-50"}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Avanzar estado
              </p>
              <textarea
                rows={2}
                placeholder="Nota opcional (ej: 'Mecánico en ruta')"
                value={note}
                onChange={e => setNote(e.target.value)}
                className={inputCls + " resize-none mb-3"}
              />
              <div className="flex gap-2">
                {nextStatus && (
                  <button onClick={handleAdvance} disabled={saving}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--color-spm-red)] hover:bg-[var(--color-spm-red-dark)] text-white text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                    → {STATUS_LABELS[nextStatus]}
                  </button>
                )}
                <button onClick={handleCancel} disabled={saving}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium transition-all ${isDark ? "bg-red-950/40 text-red-400 hover:bg-red-950/60" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                  Cancelar ticket
                </button>
              </div>
            </div>
          )}

          {/* History */}
          {(ticket.statusHistory ?? []).length > 0 && (
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Historial
              </p>
              <div className="space-y-2">
                {[...(ticket.statusHistory ?? [])].reverse().map((ev, i) => (
                  <div key={i} className={`flex items-start gap-3 p-2.5 rounded-xl ${isDark ? "bg-slate-800/40" : "bg-slate-50"}`}>
                    <div className="w-2 h-2 rounded-full bg-[var(--color-spm-red)] mt-1.5 flex-shrink-0" />
                    <div>
                      <p className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                        {STATUS_LABELS[ev.status]}
                      </p>
                      {ev.note && <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{ev.note}</p>}
                      <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        {formatDate(ev.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"} space-y-1 pt-2 border-t ${isDark ? "border-white/5" : "border-gray-100"}`}>
            <div className="flex items-center gap-1.5">
              <Clock size={11} />Creado: {formatDate(ticket.createdAt)}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={11} />Actualizado: {formatDate(ticket.updatedAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function TicketsPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [tickets,   setTickets]   = useState<ServiceTicket[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<string>("todos");
  const [search,    setSearch]    = useState("");
  const [selected,  setSelected]  = useState<ServiceTicket | null>(null);
  const [creating,  setCreating]  = useState(false);

  useEffect(() => {
    const unsub1 = subscribeTickets((t) => { setTickets(t); setLoading(false); });
    const unsub2 = subscribeMechanics(setMechanics);
    return () => { unsub1(); unsub2(); };
  }, []);

  const filtered = useMemo(() => {
    let list = tickets;
    if (filter === "activos") list = list.filter(t => ACTIVE_STATUSES.includes(t.status));
    else if (filter !== "todos") list = list.filter(t => t.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.ticketId?.toLowerCase().includes(q) ||
        (t.clientName ?? "").toLowerCase().includes(q) ||
        (t.mechanicName ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [tickets, filter, search]);

  // Stats
  const stats = useMemo(() => ({
    total:   tickets.length,
    active:  tickets.filter(t => ACTIVE_STATUSES.includes(t.status)).length,
    today:   tickets.filter(t => {
      const d = (t.createdAt as { toDate?: () => Date })?.toDate?.();
      if (!d) return false;
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
    revenue: tickets
      .filter(t => t.status === "pagado" && t.finalCost)
      .reduce((acc, t) => acc + (t.finalCost ?? 0), 0),
  }), [tickets]);

  const cardCls = `p-4 rounded-2xl border ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-100 shadow-sm"}`;

  return (
    <CrmShell title="Tickets" subtitle="Órdenes de servicio en tiempo real">
      <Toaster position="top-right" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { icon: "🏍️", label: "Total tickets",  value: stats.total,   color: "text-slate-400" },
          { icon: "⚡", label: "Activos",         value: stats.active,  color: "text-blue-400" },
          { icon: "📅", label: "Creados hoy",     value: stats.today,   color: "text-orange-400" },
          { icon: "💰", label: "Ingresos cobrados", value: `$${stats.revenue.toLocaleString("es-MX")}`, color: "text-green-400" },
        ].map(s => (
          <div key={s.label} className={cardCls}>
            <span className="text-xl">{s.icon}</span>
            <p className={`font-display font-bold text-2xl mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>{s.value}</p>
            <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className={`flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl border text-sm ${
          isDark ? "bg-slate-900 border-white/10" : "bg-white border-gray-200"
        }`}>
          <Search size={15} className="text-slate-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="SPM-0001, nombre cliente, mecánico…"
            className={`bg-transparent outline-none w-full text-sm ${isDark ? "text-white placeholder:text-slate-500" : "text-slate-900 placeholder:text-slate-400"}`} />
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-spm-red)] hover:bg-[var(--color-spm-red-dark)] text-white text-sm font-bold transition-all flex-shrink-0">
          <Plus size={15} /> Nuevo ticket
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-none">
        {FILTER_TABS.map(tab => (
          <button key={tab.value} onClick={() => setFilter(tab.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === tab.value
                ? "bg-[var(--color-spm-red)] text-white"
                : isDark
                  ? "bg-white/5 text-slate-400 hover:bg-white/10"
                  : "bg-gray-100 text-slate-600 hover:bg-gray-200"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-[var(--color-spm-red)]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed ${
          isDark ? "border-white/10 text-slate-500" : "border-gray-200 text-slate-400"
        }`}>
          <AlertCircle size={36} className="mb-3 opacity-40" />
          <p className="font-semibold">Sin tickets{filter !== "todos" ? ` en estado "${filter}"` : ""}</p>
          <p className="text-sm mt-1">
            {search ? "Prueba con otro término de búsqueda" : "Crea el primer ticket con el botón de arriba"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(ticket => (
            <button key={ticket.id} onClick={() => setSelected(ticket)}
              className={`w-full text-left p-4 rounded-2xl border transition-all hover:scale-[1.005] hover:border-[var(--color-spm-red)]/30 ${
                isDark ? "bg-slate-900 border-white/5 hover:bg-slate-800" : "bg-white border-gray-100 hover:border-gray-200 shadow-sm"
              }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-display font-bold text-sm text-[var(--color-spm-red)]">{ticket.ticketId}</span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className={`font-semibold text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                    {ticket.clientName ?? "Cliente sin nombre"}
                  </p>
                  <p className={`text-xs truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {SERVICE_LABELS[ticket.serviceType as keyof typeof SERVICE_LABELS] ?? ticket.serviceType}
                    {ticket.mechanicName && ` · 🔧 ${ticket.mechanicName}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{formatDate(ticket.createdAt)}</p>
                  {ticket.estimatedCost != null && (
                    <p className={`text-xs font-semibold mt-0.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      ${ticket.estimatedCost.toLocaleString("es-MX")}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create modal */}
      <CreateTicketModal open={creating} onClose={() => setCreating(false)} isDark={isDark} />

      {/* Detail drawer */}
      <TicketDrawer
        ticket={selected}
        mechanics={mechanics}
        isDark={isDark}
        userId={user?.uid ?? ""}
        onClose={() => setSelected(null)}
      />
    </CrmShell>
  );
}
