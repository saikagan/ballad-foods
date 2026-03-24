import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save, Store } from "lucide-react";
import {
  UtensilsCrossed, ShoppingBag, Pill, Monitor,
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

export default function IndustrySettings() {
  const { orgId, hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<IndustryValue[]>([]);
  const [dirty, setDirty] = useState(false);

  const { data: currentIndustries } = useQuery({
    queryKey: ["org-industries", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("organization_industries")
        .select("industry")
        .eq("org_id", orgId);
      if (error) throw error;
      return (data || []).map((r) => r.industry as IndustryValue);
    },
    enabled: !!orgId,
  });

  useEffect(() => {
    if (currentIndustries) {
      setSelected(currentIndustries);
      setDirty(false);
    }
  }, [currentIndustries]);

  const toggleIndustry = (value: IndustryValue) => {
    if (!isAdmin) return;
    setSelected((prev) => {
      const next = prev.includes(value)
        ? prev.length > 1 ? prev.filter((v) => v !== value) : prev
        : [...prev, value];
      setDirty(true);
      return next;
    });
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) return;
      // Delete existing
      const { error: delErr } = await supabase
        .from("organization_industries")
        .delete()
        .eq("org_id", orgId);
      if (delErr) throw delErr;

      // Insert new
      const rows = selected.map((ind) => ({ org_id: orgId, industry: ind as any }));
      const { error: insErr } = await supabase
        .from("organization_industries")
        .insert(rows);
      if (insErr) throw insErr;

      // Update primary industry on org
      const { error: orgErr } = await supabase
        .from("organizations")
        .update({ industry: selected[0] as any })
        .eq("id", orgId);
      if (orgErr) throw orgErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-industries", orgId] });
      setDirty(false);
      toast.success("Industries updated");
    },
    onError: (err: any) => toast.error(err.message || "Update failed"),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base">Industries</CardTitle>
            <CardDescription>
              {isAdmin ? "Select the industries your business operates in" : "Your business industries"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-5 gap-2">
          {industries.map((ind) => {
            const Icon = ind.icon;
            const isSelected = selected.includes(ind.value);
            return (
              <button
                key={ind.value}
                type="button"
                onClick={() => toggleIndustry(ind.value)}
                disabled={!isAdmin}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center disabled:opacity-60 ${
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

        {isAdmin && dirty && (
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="gap-2">
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? "Saving..." : "Save Industries"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
