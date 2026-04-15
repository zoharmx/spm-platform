import type { Metadata, Viewport } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: {
    default: "SanPedroMotoCare — Mecánico a Domicilio",
    template: "%s | SanPedroMotoCare",
  },
  description:
    "Mecánicos certificados a domicilio en San Pedro Garza García y área metropolitana de Monterrey. Afinaciones, frenos, eléctricas y más.",
  keywords: [
    "mecánico a domicilio",
    "moto",
    "San Pedro Garza García",
    "Monterrey",
    "reparación moto",
    "mantenimiento motocicleta",
  ],
  authors: [{ name: "SanPedroMotoCare" }],
  creator: "SanPedroMotoCare",
  publisher: "SanPedroMotoCare",
  formatDetection: { telephone: true },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://sanpedromotocare.mx"),
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "/",
    siteName: "SanPedroMotoCare",
    title: "SanPedroMotoCare — Mecánico a Domicilio",
    description:
      "Mecánicos certificados a domicilio en San Pedro Garza García. Tu moto lista sin moverte.",
    images: [
      {
        url: "/images/logo.png",
        width: 1200,
        height: 630,
        alt: "SanPedroMotoCare Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SanPedroMotoCare — Mecánico a Domicilio",
    description: "Mecánicos certificados a domicilio en San Pedro Garza García.",
    images: ["/images/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${poppins.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('spm-theme');
                  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen font-[var(--font-body)] bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
