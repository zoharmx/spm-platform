/**
 * Firebase Cloud Messaging (FCM) push notification helper.
 *
 * Requirements:
 *   FIREBASE_SERVICE_ACCOUNT_KEY    — Already configured (Admin SDK)
 *   NEXT_PUBLIC_FIREBASE_VAPID_KEY  — Web Push VAPID public key
 *
 * VAPID key setup:
 *   Firebase Console → Project Settings → Cloud Messaging
 *   → Web Push certificates → Generate key pair → copy the public key
 *
 * Client-side flow (handled in NotificationPermission component):
 *   1. Call Notification.requestPermission()
 *   2. Get FCM token via getToken(messaging, { vapidKey })
 *   3. Save token to Firestore users/{uid}.fcmToken
 *   4. When token refreshes, onTokenRefresh() updates Firestore
 */

import { getAdminAuth, getAdminMessaging } from "@/lib/firebase-admin";

export interface PushPayload {
  token: string;
  title: string;
  body: string;
  icon?: string;
  clickUrl?: string;
  data?: Record<string, string>;
}

export interface PushResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a push notification to a single FCM token.
 */
export async function sendPush(payload: PushPayload): Promise<PushResult> {
  try {
    getAdminAuth(); // ensure Admin SDK is initialized
    const messaging = getAdminMessaging();
    const messageId = await messaging.send({
      token: payload.token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      webpush: {
        notification: {
          icon:   payload.icon    ?? "/icons/icon-192.png",
          badge:  "/icons/icon-192.png",
          vibrate: [200, 100, 200],
          requireInteraction: false,
        },
        fcmOptions: {
          link: payload.clickUrl ?? "/portal",
        },
      },
      data: payload.data,
    });

    console.info(`[FCM] Sent | messageId: ${messageId}`);
    return { success: true, messageId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    // Token expired/invalid — caller should remove it from Firestore
    if (msg.includes("registration-token-not-registered") || msg.includes("invalid-registration-token")) {
      console.warn(`[FCM] Invalid token — should be removed: ${msg}`);
      return { success: false, error: "invalid_token" };
    }

    console.error(`[FCM] Failed: ${msg}`);
    return { success: false, error: msg };
  }
}

/**
 * Send push to multiple tokens (fan-out).
 * Returns count of successful sends.
 */
export async function sendPushMulti(tokens: string[], payload: Omit<PushPayload, "token">): Promise<number> {
  if (tokens.length === 0) return 0;
  const results = await Promise.allSettled(
    tokens.map(token => sendPush({ ...payload, token }))
  );
  return results.filter(r => r.status === "fulfilled" && r.value.success).length;
}
