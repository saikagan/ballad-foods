import { useState, useCallback, useMemo } from "react";

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  gstRate: number;
  quantity: number;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((menuItem: { id: string; name: string; price: number; gst_rate: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === menuItem.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          menuItemId: menuItem.id,
          name: menuItem.name,
          unitPrice: Number(menuItem.price),
          gstRate: Number(menuItem.gst_rate),
          quantity: 1,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
    }
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totals = useMemo(() => {
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;

    items.forEach((item) => {
      const lineTotal = item.unitPrice * item.quantity;
      subtotal += lineTotal;
      const gstAmount = (lineTotal * item.gstRate) / 100;
      totalCgst += gstAmount / 2;
      totalSgst += gstAmount / 2;
    });

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      cgst: Math.round(totalCgst * 100) / 100,
      sgst: Math.round(totalSgst * 100) / 100,
      total: Math.round((subtotal + totalCgst + totalSgst) * 100) / 100,
    };
  }, [items]);

  return { items, addItem, updateQuantity, removeItem, clearCart, totals };
}
