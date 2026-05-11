"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Download, X, Share } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function PWAInstallBanner() {
  const { isDark } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem("spm-pwa-dismissed")) return;

    const ios = detectIos();
    setIsIos(ios);

    if (ios) {
      setTimeout(() => setShowBanner(true), 3000);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setShowBanner(false);
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowBanner(false);
    localStorage.setItem("spm-pwa-dismissed", "1");
  }

  if (!showBanner) return null;

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

          {isIos ? (
            <>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Toca{" "}
                <span
                  className={`inline-flex items-center gap-0.5 font-semibold px-1 py-0.5 rounded ${
                    isDark ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <Share size={11} />
                  Compartir
                </span>{" "}
                en Safari y selecciona{" "}
                <span className="font-semibold">"Agregar a pantalla de inicio"</span>.
              </p>
              <div
                className={`mt-2.5 flex items-center gap-2 text-xs ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                <span
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
                    isDark ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500"
                  }`}
                >
                  <span>1.</span>
                  <Share size={10} />
                  <span>Compartir</span>
                </span>
                <span>→</span>
                <span
                  className={`px-2 py-1 rounded-lg border ${
                    isDark ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500"
                  }`}
                >
                  2. Agregar a inicio
                </span>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
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

      {isIos && (
        <div
          className={`px-4 pb-3 text-xs ${isDark ? "text-slate-600" : "text-slate-300"}`}
        >
          Abre esta página en Safari para poder instalar la app.
        </div>
      )}
    </div>
  );
}
