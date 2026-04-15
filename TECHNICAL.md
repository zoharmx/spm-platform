# Documentación Técnica — SanPedroMotoCare Platform

**Versión:** 1.0.0  
**Fecha:** Abril 2026  
**Producción:** https://spm-platform.vercel.app  
**Repositorio:** https://github.com/zoharmx/spm-platform

---

## 1. Visión general de la arquitectura

### Del caos a la plataforma unificada

Antes de esta plataforma, SPM operaba con tres sistemas desconectados:

```
ANTES                                  AHORA
─────────────────────────────────      ───────────────────────────────────────
sanpedromotocare.web.app               spm-platform.vercel.app/
 └─ PWA vanilla HTML5 (tracking)        ├── /              (landing)
                                        ├── /tracking      (tracking)
spm-crm-three.vercel.app               ├── /cotizar       (cotizador)
 ├── /              (landing)           ├── /portal        (cliente)
 └── /dashboard     (CRM)              ├── /crm/dashboard  (operadores)
                                        └── /crm/contact-center
render.com (FastAPI)                   
 └── SPM-Voice      (call center)      Firebase ←── fuente única de datos
```

### Principios de diseño

1. **Un solo dominio** — toda la audiencia entra por `spm-platform.vercel.app`
2. **Un solo repositorio** — monolito bien organizado con route groups de Next.js
3. **Una sola fuente de verdad** — Firebase como backend (Firestore + Realtime DB + Auth)
4. **Separación por audiencia** — route groups `(public)`, `(portal)`, `(crm)`, `(field)`
5. **Sin secretos hardcodeados** — 100% variables de entorno

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión | Razón |
|------|-----------|---------|-------|
| Framework | Next.js | 16.2.3 | App Router, SSR/SSG, API Routes |
| Lenguaje | TypeScript | 5.x | Tipos en toda la base de código |
| Estilos | Tailwind CSS | 4.x | CSS-first config con `@theme` |
| UI Components | Lucide React | 1.x | Iconos consistentes |
| Animaciones | Framer Motion | 12.x | Animaciones fluidas |
| Forms | React Hook Form | 7.x | Validación declarativa |
| Database | Firebase Firestore | 12.x | NoSQL en tiempo real |
| Realtime | Firebase Realtime DB | 12.x | GPS tracking del mecánico |
| Auth | Firebase Authentication | 12.x | Google OAuth + email |
| AI Chatbot | Google Gemini | gemini-2.0-flash-exp | Atención al cliente |
| AI secundario | Mistral AI | — | CRM assistant |
| Charts | Recharts | 3.x | Dashboard analytics |
| Hosting | Vercel | — | Edge network, CI/CD automático |
| PWA | Web App Manifest | — | Install prompt nativo |

---

## 3. Estructura del proyecto

```
spm-platform/
├── app/                         Next.js App Router
│   ├── (public)/                Rutas públicas (sin auth)
│   │   ├── page.tsx             Landing page principal
│   │   ├── tracking/page.tsx    /tracking
│   │   └── cotizar/page.tsx     /cotizar
│   ├── (auth)/
│   │   └── login/page.tsx       /login
│   ├── (portal)/                Auth: viewer+
│   │   └── portal/
│   │       ├── page.tsx         /portal
│   │       ├── servicios/       /portal/servicios
│   │       ├── pagar/           /portal/pagar
│   │       └── moto/            /portal/moto
│   ├── (field)/                 Auth: rol mecanico
│   │   └── mecanico/
│   ├── (crm)/                   Auth: operador+
│   │   └── crm/
│   │       ├── dashboard/
│   │       ├── tickets/
│   │       ├── clientes/
│   │       ├── mecanicos/
│   │       ├── facturas/
│   │       ├── contact-center/
│   │       ├── reportes/
│   │       └── configuracion/
│   ├── api/
│   │   ├── chat/route.ts        POST — Gemini chatbot
│   │   ├── quotes/route.ts      POST — Crear lead + ticket
│   │   └── tracking/
│   │       └── [ticketId]/      GET — Estado público de ticket
│   ├── layout.tsx               Root layout + providers
│   └── globals.css              Design system (Tailwind v4)
│
├── components/
│   ├── landing/
│   │   ├── Navbar.tsx           Navegación sticky con theme/lang toggles
│   │   ├── HeroSection.tsx      Video bg + stats animados
│   │   ├── ServicesSection.tsx  Grid de 8 servicios + imágenes de mecánicos
│   │   ├── TrackingSection.tsx  Widget de rastreo por SPM-XXXX
│   │   ├── QuoteSection.tsx     Formulario de cotización
│   │   ├── ContactSection.tsx   Canales de contacto + mapa
│   │   ├── Footer.tsx           Footer con logo SPM1
│   │   └── PWAInstallBanner.tsx Banner de instalación PWA
│   ├── chatbot/
│   │   └── ChatWidget.tsx       Widget flotante Gemini
│   ├── crm/                     Componentes del CRM (en desarrollo)
│   ├── portal/                  Componentes del portal (en desarrollo)
│   └── ui/                      Componentes genéricos reutilizables
│
├── contexts/
│   ├── AuthContext.tsx          Firebase Auth + RBAC
│   ├── ThemeContext.tsx         Dark/light mode
│   └── LanguageContext.tsx      i18n ES/EN (285+ strings)
│
├── lib/
│   ├── firebase.ts              Client SDK singleton
│   ├── firebase-admin.ts        Admin SDK lazy init
│   └── firestore/               CRUD helpers por colección
│
├── types/
│   └── index.ts                 Todos los tipos TypeScript
│
├── public/
│   ├── images/                  Assets de marca
│   ├── videos/hero-bg.mp4       Video hero section
│   ├── icons/                   PWA icons
│   ├── favicon.png              Logo SPM como favicon
│   └── manifest.json            PWA Web App Manifest
│
├── proxy.ts                     Route protection (Next.js 16)
├── next.config.ts               Configuración de Next.js
├── .env.example                 Plantilla de variables de entorno
└── package.json
```

---

## 4. Sistema de autenticación y autorización

### Flujo completo

```
Usuario → /login
    │
    ├── Google OAuth (signInWithPopup)
    │       └── Firebase Auth crea/autentica usuario
    │
    └── Email + Password (signInWithEmailAndPassword)
            └── Firebase Auth autentica usuario
                    │
                    ▼
            AuthContext.fetchOrCreateUser(fbUser)
                    │
                    ├── Busca doc en Firestore: users/{uid}
                    │
                    ├── [Existe] → Actualiza lastLogin, devuelve SPMUser
                    │
                    └── [No existe] → Crea con role: "viewer", devuelve SPMUser
                                │
                                ▼
                        Redirect según rol:
                        - mecanico  → /mecanico
                        - viewer    → /portal
                        - operador+ → /crm/dashboard
```

### Jerarquía de roles

```typescript
const ROLE_WEIGHTS = {
  viewer:   1,
  mecanico: 2,
  operador: 3,
  manager:  4,
  admin:    5,
}

// hasRole("operador") → true si el usuario es operador, manager o admin
function hasRole(minimum: UserRole): boolean {
  return ROLE_WEIGHTS[user.role] >= ROLE_WEIGHTS[minimum];
}
```

### Route protection

`proxy.ts` (Next.js 16) revisa la cookie `__session` de Firebase para redirigir:
- Rutas protegidas sin sesión → `/login?from=<ruta>`
- Usuarios autenticados en `/login` → `/portal`

La validación de rol completa ocurre en el cliente (`AuthContext`) y en los componentes de página.

---

## 5. Firebase — modelo de datos

### Colección `service_tickets`

```typescript
interface ServiceTicket {
  id: string                    // Firestore doc ID
  ticketId: string              // SPM-0001 (display ID)
  status: ServiceTicketStatus   // Ver estados abajo
  clientId?: string             // Ref a clients/
  clientName: string
  clientPhone: string
  clientEmail?: string
  mechanicId?: string           // Ref a mechanics/
  mechanicName?: string
  mechanicPhone?: string
  serviceType: ServiceType
  serviceDescription: string
  diagnosis?: string
  workDone?: string
  serviceAddress: Address
  estimatedCost?: number
  anticipo?: number
  finalCost?: number
  parts?: PartItem[]
  source: LeadSource
  statusHistory: TicketEvent[]
  rating?: number               // 1-5, del cliente
  photosBefore?: string[]       // URLs Firebase Storage
  photosAfter?: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
  completedAt?: Timestamp
}
```

### Estados del ticket (flujo lineal)

```
lead-recibido
    │
    ▼
diagnostico-pendiente
    │
    ▼
en-camino  ────→  (mecánico en ruta, GPS activo)
    │
    ▼
en-servicio ────→ (mecánico en sitio, trabajando)
    │
    ▼
completado
    │
    ▼
pagado

[cancelado] ─── puede ocurrir en cualquier estado
```

### Colección `users`

```typescript
interface SPMUser {
  id: string          // = uid de Firebase Auth
  uid: string
  email: string
  displayName: string
  role: UserRole
  phone?: string
  photoURL?: string
  mechanicId?: string // Si role === "mecanico"
  isActive: boolean
  lastLogin: Timestamp
  createdAt: Timestamp
}
```

### Colección `mechanics`

```typescript
interface Mechanic {
  id: string
  mechanicId: string          // MEC-001
  name: string
  phone?: string
  status: "disponible" | "en-servicio" | "descanso" | "inactivo"
  zona: string[]              // ["San Pedro", "Valle Oriente"]
  skills: ServiceType[]
  location?: {
    lat: number
    lng: number
    updatedAt: Timestamp
  }
  totalServicesCompleted: number
  averageRating?: number
}
```

---

## 6. API Routes

### POST /api/quotes

Recibe datos del formulario de cotización, crea un documento en `leads` y genera automáticamente un `service_ticket` con status `lead-recibido`.

**Autenticación:** Ninguna (pública).

**Validación:** Campos requeridos: `name`, `phone`, `address`, `serviceType`, `description`.

**ID de ticket:** Se genera contando los tickets existentes + 1, formateado como `SPM-XXXX`.

```
Request → Firestore
    ├── leads/{newId}           ← datos crudos del formulario
    └── service_tickets/{newId} ← ticket SPM-XXXX con status lead-recibido
```

### GET /api/tracking/[ticketId]

Consulta pública. Busca en `service_tickets` por el campo `ticketId` (no por doc ID).

**Campos que se exponen públicamente:**
- `ticketId`, `status`, `clientName`, `serviceType`
- `serviceAddress` (solo colonia y ciudad, no calle completa)
- `estimatedCost`
- `mechanicName` (siempre)
- `mechanicPhone` — **solo si status es `en-camino` o `en-servicio`**

### POST /api/chat

Proxy hacia Google Gemini con un system prompt especializado en SPM.

**Modelo:** `gemini-2.0-flash-exp`

**Context window:** Se envían los últimos 10 mensajes del historial.

**System prompt incluye:**
- Servicios disponibles y precios aproximados
- Zonas de cobertura
- Horarios de atención
- Proceso de cotización
- Instrucciones de idioma (responder igual que el usuario)

---

## 7. Design System

### Tailwind CSS v4 — configuración en CSS

A diferencia de versiones anteriores, Tailwind v4 no usa `tailwind.config.ts`. La configuración se hace en `globals.css` con directivas `@theme`:

```css
@import "tailwindcss";

@theme {
  --color-spm-red: #DC2626;
  --color-spm-orange: #F97316;
  --font-display: "Poppins", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
  --animate-fade-in-up: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}
```

### Dark mode

Se implementa con la clase `.dark` en el `<html>`. El tema se detecta de:
1. `localStorage.getItem("spm-theme")`
2. `prefers-color-scheme: dark` del sistema operativo

Para evitar flash of unstyled content (FOUC), hay un inline script en el `<head>` que aplica la clase antes de que React hidrate.

### Variables CSS semánticas

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #0f172a;
  --border-color: #e2e8f0;
}

.dark {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f1f5f9;
  --border-color: #334155;
}
```

---

## 8. Internacionalización (i18n)

La plataforma implementa un sistema de i18n manual (sin dependencias externas):

- **Idiomas:** Español (es-MX) y English
- **Persistencia:** `localStorage.getItem("spm-lang")`
- **Implementación:** `LanguageContext` con un objeto `translations` que contiene 285+ strings
- **Toggle:** Botón en la navbar (ES ↔ EN)

```typescript
// Uso en cualquier componente
const { t, lang, toggleLang } = useLanguage();
<h1>{t("hero_title")}</h1>
```

---

## 9. PWA

### manifest.json

```json
{
  "name": "SanPedroMotoCare — Mecánico a Domicilio",
  "short_name": "SPM Mecánico",
  "display": "standalone",
  "theme_color": "#DC2626",
  "background_color": "#0f172a",
  "shortcuts": [
    { "name": "Rastrear", "url": "/tracking" },
    { "name": "Cotizar", "url": "/cotizar" }
  ]
}
```

### Install Banner

`PWAInstallBanner.tsx` captura el evento `beforeinstallprompt` del navegador, lo cancela (para no mostrar el prompt nativo de inmediato) y después de 3 segundos muestra un banner elegante con:

- Logo SPM
- Texto: "Instala SanPedroMotoCare — Acceso rápido, funciona sin internet y recibe notificaciones"
- Botón: "Agregar a inicio" → llama a `deferredPrompt.prompt()`
- La preferencia "dismissar" se guarda en `localStorage` para no volver a mostrarlo

---

## 10. Chatbot Gemini

### Arquitectura

```
Cliente (ChatWidget.tsx)
    │
    ├── Mantiene historial de mensajes en estado local (useState)
    │
    └── POST /api/chat  ← mensaje + últimos 10 del historial
                │
                └── Google Generative AI SDK
                        │
                        └── gemini-2.0-flash-exp
                                │
                                └── system prompt SPM
                                        │
                                        └── Respuesta → cliente
```

### System Prompt (resumen)

El sistema prompt instruye al modelo a:
- Identificar el tipo de servicio que necesita el cliente
- Dar precios aproximados (con disclaimer de que son estimaciones)
- Informar sobre cobertura (San Pedro, MTY, Guadalupe, Apodaca, etc.)
- Horarios: Lun–Dom 7am–9pm, urgencias 24/7
- Tiempo de respuesta: 45 minutos promedio
- Formas de pago: efectivo, tarjeta, transferencia
- Responder en el idioma del usuario

---

## 11. Deploy y CI/CD

### Flujo actual

```
Desarrollador
    │
    └── git push origin master
            │
            └── GitHub → Vercel (integración automática)
                    │
                    ├── Build: next build (Turbopack)
                    ├── Región: Washington D.C. (iad1)
                    └── Deploy a producción en ~45 segundos
```

### Variables de entorno en Vercel

Todas las variables están configuradas como `Encrypted` en el scope `Production`. Para agregar nuevas:

```bash
vercel env add NUEVA_VARIABLE production
vercel env ls production   # Verificar
vercel --prod              # Redeploy para que las tome
```

### Rollback

```bash
vercel rollback            # Vuelve al deploy anterior
vercel ls                  # Lista todos los deploys
```

---

## 12. Seguridad

### Qué está protegido

| Recurso | Protección |
|---------|-----------|
| Variables de entorno | Encriptadas en Vercel, nunca en código |
| Firebase Admin SDK | Server-side únicamente (API Routes) |
| Rutas CRM | `proxy.ts` + validación de rol en cliente |
| API `/api/quotes` | Rate limit por IP (pendiente: Vercel WAF) |
| Firestore | Reglas de seguridad en `firestore.rules` |
| Tracking API | Solo expone datos públicos, teléfono del mecánico con restricción de estado |

### Pendientes de seguridad

- [ ] Rate limiting en `/api/chat` y `/api/quotes` (protección contra spam)
- [ ] CAPTCHA en el formulario de cotización (hCaptcha o Cloudflare Turnstile)
- [ ] Validación de webhook con `WEBHOOK_SECRET` en integraciones externas
- [ ] Content Security Policy (CSP) headers en `next.config.ts`
- [ ] Firebase App Check para prevenir uso no autorizado del SDK

---

## 13. Guía de contribución

### Agregar una nueva página al CRM

1. Crear el directorio: `app/(crm)/crm/nueva-seccion/`
2. Crear `page.tsx` con el componente de página
3. Agregar el link en `NAV_ITEMS` dentro de `app/(crm)/crm/dashboard/page.tsx`
4. Si requiere permisos especiales, agregar validación con `hasRole()`

### Agregar un nuevo idioma

1. Agregar el nuevo código de idioma al tipo `Lang` en `LanguageContext.tsx`
2. Crear el objeto de traducciones con todas las keys del idioma `es`
3. Agregar el nuevo idioma al objeto `translations`
4. El toggle en la navbar necesita actualizarse para ciclar entre más de 2 opciones

### Agregar una nueva colección a Firestore

1. Definir el tipo en `types/index.ts`
2. Crear el helper en `lib/firestore/nueva-coleccion.ts`
3. Agregar las reglas de seguridad en `firestore.rules`

---

## 14. Dependencias principales

```json
{
  "next": "16.2.3",
  "react": "19.2.4",
  "firebase": "12.12.0",
  "firebase-admin": "13.8.0",
  "@google/generative-ai": "0.24.1",
  "framer-motion": "12.38.0",
  "lucide-react": "1.8.0",
  "react-hook-form": "7.72.1",
  "react-hot-toast": "2.6.0",
  "react-intersection-observer": "10.0.3",
  "react-countup": "6.5.3",
  "recharts": "3.8.1",
  "tailwindcss": "4.x",
  "@tanstack/react-query": "5.99.0",
  "date-fns": "4.1.0"
}
```

---

## 15. Contacto y soporte

- **Email:** contacto@sanpedromotocare.mx
- **WhatsApp:** +52 81 0000-0000
- **GitHub Issues:** https://github.com/zoharmx/spm-platform/issues

---

*Documentación generada el 15 de abril de 2026. Versión 1.0.0*
