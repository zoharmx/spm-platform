import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

let adminApp: App | null = null;

function initAdmin(): App {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      // The env var is stored as valid JSON where the private_key field
      // contains \n as the standard JSON string escape (backslash + n).
      // JSON.parse handles this correctly — DO NOT normalize beforehand:
      // replacing \n (2 chars) with an actual newline would produce invalid
      // JSON (unescaped newlines inside string values), breaking the parse.
      const serviceAccount = JSON.parse(serviceAccountKey);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
      console.info("[Admin] Initialized with service account key");
    } catch (err) {
      console.error("[Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", err);
      // Fallback — will work on GCP environments with ADC, NOT on Vercel
      adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
    }
  } else {
    console.warn("[Admin] FIREBASE_SERVICE_ACCOUNT_KEY not set — using ADC (Vercel will fail)");
    adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  }

  return adminApp;
}

export function getAdminDb(): Firestore {
  return getFirestore(initAdmin());
}

export function getAdminAuth(): Auth {
  return getAuth(initAdmin());
}

export function getAdminMessaging(): Messaging {
  return getMessaging(initAdmin());
}
