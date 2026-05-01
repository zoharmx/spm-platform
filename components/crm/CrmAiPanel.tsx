"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot, X, Mic, MicOff, Send, Volume2, VolumeX, Loader2, ChevronRight,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import type { ChatMessage } from "@/types";

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly error: string;
}
interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
interface ISpeechRecognitionCtor {
  new (): ISpeechRecognition;
}

const QUICK_PROMPTS = [
  "Dame el resumen completo de la operación de hoy",
  "¿Qué productos tienen stock bajo o están agotados?",
  "¿Hay tickets sin mecánico asignado?",
  "¿Cuánto se ha facturado este mes y cómo se distribuye por método de pago?",
  "Dame el valor total del inventario y los productos más valiosos",
  "Lista los tickets activos más urgentes",
  "¿Qué mecánicos están disponibles ahora?",
  "¿Qué productos de la tienda son compatibles con DIMORA?",
];

interface Props {
  onClose: () => void;
}

export default function CrmAiPanel({ onClose }: Props) {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [micError, setMicError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const speak = useCallback(
    (text: string) => {
      if (!ttsEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();

      const clean = text
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/^[•\-]\s/gm, "")
        .replace(/#+\s/g, "");

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = "es-MX";
      utterance.rate = 1.1;

      const voices = window.speechSynthesis.getVoices();
      const esVoice = voices.find((v) => v.lang.startsWith("es") && !v.localService);
      if (esVoice) utterance.voice = esVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [ttsEnabled]
  );

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const res = await fetch("/api/crm/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history: messages
              .slice(-8)
              .map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Error desconocido" }));
          throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
        }

        const { reply } = await res.json();
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: reply || "Sin respuesta.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        speak(reply);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Error: ${err instanceof Error ? err.message : "No se pudo conectar con el asistente."}`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, speak]
  );

  const toggleMic = useCallback(() => {
    if (isMicActive) {
      recognitionRef.current?.stop();
      setIsMicActive(false);
      return;
    }

    setMicError("");

    const SpeechRec: ISpeechRecognitionCtor | undefined =
      typeof window !== "undefined"
        ? ((window as unknown as { SpeechRecognition?: ISpeechRecognitionCtor }).SpeechRecognition ??
            (window as unknown as { webkitSpeechRecognition?: ISpeechRecognitionCtor })
              .webkitSpeechRecognition)
        : undefined;

    if (!SpeechRec) {
      setMicError("Micrófono no disponible en este navegador");
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = "es-MX";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      if (transcript) sendMessage(transcript);
    };

    recognition.onerror = (e: SpeechRecognitionEvent) => {
      if (e.error !== "aborted") setMicError(`Error de micrófono: ${e.error}`);
      setIsMicActive(false);
    };

    recognition.onend = () => setIsMicActive(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsMicActive(true);
  }, [isMicActive, sendMessage]);

  return (
    <div
      className={`fixed inset-y-0 right-0 w-96 z-50 flex flex-col shadow-2xl border-l ${
        isDark ? "bg-slate-900 border-white/10" : "bg-white border-gray-200"
      }`}
    >
      {/* ── Header ───────────────────────────────────────────────── */}
      <div
        className={`flex items-center gap-3 px-4 py-3 border-b flex-shrink-0 ${
          isDark ? "border-white/10" : "border-gray-200"
        }`}
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-spm-red)] to-orange-500 flex items-center justify-center flex-shrink-0">
          <Bot size={15} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Asistente IA SPM
          </p>
          <p className="text-xs text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            Tickets · Inventario · Pagos · CRM
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => {
              setTtsEnabled((v) => !v);
              if (isSpeaking) stopSpeaking();
            }}
            title={ttsEnabled ? "Silenciar voz" : "Activar voz"}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark
                ? "hover:bg-white/10 text-slate-400"
                : "hover:bg-gray-100 text-slate-500"
            }`}
          >
            {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark
                ? "hover:bg-white/10 text-slate-400"
                : "hover:bg-gray-100 text-slate-500"
            }`}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Quick prompts shown only when no messages */}
        {messages.length === 0 && (
          <div className="space-y-2">
            <p
              className={`text-xs font-semibold uppercase tracking-wide mb-3 ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Consultas rápidas
            </p>
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                disabled={isLoading}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all disabled:opacity-50 ${
                  isDark
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    : "bg-gray-50 hover:bg-gray-100 text-slate-700 border border-gray-200"
                }`}
              >
                <ChevronRight
                  size={13}
                  className="text-[var(--color-spm-red)] flex-shrink-0"
                />
                {prompt}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-[var(--color-spm-red)] text-white rounded-tr-sm"
                  : isDark
                  ? "bg-slate-800 text-slate-100 rounded-tl-sm"
                  : "bg-gray-100 text-slate-800 rounded-tl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div
              className={`rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex items-center gap-2 ${
                isDark ? "bg-slate-800" : "bg-gray-100"
              }`}
            >
              <Loader2
                size={13}
                className="animate-spin text-[var(--color-spm-red)]"
              />
              <span
                className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Consultando Firestore...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ────────────────────────────────────────────────── */}
      <div
        className={`p-3 border-t flex-shrink-0 ${
          isDark ? "border-white/10" : "border-gray-200"
        }`}
      >
        {micError && (
          <p className="text-red-400 text-xs mb-2 px-1">{micError}</p>
        )}
        {isSpeaking && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <Volume2
              size={11}
              className="text-[var(--color-spm-red)] animate-pulse"
            />
            <span className="text-xs text-[var(--color-spm-red)]">
              Reproduciendo respuesta
            </span>
            <button
              onClick={stopSpeaking}
              className={`text-xs underline ml-auto ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Detener
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isMicActive ? "Escuchando..." : "Pregunta sobre la operación..."
            }
            disabled={isLoading}
            className={`flex-1 px-3 py-2 rounded-xl text-sm outline-none transition-all border ${
              isDark
                ? "bg-slate-800 border-white/10 text-white placeholder:text-slate-600 focus:border-[var(--color-spm-red)]/50"
                : "bg-gray-50 border-gray-200 text-slate-900 placeholder:text-slate-400 focus:border-[var(--color-spm-red)]/50"
            }`}
          />
          <button
            type="button"
            onClick={toggleMic}
            className={`p-2 rounded-xl transition-all flex-shrink-0 ${
              isMicActive
                ? "bg-red-500 text-white animate-pulse"
                : isDark
                ? "bg-slate-800 text-slate-400 hover:bg-slate-700"
                : "bg-gray-100 text-slate-500 hover:bg-gray-200"
            }`}
          >
            {isMicActive ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-xl bg-[var(--color-spm-red)] text-white hover:bg-[var(--color-spm-red-dark)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send size={15} />
          </button>
        </form>
        <p
          className={`text-xs text-center mt-2 ${
            isDark ? "text-slate-700" : "text-slate-400"
          }`}
        >
          Tickets · Inventario · Clientes · Pagos · Proveedores · Mistral AI
        </p>
      </div>
    </div>
  );
}
