import { router, type Href } from "expo-router";
import { useEffect, type ReactNode } from "react";
import { useSession } from "./session-store";
import { AppButton, EmptyState, Screen } from "./ui";
import { copy } from "./copy";

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
          title={copy.auth.signInTitleUnavailable}
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
        title={status === "loading" ? copy.requireAuth.checkingTitle : copy.requireAuth.signInTitle}
        detail={
          status === "loading"
            ? copy.requireAuth.checkingDetail
            : copy.requireAuth.signInDetail
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
