import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import MenuGrid from "@/components/pos/MenuGrid";
import CartPanel from "@/components/pos/CartPanel";
import CustomerSelector, { SelectedCustomer } from "@/components/pos/CustomerSelector";
import CheckoutDialog from "@/components/pos/CheckoutDialog";
import InvoiceActions from "@/components/pos/InvoiceActions";
import MobileCartSheet from "@/components/pos/MobileCartSheet";
import AppLayout from "@/components/layout/AppLayout";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import type { InvoiceData } from "@/lib/generateInvoice";
import { generateInvoicePDF } from "@/lib/generateInvoice";

type PaymentMethod = Database["public"]["Enums"]["payment_method"];

export default function POS() {
  const { orgId, user } = useAuth();
  const { items, addItem, updateQuantity, removeItem, clearCart, totals } = useCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [invoiceStoragePath, setInvoiceStoragePath] = useState<string | null>(null);

  const { data: org } = useQuery({
    queryKey: ["org", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data } = await supabase.from("organizations").select("*").eq("id", orgId).single();
      return data;
    },
    enabled: !!orgId,
  });

  const handleCheckout = async (paymentMethod: PaymentMethod) => {
    if (!orgId || !user || items.length === 0) return;
    setCheckoutLoading(true);

    try {
      // Generate ORD-001-DDMMYYYY format, resetting count daily
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const dateStr = `${dd}${mm}${yyyy}`;
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .gte("created_at", startOfDay)
        .lt("created_at", endOfDay);

      const seq = String((count ?? 0) + 1).padStart(3, '0');
      const orderNumber = `ORD-${seq}-${dateStr}`;

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          org_id: orgId,
          order_number: orderNumber,
          subtotal: totals.subtotal,
          cgst: totals.cgst,
          sgst: totals.sgst,
          total: totals.total,
          status: "paid" as const,
          payment_method: paymentMethod,
          payment_status: "paid" as const,
          created_by: user.id,
          customer_id: selectedCustomer?.id || null,
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        gst_rate: item.gstRate,
        total: item.unitPrice * item.quantity,
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) throw itemsErr;

      // Build invoice data
      const invoice: InvoiceData = {
        orderNumber,
        date: new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        orgName: org?.name || "Restaurant",
        orgAddress: org?.address,
        orgPhone: org?.phone,
        orgEmail: org?.email,
        orgGst: org?.gst_number,
        customerName: selectedCustomer?.name || null,
        customerPhone: selectedCustomer?.phone || null,
        customerEmail: selectedCustomer?.email || null,
        items: items.map((it) => ({
          name: it.name,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          gstRate: it.gstRate,
          total: it.unitPrice * it.quantity,
        })),
        subtotal: totals.subtotal,
        cgst: totals.cgst,
        sgst: totals.sgst,
        total: totals.total,
        paymentMethod: paymentMethod,
      };

      let storedPath: string | null = null;
      try {
        const pdfBlob = generateInvoicePDF(invoice);
        const filePath = `${orgId}/${order.id}.pdf`;
        const { error: uploadErr } = await supabase.storage
          .from("invoices")
          .upload(filePath, pdfBlob, { contentType: "application/pdf", upsert: true });
        if (!uploadErr) {
          storedPath = filePath;
          await supabase.from("orders").update({ invoice_url: filePath }).eq("id", order.id);
        }
      } catch (e) {
        console.error("Invoice upload failed", e);
      }

      clearCart();
      setSelectedCustomer(null);
      setCheckoutOpen(false);
      setInvoiceData(invoice);
      setInvoiceStoragePath(storedPath);
      setInvoiceOpen(true);
      toast.success(`Order ${orderNumber} completed — ₹${totals.total.toFixed(0)}`);
    } catch (err: any) {
      toast.error(err.message || "Checkout failed");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex h-full">
        {/* Menu Section */}
        <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
          <h1 className="text-2xl font-bold mb-4">Point of Sale</h1>
          <MenuGrid onAddItem={addItem} />
        </div>

        {/* Cart Sidebar */}
        <div className="hidden md:flex w-[380px] p-4 pl-0">
          <CartPanel
            items={items}
            totals={totals}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onCheckout={() => {
              if (!selectedCustomer) {
                toast.error("Please select or add a customer before checkout");
                return;
              }
              setCheckoutOpen(true);
            }}
            onClear={clearCart}
            checkoutLoading={checkoutLoading}
            customerSelector={
              <CustomerSelector selected={selectedCustomer} onSelect={setSelectedCustomer} />
            }
          />
        </div>

        {/* Mobile Cart Sheet */}
        <MobileCartSheet
          items={items}
          totals={totals}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
            onCheckout={() => {
              if (!selectedCustomer) {
                toast.error("Please select or add a customer before checkout");
                return;
              }
              setCheckoutOpen(true);
            }}
          onClear={clearCart}
          checkoutLoading={checkoutLoading}
          customerSelector={
            <CustomerSelector selected={selectedCustomer} onSelect={setSelectedCustomer} />
          }
        />
      </div>

      <CheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        total={totals.total}
        onConfirm={handleCheckout}
        loading={checkoutLoading}
        upiId={org?.upi_id}
        orgName={org?.name}
      />

      <InvoiceActions
        open={invoiceOpen}
        onClose={() => { setInvoiceOpen(false); setInvoiceData(null); setInvoiceStoragePath(null); }}
        invoiceData={invoiceData}
        invoiceStoragePath={invoiceStoragePath}
      />
    </AppLayout>
  );
}
