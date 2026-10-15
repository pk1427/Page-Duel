import { Stack } from "expo-router";
import { RequireAdminAuth } from "@/lib/require-admin-auth";
import { AdminNav } from "@/components/admin-nav";
import { palette } from "@/components/ui";

export default function DashboardLayout() {
  return (
    <RequireAdminAuth>
      <AdminNav>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: palette.paper },
          }}
        />
      </AdminNav>
    </RequireAdminAuth>
  );
}