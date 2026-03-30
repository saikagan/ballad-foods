import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  UtensilsCrossed, ShoppingBag, Pill, Monitor,
  ShoppingCart, Shirt, Wrench, CakeSlice, Scissors, MoreHorizontal, Zap,
  Building2, Search, Plus, ArrowLeft,
} from "lucide-react";

const industries = [
  { value: "restaurant", label: "Restaurant", icon: UtensilsCrossed },
  { value: "retail", label: "Retail", icon: ShoppingBag },
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

interface OrgResult {
  id: string;
  name: string;
  industry: string;
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [signupMode, setSignupMode] = useState<"choose" | "create" | "join">("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<IndustryValue[]>([]);
  const [loading, setLoading] = useState(false);

  // Join mode state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OrgResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrgResult | null>(null);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const toggleIndustry = (value: IndustryValue) => {
    setSelectedIndustries((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data, error } = await supabase.rpc("search_organizations", { _query: query });
      if (error) throw error;
      setSearchResults((data as OrgResult[]) || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && signupMode === "create" && selectedIndustries.length === 0) {
      toast.error("Please select at least one industry");
      return;
    }
    if (!isLogin && signupMode === "join" && !selectedOrg) {
      toast.error("Please select an organization to join");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        navigate("/");
      } else if (signupMode === "join") {
        await signUp(email, password, fullName, undefined, undefined, selectedOrg!.id);
        toast.success("Account created! Check your email to confirm.");
      } else {
        await signUp(email, password, fullName, orgName, selectedIndustries);
        toast.success("Account created! Check your email to confirm.");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const resetSignup = () => {
    setSignupMode("choose");
    setSelectedOrg(null);
    setSearchQuery("");
    setSearchResults([]);
    setOrgName("");
    setSelectedIndustries([]);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Zap className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isLogin ? "Welcome back" : "Create your account"}
          </CardTitle>
          <CardDescription>
            {isLogin ? "Sign in to your Smart POS dashboard" : "Set up your Smart POS in one step"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Sign-up mode chooser */}
          {!isLogin && signupMode === "choose" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setSignupMode("create")}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-border hover:border-primary/40 transition-all text-left"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Create a new business</p>
                  <p className="text-xs text-muted-foreground">Set up your own organization</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSignupMode("join")}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-border hover:border-primary/40 transition-all text-left"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Join an existing business</p>
                  <p className="text-xs text-muted-foreground">Search and join your team</p>
                </div>
              </button>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button onClick={() => setIsLogin(true)} className="text-primary font-medium hover:underline">
                  Sign in
                </button>
              </div>
            </div>
          )}

          {/* Sign-up forms */}
          {!isLogin && signupMode !== "choose" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <button
                type="button"
                onClick={resetSignup}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" required />
              </div>

              {signupMode === "create" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Business Name</Label>
                    <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="My Business" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Industries <span className="text-xs text-muted-foreground">(select one or more)</span></Label>
                    <div className="grid grid-cols-5 gap-2">
                      {industries.map((ind) => {
                        const Icon = ind.icon;
                        const isSelected = selectedIndustries.includes(ind.value);
                        return (
                          <button
                            key={ind.value}
                            type="button"
                            onClick={() => toggleIndustry(ind.value)}
                            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-center ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="text-[9px] font-medium leading-tight">{ind.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {signupMode === "join" && (
                <div className="space-y-2">
                  <Label>Search Organization</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Type business name..."
                      className="pl-9"
                    />
                  </div>
                  {searching && <p className="text-xs text-muted-foreground">Searching...</p>}
                  {searchResults.length > 0 && (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {searchResults.map((org) => (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => setSelectedOrg(org)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                            selectedOrg?.id === org.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{org.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{org.industry}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">No organizations found</p>
                  )}
                  {selectedOrg && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                      <Building2 className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium">Joining: {selectedOrg.name}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait..." : signupMode === "join" ? "Join & Create Account" : "Create Account"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button type="button" onClick={() => { setIsLogin(true); resetSignup(); }} className="text-primary font-medium hover:underline">
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* Login form */}
          {isLogin && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait..." : "Sign In"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button type="button" onClick={() => setIsLogin(false)} className="text-primary font-medium hover:underline">
                  Sign up
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
