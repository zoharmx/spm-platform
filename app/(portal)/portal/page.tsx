"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Bike, FileText, CreditCard, User, LogOut, Plus,
  Search, Clock, CheckCircle2, AlertCircle, Loader2, Home,
} from "lucide-react";

export default function PortalPage() {
  const { user, signOut, loading } = useAuth();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const [ticketSearch, setTicketSearch] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[var(--color-spm-red)]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <header className={`sticky top-0 z-30 border-b px-4 lg:px-8 py-3 ${
        isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-200"
      } backdrop-blur-sm`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-8 h-8">
              <Image src="/images/logo.png" alt="SPM" fill className="object-contain" />
            </div>
            <span className={`font-display font-bold text-base ${isDark ? "text-white" : "text-slate-900"}`}>
              SPM <span className="text-[var(--color-spm-red)]">Portal</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                isDark ? "border-white/10 text-slate-400 hover:text-white" : "border-gray-200 text-slate-500"
              }`}
            >
              <Home size={12} />
              Inicio
            </Link>
            <button
              onClick={handleSignOut}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all text-red-400 ${
                isDark ? "border-red-900/30 hover:bg-red-950/20" : "border-red-200 hover:bg-red-50"
              }`}
            >
              <LogOut size={12} />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className={`font-display font-bold text-2xl lg:text-3xl ${isDark ? "text-white" : "text-slate-900"}`}>
            {t("portal_welcome")}, {user.displayName?.split(" ")[0]} 👋
          </h1>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Gestiona tus servicios, pagos y motocicletas
          </p>
        </div>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { href: "/portal/servicios", label: t("portal_services"), icon: Bike, color: "from-red-600 to-red-700" },
            { href: "/portal/pagar", label: t("portal_payments"), icon: CreditCard, color: "from-green-600 to-green-700" },
            { href: "/portal/moto", label: t("portal_moto"), icon: FileText, color: "from-blue-600 to-blue-700" },
            { href: "/portal/perfil", label: t("portal_profile"), icon: User, color: "from-purple-600 to-purple-700" },
          ].map(({ href, label, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-br ${color} text-white hover:scale-[1.03] transition-all shadow-lg min-h-[100px]`}
            >
              <Icon size={24} className="mb-2" />
              <span className="text-sm font-semibold text-center">{label}</span>
            </Link>
          ))}
        </div>

        {/* Track a ticket */}
        <div className={`rounded-2xl border p-5 mb-6 ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-100 shadow-sm"}`}>
          <h2 className={`font-semibold text-base mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
            Rastrear servicio
          </h2>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-gray-400"}`} />
              <input
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                placeholder="SPM-1234"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-mono outline-none focus:ring-2 focus:ring-[var(--color-spm-red)]/40 focus:border-[var(--color-spm-red)] transition-all ${
                  isDark
                    ? "bg-slate-800 border-white/10 text-white placeholder:text-slate-600"
                    : "bg-slate-50 border-gray-200 text-slate-900 placeholder:text-slate-400"
                }`}
              />
            </div>
            <Link
              href={`/#tracking`}
              className="px-5 py-2.5 bg-[var(--color-spm-red)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--color-spm-red-dark)] transition-all"
            >
              Rastrear
            </Link>
          </div>
        </div>

        {/* Recent Services Placeholder */}
        <div className={`rounded-2xl border ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-100 shadow-sm"}`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-inherit">
            <h2 className={`font-semibold text-base ${isDark ? "text-white" : "text-slate-900"}`}>
              Mis servicios recientes
            </h2>
            <Link
              href="/portal/servicios"
              className="text-xs text-[var(--color-spm-red)] hover:underline"
            >
              Ver todos →
            </Link>
          </div>

          <div className="p-5">
            {/* Placeholder state */}
            <div className={`text-center py-10 ${isDark ? "text-slate-600" : "text-slate-300"}`}>
              <Bike size={40} className="mx-auto mb-3" />
              <p className={`font-medium text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                No tienes servicios registrados aún
              </p>
              <p className={`text-xs mt-1 mb-4 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                Solicita tu primer servicio y aparecerá aquí
              </p>
              <Link
                href="/#cotizar"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-spm-red)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--color-spm-red-dark)] transition-all"
              >
                <Plus size={14} />
                Solicitar servicio
              </Link>
            </div>
          </div>
        </div>

        {/* Status Legend */}
        <div className={`mt-6 p-4 rounded-2xl ${isDark ? "bg-slate-900/50 border border-white/5" : "bg-white border border-gray-100"}`}>
          <p className={`text-xs font-semibold mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Estados de servicio:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Lead recibido", color: "bg-slate-500/20 text-slate-400" },
              { label: "En diagnóstico", color: "bg-yellow-500/20 text-yellow-400" },
              { label: "En camino", color: "bg-blue-500/20 text-blue-400" },
              { label: "En servicio", color: "bg-orange-500/20 text-orange-400" },
              { label: "Completado", color: "bg-green-500/20 text-green-400" },
              { label: "Pagado", color: "bg-emerald-500/20 text-emerald-400" },
            ].map(({ label, color }) => (
              <span key={label} className={`text-xs px-2.5 py-1 rounded-full font-medium ${color}`}>{label}</span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
