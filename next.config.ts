import type { NextConfig } from "next";

// Content-Security-Policy
// - 'unsafe-inline' / 'unsafe-eval' needed by Next.js runtime & Tailwind CSS
// - Tighten gradually in production once nonces/hashes are wired up
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://storage.googleapis.com https://lh3.googleusercontent.com https://firebasestorage.googleapis.com",
  "font-src 'self'",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://generativelanguage.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },

          // Block framing (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },

          // Legacy XSS filter for older browsers
          { key: "X-XSS-Protection", value: "1; mode=block" },

          // Limit referrer information
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // Restrict browser feature APIs
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },

          // Content Security Policy
          { key: "Content-Security-Policy", value: CSP },

          // HSTS — enforce HTTPS for 1 year (only send in production)
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
