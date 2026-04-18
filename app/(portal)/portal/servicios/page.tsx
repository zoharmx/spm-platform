"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { subscribeTickets } from "@/lib/firestore/tickets";
import type { ServiceTicket, ServiceTicketStatus } from "@/types";
import { STATUS_LABELS, STATUS_COLORS, SERVICE_LABELS } from "@/types";
import {
  ArrowLeft, Bike, Search, CreditCard, ExternalLink,
  Clock, CheckCircle2, XCircle, MapPin, Loader2, Eye,
} from "lucide-react";

const STEP_KEYS: ServiceTicketStatus[] = [
  "lead-recibido", "diagnostico-pendiente", "en-camino", "en-servicio", "completado",
];

function MiniProgress({ status }: { status: ServiceTicketStatus }) {
  const idx = STEP_KEYS.indexOf(status);
  const total = STEP_KEYS.length;
  const pct = status === "pagado" ? 100 : Math.round(((idx + 1) / total) * 100);
  const color =
    status === "pagado"    ? "bg-emerald-500"   :
    status === "cancelado" ? "bg-red-500"        :
    "bg-[var(--color-spm-red)]";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400">{pct}%</span>
    </div>
  );
}

function StatusIcon({ status }: { status: ServiceTicketStatus }) {
  if (status === "pagado")    return <CheckCircle2 size={14} className="text-emerald-400" />;
  if (status === "cancelado") return <XCircle      size={14} className="text-red-400"     />;
  return <Clock size={14} className="text-amber-400" />;
}

function formatDate(ts: unknown): string {
  if (!ts) return "—";
  const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string);
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ServiciosPage() {
  const { user, loading } = useAuth();
  const { isDark }        = useTheme();
  const router            = useRouter();

  const [tickets,  setTickets]  = useState<ServiceTicket[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState<"todos" | "activos" | "completados">("todos");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeTickets(all => {
      const email = user.email?.toLowerCase();
      const phone = user.phone;
      setTickets(
        all.filter(t =>
          (email && t.clientEmail?.toLowerCase() === email) ||
          (phone && t.clientPhone === phone)
        )
      );
      setFetching(false);
    });
    return unsub;
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[var(--color-spm-red)]" />
      </div>
    );
  }

  const activeStatuses: ServiceTicketStatus[] = ["lead-recibido","diagnostico-pendiente","en-camino","en-servicio"];

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    const matchQ = !q || t.ticketId?.toLowerCase().includes(q) || t.serviceDescription?.toLowerCase().includes(q);
    const matchF =
      filter === "todos"       ? true :
      filter === "activos"     ? activeStatuses.includes(t.status) :
      ["completado","pagado"].includes(t.status);
    return matchQ && matchF;
  });

  const card = `rounded-2xl border ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-100 shadow-sm"}`;

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <header className={`sticky top-0 z-30 border-b px-4 py-3 ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-200"}`}>
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/portal" className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className={`font-display font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>
              Mis servicios
            </h1>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {tickets.length} servicio{tickets.length !== 1 ? "s" : ""} registrado{tickets.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className={`flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl border text-sm ${
            isDark ? "bg-slate-900 border-white/10" : "bg-white border-gray-200"
          }`}>
            <Search size={15} className="text-slate-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por folio o descripción…"
              className={`bg-transparent outline-none w-full text-sm placeholder:text-slate-500 ${isDark ? "text-white" : "text-slate-900"}`}
            />
          </div>
          <div className="flex gap-2">
            {(["todos","activos","completados"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  filter === f
                    ? "bg-[var(--color-spm-red)] text-white"
                    : isDark ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-white border border-gray-200 text-slate-600"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket list */}
        {fetching ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[var(--color-spm-red)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed ${
            isDark ? "border-white/10 text-slate-500" : "border-gray-200 text-slate-400"
          }`}>
            <Bike size={36} className="mb-3 opacity-40" />
            <p className="font-semibold text-sm">
              {search ? "Sin resultados" : "Sin servicios registrados"}
            </p>
            {!search && (
              <>
                <p className="text-xs mt-1 mb-4">Solicita tu primer servicio en la landing</p>
                <Link
                  href="/#cotizar"
                  className="px-4 py-2 bg-[var(--color-spm-red)] text-white text-xs font-bold rounded-xl hover:bg-[var(--color-spm-red-dark)] transition-all"
                >
                  Solicitar servicio
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(ticket => (
              <div key={ticket.id} className={`${card} p-4`}>
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={ticket.status} />
                    <span className="font-mono font-bold text-sm text-[var(--color-spm-red)]">
                      {ticket.ticketId}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[ticket.status]}`}>
                      {STATUS_LABELS[ticket.status]}
                    </span>
                  </div>
                  <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {formatDate(ticket.createdAt)}
                  </span>
                </div>

                {/* Description */}
                <p className={`text-sm mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                  {SERVICE_LABELS[ticket.serviceType as keyof typeof SERVICE_LABELS] ?? ticket.serviceType}
                </p>
                <p className={`text-xs mb-3 line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {ticket.serviceDescription}
                </p>

                {/* Progress bar */}
                {!["pagado","cancelado"].includes(ticket.status) && (
                  <div className="mb-3">
                    <MiniProgress status={ticket.status} />
                  </div>
                )}

                {/* Details grid */}
                <div className="flex flex-wrap gap-3 text-xs">
                  {ticket.serviceAddress?.colonia && (
                    <span className={`flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      <MapPin size={11} /> {ticket.serviceAddress.colonia}
                    </span>
                  )}
                  {ticket.mechanicName && (
                    <span className={`flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      🔧 {ticket.mechanicName}
                    </span>
                  )}
                  {ticket.finalCost != null && (
                    <span className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                      ${ticket.finalCost.toLocaleString("es-MX")} MXN
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                  <Link
                    href={`/tracking?ticket=${ticket.ticketId}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <Eye size={11} /> Rastrear
                  </Link>
                  {ticket.status === "completado" && ticket.paymentLinkUrl && (
                    <a
                      href={ticket.paymentLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
                    >
                      <CreditCard size={11} /> Pagar ahora
                      <ExternalLink size={10} className="opacity-70" />
                    </a>
                  )}
                  {ticket.status === "diagnostico-pendiente" && ticket.anticipoLinkUrl && !ticket.anticipoPagado && (
                    <a
                      href={ticket.anticipoLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-all"
                    >
                      <CreditCard size={11} /> Confirmar visita
                      <ExternalLink size={10} className="opacity-70" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
