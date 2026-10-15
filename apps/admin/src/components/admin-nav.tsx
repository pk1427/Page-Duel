import { useState } from "react";
import { router, usePathname, useLocalSearchParams } from "expo-router";
import { View, Text, Pressable, StyleSheet, Platform, SafeAreaView, ScrollView } from "react-native";
import { useAdminSession } from "@/lib/admin-session";
import { palette, space, radius, Card, Caption, Eyebrow, Title, AppButton } from "@/components/ui";

const NAV_ITEMS = [
  { path: "/admin/(dashboard)/", label: "Dashboard", icon: "📊" },
  { path: "/admin/(dashboard)/books", label: "Books", icon: "📚" },
  { path: "/admin/(dashboard)/audit", label: "Audit Log", icon: "📋" },
] as const;

export function AdminNav({ children }: { children: React.ReactNode }) {
  const { userEmail, signOut, isAdmin } = useAdminSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/admin/sign-in" as any);
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  if (Platform.OS === "web") {
    return (
      <View style={styles.webShell}>
        <View style={styles.webSidebar}>
          <View style={styles.sidebarHeader}>
            <Eyebrow>Book People</Eyebrow>
            <Title>Admin</Title>
          </View>
          <View style={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <Pressable
                key={item.path}
                onPress={() => router.push(item.path as any)}
                style={({ pressed }) => [
                  styles.navItem,
                  isActive(item.path) && styles.navItemActive,
                  pressed && styles.navItemPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive(item.path) }}
              >
                <Text style={[styles.navIcon, isActive(item.path) && styles.navIconActive]}>{item.icon}</Text>
                <Text style={[styles.navLabel, isActive(item.path) && styles.navLabelActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.sidebarFooter}>
            <Caption>Signed in as {userEmail}</Caption>
            <AppButton variant="ghost" onPress={handleSignOut} style={styles.signOutButton}>
              Sign out
            </AppButton>
          </View>
        </View>
        <View style={styles.webMain}>
          <SafeAreaView style={styles.webContent}>{children}</SafeAreaView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mobileShell}>
      <View style={styles.mobileHeader}>
        <Pressable onPress={() => setMobileNavOpen(true)} style={styles.menuButton} accessibilityLabel="Open menu">
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>
        <Eyebrow>Book People Admin</Eyebrow>
        <Pressable onPress={handleSignOut} style={styles.signOutButtonMobile} accessibilityLabel="Sign out">
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
      <SafeAreaView style={styles.mobileContent}>{children}</SafeAreaView>

      {mobileNavOpen && (
        <View style={styles.mobileOverlay} onTouchStart={() => setMobileNavOpen(false)}>
          <View style={styles.mobileSidebar} onTouchStart={(e) => e.stopPropagation()}>
            <View style={styles.sidebarHeader}>
              <Eyebrow>Book People</Eyebrow>
              <Title>Admin</Title>
            </View>
            <View style={styles.navList}>
              {NAV_ITEMS.map((item) => (
                <Pressable
                  key={item.path}
                  onPress={() => {
                    router.push(item.path as any);
                    setMobileNavOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.navItem,
                    isActive(item.path) && styles.navItemActive,
                    pressed && styles.navItemPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive(item.path) }}
                >
                  <Text style={[styles.navIcon, isActive(item.path) && styles.navIconActive]}>{item.icon}</Text>
                  <Text style={[styles.navLabel, isActive(item.path) && styles.navLabelActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.sidebarFooter}>
              <Caption>Signed in as {userEmail}</Caption>
              <AppButton variant="ghost" onPress={handleSignOut} style={styles.signOutButton}>
                Sign out
              </AppButton>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  webShell: {
    flex: 1,
    flexDirection: "row",
  },
  webSidebar: {
    width: 260,
    backgroundColor: palette.card,
    borderRightWidth: 1,
    borderRightColor: palette.border,
    flexDirection: "column",
    padding: space.lg,
  },
  webMain: {
    flex: 1,
  },
  webContent: {
    padding: space.xl,
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
  },
  mobileShell: {
    flex: 1,
  },
  mobileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    backgroundColor: palette.card,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    minHeight: 56,
  },
  mobileContent: {
    flex: 1,
    padding: space.md,
  },
  menuButton: {
    padding: space.xs,
  },
  menuIcon: {
    fontSize: 24,
  },
  signOutButtonMobile: {
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  signOutText: {
    color: palette.accent,
    fontWeight: "600",
  },
  mobileOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 100,
  },
  mobileSidebar: {
    flex: 1,
    maxWidth: 280,
    backgroundColor: palette.card,
    flexDirection: "column",
    padding: space.lg,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  sidebarHeader: {
    gap: space.xs,
    marginBottom: space.lg,
    paddingBottom: space.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  navList: {
    gap: space.xs,
    flex: 1,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.medium,
  },
  navItemActive: {
    backgroundColor: palette.accentLight,
  },
  navItemPressed: {
    opacity: 0.8,
  },
  navIcon: {
    fontSize: 20,
  },
  navIconActive: {},
  navLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: palette.ink,
    flex: 1,
  },
  navLabelActive: {
    color: palette.accentDark,
    fontWeight: "700",
  },
  sidebarFooter: {
    marginTop: "auto",
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    gap: space.md,
  },
  signOutButton: {
    width: "100%",
  },
});