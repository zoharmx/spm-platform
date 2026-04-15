"use client";

import Image from "next/image";
import { useInView } from "react-intersection-observer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Wrench, Zap, Settings, Link2, Circle, Battery, Cpu, Cog, ShieldCheck, Star,
} from "lucide-react";

const SERVICES = [
  { key: "afinacion_menor", icon: Wrench, color: "from-blue-500 to-cyan-500" },
  { key: "afinacion_mayor", icon: Settings, color: "from-purple-500 to-pink-500" },
  { key: "frenos", icon: ShieldCheck, color: "from-red-500 to-rose-500" },
  { key: "electrico", icon: Zap, color: "from-yellow-500 to-orange-500" },
  { key: "suspension", icon: Cog, color: "from-green-500 to-emerald-500" },
  { key: "cadena", icon: Link2, color: "from-orange-500 to-amber-500" },
  { key: "neumaticos", icon: Circle, color: "from-slate-500 to-gray-500" },
  { key: "bateria", icon: Battery, color: "from-indigo-500 to-blue-500" },
];

export default function ServicesSection() {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="servicios" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-4 ${
            isDark
              ? "bg-red-950/50 text-red-400 border border-red-900/50"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}>
            {t("services_badge")}
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl mb-4">
            {t("services_title")}{" "}
            <span className="gradient-text">{t("services_title_accent")}</span>
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            {t("services_subtitle")}
          </p>
        </div>

        {/* Services Grid + Image */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Mechanic image 1 */}
          <div className="relative hidden lg:block">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/images/mecanico-1.png"
                alt="Mecánico SPM en acción"
                width={600}
                height={700}
                className="w-full h-[480px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-spm-dark)]/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className={`p-4 rounded-2xl backdrop-blur-sm ${isDark ? "bg-slate-900/80 border border-white/10" : "bg-white/90 border border-gray-200"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-spm-red)] flex items-center justify-center">
                      <Star size={16} className="text-white" fill="white" />
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>4.9 ⭐ en Google</p>
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>+200 reseñas verificadas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-[var(--color-spm-red)] to-[var(--color-spm-orange)] rounded-2xl flex flex-col items-center justify-center shadow-xl rotate-6">
              <span className="text-white font-bold text-2xl">98%</span>
              <span className="text-white/80 text-xs text-center leading-tight">Clientes<br/>satisfechos</span>
            </div>
          </div>

          {/* Services cards */}
          <div ref={ref} className="grid grid-cols-2 gap-4">
            {SERVICES.map(({ key, icon: Icon, color }, i) => (
              <div
                key={key}
                className={`group p-5 rounded-2xl border transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-default ${
                  isDark
                    ? "bg-slate-900/60 border-white/5 hover:border-[var(--color-spm-red)]/40"
                    : "bg-white border-gray-100 hover:border-[var(--color-spm-red)]/30 shadow-sm"
                } ${inView ? "animate-fade-in-up" : "opacity-0"}`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon size={18} className="text-white" />
                </div>
                <h3 className={`font-semibold text-sm mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                  {t(`services_${key}` as Parameters<typeof t>[0])}
                </h3>
                <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {t(`services_${key}_desc` as Parameters<typeof t>[0])}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose SPM — Mechanics showcase */}
        <div className={`rounded-3xl p-8 lg:p-12 ${isDark ? "bg-slate-900/50 border border-white/5" : "bg-slate-50 border border-slate-200"}`}>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-10 items-center">
            {/* Text */}
            <div className="md:col-span-1">
              <h3 className="font-display font-bold text-2xl lg:text-3xl mb-4">
                Mecánicos <span className="gradient-text">certificados</span> y de confianza
              </h3>
              <p className={`text-sm leading-relaxed mb-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Cada mecánico de SPM pasa por verificación de antecedentes, capacitación técnica y evaluación continua de satisfacción del cliente.
              </p>
              <a href="#cotizar" className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-spm-red)] text-white font-semibold text-sm rounded-xl hover:bg-[var(--color-spm-red-dark)] transition-all hover:scale-105">
                Cotizar ahora
              </a>
            </div>

            {/* Mechanic images grid */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              {[
                { src: "/images/mecanico-2.png", label: "Mecánico certificado" },
                { src: "/images/mecanico-3.png", label: "Servicio en sitio" },
              ].map(({ src, label }, i) => (
                <div key={i} className="relative rounded-2xl overflow-hidden h-48 lg:h-56 group">
                  <Image
                    src={src}
                    alt={label}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-3 left-3 text-white text-xs font-medium bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
