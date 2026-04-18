"use client";

import { Suspense } from "react";

/**
 * /portal/pagar — Payment portal page.
 *
 * Shows:
 *   - Success confirmation when Stripe redirects back with ?status=success
 *   - Cancelled state when client cancels payment
 *   - Pending payments list (tickets in "completado" with a paymentLinkUrl)
 *   - "Pagar ahora" button that opens the Stripe Checkout Session
 */

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { subscribeTickets } from "@/lib/firestore/tickets";
import type { ServiceTicket } from "@/types";
import {
  CreditCard, CheckCircle2, XCircle, Loader2,
  ArrowLeft, ExternalLink, Clock,
} from "lucide-react";

function PagarContent() {
  const { user, loading } = useAuth();
  const { isDark }        = useTheme();
  const router            = useRouter();
  const params            = useSearchParams();

  const status    = params.get("status");   // success | cancelled
  const ticketId  = params.get("ticket");

  const [tickets, setTickets]   = useState<ServiceTicket[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeTickets((all) => {
      const email = user.email?.toLowerCase();
      const phone = user.phone;
      const mine = all.filter(t =>
        ((email && t.clientEmail?.toLowerCase() === email) ||
         (phone && t.clientPhone === phone)) &&
        (t.status === "completado" || t.status === "pagado")
      );
      setTickets(mine);
      setFetching(false);
    });
    return unsub;
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[var(--color-spm-red)]" />
      </div>
    );
  }

  if (!user) return null;

  const card = `p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-100 shadow-sm"}`;

  // ── Success / Cancelled states ──────────────────────────────────────────────
  if (status === "success") {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className={`${card} max-w-md w-full text-center`}>
          <CheckCircle2 size={56} className="text-green-400 mx-auto mb-4" />
          <h1 className={`font-display font-bold text-2xl mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
            ¡Pago confirmado!
          </h1>
          <p className={`text-sm mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Recibimos tu pago para el folio <strong>{ticketId}</strong>.
          </p>
          <p className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Te enviamos la confirmación por WhatsApp. ¡Gracias por confiar en SanPedroMotoCare!
          </p>
          <Link
            href="/portal"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-spm-red)] hover:bg-[var(--color-spm-red-dark)] text-white font-bold text-sm transition-all"
          >
            Volver al portal
          </Link>
        </div>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className={`${card} max-w-md w-full text-center`}>
          <XCircle size={56} className="text-red-400 mx-auto mb-4" />
          <h1 className={`font-display font-bold text-2xl mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
            Pago cancelado
          </h1>
          <p className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Cancelaste el proceso de pago para el folio <strong>{ticketId}</strong>. Puedes intentarlo de nuevo cuando quieras.
          </p>
          <Link
            href="/portal"
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl border font-semibold text-sm transition-all ${
              isDark ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-gray-200 text-slate-700 hover:bg-gray-50"
            }`}
          >
            <ArrowLeft size={14} /> Volver al portal
          </Link>
        </div>
      </div>
    );
  }

  // ── Pending payments list ───────────────────────────────────────────────────
  const pendingPayment = tickets.filter(t => t.status === "completado" && t.paymentLinkUrl);
  const paid           = tickets.filter(t => t.status === "pagado");

  return (
    <div className={`min-h-screen p-4 lg:p-8 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/portal" className={`p-2 rounded-xl transition-all ${isDark ? "text-slate-400 hover:bg-white/5" : "text-slate-500 hover:bg-gray-100"}`}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className={`font-display font-bold text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Mis pagos</h1>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Historial y pagos pendientes</p>
          </div>
        </div>

        {/* Poliza de Mantenimiento */}
        <a
          href="https://buy.stripe.com/test_14A6oAbSo6bm8XZ5imfQI00"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-4 p-4 rounded-2xl border mb-6 hover:scale-[1.01] transition-all ${
            isDark ? "bg-emerald-950/30 border-emerald-800/30" : "bg-emerald-50 border-emerald-200"
          }`}
        >
          <span className="text-2xl flex-shrink-0">🛵</span>
          <div className="flex-1 min-w-0">
            <p className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
              Poliza de Mantenimiento para Repartidores
            </p>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Mantenimiento preventivo mensual — $99 MXN/mes
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 ${
            isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700"
          }`}>
            Suscribirse
          </span>
        </a>

        {fetching ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[var(--color-spm-red)]" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending payments */}
            {pendingPayment.length > 0 && (
              <div>
                <h2 className={`font-semibold text-sm uppercase tracking-wide mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Pago pendiente
                </h2>
                <div className="space-y-3">
                  {pendingPayment.map(t => (
                    <div key={t.id} className={`${card} flex items-start gap-4`}>
                      <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <Clock size={18} className="text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{t.ticketId}</p>
                            <p className={`text-xs truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              {t.serviceDescription?.slice(0, 60)}
                            </p>
                          </div>
                          {t.finalCost != null && (
                            <p className={`font-display font-bold text-lg flex-shrink-0 ${isDark ? "text-white" : "text-slate-900"}`}>
                              ${t.finalCost.toLocaleString("es-MX")}
                            </p>
                          )}
                        </div>
                        <a
                          href={t.paymentLinkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-[var(--color-spm-red)] hover:bg-[var(--color-spm-red-dark)] text-white text-sm font-bold transition-all"
                        >
                          <CreditCard size={14} /> Pagar ahora
                          <ExternalLink size={12} className="opacity-70" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Paid history */}
            {paid.length > 0 && (
              <div>
                <h2 className={`font-semibold text-sm uppercase tracking-wide mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Pagados
                </h2>
                <div className="space-y-2">
                  {paid.map(t => (
                    <div key={t.id} className={`${card} flex items-center gap-4`}>
                      <CheckCircle2 size={18} className="text-green-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{t.ticketId}</p>
                        <p className={`text-xs truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          {t.serviceDescription?.slice(0, 50)}
                        </p>
                      </div>
                      {t.finalCost != null && (
                        <p className={`text-sm font-bold text-green-400 flex-shrink-0`}>
                          ${t.finalCost.toLocaleString("es-MX")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingPayment.length === 0 && paid.length === 0 && (
              <div className={`flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed ${
                isDark ? "border-white/10 text-slate-500" : "border-gray-200 text-slate-400"
              }`}>
                <CreditCard size={36} className="mb-3 opacity-40" />
                <p className="font-semibold">Sin servicios completados</p>
                <p className="text-sm">Cuando tu servicio esté listo, aquí podrás pagarlo.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PagarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 size={32} className="animate-spin text-[var(--color-spm-red)]" />
      </div>
    }>
      <PagarContent />
    </Suspense>
  );
}
