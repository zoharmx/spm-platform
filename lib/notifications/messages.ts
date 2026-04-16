/**
 * Centralized notification message templates for SPM.
 * All channels (WhatsApp, Push, SMS, Voice) use the same copy.
 */

import type { ServiceTicketStatus } from "@/types";

export interface NotificationData {
  clientName: string;
  ticketId: string;
  mechanicName?: string;
  serviceType?: string;
  paymentLink?: string;
  estimatedCost?: number;
}

/** WhatsApp / SMS messages per ticket status */
export function getStatusMessage(
  status: ServiceTicketStatus,
  data: NotificationData
): string {
  const name    = data.clientName.split(" ")[0]; // First name only
  const folio   = `*${data.ticketId}*`;
  const mec     = data.mechanicName ? `*${data.mechanicName}*` : "tu mecánico";
  const payment = data.paymentLink
    ? `\n\n💳 Paga en línea aquí:\n${data.paymentLink}`
    : "";

  const msgs: Record<ServiceTicketStatus, string> = {
    "lead-recibido": [
      `¡Hola ${name}! 👋 Recibimos tu solicitud de servicio.`,
      `Tu folio es ${folio}.`,
      `Un operador te contactará en breve para confirmar los detalles.`,
      `\n— SanPedroMotoCare 🏍️`,
    ].join(" "),

    "diagnostico-pendiente": [
      `Hola ${name}, tu solicitud ${folio} está siendo revisada por nuestro equipo.`,
      `Te confirmaremos disponibilidad y costo muy pronto.`,
      `\n— SanPedroMotoCare`,
    ].join(" "),

    "en-camino": [
      `🏍️ *¡Tu mecánico está en camino!*`,
      `\nHola ${name}, ${mec} se dirige a tu ubicación.`,
      `Tiempo estimado de llegada: *45 minutos*.`,
      `Folio: ${data.ticketId}`,
      `\n¿Alguna duda? Responde este mensaje.`,
      `\n— SanPedroMotoCare`,
    ].join("\n"),

    "en-servicio": [
      `🔧 ${mec} ha llegado y ya está trabajando en tu moto.`,
      `Folio: ${data.ticketId}.`,
      `Te avisaremos cuando el servicio esté listo.`,
      `\n— SanPedroMotoCare`,
    ].join(" "),

    "completado": [
      `✅ *Servicio completado* — Folio ${data.ticketId}`,
      `\nHola ${name}, ${mec} terminó el servicio en tu moto.`,
      payment,
      `\n\n⭐ ¿Cómo fue tu experiencia? Responde con un número del *1 al 5*.`,
      `\n— SanPedroMotoCare`,
    ].join(""),

    "pagado": [
      `✅ *Pago confirmado* — Folio ${data.ticketId}`,
      `\nHola ${name}, recibimos tu pago. ¡Gracias por confiar en SanPedroMotoCare!`,
      `\nHasta la próxima 🏍️`,
      `\n— SanPedroMotoCare`,
    ].join(""),

    "cancelado": [
      `Hola ${name}, tu solicitud ${folio} fue cancelada.`,
      `Si tienes preguntas o deseas reagendar, responde este mensaje.`,
      `\n— SanPedroMotoCare`,
    ].join(" "),
  };

  return msgs[status] ?? `Actualización de tu servicio ${data.ticketId}. — SanPedroMotoCare`;
}

/** Short push notification copy per status */
export function getPushCopy(
  status: ServiceTicketStatus,
  data: NotificationData
): { title: string; body: string } {
  const name  = data.clientName.split(" ")[0];
  const folio = data.ticketId;

  const copies: Record<ServiceTicketStatus, { title: string; body: string }> = {
    "lead-recibido":         { title: "Solicitud recibida ✓",   body: `Folio ${folio} registrado. Te contactaremos pronto.` },
    "diagnostico-pendiente": { title: "Revisando tu solicitud", body: `${folio} — Un operador confirma los detalles.` },
    "en-camino":             { title: "🏍️ Mecánico en camino",  body: `${data.mechanicName ?? "Tu mecánico"} llega en ~45 min.` },
    "en-servicio":           { title: "🔧 Servicio iniciado",   body: `${data.mechanicName ?? "Tu mecánico"} ya está trabajando.` },
    "completado":            { title: "✅ Servicio completado", body: `${folio} listo. ${data.paymentLink ? "Paga en línea." : ""}` },
    "pagado":                { title: "💳 Pago confirmado",     body: `Gracias ${name}. ¡Hasta la próxima!` },
    "cancelado":             { title: "Servicio cancelado",     body: `${folio} cancelado. Contáctanos para reagendar.` },
  };

  return copies[status] ?? { title: "SPM — Actualización", body: `Folio ${folio}` };
}

/** Voice call script per status (for TwiML) */
export function getVoiceScript(
  status: ServiceTicketStatus,
  data: NotificationData
): string {
  const name = data.clientName.split(" ")[0];
  const mec  = data.mechanicName ?? "nuestro mecánico";

  const scripts: Partial<Record<ServiceTicketStatus, string>> = {
    "en-camino": [
      `Hola ${name}, te llama SanPedroMotoCare.`,
      `${mec} está en camino a tu ubicación y llegará en aproximadamente cuarenta y cinco minutos.`,
      `Si tienes alguna pregunta, puedes responder al mensaje de WhatsApp que te enviamos.`,
      `Gracias y hasta pronto.`,
    ].join(" "),

    "completado": [
      `Hola ${name}, te llama SanPedroMotoCare.`,
      `El servicio de tu motocicleta, folio ${data.ticketId.replace(/-/g, " guión ")}, ha sido completado exitosamente.`,
      `Te enviamos el link de pago por WhatsApp.`,
      `¿Cómo fue tu experiencia? Puedes calificarnos del uno al cinco respondiendo nuestro mensaje.`,
      `Gracias por confiar en SanPedroMotoCare.`,
    ].join(" "),
  };

  return scripts[status] ?? `Hola ${name}, tienes una actualización de tu servicio ${data.ticketId} con SanPedroMotoCare. Revisa tu WhatsApp para más detalles. Gracias.`;
}
