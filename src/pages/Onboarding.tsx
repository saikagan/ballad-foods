import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Building2, UtensilsCrossed, ShoppingBag, Pill, Monitor,
  ShoppingCart, Shirt, Wrench, CakeSlice, Scissors, MoreHorizontal,
} from "lucide-react";

const industries = [
  { value: "restaurant", label: "Restaurant", icon: UtensilsCrossed },
  { value: "retail", label: "Retail Store", icon: ShoppingBag },
  { value: "pharmacy", label: "Pharmacy", icon: Pill },
  { value: "electronics", label: "Electronics", icon: Monitor },
  { value: "grocery", label: "Grocery", icon: ShoppingCart },
  { value: "clothing", label: "Clothing", icon: Shirt },
  { value: "hardware", label: "Hardware", icon: Wrench },
  { value: "bakery", label: "Bakery", icon: CakeSlice },
  { value: "salon", label: "Salon", icon: Scissors },
  { value: "other", label: "Other", icon: MoreHorizontal },
] as const;

type IndustryValue = (typeof industries)[number]["value"];

export default function Onboarding() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<IndustryValue[]>(["restaurant"]);
  const [gstNumber, setGstNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleIndustry = (value: IndustryValue) => {
    setSelectedIndustries((prev) =>
      prev.includes(value)
        ? prev.length > 1 ? prev.filter((v) => v !== value) : prev
        : [...prev, value]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || selectedIndustries.length === 0) return;
    setLoading(true);

    try {
      const orgId = crypto.randomUUID();
      const primaryIndustry = selectedIndustries[0];

      // 1. Create org with primary industry
      const { error: orgErr } = await supabase
        .from("organizations")
        .insert({
          id: orgId,
          name: orgName,
          industry: primaryIndustry as any,
          gst_number: gstNumber || null,
          phone: phone || null,
        });
      if (orgErr) throw orgErr;

      // 2. Update profile with org_id
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ org_id: orgId })
        .eq("user_id", user.id);
      if (profileErr) throw profileErr;

      // 3. Insert admin role
      const { error: roleErr } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "admin" as const, org_id: orgId });
      if (roleErr) throw roleErr;

      // 4. Insert all selected industries
      const industryRows = selectedIndustries.map((ind) => ({
        org_id: orgId,
        industry: ind as any,
      }));
      const { error: indErr } = await supabase
        .from("organization_industries")
        .insert(industryRows);
      if (indErr) throw indErr;

      toast.success("Business created!");
      await refreshUser();
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg animate-scale-in">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Set up your business</CardTitle>
          <CardDescription>Select your industries and create your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-5">
            {/* Industry Selection - Multi */}
            <div className="space-y-2">
              <Label>Industries * <span className="text-xs text-muted-foreground">(select one or more)</span></Label>
              <div className="grid grid-cols-5 gap-2">
                {industries.map((ind) => {
                  const Icon = ind.icon;
                  const isSelected = selectedIndustries.includes(ind.value);
                  return (
                    <button
                      key={ind.value}
                      type="button"
                      onClick={() => toggleIndustry(ind.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[10px] font-medium leading-tight">{ind.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgName">Business Name *</Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="My Business"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gst">GST Number</Label>
                <Input
                  id="gst"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading || selectedIndustries.length === 0}>
              {loading ? "Creating..." : "Create Business"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
