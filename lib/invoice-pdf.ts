/**
 * Invoice PDF Generator — SanPedroMotoCare
 *
 * Generates a professional PDF invoice by opening a styled HTML document
 * in a new window and triggering the browser's print dialog.
 * The user can "Save as PDF" from the print dialog (all modern browsers).
 *
 * No external dependencies required.
 */

import type { ServiceTicket } from "@/types";

const SERVICE_LABELS: Record<string, string> = {
  "afinacion-menor":      "Afinación Menor",
  "afinacion-mayor":      "Afinación Mayor",
  frenos:                 "Sistema de Frenos",
  "sistema-electrico":    "Sistema Eléctrico",
  suspension:             "Suspensión",
  "cadena-y-sprockets":   "Cadena y Sprockets",
  neumaticos:             "Neumáticos",
  bateria:                "Batería",
  "carburador-inyeccion": "Carburador / Inyección",
  motor:                  "Motor",
  transmision:            "Transmisión",
  refaccion:              "Refacción / Repuesto",
  diagnostico:            "Diagnóstico",
  otro:                   "Otro",
};

const STATUS_LABELS: Record<string, string> = {
  pagado:     "PAGADO",
  completado: "PENDIENTE DE PAGO",
};

function formatDate(ts: unknown): string {
  if (!ts) return "—";
  const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as unknown as string);
  return d.toLocaleDateString("es-MX", {
    day:   "2-digit",
    month: "long",
    year:  "numeric",
  });
}

function invoiceNumber(ticket: ServiceTicket): string {
  const year = new Date().getFullYear();
  const num  = ticket.ticketId.replace("SPM-", "");
  return `SPM-INV-${year}-${num}`;
}

export function generateInvoicePDF(ticket: ServiceTicket): void {
  const origin  = window.location.origin;
  const logoUrl = `${origin}/images/logo.png`;
  const invNum  = invoiceNumber(ticket);

  const paidDate  = formatDate(ticket.paidAt ?? ticket.updatedAt);
  const svcDate   = formatDate(ticket.completedAt ?? ticket.updatedAt);
  const svcLabel  = SERVICE_LABELS[ticket.serviceType] ?? ticket.serviceType;

  const anticipo  = ticket.anticipo  ?? 0;
  const finalCost = ticket.finalCost ?? 0;
  const balance   = finalCost - anticipo;

  const partsRows = (ticket.parts ?? [])
    .map(p => `
      <tr>
        <td>${p.name}</td>
        <td style="text-align:center">${p.qty}</td>
        <td style="text-align:right">$${p.unitCost.toLocaleString("es-MX")}</td>
        <td style="text-align:right">$${p.total.toLocaleString("es-MX")}</td>
      </tr>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Factura ${invNum}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@700;800&display=swap');

    body {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 13px;
      color: #1e293b;
      background: #fff;
      padding: 0;
    }

    .page {
      max-width: 760px;
      margin: 0 auto;
      padding: 40px 48px;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid #DC2626;
    }
    .brand { display: flex; align-items: center; gap: 14px; }
    .brand img { width: 52px; height: 52px; object-fit: contain; }
    .brand-name {
      font-family: 'Poppins', sans-serif;
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.1;
    }
    .brand-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .brand-contact { font-size: 11px; color: #64748b; margin-top: 6px; line-height: 1.6; }

    .invoice-meta { text-align: right; }
    .invoice-title {
      font-family: 'Poppins', sans-serif;
      font-size: 28px;
      font-weight: 800;
      color: #DC2626;
      letter-spacing: -0.5px;
    }
    .invoice-num { font-size: 13px; color: #475569; margin-top: 4px; font-weight: 600; }
    .invoice-date { font-size: 12px; color: #94a3b8; margin-top: 2px; }

    /* ── Status badge ── */
    .status-badge {
      display: inline-block;
      margin-top: 8px;
      padding: 3px 10px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .status-pagado    { background: #dcfce7; color: #15803d; }
    .status-pendiente { background: #fef9c3; color: #a16207; }

    /* ── Two-column info ── */
    .info-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 28px;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 18px;
    }
    .info-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .info-value { font-size: 14px; font-weight: 600; color: #0f172a; }
    .info-sub   { font-size: 12px; color: #64748b; margin-top: 2px; }

    /* ── Service detail table ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    thead tr {
      background: #0f172a;
      color: #fff;
    }
    thead th {
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      text-align: left;
    }
    thead th:last-child { text-align: right; }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    tbody tr:last-child { border-bottom: none; }
    tbody td { padding: 11px 14px; font-size: 12.5px; vertical-align: top; }
    tfoot tr { background: #f8fafc; }
    tfoot td { padding: 10px 14px; font-size: 12.5px; font-weight: 600; }

    /* ── Totals ── */
    .totals {
      margin-left: auto;
      width: 300px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 32px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 9px 16px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
    }
    .totals-row:last-child { border-bottom: none; }
    .totals-row.total-final {
      background: #0f172a;
      color: #fff;
      font-weight: 700;
      font-size: 14px;
    }
    .totals-row.total-final span:last-child { color: #4ade80; }
    .totals-row.anticipo-paid span:last-child { color: #94a3b8; }

    /* ── Notes ── */
    .notes {
      background: #f8fafc;
      border-left: 3px solid #DC2626;
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 32px;
      font-size: 12px;
      color: #475569;
      line-height: 1.7;
    }

    /* ── Footer ── */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    .footer-left  { font-size: 11px; color: #94a3b8; line-height: 1.7; }
    .footer-right { text-align: right; }
    .footer-brand {
      font-family: 'Poppins', sans-serif;
      font-size: 13px;
      font-weight: 800;
      color: #DC2626;
    }
    .footer-tagline { font-size: 10px; color: #94a3b8; margin-top: 2px; }

    /* ── Signature area ── */
    .signature-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 24px;
    }
    .signature-box { text-align: center; }
    .signature-line {
      border-top: 1px solid #cbd5e1;
      padding-top: 8px;
      font-size: 11px;
      color: #94a3b8;
      margin-top: 40px;
    }

    /* ── Print ── */
    @media print {
      @page {
        size: A4;
        margin: 10mm 12mm;
      }
      body { padding: 0; }
      .page { padding: 0; max-width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <!-- Print button (hidden on print) -->
  <div class="no-print" style="
    position: fixed; top: 16px; right: 16px; z-index: 999;
    display: flex; gap: 10px;
  ">
    <button onclick="window.print()" style="
      background: #DC2626; color: white; border: none;
      padding: 10px 20px; border-radius: 8px; font-size: 13px;
      font-weight: 700; cursor: pointer; font-family: inherit;
      display: flex; align-items: center; gap: 8px;
    ">
      📄 Guardar como PDF
    </button>
    <button onclick="window.close()" style="
      background: #f1f5f9; color: #475569; border: none;
      padding: 10px 16px; border-radius: 8px; font-size: 13px;
      font-weight: 600; cursor: pointer; font-family: inherit;
    ">
      ✕ Cerrar
    </button>
  </div>

  <div class="page">

    <!-- ── Header ── -->
    <div class="header">
      <div class="brand">
        <img src="${logoUrl}" alt="SPM" onerror="this.style.display='none'" />
        <div>
          <div class="brand-name">SanPedroMotoCare</div>
          <div class="brand-sub">Mecánicos certificados a domicilio</div>
          <div class="brand-contact">
            San Pedro Garza García, N.L. · México<br/>
            spm-platform.vercel.app
          </div>
        </div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-title">FACTURA</div>
        <div class="invoice-num">${invNum}</div>
        <div class="invoice-date">Fecha: ${paidDate}</div>
        <div>
          <span class="status-badge ${ticket.status === "pagado" ? "status-pagado" : "status-pendiente"}">
            ${STATUS_LABELS[ticket.status] ?? ticket.status.toUpperCase()}
          </span>
        </div>
      </div>
    </div>

    <!-- ── Client + Service info ── -->
    <div class="info-row">
      <div class="info-box">
        <div class="info-label">Facturado a</div>
        <div class="info-value">${ticket.clientName ?? "—"}</div>
        ${ticket.clientPhone ? `<div class="info-sub">Tel: ${ticket.clientPhone}</div>` : ""}
        ${ticket.clientEmail ? `<div class="info-sub">${ticket.clientEmail}</div>` : ""}
        ${ticket.serviceAddress?.street
          ? `<div class="info-sub" style="margin-top:6px">${ticket.serviceAddress.street}${ticket.serviceAddress.colonia ? `, ${ticket.serviceAddress.colonia}` : ""}${ticket.serviceAddress.city ? `, ${ticket.serviceAddress.city}` : ""}</div>`
          : ""}
      </div>
      <div class="info-box">
        <div class="info-label">Detalles del servicio</div>
        <div class="info-value">Folio: ${ticket.ticketId}</div>
        <div class="info-sub">Fecha de servicio: ${svcDate}</div>
        ${ticket.mechanicName ? `<div class="info-sub">Mecánico: ${ticket.mechanicName}</div>` : ""}
        ${ticket.mechanicPhone ? `<div class="info-sub">Tel. mecánico: ${ticket.mechanicPhone}</div>` : ""}
        <div class="info-sub" style="margin-top:6px">Tipo: ${svcLabel}</div>
      </div>
    </div>

    <!-- ── Service table ── -->
    <table>
      <thead>
        <tr>
          <th style="width:50%">Descripción</th>
          <th style="width:20%">Tipo de servicio</th>
          <th style="width:15%;text-align:right">Costo estimado</th>
          <th style="width:15%;text-align:right">Importe</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${svcLabel}</strong><br/>
            <span style="color:#64748b;font-size:12px">${ticket.serviceDescription ?? ""}</span>
            ${ticket.diagnosis ? `<br/><span style="color:#94a3b8;font-size:11px;font-style:italic">Diagnóstico: ${ticket.diagnosis}</span>` : ""}
            ${ticket.workDone  ? `<br/><span style="color:#94a3b8;font-size:11px;font-style:italic">Trabajo: ${ticket.workDone}</span>` : ""}
          </td>
          <td>${svcLabel}</td>
          <td style="text-align:right">
            ${ticket.estimatedCost ? `$${ticket.estimatedCost.toLocaleString("es-MX")}` : "—"}
          </td>
          <td style="text-align:right;font-weight:600">
            $${finalCost.toLocaleString("es-MX")}
          </td>
        </tr>
        ${partsRows}
      </tbody>
      ${(ticket.parts ?? []).length > 0 ? `
      <tfoot>
        <tr>
          <td colspan="3" style="text-align:right;color:#64748b">Subtotal refacciones</td>
          <td style="text-align:right">
            $${(ticket.parts ?? []).reduce((s, p) => s + p.total, 0).toLocaleString("es-MX")}
          </td>
        </tr>
      </tfoot>` : ""}
    </table>

    <!-- ── Totals ── -->
    <div class="totals">
      ${ticket.estimatedCost ? `
      <div class="totals-row">
        <span>Costo estimado</span>
        <span>$${ticket.estimatedCost.toLocaleString("es-MX")}</span>
      </div>` : ""}
      ${anticipo > 0 ? `
      <div class="totals-row anticipo-paid">
        <span>Anticipo recibido</span>
        <span style="color:#94a3b8">− $${anticipo.toLocaleString("es-MX")}</span>
      </div>` : ""}
      <div class="totals-row" style="font-weight:600">
        <span>Costo del servicio</span>
        <span>$${finalCost.toLocaleString("es-MX")}</span>
      </div>
      <div class="totals-row total-final">
        <span>TOTAL ${anticipo > 0 ? "RESTANTE" : "A PAGAR"}</span>
        <span>$${balance.toLocaleString("es-MX")} MXN</span>
      </div>
    </div>

    <!-- ── Notes ── -->
    <div class="notes">
      <strong style="color:#DC2626">Notas y condiciones:</strong><br/>
      • El servicio incluye garantía de 30 días en mano de obra.<br/>
      • Las refacciones instaladas están sujetas a garantía del fabricante.<br/>
      • Cualquier aclaración comunicarse dentro de los 5 días hábiles posteriores al servicio.<br/>
      ${ticket.paymentLinkUrl
        ? `• Pago procesado en línea vía Stripe. El comprobante de pago fue enviado al correo registrado.`
        : `• Forma de pago: efectivo / transferencia bancaria.`}
    </div>

    <!-- ── Signatures ── -->
    <div class="signature-row">
      <div class="signature-box">
        <div class="signature-line">Recibí conforme · ${ticket.clientName ?? "Cliente"}</div>
      </div>
      <div class="signature-box">
        <div class="signature-line">Técnico responsable · ${ticket.mechanicName ?? "Mecánico SPM"}</div>
      </div>
    </div>

    <!-- ── Footer ── -->
    <div class="footer">
      <div class="footer-left">
        Documento generado el ${new Date().toLocaleDateString("es-MX", { day:"2-digit", month:"long", year:"numeric" })}<br/>
        Folio de servicio: ${ticket.ticketId} · Factura: ${invNum}<br/>
        Este documento no tiene validez fiscal (CFDI). Para factura fiscal solicítela a contacto@sanpedromotocare.mx
      </div>
      <div class="footer-right">
        <div class="footer-brand">SanPedroMotoCare</div>
        <div class="footer-tagline">Mecánicos certificados a domicilio · SPM/MTY</div>
      </div>
    </div>

  </div>

  <script>
    // Auto-trigger print dialog after fonts and logo load
    window.addEventListener('load', () => {
      // Small delay to ensure fonts are rendered
      setTimeout(() => {
        if (window.location.search.includes('autoprint')) {
          window.print();
        }
      }, 600);
    });
  </script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("El navegador bloqueó la ventana emergente. Permite pop-ups para este sitio e intenta de nuevo.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
}
