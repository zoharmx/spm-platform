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
| `/login` | Autenticación | Todos |

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
2026 SanPedroMotoCare. Todos los derechos reservados.
