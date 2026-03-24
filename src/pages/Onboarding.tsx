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
  const [industry, setIndustry] = useState<IndustryValue>("restaurant");
  const [gstNumber, setGstNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const orgId = crypto.randomUUID();

      const { error: orgErr } = await supabase
        .from("organizations")
        .insert({
          id: orgId,
          name: orgName,
          industry: industry as any,
          gst_number: gstNumber || null,
          phone: phone || null,
        });
      if (orgErr) throw orgErr;

      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ org_id: orgId })
        .eq("user_id", user.id);
      if (profileErr) throw profileErr;

      const { error: roleErr } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "admin" as const, org_id: orgId });
      if (roleErr) throw roleErr;

      toast.success("Business created!");
      await refreshUser();
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  const selected = industries.find((i) => i.value === industry);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg animate-scale-in">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Set up your business</CardTitle>
          <CardDescription>Choose your industry and create your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-5">
            {/* Industry Selection */}
            <div className="space-y-2">
              <Label>Industry *</Label>
              <div className="grid grid-cols-5 gap-2">
                {industries.map((ind) => {
                  const Icon = ind.icon;
                  const isSelected = industry === ind.value;
                  return (
                    <button
                      key={ind.value}
                      type="button"
                      onClick={() => setIndustry(ind.value)}
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
                placeholder={`My ${selected?.label || "Business"}`}
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
            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
              {loading ? "Creating..." : `Create ${selected?.label || "Business"}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
