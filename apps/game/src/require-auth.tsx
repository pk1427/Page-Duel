import { router, type Href } from "expo-router";
import { useEffect, type ReactNode } from "react";
import { useSession } from "./session-store";
import { AppButton, EmptyState, Screen } from "./ui";

/**
 * Route-level gate for screens that require authentication.
 * Shows a loading state while the session restores so direct visits and
 * refreshes never flash protected content or bounce to sign-in early.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useSession();

  useEffect(() => {
    if (status === "signed-out") {
      router.replace("/sign-in" as Href);
    }
  }, [status]);

  if (status === "signed-in") return <>{children}</>;

  if (status === "unconfigured") {
    return (
      <Screen>
        <EmptyState
          title="Sign-in is unavailable"
          detail="This build has no backend configured, so the game cannot start. Ask the host to configure Supabase and try again."
          action={<AppButton onPress={() => router.replace("/" as Href)}>Back home</AppButton>}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <EmptyState
        title={status === "loading" ? "Opening your book…" : "Sign in to play"}
        detail={
          status === "loading"
            ? "Restoring your session."
            : "Your match shelf lives behind your account."
        }
        action={
          status === "loading" ? undefined : (
            <AppButton onPress={() => router.replace("/sign-in" as Href)}>Sign in</AppButton>
          )
        }
      />
    </Screen>
  );
}
