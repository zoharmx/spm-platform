# SanPedroMotoCare — Plataforma Unificada

Plataforma de primer nivel para SanPedroMotoCare: mecánicos a domicilio en San Pedro Garza García y área metropolitana de Monterrey.

## Módulos

| URL | Módulo | Audiencia |
|-----|--------|-----------|
| `/` | Landing Page | Público |
| `/tracking` | Rastreo en tiempo real | Clientes |
| `/cotizar` | Cotizador gratis | Clientes |
| `/portal` | Portal del Cliente | Clientes (auth) |
| `/crm/dashboard` | Dashboard CRM | Operadores / Admin |
| `/crm/contact-center` | Contact Center | Operadores |
| `/login` | Autenticación | Todos |

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **Firebase** (Firestore + Auth + Realtime DB)
- **Google Gemini AI** (chatbot)
- **Vercel** (hosting)
- **PWA** (manifest + install prompt)

## Features

- Dark/light mode toggle
- Español / English
- PWA con install prompt
- Chatbot Gemini AI
- Tracking en tiempo real (SPM-XXXX)
- Cotizador integrado
- RBAC 5 roles (admin, manager, operador, mecanico, viewer)

## Setup

```bash
cp .env.example .env.local
# Configurar credenciales Firebase + Gemini API Key
npm install
npm run dev
```

## Deploy en Vercel

```bash
vercel --prod
```

Ver `.env.example` para todas las variables requeridas.

---
2026 SanPedroMotoCare. Todos los derechos reservados.
