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
  const { ref: statsRef, inView: statsInView } = useInView({ triggerOnce: true, threshold: 0.2 });

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {
        // Autoplay blocked — show fallback
      });
    }
  }, []);

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

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => setVideoLoaded(true)}
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 hero-video-overlay" />

        {/* Animated gradient blobs */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-spm-red)]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[var(--color-spm-orange)]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            {t("hero_badge")}
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            {t("hero_title")}{" "}
            <span className="relative">
              <span className="gradient-text">{t("hero_title_accent")}</span>
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--color-spm-red)] to-[var(--color-spm-orange)] rounded" />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("hero_subtitle")}
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <a
              href="#cotizar"
              className="group flex items-center gap-2 px-8 py-4 bg-[var(--color-spm-red)] hover:bg-[var(--color-spm-red-dark)] text-white font-bold text-base lg:text-lg rounded-2xl shadow-xl shadow-red-900/30 transition-all hover:scale-105 hover:shadow-red-900/50"
            >
              {t("hero_cta_quote")}
              <ChevronDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
            </a>
            <a
              href="#tracking"
              className="flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/25 text-white font-bold text-base lg:text-lg rounded-2xl transition-all hover:scale-105"
            >
              {t("hero_cta_track")}
            </a>
          </div>

          {/* Stats */}
          <div
            ref={statsRef}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {stats.map((stat, i) => (
              <div
                key={i}
                className="flex flex-col items-center p-5 rounded-2xl bg-white/8 backdrop-blur-sm border border-white/10 hover:border-[var(--color-spm-red)]/50 transition-all group"
              >
                <span className="text-2xl mb-1">{stat.icon}</span>
                <div className="font-display font-bold text-3xl text-white mb-1">
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
