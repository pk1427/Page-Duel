import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import type { AdminSession } from "../types";

type AdminSessionStore = {
  status: "loading" | "signed-in" | "signed-out" | "unconfigured";
  userEmail: string | null;
  isAdmin: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; isAdmin: boolean }>;
  signOut: () => Promise<void>;
};

const AdminSessionContext = createContext<AdminSessionStore | null>(null);

function friendlyError(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return "That email and password did not match. Try again.";
  }
  if (/already registered|already exists/i.test(message)) {
    return "That email already has an account. Try signing in instead.";
  }
  if (/password/i.test(message) && /short|length|characters/i.test(message)) {
    return "Use a password of at least 6 characters.";
  }
  return message;
}

function checkAdminClaim(client: ReturnType<typeof getSupabase>): Promise<boolean> {
  return new Promise((resolve) => {
    client!.auth.getSession().then(({ data }) => {
      if (!data.session) {
        resolve(false);
        return;
      }
      const jwt = data.session.access_token;
      try {
        const payload = JSON.parse(atob(jwt.split(".")[1]));
        const isAdmin = payload.admin === true || payload["https://book-people/admin"] === true || payload["admin"] === "true";
        resolve(isAdmin);
      } catch {
        resolve(false);
      }
    });
  });
}

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AdminSessionStore["status"]>(
    isSupabaseConfigured ? "loading" : "unconfigured",
  );
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applySession = useCallback(async (email: string | null | undefined): Promise<boolean> => {
    if (!email) {
      setUserEmail(null);
      setIsAdmin(false);
      setStatus("signed-out");
      return false;
    }
    const client = getSupabase();
    if (!client) {
      setStatus("unconfigured");
      return false;
    }
    setUserEmail(email);
    const adminCheck = await checkAdminClaim(client);
    setIsAdmin(adminCheck);
    setStatus("signed-in");
    return adminCheck;
  }, []);

  useEffect(() => {
    const client = getSupabase();
    if (!client) return;
    let active = true;
    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session?.user?.email) {
        void applySession(data.session.user.email);
      } else {
        setStatus("signed-out");
      }
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user?.email) {
        void applySession(session.user.email);
      } else {
        setUserEmail(null);
        setIsAdmin(false);
        setStatus("signed-out");
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [applySession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const client = getSupabase();
      if (!client) {
        setError("Sign-in is unavailable: no backend is configured.");
        return { ok: false, isAdmin: false };
      }
      setError(null);
      const { data, error: signInError } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(friendlyError(signInError.message));
        return { ok: false, isAdmin: false };
      }
      if (data.session?.user?.email) {
        const admin = await applySession(data.session.user.email);
        if (!admin) setError("This account is not authorized to access the admin dashboard.");
        return { ok: true, isAdmin: admin };
      }
      return { ok: false, isAdmin: false };
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    const client = getSupabase();
    if (!client) return;
    await client.auth.signOut();
    setUserEmail(null);
    setIsAdmin(false);
    setError(null);
    setStatus("signed-out");
  }, []);

  return (
    <AdminSessionContext.Provider
      value={{ status, userEmail, isAdmin, error, signIn, signOut }}
    >
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession(): AdminSessionStore {
  const store = useContext(AdminSessionContext);
  if (!store) throw new Error("Admin session provider is missing");
  return store;
}
