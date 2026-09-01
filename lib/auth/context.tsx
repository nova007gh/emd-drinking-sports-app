"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { AppRole } from "@/lib/types";
import { hasPermission, type Permission } from "@/lib/auth/roles";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  avatarUrl?: string;
}

interface AuthContextValue {
  role: AppRole;
  setRole: (role: AppRole) => void;
  can: (permission: Permission) => boolean;
  userName: string;
  setUserName: (name: string) => void;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  avatarUrl: string | undefined;
  uploadAvatar: (file: File) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "emd-auth-session";

const demoUsers: Array<{ email: string; password: string; name: string; role: AppRole }> = [
  { email: "owner@emd.com", password: "owner123", name: "Emmanuel", role: "owner" },
  { email: "manager@emd.com", password: "manager123", name: "Yaw", role: "manager" },
  { email: "cashier@emd.com", password: "cashier123", name: "Ama", role: "cashier" },
  { email: "waiter@emd.com", password: "waiter123", name: "Kojo", role: "waiter" }
];

function getSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const isDemoMode = !getSupabaseConfigured();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [role, setRoleState] = useState<AppRole>("owner");
  const [userName, setUserName] = useState("Emmanuel");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    const restoreSession = async () => {
      if (isDemoMode) {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored) as AuthUser;
            setUser(parsed);
            setRoleState(parsed.role);
            setUserName(parsed.name);
            setAvatarUrl(parsed.avatarUrl);
          }
        } catch {}
        setIsLoading(false);
        return;
      }

      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile, error: profileErr } = await supabase
            .from("profiles")
            .select("name, role, avatar_url")
            .eq("id", session.user.id)
            .single();
          if (profileErr) {
            const meta = session.user.user_metadata as { name?: string; role?: string; full_name?: string };
            const authUser: AuthUser = {
              id: session.user.id,
              email: session.user.email ?? "",
              name: meta?.name ?? meta?.full_name ?? session.user.email?.split("@")[0] ?? "User",
              role: (meta?.role as AppRole) ?? "waiter",
              avatarUrl: undefined
            };
            setUser(authUser);
            setRoleState(authUser.role);
            setUserName(authUser.name);
          } else if (profile) {
            const authUser: AuthUser = {
              id: session.user.id,
              email: session.user.email ?? "",
              name: (profile as { name: string }).name,
              role: profile.role as AppRole,
              avatarUrl: (profile as { avatar_url?: string }).avatar_url
            };
            setUser(authUser);
            setRoleState(authUser.role);
            setUserName(authUser.name);
            setAvatarUrl(authUser.avatarUrl);
          }
        }
      } catch {
        // Supabase not configured or error — fall back to demo
      }
      setIsLoading(false);
    };
    restoreSession();
  }, [isDemoMode]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    if (isDemoMode) {
      const found = demoUsers.find((u) => u.email === email && u.password === password);
      if (!found) return { error: "Invalid email or password. Try owner@emd.com / owner123" };
      const authUser: AuthUser = {
        id: `demo-${found.role}`,
        email: found.email,
        name: found.name,
        role: found.role,
        avatarUrl: avatarUrl
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);
      setRoleState(found.role);
      setUserName(found.name);
      return { error: null };
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (data.user) {
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("name, role, avatar_url")
          .eq("id", data.user.id)
          .single();
        if (profileErr) {
          // Profile fetch failed — fall back to user_metadata so login still works
          const meta = data.user.user_metadata as { name?: string; role?: string; full_name?: string };
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email ?? "",
            name: meta?.name ?? meta?.full_name ?? email.split("@")[0],
            role: (meta?.role as AppRole) ?? "waiter",
            avatarUrl: undefined
          };
          setUser(authUser);
          setRoleState(authUser.role);
          setUserName(authUser.name);
        } else if (profile) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email ?? "",
            name: (profile as { name: string }).name,
            role: profile.role as AppRole,
            avatarUrl: (profile as { avatar_url?: string }).avatar_url
          };
          setUser(authUser);
          setRoleState(authUser.role);
          setUserName(authUser.name);
          setAvatarUrl(authUser.avatarUrl);
        }
      }
      return { error: null };
    } catch {
      return { error: "Unable to connect to authentication service." };
    }
  }, [isDemoMode]);

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
      return;
    }
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
  }, [isDemoMode]);

  const setRole = useCallback((newRole: AppRole) => {
    setRoleState(newRole);
    if (isDemoMode) {
      // In demo mode, switching role switches to the demo user for that role
      const demoUser = demoUsers.find((u) => u.role === newRole);
      if (demoUser) {
        // Each demo user may have their own saved avatar
        const stored = localStorage.getItem(`${STORAGE_KEY}-avatar-${demoUser.role}`);
        const savedAvatar = stored ?? undefined;
        const authUser: AuthUser = {
          id: `demo-${newRole}`,
          email: demoUser.email,
          name: demoUser.name,
          role: newRole,
          avatarUrl: savedAvatar
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
        setUser(authUser);
        setUserName(demoUser.name);
        setAvatarUrl(savedAvatar);
      }
    } else if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
    }
  }, [user, isDemoMode]);

  const can = useCallback((permission: Permission) => hasPermission(role, permission), [role]);

  const uploadAvatar = useCallback(async (file: File): Promise<{ error: string | null }> => {
    if (!file.type.startsWith("image/")) return { error: "Please select an image file" };
    if (file.size > 2 * 1024 * 1024) return { error: "Image must be under 2MB" };

    if (isDemoMode) {
      // Demo mode: convert to data URL and store in localStorage per-role
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          setAvatarUrl(dataUrl);
          if (user) {
            // Save avatar per-role so each demo user has their own
            localStorage.setItem(`${STORAGE_KEY}-avatar-${user.role}`, dataUrl);
            const updated = { ...user, avatarUrl: dataUrl };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            setUser(updated);
          }
          resolve({ error: null });
        };
        reader.onerror = () => resolve({ error: "Failed to read image" });
        reader.readAsDataURL(file);
      });
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) return { error: data.error ?? "Upload failed" };
      setAvatarUrl(data.url);
      if (user) setUser({ ...user, avatarUrl: data.url });
      return { error: null };
    } catch {
      return { error: "Failed to upload avatar" };
    }
  }, [isDemoMode, user]);

  return (
    <AuthContext.Provider value={{
      role, setRole, can, userName, setUserName,
      user, isAuthenticated: !!user, isLoading, isDemoMode,
      avatarUrl, uploadAvatar,
      signIn, signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
