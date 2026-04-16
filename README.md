# SanPedroMotoCare — Plataforma Unificada

> Mecánicos certificados a domicilio en San Pedro Garza García y área metropolitana de Monterrey.

**Producción:** https://spm-platform.vercel.app  
**Repositorio:** https://github.com/zoharmx/spm-platform  
**Stack:** Next.js 16 · TypeScript · Tailwind CSS v4 · Firebase · Gemini AI · Stripe · Twilio · Vercel

---

## Módulos

| URL | Módulo | Audiencia |
|-----|--------|-----------|
| `/` | Landing Page | Público |
| `/tracking` | Rastreo SPM-XXXX | Público |
| `/cotizar` | Cotizador | Público |
| `/portal` | Portal Cliente | Clientes (auth) |
| `/mecanico` | App de campo | Mecánicos (auth) |
| `/crm/dashboard` | Dashboard CRM | Operadores+ |
| `/crm/contact-center` | Contact Center | Operadores+ |
| `/login` | Autenticación (Email + Google) | Todos |

---

## Capacidades principales

- **Cotización en línea** — formulario público que genera ticket `SPM-XXXX` automáticamente
- **Rastreo en tiempo real** — GPS del mecánico vía Firebase Realtime Database
- **Chatbot IA** — atención al cliente 24/7 con Google Gemini
- **Pagos en línea** — Stripe Payment Links + webhooks
- **Notificaciones push** — FCM para cambios de estado del ticket
- **Call center** — llamadas salientes con Twilio (voz + WhatsApp)
- **CRM completo** — tickets, clientes, mecánicos, facturas, reportes
- **PWA** — instalable en móvil con shortcuts nativos
- **Bilingüe** — Español / English (285+ strings traducidos)
- **Dark mode** — predeterminado, con toggle usuario

---

## Setup local

```bash
git clone https://github.com/zoharmx/spm-platform.git
cd spm-platform
npm install
cp .env.example .env.local   # completar credenciales
npm run dev
```

Requiere Node.js 20+.

---

## Deploy

```bash
vercel --prod
```

Las variables de entorno se configuran como `Encrypted` en el dashboard de Vercel. Ver `.env.example` para la lista completa.

---

## Variables de entorno requeridas

```
# Firebase (cliente)
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_DATABASE_URL
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
NEXT_PUBLIC_FIREBASE_VAPID_KEY

# Firebase Admin (server-side)
FIREBASE_SERVICE_ACCOUNT_KEY   # JSON completo de la service account

# Google Gemini (server-side)
GEMINI_API_KEY

# Stripe (server-side)
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

# Twilio (server-side)
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER

# App
NEXT_PUBLIC_APP_URL
```

---

## Documentación técnica

Ver [TECHNICAL.md](./TECHNICAL.md) para:
- Arquitectura detallada y route groups
- Modelo de datos Firebase (Firestore + Realtime DB)
- Flujo de autenticación y RBAC
- Especificación de todas las API Routes
- Integraciones externas (Stripe, Twilio, Gemini, FCM)
- Design system (Tailwind v4, dark mode, i18n)
- Guía de seguridad implementada

---

## Seguridad

- CSP headers completos (script, style, img, connect, frame)
- Rate limiting en todas las API Routes
- HttpOnly session cookie via Firebase Admin SDK
- Validación y sanitización de inputs en server-side
- Webhooks de Stripe verificados con firma HMAC
- Firebase Admin SDK exclusivamente en API Routes
- Firestore Security Rules activas
- HSTS en producción

---

2026 SanPedroMotoCare. Todos los derechos reservados.
