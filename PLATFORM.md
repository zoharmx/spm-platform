# SanPedroMotoCare — Documento de Plataforma Tecnológica

**Versión:** 1.2.0  
**Fecha:** Abril 2026  
**Clasificación:** Confidencial — Uso interno y comercial  
**URL de producción:** https://spm-platform.vercel.app

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Propuesta de Valor](#2-propuesta-de-valor)
3. [Capacidades de la Plataforma](#3-capacidades-de-la-plataforma)
4. [Arquitectura Tecnológica](#4-arquitectura-tecnológica)
5. [Módulos del Sistema](#5-módulos-del-sistema)
6. [Integraciones Externas](#6-integraciones-externas)
7. [Seguridad y Cumplimiento](#7-seguridad-y-cumplimiento)
8. [Rendimiento y Escalabilidad](#8-rendimiento-y-escalabilidad)
9. [Modelo de Datos](#9-modelo-de-datos)
10. [Experiencia del Usuario](#10-experiencia-del-usuario)
11. [Indicadores Clave](#11-indicadores-clave)
12. [Hoja de Ruta](#12-hoja-de-ruta)

---

## 1. Resumen Ejecutivo

SanPedroMotoCare es una **plataforma tecnológica de operaciones end-to-end** diseñada para la gestión, coordinación y crecimiento de un servicio de mecánicos certificados a domicilio en San Pedro Garza García y el área metropolitana de Monterrey.

La plataforma unifica en un solo dominio y repositorio lo que anteriormente eran tres sistemas desconectados — una PWA de rastreo, un CRM independiente y un backend de voz — eliminando la fricción operativa, mejorando la experiencia del cliente y dotando al equipo de herramientas de análisis y automatización para escalar el negocio.

En términos de alcance técnico, la plataforma comprende:

- **18 pantallas** (rutas de Next.js) que cubren todos los flujos del negocio
- **11 API Routes** que encapsulan toda la lógica de servidor
- **6 integraciones externas** de primer nivel (Firebase, Stripe, Twilio, Gemini AI, Vercel, Google Maps)
- **1 fuente única de datos** (Firebase) que sincroniza en tiempo real a todos los actores
- **0 credenciales hardcodeadas** en el código fuente

---

## 2. Propuesta de Valor

### Para el cliente final

| Necesidad | Solución en la plataforma |
|-----------|--------------------------|
| Solicitar un servicio rápidamente | Formulario de cotización en la landing, disponible 24/7 con ticket generado en < 2 segundos |
| Saber dónde está el mecánico | Rastreo en tiempo real por GPS vía Firebase Realtime Database |
| Recibir atención inmediata | Chatbot Gemini AI disponible en toda la plataforma |
| Pagar de forma segura en línea | Stripe Checkout con confirmación automática por WhatsApp |
| Gestionar su historial de servicios | Portal de cliente con historial completo, estado en tiempo real y datos de motocicleta |
| Instalar la app sin App Store | PWA instalable desde el navegador con accesos directos nativos |

### Para el equipo operativo

| Necesidad | Solución en la plataforma |
|-----------|--------------------------|
| Visualizar todos los servicios activos | CRM Dashboard con mapa en tiempo real y métricas del día |
| Coordinar y asignar mecánicos | Panel de tickets con asignación, avance de estado y notas internas |
| Cobrar el anticipo antes de enviar al mecánico | Botón "Cobrar visita" con link Stripe enviado por WhatsApp en un clic |
| Facturar y controlar ingresos | Módulo de Facturas con filtros por período y totales automáticos |
| Tomar decisiones con datos | Módulo de Reportes con gráficas de ingresos, conversión y rendimiento por mecánico |
| Gestionar configuración sin código | Módulo de Configuración: zonas, horarios, montos, roles de usuario |
| Atender llamadas y WhatsApp desde un solo lugar | Contact Center integrado con Twilio |

### Para el negocio

- **Reducción de fricciones** en el ciclo de servicio: desde el lead hasta el cobro en una sola plataforma
- **Trazabilidad total** de cada servicio, mecánico y cliente
- **Modelo de cobro híbrido**: anticipo de visita + pago final en línea, con validación automática vía webhook
- **Base tecnológica escalable** lista para franquicias, múltiples ciudades o modelos B2B

---

## 3. Capacidades de la Plataforma

### 3.1 Adquisición y cotización de clientes

El flujo de conversión inicia en la **landing page pública**, accesible desde cualquier dispositivo sin necesidad de registro. El formulario de cotización captura los datos del vehículo, la ubicación y el tipo de servicio; al enviarse, genera automáticamente un ticket con ID legible (`SPM-XXXX`) mediante una transacción atómica en Firestore, garantizando unicidad sin colisiones de concurrencia.

El sistema registra el **origen del lead** (búsqueda orgánica, Google Ads, Meta Ads, WhatsApp, llamada directa o referido) para análisis de conversión. El chatbot con inteligencia artificial de Gemini está disponible en todo momento para responder preguntas sobre servicios, precios, zonas de cobertura y tiempos de respuesta.

### 3.2 Gestión del ciclo de servicio

Cada servicio sigue un **flujo de estados lineal** que refleja con precisión la realidad operativa:

```
Lead recibido  →  Diagnóstico pendiente  →  En camino  →  En servicio  →  Completado  →  Pagado
                                                 ↑
                                    [anticipo de visita cobrado]
```

En cada transición de estado, la plataforma ejecuta automáticamente:
- Notificación por **WhatsApp** al cliente con el nuevo estado
- Activación/desactivación del **GPS en tiempo real** del mecánico
- Actualización del historial del ticket con la marca de tiempo y el usuario responsable
- En la transición a "completado": generación y envío automático del link de pago

### 3.3 Cobro de anticipo de visita (garantía de campo)

Antes de enviar al mecánico a sitio, el operador puede cobrar un **cargo de visita de diagnóstico** configurable (default: $200 MXN). El link de Stripe se genera y envía al cliente por WhatsApp en un clic. El webhook de Stripe confirma el pago en tiempo real y actualiza el ticket sin cambiar su estado a "pagado", permitiendo al mecánico salir sólo cuando el anticipo está confirmado. Esto protege el costo de traslado ante cancelaciones de último minuto.

### 3.4 Rastreo en tiempo real

El módulo de rastreo es público — cualquier persona con el número de folio (`SPM-XXXX`) puede consultar el estado del servicio sin autenticarse. La API expone únicamente los campos seguros (estado, mecánico asignado, dirección a nivel de colonia) y revela el teléfono del mecánico **sólo cuando el ticket está en estado "en camino" o "en servicio"**, protegiendo la privacidad en las demás etapas.

### 3.5 Portal del cliente

El portal de clientes autenticados incluye:
- **Dashboard personalizado** con los últimos 5 servicios en tiempo real y acceso rápido a pago inline
- **Historial completo de servicios** con barra de progreso, filtros por estado y botones de acción contextuales
- **Gestión de motocicletas**: registro completo (marca, modelo, año, cilindrada, tipo, placa, color) que permite a los mecánicos llegar preparados
- **Módulo de pagos**: historial de pagos completados, pagos pendientes con botón de pago directo a Stripe, y confirmaciones por WhatsApp

### 3.6 CRM operativo

El CRM está orientado a la productividad del equipo de operaciones y está protegido por rol. Sus módulos principales son:

**Dashboard:** Vista ejecutiva del día con métricas en tiempo real — tickets activos, ingresos del día, mecánicos disponibles, calificación promedio — y un mapa de operaciones con la posición GPS de los mecánicos en ruta.

**Tickets:** Gestión completa con filtros por estado, búsqueda full-text, panel lateral de detalle con asignación de mecánicos, edición de costos, diagnóstico, botón de cobro de anticipo, generación de link de pago final y avance manual de estado con notas internas.

**Clientes:** Base de datos completa con historial de servicios, scoring de leads y acciones rápidas.

**Mecánicos:** Disponibilidad en tiempo real, zonas de cobertura, habilidades, calificaciones y estadísticas de desempeño.

**Facturas:** Listado de todos los servicios pagados con filtros por mes y año, KPIs de ingresos y totales automáticos. Cada factura incluye referencia al ticket, cliente, monto y enlace al comprobante de Stripe.

**Reportes:** Analítica operativa con selector de período (30/90/365 días), gráficas de ingresos por mes, distribución de tickets por estado, frecuencia por tipo de servicio y ranking de mecánicos por tickets, ingresos y calificación.

**Contact Center:** Historial de llamadas y comunicaciones con integración a Twilio.

**Configuración:** Panel administrativo para ajustar el monto de anticipo, horarios de operación, zonas de cobertura (agregar/eliminar), activación de canales de notificación y gestión de roles de usuario — todo guardado en Firestore sin necesidad de redeploy.

---

## 4. Arquitectura Tecnológica

### 4.1 Modelo de arquitectura

La plataforma sigue un modelo **monolítico bien organizado** con separación clara de responsabilidades, desplegado como una aplicación serverless en la red de borde de Vercel.

```
                         INTERNET
                             │
                    ┌────────▼────────┐
                    │     Vercel      │
                    │  Edge Network   │
                    │  (iad1 – D.C.)  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
       ┌──────▼──────┐ ┌─────▼──────┐ ┌────▼───────┐
       │   Static    │ │  Next.js   │ │  API Routes │
       │   Assets    │ │   Pages    │ │ (Serverless)│
       │  (CDN edge) │ │ (SSR/SSG)  │ │             │
       └─────────────┘ └─────┬──────┘ └────┬────────┘
                             │              │
                    ┌────────▼──────────────▼────────┐
                    │         Firebase Suite          │
                    │  Firestore │ RTDB │ Auth │ FCM  │
                    └────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
       ┌──────▼──────┐ ┌─────▼──────┐ ┌────▼────────┐
       │   Stripe    │ │   Twilio   │ │  Google AI  │
       │  Payments   │ │  Voz / WA  │ │   Gemini    │
       └─────────────┘ └────────────┘ └─────────────┘
```

### 4.2 Stack tecnológico

| Capa | Tecnología | Versión | Rol |
|------|-----------|---------|-----|
| Framework | Next.js (App Router) | 16.2.3 | SSR, SSG, API Routes, Middleware |
| Lenguaje | TypeScript | 5.x | Tipado estático en toda la base de código |
| Estilos | Tailwind CSS v4 | 4.x | Design system CSS-first con `@theme` |
| Animaciones | Framer Motion | 12.x | Transiciones y microinteracciones |
| Formularios | React Hook Form | 7.x | Validación declarativa |
| Charts | Recharts | 3.x | Gráficas del módulo de reportes |
| Server state | TanStack Query | 5.x | Caché y sincronización de datos |
| Autenticación | Firebase Authentication | 12.x | Google OAuth + Email/Password |
| Base de datos | Firebase Firestore | 12.x | NoSQL — tickets, usuarios, clientes, mecánicos |
| Realtime | Firebase Realtime Database | 12.x | GPS del mecánico en tránsito |
| Push | Firebase Cloud Messaging | 12.x | Notificaciones push web |
| Pagos | Stripe | 22.x | Checkout Sessions + Webhooks |
| Comunicaciones | Twilio | 5.x | Voz + WhatsApp Business |
| IA | Google Gemini | gemini-2.0-flash-exp | Chatbot de atención al cliente |
| Hosting | Vercel | — | Edge network, CI/CD automático, serverless |
| PWA | next-pwa + Web App Manifest | — | Instalación nativa en móvil |

### 4.3 Route groups y separación de audiencia

Next.js App Router permite organizar las rutas en **grupos por audiencia** sin afectar los URLs:

```
app/
├── (public)/          → Sin autenticación requerida
│   ├── /              Landing page
│   ├── /tracking      Rastreo por SPM-XXXX
│   └── /cotizar       Formulario de cotización
│
├── (auth)/
│   └── /login         Email + Google Sign-In
│
├── (portal)/          → Rol: viewer+
│   └── /portal/**     Dashboard, servicios, pagos, motocicletas
│
├── (field)/           → Rol: mecanico
│   └── /mecanico/**   App de campo
│
└── (crm)/             → Rol: operador+
    └── /crm/**        CRM completo (8 módulos)
```

### 4.4 Flujo de autenticación y autorización

La plataforma implementa un sistema de seguridad en dos capas:

**Capa 1 — Middleware (proxy.ts):** Revisa la presencia de cookie de sesión (`__session` HttpOnly o `__auth` de fallback) y redirige al login si la ruta requiere autenticación. Es una guarda de UX rápida que opera en el edge.

**Capa 2 — AuthContext + rol en componente:** Valida el rol del usuario contra una jerarquía de pesos (`viewer=1, mecanico=2, operador=3, manager=4, admin=5`) y redirige si el rol es insuficiente. Esta es la validación de seguridad real.

**Jerarquía de roles:**

```
admin (5)    → Acceso total, gestión de usuarios
manager (4)  → Reportes avanzados, configuración de roles
operador (3) → CRM completo, asignación de mecánicos
mecanico (2) → App de campo, actualización de estado
viewer (1)   → Portal de cliente, historial, pagos
```

---

## 5. Módulos del Sistema

### 5.1 Módulos públicos (sin autenticación)

| Módulo | URL | Descripción |
|--------|-----|-------------|
| Landing Page | `/` | Hero con video de fondo, servicios, cotizador, rastreo inline, chatbot IA, PWA install banner |
| Rastreo | `/tracking` | Búsqueda por SPM-XXXX, barra de progreso visual, datos del mecánico en ruta |
| Cotizador | `/cotizar` | Formulario completo con tipo de servicio, vehículo, dirección y horario preferido |
| Login | `/login` | Autenticación con Email/Password y Google OAuth vía Firebase |

### 5.2 Módulos del portal de cliente

| Módulo | URL | Descripción |
|--------|-----|-------------|
| Home | `/portal` | Resumen personalizado, accesos rápidos, últimos 5 servicios en tiempo real, buscador de tickets |
| Mis Servicios | `/portal/servicios` | Historial completo con filtros, progreso por ticket, botones de pago y confirmación de visita |
| Mis Pagos | `/portal/pagar` | Pagos pendientes con botón Stripe, historial de pagos, confirmación de anticipo |
| Mi Moto | `/portal/moto` | CRUD de motocicletas (marca, modelo, año, tipo, cilindrada, placa, color) |

### 5.3 Módulos del CRM

| Módulo | URL | Rol mínimo | Descripción |
|--------|-----|-----------|-------------|
| Dashboard | `/crm/dashboard` | operador | Métricas del día, mapa con GPS de mecánicos, acceso rápido |
| Tickets | `/crm/tickets` | operador | Gestión completa del ciclo de servicio |
| Clientes | `/crm/clientes` | operador | Base de datos de clientes, historial, scoring |
| Mecánicos | `/crm/mecanicos` | operador | Disponibilidad, zonas, habilidades, desempeño |
| Facturas | `/crm/facturas` | operador | Servicios pagados, KPIs de ingresos, filtros por período |
| Contact Center | `/crm/contact-center` | operador | Historial de llamadas, Twilio integrado |
| Reportes | `/crm/reportes` | manager | Charts de ingresos, distribución, mecánicos |
| Configuración | `/crm/configuracion` | manager | Ajustes de operación, zonas, notificaciones, roles |

### 5.4 API Routes

| Endpoint | Método | Autenticación | Función |
|----------|--------|--------------|---------|
| `/api/auth/session` | POST / DELETE | — | Crea/elimina cookie HttpOnly de sesión vía Firebase Admin |
| `/api/chat` | POST | — | Proxy a Gemini AI con system prompt de SPM |
| `/api/quotes` | POST | — | Crea lead + ticket SPM-XXXX (transacción atómica) |
| `/api/tracking/[id]` | GET | — | Estado público de un ticket (campos seguros) |
| `/api/payments/create-link` | POST | operador+ | Crea Stripe Checkout Session (servicio o anticipo) |
| `/api/payments/webhook` | POST | Firma Stripe | Procesa `checkout.session.completed` y `payment_intent.payment_failed` |
| `/api/notifications/push` | POST | operador+ | Envía FCM push notification |
| `/api/notifications/whatsapp` | POST | operador+ | Envía WhatsApp vía Twilio |
| `/api/voice/outbound` | POST | operador+ | Inicia llamada saliente Twilio |
| `/api/voice/say` | POST | Twilio | TwiML handler de respuesta de voz |
| `/api/voice/status` | POST | Twilio | Webhook de estado de llamada |

---

## 6. Integraciones Externas

### 6.1 Firebase — Backend unificado

Firebase actúa como la **fuente única de verdad** para toda la operación:

- **Authentication:** Gestión de identidad con Google OAuth y email/password. Integración con Firebase Admin SDK server-side para la creación de session cookies HttpOnly (más seguras que las cookies de cliente).

- **Firestore:** Base de datos NoSQL que almacena el estado central del negocio — tickets de servicio, usuarios, clientes, mecánicos, configuración de plataforma. Los listeners en tiempo real (`onSnapshot`) permiten que el CRM y el portal reflejen cambios instantáneamente sin polling.

- **Realtime Database:** Utilizada específicamente para el GPS del mecánico durante una ruta activa, aprovechando su latencia ultra-baja optimizada para datos posicionales.

- **Cloud Messaging (FCM):** Notificaciones push web con soporte para instalaciones PWA. El token FCM se almacena en el perfil del usuario y se envía cuando el estado del ticket cambia.

### 6.2 Stripe — Pagos en línea

Integración completa para el flujo de cobro del servicio:

- **Checkout Sessions:** Cada pago genera una sesión de Stripe con metadatos del ticket (`ticketId`, `clientPhone`, `type`). El campo `type` distingue entre pagos de anticipo de visita y pagos del servicio final, permitiendo al webhook ejecutar lógica diferente para cada caso.

- **Webhooks firmados:** El endpoint recibe eventos de Stripe y verifica la firma HMAC con `STRIPE_WEBHOOK_SECRET` antes de procesar cualquier cambio. Al recibir `checkout.session.completed`:
  - Si `type = "anticipo"` → marca el ticket como anticipo recibido, autoriza salida del mecánico, notifica al cliente por WhatsApp
  - Si `type = "servicio"` → avanza el ticket a estado "pagado", envía confirmación de pago

- **Webhook registrado:** `we_1TN2am2EHz3nP38WkyyFzgyR` — URL: `/api/payments/webhook`, eventos: `checkout.session.completed` + `payment_intent.payment_failed`

### 6.3 Twilio — Comunicaciones

- **WhatsApp Business:** Notificaciones automáticas en cada cambio de estado del ticket, envío de links de pago, confirmación de anticipo y coordinación operativa.
- **Voz:** Llamadas salientes desde el contact center, TwiML para respuestas automáticas y tracking del estado de cada llamada vía webhook.

### 6.4 Google Gemini — Inteligencia Artificial

El chatbot `gemini-2.0-flash-exp` opera como primer punto de contacto disponible 24/7. Su system prompt lo instruye con:
- Catálogo de servicios y precios aproximados
- Zonas de cobertura del área metropolitana de Monterrey
- Horarios de operación (Lun–Dom 7am–9pm, urgencias 24/7)
- Tiempo promedio de respuesta (~45 minutos)
- Formas de pago aceptadas
- Instrucción de responder en el idioma del usuario

La conversación se mantiene en estado local del cliente y se envían los últimos 10 mensajes en cada request para preservar el contexto sin comprometer la latencia.

### 6.5 Vercel — Infraestructura y CI/CD

La plataforma se despliega en la red de borde global de Vercel con las siguientes características:
- **Deploy automático:** Cada push a la rama `master` en GitHub dispara un build y deploy en ~45 segundos.
- **Región primaria:** Washington D.C. (iad1) — latencia óptima para usuarios en México.
- **23 variables de entorno** cifradas en el entorno de producción, nunca en el código fuente.
- **Rollback instantáneo:** Cualquier deploy previo puede restaurarse con un comando.

---

## 7. Seguridad y Cumplimiento

### 7.1 Headers de seguridad HTTP

Todos los responses incluyen los siguientes headers de seguridad:

| Header | Valor | Propósito |
|--------|-------|-----------|
| `Content-Security-Policy` | whitelist estricta de dominios | Previene XSS y carga de recursos no autorizados |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` | Permite Firebase Auth popup, bloquea acceso cross-origin |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Fuerza HTTPS en producción |
| `X-Frame-Options` | `DENY` | Previene clickjacking |
| `X-Content-Type-Options` | `nosniff` | Previene MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | Protección adicional en browsers legacy |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controla información de referencia |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Deniega APIs sensibles del navegador |

### 7.2 Autenticación y sesiones

- Las sesiones se establecen mediante **cookies HttpOnly** creadas por Firebase Admin SDK server-side — no accesibles por JavaScript del cliente, lo que elimina vectores de robo de sesión vía XSS.
- Las cookies tienen duración de **5 días**, configuración `Secure` en producción y `SameSite=Lax`.
- El middleware valida la presencia de cookie antes de entregar cualquier ruta protegida.

### 7.3 Rate limiting

Implementado en todas las API Routes con un **sliding window limiter en memoria**:

| Endpoint | Límite |
|----------|--------|
| `/api/quotes` | 5 req/min por IP |
| `/api/chat` | 20 req/min por IP |
| `/api/tracking` | 30 req/min por IP |
| `/api/payments/create-link` | 10 req/min por IP |

### 7.4 Validación de inputs

- Todos los campos de formularios y cuerpos de API son **sanitizados y truncados** server-side.
- Se usa **whitelist explícita de campos** — no se permite el spread del body de un request directamente a la base de datos.
- Los webhooks de Stripe son validados con firma HMAC antes de procesar cualquier cambio de estado.

### 7.5 Protección de datos

- Firebase Admin SDK se ejecuta exclusivamente en API Routes (server-side), nunca en el cliente.
- Las reglas de seguridad de Firestore están activas como defensa en profundidad.
- El endpoint de tracking público expone únicamente los campos necesarios y restringe el teléfono del mecánico al período activo del servicio.
- Ninguna credencial, API key o secreto existe en el repositorio de código.

---

## 8. Rendimiento y Escalabilidad

### 8.1 Optimización de carga

- **Video hero adaptativo:** Se sirven dos archivos según el dispositivo — desktop (1280×720, landscape, ~35 KB) y mobile (540×960, portrait, ~447 KB). Esto representa una reducción del **90% respecto al video original** (14 MB → 492 KB total).
- **Poster LCP:** Un frame JPG de 5.5 KB se muestra instantáneamente como placeholder mientras el video carga, garantizando un Largest Contentful Paint rápido.
- **Preload selectivo:** En móvil, el video usa `preload="none"` con un delay de 600ms para no bloquear el pintado inicial de la página.
- **Assets CDN:** Todos los assets estáticos se sirven desde el edge de Vercel, con caché global y compresión Brotli automática.

### 8.2 Optimización de imágenes

- Next.js Image Optimization (`<Image>`) con formatos modernos AVIF y WebP automáticos.
- Lazy loading nativo para todas las imágenes fuera del viewport inicial.

### 8.3 Escalabilidad serverless

- Las API Routes se ejecutan como funciones serverless independientes — escalan automáticamente a cero cuando no hay tráfico y hasta miles de instancias en paralelo sin configuración adicional.
- Firestore y Firebase Realtime Database escalan horizontalmente de forma automática con el volumen de datos y conexiones concurrentes.
- El rate limiter actual es en memoria (por instancia). Para escenarios de alta concurrencia multi-instancia, está documentado el upgrade a Redis/Upstash como siguiente paso.

---

## 9. Modelo de Datos

### 9.1 Colecciones principales en Firestore

**`service_tickets`** — Entidad central del negocio

Cada ticket representa el ciclo completo de un servicio, desde el lead hasta el cobro. Incluye datos del cliente, mecánico asignado, dirección, costos (estimado, anticipo, final), partes utilizadas, historial de estados con timestamps, referencias a sesiones de Stripe y URLs de fotos.

**`users`** — Perfiles de usuario

Vinculados al UID de Firebase Authentication. Incluyen rol, datos de contacto, token FCM para push notifications y métricas de actividad.

**`clients`** — Base de datos de clientes

Perfil completo del cliente con ID legible (`CLT-XXXXXX`), historial de tickets, valor total pagado, scoring de lead y origen de adquisición.

**`mechanics`** — Equipo operativo

Datos del mecánico con ID legible (`MEC-XXXX`), zona de cobertura, habilidades por tipo de servicio, estadísticas de desempeño y disponibilidad en tiempo real.

**`motorcycles`** — Vehículos de clientes

Asociados al UID del cliente. Incluyen marca, modelo, año, tipo, cilindrada y placa — información que se muestra al mecánico antes de llegar a sitio.

**`settings/platform`** — Configuración de la plataforma

Documento único que almacena el monto del anticipo, horarios de operación, zonas de cobertura activas y configuración de notificaciones. Se modifica desde el módulo de Configuración del CRM sin necesidad de redeploy.

**`_counters`** — Contadores atómicos

Documentos de contador incrementados mediante transacciones de Firestore para generar IDs legibles secuenciales (`SPM-0001`, `CLT-000001`) sin colisiones en entornos con múltiples escrituras concurrentes.

### 9.2 Firebase Realtime Database — GPS

```
mechanics/
  {mechanicId}/
    lat: number          Latitud actual
    lng: number          Longitud actual
    updatedAt: number    Unix timestamp de última actualización
    ticketId: string     Ticket activo en ese momento
```

Esta estructura minimalista optimiza la latencia de sincronización del mapa en tiempo real del CRM.

---

## 10. Experiencia del Usuario

### 10.1 Diseño visual

La plataforma implementa un **sistema de diseño propio** construido sobre Tailwind CSS v4:

- **Paleta de marca:** Rojo SPM (`#DC2626`) y naranja acento (`#F97316`) sobre fondos marino profundo en modo oscuro
- **Tipografía:** Poppins para títulos (display) y Inter para cuerpo (body), ambas de Google Fonts
- **Dark mode nativo:** El tema oscuro es el predeterminado absoluto de la plataforma. Un script inline en el `<head>` previene el Flash Of Unstyled Content (FOUC) antes de la hidratación de React
- **Variables CSS semánticas:** Los colores del sistema están definidos como custom properties, lo que permite cambios de marca sin tocar los componentes

### 10.2 Internacionalización

La plataforma es **bilingüe** (Español es-MX / English) mediante un sistema de i18n propio sin dependencias externas:

- Más de 285 strings de interfaz traducidos
- Persistencia de preferencia en `localStorage`
- Toggle en la navbar disponible en todas las vistas públicas
- El chatbot Gemini responde en el idioma del mensaje recibido

### 10.3 PWA — Progressive Web App

La plataforma es instalable como aplicación nativa desde el navegador:

- **Web App Manifest** con nombre, íconos (192×192 y 512×512), splash screen y color de tema
- **Display mode:** `standalone` — se abre sin barra de navegación del browser
- **Shortcuts nativos:** Accesos directos a "Rastrear" (`/tracking`) y "Cotizar" (`/cotizar`) desde el ícono de la app
- **Install Banner:** Componente que captura el evento `beforeinstallprompt`, espera 3 segundos y presenta una propuesta de instalación elegante

### 10.4 Accesibilidad y responsividad

- Diseño **mobile-first** que funciona correctamente desde 320px de ancho
- Semántica HTML correcta con landmarks, `aria-label` en elementos interactivos
- Contraste de color cumple con estándares WCAG AA en modo oscuro
- El video hero usa `object-fit: cover` adaptado a la relación de aspecto de cada dispositivo

---

## 11. Indicadores Clave

### 11.1 Métricas técnicas

| Métrica | Valor |
|---------|-------|
| Páginas de la plataforma | 18 rutas |
| API Routes | 11 endpoints |
| Integraciones externas | 6 servicios |
| Variables de entorno (producción) | 23 variables cifradas |
| Tiempo de build en Vercel | ~43 segundos |
| Tiempo de deploy tras push a master | ~45 segundos |
| Reducción de peso del video hero | 90% (14 MB → 492 KB) |
| Strings de i18n traducidos | 285+ |
| Credenciales hardcodeadas en código | 0 |

### 11.2 Métricas de negocio que la plataforma mide

El módulo de Reportes computa automáticamente los siguientes KPIs:

- **Ingresos totales** en el período seleccionado (30/90/365 días)
- **Tasa de conversión** de leads a servicios pagados
- **Calificación promedio** de servicios
- **Ticket promedio** por servicio
- **Distribución por tipo de servicio** (gráfica de barras horizontales)
- **Distribución por estado de ticket** (gráfica de pastel)
- **Ingresos por mes** (gráfica de barras)
- **Ranking de mecánicos** por tickets atendidos, ingresos generados y calificación

---

## 12. Hoja de Ruta

### Fase 3 — En planificación

| Funcionalidad | Descripción | Impacto |
|---------------|-------------|---------|
| Módulo de mecánicos (app de campo) | Vista `/mecanico` para que el mecánico actualice su estado, posición y fotos del servicio directamente desde su teléfono | Operativo |
| Stripe modo LIVE | Transición de claves de prueba a producción real | Comercial |
| CAPTCHA en cotizador | hCaptcha o Cloudflare Turnstile para prevenir spam de leads | Seguridad |
| Firebase App Check | Verificación de que las requests provienen de la app legítima | Seguridad |
| Rate limiting distribuido | Redis/Upstash para entornos multi-instancia | Escalabilidad |
| Notificaciones push avanzadas | Recordatorios de mantenimiento preventivo, campañas de reactivación | CRM |
| Programa de referidos | Seguimiento de `fuente: referido` con créditos y descuentos | Adquisición |
| Multi-ciudad | Configuración por zonas metropolitanas independientes | Escalabilidad |

---

## Anexo — Glosario

| Término | Definición |
|---------|-----------|
| **SPM-XXXX** | Identificador único de ticket de servicio, generado secuencialmente mediante transacción atómica |
| **Anticipo de visita** | Cargo cobrado antes de enviar al mecánico a sitio, que cubre el costo de traslado y confirma el compromiso del cliente |
| **Checkout Session** | Sesión de pago de Stripe con metadatos del ticket, válida por 24 horas |
| **Webhook de Stripe** | Notificación HTTP firmada que Stripe envía al confirmar un pago, verificada con HMAC |
| **FCM Token** | Identificador único del dispositivo del cliente, usado para enviar push notifications |
| **Route Group** | Mecanismo de Next.js App Router que organiza rutas en grupos lógicos sin afectar los URLs |
| **HttpOnly Cookie** | Cookie inaccesible desde JavaScript del cliente, que protege la sesión ante ataques XSS |
| **proxy.ts** | Archivo de middleware de Next.js 16 (equivalente al `middleware.ts` de versiones anteriores) |
| **COOP** | Cross-Origin-Opener-Policy: header que controla si la ventana puede comunicarse con popups de otros orígenes |

---

*Documento elaborado en Abril 2026 — SanPedroMotoCare Platform v1.2.0*  
*Sujeto a actualización con cada versión mayor de la plataforma*
