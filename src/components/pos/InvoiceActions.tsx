import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, MessageCircle, Mail, Check } from "lucide-react";
import type { InvoiceData } from "@/lib/generateInvoice";
import { openInvoicePrintWindow } from "@/lib/generateInvoice";
import { supabase } from "@/integrations/supabase/client";

interface InvoiceActionsProps {
  open: boolean;
  onClose: () => void;
  invoiceData: InvoiceData | null;
  invoiceStoragePath?: string | null;
}

export default function InvoiceActions({ open, onClose, invoiceData, invoiceStoragePath }: InvoiceActionsProps) {

  if (!invoiceData) return null;

  const getInvoiceUrl = async (): Promise<string | undefined> => {
    if (!invoiceStoragePath) return undefined;
    try {
      const { data, error } = await supabase.storage
        .from("invoices")
        .createSignedUrl(invoiceStoragePath, 604800);
      if (error || !data?.signedUrl) return undefined;
      return data.signedUrl;
    } catch {
      return undefined;
    }
  };

  const handlePrint = () => {
    const w = openInvoicePrintWindow(invoiceData);
    if (w) {
      w.onload = () => {
        setTimeout(() => w.print(), 300);
      };
    }
  };

  const handleWhatsApp = async () => {
    const invoiceUrl = await getInvoiceUrl();
    const message = buildShareMessage(invoiceData, invoiceUrl);
    const phone = invoiceData.customerPhone?.replace(/\D/g, "") || "";
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleEmail = () => {
    const subject = `Invoice ${invoiceData.orderNumber} - ${invoiceData.orgName}`;
    const body = buildShareMessage(invoiceData);
    const to = invoiceData.customerEmail || "";
    window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Check className="h-5 w-5" /> Order Completed
          </DialogTitle>
        </DialogHeader>

        <div className="text-center py-2">
          <p className="text-2xl font-bold font-mono text-primary">₹{invoiceData.total.toFixed(0)}</p>
          <p className="text-sm text-muted-foreground mt-1">{invoiceData.orderNumber}</p>
          {invoiceData.customerName && (
            <p className="text-sm font-medium mt-1">{invoiceData.customerName}</p>
          )}
        </div>

        <div className="grid gap-3 mt-2">
          <Button onClick={handlePrint} variant="outline" className="h-12 justify-start gap-3">
            <Printer className="h-5 w-5" /> Print / Save as PDF
          </Button>
          <Button onClick={handleWhatsApp} variant="outline" className="h-12 justify-start gap-3 text-green-600 hover:text-green-700 hover:bg-green-50">
            <MessageCircle className="h-5 w-5" />
            Share via WhatsApp
          </Button>
          <Button onClick={handleEmail} variant="outline" className="h-12 justify-start gap-3">
            <Mail className="h-5 w-5" /> Send via Email
          </Button>
        </div>

        <Button variant="ghost" onClick={onClose} className="mt-2 w-full">
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function buildShareMessage(data: InvoiceData): string {
  const showGst = data.applyGst !== false;
  const itemLines = data.items
    .map((it) => `  ${it.name} × ${it.quantity} = ₹${it.total.toFixed(0)}`)
    .join("\n");

  let msg = `🧾 *Invoice: ${data.orderNumber}*
${data.orgName}
${data.date}

${data.customerName ? `Customer: ${data.customerName}` : "Walk-in Customer"}

*Items:*
${itemLines}

Subtotal: ₹${data.subtotal.toFixed(2)}`;

  if (showGst) {
    msg += `\nCGST: ₹${data.cgst.toFixed(2)}`;
    msg += `\nSGST: ₹${data.sgst.toFixed(2)}`;
  }

  msg += `\n*Total: ₹${data.total.toFixed(2)}*

Payment: ${data.paymentMethod.toUpperCase()}
Status: ✅ Paid

Thank you for your business!`;

  return msg;
}
