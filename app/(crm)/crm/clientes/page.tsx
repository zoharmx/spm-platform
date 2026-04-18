"use client";

import { useState, useEffect, useMemo } from "react";
import CrmShell from "@/components/crm/CrmShell";
import { useTheme } from "@/contexts/ThemeContext";
import { subscribeClients, createClient } from "@/lib/firestore/clients";
import type { Client } from "@/types";
import { Plus, Search, X, Loader2, User, Phone, Mail, AlertCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

function formatDate(ts: unknown): string {
  if (!ts) return "—";
  const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string);
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" });
}

function CreateClientModal({ open, onClose, isDark }: { open: boolean; onClose: () => void; isDark: boolean }) {
  const [form, setForm] = useState({
    name: "", lastName: "", phone: "", email: "",
    motoBrand: "", motoModel: "", motoYear: "", motoColor: "", motoPlaca: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error("Nombre y telefono son requeridos"); return; }
    setLoading(true);
    try {
      await createClient({
        name: form.name, lastName: form.lastName, phone: form.phone, email: form.email || undefined,
        motoBrand: form.motoBrand || undefined,
        motoModel: form.motoModel || undefined,
        motoYear: form.motoYear ? Number(form.motoYear) : undefined,
        motoColor: form.motoColor || undefined,
        motoPlaca: form.motoPlaca ? form.motoPlaca.toUpperCase() : undefined,
      });
      toast.success("Cliente creado");
      setForm({ name: "", lastName: "", phone: "", email: "", motoBrand: "", motoModel: "", motoYear: "", motoColor: "", motoPlaca: "" });
      onClose();
    } catch { toast.error("Error al crear cliente"); }
    finally { setLoading(false); }
  }

  if (!open) return null;
  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--color-spm-red)]/30 focus:border-[var(--color-spm-red)] ${isDark ? "bg-slate-800 border-white/10 text-white placeholder:text-slate-500" : "bg-white border-gray-200 text-slate-900 placeholder:text-slate-400"}`;
  const labelCls = `block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto ${isDark ? "bg-slate-900" : "bg-white"}`}>
        <div className={`flex items-center justify-between p-5 border-b ${isDark ? "border-white/5" : "border-gray-100"}`}>
          <h3 className={`font-display font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>Nuevo Cliente</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Nombre *</label>
              <input className={inputCls} placeholder="Juan" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Apellido</label>
              <input className={inputCls} placeholder="Garcia" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Telefono *</label>
            <input className={inputCls} placeholder="+52 81 0000-0000" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" className={inputCls} placeholder="cliente@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>

          {/* Datos de la motocicleta */}
          <div className={`p-4 rounded-xl border ${isDark ? "border-white/5 bg-slate-800/30" : "border-gray-100 bg-slate-50"}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Motocicleta (opcional)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <input className={inputCls} placeholder="Marca" value={form.motoBrand} onChange={e => setForm(p => ({ ...p, motoBrand: e.target.value }))} />
              <input className={inputCls} placeholder="Modelo" value={form.motoModel} onChange={e => setForm(p => ({ ...p, motoModel: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <input type="number" className={inputCls} placeholder="Año" min={1950} max={2027}
                value={form.motoYear} onChange={e => setForm(p => ({ ...p, motoYear: e.target.value }))} />
              <input className={inputCls} placeholder="Color" value={form.motoColor} onChange={e => setForm(p => ({ ...p, motoColor: e.target.value }))} />
              <input className={inputCls + " uppercase font-mono"} placeholder="Placa" value={form.motoPlaca} onChange={e => setForm(p => ({ ...p, motoPlaca: e.target.value }))} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${isDark ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-gray-200 text-slate-600 hover:bg-gray-50"}`}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[var(--color-spm-red)] hover:bg-[var(--color-spm-red-dark)] text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />} Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClientesPage() {
  const { isDark } = useTheme();
  const [clients, setClients]   = useState<Client[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const unsub = subscribeClients(c => { setClients(c); setLoading(false); });
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.lastName ?? "").toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  }, [clients, search]);

  return (
    <CrmShell title="Clientes" subtitle="Base de datos de clientes SPM">
      <Toaster position="top-right" />
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total clientes", value: clients.length,  icon: "👥" },
          { label: "Activos",        value: clients.filter(c => c.isActive).length, icon: "✅" },
          { label: "Con servicios",  value: clients.filter(c => c.totalTickets > 0).length, icon: "🏍️" },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-2xl border ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-100 shadow-sm"}`}>
            <span className="text-xl">{s.icon}</span>
            <p className={`font-display font-bold text-2xl mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>{s.value}</p>
            <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-5">
        <div className={`flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl border text-sm ${isDark ? "bg-slate-900 border-white/10" : "bg-white border-gray-200"}`}>
          <Search size={15} className="text-slate-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Nombre, teléfono o email…"
            className={`bg-transparent outline-none w-full text-sm ${isDark ? "text-white placeholder:text-slate-500" : "text-slate-900 placeholder:text-slate-400"}`} />
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-spm-red)] hover:bg-[var(--color-spm-red-dark)] text-white text-sm font-bold transition-all flex-shrink-0">
          <Plus size={15} /> Nuevo cliente
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-[var(--color-spm-red)]" /></div>
      ) : filtered.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed ${isDark ? "border-white/10 text-slate-500" : "border-gray-200 text-slate-400"}`}>
          <AlertCircle size={36} className="mb-3 opacity-40" />
          <p className="font-semibold">Sin clientes{search ? " con ese criterio" : ""}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(client => (
            <div key={client.id} className={`p-4 rounded-2xl border ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-100 shadow-sm"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-spm-red)] to-[var(--color-spm-orange)] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {client.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
                      {client.name} {client.lastName}
                    </p>
                    <div className={`flex items-center gap-3 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      <span className="flex items-center gap-1"><Phone size={10} />{client.phone}</span>
                      {client.email && <span className="flex items-center gap-1 truncate"><Mail size={10} />{client.email}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>{client.clientId}</span>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    🏍️ {client.totalTickets} servicio{client.totalTickets !== 1 ? "s" : ""}
                  </p>
                  <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{formatDate(client.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateClientModal open={creating} onClose={() => setCreating(false)} isDark={isDark} />
    </CrmShell>
  );
}
