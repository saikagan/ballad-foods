import { useState, useEffect } from "react";
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
  ShoppingCart, Shirt, Wrench, CakeSlice, Scissors, MoreHorizontal, ShieldAlert, LogOut,
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
  const { user, refreshUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<IndustryValue[]>(["restaurant"]);
  const [gstNumber, setGstNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [canCreateOrg, setCanCreateOrg] = useState(false);
  const [duplicateOrgId, setDuplicateOrgId] = useState<string | null>(null);

  useEffect(() => {
    // Only allow org creation if no organizations exist yet (first admin setup)
    const checkOrgs = async () => {
      const { count } = await supabase
        .from("organizations")
        .select("id", { count: "exact", head: true });
      setCanCreateOrg(count === 0);
      setChecking(false);
    };
    checkOrgs();
  }, []);

  const toggleIndustry = (value: IndustryValue) => {
    setSelectedIndustries((prev) =>
      prev.includes(value)
        ? prev.length > 1 ? prev.filter((v) => v !== value) : prev
        : [...prev, value]
    );
  };

  const handleCreate = async (e: React.FormEvent, joinExisting = false) => {
    e.preventDefault();
    if (!user || selectedIndustries.length === 0) return;
    setLoading(true);
    setDuplicateOrgId(null);

    try {
      const orgId = crypto.randomUUID();
      const primaryIndustry = selectedIndustries[0];

      const { error } = await supabase.rpc("setup_onboarding", {
        _org_id: orgId,
        _org_name: orgName,
        _industry: primaryIndustry,
        _gst_number: gstNumber || null,
        _phone: phone || null,
        _industries: selectedIndustries,
        _join_existing: joinExisting,
      } as any);
      if (error) throw error;

      toast.success(joinExisting ? "Joined organization as Admin!" : "Business created!");
      await refreshUser();
      navigate("/");
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.startsWith("ORG_EXISTS:")) {
        const existingId = msg.split("ORG_EXISTS:")[1]?.trim();
        setDuplicateOrgId(existingId || "unknown");
      } else {
        toast.error(msg || "Failed to create organization");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinExisting = async () => {
    // Re-submit with join flag
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    await handleCreate(fakeEvent, true);
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Non-admin users who weren't added by an admin — show waiting message
  if (!canCreateOrg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md animate-scale-in text-center">
          <CardHeader className="space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
              <ShieldAlert className="h-7 w-7 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl font-bold">Access Pending</CardTitle>
            <CardDescription className="text-base">
              You need to be added to an organization by an admin. Please contact your administrator to get access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            {duplicateOrgId && (
              <div className="rounded-lg border-2 border-destructive/50 bg-accent p-4 space-y-3">
                <p className="text-sm font-medium text-accent-foreground">
                  An organization named "<span className="font-bold">{orgName}</span>" already exists.
                </p>
                <p className="text-xs text-muted-foreground">
                  Would you like to join it as an Admin? You'll have full access and can manage users from Settings.
                </p>
                <div className="flex gap-2">
                  <Button type="button" onClick={handleJoinExisting} disabled={loading} className="flex-1">
                    {loading ? "Joining..." : "Join as Admin"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDuplicateOrgId(null)} className="flex-1">
                    Change Name
                  </Button>
                </div>
              </div>
            )}
            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading || selectedIndustries.length === 0}>
              {loading ? "Creating..." : "Create Business"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
