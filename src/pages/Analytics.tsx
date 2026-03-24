import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

export default function Analytics() {
  const { orgId } = useAuth();

  const { data: chartData = [] } = useQuery({
    queryKey: ["analytics_chart", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const since = subDays(new Date(), 7);
      const { data, error } = await supabase
        .from("orders")
        .select("total, created_at")
        .eq("org_id", orgId)
        .eq("status", "completed")
        .gte("created_at", since.toISOString());
      if (error) throw error;

      const grouped: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const day = format(subDays(new Date(), i), "MMM dd");
        grouped[day] = 0;
      }

      (data || []).forEach((o) => {
        const day = format(new Date(o.created_at), "MMM dd");
        if (grouped[day] !== undefined) grouped[day] += Number(o.total);
      });

      return Object.entries(grouped).map(([day, revenue]) => ({ day, revenue: Math.round(revenue) }));
    },
    enabled: !!orgId,
  });

  const { data: topItems = [] } = useQuery({
    queryKey: ["top_items", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("order_items")
        .select("item_name, quantity, order_id, orders!inner(org_id)")
        .eq("orders.org_id", orgId);
      if (error) throw error;

      const agg: Record<string, number> = {};
      (data || []).forEach((oi: any) => {
        agg[oi.item_name] = (agg[oi.item_name] || 0) + oi.quantity;
      });

      return Object.entries(agg)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, qty]) => ({ name, quantity: qty }));
    },
    enabled: !!orgId,
  });

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">Analytics</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Revenue — Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(value: number) => [`₹${value}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales data yet.</p>
            ) : (
              <div className="space-y-3">
                {topItems.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="flex-1 font-medium text-sm">{item.name}</span>
                    <span className="font-mono text-sm text-muted-foreground">{item.quantity} sold</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
