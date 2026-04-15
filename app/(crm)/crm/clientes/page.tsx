"use client";

import CrmShell from "@/components/crm/CrmShell";
import { useTheme } from "@/contexts/ThemeContext";
import { Users, Plus, Search } from "lucide-react";

export default function ClientesPage() {
  const { isDark } = useTheme();
  return (
    <CrmShell title="Clientes" subtitle="Base de datos de clientes SPM">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className={`flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl border text-sm ${
            isDark ? "bg-slate-900 border-white/10 text-white" : "bg-white border-gray-200"
          }`}>
            <Search size={15} className="text-slate-400 flex-shrink-0" />
            <input type="text" placeholder="Buscar cliente por nombre, teléfono o email…"
              className="bg-transparent outline-none w-full placeholder:text-slate-500" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-spm-red)] hover:bg-[var(--color-spm-red-dark)] text-white text-sm font-semibold transition-all">
            <Plus size={15} /> Nuevo cliente
          </button>
        </div>
        <div className={`flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed ${
          isDark ? "border-white/10 text-slate-500" : "border-gray-200 text-slate-400"
        }`}>
          <Users size={40} className="mb-4 opacity-40" />
          <p className="font-semibold text-base mb-1">Sin clientes registrados</p>
          <p className="text-sm">Los clientes se crean automáticamente cuando se recibe una cotización.</p>
        </div>
      </div>
    </CrmShell>
  );
}
