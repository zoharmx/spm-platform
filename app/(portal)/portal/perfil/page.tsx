"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowLeft, User, Mail, Phone, Shield, Loader2, Save } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

export default function PerfilPage() {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const db = getDb();
      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim(),
        phone: phone.trim() || null,
        updatedAt: serverTimestamp(),
      });
      toast.success("Perfil actualizado");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[var(--color-spm-red)]" />
      </div>
    );
  }

  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--color-spm-red)]/30 focus:border-[var(--color-spm-red)] ${
    isDark ? "bg-slate-800 border-white/10 text-white placeholder:text-slate-500" : "bg-white border-gray-200 text-slate-900 placeholder:text-slate-400"
  }`;
  const labelCls = `block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`;
  const card = `rounded-2xl border p-5 ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-100 shadow-sm"}`;

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <Toaster position="top-right" />

      <header className={`sticky top-0 z-30 border-b px-4 py-3 ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-200"}`}>
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/portal" className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
            <ArrowLeft size={18} />
          </Link>
          <h1 className={`font-display font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>
            Mi perfil
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Avatar + email */}
        <div className={`${card} flex items-center gap-4`}>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-spm-red)] to-[var(--color-spm-orange)] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {user.displayName?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <p className={`font-display font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>
              {user.displayName}
            </p>
            <p className={`text-sm flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              <Mail size={12} /> {user.email}
            </p>
            <p className={`text-xs flex items-center gap-1.5 mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              <Shield size={11} /> {user.role}
            </p>
          </div>
        </div>

        {/* Edit form */}
        <div className={card}>
          <h2 className={`font-semibold text-sm mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
            Editar datos
          </h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Nombre completo</label>
              <input className={inputCls} value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Tu nombre" />
            </div>
            <div>
              <label className={labelCls}>Telefono</label>
              <input className={inputCls} value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+52 81 0000-0000" />
              <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Agrega tu telefono para vincular tus tickets automaticamente
              </p>
            </div>
            <button onClick={handleSave} disabled={saving}
              className="w-full py-2.5 rounded-xl bg-[var(--color-spm-red)] hover:bg-[var(--color-spm-red-dark)] text-white text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Guardar cambios
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
