import type { Timestamp } from "firebase/firestore";

// ============================================================
// SPM — Core Type Definitions
// ============================================================

export type UserRole = "admin" | "manager" | "operador" | "mecanico" | "viewer";

export type ServiceTicketStatus =
  | "lead-recibido"
  | "diagnostico-pendiente"
  | "en-camino"
  | "en-servicio"
  | "completado"
  | "pagado"
  | "cancelado";

export type ServiceType =
  | "afinacion-menor"
  | "afinacion-mayor"
  | "frenos"
  | "sistema-electrico"
  | "suspension"
  | "cadena-y-sprockets"
  | "neumaticos"
  | "bateria"
  | "carburador-inyeccion"
  | "motor"
  | "transmision"
  | "refaccion"
  | "diagnostico"
  | "otro";

export type LeadSource =
  | "google-ads"
  | "meta-ads"
  | "llamada-directa"
  | "whatsapp"
  | "landing-page"
  | "referido"
  | "organico"
  | "otro";

export type MotoType =
  | "naked"
  | "deportiva"
  | "touring"
  | "enduro"
  | "scooter"
  | "custom"
  | "otra";

// ============================================================
// User
// ============================================================

export interface SPMUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  photoURL?: string;
  mechanicId?: string;
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  lastLogin?: Timestamp;
}

// ============================================================
// Address
// ============================================================

export interface Address {
  street?: string;
  colonia?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;
  reference?: string;
}

// ============================================================
// Client / Customer
// ============================================================

export interface Client {
  id: string;
  clientId: string; // CLT-XXXXXX
  name: string;
  lastName: string;
  email?: string;
  phone: string;
  whatsapp?: string;
  type: "individual" | "empresa";
  address?: Address;
  totalTickets: number;
  totalPaid: number;
  source?: LeadSource;
  leadScore?: number;
  isActive: boolean;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================================
// Motorcycle
// ============================================================

export interface Motorcycle {
  id: string;
  clientId: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  placa?: string;
  vin?: string;
  tipoMoto?: MotoType;
  cilindrada?: number;
  ticketIds?: string[];
  photoUrl?: string;
  createdAt?: Timestamp;
}

// ============================================================
// Mechanic
// ============================================================

export interface Mechanic {
  id: string;
  mechanicId: string; // MEC-XXXX
  name: string;
  phone?: string;
  email?: string;
  status: "disponible" | "en-servicio" | "descanso" | "inactivo";
  zona: string[];
  skills: ServiceType[];
  vehicleType?: "moto" | "auto" | "bicicleta";
  totalServicesCompleted: number;
  averageRating?: number;
  photoUrl?: string;
  location?: { lat: number; lng: number; updatedAt: Timestamp };
  createdAt?: Timestamp;
}

// ============================================================
// Service Ticket
// ============================================================

export interface PartItem {
  name: string;
  qty: number;
  unitCost: number;
  total: number;
}

export interface TicketEvent {
  status: ServiceTicketStatus;
  timestamp: Timestamp;
  note?: string;
  userId?: string;
}

export interface ServiceTicket {
  id: string;
  ticketId: string; // SPM-XXXX
  status: ServiceTicketStatus;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  motorcycleId?: string;
  serviceType: ServiceType;
  serviceDescription: string;
  diagnosis?: string;
  workDone?: string;
  mechanicId?: string;
  mechanicName?: string;
  mechanicPhone?: string;
  serviceAddress: Address;
  estimatedCost?: number;
  anticipo?: number;
  finalCost?: number;
  parts?: PartItem[];
  source: LeadSource;
  statusHistory?: TicketEvent[];
  rating?: number;
  photosBefore?: string[];
  photosAfter?: string[];
  // Payments — anticipo (guarantee deposit before field visit)
  anticipoLinkUrl?: string;     // Stripe URL for the diagnostic-visit charge
  anticipoPagado?: boolean;     // true once Stripe webhook confirms anticipo payment
  // Payments — final service
  paymentLinkUrl?: string;      // Stripe Checkout Session URL
  stripeSessionId?: string;     // Stripe session ID for webhook matching
  paymentMethod?: "stripe" | "efectivo";
  paidAt?: Timestamp;
  // Partial payments
  payments?: TicketPayment[];
  totalPaid?: number;
  // Notifications
  lastWhatsAppSent?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  completedAt?: Timestamp;
}

// ============================================================
// Payment (per-ticket, supports partial payments)
// ============================================================

export type PaymentMethod = "stripe" | "efectivo" | "transferencia";
export type PaymentType = "anticipo" | "parcial" | "final";

export interface TicketPayment {
  id: string;
  type: PaymentType;
  method: PaymentMethod;
  amount: number;
  note?: string;
  stripeSessionId?: string;
  stripeUrl?: string;
  registeredBy: string;
  registeredByName?: string;
  createdAt?: Timestamp;
}

// ============================================================
// Invoice
// ============================================================

export interface InvoiceItem {
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceId: string; // INV-YYYY-XXXXX
  clientId: string;
  clientName?: string;
  ticketId?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "pendiente" | "pagada" | "vencida" | "cancelada";
  paymentMethod?: string;
  pdfUrl?: string;
  cfdiUrl?: string;
  dueDate?: Timestamp;
  paidAt?: Timestamp;
  createdAt?: Timestamp;
}

// ============================================================
// Dashboard Stats
// ============================================================

export interface DashboardStats {
  totalTickets: number;
  activeTickets: number;
  completedToday: number;
  revenueToday: number;
  revenueMonth: number;
  avgRating: number;
  activeMechanics: number;
  totalClients: number;
  pendingPayments: number;
  conversionRate: number;
}

// ============================================================
// Chat / Chatbot
// ============================================================

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ============================================================
// Quote Request (landing form)
// ============================================================

export interface QuoteRequest {
  name: string;
  phone: string;
  email?: string;
  address: string;
  motoType?: MotoType;
  motoBrand?: string;
  motoYear?: string;
  serviceType: ServiceType;
  description: string;
  preferredTime?: string;
  source?: LeadSource;
}

// ============================================================
// Helpers
// ============================================================

export const STATUS_LABELS: Record<ServiceTicketStatus, string> = {
  "lead-recibido": "Lead Recibido",
  "diagnostico-pendiente": "Diagnóstico Pendiente",
  "en-camino": "En Camino",
  "en-servicio": "En Servicio",
  completado: "Completado",
  pagado: "Pagado",
  cancelado: "Cancelado",
};

export const STATUS_COLORS: Record<ServiceTicketStatus, string> = {
  "lead-recibido": "bg-slate-500/20 text-slate-300",
  "diagnostico-pendiente": "bg-yellow-500/20 text-yellow-300",
  "en-camino": "bg-blue-500/20 text-blue-300",
  "en-servicio": "bg-orange-500/20 text-orange-300",
  completado: "bg-green-500/20 text-green-300",
  pagado: "bg-emerald-500/20 text-emerald-300",
  cancelado: "bg-red-500/20 text-red-300",
};

export const SERVICE_LABELS: Record<ServiceType, string> = {
  "afinacion-menor": "Afinación Menor",
  "afinacion-mayor": "Afinación Mayor",
  frenos: "Sistema de Frenos",
  "sistema-electrico": "Sistema Eléctrico",
  suspension: "Suspensión",
  "cadena-y-sprockets": "Cadena y Sprockets",
  neumaticos: "Neumáticos",
  bateria: "Batería",
  "carburador-inyeccion": "Carburador / Inyección",
  motor: "Motor",
  transmision: "Transmisión",
  refaccion: "Refacción",
  diagnostico: "Diagnóstico",
  otro: "Otro",
};

export const NEXT_STATUS: Partial<Record<ServiceTicketStatus, ServiceTicketStatus>> = {
  "lead-recibido": "diagnostico-pendiente",
  "diagnostico-pendiente": "en-camino",
  "en-camino": "en-servicio",
  "en-servicio": "completado",
  completado: "pagado",
};

export const STATUS_PIPELINE: ServiceTicketStatus[] = [
  "lead-recibido",
  "diagnostico-pendiente",
  "en-camino",
  "en-servicio",
  "completado",
  "pagado",
];

export const STATUS_ICONS: Record<ServiceTicketStatus, string> = {
  "lead-recibido": "inbox",
  "diagnostico-pendiente": "stethoscope",
  "en-camino": "truck",
  "en-servicio": "wrench",
  completado: "check",
  pagado: "banknotes",
  cancelado: "x-circle",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  stripe: "Stripe (tarjeta)",
  efectivo: "Efectivo",
  transferencia: "Transferencia",
};

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  anticipo: "Anticipo",
  parcial: "Pago parcial",
  final: "Pago final",
};
