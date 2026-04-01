import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { LogOut, Save, Users, Building2, CreditCard, Shield, Pencil, X, Check } from "lucide-react";
import IndustrySettings from "@/components/settings/IndustrySettings";

export default function SettingsPage() {
  const { orgId, roles, profile, user, signOut, hasRole, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = hasRole("admin");

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

  // Org form state
  const [orgForm, setOrgForm] = useState<Record<string, string>>({});
  const orgValues = {
    name: orgForm.name ?? org?.name ?? "",
    address: orgForm.address ?? org?.address ?? "",
    phone: orgForm.phone ?? org?.phone ?? "",
    email: orgForm.email ?? org?.email ?? "",
    gst_number: orgForm.gst_number ?? org?.gst_number ?? "",
    upi_id: orgForm.upi_id ?? (org as any)?.upi_id ?? "",
  };

  const orgDirty = org && Object.keys(orgForm).length > 0;

  const updateOrg = useMutation({
    mutationFn: async () => {
      if (!orgId) return;
      const { error } = await supabase.from("organizations").update({
        name: orgValues.name,
        address: orgValues.address || null,
        phone: orgValues.phone || null,
        email: orgValues.email || null,
        gst_number: orgValues.gst_number || null,
        upi_id: orgValues.upi_id || null,
      } as any).eq("id", orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", orgId] });
      setOrgForm({});
      toast.success("Organization updated");
    },
    onError: (err: any) => toast.error(err.message || "Update failed"),
  });

  // Team members
  const { data: members } = useQuery({
    queryKey: ["team", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data: rolesData, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("org_id", orgId);
      if (error) throw error;

      if (!rolesData || rolesData.length === 0) return [];

      const userIds = [...new Set(rolesData.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

      return rolesData.map((r) => ({
        userId: r.user_id,
        role: r.role,
        name: profileMap.get(r.user_id) || "Unknown",
      }));
    },
    enabled: !!orgId,
  });

  // Profile name editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");

  useEffect(() => {
    if (profile?.full_name) setNameValue(profile.full_name);
  }, [profile?.full_name]);

  const updateName = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: nameValue.trim() || null })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      refreshUser();
      setEditingName(false);
      toast.success("Name updated");
    },
    onError: (err: any) => toast.error(err.message || "Update failed"),
  });

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
  };

  const setField = (field: string, value: string) => {
    setOrgForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Button variant="outline" onClick={handleSignOut} className="gap-2 text-destructive hover:text-destructive">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Organization Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Organization</CardTitle>
                <CardDescription>
                  {isAdmin ? "Manage your business details" : "View your organization info"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="org-name">Business Name</Label>
                <Input
                  id="org-name"
                  value={orgValues.name}
                  onChange={(e) => setField("name", e.target.value)}
                  disabled={!isAdmin}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org-industry">Industry</Label>
                <Input id="org-industry" value={org?.industry || ""} disabled className="capitalize" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org-phone">Phone</Label>
                <Input
                  id="org-phone"
                  value={orgValues.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  disabled={!isAdmin}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org-email">Email</Label>
                <Input
                  id="org-email"
                  type="email"
                  value={orgValues.email}
                  onChange={(e) => setField("email", e.target.value)}
                  disabled={!isAdmin}
                  placeholder="business@example.com"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="org-address">Address</Label>
                <Input
                  id="org-address"
                  value={orgValues.address}
                  onChange={(e) => setField("address", e.target.value)}
                  disabled={!isAdmin}
                  placeholder="Full business address"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org-gst">GST Number</Label>
                <Input
                  id="org-gst"
                  value={orgValues.gst_number}
                  onChange={(e) => setField("gst_number", e.target.value)}
                  disabled={!isAdmin}
                  placeholder="22AAAAA0000A1Z5"
                  className="font-mono"
                />
              </div>
            </div>

            {isAdmin && orgDirty && (
              <Button onClick={() => updateOrg.mutate()} disabled={updateOrg.isPending} className="gap-2">
                <Save className="h-4 w-4" />
                {updateOrg.isPending ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Industries */}
        <IndustrySettings />

        {/* Payment / UPI */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Payment Settings</CardTitle>
                <CardDescription>Configure UPI for QR code payments</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="upi-id">UPI ID</Label>
              <Input
                id="upi-id"
                value={orgValues.upi_id}
                onChange={(e) => setField("upi_id", e.target.value)}
                disabled={!isAdmin}
                placeholder="yourname@upi"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                This UPI ID will be used to generate QR codes at checkout.
              </p>
            </div>

            {isAdmin && orgForm.upi_id !== undefined && (
              <Button onClick={() => updateOrg.mutate()} disabled={updateOrg.isPending} className="gap-2">
                <Save className="h-4 w-4" />
                {updateOrg.isPending ? "Saving..." : "Save UPI ID"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Your Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Your Profile</CardTitle>
                <CardDescription>Your account information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Name</span>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    className="h-8 w-48 text-sm"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateName.mutate()} disabled={updateName.isPending}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingName(false); setNameValue(profile?.full_name || ""); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{profile?.full_name || "—"}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingName(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-mono text-xs">{user?.email || "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Roles</span>
              <div className="flex gap-1">
                {roles.map((r) => (
                  <Badge key={r} variant="outline" className="capitalize">{r}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Team Members</CardTitle>
                <CardDescription>{members?.length || 0} members in your organization</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(members || []).map((m, i) => (
                <div key={`${m.userId}-${m.role}-${i}`} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {m.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      {m.userId === user?.id && (
                        <p className="text-xs text-muted-foreground">You</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">{m.role}</Badge>
                </div>
              ))}
              {(!members || members.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No team members found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
