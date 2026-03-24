import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface MenuGridProps {
  onAddItem: (item: { id: string; name: string; price: number; gst_rate: number }) => void;
}

export default function MenuGrid({ onAddItem }: MenuGridProps) {
  const { orgId } = useAuth();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: menuItems = [] } = useQuery({
    queryKey: ["menu_items", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("org_id", orgId)
        .eq("is_available", true)
        .order("category")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const categories = useMemo(() => {
    const cats = [...new Set(menuItems.map((i) => i.category))];
    return cats.sort();
  }, [menuItems]);

  const filtered = useMemo(() => {
    let items = menuItems;
    if (activeCategory) items = items.filter((i) => i.category === activeCategory);
    if (search) {
      const s = search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(s));
    }
    return items;
  }, [menuItems, activeCategory, search]);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search menu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 flex-shrink-0">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            !activeCategory
              ? "bg-pos-category-active text-primary-foreground"
              : "bg-pos-category-inactive text-foreground hover:bg-secondary"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? "bg-pos-category-active text-primary-foreground"
                : "bg-pos-category-inactive text-foreground hover:bg-secondary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto pos-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            {menuItems.length === 0 ? "No menu items yet. Add items in Menu Management." : "No items match your search."}
          </div>
        ) : (
          <div className="pos-grid">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => onAddItem({ id: item.id, name: item.name, price: Number(item.price), gst_rate: Number(item.gst_rate) })}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-pos-item hover:bg-pos-item-hover border border-transparent hover:border-primary/20 transition-all active:scale-95 min-h-[120px] text-center"
              >
                <span className="font-medium text-sm leading-tight mb-2 line-clamp-2">{item.name}</span>
                <span className="font-mono text-base font-semibold text-primary">₹{Number(item.price).toFixed(0)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
