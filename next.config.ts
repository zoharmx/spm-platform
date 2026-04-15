import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// ── Content-Security-Policy ────────────────────────────────────────────────
// Adjust sources as the project grows (e.g. add CDN hostnames to script-src).
const cspDirectives = [
  "default-src 'self'",
  // Scripts: self + inline scripts Next.js needs + Google APIs for Firebase/Auth
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://accounts.google.com",
  // Styles: self + inline (Next.js injects styles)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts
  "font-src 'self' https://fonts.gstatic.com",
  // Images: self + data URIs + Firebase Storage + Google avatars
  "img-src 'self' data: blob: https://storage.googleapis.com https://lh3.googleusercontent.com https://firebasestorage.googleapis.com",
  // Connections: self + Firebase + Gemini + Google Auth
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://generativelanguage.googleapis.com https://*.firebaseapp.com https://*.firebase.com",
  // Frames: Google accounts popup for OAuth + Firebase Auth domain
  "frame-src https://accounts.google.com https://*.firebaseapp.com https://*.firebase.com",
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
