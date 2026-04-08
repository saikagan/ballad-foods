import jsPDF from "jspdf";

export interface InvoiceData {
  orderNumber: string;
  date: string;
  orgName: string;
  orgAddress?: string | null;
  orgPhone?: string | null;
  orgEmail?: string | null;
  orgGst?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  applyGst?: boolean;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    gstRate: number;
    total: number;
  }[];
  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;
  paymentMethod: string;
}

export function generateInvoicePDF(data: InvoiceData): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;
  const showGst = data.applyGst !== false;

  const GREEN = [27, 122, 61] as const;
  const GRAY = [100, 100, 100] as const;
  const BLACK = [26, 26, 46] as const;

  // --- Header ---
  doc.setFontSize(20);
  doc.setTextColor(...GREEN);
  doc.setFont("helvetica", "bold");
  doc.text(data.orgName, margin, y + 7);

  doc.setFontSize(22);
  doc.text(showGst ? "TAX INVOICE" : "INVOICE", pageW - margin, y + 7, { align: "right" });
  y += 12;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  if (data.orgAddress) { y += 5; doc.text(data.orgAddress, margin, y); }
  if (data.orgPhone) { y += 4; doc.text(`Tel: ${data.orgPhone}`, margin, y); }
  if (showGst && data.orgGst) { y += 4; doc.setFont("helvetica", "bold"); doc.text(`GSTIN: ${data.orgGst}`, margin, y); doc.setFont("helvetica", "normal"); }
  y += 4;

  // Green line
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // --- Bill To / Invoice Details ---
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", margin, y);
  doc.text("INVOICE DETAILS", pageW - margin, y, { align: "right" });
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  if (data.customerName) {
    doc.setFont("helvetica", "bold");
    doc.text(data.customerName, margin, y);
    doc.setFont("helvetica", "normal");
  } else {
    doc.setTextColor(...GRAY);
    doc.text("Walk-in Customer", margin, y);
    doc.setTextColor(...BLACK);
  }
  doc.setFont("helvetica", "bold");
  doc.text(data.orderNumber, pageW - margin, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  y += 5;

  if (data.customerPhone) { doc.setFontSize(9); doc.text(data.customerPhone, margin, y); }
  doc.setFontSize(9);
  doc.text(data.date, pageW - margin, y, { align: "right" });
  y += 5;

  if (data.customerEmail) { doc.text(data.customerEmail, margin, y); y += 5; }

  // Payment badge
  const badge = data.paymentMethod.toUpperCase();
  doc.setFontSize(8);
  const badgeW = doc.getTextWidth(badge) + 8;
  doc.setFillColor(...GREEN);
  doc.roundedRect(pageW - margin - badgeW, y - 3, badgeW, 5, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(badge, pageW - margin - badgeW + 4, y + 0.5);
  doc.setTextColor(...BLACK);
  y += 10;

  // --- Items Table ---
  const cols = showGst
    ? [
        { label: "#", w: 8, align: "center" as const },
        { label: "Item", w: contentW - 8 - 15 - 25 - 15 - 28, align: "left" as const },
        { label: "Qty", w: 15, align: "center" as const },
        { label: "Rate", w: 25, align: "right" as const },
        { label: "GST", w: 15, align: "center" as const },
        { label: "Amount", w: 28, align: "right" as const },
      ]
    : [
        { label: "#", w: 8, align: "center" as const },
        { label: "Item", w: contentW - 8 - 15 - 25 - 28, align: "left" as const },
        { label: "Qty", w: 15, align: "center" as const },
        { label: "Rate", w: 25, align: "right" as const },
        { label: "Amount", w: 28, align: "right" as const },
      ];

  // Header row
  doc.setFillColor(...GREEN);
  doc.rect(margin, y, contentW, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  let cx = margin;
  for (const col of cols) {
    const tx = col.align === "right" ? cx + col.w - 2 : col.align === "center" ? cx + col.w / 2 : cx + 2;
    doc.text(col.label, tx, y + 5, { align: col.align });
    cx += col.w;
  }
  y += 7;

  // Data rows
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BLACK);
  doc.setFontSize(9);

  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    if (y > 270) { doc.addPage(); y = margin; }
    cx = margin;
    const rowData = showGst
      ? [String(i + 1), item.name, String(item.quantity), `Rs.${item.unitPrice.toFixed(2)}`, `${item.gstRate}%`, `Rs.${item.total.toFixed(2)}`]
      : [String(i + 1), item.name, String(item.quantity), `Rs.${item.unitPrice.toFixed(2)}`, `Rs.${item.total.toFixed(2)}`];
    for (let j = 0; j < cols.length; j++) {
      const col = cols[j];
      const tx = col.align === "right" ? cx + col.w - 2 : col.align === "center" ? cx + col.w / 2 : cx + 2;
      doc.text(rowData[j], tx, y + 4, { align: col.align });
      cx += col.w;
    }
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 6, pageW - margin, y + 6);
    y += 7;
  }
  y += 4;

  // --- Totals ---
  const totalsX = pageW - margin - 60;
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);

  const totalsRows: { label: string; value: string }[] = [
    { label: "Subtotal", value: `Rs.${data.subtotal.toFixed(2)}` },
  ];
  if (showGst) {
    totalsRows.push({ label: "CGST", value: `Rs.${data.cgst.toFixed(2)}` });
    totalsRows.push({ label: "SGST", value: `Rs.${data.sgst.toFixed(2)}` });
  }

  for (const row of totalsRows) {
    doc.text(row.label, totalsX, y);
    doc.text(row.value, pageW - margin, y, { align: "right" });
    y += 6;
  }

  // Grand total
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.6);
  doc.line(totalsX, y - 1, pageW - margin, y - 1);
  y += 4;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GREEN);
  doc.text("Total", totalsX, y);
  doc.text(`Rs.${data.total.toFixed(2)}`, pageW - margin, y, { align: "right" });
  y += 15;

  // --- Footer ---
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for your business!  •  This is a computer-generated invoice.", pageW / 2, y, { align: "center" });

  return doc.output("blob");
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const showGst = data.applyGst !== false;

  const itemsRows = data.items
    .map(
      (item, i) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${i + 1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-family:monospace;">Rs.${item.unitPrice.toFixed(2)}</td>
      ${showGst ? `<td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.gstRate}%</td>` : ""}
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-family:monospace;">Rs.${item.total.toFixed(2)}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice ${data.orderNumber}</title>
<style>
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { margin: 15mm; size: A4; } }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; }
  .invoice { max-width: 700px; margin: 0 auto; padding: 40px 30px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #1B7A3D; padding-bottom: 20px; }
  .org-name { font-size: 24px; font-weight: 700; color: #1B7A3D; }
  .invoice-title { font-size: 28px; font-weight: 700; color: #1B7A3D; text-align: right; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .meta-block { font-size: 13px; line-height: 1.7; }
  .meta-label { font-weight: 600; color: #555; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead { background: #1B7A3D; color: #fff; }
  th { padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  th:nth-child(1) { text-align: center; }
  th:nth-child(3) { text-align: center; }
  th:nth-child(4) { text-align: right; }
  th:last-child { text-align: right; }
  .totals { display: flex; justify-content: flex-end; }
  .totals-table { width: 280px; }
  .totals-table td { padding: 6px 12px; font-size: 14px; }
  .totals-table .label { color: #555; }
  .totals-table .value { text-align: right; font-family: monospace; }
  .grand-total td { font-size: 18px; font-weight: 700; color: #1B7A3D; border-top: 2px solid #1B7A3D; padding-top: 10px; }
  .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 15px; }
  .payment-badge { display: inline-block; background: #1B7A3D; color: #fff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
</style></head><body>
<div class="invoice">
  <div class="header">
    <div>
      <div class="org-name">${data.orgName}</div>
      ${data.orgAddress ? `<div style="font-size:13px;color:#555;margin-top:4px;">${data.orgAddress}</div>` : ""}
      ${data.orgPhone ? `<div style="font-size:13px;color:#555;">Tel: ${data.orgPhone}</div>` : ""}
      ${showGst && data.orgGst ? `<div style="font-size:13px;color:#555;font-weight:600;">GSTIN: ${data.orgGst}</div>` : ""}
    </div>
    <div style="text-align:right;">
      <div class="invoice-title">${showGst ? "TAX INVOICE" : "INVOICE"}</div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-block">
      <div class="meta-label">Bill To</div>
      ${data.customerName ? `<div style="font-weight:600;font-size:15px;">${data.customerName}</div>` : `<div style="color:#999;">Walk-in Customer</div>`}
      ${data.customerPhone ? `<div>${data.customerPhone}</div>` : ""}
      ${data.customerEmail ? `<div>${data.customerEmail}</div>` : ""}
    </div>
    <div class="meta-block" style="text-align:right;">
      <div class="meta-label">Invoice Details</div>
      <div><strong>${data.orderNumber}</strong></div>
      <div>${data.date}</div>
      <div style="margin-top:6px;"><span class="payment-badge">${data.paymentMethod}</span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr><th>#</th><th>Item</th><th>Qty</th><th>Rate</th>${showGst ? "<th style='text-align:center;'>GST</th>" : ""}<th style="text-align:right;">Amount</th></tr>
    </thead>
    <tbody>${itemsRows}</tbody>
  </table>

  <div class="totals">
    <table class="totals-table">
      <tr><td class="label">Subtotal</td><td class="value">Rs.${data.subtotal.toFixed(2)}</td></tr>
      ${showGst ? `<tr><td class="label">CGST</td><td class="value">Rs.${data.cgst.toFixed(2)}</td></tr>
      <tr><td class="label">SGST</td><td class="value">Rs.${data.sgst.toFixed(2)}</td></tr>` : ""}
      <tr class="grand-total"><td class="label">Total</td><td class="value">Rs.${data.total.toFixed(2)}</td></tr>
    </table>
  </div>

  <div class="footer">
    Thank you for your business! • This is a computer-generated invoice.
  </div>
</div>
</body></html>`;
}

export function openInvoicePrintWindow(data: InvoiceData): Window | null {
  const html = generateInvoiceHTML(data);
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) return null;
  w.document.write(html);
  w.document.close();
  return w;
}

export function getInvoiceBlob(data: InvoiceData): Blob {
  return new Blob([generateInvoiceHTML(data)], { type: "text/html" });
}
