"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Phone, MessageCircle, Video, PhoneCall, PhoneOff,
  Mic, MicOff, Headphones, Users, Clock, ArrowLeft, Loader2,
} from "lucide-react";

export default function ContactCenterPage() {
  const { user, hasRole, loading } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !hasRole("operador"))) {
      router.replace("/login");
    }
  }, [user, loading, hasRole, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[var(--color-spm-red)]" size={32} /></div>;
  if (!user) return null;

  return (
    <div className={`min-h-screen p-4 lg:p-8 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/crm/dashboard" className={`p-2 rounded-xl ${isDark ? "text-slate-400 hover:bg-white/5" : "text-slate-500 hover:bg-gray-100"}`}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className={`font-display font-bold text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Contact Center</h1>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Llamadas, chat y atención omnicanal</p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "En espera", value: "0", icon: Clock, color: "text-yellow-400" },
            { label: "Llamadas activas", value: "0", icon: PhoneCall, color: "text-green-400" },
            { label: "Agentes disponibles", value: "1", icon: Users, color: "text-blue-400" },
            { label: "Tiempo prom. espera", value: "—", icon: Clock, color: "text-purple-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`p-4 rounded-2xl border ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-100 shadow-sm"}`}>
              <Icon size={18} className={`${color} mb-2`} />
              <p className={`font-bold text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>{value}</p>
              <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Dial Pad / Caller Panel */}
          <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-100 shadow-sm"}`}>
            <h3 className={`font-semibold text-base mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Marcador</h3>
            <input
              type="tel"
              placeholder="+52 81 0000 0000"
              className={`w-full px-4 py-3 rounded-xl border text-sm font-mono text-center mb-3 outline-none focus:ring-2 focus:ring-[var(--color-spm-red)]/40 ${
                isDark ? "bg-slate-800 border-white/10 text-white" : "bg-slate-50 border-gray-200 text-slate-900"
              }`}
            />
            {/* Dial grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {["1","2","3","4","5","6","7","8","9","*","0","#"].map((k) => (
                <button key={k} className={`py-3 rounded-xl font-mono font-semibold text-base transition-all hover:scale-95 ${
                  isDark ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-gray-100 text-slate-900 hover:bg-gray-200"
                }`}>{k}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all">
                <PhoneCall size={16} /> Llamar
              </button>
              <button className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all">
                <PhoneOff size={16} /> Colgar
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              <button className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-medium transition-all ${isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-gray-100 text-slate-600 hover:bg-gray-200"}`}>
                <Mic size={14} /> Mute
              </button>
              <button className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-medium transition-all ${isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-gray-100 text-slate-600 hover:bg-gray-200"}`}>
                <Headphones size={14} /> Hold
              </button>
            </div>
          </div>

          {/* Chat Queue */}
          <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-100 shadow-sm"}`}>
            <h3 className={`font-semibold text-base mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
              Chats Activos
            </h3>
            <div className={`text-center py-8 ${isDark ? "text-slate-600" : "text-slate-300"}`}>
              <MessageCircle size={32} className="mx-auto mb-2" />
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>No hay chats activos</p>
              <p className={`text-xs mt-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                Integra WhatsApp Business para ver conversaciones aquí
              </p>
            </div>
          </div>

          {/* Call History */}
          <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-100 shadow-sm"}`}>
            <h3 className={`font-semibold text-base mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
              Historial de Llamadas
            </h3>
            <div className="space-y-3">
              {[
                { name: "Juan García", number: "+52 81 1234 5678", type: "incoming", time: "hace 2 min", duration: "3:42" },
                { name: "Desconocido", number: "+52 81 9876 5432", type: "missed", time: "hace 15 min", duration: "—" },
                { name: "María López", number: "+52 81 5555 1234", type: "outgoing", time: "hace 1 hr", duration: "8:17" },
              ].map(({ name, number, type, time, duration }, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? "bg-slate-800" : "bg-slate-50"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    type === "incoming" ? "bg-green-500/20 text-green-400"
                    : type === "missed" ? "bg-red-500/20 text-red-400"
                    : "bg-blue-500/20 text-blue-400"
                  }`}>
                    {type === "incoming" ? <Phone size={14} /> : type === "missed" ? <PhoneOff size={14} /> : <PhoneCall size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-xs ${isDark ? "text-white" : "text-slate-900"}`}>{name}</p>
                    <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"} font-mono`}>{number}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{time}</p>
                    <p className={`text-xs font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}>{duration}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={`mt-4 p-3 rounded-xl text-xs ${isDark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
              💡 Integra <strong>Twilio Voice</strong> o <strong>SPM-Voice</strong> para llamadas reales.{" "}
              <Link href="/crm/configuracion" className="text-[var(--color-spm-red)] hover:underline">
                Configurar →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
