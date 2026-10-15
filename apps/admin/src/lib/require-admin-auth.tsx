import { router, type Href } from "expo-router";
import { useEffect, type ReactNode } from "react";
import { useAdminSession } from "./admin-session";
import { AppButton, EmptyState, Screen } from "../components/ui";

/**
 * Route-level gate for admin screens that require admin authentication.
 * Shows a loading state while the session restores so direct visits and
 * refreshes never flash protected content or bounce to sign-in early.
 */
export function RequireAdminAuth({ children }: { children: ReactNode }) {
  const { status, isAdmin } = useAdminSession();

  useEffect(() => {
    if (status === "signed-out" || status === "signed-in") {
      if (!isAdmin) {
        router.replace("/admin/sign-in" as Href);
      }
    }
  }, [status, isAdmin]);

  if (status === "signed-in" && isAdmin) return <>{children}</>;

  if (status === "unconfigured") {
    return (
      <Screen>
        <EmptyState
          title="Admin sign-in is unavailable"
          detail="This build has no backend configured, so the admin dashboard cannot start."
          action={<AppButton onPress={() => router.replace("/" as Href)}>Back home</AppButton>}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <EmptyState
        title={status === "loading" ? "Verifying admin access…" : "Admin sign-in required"}
        detail={
          status === "loading"
            ? "Restoring your session and checking permissions."
            : "Only authorized administrators can access this dashboard."
        }
        action={
          status === "loading" ? undefined : (
            <AppButton onPress={() => router.replace("/admin/sign-in" as Href)}>Sign in as admin</AppButton>
          )
        }
      />
    </Screen>
  );
}