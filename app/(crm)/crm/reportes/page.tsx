"use client";

import CrmShell from "@/components/crm/CrmShell";
import { useTheme } from "@/contexts/ThemeContext";
import { BarChart3 } from "lucide-react";

export default function ReportesPage() {
  const { isDark } = useTheme();
  return (
    <CrmShell title="Reportes" subtitle="Analítica y métricas de operación">
      <div className={`flex flex-col items-center justify-center py-32 rounded-2xl border border-dashed ${
        isDark ? "border-white/10 text-slate-500" : "border-gray-200 text-slate-400"
      }`}>
        <BarChart3 size={40} className="mb-4 opacity-40" />
        <p className="font-semibold text-base mb-1">Reportes en desarrollo</p>
        <p className="text-sm">Aquí aparecerán métricas de servicios, tiempos de respuesta y satisfacción.</p>
      </div>
    </CrmShell>
  );
}
