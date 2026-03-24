import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import MenuGrid from "@/components/pos/MenuGrid";
import CartPanel from "@/components/pos/CartPanel";
import AppLayout from "@/components/layout/AppLayout";
import { toast } from "sonner";

export default function POS() {
  const { orgId, user } = useAuth();
  const { items, addItem, updateQuantity, removeItem, clearCart, totals } = useCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = async () => {
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
          payment_method: "cash" as const,
          payment_status: "paid" as const,
          created_by: user.id,
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

      clearCart();
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
            onCheckout={handleCheckout}
            onClear={clearCart}
            checkoutLoading={checkoutLoading}
          />
        </div>

        {/* Mobile Cart Button */}
        {items.length > 0 && (
          <div className="md:hidden fixed bottom-16 inset-x-0 p-4">
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-base shadow-lg flex items-center justify-center gap-2"
            >
              {checkoutLoading ? "Processing..." : `Charge ₹${totals.total.toFixed(0)} (${items.length} items)`}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
