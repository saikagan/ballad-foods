import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Search, Plus, Check, LogOut as LeaveIcon } from "lucide-react";

interface OrgResult {
  id: string;
  name: string;
  industry: string;
}

export default function OrgMemberships() {
  const { user, orgId, userOrgs, switchOrg, refreshUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OrgResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);

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
      // Filter out orgs user already belongs to
      const memberOrgIds = new Set(userOrgs.map((o) => o.id));
      setSearchResults(((data as OrgResult[]) || []).filter((o) => !memberOrgIds.has(o.id)));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleJoin = async (org: OrgResult) => {
    if (!user) return;
    setJoining(org.id);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "cashier" as const, org_id: org.id });
      if (error) throw error;
      toast.success(`Joined ${org.name}`);
      setSearchQuery("");
      setSearchResults([]);
      await refreshUser();
    } catch (err: any) {
      toast.error(err.message || "Failed to join");
    } finally {
      setJoining(null);
    }
  };

  const handleLeave = async (leaveOrgId: string, orgName: string) => {
    if (!user) return;
    if (userOrgs.length <= 1) {
      toast.error("You must belong to at least one organization");
      return;
    }
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user.id)
        .eq("org_id", leaveOrgId);
      if (error) throw error;

      // If leaving active org, switch to another
      if (leaveOrgId === orgId) {
        const remaining = userOrgs.find((o) => o.id !== leaveOrgId);
        if (remaining) await switchOrg(remaining.id);
      }

      toast.success(`Left ${orgName}`);
      await refreshUser();
    } catch (err: any) {
      toast.error(err.message || "Failed to leave");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base">My Organizations</CardTitle>
            <CardDescription>Manage your organization memberships</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current memberships */}
        <div className="space-y-2">
          {userOrgs.map((org) => (
            <div
              key={org.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                org.id === orgId ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {org.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{org.name}</p>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="capitalize text-[10px] h-4 px-1.5">{org.role}</Badge>
                  {org.id === orgId && (
                    <span className="flex items-center gap-0.5 text-[10px] text-primary font-medium">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {org.id !== orgId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => switchOrg(org.id).then(() => toast.success("Switched")).catch(() => toast.error("Failed"))}
                    className="text-xs h-7"
                  >
                    Switch
                  </Button>
                )}
                {org.role !== "admin" && userOrgs.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLeave(org.id, org.name)}
                    className="text-xs h-7 text-destructive hover:text-destructive"
                  >
                    <LeaveIcon className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Join new org */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Join another organization</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by business name..."
              className="pl-9"
            />
          </div>
          {searching && <p className="text-xs text-muted-foreground">Searching...</p>}
          {searchResults.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {searchResults.map((org) => (
                <div key={org.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{org.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{org.industry}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleJoin(org)}
                    disabled={joining === org.id}
                    className="h-7 text-xs gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    {joining === org.id ? "Joining..." : "Join"}
                  </Button>
                </div>
              ))}
            </div>
          )}
          {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">No organizations found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
