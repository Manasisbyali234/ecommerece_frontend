import { jsPDF } from "jspdf";
import type { Order, Invoice } from "./mock-data";
import { store } from "./store";

export function buildInvoicePdf(
  invoice: Invoice,
  order?: Order,
  email?: string,
): jsPDF {
  const settings = store.getCompanyInvoiceSettings();
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(settings.companyName || "E-Commerce Store", 48, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`${settings.address} · ${settings.cityStatePincode}`, 48, y + 16);
  doc.text(`GSTIN: ${settings.gstin} · CIN: ${settings.cin} · ${settings.supportEmail}`, 48, y + 28);

  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("TAX INVOICE", w - 48, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(invoice.id, w - 48, y + 20, { align: "right" });

  y += 76;
  doc.setDrawColor(220);
  doc.line(48, y, w - 48, y);
  y += 24;

  // Fixed 3-column layout for order meta (right half of page)
  // Page width ~595pt, margin 48pt each side → content 499pt
  // Left half (0–248) reserved for Billed To
  // Right half split: Order ID 130pt | Issued 90pt | Due 90pt
  const META_ORDER_X  = 248;   // Order ID col start
  const META_ORDER_W  = 120;   // strict max width for Order ID
  const META_ISSUED_X = 378;   // = 248 + 120 + 10 gap
  const META_ISSUED_W = 80;
  const META_DUE_X    = 468;   // = 378 + 80 + 10 gap
  const META_DUE_W    = 75;

  // Bill to
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Billed To", 48, y);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.customer, 48, y + 16);
  if (email) doc.text(email, 48, y + 30);

  // Order meta headers
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Order ID", META_ORDER_X,  y);
  doc.text("Issued",   META_ISSUED_X, y);
  doc.text("Due",      META_DUE_X,    y);

  // Order meta values — Order ID truncated to strict column width
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const rawOrderId = invoice.orderId || "";
  let displayOrderId = rawOrderId;
  if (doc.getTextWidth(displayOrderId) > META_ORDER_W) {
    while (doc.getTextWidth(displayOrderId + "...") > META_ORDER_W && displayOrderId.length > 0) {
      displayOrderId = displayOrderId.slice(0, -1);
    }
    displayOrderId += "...";
  }
  doc.text(displayOrderId,  META_ORDER_X,  y + 14);
  doc.text(invoice.issued,  META_ISSUED_X, y + 14);
  doc.text(invoice.due,     META_DUE_X,    y + 14);

  y += 60;

  // Line items header
  doc.setFillColor(245, 246, 250);
  doc.rect(48, y - 14, w - 96, 24, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DESCRIPTION", 56, y);
  doc.text("QTY", w - 220, y, { align: "right" });
  doc.text("UNIT PRICE", w - 140, y, { align: "right" });
  doc.text("AMOUNT", w - 56, y, { align: "right" });

  y += 26;
  doc.setFont("helvetica", "normal");

  // Line item column X positions (fixed)
  const ITEM_DESC_X   = 56;
  const ITEM_DESC_W   = w - 96 - 180; // description max width
  const ITEM_QTY_X    = w - 220;
  const ITEM_PRICE_X  = w - 140;
  const ITEM_AMT_X    = w - 56;

  const itemCount = typeof order?.items === "number" ? order.items : Array.isArray(order?.items) ? order.items.length : 1;
  const unit = invoice.amount / Math.max(1, itemCount);
  for (let i = 0; i < itemCount; i++) {
    const rawTitle = Array.isArray(order?.items) && order.items[i]?.title ? order.items[i].title : `Order ${invoice.orderId} — Item ${i + 1}`;
    const titleLines = doc.splitTextToSize(rawTitle, ITEM_DESC_W);
    doc.text(titleLines,                          ITEM_DESC_X,  y);
    doc.text(String(1),                           ITEM_QTY_X,   y, { align: "right" });
    doc.text(`Rs. ${unit.toFixed(2)}`,            ITEM_PRICE_X, y, { align: "right" });
    doc.text(`Rs. ${unit.toFixed(2)}`,            ITEM_AMT_X,   y, { align: "right" });
    y += Math.max(20, titleLines.length * 14);
  }

  y += 12;
  doc.setDrawColor(220);
  doc.line(w - 260, y, w - 48, y);
  y += 20;

  const taxRate = (settings.gstTaxRatePercent || 18) / 100;
  const subtotal = invoice.amount / (1 + taxRate);
  const totalTax = invoice.amount - subtotal;

  doc.setFont("helvetica", "normal");
  doc.text("Taxable Value", w - 200, y);
  doc.text(`Rs. ${subtotal.toFixed(2)}`, w - 56, y, { align: "right" });
  y += 18;
  doc.text(`GST (${settings.gstTaxRatePercent}%)`, w - 200, y);
  doc.text(`Rs. ${totalTax.toFixed(2)}`, w - 56, y, { align: "right" });
  y += 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Grand Total", w - 200, y);
  doc.text(`Rs. ${invoice.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, w - 56, y, { align: "right" });

  y += 50;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `Status: ${invoice.status.toUpperCase()} · ${settings.legalTerms}`,
    48,
    y,
  );

  return doc;
}

export function downloadInvoicePdf(invoice: Invoice, order?: Order, email?: string) {
  const doc = buildInvoicePdf(invoice, order, email);
  doc.save(`${invoice.id}.pdf`);
}
