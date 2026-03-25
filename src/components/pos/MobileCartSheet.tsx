import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart } from "lucide-react";
import { CartItem } from "@/hooks/useCart";
import CartPanel from "./CartPanel";
import { ReactNode, useState } from "react";

interface MobileCartSheetProps {
  items: CartItem[];
  totals: { subtotal: number; cgst: number; sgst: number; total: number };
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onClear: () => void;
  checkoutLoading: boolean;
  customerSelector: ReactNode;
}

export default function MobileCartSheet({
  items,
  totals,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onClear,
  checkoutLoading,
  customerSelector,
}: MobileCartSheetProps) {
  const [open, setOpen] = useState(false);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="md:hidden fixed bottom-16 inset-x-0 p-4 z-40">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-base shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <ShoppingCart className="h-5 w-5" />
            {items.length === 0
              ? "View Cart"
              : `View Cart · ${itemCount} item${itemCount !== 1 ? "s" : ""} · ₹${totals.total.toFixed(0)}`}
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0 flex flex-col">
          <SheetHeader className="sr-only">
            <SheetTitle>Shopping Cart</SheetTitle>
          </SheetHeader>
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-3 mb-1 shrink-0" />
          <div className="flex-1 overflow-hidden">
            <CartPanel
              items={items}
              totals={totals}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveItem={onRemoveItem}
              onCheckout={() => {
                setOpen(false);
                onCheckout();
              }}
              onClear={onClear}
              checkoutLoading={checkoutLoading}
              customerSelector={customerSelector}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
