import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, CheckCircle2, Loader2 } from "lucide-react";
import { format, startOfDay, subDays } from "date-fns";
import { toast } from "sonner";

export default function Orders() {
  const { orgId } = useAuth();
  const queryClient = useQueryClient();

  const now = new Date();
  const todayStart = startOfDay(now).toISOString();
  const weekStart = startOfDay(subDays(now, 7)).toISOString();

  const { data: orders = [] } = useQuery({
    queryKey: ["orders", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), customers(name, phone)")
        .eq("org_id", orgId)
        .in("status", ["paid", "completed"])
        .gte("created_at", weekStart)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const weekOrders = orders;
  const todayCompleted = orders.filter(
    (o) => o.status === "completed" && o.created_at >= todayStart
  );
  const todayPaid = orders.filter(
    (o) => o.status === "paid" && o.created_at >= todayStart
  );

  const markDone = useMutation({
    mutationFn: async (order: (typeof orders)[0]) => {
      // Send WhatsApp message
      const phone = order.customers?.phone?.replace(/\D/g, "");
      if (phone) {
        const surveyLink = "https://docs.google.com/forms/d/1G3e0cOyKYu4ttPYRKZbTB6Oq86FloVxcBfgt4z39w3s/edit";
        const message = encodeURIComponent(
          `Thank you for your order! Please rate us: ${surveyLink}`
        );
        window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
      }

      // Update status to completed
      const { error } = await supabase
        .from("orders")
        .update({ status: "completed" as const })
        .eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", orgId] });
      toast.success("Order marked as completed");
    },
    onError: () => toast.error("Failed to complete order"),
  });

  const statusColor = (s: string) => {
    switch (s) {
      case "completed":
        return "bg-primary/10 text-primary border-primary/20";
      case "paid":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      default:
        return "";
    }
  };

  const renderOrder = (order: (typeof orders)[0], showDone = false) => (
    <Card key={order.id} className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-mono font-semibold text-sm">{order.order_number}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}
          </p>
          {order.customers?.name && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {order.customers.name}
              {order.customers.phone && ` · ${order.customers.phone}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusColor(order.status)}>
            {order.status}
          </Badge>
          <span className="font-mono font-bold text-primary">
            ₹{Number(order.total).toFixed(0)}
          </span>
        </div>
      </div>

      {order.order_items && order.order_items.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {order.order_items.map((oi: any) => (
            <span key={oi.id} className="mr-3">
              {oi.item_name} ×{oi.quantity}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        <span>Subtotal: ₹{Number(order.subtotal).toFixed(2)}</span>
        {Number(order.cgst) > 0 && <span>CGST: ₹{Number(order.cgst).toFixed(2)}</span>}
        {Number(order.sgst) > 0 && <span>SGST: ₹{Number(order.sgst).toFixed(2)}</span>}

        <div className="ml-auto flex items-center gap-2">
          {order.invoice_url && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={async () => {
                try {
                  const { data, error } = await supabase.storage
                    .from("invoices")
                    .createSignedUrl(order.invoice_url!, 60);
                  if (error || !data?.signedUrl) throw error || new Error("No URL");
                  window.open(data.signedUrl, "_blank");
                } catch {
                  toast.error("Failed to load invoice");
                }
              }}
            >
              <FileText className="h-3.5 w-3.5" /> View Invoice
            </Button>
          )}

          {showDone && order.status === "paid" && (
            <Button
              size="sm"
              className="h-7 gap-1.5 text-xs"
              disabled={markDone.isPending}
              onClick={() => markDone.mutate(order)}
            >
              {markDone.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Done
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  const emptyState = (message: string) => (
    <Card className="p-12 text-center text-muted-foreground">
      <p className="text-lg font-medium">No orders</p>
      <p className="text-sm mt-1">{message}</p>
    </Card>
  );

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">Orders</h1>

        <Tabs defaultValue="week" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="week">This Week ({weekOrders.length})</TabsTrigger>
            <TabsTrigger value="completed">
              Today's Completed ({todayCompleted.length})
            </TabsTrigger>
            <TabsTrigger value="paid">
              Today's Paid ({todayPaid.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="space-y-3 mt-4">
            {weekOrders.length === 0
              ? emptyState("No orders in the last 7 days.")
              : weekOrders.map((o) => renderOrder(o, o.status === "paid"))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3 mt-4">
            {todayCompleted.length === 0
              ? emptyState("No completed orders today.")
              : todayCompleted.map((o) => renderOrder(o))}
          </TabsContent>

          <TabsContent value="paid" className="space-y-3 mt-4">
            {todayPaid.length === 0
              ? emptyState("No paid orders today. Process sales from POS.")
              : todayPaid.map((o) => renderOrder(o, true))}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
