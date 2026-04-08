import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Menu from "./pages/Menu";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Analytics from "./pages/Analytics";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading, orgId, hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  if (!orgId) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/pos" element={<POS />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/customers" element={<Customers />} />
      {/* Admin-only routes */}
      <Route path="/menu" element={isAdmin ? <Menu /> : <Navigate to="/" replace />} />
      <Route path="/analytics" element={isAdmin ? <Analytics /> : <Navigate to="/" replace />} />
      <Route path="/settings" element={isAdmin ? <SettingsPage /> : <Navigate to="/" replace />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
