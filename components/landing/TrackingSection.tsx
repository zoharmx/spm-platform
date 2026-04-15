"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Search, MapPin, User, Phone, Clock, CheckCircle2, Loader2 } from "lucide-react";

interface TrackingResult {
  ticketId: string;
  status: string;
  clientName: string;
  mechanicName?: string;
  mechanicPhone?: string;
  serviceType: string;
  serviceAddress: { street?: string; colonia?: string; city?: string };
  estimatedCost?: number;
  createdAt?: string;
  updatedAt?: string;
}

const STATUS_STEPS = [
  { key: "lead-recibido", label: "Solicitud recibida", labelEn: "Request received" },
  { key: "diagnostico-pendiente", label: "Diagnóstico", labelEn: "Diagnosis" },
  { key: "en-camino", label: "En camino", labelEn: "On the way" },
  { key: "en-servicio", label: "En servicio", labelEn: "In service" },
  { key: "completado", label: "Completado", labelEn: "Completed" },
];

function getStepIndex(status: string) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

export default function TrackingSection() {
  const { t, lang } = useLanguage();
  const { isDark } = useTheme();
  const [ticketInput, setTicketInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState("");

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketInput.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const clean = ticketInput.trim().toUpperCase();
      const res = await fetch(`/api/tracking/${encodeURIComponent(clean)}`);
      if (!res.ok) throw new Error("not_found");
      const data = await res.json();
      setResult(data);
    } catch {
      setError(t("tracking_not_found"));
    } finally {
      setLoading(false);
    }
  }

  const currentStep = result ? getStepIndex(result.status) : -1;

  return (
    <section
      id="tracking"
      className={`py-24 lg:py-32 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-4 ${
            isDark
              ? "bg-blue-950/50 text-blue-400 border border-blue-900/50"
              : "bg-blue-50 text-blue-600 border border-blue-200"
          }`}>
            {t("tracking_badge")}
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl mb-4">
            {t("tracking_title")}{" "}
            <span className="gradient-text">{t("tracking_title_accent")}</span>
          </h2>
          <p className={`text-lg max-w-xl mx-auto ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            {t("tracking_subtitle")}
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleTrack} className="max-w-xl mx-auto mb-12">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
              />
              <input
                type="text"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                placeholder={t("tracking_placeholder")}
                className={`w-full pl-12 pr-4 py-4 rounded-2xl text-base font-mono font-semibold border transition-all outline-none focus:ring-2 focus:ring-[var(--color-spm-red)]/40 focus:border-[var(--color-spm-red)] ${
                  isDark
                    ? "bg-slate-900 border-white/10 text-white placeholder:text-slate-600"
                    : "bg-white border-gray-200 text-slate-900 placeholder:text-slate-400 shadow-sm"
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-4 bg-[var(--color-spm-red)] hover:bg-[var(--color-spm-red-dark)] text-white font-bold rounded-2xl transition-all hover:scale-105 disabled:opacity-60 disabled:scale-100 min-w-[100px] flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                t("tracking_btn")
              )}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-center text-sm text-red-400">{error}</p>
          )}
        </form>

        {/* Tracking Result */}
        {result && (
          <div className={`rounded-3xl overflow-hidden border ${
            isDark ? "bg-slate-900 border-white/10" : "bg-white border-gray-200 shadow-lg"
          }`}>
            {/* Header Bar */}
            <div className="bg-gradient-to-r from-[var(--color-spm-red)] to-[var(--color-spm-orange)] px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs font-medium">Ticket</p>
                  <p className="text-white font-bold text-xl font-mono">{result.ticketId}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/70 text-xs">Estado</p>
                  <p className="text-white font-semibold text-sm capitalize">
                    {result.status.replace("-", " ")}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-6">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        i <= currentStep
                          ? "bg-[var(--color-spm-red)] text-white shadow-lg shadow-red-900/30"
                          : isDark
                          ? "bg-slate-800 text-slate-600"
                          : "bg-gray-100 text-gray-400"
                      }`}>
                        {i < currentStep ? (
                          <CheckCircle2 size={14} />
                        ) : i === currentStep ? (
                          <div className="w-2.5 h-2.5 bg-white rounded-full" />
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span className={`mt-2 text-xs text-center w-16 leading-tight ${
                        i <= currentStep
                          ? isDark ? "text-white" : "text-slate-900"
                          : isDark ? "text-slate-600" : "text-gray-400"
                      }`}>
                        {lang === "es" ? step.label : step.labelEn}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 mt-[-20px] ${
                        i < currentStep ? "bg-[var(--color-spm-red)]" : isDark ? "bg-slate-800" : "bg-gray-200"
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Details */}
              <div className="grid sm:grid-cols-2 gap-4">
                {result.mechanicName && (
                  <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? "bg-slate-800" : "bg-slate-50"}`}>
                    <User size={16} className="text-[var(--color-spm-red)]" />
                    <div>
                      <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Mecánico asignado</p>
                      <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{result.mechanicName}</p>
                    </div>
                  </div>
                )}
                {result.mechanicPhone && (
                  <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? "bg-slate-800" : "bg-slate-50"}`}>
                    <Phone size={16} className="text-[var(--color-spm-red)]" />
                    <div>
                      <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Contacto</p>
                      <a href={`tel:${result.mechanicPhone}`} className="font-semibold text-sm text-[var(--color-spm-red)]">
                        {result.mechanicPhone}
                      </a>
                    </div>
                  </div>
                )}
                {result.serviceAddress?.colonia && (
                  <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? "bg-slate-800" : "bg-slate-50"}`}>
                    <MapPin size={16} className="text-[var(--color-spm-red)]" />
                    <div>
                      <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Dirección del servicio</p>
                      <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
                        {result.serviceAddress.street}, {result.serviceAddress.colonia}
                      </p>
                    </div>
                  </div>
                )}
                {result.estimatedCost && (
                  <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? "bg-slate-800" : "bg-slate-50"}`}>
                    <Clock size={16} className="text-[var(--color-spm-red)]" />
                    <div>
                      <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Costo estimado</p>
                      <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
                        ${result.estimatedCost.toLocaleString("es-MX")} MXN
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Demo hint */}
        {!result && !error && (
          <p className={`text-center text-sm ${isDark ? "text-slate-600" : "text-slate-400"}`}>
            Ingresa tu número de ticket en formato <span className="font-mono font-semibold">SPM-1234</span>
          </p>
        )}
      </div>
    </section>
  );
}
