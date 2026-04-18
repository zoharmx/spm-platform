"use client";

import { useState, useEffect, useMemo } from "react";
import CrmShell from "@/components/crm/CrmShell";
import { useTheme } from "@/contexts/ThemeContext";
import { subscribeInvoices } from "@/lib/firestore/invoices";
import type { ServiceTicket } from "@/types";
import { SERVICE_LABELS } from "@/types";
import {
  FileText, Search, Download, ExternalLink,
  CheckCircle2, TrendingUp, DollarSign, Calendar,
  Printer,
} from "lucide-react";
import { generateInvoicePDF } from "@/lib/invoice-pdf";

function formatDate(ts: unknown): string {
  if (!ts) return "—";
  const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as unknown as string);
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function formatMonth(ts: unknown): string {
  if (!ts) return "—";
  const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as unknown as string);
  return d.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

const MONTHS = [
  "Todos", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function FacturasPage() {
  const { isDark } = useTheme();
  const [invoices, setInvoices] = useState<ServiceTicket[]>([]);
  const [search, setSearch]     = useState("");
  const [monthFilter, setMonth] = useState(0); // 0 = all, 1-12 = month
  const [yearFilter,  setYear]  = useState(new Date().getFullYear());

  useEffect(() => subscribeInvoices(setInvoices), []);

  const years = useMemo(() => {
    const set = new Set<number>();
    invoices.forEach(inv => {
      const ts = inv.paidAt ?? inv.updatedAt;
      if (ts) {
        const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as unknown as string);
        set.add(d.getFullYear());
      }
    });
    if (!set.has(new Date().getFullYear())) set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [invoices]);

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        inv.ticketId?.toLowerCase().includes(q) ||
        inv.clientName?.toLowerCase().includes(q) ||
        inv.clientPhone?.includes(q);

      const ts = inv.paidAt ?? inv.updatedAt;
      let matchDate = true;
      if (ts) {
        const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as unknown as string);
        if (yearFilter) matchDate = d.getFullYear() === yearFilter;
        if (matchDate && monthFilter > 0) matchDate = d.getMonth() + 1 === monthFilter;
      }

      return matchSearch && matchDate;
    });
  }, [invoices, search, monthFilter, yearFilter]);

  const totalRevenue = useMemo(
    () => filtered.reduce((sum, inv) => sum + (inv.finalCost ?? 0), 0),
    [filtered]
  );
  const avgTicket = filtered.length ? totalRevenue / filtered.length : 0;

  const card = `rounded-2xl border p-5 ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-100 shadow-sm"}`;

  return (
    <CrmShell title="Facturas" subtitle="Historial de servicios pagados">
      <div className="space-y-6">

        {/* ── KPIs ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total facturado",
              value: `$${totalRevenue.toLocaleString("es-MX")}`,
              icon: DollarSign,
              color: "text-green-400",
              bg: "bg-green-500/10",
            },
            {
              label: "Facturas",
              value: filtered.length,
              icon: FileText,
              color: "text-blue-400",
              bg: "bg-blue-500/10",
            },
            {
              label: "Ticket promedio",
              value: `$${Math.round(avgTicket).toLocaleString("es-MX")}`,
              icon: TrendingUp,
              color: "text-purple-400",
              bg: "bg-purple-500/10",
            },
            {
              label: "Período",
              value: monthFilter === 0
                ? `${yearFilter}`
                : `${MONTHS[monthFilter]} ${yearFilter}`,
              icon: Calendar,
              color: "text-amber-400",
              bg: "bg-amber-500/10",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={card}>
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon size={16} className={color} />
              </div>
              <p className={`text-2xl font-display font-bold mb-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>
                {value}
              </p>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3">
          <div className={`flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2.5 rounded-xl border text-sm ${
            isDark ? "bg-slate-900 border-white/10 text-white" : "bg-white border-gray-200"
          }`}>
            <Search size={15} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por ticket, cliente o teléfono…"
              className="bg-transparent outline-none w-full placeholder:text-slate-500"
            />
          </div>
          <select
            value={yearFilter}
            onChange={e => setYear(Number(e.target.value))}
            className={`px-3 py-2.5 rounded-xl border text-sm outline-none ${
              isDark ? "bg-slate-900 border-white/10 text-white" : "bg-white border-gray-200 text-slate-800"
            }`}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={monthFilter}
            onChange={e => setMonth(Number(e.target.value))}
            className={`px-3 py-2.5 rounded-xl border text-sm outline-none ${
              isDark ? "bg-slate-900 border-white/10 text-white" : "bg-white border-gray-200 text-slate-800"
            }`}
          >
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>

        {/* ── Table ────────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed ${
            isDark ? "border-white/10 text-slate-500" : "border-gray-200 text-slate-400"
          }`}>
            <FileText size={36} className="mb-3 opacity-40" />
            <p className="font-semibold">Sin facturas en este período</p>
            <p className="text-sm mt-1">Las facturas se generan cuando un ticket cambia a "pagado".</p>
          </div>
        ) : (
          <div className={`rounded-2xl border overflow-hidden ${isDark ? "border-white/5" : "border-gray-100"}`}>
            {/* Header */}
            <div className={`grid grid-cols-[1fr_1.5fr_1.2fr_1fr_90px_80px] gap-3 px-5 py-3 text-xs font-semibold uppercase tracking-wide border-b ${
              isDark ? "bg-slate-800 border-white/5 text-slate-400" : "bg-slate-50 border-gray-100 text-slate-500"
            }`}>
              <span>Folio</span>
              <span>Cliente</span>
              <span>Servicio</span>
              <span>Fecha</span>
              <span className="text-right">Total</span>
              <span className="text-center">PDF</span>
            </div>

            {/* Rows */}
            <div className={isDark ? "bg-slate-900" : "bg-white"}>
              {filtered.map((inv, i) => (
                <div
                  key={inv.id}
                  className={`grid grid-cols-[1fr_1.5fr_1.2fr_1fr_90px_80px] gap-3 items-center px-5 py-4 border-b transition-colors hover:bg-white/5 ${
                    i === filtered.length - 1 ? "border-0" : isDark ? "border-white/5" : "border-gray-50"
                  }`}
                >
                  {/* Folio */}
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                    <span className="font-mono font-semibold text-sm text-[var(--color-spm-red)]">
                      {inv.ticketId}
                    </span>
                  </div>

                  {/* Cliente */}
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                      {inv.clientName ?? "—"}
                    </p>
                    <p className={`text-xs truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      {inv.clientPhone ?? ""}
                    </p>
                  </div>

                  {/* Servicio */}
                  <p className={`text-xs truncate ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {SERVICE_LABELS[inv.serviceType as keyof typeof SERVICE_LABELS] ?? inv.serviceType}
                  </p>

                  {/* Fecha */}
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {formatDate(inv.paidAt ?? inv.updatedAt)}
                  </p>

                  {/* Total + comprobante Stripe */}
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="font-display font-bold text-sm text-green-400">
                      ${(inv.finalCost ?? 0).toLocaleString("es-MX")}
                    </span>
                    {inv.paymentLinkUrl && (
                      <a
                        href={inv.paymentLinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-1 rounded-lg transition-colors ${isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
                        title="Ver comprobante Stripe"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  {/* PDF button */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => generateInvoicePDF(inv)}
                      title="Generar PDF de la factura"
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${
                        isDark
                          ? "bg-[var(--color-spm-red)]/20 text-[var(--color-spm-red)] hover:bg-[var(--color-spm-red)]/30"
                          : "bg-red-50 text-[var(--color-spm-red)] hover:bg-red-100"
                      }`}
                    >
                      <Printer size={13} />
                      PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer total */}
            <div className={`grid grid-cols-[1fr_1.5fr_1.2fr_1fr_90px_80px] gap-3 items-center px-5 py-3 border-t font-semibold text-sm ${
              isDark ? "bg-slate-800/60 border-white/5 text-white" : "bg-slate-50 border-gray-100 text-slate-900"
            }`}>
              <span>{filtered.length} registros</span>
              <span />
              <span />
              <span>Total</span>
              <span className="text-green-400 font-display font-bold text-right">
                ${totalRevenue.toLocaleString("es-MX")}
              </span>
              <span />
            </div>
          </div>
        )}
      </div>
    </CrmShell>
  );
}
