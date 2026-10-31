import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import { validateDisplayName } from "./auth-routing";
import {
  authDiagnosticFrom,
  friendlyAuthError,
  sessionStatusForEmail,
  type AuthDiagnostic,
} from "./auth-diagnostics";
import { copy } from "./copy";

export type SessionStatus = "loading" | "signed-in" | "signed-out" | "unconfigured";

export type { AuthDiagnostic } from "./auth-diagnostics";

type SessionStore = {
  status: SessionStatus;
  userEmail: string | null;
  displayName: string | null;
  error: string | null;
  authDiagnostic: AuthDiagnostic | null;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; needsConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean }>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<{ ok: boolean }>;
};

const SessionContext = createContext<SessionStore | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>(
    isSupabaseConfigured ? "loading" : "unconfigured",
  );
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authDiagnostic, setAuthDiagnostic] = useState<AuthDiagnostic | null>(null);

  const applySession = useCallback(async (email: string | null | undefined) => {
    if (!email) {
      setUserEmail(null);
      setDisplayName(null);
      setStatus(sessionStatusForEmail(email));
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
        setError(copy.auth.signInUnavailable);
        return { ok: false };
      }
      setError(null);
      setAuthDiagnostic(null);
      let data: unknown;
      let signUpError: unknown;
      try {
        ({ data, error: signUpError } = await client.auth.signUp({
          email: email.trim(),
          password,
        }));
      } catch (thrown) {
        const thrownMessage =
          thrown && typeof thrown === "object" && "message" in thrown
            ? String((thrown as { message?: string }).message)
            : String(thrown);
        setError(friendlyAuthError(thrownMessage));
        setAuthDiagnostic(authDiagnosticFrom(thrown));
        return { ok: false };
      }
      if (signUpError) {
        const errorMessage =
          signUpError && typeof signUpError === "object" && "message" in signUpError
            ? String((signUpError as { message?: string }).message)
            : String(signUpError);
        setError(friendlyAuthError(errorMessage));
        setAuthDiagnostic(authDiagnosticFrom(signUpError));
        return { ok: false };
      }
      const signedUp = data as {
        session?: { user?: { email?: string | null } | null } | undefined;
        user?: { email?: string | null } | undefined;
      } | null;
      if (signedUp?.session?.user?.email) {
        await applySession(signedUp.session.user.email);
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
        setError(copy.auth.signInUnavailable);
        return { ok: false };
      }
      setError(null);
      setAuthDiagnostic(null);
      let data: Awaited<ReturnType<typeof client.auth.signInWithPassword>>["data"];
      let signInError: unknown;
      try {
        ({ data, error: signInError } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        }));
      } catch (thrown) {
        const diagnostic = authDiagnosticFrom(thrown);
        setError(friendlyAuthError(diagnostic.message));
        setAuthDiagnostic(diagnostic);
        return { ok: false };
      }
      if (signInError) {
        const diagnostic = authDiagnosticFrom(signInError);
        setError(friendlyAuthError(diagnostic.message));
        setAuthDiagnostic(diagnostic);
        return { ok: false };
      }
      await applySession(data?.session?.user?.email);
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
    setAuthDiagnostic(null);
    setStatus("signed-out");
  }, []);

  const updateDisplayName: SessionStore["updateDisplayName"] = useCallback(async (name) => {
    const client = getSupabase();
    if (!client) {
      setError(copy.auth.signInUnavailable);
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
      setError(copy.errors.sessionExpired);
      return { ok: false };
    }
    const { data, error: updateError } = await client
      .from("profiles")
      .update({ display_name: clean })
      .eq("user_id", userData.user.id)
      .select("display_name")
      .single();
    if (updateError) {
      setError(copy.errors.saveName);
      return { ok: false };
    }
    setDisplayName(data?.display_name ?? clean);
    return { ok: true };
  }, []);

  return (
    <SessionContext.Provider
      value={{ status, userEmail, displayName, error, authDiagnostic, signUp, signIn, signOut, updateDisplayName }}
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
