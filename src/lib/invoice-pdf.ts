// ══ French-compliant invoice PDF generator ════════════════
// Uses jspdf to produce a PDF that satisfies:
//   - CGI Art. 289 (mentions obligatoires)
//   - Code de commerce Art. L441-9 / L441-10 (conditions de paiement)
//   - Auto-entrepreneur exemption Art. 293 B CGI
//
// Called from the Gestion invoices list via a "Telecharger PDF" button.

import { jsPDF } from "jspdf";
import type { Invoice, InvoiceItem, Client } from "./types";

// ── Invoice config (stored in user_profiles.settings.invoice_config) ──
export interface InvoiceConfig {
  legalName: string;
  legalForm: string;
  address: string;
  siret: string;
  siren: string;
  tvaNumber: string;
  tvaExempt: boolean;
  tvaRate: number;
  paymentMethods: string;
  paymentDays: number;
  latePenaltyRate: string;
  invoicePrefix: string;
  nextNumber: number;
}

export const DEFAULT_INVOICE_CONFIG: InvoiceConfig = {
  legalName: "",
  legalForm: "Micro-entrepreneur",
  address: "",
  siret: "",
  siren: "",
  tvaNumber: "",
  tvaExempt: true,
  tvaRate: 20,
  paymentMethods: "Virement bancaire, carte bancaire, especes",
  paymentDays: 30,
  latePenaltyRate: "3 fois le taux d'interet legal en vigueur",
  invoicePrefix: "FA",
  nextNumber: 1,
};

function pad(n: number, len = 4): string {
  return String(n).padStart(len, "0");
}

function formatDateFR(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function eur(n: number): string {
  return n.toFixed(2).replace(".", ",") + " EUR";
}

export function generateInvoiceNumber(config: InvoiceConfig): string {
  const year = new Date().getFullYear();
  return `${config.invoicePrefix}-${year}-${pad(config.nextNumber)}`;
}

// ── PDF Generation ──────────────────────────────────────
export function generateInvoicePDF(params: {
  invoice: Invoice;
  items: InvoiceItem[];
  client: Client | null;
  config: InvoiceConfig;
  businessName: string;
  invoiceNumber: string;
}): jsPDF {
  const { invoice, items, client, config, businessName, invoiceNumber } = params;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const mL = 20;
  const mR = 20;
  const cW = pageW - mL - mR;
  let y = 20;

  const violet = "#5B4FE9";
  const dark = "#18181B";
  const muted = "#71717A";
  const bgLight = "#F4F4F5";

  // ══ HEADER ══════════════════════════════════════════════

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(violet);
  doc.text(businessName || config.legalName || "Mon entreprise", mL, y);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(muted);
  y += 7;
  if (config.legalForm) { doc.text(config.legalForm, mL, y); y += 3.8; }
  if (config.address) {
    for (const line of config.address.split("\n")) {
      if (line.trim()) { doc.text(line.trim(), mL, y); y += 3.8; }
    }
  }
  if (config.siret) { doc.text(`SIRET : ${config.siret}`, mL, y); y += 3.8; }
  if (config.tvaNumber && !config.tvaExempt) { doc.text(`N TVA : ${config.tvaNumber}`, mL, y); y += 3.8; }

  // Invoice title (top right)
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(dark);
  doc.text("FACTURE", pageW - mR, 22, { align: "right" });

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(muted);
  doc.text(`N ${invoiceNumber}`, pageW - mR, 29, { align: "right" });
  doc.text(`Date : ${formatDateFR(invoice.date)}`, pageW - mR, 34, { align: "right" });
  const dueDate = addDays(invoice.date, config.paymentDays || 30);
  doc.text(`Echeance : ${formatDateFR(dueDate)}`, pageW - mR, 39, { align: "right" });

  y = Math.max(y, 46) + 4;
  doc.setDrawColor(bgLight);
  doc.setLineWidth(0.4);
  doc.line(mL, y, pageW - mR, y);
  y += 8;

  // ══ BUYER ═══════════════════════════════════════════════

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(violet);
  doc.text("FACTURE A", mL, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(dark);
  doc.setFontSize(10);
  if (client) {
    doc.text(`${client.firstName} ${client.lastName}`.trim(), mL, y); y += 5;
    doc.setFontSize(8.5); doc.setTextColor(muted);
    if (client.email) { doc.text(client.email, mL, y); y += 3.8; }
    if (client.phone) { doc.text(client.phone, mL, y); y += 3.8; }
  } else {
    doc.text("Client", mL, y); y += 5;
  }
  y += 6;

  // ══ LINE ITEMS TABLE ═══════════════════════════════════

  const col = {
    desc: mL,
    qty: mL + cW * 0.55,
    unit: mL + cW * 0.72,
    total: pageW - mR,
  };

  doc.setFillColor(bgLight);
  doc.roundedRect(mL, y - 1, cW, 8, 1, 1, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(muted);
  doc.text("DESIGNATION", col.desc + 2, y + 4);
  doc.text("QTE", col.qty, y + 4, { align: "center" });
  doc.text("P.U. HT", col.unit, y + 4, { align: "center" });
  doc.text("TOTAL HT", col.total, y + 4, { align: "right" });
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(dark);
  doc.setFontSize(9);

  let totalHT = 0;
  const rows: InvoiceItem[] = items.length > 0
    ? items
    : [{ label: invoice.description || "Prestation", quantity: 1, unitPrice: invoice.amount }];

  for (const item of rows) {
    const lineTotal = item.quantity * item.unitPrice;
    totalHT += lineTotal;

    const descLines = doc.splitTextToSize(item.label, cW * 0.5);
    for (let i = 0; i < descLines.length; i++) {
      doc.text(descLines[i], col.desc + 2, y);
      if (i === 0) {
        doc.text(String(item.quantity), col.qty, y, { align: "center" });
        doc.text(eur(item.unitPrice), col.unit, y, { align: "center" });
        doc.text(eur(lineTotal), col.total, y, { align: "right" });
      }
      y += 5;
    }
    doc.setDrawColor("#E4E4E7");
    doc.setLineWidth(0.15);
    doc.line(mL, y, pageW - mR, y);
    y += 4;
  }
  y += 4;

  // ══ TOTALS ═════════════════════════════════════════════

  const tX = pageW - mR;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(muted);
  doc.text("Total HT", tX - 50, y);
  doc.setTextColor(dark);
  doc.text(eur(totalHT), tX, y, { align: "right" });
  y += 6;

  let totalTTC = totalHT;

  if (config.tvaExempt) {
    doc.setFontSize(7.5);
    doc.setTextColor(muted);
    doc.text("TVA non applicable, article 293 B du Code general des impots", tX - 50, y);
    y += 6;
  } else {
    const tva = totalHT * (config.tvaRate / 100);
    totalTTC = totalHT + tva;
    doc.setTextColor(muted);
    doc.text(`TVA (${config.tvaRate}%)`, tX - 50, y);
    doc.setTextColor(dark);
    doc.text(eur(tva), tX, y, { align: "right" });
    y += 6;
  }

  // TTC badge
  doc.setFillColor(violet);
  doc.roundedRect(tX - 72, y - 1, 72, 11, 2, 2, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#FFFFFF");
  doc.text("TOTAL TTC", tX - 67, y + 6);
  doc.text(eur(totalTTC), tX - 3, y + 6, { align: "right" });
  y += 20;

  // ══ PAYMENT CONDITIONS ═════════════════════════════════
  // Art. L441-9 & L441-10 Code de commerce

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(violet);
  doc.text("CONDITIONS DE REGLEMENT", mL, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(muted);
  doc.setFontSize(7);

  const payLines = [
    `Modes de paiement : ${config.paymentMethods || "Virement, CB, especes"}`,
    `Echeance : ${formatDateFR(dueDate)} (${config.paymentDays || 30} jours)`,
    `Pas d'escompte pour paiement anticipe.`,
    ``,
    `Penalites de retard : ${config.latePenaltyRate || "3 fois le taux d'interet legal"}.`,
    `En cas de retard de paiement, une indemnite forfaitaire de 40 EUR pour frais`,
    `de recouvrement sera exigee (articles L441-10 et D441-5 du Code de commerce).`,
  ];

  for (const l of payLines) {
    doc.text(l, mL, y);
    y += 3.3;
  }

  // ══ FOOTER ═════════════════════════════════════════════

  doc.setDrawColor(bgLight);
  doc.setLineWidth(0.3);
  doc.line(mL, 280, pageW - mR, 280);

  doc.setFontSize(6.5);
  doc.setTextColor(muted);
  const footerParts = [
    config.legalName || businessName,
    config.legalForm,
    config.siret ? `SIRET ${config.siret}` : "",
    config.tvaExempt
      ? "TVA non applicable (Art. 293 B CGI)"
      : config.tvaNumber ? `TVA ${config.tvaNumber}` : "",
  ].filter(Boolean);
  doc.text(footerParts.join("  |  "), pageW / 2, 284, { align: "center" });

  return doc;
}

/** Trigger browser download. */
export function downloadInvoicePDF(params: Parameters<typeof generateInvoicePDF>[0]): void {
  const doc = generateInvoicePDF(params);
  doc.save(`Facture_${params.invoiceNumber}.pdf`);
}

/**
 * Adapter for the shape returned by gestion/page.tsx buildPdfData().
 * Accepts the flat { invoiceId, date, client, pro, description, items, amount }
 * shape and converts it to the full generateInvoicePDF params.
 */
export function downloadInvoicePdf(data: {
  invoiceId: string;
  date: string;
  status: string;
  client: { firstName: string; lastName: string; email: string; phone: string };
  pro: { name: string; business: string; email: string; phone: string };
  description: string;
  items?: InvoiceItem[];
  amount: number;
}): void {
  // Load config from localStorage (sync — no need for async here since
  // the hook already cached it)
  let cfg = DEFAULT_INVOICE_CONFIG;
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("invoice_config") : null;
    if (raw) cfg = { ...DEFAULT_INVOICE_CONFIG, ...JSON.parse(raw) };
  } catch { /* ignore */ }

  // Derive a stable invoice number
  const year = new Date(data.date).getFullYear();
  // Use a hash of the invoice ID to generate a stable number without DB
  let hashNum = 0;
  for (let i = 0; i < data.invoiceId.length; i++) {
    hashNum = ((hashNum << 5) - hashNum + data.invoiceId.charCodeAt(i)) | 0;
  }
  const stableIdx = Math.abs(hashNum) % 9999 + 1;
  const invoiceNumber = `${cfg.invoicePrefix}-${year}-${String(stableIdx).padStart(4, "0")}`;

  const invoice = {
    id: data.invoiceId,
    clientId: "",
    amount: data.amount,
    status: data.status as "paid" | "pending",
    date: data.date,
    description: data.description,
    items: data.items,
  };

  const client = {
    id: "",
    firstName: data.client.firstName,
    lastName: data.client.lastName,
    email: data.client.email,
    phone: data.client.phone,
    notes: "",
    avatar: "",
    createdAt: "",
  };

  downloadInvoicePDF({
    invoice,
    items: data.items || [],
    client,
    config: cfg,
    businessName: data.pro.business || data.pro.name,
    invoiceNumber,
  });
}
