import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Banknote, CreditCard, Smartphone, ArrowLeft, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Database } from "@/integrations/supabase/types";

type PaymentMethod = Database["public"]["Enums"]["payment_method"];

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (method: PaymentMethod) => void;
  loading: boolean;
  upiId?: string | null;
  orgName?: string;
}

const methods: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: "cash", label: "Cash", icon: <Banknote className="h-6 w-6" /> },
  { value: "upi", label: "UPI", icon: <Smartphone className="h-6 w-6" /> },
  { value: "card", label: "Card", icon: <CreditCard className="h-6 w-6" /> },
];

function CashScreen({ total, onConfirm, loading }: { total: number; onConfirm: () => void; loading: boolean }) {
  const [tendered, setTendered] = useState("");
  const tenderedNum = parseFloat(tendered) || 0;
  const change = tenderedNum - total;
  const quickAmounts = [
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 50) * 50,
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 500) * 500,
  ].filter((v, i, arr) => v >= total && arr.indexOf(v) === i).slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Amount Due</p>
        <p className="text-3xl font-bold font-mono text-primary">₹{total.toFixed(0)}</p>
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground">Amount Tendered</label>
        <Input
          type="number"
          placeholder="Enter amount received"
          value={tendered}
          onChange={(e) => setTendered(e.target.value)}
          className="text-center text-xl font-mono h-12 mt-1"
          autoFocus
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {quickAmounts.map((amt) => (
          <button
            key={amt}
            onClick={() => setTendered(String(amt))}
            className="px-3 py-1.5 rounded-lg border text-sm font-mono hover:bg-secondary transition-colors"
          >
            ₹{amt}
          </button>
        ))}
      </div>

      {tenderedNum > 0 && (
        <div className={`text-center p-3 rounded-xl ${change >= 0 ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>
          <p className="text-sm font-medium">{change >= 0 ? "Change" : "Insufficient"}</p>
          <p className="text-2xl font-bold font-mono">₹{Math.abs(change).toFixed(0)}</p>
        </div>
      )}

      <Button onClick={onConfirm} disabled={loading || tenderedNum < total} className="w-full h-12 text-base font-semibold">
        {loading ? "Processing..." : "Confirm Cash Payment"}
      </Button>
    </div>
  );
}

function UpiScreen({ total, upiId, orgName, onConfirm, loading }: {
  total: number; upiId?: string | null; orgName?: string; onConfirm: () => void; loading: boolean;
}) {
  const upiLink = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(orgName || "Merchant")}&am=${total.toFixed(2)}&cu=INR`
    : null;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Scan to Pay</p>
        <p className="text-3xl font-bold font-mono text-primary">₹{total.toFixed(0)}</p>
      </div>

      <div className="flex justify-center">
        {upiLink ? (
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <QRCodeSVG value={upiLink} size={200} level="H" includeMargin />
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-xl p-8 text-center text-muted-foreground">
            <Smartphone className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No UPI ID configured</p>
            <p className="text-xs mt-1">Add your UPI ID in Settings</p>
          </div>
        )}
      </div>

      {upiId && (
        <p className="text-center text-xs text-muted-foreground font-mono">{upiId}</p>
      )}

      <Button onClick={onConfirm} disabled={loading} className="w-full h-12 text-base font-semibold">
        <Check className="h-4 w-4 mr-2" />
        {loading ? "Processing..." : "Payment Received — Confirm"}
      </Button>
    </div>
  );
}

function CardScreen({ total, onConfirm, loading }: { total: number; onConfirm: () => void; loading: boolean }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Card Payment</p>
        <p className="text-3xl font-bold font-mono text-primary">₹{total.toFixed(0)}</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Card Number</label>
          <Input placeholder="•••• •••• •••• ••••" className="font-mono mt-1" maxLength={19} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Expiry</label>
            <Input placeholder="MM/YY" className="font-mono mt-1" maxLength={5} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">CVV</label>
            <Input placeholder="•••" type="password" className="font-mono mt-1" maxLength={4} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Cardholder Name</label>
          <Input placeholder="Name on card" className="mt-1" />
        </div>
      </div>

      <p className="text-[10px] text-center text-muted-foreground">
        This is a UI placeholder. Use your POS terminal for real card transactions.
      </p>

      <Button onClick={onConfirm} disabled={loading} className="w-full h-12 text-base font-semibold">
        <CreditCard className="h-4 w-4 mr-2" />
        {loading ? "Processing..." : "Confirm Card Payment"}
      </Button>
    </div>
  );
}

export default function CheckoutDialog({ open, onClose, total, onConfirm, loading, upiId, orgName }: CheckoutDialogProps) {
  const [selected, setSelected] = useState<PaymentMethod | null>(null);

  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  const handleConfirm = () => {
    if (selected) onConfirm(selected);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            {selected && (
              <button onClick={() => setSelected(null)} className="absolute left-4 top-4 p-1 rounded-md hover:bg-secondary transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            {selected ? `${methods.find(m => m.value === selected)?.label} Payment` : "Select Payment Method"}
          </DialogTitle>
        </DialogHeader>

        {!selected ? (
          <>
            <div className="text-center mb-2">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold font-mono text-primary">₹{total.toFixed(0)}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {methods.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setSelected(m.value)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/10 hover:text-primary transition-all"
                >
                  {m.icon}
                  <span className="text-sm font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </>
        ) : selected === "cash" ? (
          <CashScreen total={total} onConfirm={handleConfirm} loading={loading} />
        ) : selected === "upi" ? (
          <UpiScreen total={total} upiId={upiId} orgName={orgName} onConfirm={handleConfirm} loading={loading} />
        ) : (
          <CardScreen total={total} onConfirm={handleConfirm} loading={loading} />
        )}
      </DialogContent>
    </Dialog>
  );
}
