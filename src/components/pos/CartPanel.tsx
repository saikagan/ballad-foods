import { CartItem } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";

interface CartPanelProps {
  items: CartItem[];
  totals: { subtotal: number; cgst: number; sgst: number; total: number };
  applyGst?: boolean;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onClear: () => void;
  checkoutLoading: boolean;
  customerSelector?: React.ReactNode;
}

export default function CartPanel({
  items,
  totals,
  applyGst = true,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onClear,
  checkoutLoading,
  customerSelector,
}: CartPanelProps) {
  return (
    <div className="flex flex-col h-full bg-pos-cart md:rounded-xl md:border">
      {/* Customer Selector */}
      {customerSelector && <div className="p-4 pb-0">{customerSelector}</div>}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Current Order</h2>
        </div>
        {items.length > 0 && (
          <button onClick={onClear} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
            Clear all
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto pos-scrollbar p-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
            <ShoppingCart className="h-10 w-10 mb-2 opacity-30" />
            <p>No items in cart</p>
            <p className="text-xs mt-1">Tap menu items to add</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 animate-slide-in-right">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  ₹{item.unitPrice.toFixed(0)} × {item.quantity}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  className="h-7 w-7 rounded-md bg-secondary flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center font-mono text-sm font-semibold">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="h-7 w-7 rounded-md bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <p className="w-16 text-right font-mono text-sm font-semibold">
                ₹{(item.unitPrice * item.quantity).toFixed(0)}
              </p>
              <button onClick={() => onRemoveItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div className="border-t p-4 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-mono">₹{totals.subtotal.toFixed(2)}</span>
          </div>
          {applyGst && (
            <>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>CGST</span>
                <span className="font-mono">₹{totals.cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>SGST</span>
                <span className="font-mono">₹{totals.sgst.toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total</span>
            <span className="font-mono text-primary">₹{totals.total.toFixed(2)}</span>
          </div>
          <Button
            onClick={onCheckout}
            disabled={checkoutLoading}
            className="w-full mt-2 h-12 text-base font-semibold"
          >
            {checkoutLoading ? "Processing..." : `Charge ₹${totals.total.toFixed(0)}`}
          </Button>
        </div>
      )}
    </div>
  );
}
