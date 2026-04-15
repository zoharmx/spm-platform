"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Minimize2,
} from "lucide-react";

import type { ChatMessage } from "@/types";
import Image from "next/image";

export default function ChatWidget() {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: t("chat_greeting"),
      timestamp: new Date(),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Show attention pulse after 5 seconds
    const timer = setTimeout(() => setShowPulse(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  async function sendMessage(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-8).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply ?? "Lo siento, ocurrió un error. Escríbenos al WhatsApp.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Error de conexión. Contáctanos por WhatsApp: +52 81 0000-0000",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const quickReplies = [
    "¿Cuánto cuesta una afinación?",
    "¿Qué zonas cubren?",
    "¿Cuánto tardan en llegar?",
    "Necesito revisar mis frenos",
  ];

  return (
    <>
      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <div
          className={`fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] rounded-3xl shadow-2xl overflow-hidden transition-all border ${
            isDark
              ? "bg-slate-900 border-white/10 shadow-black/50"
              : "bg-white border-gray-200 shadow-gray-200"
          }`}
          style={{ maxHeight: "80vh" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--color-spm-red)] to-[var(--color-spm-orange)] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9">
                <Image src="/images/logo.png" alt="SPM" fill className="object-contain rounded-full" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{t("chat_title")}</p>
                <p className="text-white/70 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  {t("chat_online")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <Minimize2 size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-72 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-[var(--color-spm-red)] to-[var(--color-spm-orange)]"
                      : isDark
                      ? "bg-slate-700"
                      : "bg-gray-200"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Bot size={14} className="text-white" />
                  ) : (
                    <User size={14} className={isDark ? "text-slate-300" : "text-gray-600"} />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[var(--color-spm-red)] text-white rounded-tr-sm"
                      : isDark
                      ? "bg-slate-800 text-slate-200 rounded-tl-sm"
                      : "bg-gray-100 text-slate-800 rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-spm-red)] to-[var(--color-spm-orange)] flex items-center justify-center">
                  <Bot size={14} className="text-white" />
                </div>
                <div className={`px-3 py-2.5 rounded-2xl rounded-tl-sm ${isDark ? "bg-slate-800" : "bg-gray-100"}`}>
                  <Loader2 size={16} className="animate-spin text-[var(--color-spm-red)]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length <= 2 && (
            <div className={`px-3 pb-2 flex flex-wrap gap-1.5 border-t ${isDark ? "border-white/5" : "border-gray-100"}`}>
              <p className={`w-full text-xs pt-2 pb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Preguntas frecuentes:
              </p>
              {quickReplies.map((qr) => (
                <button
                  key={qr}
                  onClick={() => sendMessage(qr)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all hover:border-[var(--color-spm-red)] hover:text-[var(--color-spm-red)] ${
                    isDark
                      ? "border-white/10 text-slate-400"
                      : "border-gray-200 text-slate-500"
                  }`}
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className={`px-3 pb-3 pt-2 border-t ${isDark ? "border-white/5" : "border-gray-100"}`}>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("chat_placeholder")}
                disabled={loading}
                className={`flex-1 px-3 py-2.5 rounded-xl text-sm border outline-none transition-all focus:ring-1 focus:ring-[var(--color-spm-red)]/40 focus:border-[var(--color-spm-red)] ${
                  isDark
                    ? "bg-slate-800 border-white/10 text-white placeholder:text-slate-600"
                    : "bg-gray-50 border-gray-200 text-slate-900 placeholder:text-slate-400"
                }`}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-[var(--color-spm-red)] hover:bg-[var(--color-spm-red-dark)] text-white rounded-xl flex items-center justify-center transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimized bar */}
      {isOpen && isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-24 right-4 sm:right-6 z-50 flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[var(--color-spm-red)] to-[var(--color-spm-orange)] text-white rounded-2xl shadow-xl"
        >
          <Bot size={16} />
          <span className="text-sm font-medium">{t("chat_title")}</span>
        </button>
      )}

      {/* FAB Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMinimized(false);
          setShowPulse(false);
        }}
        className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 bg-gradient-to-br from-[var(--color-spm-red)] to-[var(--color-spm-orange)] text-white rounded-full shadow-xl shadow-red-900/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}

        {/* Pulse ring */}
        {showPulse && !isOpen && (
          <>
            <span className="absolute w-full h-full rounded-full bg-[var(--color-spm-red)] animate-ping opacity-30" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white text-[8px] font-bold flex items-center justify-center text-white">
              1
            </span>
          </>
        )}
      </button>
    </>
  );
}
