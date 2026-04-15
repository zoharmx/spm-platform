/**
 * set-admin.mjs
 * Sets role: "admin" for a user in Firestore by email.
 *
 * Usage:
 *   node scripts/set-admin.mjs hoymismofletes@gmail.com
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY env var OR run after:
 *   export GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json
 */
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/set-admin.mjs <email>");
  process.exit(1);
}

// Init Firebase Admin
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (getApps().length === 0) {
  if (serviceAccountKey) {
    initializeApp({ credential: cert(JSON.parse(serviceAccountKey)) });
  } else {
    initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  }
}

const auth  = getAuth();
const db    = getFirestore();

try {
  const userRecord = await auth.getUserByEmail(email);
  const uid = userRecord.uid;

  await db.collection("users").doc(uid).set({
    uid,
    email,
    displayName: userRecord.displayName ?? email,
    role: "admin",
    isActive: true,
    photoURL: userRecord.photoURL ?? null,
    updatedAt: new Date(),
  }, { merge: true });

  console.log(`✅ Role "admin" set for ${email} (uid: ${uid})`);
} catch (err) {
  console.error("❌ Error:", err.message);
  process.exit(1);
}
