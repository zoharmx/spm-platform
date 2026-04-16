"use client";

import { useState, useEffect } from "react";
import CrmShell from "@/components/crm/CrmShell";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { subscribeClients } from "@/lib/firestore/clients";
import {
  doc, getDoc, setDoc, collection, onSnapshot,
  query, orderBy,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { SPMUser } from "@/types";
import {
  Bell, Shield, Globe, Palette, DollarSign,
  MapPin, Clock, Save, Loader2, ChevronDown, ChevronRight,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// ── Platform settings stored in Firestore settings/platform ──────────────────
interface PlatformSettings {
  anticipoDefault: number;       // Default diagnostic-visit charge (MXN)
  businessHoursStart: string;    // "07:00"
  businessHoursEnd: string;      // "21:00"
  emergencyHours: boolean;       // 24/7 urgencias
  serviceZones: string[];
  whatsappEnabled: boolean;
  pushEnabled: boolean;
  currency: "MXN";
  timezone: string;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  anticipoDefault:    200,
  businessHoursStart: "07:00",
  businessHoursEnd:   "21:00",
  emergencyHours:     true,
  serviceZones:       ["San Pedro Garza García", "Monterrey Centro", "Valle Oriente", "Santa Catarina", "Guadalupe", "Apodaca"],
  whatsappEnabled:    true,
  pushEnabled:        true,
  currency:           "MXN",
  timezone:           "America/Monterrey",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin", manager: "Manager", operador: "Operador",
  mecanico: "Mecánico", viewer: "Cliente",
};
const ROLE_OPTIONS = ["viewer", "mecanico", "operador", "manager", "admin"] as const;

// ── Collapsible section ───────────────────────────────────────────────────────
function Section({
  icon: Icon, title, children, isDark,
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  title: string;
  children: React.ReactNode;
  isDark: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? "border-white/5" : "border-gray-100 shadow-sm"}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${
          isDark ? "bg-slate-900 hover:bg-slate-800/50" : "bg-white hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-spm-red)]/10 flex items-center justify-center">
            <Icon size={15} className="text-[var(--color-spm-red)]" />
          </div>
          <span className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{title}</span>
        </div>
        {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
      </button>
      {open && (
        <div className={`px-5 pb-5 pt-1 ${isDark ? "bg-slate-900" : "bg-white"}`}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function ConfiguracionPage() {
  const { isDark } = useTheme();
  const { hasRole, user } = useAuth();

  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [saving,   setSaving]   = useState(false);
  const [users,    setUsers]    = useState<SPMUser[]>([]);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [newZone,  setNewZone]  = useState("");

  // Load platform settings from Firestore
  useEffect(() => {
    const db = getDb();
    getDoc(doc(db, "settings", "platform")).then(snap => {
      if (snap.exists()) setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
    });
  }, []);

  // Load users (admin/manager only)
  useEffect(() => {
    if (!hasRole("manager")) return;
    const db = getDb();
    const q  = query(collection(db, "users"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }) as SPMUser));
    });
  }, [hasRole]);

  async function saveSettings() {
    setSaving(true);
    try {
      const db = getDb();
      await setDoc(doc(db, "settings", "platform"), settings, { merge: true });
      toast.success("Configuración guardada");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function changeUserRole(userId: string, newRole: string) {
    setUpdatingRole(userId);
    try {
      const { updateDoc, doc: fsDoc } = await import("firebase/firestore");
      await updateDoc(fsDoc(getDb(), "users", userId), { role: newRole });
      toast.success("Rol actualizado");
    } catch {
      toast.error("Error al cambiar rol");
    } finally {
      setUpdatingRole(null);
    }
  }

  const inputCls = `px-3 py-2 rounded-xl border text-sm outline-none transition-all w-full focus:ring-1 focus:ring-[var(--color-spm-red)]/30 focus:border-[var(--color-spm-red)] ${
    isDark ? "bg-slate-800 border-white/10 text-white placeholder:text-slate-500" : "bg-slate-50 border-gray-200 text-slate-900"
  }`;
  const toggleCls = (on: boolean) => `relative inline-flex w-10 h-5 rounded-full transition-colors ${on ? "bg-[var(--color-spm-red)]" : isDark ? "bg-slate-700" : "bg-gray-300"}`;

  return (
    <CrmShell title="Configuración" subtitle="Ajustes generales de la plataforma">
      <Toaster position="top-right" />
      <div className="max-w-2xl space-y-4">

        {/* ── Operación y cobros ────────────────────────────────────────── */}
        <Section icon={DollarSign} title="Operación y cobros" isDark={isDark}>
          <div className="space-y-4 pt-2">
            <div>
              <label className={`text-xs font-semibold mb-1.5 block ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Anticipo de visita (MXN) — cobro antes de enviar al mecánico
              </label>
              <input
                type="number"
                min={0}
                value={settings.anticipoDefault}
                onChange={e => setSettings(s => ({ ...s, anticipoDefault: Number(e.target.value) }))}
                className={inputCls}
              />
              <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Este monto es el default al generar el link de cobro de visita en la pantalla de tickets.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-xs font-semibold mb-1.5 block ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Horario inicio
                </label>
                <input type="time" value={settings.businessHoursStart}
                  onChange={e => setSettings(s => ({ ...s, businessHoursStart: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className={`text-xs font-semibold mb-1.5 block ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Horario fin
                </label>
                <input type="time" value={settings.businessHoursEnd}
                  onChange={e => setSettings(s => ({ ...s, businessHoursEnd: e.target.value }))}
                  className={inputCls} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>Urgencias 24/7</p>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Atender servicios fuera de horario</p>
              </div>
              <button onClick={() => setSettings(s => ({ ...s, emergencyHours: !s.emergencyHours }))}>
                <div className={toggleCls(settings.emergencyHours)}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.emergencyHours ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
              </button>
            </div>
          </div>
        </Section>

        {/* ── Zonas de cobertura ────────────────────────────────────────── */}
        <Section icon={MapPin} title="Zonas de cobertura" isDark={isDark}>
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap gap-2">
              {settings.serviceZones.map(zone => (
                <div
                  key={zone}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                    isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <span>{zone}</span>
                  <button
                    onClick={() => setSettings(s => ({ ...s, serviceZones: s.serviceZones.filter(z => z !== zone) }))}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newZone}
                onChange={e => setNewZone(e.target.value)}
                placeholder="Nueva zona…"
                className={inputCls}
                onKeyDown={e => {
                  if (e.key === "Enter" && newZone.trim()) {
                    setSettings(s => ({ ...s, serviceZones: [...s.serviceZones, newZone.trim()] }));
                    setNewZone("");
                  }
                }}
              />
              <button
                onClick={() => {
                  if (!newZone.trim()) return;
                  setSettings(s => ({ ...s, serviceZones: [...s.serviceZones, newZone.trim()] }));
                  setNewZone("");
                }}
                className="px-4 py-2 rounded-xl bg-[var(--color-spm-red)] text-white text-sm font-semibold flex-shrink-0"
              >
                Agregar
              </button>
            </div>
          </div>
        </Section>

        {/* ── Notificaciones ────────────────────────────────────────────── */}
        <Section icon={Bell} title="Notificaciones" isDark={isDark}>
          <div className="space-y-4 pt-2">
            {[
              { key: "whatsappEnabled" as const, label: "WhatsApp Business", desc: "Enviar notificaciones de estado por WhatsApp" },
              { key: "pushEnabled"    as const, label: "Push Notifications",  desc: "Notificaciones web para clientes y operadores" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{label}</p>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{desc}</p>
                </div>
                <button onClick={() => setSettings(s => ({ ...s, [key]: !s[key] }))}>
                  <div className={toggleCls(settings[key] as boolean)}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Roles y usuarios (solo manager+) ─────────────────────────── */}
        {hasRole("manager") && (
          <Section icon={Shield} title="Roles y usuarios" isDark={isDark}>
            <div className="space-y-2 pt-2">
              {users.length === 0 && (
                <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>Cargando usuarios…</p>
              )}
              {users.map(u => (
                <div
                  key={u.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? "bg-slate-800/60" : "bg-slate-50"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isDark ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600"
                  }`}>
                    {u.displayName?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                      {u.displayName}
                    </p>
                    <p className={`text-xs truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>{u.email}</p>
                  </div>
                  {updatingRole === u.id ? (
                    <Loader2 size={16} className="animate-spin text-slate-400" />
                  ) : (
                    <select
                      value={u.role}
                      disabled={u.id === user?.id || !hasRole("admin")}
                      onChange={e => changeUserRole(u.id, e.target.value)}
                      className={`text-xs px-2 py-1.5 rounded-lg border outline-none cursor-pointer disabled:opacity-50 ${
                        isDark ? "bg-slate-700 border-white/10 text-white" : "bg-white border-gray-200 text-slate-800"
                      }`}
                    >
                      {ROLE_OPTIONS.map(r => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Save button ───────────────────────────────────────────────── */}
        <button
          onClick={saveSettings}
          disabled={saving}
          className="w-full py-3 rounded-2xl bg-[var(--color-spm-red)] hover:bg-[var(--color-spm-red-dark)] text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar configuración
        </button>
      </div>
    </CrmShell>
  );
}
