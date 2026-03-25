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

type PaymentMethod = Database["public"]["Enums"]["payment_method"];

export default function POS() {
  const { orgId, user } = useAuth();
  const { items, addItem, updateQuantity, removeItem, clearCart, totals } = useCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

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
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          org_id: orgId,
          order_number: orderNumber,
          subtotal: totals.subtotal,
          cgst: totals.cgst,
          sgst: totals.sgst,
          total: totals.total,
          status: "completed" as const,
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

      clearCart();
      setSelectedCustomer(null);
      setCheckoutOpen(false);
      setInvoiceData(invoice);
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
            onCheckout={() => setCheckoutOpen(true)}
            onClear={clearCart}
            checkoutLoading={checkoutLoading}
            customerSelector={
              <CustomerSelector selected={selectedCustomer} onSelect={setSelectedCustomer} />
            }
          />
        </div>

        {/* Mobile Cart Button */}
        {items.length > 0 && (
          <div className="md:hidden fixed bottom-16 inset-x-0 p-4">
            <button
              onClick={() => setCheckoutOpen(true)}
              disabled={checkoutLoading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-base shadow-lg flex items-center justify-center gap-2"
            >
              {checkoutLoading ? "Processing..." : `Charge ₹${totals.total.toFixed(0)} (${items.length} items)`}
            </button>
          </div>
        )}
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
        onClose={() => { setInvoiceOpen(false); setInvoiceData(null); }}
        invoiceData={invoiceData}
      />
    </AppLayout>
  );
}
