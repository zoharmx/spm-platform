# SanPedroMotoCare — Plataforma Unificada

> Mecánicos certificados a domicilio en San Pedro Garza García y área metropolitana de Monterrey.

**Producción:** https://spm-platform.vercel.app  
**Repositorio:** https://github.com/zoharmx/spm-platform  
**Stack:** Next.js 16 · TypeScript · Tailwind CSS v4 · Firebase · Gemini AI · Vercel

---

## Módulos

| URL | Módulo | Audiencia |
|-----|--------|-----------|
| `/` | Landing Page | Público |
| `/tracking` | Rastreo SPM-XXXX | Público |
| `/cotizar` | Cotizador | Público |
| `/portal` | Portal Cliente | Clientes (auth) |
| `/crm/dashboard` | Dashboard CRM | Operadores+ |
| `/crm/contact-center` | Contact Center | Operadores+ |
| `/login` | Autenticación (Email + Google) | Todos |

---

## Setup

```bash
git clone https://github.com/zoharmx/spm-platform.git
cd spm-platform
npm install
cp .env.example .env.local   # completar credenciales
npm run dev
```

## Deploy

```bash
vercel --prod
```

Ver `.env.example` para todas las variables requeridas.

---

## Variables de entorno requeridas

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_DATABASE_URL
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
FIREBASE_SERVICE_ACCOUNT_KEY   (JSON completo, server-side)
GEMINI_API_KEY                 (server-side, sin NEXT_PUBLIC_)
NEXT_PUBLIC_APP_URL
```

---

## Seguridad implementada

- CSP headers completos en `next.config.ts` (incluye dominios Firebase Auth para Google Sign-In)
- Rate limiting en todas las API routes (`/api/chat`, `/api/quotes`, `/api/tracking`)
- HttpOnly session cookie via Firebase Admin SDK
- Validación y sanitización de inputs en server-side
- Firebase Admin SDK exclusivamente en API Routes (server-side)
- Firestore Security Rules activas
- HSTS en producción

---

2026 SanPedroMotoCare. Todos los derechos reservados.
