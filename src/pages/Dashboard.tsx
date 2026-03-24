import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, ShoppingCart, TrendingUp, Users } from "lucide-react";

export default function Dashboard() {
  const { orgId, profile } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["dashboard_stats", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [ordersRes, customersRes] = await Promise.all([
        supabase.from("orders").select("total, created_at").eq("org_id", orgId).gte("created_at", today.toISOString()),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("org_id", orgId),
      ]);

      const todayOrders = ordersRes.data || [];
      const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);

      return {
        todayRevenue,
        todayOrders: todayOrders.length,
        totalCustomers: customersRes.count || 0,
        avgOrderValue: todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0,
      };
    },
    enabled: !!orgId,
  });

  const cards = [
    { title: "Today's Revenue", value: `₹${(stats?.todayRevenue || 0).toFixed(0)}`, icon: IndianRupee, color: "text-primary" },
    { title: "Today's Orders", value: String(stats?.todayOrders || 0), icon: ShoppingCart, color: "text-accent" },
    { title: "Avg Order Value", value: `₹${(stats?.avgOrderValue || 0).toFixed(0)}`, icon: TrendingUp, color: "text-primary" },
    { title: "Total Customers", value: String(stats?.totalCustomers || 0), icon: Users, color: "text-muted-foreground" },
  ];

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Welcome back, {profile?.full_name || "there"}!</h1>
          <p className="text-muted-foreground text-sm mt-1">Here's how your restaurant is doing today.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((card) => (
            <Card key={card.title} className="animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold font-mono">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="p-8 text-center text-muted-foreground">
          <p className="text-lg font-medium mb-1">Quick Start</p>
          <p className="text-sm">
            1. Add menu items in <strong>Menu</strong> → 2. Take orders in <strong>POS</strong> → 3. Track sales in <strong>Analytics</strong>
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}
