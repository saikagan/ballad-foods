import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Banknote, CreditCard, Smartphone } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type PaymentMethod = Database["public"]["Enums"]["payment_method"];

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (method: PaymentMethod) => void;
  loading: boolean;
}

const methods: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: "cash", label: "Cash", icon: <Banknote className="h-6 w-6" /> },
  { value: "upi", label: "UPI", icon: <Smartphone className="h-6 w-6" /> },
  { value: "card", label: "Card", icon: <CreditCard className="h-6 w-6" /> },
];

export default function CheckoutDialog({ open, onClose, total, onConfirm, loading }: CheckoutDialogProps) {
  const [selected, setSelected] = useState<PaymentMethod>("cash");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Collect <span className="text-primary font-mono">₹{total.toFixed(0)}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 my-4">
          {methods.map((m) => (
            <button
              key={m.value}
              onClick={() => setSelected(m.value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                selected === m.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/30"
              }`}
            >
              {m.icon}
              <span className="text-sm font-medium">{m.label}</span>
            </button>
          ))}
        </div>

        <Button onClick={() => onConfirm(selected)} disabled={loading} className="w-full h-12 text-base font-semibold">
          {loading ? "Processing..." : "Confirm Payment"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
