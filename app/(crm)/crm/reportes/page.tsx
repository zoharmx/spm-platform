"use client";

import { useState, useEffect, useMemo } from "react";
import CrmShell from "@/components/crm/CrmShell";
import { useTheme } from "@/contexts/ThemeContext";
import { subscribeTickets } from "@/lib/firestore/tickets";
import { subscribeMechanics } from "@/lib/firestore/mechanics";
import type { ServiceTicket, Mechanic } from "@/types";
import { SERVICE_LABELS } from "@/types";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, DollarSign, Star, Wrench, Users,
  Ticket, Clock, CheckCircle2,
} from "lucide-react";

const COLORS = ["#DC2626", "#F97316", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899", "#F59E0B", "#6366F1"];

function getMonthKey(ts: unknown): string {
  if (!ts) return "—";
  const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string);
  return d.toLocaleDateString("es-MX", { month: "short", year: "2-digit" });
}

function getMonthIndex(ts: unknown): number {
  if (!ts) return -1;
  const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string);
  return d.getFullYear() * 12 + d.getMonth();
}

export default function ReportesPage() {
  const { isDark } = useTheme();
  const [tickets,   setTickets]   = useState<ServiceTicket[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [period,    setPeriod]    = useState<"30d" | "90d" | "365d">("30d");

  useEffect(() => subscribeTickets(setTickets),   []);
  useEffect(() => subscribeMechanics(setMechanics), []);

  const cutoff = useMemo(() => {
    const days = period === "30d" ? 30 : period === "90d" ? 90 : 365;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }, [period]);

  const filtered = useMemo(() =>
    tickets.filter(t => {
      const ts = t.createdAt;
      if (!ts) return true;
      const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string);
      return d >= cutoff;
    }),
    [tickets, cutoff]
  );

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const paid      = filtered.filter(t => t.status === "pagado");
    const revenue   = paid.reduce((s, t) => s + (t.finalCost ?? 0), 0);
    const active    = filtered.filter(t => !["pagado","cancelado"].includes(t.status)).length;
    const cancelled = filtered.filter(t => t.status === "cancelado").length;
    const rated     = filtered.filter(t => t.rating != null);
    const avgRating = rated.length ? rated.reduce((s, t) => s + (t.rating ?? 0), 0) / rated.length : 0;
    const conversion = filtered.length ? (paid.length / filtered.length) * 100 : 0;
    return { revenue, paid: paid.length, active, cancelled, avgRating, conversion, total: filtered.length };
  }, [filtered]);

  // ── Revenue by month ─────────────────────────────────────────────────────────
  const revenueByMonth = useMemo(() => {
    const map = new Map<string, { label: string; revenue: number; count: number; idx: number }>();
    filtered
      .filter(t => t.status === "pagado")
      .forEach(t => {
        const key = getMonthKey(t.paidAt ?? t.updatedAt);
        const idx = getMonthIndex(t.paidAt ?? t.updatedAt);
        const existing = map.get(key) ?? { label: key, revenue: 0, count: 0, idx };
        map.set(key, {
          ...existing,
          revenue: existing.revenue + (t.finalCost ?? 0),
          count:   existing.count + 1,
        });
      });
    return Array.from(map.values()).sort((a, b) => a.idx - b.idx);
  }, [filtered]);

  // ── Tickets by status ────────────────────────────────────────────────────────
  const byStatus = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(t => { map[t.status] = (map[t.status] ?? 0) + 1; });
    const labels: Record<string, string> = {
      "lead-recibido": "Lead", "diagnostico-pendiente": "Diagnóstico",
      "en-camino": "En camino", "en-servicio": "En servicio",
      completado: "Completado", pagado: "Pagado", cancelado: "Cancelado",
    };
    return Object.entries(map).map(([key, value]) => ({ name: labels[key] ?? key, value }));
  }, [filtered]);

  // ── Tickets by service type ──────────────────────────────────────────────────
  const byServiceType = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(t => { map[t.serviceType] = (map[t.serviceType] ?? 0) + 1; });
    return Object.entries(map)
      .map(([key, value]) => ({ name: SERVICE_LABELS[key as keyof typeof SERVICE_LABELS] ?? key, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filtered]);

  // ── Mechanic performance ─────────────────────────────────────────────────────
  const mechanicPerf = useMemo(() => {
    const map = new Map<string, { name: string; tickets: number; revenue: number; rating: number; ratingCount: number }>();
    filtered
      .filter(t => t.mechanicName)
      .forEach(t => {
        const key = t.mechanicId ?? t.mechanicName ?? "?";
        const ex  = map.get(key) ?? { name: t.mechanicName!, tickets: 0, revenue: 0, rating: 0, ratingCount: 0 };
        map.set(key, {
          name:        ex.name,
          tickets:     ex.tickets + 1,
          revenue:     ex.revenue + (t.finalCost ?? 0),
          rating:      ex.rating + (t.rating ?? 0),
          ratingCount: ex.ratingCount + (t.rating != null ? 1 : 0),
        });
      });
    return Array.from(map.values())
      .map(m => ({ ...m, avgRating: m.ratingCount ? m.rating / m.ratingCount : 0 }))
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 8);
  }, [filtered]);

  const card = `rounded-2xl border ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-100 shadow-sm"}`;
  const tooltipStyle = {
    backgroundColor: isDark ? "#1e293b" : "#fff",
    border: "1px solid " + (isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"),
    borderRadius: 12,
    color: isDark ? "#f1f5f9" : "#0f172a",
  };

  return (
    <CrmShell title="Reportes" subtitle="Analítica y métricas de operación">
      <div className="space-y-6">

        {/* ── Period selector ───────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          {(["30d", "90d", "365d"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                period === p
                  ? "bg-[var(--color-spm-red)] text-white"
                  : isDark ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p === "30d" ? "30 días" : p === "90d" ? "90 días" : "12 meses"}
            </button>
          ))}
        </div>

        {/* ── KPI cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Ingresos",      value: `$${kpis.revenue.toLocaleString("es-MX")}`, icon: DollarSign,   color: "text-green-400",  bg: "bg-green-500/10" },
            { label: "Servicios pagados", value: kpis.paid,                               icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Conversión",    value: `${kpis.conversion.toFixed(1)}%`,            icon: TrendingUp,   color: "text-blue-400",   bg: "bg-blue-500/10" },
            { label: "Rating prom.",  value: kpis.avgRating ? kpis.avgRating.toFixed(1) + " ★" : "—", icon: Star, color: "text-amber-400", bg: "bg-amber-500/10" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`${card} p-5`}>
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

        {/* ── Revenue chart ─────────────────────────────────────────────── */}
        <div className={`${card} p-5`}>
          <h3 className={`font-semibold text-sm mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
            Ingresos por mes
          </h3>
          {revenueByMonth.length === 0 ? (
            <div className={`flex items-center justify-center h-40 text-sm ${isDark ? "text-slate-600" : "text-slate-400"}`}>
              Sin datos en el período
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueByMonth} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }}
                  tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle}
                  formatter={(v: number) => [`$${v.toLocaleString("es-MX")}`, "Ingresos"]} />
                <Bar dataKey="revenue" fill="#DC2626" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Status distribution + Service type ───────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className={`${card} p-5`}>
            <h3 className={`font-semibold text-sm mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
              Tickets por estado
            </h3>
            {byStatus.length === 0 ? (
              <div className={`flex items-center justify-center h-40 text-sm ${isDark ? "text-slate-600" : "text-slate-400"}`}>Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: isDark ? "#475569" : "#cbd5e1" }}
                  >
                    {byStatus.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={`${card} p-5`}>
            <h3 className={`font-semibold text-sm mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
              Tipo de servicio más frecuente
            </h3>
            {byServiceType.length === 0 ? (
              <div className={`flex items-center justify-center h-40 text-sm ${isDark ? "text-slate-600" : "text-slate-400"}`}>Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart layout="vertical" data={byServiceType} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }} />
                  <YAxis type="category" dataKey="name" width={130}
                    tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#F97316" radius={[0,6,6,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Mechanic performance table ────────────────────────────────── */}
        {mechanicPerf.length > 0 && (
          <div className={`${card} overflow-hidden`}>
            <div className={`px-5 py-4 border-b ${isDark ? "border-white/5" : "border-gray-100"}`}>
              <h3 className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
                Rendimiento por mecánico
              </h3>
            </div>
            <div className={isDark ? "bg-slate-900" : "bg-white"}>
              {mechanicPerf.map((m, i) => (
                <div
                  key={m.name}
                  className={`flex items-center gap-4 px-5 py-3.5 border-b ${
                    i === mechanicPerf.length - 1 ? "border-0" : isDark ? "border-white/5" : "border-gray-50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? "bg-amber-500/20 text-amber-400" : isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`}>{m.name}</p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{m.tickets}</p>
                      <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>tickets</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-green-400">${m.revenue.toLocaleString("es-MX")}</p>
                      <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>ingresos</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-amber-400">
                        {m.avgRating ? m.avgRating.toFixed(1) + " ★" : "—"}
                      </p>
                      <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>rating</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CrmShell>
  );
}
