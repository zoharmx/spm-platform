import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// ── Content-Security-Policy ────────────────────────────────────────────────
// Adjust sources as the project grows (e.g. add CDN hostnames to script-src).
const cspDirectives = [
  "default-src 'self'",
  // Scripts: self + inline + Google APIs + Stripe.js (payment forms)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://accounts.google.com https://js.stripe.com",
  // Styles: self + inline (Next.js injects styles)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts
  "font-src 'self' https://fonts.gstatic.com",
  // Images: self + data URIs + Firebase Storage + Google avatars
  "img-src 'self' data: blob: https://storage.googleapis.com https://lh3.googleusercontent.com https://firebasestorage.googleapis.com",
  // Connections: self + Firebase + Gemini + Google Auth + Google APIs + Stripe
  "connect-src 'self' https://*.googleapis.com https://apis.google.com https://accounts.google.com https://*.firebaseio.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://generativelanguage.googleapis.com https://*.firebaseapp.com https://*.firebase.com https://api.stripe.com https://hooks.stripe.com",
  // Frames: Google Auth + Firebase Auth + Stripe Checkout iframes
  "frame-src https://accounts.google.com https://*.firebaseapp.com https://*.firebase.com https://js.stripe.com https://hooks.stripe.com",
  // Everything else: block
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Required for Firebase Auth signInWithPopup: allows the popup window
  // (accounts.google.com) to post back the auth result to the opener.
  // Without this, Chrome blocks window.closed polling and cancellation detection.
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  {
    key: "Content-Security-Policy",
    value: cspDirectives,
  },
  // HSTS only in production to avoid breaking local dev
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

// Firebase Auth domain used to proxy /__/auth/* routes
// When authDomain is a custom domain (not project.firebaseapp.com), Firebase Auth's
// popup/iframe handler lives at /__/auth/. Without this proxy the browser gets 404
// because Next.js doesn't serve those paths.
const firebaseAuthDomain =
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  reactStrictMode: true,
  async rewrites() {
    if (!firebaseAuthDomain) return [];
    // Proxy Firebase Auth handler + iframe to the authoritative Firebase domain.
    // Required when authDomain is a custom domain so that signInWithPopup /
    // signInWithRedirect can load /__/auth/handler and /__/auth/iframe.
    return [
      {
        source: "/__/auth/:path*",
        destination: `https://${firebaseAuthDomain}/__/auth/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
