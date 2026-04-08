import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import MobileNav from "./MobileNav";
import logo from "@/assets/BalladFoodLogo.jpeg";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-end px-4 py-2 border-b border-border shrink-0">
          <img src={logo} alt="Ballad Foods" className="h-10 w-auto rounded" />
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
