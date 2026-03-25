import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  UtensilsCrossed, ShoppingBag, Pill, Monitor,
  ShoppingCart, Shirt, Wrench, CakeSlice, Scissors, MoreHorizontal, Zap,
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

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<IndustryValue[]>([]);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const toggleIndustry = (value: IndustryValue) => {
    setSelectedIndustries((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && selectedIndustries.length === 0) {
      toast.error("Please select at least one industry");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        navigate("/");
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" required />
                </div>
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
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
