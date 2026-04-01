import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Search, X, UserPlus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export interface SelectedCustomer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface CustomerSelectorProps {
  selected: SelectedCustomer | null;
  onSelect: (customer: SelectedCustomer | null) => void;
}

export default function CustomerSelector({ selected, onSelect }: CustomerSelectorProps) {
  const { orgId } = useAuth();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: customers = [], refetch } = useQuery({
    queryKey: ["pos_customers", orgId, search],
    queryFn: async () => {
      if (!orgId || !search) return [];
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone, email")
        .eq("org_id", orgId)
        .or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
        .order("name")
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!orgId && search.length > 0,
  });

  const handleSelect = (c: typeof customers[0]) => {
    onSelect({ id: c.id, name: c.name, phone: c.phone, email: c.email });
    setSearch("");
    setOpen(false);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    if (!form.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .insert({ org_id: orgId, name: form.name, phone: form.phone || null, email: form.email || null })
        .select("id, name, phone, email")
        .single();
      if (error) throw error;
      onSelect(data);
      setAddOpen(false);
      setForm({ name: "", phone: "", email: "" });
      setOpen(false);
      toast.success("Customer added");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (selected) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
        <User className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{selected.name}</p>
          {selected.phone && <p className="text-xs text-muted-foreground">{selected.phone}</p>}
        </div>
        <button onClick={() => onSelect(null)} className="text-muted-foreground hover:text-destructive">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search customer by name or phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(e.target.value.length > 0);
          }}
          onFocus={() => search.length > 0 && setOpen(true)}
          className="pl-10 pr-10"
        />
        <button
          onClick={() => setAddOpen(true)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
          title="Add new customer"
        >
          <UserPlus className="h-4 w-4" />
        </button>

        {open && search.length > 0 && (
          <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {customers.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                No customers found
                <Button variant="link" size="sm" className="ml-1 p-0 h-auto" onClick={() => { setAddOpen(true); setOpen(false); }}>
                  Add new
                </Button>
              </div>
            ) : (
              customers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent/50 text-left transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {c.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.phone || c.email || "—"}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving..." : "Add & Select"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
