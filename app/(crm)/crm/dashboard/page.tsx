"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  LayoutDashboard, Ticket, Users, Wrench, FileText,
  Phone, BarChart3, Settings, LogOut, Menu, X,
  TrendingUp, AlertCircle, CheckCircle2, Clock, Sun, Moon, Globe, Loader2,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/crm/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/crm/tickets", label: "Tickets", icon: Ticket },
  { href: "/crm/clientes", label: "Clientes", icon: Users },
  { href: "/crm/mecanicos", label: "Mecánicos", icon: Wrench },
  { href: "/crm/facturas", label: "Facturas", icon: FileText },
  { href: "/crm/contact-center", label: "Contact Center", icon: Phone },
  { href: "/crm/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/crm/configuracion", label: "Configuración", icon: Settings },
];

function StatCard({
  label, value, sub, icon, color, isDark,
}: {
  label: string; value: string; sub?: string; icon: string; color: string; isDark: boolean;
}) {
  return (
    <div className={`p-5 rounded-2xl border transition-all hover:scale-[1.02] ${
      isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-100 shadow-sm"
    }`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{sub}</span>
      </div>
      <p className={`font-display font-bold text-2xl mb-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>{value}</p>
      <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user, signOut, hasRole, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t, lang, toggleLang } = useLanguage();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && !hasRole("operador")) router.replace("/portal");
  }, [user, loading, hasRole, router]);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[var(--color-spm-red)]" />
      </div>
    );
  }

  if (!user || !hasRole("operador")) return null;

  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col border-r transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-200"}`}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b ${isDark ? "border-white/5" : "border-gray-100"}`}>
          <div className="relative w-8 h-8">
            <Image src="/images/logo.png" alt="SPM" fill className="object-contain" />
          </div>
          <div>
            <p className={`font-display font-bold text-sm leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>SPM Platform</p>
            <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>CRM & Operations</p>
          </div>
        </div>

        {/* User info */}
        <div className={`px-4 py-3 border-b ${isDark ? "border-white/5" : "border-gray-100"}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-spm-red)] to-[var(--color-spm-orange)] flex items-center justify-center text-white text-xs font-bold">
              {user.displayName?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-slate-900"}`}>{user.displayName}</p>
              <p className={`text-xs capitalize ${isDark ? "text-slate-500" : "text-slate-400"}`}>{user.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = typeof window !== "undefined" && window.location.pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[var(--color-spm-red)] text-white"
                    : isDark
                    ? "text-slate-400 hover:bg-white/5 hover:text-white"
                    : "text-slate-600 hover:bg-gray-100 hover:text-slate-900"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className={`p-3 border-t ${isDark ? "border-white/5" : "border-gray-100"} space-y-1`}>
          <button
            onClick={toggleLang}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              isDark ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-slate-500 hover:bg-gray-100"
            }`}
          >
            <Globe size={14} />
            {lang === "es" ? "Español" : "English"}
          </button>
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              isDark ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-slate-500 hover:bg-gray-100"
            }`}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            {isDark ? "Modo claro" : "Modo oscuro"}
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-950/30 transition-all"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <header className={`flex items-center justify-between px-4 lg:px-8 py-3 border-b ${
          isDark ? "bg-slate-900/80 border-white/5" : "bg-white border-gray-200"
        } backdrop-blur-sm`}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`lg:hidden p-2 rounded-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="lg:ml-0 ml-2">
            <h1 className={`font-display font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>
              Dashboard
            </h1>
            <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Resumen de operaciones — {new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                isDark ? "border-white/10 text-slate-400 hover:text-white" : "border-gray-200 text-slate-500 hover:text-slate-900"
              }`}
            >
              Ver sitio
            </Link>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard isDark={isDark} label="Tickets activos" value="—" sub="hoy" icon="🎫" color={isDark ? "bg-blue-950/50 text-blue-400" : "bg-blue-50 text-blue-600"} />
            <StatCard isDark={isDark} label="Completados hoy" value="—" sub="✓" icon="✅" color={isDark ? "bg-green-950/50 text-green-400" : "bg-green-50 text-green-600"} />
            <StatCard isDark={isDark} label="Ingresos del mes" value="—" sub="MXN" icon="💰" color={isDark ? "bg-yellow-950/50 text-yellow-400" : "bg-yellow-50 text-yellow-600"} />
            <StatCard isDark={isDark} label="Satisfacción" value="4.9 ⭐" sub="promedio" icon="⭐" color={isDark ? "bg-orange-950/50 text-orange-400" : "bg-orange-50 text-orange-600"} />
          </div>

          {/* Quick Actions */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {[
              {
                title: "Nuevo Ticket",
                desc: "Registrar solicitud de servicio",
                icon: <Ticket size={20} className="text-white" />,
                href: "/crm/tickets/nuevo",
                color: "from-[var(--color-spm-red)] to-rose-600",
              },
              {
                title: "Nuevo Cliente",
                desc: "Registrar cliente en el CRM",
                icon: <Users size={20} className="text-white" />,
                href: "/crm/clientes/nuevo",
                color: "from-blue-600 to-blue-700",
              },
              {
                title: "Contact Center",
                desc: "Llamadas y chat en vivo",
                icon: <Phone size={20} className="text-white" />,
                href: "/crm/contact-center",
                color: "from-green-600 to-green-700",
              },
            ].map(({ title, desc, icon, href, color }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br ${color} text-white hover:scale-[1.02] transition-all shadow-lg`}
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">{icon}</div>
                <div>
                  <p className="font-semibold text-base">{title}</p>
                  <p className="text-sm text-white/70">{desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Recent Activity Placeholder */}
          <div className={`rounded-2xl border p-6 ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-100 shadow-sm"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-semibold text-base ${isDark ? "text-white" : "text-slate-900"}`}>
                Actividad reciente
              </h2>
              <Link
                href="/crm/tickets"
                className="text-xs text-[var(--color-spm-red)] hover:underline"
              >
                Ver todos →
              </Link>
            </div>

            <div className="space-y-3">
              {[
                { icon: <CheckCircle2 size={14} className="text-green-400" />, text: "Ticket SPM-0042 completado — Afinación menor Yamaha MT-07", time: "hace 12 min" },
                { icon: <Clock size={14} className="text-blue-400" />, text: "Mecánico Carlos en camino — SPM-0041", time: "hace 28 min" },
                { icon: <TrendingUp size={14} className="text-orange-400" />, text: "Nueva cotización recibida — Frenos Honda CB500", time: "hace 45 min" },
                { icon: <AlertCircle size={14} className="text-yellow-400" />, text: "Ticket SPM-0040 pendiente de diagnóstico", time: "hace 1 hr" },
              ].map(({ icon, text, time }, i) => (
                <div key={i} className={`flex items-start gap-3 py-3 border-b last:border-0 ${isDark ? "border-white/5" : "border-gray-100"}`}>
                  <div className="mt-0.5">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>{text}</p>
                    <p className={`text-xs mt-0.5 ${isDark ? "text-slate-600" : "text-slate-400"}`}>{time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={`mt-4 p-4 rounded-xl text-center ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
              <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Conecta Firebase para ver datos en tiempo real.{" "}
                <Link href="/crm/configuracion" className="text-[var(--color-spm-red)] hover:underline">
                  Configurar →
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
