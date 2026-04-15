"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseAuth, getDb } from "@/lib/firebase";
import type { SPMUser, UserRole } from "@/types";

interface AuthContextValue {
  user: SPMUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (minimum: UserRole) => boolean;
}

const ROLE_WEIGHTS: Record<UserRole, number> = {
  viewer: 1,
  mecanico: 2,
  operador: 3,
  manager: 4,
  admin: 5,
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Sets a client-accessible cookie that the middleware uses as an auth presence
 * indicator. This is a fallback for when Firebase Admin SDK session cookie
 * creation fails (e.g. FIREBASE_SERVICE_ACCOUNT_KEY not configured in Vercel).
 *
 * Security: the real auth checks happen in each protected page via useAuth().
 * The middleware only uses this cookie for the UX redirect (avoid flashing
 * protected pages to unauthenticated users). It is NOT a security boundary.
 */
function setAuthPresenceCookie(uid: string) {
  // Expires in 24 h — matches Firebase ID token refresh cycle
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `__auth=${encodeURIComponent(uid)}; path=/; expires=${expires}; SameSite=Lax`;
}

function clearAuthPresenceCookie() {
  document.cookie = "__auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
}

/**
 * Attempts to create a server-side HttpOnly session cookie via Firebase Admin.
 * Falls back silently — the app works via __auth presence cookie if this fails.
 */
async function syncSessionCookie(fbUser: FirebaseUser): Promise<void> {
  try {
    const idToken = await fbUser.getIdToken();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      console.warn(`[Auth] Session cookie endpoint returned ${res.status} — using fallback cookie`);
    }
  } catch (err) {
    console.warn("[Auth] Session cookie sync failed — using fallback cookie:", err);
  }
}

async function clearSessionCookie(): Promise<void> {
  try {
    await fetch("/api/auth/session", { method: "DELETE" });
  } catch {
    // Best-effort cleanup
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SPMUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Set the presence cookie FIRST so the middleware sees it immediately
        setAuthPresenceCookie(fbUser.uid);
        // Try to upgrade to HttpOnly Admin session cookie (best-effort)
        await syncSessionCookie(fbUser);
        const spmUser = await fetchOrCreateUser(fbUser);
        setUser(spmUser);
      } else {
        clearAuthPresenceCookie();
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function fetchOrCreateUser(fbUser: FirebaseUser): Promise<SPMUser> {
    const db = getDb();
    const ref = doc(db, "users", fbUser.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      await setDoc(ref, { lastLogin: serverTimestamp() }, { merge: true });
      return { id: snap.id, ...data } as SPMUser;
    }

    const newUser: Omit<SPMUser, "id"> = {
      uid: fbUser.uid,
      email: fbUser.email ?? "",
      displayName: fbUser.displayName ?? fbUser.email ?? "Usuario",
      role: "viewer",
      photoURL: fbUser.photoURL ?? undefined,
      isActive: true,
    };

    await setDoc(ref, {
      ...newUser,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });

    return { id: fbUser.uid, ...newUser };
  }

  async function signIn(email: string, password: string) {
    const auth = getFirebaseAuth();
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signInWithGoogle() {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
  }

  async function signOut() {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
    clearAuthPresenceCookie();
    await clearSessionCookie();
    setUser(null);
    setFirebaseUser(null);
  }

  function hasRole(minimum: UserRole): boolean {
    if (!user) return false;
    return ROLE_WEIGHTS[user.role] >= ROLE_WEIGHTS[minimum];
  }

  return (
    <AuthContext.Provider
      value={{ user, firebaseUser, loading, signIn, signInWithGoogle, signOut, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
