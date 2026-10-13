import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import { validateDisplayName } from "./auth-routing";

export type SessionStatus = "loading" | "signed-in" | "signed-out" | "unconfigured";

type SessionStore = {
  status: SessionStatus;
  userEmail: string | null;
  displayName: string | null;
  error: string | null;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; needsConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean }>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<{ ok: boolean }>;
};

const SessionContext = createContext<SessionStore | null>(null);

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

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>(
    isSupabaseConfigured ? "loading" : "unconfigured",
  );
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applySession = useCallback(async (email: string | null | undefined) => {
    if (!email) {
      setUserEmail(null);
      setDisplayName(null);
      setStatus("signed-in");
      return;
    }
    setUserEmail(email);
    setStatus("signed-in");
    try {
      const client = getSupabase();
      const { data } = await client!.from("profiles").select("display_name").single();
      setDisplayName(data?.display_name ?? null);
    } catch {
      setDisplayName(null);
    }
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
        setDisplayName(null);
        setStatus("signed-out");
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [applySession]);

  const signUp: SessionStore["signUp"] = useCallback(
    async (email, password) => {
      const client = getSupabase();
      if (!client) {
        setError("Sign-in is unavailable: no backend is configured.");
        return { ok: false };
      }
      setError(null);
      const { data, error: signUpError } = await client.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signUpError) {
        setError(friendlyError(signUpError.message));
        return { ok: false };
      }
      if (data.session?.user?.email) {
        await applySession(data.session.user.email);
        return { ok: true };
      }
      return { ok: true, needsConfirmation: true };
    },
    [applySession],
  );

  const signIn: SessionStore["signIn"] = useCallback(
    async (email, password) => {
      const client = getSupabase();
      if (!client) {
        setError("Sign-in is unavailable: no backend is configured.");
        return { ok: false };
      }
      setError(null);
      const { data, error: signInError } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(friendlyError(signInError.message));
        return { ok: false };
      }
      await applySession(data.session?.user?.email);
      return { ok: true };
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    const client = getSupabase();
    if (!client) return;
    await client.auth.signOut();
    setUserEmail(null);
    setDisplayName(null);
    setError(null);
    setStatus("signed-out");
  }, []);

  const updateDisplayName: SessionStore["updateDisplayName"] = useCallback(async (name) => {
    const client = getSupabase();
    if (!client) {
      setError("Sign-in is unavailable: no backend is configured.");
      return { ok: false };
    }
    const validationError = validateDisplayName(name);
    if (validationError) {
      setError(validationError);
      return { ok: false };
    }
    const clean = name.trim();
    setError(null);
    // PostgREST refuses filter-less UPDATE/DELETE even when RLS would scope
    // the rows, so target the caller's own row explicitly. The RLS WITH CHECK
    // still rejects any user_id that is not auth.uid().
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData.user) {
      setError("Your session expired. Sign in again, then retry.");
      return { ok: false };
    }
    const { data, error: updateError } = await client
      .from("profiles")
      .update({ display_name: clean })
      .eq("user_id", userData.user.id)
      .select("display_name")
      .single();
    if (updateError) {
      setError("Could not save that name. Try again.");
      return { ok: false };
    }
    setDisplayName(data?.display_name ?? clean);
    return { ok: true };
  }, []);

  return (
    <SessionContext.Provider
      value={{ status, userEmail, displayName, error, signUp, signIn, signOut, updateDisplayName }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionStore {
  const store = useContext(SessionContext);
  if (!store) throw new Error("Session provider is missing");
  return store;
}
