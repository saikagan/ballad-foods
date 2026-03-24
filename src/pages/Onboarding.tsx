import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2 } from "lucide-react";

export default function Onboarding() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const orgId = crypto.randomUUID();

      // Create organization (don't chain .select() — SELECT RLS fails before profile is linked)
      const { error: orgErr } = await supabase
        .from("organizations")
        .insert({ id: orgId, name: orgName, industry: "restaurant" as const, gst_number: gstNumber || null, phone: phone || null });
      if (orgErr) throw orgErr;

      // Link profile to org
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ org_id: orgId })
        .eq("user_id", user.id);
      if (profileErr) throw profileErr;

      // Assign admin role
      const { error: roleErr } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "admin" as const, org_id: orgId });
      if (roleErr) throw roleErr;

      toast.success("Restaurant created!");
      // Force a page reload so auth context refetches profile/roles
      window.location.href = "/";
    } catch (err: any) {
      toast.error(err.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Set up your restaurant</CardTitle>
          <CardDescription>Create your organization to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Restaurant Name *</Label>
              <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="My Restaurant" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst">GST Number (optional)</Label>
              <Input id="gst" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="22AAAAA0000A1Z5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Restaurant"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
