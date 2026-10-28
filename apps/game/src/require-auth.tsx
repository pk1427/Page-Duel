import { router, type Href } from "expo-router";
import { useEffect, type ReactNode } from "react";
import { useSession } from "./session-store";
import { AppButton, EmptyState, Screen } from "./ui";
import { copy } from "./copy/en";

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
          detail={copy.auth.signInUnavailable}
          action={
            <AppButton onPress={() => router.replace("/" as Href)}>
              {copy.actions.backHome}
            </AppButton>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <EmptyState
        title={status === "loading" ? "Checking your session" : "Sign in to play"}
        detail={
          status === "loading"
            ? "This will only take a moment."
            : "Sign in to start a match and save its history."
        }
        action={
          status === "loading" ? undefined : (
            <AppButton onPress={() => router.replace("/sign-in" as Href)}>
              {copy.nav.signIn}
            </AppButton>
          )
        }
      />
    </Screen>
  );
}
