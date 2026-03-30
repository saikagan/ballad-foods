import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

const defaultCategories = ["Starters", "Main Course", "Beverages", "Desserts", "Breads", "Rice"];

export default function Menu() {
  const { orgId, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", price: "", category: "Main Course", gst_rate: "5", is_available: true });
  const canEdit = hasRole("admin") || hasRole("manager") || hasRole("cashier");

  const { data: items = [] } = useQuery({
    queryKey: ["menu_items", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from("menu_items").select("*").eq("org_id", orgId).order("category").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org");
      const payload = {
        org_id: orgId,
        name: form.name,
        price: parseFloat(form.price),
        category: form.category,
        gst_rate: parseFloat(form.gst_rate),
        is_available: form.is_available,
      };
      if (editing) {
        const { error } = await supabase.from("menu_items").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("menu_items").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu_items"] });
      setDialogOpen(false);
      setEditing(null);
      setForm({ name: "", price: "", category: "Main Course", gst_rate: "5", is_available: true });
      toast.success(editing ? "Item updated" : "Item added");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu_items"] });
      toast.success("Item deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      name: item.name,
      price: String(item.price),
      category: item.category,
      gst_rate: String(item.gst_rate),
      is_available: item.is_available,
    });
    setDialogOpen(true);
  };

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Menu Management</h1>
          {canEdit && (
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(null); setForm({ name: "", price: "", category: "Main Course", gst_rate: "5", is_available: true }); } }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Add Item</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit Item" : "Add Menu Item"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price (₹) *</Label>
                      <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>GST Rate (%)</Label>
                      <Select value={form.gst_rate} onValueChange={(v) => setForm({ ...form, gst_rate: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="12">12%</SelectItem>
                          <SelectItem value="18">18%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {defaultCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={form.is_available} onCheckedChange={(v) => setForm({ ...form, is_available: v })} />
                    <Label>Available</Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Saving..." : editing ? "Update Item" : "Add Item"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {Object.keys(grouped).length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <p className="text-lg font-medium mb-1">No menu items yet</p>
            <p className="text-sm">Click "Add Item" to create your first menu item.</p>
          </Card>
        ) : (
          Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat} className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-muted-foreground">{cat}</h2>
              <div className="grid gap-2">
                {catItems.map((item) => (
                  <Card key={item.id} className="flex items-center p-4 gap-4">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">GST {Number(item.gst_rate)}%</p>
                    </div>
                    <p className="font-mono font-semibold text-primary">₹{Number(item.price).toFixed(0)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.is_available ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                      {item.is_available ? "Available" : "Unavailable"}
                    </span>
                    {canEdit && (
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(item)} className="p-2 rounded-md hover:bg-secondary transition-colors">
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button onClick={() => deleteMutation.mutate(item.id)} className="p-2 rounded-md hover:bg-destructive/10 transition-colors">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
