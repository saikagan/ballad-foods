import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserOrg {
  id: string;
  name: string;
  role: AppRole;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: {
    full_name: string | null;
    org_id: string | null;
  } | null;
  roles: AppRole[];
  loading: boolean;
  orgId: string | null;
  userOrgs: UserOrg[];
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, fullName: string, orgName?: string, industries?: string[], joinOrgId?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  refreshUser: () => Promise<void>;
  switchOrg: (orgId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    roles: [],
    loading: true,
    orgId: null,
    userOrgs: [],
  });

  const fetchUserData = async (userId: string) => {
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("full_name, org_id").eq("user_id", userId).maybeSingle(),
      supabase.from("user_roles").select("role, org_id").eq("user_id", userId),
    ]);

    const profile = profileRes.data;
    const rolesData = rolesRes.data || [];
    const roles = rolesData.filter((r) => r.org_id === profile?.org_id).map((r) => r.role);

    // Fetch org names for all user orgs
    const orgIds = [...new Set(rolesData.map((r) => r.org_id))];
    let userOrgs: UserOrg[] = [];
    if (orgIds.length > 0) {
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name")
        .in("id", orgIds);
      const orgMap = new Map((orgs || []).map((o) => [o.id, o.name]));
      userOrgs = rolesData.map((r) => ({
        id: r.org_id,
        name: orgMap.get(r.org_id) || "Unknown",
        role: r.role,
      }));
      // Deduplicate by org_id (take first role)
      const seen = new Set<string>();
      userOrgs = userOrgs.filter((o) => {
        if (seen.has(o.id)) return false;
        seen.add(o.id);
        return true;
      });
    }

    setState((prev) => ({
      ...prev,
      profile,
      roles,
      orgId: profile?.org_id || null,
      userOrgs,
      loading: false,
    }));
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState((prev) => ({ ...prev, session, user: session?.user ?? null, loading: !!session?.user }));
        if (session?.user) {
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setState((prev) => ({ ...prev, profile: null, roles: [], orgId: null, userOrgs: [], loading: false }));
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((prev) => ({ ...prev, session, user: session?.user ?? null }));
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, orgName?: string, industries?: string[], joinOrgId?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          ...(joinOrgId ? { join_org_id: joinOrgId } : {}),
          ...(orgName ? { org_name: orgName } : {}),
          ...(industries && industries.length > 0 ? { industries } : {}),
        },
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasRole = (role: AppRole) => state.roles.includes(role);

  const switchOrg = async (newOrgId: string) => {
    if (!state.user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ org_id: newOrgId })
      .eq("user_id", state.user.id);
    if (error) throw error;
    await fetchUserData(state.user.id);
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUserData(session.user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, signUp, signIn, signOut, hasRole, refreshUser, switchOrg }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
