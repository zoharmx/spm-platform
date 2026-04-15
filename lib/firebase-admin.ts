import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

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
      // Vercel may store the private_key with literal \n instead of real newlines.
      // Normalize before parsing so JSON.parse + cert() work correctly.
      const normalized = serviceAccountKey.replace(/\\n/g, "\n");
      const serviceAccount = JSON.parse(normalized);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
    } catch (err) {
      console.error("[Admin] Failed to init with service account:", err);
      // Fallback to ADC
      adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
    }
  } else {
    // Application Default Credentials
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
