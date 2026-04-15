"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallBanner() {
  const { isDark } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      localStorage.getItem("spm-pwa-dismissed")
    ) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner after 3 seconds
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem("spm-pwa-dismissed", "1");
  }

  if (!showBanner || dismissed) return null;

  return (
    <div
      className={`fixed bottom-24 left-4 right-4 sm:left-6 sm:right-auto sm:w-96 z-40 rounded-2xl shadow-2xl border overflow-hidden ${
        isDark
          ? "bg-slate-900 border-white/10 shadow-black/50"
          : "bg-white border-gray-200 shadow-gray-200"
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="relative w-12 h-12 flex-shrink-0">
          <Image src="/images/logo.png" alt="SPM" fill className="object-contain rounded-xl" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
            Instala SanPedroMotoCare
          </p>
          <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Acceso rápido, funciona sin internet y recibe notificaciones.
          </p>
          <button
            onClick={handleInstall}
            className="mt-2.5 flex items-center gap-1.5 px-4 py-2 bg-[var(--color-spm-red)] text-white text-xs font-semibold rounded-lg hover:bg-[var(--color-spm-red-dark)] transition-all"
          >
            <Download size={12} />
            Agregar a inicio
          </button>
        </div>
        <button
          onClick={handleDismiss}
          className={`p-1 rounded-lg transition-colors flex-shrink-0 ${
            isDark ? "text-slate-500 hover:text-slate-300" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
