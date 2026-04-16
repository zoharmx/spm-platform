"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, where, serverTimestamp,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { Motorcycle, MotoType } from "@/types";
import {
  ArrowLeft, Plus, Bike, Edit2, Trash2,
  X, Save, Loader2, ChevronDown,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const MOTO_TYPES: Record<MotoType, string> = {
  naked: "Naked", deportiva: "Deportiva", touring: "Touring",
  enduro: "Enduro / Trail", scooter: "Scooter", custom: "Custom / Cruiser", otra: "Otra",
};

const MOTO_BRANDS = [
  "Honda", "Yamaha", "Kawasaki", "Suzuki", "BMW", "KTM", "Ducati",
  "Harley-Davidson", "Royal Enfield", "Bajaj", "Italika", "Carabela", "Otra",
];

interface MotoForm {
  brand: string;
  model: string;
  year: string;
  color: string;
  placa: string;
  tipoMoto: MotoType;
  cilindrada: string;
}

const EMPTY_FORM: MotoForm = {
  brand: "", model: "", year: new Date().getFullYear().toString(),
  color: "", placa: "", tipoMoto: "naked", cilindrada: "",
};

export default function MotoPage() {
  const { user, loading } = useAuth();
  const { isDark }        = useTheme();
  const router            = useRouter();

  const [motos,    setMotos]    = useState<Motorcycle[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [form,     setForm]     = useState<MotoForm>(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const db = getDb();
    const q  = query(collection(db, "motorcycles"), where("clientId", "==", user.uid));
    return onSnapshot(q, snap => {
      setMotos(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Motorcycle));
      setFetching(false);
    });
  }, [user]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(moto: Motorcycle) {
    setForm({
      brand:      moto.brand,
      model:      moto.model,
      year:       moto.year.toString(),
      color:      moto.color ?? "",
      placa:      moto.placa ?? "",
      tipoMoto:   moto.tipoMoto ?? "naked",
      cilindrada: moto.cilindrada?.toString() ?? "",
    });
    setEditId(moto.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.brand || !form.model || !form.year) {
      toast.error("Marca, modelo y año son requeridos");
      return;
    }
    setSaving(true);
    try {
      const db = getDb();
      const data = {
        brand:      form.brand.trim(),
        model:      form.model.trim(),
        year:       Number(form.year),
        color:      form.color.trim() || undefined,
        placa:      form.placa.trim().toUpperCase() || undefined,
        tipoMoto:   form.tipoMoto,
        cilindrada: form.cilindrada ? Number(form.cilindrada) : undefined,
        clientId:   user!.uid,
        updatedAt:  serverTimestamp(),
      };
      if (editId) {
        await updateDoc(doc(db, "motorcycles", editId), data);
        toast.success("Moto actualizada");
      } else {
        await addDoc(collection(db, "motorcycles"), { ...data, createdAt: serverTimestamp() });
        toast.success("Moto registrada");
      }
      setShowForm(false);
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteDoc(doc(getDb(), "motorcycles", id));
      toast.success("Moto eliminada");
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeleting(null);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[var(--color-spm-red)]" />
      </div>
    );
  }

  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-1 focus:ring-[var(--color-spm-red)]/30 focus:border-[var(--color-spm-red)] ${
    isDark ? "bg-slate-800 border-white/10 text-white placeholder:text-slate-500" : "bg-white border-gray-200 text-slate-900"
  }`;
  const card = `rounded-2xl border ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-100 shadow-sm"}`;

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <Toaster position="top-right" />

      {/* Header */}
      <header className={`sticky top-0 z-30 border-b px-4 py-3 ${isDark ? "bg-slate-900 border-white/5" : "bg-white border-gray-200"}`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/portal" className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
              <ArrowLeft size={18} />
            </Link>
            <h1 className={`font-display font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>
              Mis motocicletas
            </h1>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-spm-red)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--color-spm-red-dark)] transition-all"
          >
            <Plus size={15} /> Agregar moto
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {fetching ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[var(--color-spm-red)]" />
          </div>
        ) : motos.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed ${
            isDark ? "border-white/10 text-slate-500" : "border-gray-200 text-slate-400"
          }`}>
            <Bike size={40} className="mb-3 opacity-40" />
            <p className="font-semibold text-sm mb-1">Sin motocicletas registradas</p>
            <p className="text-xs mb-4">Agrega tu moto para que nuestros mecánicos lleguen preparados</p>
            <button
              onClick={openCreate}
              className="px-5 py-2 bg-[var(--color-spm-red)] text-white text-sm font-bold rounded-xl hover:bg-[var(--color-spm-red-dark)] transition-all"
            >
              Registrar motocicleta
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {motos.map(moto => (
              <div key={moto.id} className={`${card} p-4`}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-spm-red)]/10 flex items-center justify-center flex-shrink-0">
                    <Bike size={22} className="text-[var(--color-spm-red)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-display font-bold text-base ${isDark ? "text-white" : "text-slate-900"}`}>
                      {moto.brand} {moto.model}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                        {moto.year}
                      </span>
                      {moto.tipoMoto && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                          {MOTO_TYPES[moto.tipoMoto] ?? moto.tipoMoto}
                        </span>
                      )}
                      {moto.cilindrada && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                          {moto.cilindrada}cc
                        </span>
                      )}
                      {moto.color && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                          {moto.color}
                        </span>
                      )}
                      {moto.placa && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono font-bold">
                          {moto.placa}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(moto)}
                      className={`p-2 rounded-lg transition-colors ${isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(moto.id)}
                      disabled={deleting === moto.id}
                      className={`p-2 rounded-lg transition-colors text-red-400 hover:text-red-300 ${isDark ? "hover:bg-red-950/30" : "hover:bg-red-50"} disabled:opacity-50`}
                    >
                      {deleting === moto.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Trash2 size={14} />
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Add/Edit form modal ─────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className={`relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden ${
            isDark ? "bg-slate-900" : "bg-white"
          }`}>
            {/* Modal header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? "border-white/5" : "border-gray-100"}`}>
              <h2 className={`font-display font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>
                {editId ? "Editar motocicleta" : "Nueva motocicleta"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-200 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Marca *
                  </label>
                  <select value={form.brand}
                    onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                    className={inputCls}>
                    <option value="">Seleccionar…</option>
                    {MOTO_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Modelo *
                  </label>
                  <input type="text" placeholder="CB500F, R3…" value={form.model}
                    onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                    className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Año *
                  </label>
                  <input type="number" min={1950} max={new Date().getFullYear() + 1}
                    value={form.year}
                    onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Cilindrada (cc)
                  </label>
                  <input type="number" placeholder="500" value={form.cilindrada}
                    onChange={e => setForm(f => ({ ...f, cilindrada: e.target.value }))}
                    className={inputCls} />
                </div>
              </div>

              <div>
                <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Tipo
                </label>
                <select value={form.tipoMoto}
                  onChange={e => setForm(f => ({ ...f, tipoMoto: e.target.value as MotoType }))}
                  className={inputCls}>
                  {Object.entries(MOTO_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Color
                  </label>
                  <input type="text" placeholder="Rojo, Negro…" value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className={`text-xs font-semibold block mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Placa
                  </label>
                  <input type="text" placeholder="ABC-1234" value={form.placa}
                    onChange={e => setForm(f => ({ ...f, placa: e.target.value }))}
                    className={`${inputCls} uppercase font-mono`} />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-[var(--color-spm-red)] hover:bg-[var(--color-spm-red-dark)] text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {editId ? "Guardar cambios" : "Registrar motocicleta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
