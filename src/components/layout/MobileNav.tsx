import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { LayoutDashboard, ShoppingCart, PackageSearch, Receipt, Users } from "lucide-react";

const mobileNav = [
  { icon: LayoutDashboard, path: "/", label: "Home", adminOnly: false },
  { icon: ShoppingCart, path: "/pos", label: "POS", adminOnly: false },
  { icon: PackageSearch, path: "/menu", label: "Menu Items", adminOnly: true },
  { icon: Receipt, path: "/orders", label: "Orders", adminOnly: false },
  { icon: Users, path: "/customers", label: "Customers", adminOnly: false },
];

export default function MobileNav() {
  const { pathname } = useLocation();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const canAccessMenu = isAdmin || hasRole("manager") || hasRole("cashier");

  const visibleItems = mobileNav.filter((item) => {
    if (item.path === "/menu") return canAccessMenu;
    return !item.adminOnly || isAdmin;
  });

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t z-50">
      <div className="flex justify-around py-2">
        {visibleItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors ${
                isActive ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
