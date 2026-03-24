import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, UtensilsCrossed, Receipt, BarChart3 } from "lucide-react";

const mobileNav = [
  { icon: LayoutDashboard, path: "/", label: "Home" },
  { icon: ShoppingCart, path: "/pos", label: "POS" },
  { icon: PackageSearch, path: "/menu", label: "Inventory" },
  { icon: Receipt, path: "/orders", label: "Orders" },
  { icon: BarChart3, path: "/analytics", label: "More" },
];

export default function MobileNav() {
  const { pathname } = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t z-50">
      <div className="flex justify-around py-2">
        {mobileNav.map((item) => {
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
