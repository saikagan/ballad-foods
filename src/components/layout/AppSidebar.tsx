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
} from "lucide-react";
import logo from "@/assets/BalladFoodLogo.jpeg";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/", adminOnly: false },
  { label: "POS", icon: ShoppingCart, path: "/pos", adminOnly: false },
  { label: "Menu Items", icon: PackageSearch, path: "/menu", adminOnly: true },
  { label: "Orders", icon: Receipt, path: "/orders", adminOnly: false },
  { label: "Customers", icon: Users, path: "/customers", adminOnly: false },
  { label: "Analytics", icon: BarChart3, path: "/analytics", adminOnly: true },
  { label: "Settings", icon: Settings, path: "/settings", adminOnly: true },
];

export default function AppSidebar() {
  const { pathname } = useLocation();
  const { signOut, profile, hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const canAccessMenu = isAdmin || hasRole("manager") || hasRole("cashier");

  const visibleItems = navItems.filter((item) => {
    if (item.path === "/menu") return canAccessMenu;
    return !item.adminOnly || isAdmin;
  });

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <img src={logo} alt="Ballad Foods" className="h-9 w-9 rounded-lg object-cover" />
        <div>
          <h1 className="font-bold text-sm">Ballad Foods</h1>
          <p className="text-xs text-sidebar-foreground/60">Business Suite</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
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
