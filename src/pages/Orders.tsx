import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Orders() {
  const { orgId } = useAuth();

  const { data: orders = [] } = useQuery({
    queryKey: ["orders", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": return "bg-primary/10 text-primary border-primary/20";
      case "pending": return "bg-accent/10 text-accent border-accent/20";
      case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "";
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">Orders</h1>

        {orders.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <p className="text-lg font-medium">No orders yet</p>
            <p className="text-sm mt-1">Orders will appear here as you process sales.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono font-semibold text-sm">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusColor(order.status)}>{order.status}</Badge>
                    <span className="font-mono font-bold text-primary">₹{Number(order.total).toFixed(0)}</span>
                  </div>
                </div>
                {order.order_items && order.order_items.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {order.order_items.map((oi: any) => (
                      <span key={oi.id} className="mr-3">{oi.item_name} ×{oi.quantity}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Subtotal: ₹{Number(order.subtotal).toFixed(2)}</span>
                  <span>CGST: ₹{Number(order.cgst).toFixed(2)}</span>
                  <span>SGST: ₹{Number(order.sgst).toFixed(2)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
