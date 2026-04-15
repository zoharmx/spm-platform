"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
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
  redirectError: string | null;
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

function setAuthPresenceCookie(uid: string) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `__auth=${encodeURIComponent(uid)}; path=/; expires=${expires}; SameSite=Lax`;
}

function clearAuthPresenceCookie() {
  document.cookie = "__auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
}

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
    // best-effort
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SPMUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();

    // Capture errors from the Google redirect flow (e.g. auth/unauthorized-domain)
    // getRedirectResult resolves to null when there was no redirect — not an error
    getRedirectResult(auth).catch((err: { code?: string }) => {
      const code = err?.code ?? "auth/unknown";
      if (code !== "auth/no-auth-event") {
        setRedirectError(code);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setAuthPresenceCookie(fbUser.uid);
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

  /**
   * Inicia el flujo de Google con redirect (sin popup ni iframe).
   * Compatible con Edge, Safari, móvil y cualquier política de seguridad.
   * La respuesta se recibe en onAuthStateChanged cuando el navegador vuelve.
   */
  async function signInWithGoogle() {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    // signInWithRedirect navega fuera de la app — no hace falta await
    await signInWithRedirect(auth, provider);
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
      value={{ user, firebaseUser, loading, redirectError, signIn, signInWithGoogle, signOut, hasRole }}
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
