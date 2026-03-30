import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  ShoppingCart,
  PackageSearch,
  Users,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "POS", icon: ShoppingCart, path: "/pos" },
  { label: "Inventory", icon: PackageSearch, path: "/menu" },
  { label: "Orders", icon: Receipt, path: "/orders" },
  { label: "Customers", icon: Users, path: "/customers" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function AppSidebar() {
  const { pathname } = useLocation();
  const { signOut, profile, orgId, userOrgs, switchOrg } = useAuth();

  const activeOrg = userOrgs.find((o) => o.id === orgId);

  const handleSwitch = async (id: string) => {
    if (id === orgId) return;
    try {
      await switchOrg(id);
      toast.success("Switched organization");
    } catch {
      toast.error("Failed to switch");
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <PackageSearch className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-sm">Smart POS</h1>
          <p className="text-xs text-sidebar-foreground/60">Business Suite</p>
        </div>
      </div>

      {/* Org Switcher */}
      {userOrgs.length > 1 && (
        <div className="px-3 pt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-sidebar-border bg-sidebar-accent/50 hover:bg-sidebar-accent text-sm transition-colors">
                <div className="h-6 w-6 rounded bg-sidebar-primary/20 flex items-center justify-center text-[10px] font-bold text-sidebar-primary shrink-0">
                  {activeOrg?.name?.[0]?.toUpperCase() || "O"}
                </div>
                <span className="flex-1 text-left truncate font-medium">{activeOrg?.name || "Organization"}</span>
                <ChevronsUpDown className="h-3.5 w-3.5 text-sidebar-foreground/50 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {userOrgs.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleSwitch(org.id)}
                  className="flex items-center gap-2"
                >
                  <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                    {org.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{org.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{org.role}</p>
                  </div>
                  {org.id === orgId && <Check className="h-4 w-4 text-primary shrink-0" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-xs font-bold text-sidebar-primary">
            {profile?.full_name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.full_name || "User"}</p>
          </div>
          <button onClick={signOut} className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
