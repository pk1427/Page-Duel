import { Stack } from "expo-router";
import { AdminSessionProvider } from "../lib/admin-session";
import { RequireAdminAuth } from "../lib/require-admin-auth";
import { palette } from "../components/ui";

export default function AdminRootLayout() {
  return (
    <AdminSessionProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.paper },
        }}
      >
        <Stack.Screen name="sign-in" options={{ presentation: "modal" }} />
        <Stack.Screen name="(dashboard)" />
      </Stack>
    </AdminSessionProvider>
  );
}