"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronDown, Zap, Shield, Clock } from "lucide-react";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";

export default function HeroSection() {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isMobile, setIsMobile]       = useState(false);
  const { ref: statsRef, inView: statsInView } = useInView({ triggerOnce: true, threshold: 0.2 });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // When the source file changes (mobile ↔ desktop), reload and replay the video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setVideoLoaded(false);
    video.load();
    // On mobile defer slightly to avoid blocking LCP paint
    const delay = isMobile ? 600 : 0;
    const id = setTimeout(() => video.play().catch(() => {}), delay);
    return () => clearTimeout(id);
  }, [isMobile]);

  const stats = [
    { value: 500, suffix: "+", label: t("hero_stat_services"), icon: "🏍️" },
    { value: 98, suffix: "%", label: t("hero_stat_satisfaction"), icon: "⭐" },
    { value: 45, suffix: "", label: t("hero_stat_response"), icon: "⚡" },
    { value: 8, suffix: "+", label: t("hero_stat_zones"), icon: "📍" },
  ];

  const features = [
    { icon: Zap, text: "Respuesta en 45 min" },
    { icon: Shield, text: "Garantía en servicio" },
    { icon: Clock, text: "Atención 24/7" },
  ];

  /*
   * Two pre-encoded files served by device type:
   *
   *  hero-bg-desktop.mp4  — landscape 1280×720, crop del centro del original
   *                          portrait, CRF 26, 24fps  → object-fit: cover llena
   *                          la pantalla sin barras negras
   *
   *  hero-bg-mobile.mp4   — portrait 540×960, mitad de resolución del original,
   *                          CRF 28, 24fps  → object-fit: cover llena el viewport
   *                          móvil perfectamente sin escalar de más
   */
  const videoSrc = isMobile
    ? "/videos/hero-bg-mobile.mp4"
    : "/videos/hero-bg-desktop.mp4";

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* Video Background */}
      <div className="absolute inset-0 z-0">

        {/*
         * Fallback gradient — visible instantáneamente antes de que cargue el
         * video. Coincide con la paleta marino del video "spm azul".
         * Se desvanece cuando el video está listo.
         */}
        <div
          aria-hidden
          className={`absolute inset-0 bg-gradient-to-br from-[#071428] via-[#0D1B3E] to-[#0F172A] transition-opacity duration-1000 ${
            videoLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        />

        {/*
         * <video> optimizado:
         *   poster         → frame estático JPG (5KB) para LCP inmediato
         *   preload        → "none" en móvil (ahorra datos hasta que se hace play),
         *                    "metadata" en desktop (solo cabeceras)
         *   playsInline    → requerido para autoplay en iOS
         *   muted + loop   → video de fondo en bucle sin sonido
         *   object-fit     → "cover" en ambos: cada archivo ya tiene la relación de
         *                    aspecto correcta para su viewport
         */}
        <video
          ref={videoRef}
          key={videoSrc}           /* fuerza remount cuando cambia el src */
          className={`w-full h-full transition-opacity duration-1000 ${
            videoLoaded ? "opacity-100" : "opacity-0"
          }`}
          autoPlay
          muted
          loop
          playsInline
          preload={isMobile ? "none" : "metadata"}
          poster="/videos/hero-poster.jpg"
          onCanPlay={() => setVideoLoaded(true)}
          onLoadedData={() => setVideoLoaded(true)}
          style={{
            objectFit: "cover",
            objectPosition: "center center",
            backgroundColor: "#071428",
          }}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>

        {/* Overlay oscuro para legibilidad del texto */}
        <div className="absolute inset-0 hero-video-overlay" />

        {/* Glows de marca — paleta azul SPM */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-700/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-green-700/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.2s" }} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 lg:pt-32 lg:pb-20">
        <div className="text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 mb-6 sm:mb-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs sm:text-sm font-medium">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
            <span className="truncate max-w-[240px] sm:max-w-none">{t("hero_badge")}</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-[2.2rem] leading-[1.15] sm:text-5xl lg:text-7xl font-bold text-white mb-4 sm:mb-6">
            {t("hero_title")}{" "}
            <span className="relative inline-block">
              <span className="gradient-text">{t("hero_title_accent")}</span>
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--color-spm-red)] to-[var(--color-spm-orange)] rounded" />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg lg:text-xl text-white/75 max-w-xl sm:max-w-2xl mx-auto mb-6 sm:mb-10 leading-relaxed px-2 sm:px-0">
            {t("hero_subtitle")}
          </p>

          {/* Feature Pills — ocultas en mobile XS */}
          <div className="hidden sm:flex flex-wrap items-center justify-center gap-3 mb-8 sm:mb-10">
            {features.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white/85 text-sm"
              >
                <Icon size={14} className="text-[var(--color-spm-orange)]" />
                {text}
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-20">
            <a
              href="#cotizar"
              className="group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[var(--color-spm-red)] hover:bg-[var(--color-spm-red-dark)] text-white font-bold text-base lg:text-lg rounded-2xl shadow-xl shadow-red-900/30 transition-all hover:scale-105 hover:shadow-red-900/50 active:scale-95"
            >
              {t("hero_cta_quote")}
              <ChevronDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
            </a>
            <a
              href="#tracking"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/25 text-white font-bold text-base lg:text-lg rounded-2xl transition-all hover:scale-105 active:scale-95"
            >
              {t("hero_cta_track")}
            </a>
          </div>

          {/* Stats */}
          <div
            ref={statsRef}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto"
          >
            {stats.map((stat, i) => (
              <div
                key={i}
                className="flex flex-col items-center p-4 sm:p-5 rounded-2xl bg-white/8 backdrop-blur-sm border border-white/10 hover:border-[var(--color-spm-red)]/50 transition-all group"
              >
                <span className="text-xl sm:text-2xl mb-1">{stat.icon}</span>
                <div className="font-display font-bold text-2xl sm:text-3xl text-white mb-1">
                  {statsInView ? (
                    <CountUp end={stat.value} duration={2} delay={i * 0.1} />
                  ) : (
                    "0"
                  )}
                  {stat.suffix}
                </div>
                <p className="text-white/60 text-xs text-center">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <a href="#servicios" aria-label="Scroll down">
          <ChevronDown size={28} className="text-white/50" />
        </a>
      </div>
    </section>
  );
}
