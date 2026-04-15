"use client";

import CrmShell from "@/components/crm/CrmShell";
import { useTheme } from "@/contexts/ThemeContext";
import { FileText, Search } from "lucide-react";

export default function FacturasPage() {
  const { isDark } = useTheme();
  return (
    <CrmShell title="Facturas" subtitle="Historial de facturación y pagos">
      <div className="space-y-6">
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm ${
          isDark ? "bg-slate-900 border-white/10 text-white" : "bg-white border-gray-200"
        }`}>
          <Search size={15} className="text-slate-400 flex-shrink-0" />
          <input type="text" placeholder="Buscar factura por ticket o cliente…"
            className="bg-transparent outline-none w-full placeholder:text-slate-500" />
        </div>
        <div className={`flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed ${
          isDark ? "border-white/10 text-slate-500" : "border-gray-200 text-slate-400"
        }`}>
          <FileText size={40} className="mb-4 opacity-40" />
          <p className="font-semibold text-base mb-1">Sin facturas</p>
          <p className="text-sm">Las facturas se generan cuando un ticket cambia a estado <strong>pagado</strong>.</p>
        </div>
      </div>
    </CrmShell>
  );
}
