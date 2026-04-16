"use client";

import { useState, useEffect } from "react";
import CrmShell from "@/components/crm/CrmShell";
import { useTheme } from "@/contexts/ThemeContext";
import { subscribeMechanics, createMechanic, updateMechanicStatus } from "@/lib/firestore/mechanics";
import type { Mechanic, ServiceType } from "@/types";
import { SERVICE_LABELS } from "@/types";
import { Plus, X, Loader2, AlertCircle, Wrench } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const STATUS_MECHANIC: Record<Mechanic["status"], { label: string; cls: string }> = {
  disponible:  { label: "Disponible",  cls: "bg-green-500/20 text-green-300" },
  "en-servicio": { label: "En servicio", cls: "bg-orange-500/20 text-orange-300" },
  descanso:    { label: "Descanso",    cls: "bg-yellow-500/20 text-yellow-300" },
  inactivo:    { label: "Inactivo",    cls: "bg-slate-500/20 text-slate-400" },
};

function CreateMechanicModal({ open, onClose, isDark }: { open: boolean; onClose: () => void; isDark: boolean }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", zona: "", skills: [] as ServiceType[] });
  const [loading, setLoading] = useState(false);

  function toggleSkill(s: ServiceType) {
    setForm(p => ({
      ...p,
      skills: p.skills.includes(s) ? p.skills.filter(x => x !== s) : [...p.skills, s],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { toast.error("El nombre es requerido"); return; }
    setLoading(true);
    try {
      await createMechanic({
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        zona: form.zona ? form.zona.split(",").map(z => z.trim()).filter(Boolean) : [],
        skills: form.skills,
      });
      toast.success("Mecánico registrado");
      setForm({ name: "", phone: "", email: "", zona: "", skills: [] });
      onClose();
    } catch { toast.error("Error al registrar mecánico"); }
    finally { setLoading(false); }
  }

  if (!open) return null;
  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--color-spm-red)]/30 focus:border-[var(--color-spm-red)] ${isDark ? "bg-slate-800 border-white/10 text-white placeholder:text-slate-500" : "bg-white border-gray-200 text-slate-900 placeholder:text-slate-400"}`;
  const labelCls = `block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto ${isDark ? "bg-slate-900" : "bg-white"}`}>
        <div className={`flex items-center justify-between p-5 border-b ${isDark ? "border-white/5" : "border-gray-100"}`}>
          <h3 className={`font-display font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>Nuevo Mecánico</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Nombre completo *</label>
            <input className={inputCls} placeholder="Carlos López" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Teléfono</label>
              <input className={inputCls} placeholder="+52 81 0000-0000" value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" className={inputCls} placeholder="mec@spm.mx" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Zonas de cobertura (separadas por coma)</label>
            <input className={inputCls} placeholder="San Pedro, Valle Oriente, CUMBRES" value={form.zona}
              onChange={e => setForm(p => ({ ...p, zona: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Habilidades</label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(SERVICE_LABELS) as [ServiceType, string][]).map(([k, v]) => (
                <button key={k} type="button" onClick={() => toggleSkill(k)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    form.skills.includes(k)
                      ? "bg-[var(--color-spm-red)] text-white"
                      : isDark ? "bg-white/5 text-slate-400 hover:bg-white/10" : "bg-gray-100 text-slate-600 hover:bg-gray-200"
                  }`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${isDark ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-gray-200 text-slate-600 hover:bg-gray-50"}`}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[var(--color-spm-red)] hover:bg-[var(--color-spm-red-dark)] text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />} Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MecanicosPage() {
  const { isDark } = useTheme();
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading]     = useState(true);
  const [creating, setCreating]   = useState(false);

  useEffect(() => {
    const unsub = subscribeMechanics(m => { setMechanics(m); setLoading(false); });
    return unsub;
  }, []);

  async function handleStatusChange(id: string, status: Mechanic["status"]) {
    try {
      await updateMechanicStatus(id, status);
      toast.success("Estado actualizado");
    } catch { toast.error("Error"); }
  }

  const stats = {
    total:       mechanics.length,
    disponible:  mechanics.filter(m => m.status === "disponible").length,
    en_servicio: mechanics.filter(m => m.status === "en-servicio").length,
  };

  return (
    <CrmShell title="Mecánicos" subtitle="Equipo de campo y disponibilidad">
      <Toaster position="top-right" />

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, icon: "🔧" },
          { label: "Disponibles", value: stats.disponible, icon: "✅" },
          { label: "En servicio", value: stats.en_servicio, icon: "⚡" },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-2xl border ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-100 shadow-sm"}`}>
            <span className="text-xl">{s.icon}</span>
            <p className={`font-display font-bold text-2xl mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>{s.value}</p>
            <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-5">
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-spm-red)] hover:bg-[var(--color-spm-red-dark)] text-white text-sm font-bold transition-all">
          <Plus size={15} /> Agregar mecánico
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-[var(--color-spm-red)]" /></div>
      ) : mechanics.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed ${isDark ? "border-white/10 text-slate-500" : "border-gray-200 text-slate-400"}`}>
          <Wrench size={36} className="mb-3 opacity-40" />
          <p className="font-semibold">Sin mecánicos registrados</p>
          <p className="text-sm">Agrega el primer mecánico del equipo.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {mechanics.map(m => (
            <div key={m.id} className={`p-4 rounded-2xl border ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-100 shadow-sm"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white font-bold text-sm">
                    {m.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{m.name}</p>
                    <p className={`text-xs font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>{m.mechanicId}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_MECHANIC[m.status].cls}`}>
                  {STATUS_MECHANIC[m.status].label}
                </span>
              </div>
              {m.phone && <p className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>📞 {m.phone}</p>}
              {m.zona?.length > 0 && (
                <p className={`text-xs mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>📍 {m.zona.join(", ")}</p>
              )}
              <div className="flex flex-wrap gap-1 mb-3">
                {(m.skills ?? []).slice(0, 3).map(s => (
                  <span key={s} className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-white/5 text-slate-400" : "bg-gray-100 text-slate-600"}`}>
                    {SERVICE_LABELS[s] ?? s}
                  </span>
                ))}
                {(m.skills ?? []).length > 3 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-white/5 text-slate-400" : "bg-gray-100 text-slate-500"}`}>
                    +{m.skills.length - 3}
                  </span>
                )}
              </div>
              {/* Quick status change */}
              <select
                value={m.status}
                onChange={e => handleStatusChange(m.id, e.target.value as Mechanic["status"])}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none ${isDark ? "bg-slate-800 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-slate-700"}`}>
                {(Object.entries(STATUS_MECHANIC) as [Mechanic["status"], { label: string }][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      <CreateMechanicModal open={creating} onClose={() => setCreating(false)} isDark={isDark} />
    </CrmShell>
  );
}
