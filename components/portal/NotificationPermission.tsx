"use client";

/**
 * NotificationPermission — FCM push permission banner.
 *
 * Renders a subtle banner at the top of the portal asking the user
 * to enable push notifications. On consent:
 *   1. Registers the Firebase Messaging service worker
 *   2. Gets the FCM token using the VAPID key
 *   3. Saves the token to Firestore users/{uid}.fcmToken
 *
 * Requirements:
 *   NEXT_PUBLIC_FIREBASE_VAPID_KEY — Web Push VAPID public key
 *     (Firebase Console → Project Settings → Cloud Messaging
 *      → Web Push certificates → Generate key pair → public key)
 */

import { useState, useEffect } from "react";
import { Bell, X }             from "lucide-react";
import { useAuth }             from "@/contexts/AuthContext";
import { useTheme }            from "@/contexts/ThemeContext";
import { app as getFirebaseApp } from "@/lib/firebase";
import { doc, updateDoc }      from "firebase/firestore";
import { getDb }               from "@/lib/firebase";

const DISMISSED_KEY = "spm_notif_dismissed";

export default function NotificationPermission() {
  const { user }     = useAuth();
  const { isDark }   = useTheme();
  const [show, setShow]         = useState(false);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    // Only show if: browser supports notifications, user is logged in,
    // permission not yet granted, and user hasn't dismissed the banner
    if (
      typeof window === "undefined"           ||
      !("Notification" in window)             ||
      !("serviceWorker" in navigator)         ||
      Notification.permission === "granted"   ||
      Notification.permission === "denied"    ||
      !user                                   ||
      localStorage.getItem(DISMISSED_KEY)
    ) return;

    // Delay 3s so it doesn't appear on first render
    const t = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(t);
  }, [user]);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  }

  async function enableNotifications() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        dismiss();
        return;
      }

      // Register the dynamic service worker
      const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
        scope: "/",
      });

      // Lazy-import Firebase Messaging (client-side only)
      const { getMessaging, getToken } = await import("firebase/messaging");
      const app      = getFirebaseApp();
      const messaging = getMessaging(app);

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.warn("[FCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY not set — skipping token");
        setShow(false);
        return;
      }

      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: reg });

      if (token && user) {
        // Save token to Firestore
        const db  = getDb();
        const ref = doc(db, "users", user.uid);
        await updateDoc(ref, { fcmToken: token, fcmTokenUpdatedAt: new Date() });
        console.info("[FCM] Token saved:", token.slice(0, 20) + "...");
      }

      setShow(false);
    } catch (err) {
      console.error("[FCM] Enable notifications failed:", err);
      setShow(false);
    } finally {
      setLoading(false);
    }
  }

  if (!show) return null;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border mb-4 ${
      isDark
        ? "bg-blue-950/40 border-blue-500/20 text-blue-200"
        : "bg-blue-50 border-blue-200 text-blue-800"
    }`}>
      <Bell size={18} className="flex-shrink-0" />
      <p className="text-sm flex-1">
        <span className="font-semibold">Activa notificaciones</span> para recibir actualizaciones de tu servicio en tiempo real.
      </p>
      <button
        onClick={enableNotifications}
        disabled={loading}
        className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-60"
      >
        {loading ? "Activando…" : "Activar"}
      </button>
      <button onClick={dismiss} className="flex-shrink-0 opacity-60 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
}
