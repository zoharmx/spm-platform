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
 * Creates a server-side HttpOnly session cookie via the /api/auth/session endpoint.
 * This is called after every successful Firebase authentication.
 */
async function syncSessionCookie(fbUser: FirebaseUser): Promise<void> {
  try {
    const idToken = await fbUser.getIdToken();
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
  } catch (err) {
    console.error("Failed to sync session cookie:", err);
  }
}

/**
 * Clears the server-side session cookie via the /api/auth/session endpoint.
 */
async function clearSessionCookie(): Promise<void> {
  try {
    await fetch("/api/auth/session", { method: "DELETE" });
  } catch (err) {
    console.error("Failed to clear session cookie:", err);
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
        // Sync HttpOnly session cookie on every auth state change
        await syncSessionCookie(fbUser);
        const spmUser = await fetchOrCreateUser(fbUser);
        setUser(spmUser);
      } else {
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
      // Update last login
      await setDoc(ref, { lastLogin: serverTimestamp() }, { merge: true });
      return { id: snap.id, ...data } as SPMUser;
    }

    // Create new user record
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
    // onAuthStateChanged will handle syncSessionCookie automatically
  }

  async function signInWithGoogle() {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    // onAuthStateChanged will handle syncSessionCookie automatically
  }

  async function signOut() {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
    // Clear the HttpOnly session cookie server-side
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
