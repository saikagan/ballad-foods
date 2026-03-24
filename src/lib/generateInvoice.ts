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

export function generateInvoiceHTML(data: InvoiceData): string {
  const itemsRows = data.items
    .map(
      (item, i) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${i + 1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-family:monospace;">₹${item.unitPrice.toFixed(2)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.gstRate}%</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-family:monospace;">₹${item.total.toFixed(2)}</td>
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
  th:nth-child(4), th:nth-child(6) { text-align: right; }
  th:nth-child(5) { text-align: center; }
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
      ${data.orgGst ? `<div style="font-size:13px;color:#555;font-weight:600;">GSTIN: ${data.orgGst}</div>` : ""}
    </div>
    <div style="text-align:right;">
      <div class="invoice-title">TAX INVOICE</div>
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
      <tr><th>#</th><th>Item</th><th>Qty</th><th>Rate</th><th>GST</th><th>Amount</th></tr>
    </thead>
    <tbody>${itemsRows}</tbody>
  </table>

  <div class="totals">
    <table class="totals-table">
      <tr><td class="label">Subtotal</td><td class="value">₹${data.subtotal.toFixed(2)}</td></tr>
      <tr><td class="label">CGST</td><td class="value">₹${data.cgst.toFixed(2)}</td></tr>
      <tr><td class="label">SGST</td><td class="value">₹${data.sgst.toFixed(2)}</td></tr>
      <tr class="grand-total"><td class="label">Total</td><td class="value">₹${data.total.toFixed(2)}</td></tr>
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
