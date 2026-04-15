"use client";

import CrmShell from "@/components/crm/CrmShell";
import { useTheme } from "@/contexts/ThemeContext";
import { Settings, Bell, Shield, Globe, Palette } from "lucide-react";

export default function ConfiguracionPage() {
  const { isDark } = useTheme();

  const sections = [
    { icon: Bell,    title: "Notificaciones",   desc: "Configura alertas de nuevos tickets y asignaciones" },
    { icon: Shield,  title: "Roles y permisos",  desc: "Gestión de acceso por rol: viewer, operador, manager, admin" },
    { icon: Globe,   title: "Idioma y zona horaria", desc: "Español (es-MX) · UTC-6 Centro" },
    { icon: Palette, title: "Apariencia",        desc: "Tema claro / oscuro · Logo y colores de marca" },
  ];

  return (
    <CrmShell title="Configuración" subtitle="Ajustes generales de la plataforma">
      <div className="max-w-2xl space-y-3">
        {sections.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className={`flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
              isDark ? "bg-slate-900 border-white/5 hover:border-white/10" : "bg-white border-gray-100 hover:border-gray-200 shadow-sm"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--color-spm-red)]/10 flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-[var(--color-spm-red)]" />
            </div>
            <div>
              <p className={`font-semibold text-sm mb-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>{title}</p>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </CrmShell>
  );
}
