import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { orgId, roles, profile } = useAuth();

  const { data: org } = useQuery({
    queryKey: ["org", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase.from("organizations").select("*").eq("id", orgId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{org?.name || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Industry</span><span className="font-medium capitalize">{org?.industry || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">GST Number</span><span className="font-mono">{org?.gst_number || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{org?.phone || "—"}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{profile?.full_name || "—"}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Roles</span>
                <div className="flex gap-1">
                  {roles.map((r) => <Badge key={r} variant="outline" className="capitalize">{r}</Badge>)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
