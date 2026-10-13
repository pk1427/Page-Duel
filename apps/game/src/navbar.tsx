import { router, usePathname, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { playTarget } from "./auth-routing";
import { useSession } from "./session-store";
import { palette, radius, space } from "./ui";

function initialsFor(displayName: string | null, email: string | null): string {
  const source = (displayName || email || "R").trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const letters = ((parts[0]?.[0] ?? "R") + (parts[1]?.[0] ?? "")).toUpperCase();
  return letters || "R";
}

function usePlay() {
  const { status } = useSession();
  return () => router.push(playTarget(status) as Href);
}

function TopLink({
  label,
  pathname,
  active,
  onPress,
}: {
  label: string;
  pathname: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ hovered }) => [styles.topLink, hovered && styles.topLinkHovered]}
    >
      <Text style={[styles.topLinkText, active && styles.activeLink]}>{label}</Text>
    </Pressable>
  );
}

export function TopNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { status, displayName, userEmail } = useSession();
  const play = usePlay();

  return (
    <View style={[styles.topBar, { paddingTop: Math.max(insets.top, space.xs) }]}>
      <Pressable
        accessibilityLabel="Book People home"
        accessibilityRole="button"
        onPress={() => router.push("/" as Href)}
        style={styles.brandPress}
      >
        <Text style={styles.brand}>Book People</Text>
      </Pressable>
      <View style={styles.topLinks}>
        <TopLink
          label="Home"
          pathname="/"
          active={pathname === "/"}
          onPress={() => router.push("/" as Href)}
        />
        <Pressable
          accessibilityLabel="Play"
          accessibilityRole="button"
          onPress={play}
          style={({ hovered }) => [styles.topLink, hovered && styles.topLinkHovered]}
        >
          <Text style={[styles.topLinkText, styles.playLink]}>Play</Text>
        </Pressable>
        <TopLink
          label="How to Play"
          pathname="/how-to-play"
          active={pathname === "/how-to-play"}
          onPress={() => router.push("/how-to-play" as Href)}
        />
        {status === "signed-in" ? (
          <Pressable
            accessibilityLabel="Profile"
            accessibilityRole="button"
            onPress={() => router.push("/profile" as Href)}
            style={({ hovered }) => [styles.avatarPress, hovered && styles.topLinkHovered]}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initialsFor(displayName, userEmail)}</Text>
            </View>
          </Pressable>
        ) : (
          <Pressable
            accessibilityLabel="Sign in"
            accessibilityRole="button"
            onPress={() => router.push("/sign-in" as Href)}
            style={({ hovered }) => [styles.topLink, hovered && styles.topLinkHovered]}
          >
            <Text style={[styles.topLinkText, pathname === "/sign-in" && styles.activeLink]}>
              Sign in
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { status } = useSession();
  const play = usePlay();

  const items = [
    { label: "Home", pathname: "/", action: () => router.push("/" as Href) },
    { label: "Play", pathname: "/books", action: play },
    {
      label: "How to Play",
      pathname: "/how-to-play",
      action: () => router.push("/how-to-play" as Href),
    },
    {
      label: "Profile",
      pathname: status === "signed-in" ? "/profile" : "/sign-in",
      action: () => router.push((status === "signed-in" ? "/profile" : "/sign-in") as Href),
    },
  ];

  return (
    <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, space.xs) }]}>
      {items.map((item) => {
        const active =
          pathname === item.pathname || (item.label === "Play" && pathname === "/books");
        return (
          <Pressable
            key={item.label}
            accessibilityLabel={item.label}
            accessibilityRole="button"
            onPress={item.action}
            style={({ hovered }) => [styles.bottomItem, hovered && styles.bottomItemHovered]}
          >
            <Text style={[styles.bottomText, active && styles.activeLink]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    backgroundColor: palette.paper,
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: space.xs,
    paddingHorizontal: space.sm,
    width: "100%",
  },
  brandPress: { minHeight: 44, justifyContent: "center" },
  brand: { color: palette.ink, fontFamily: "serif", fontSize: 22, fontWeight: "800" },
  topLinks: { alignItems: "center", flexDirection: "row", gap: space.xs },
  topLink: {
    borderRadius: radius.small,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: space.xs,
  },
  topLinkHovered: { backgroundColor: palette.canvas },
  topLinkText: { color: palette.ink, fontSize: 16, fontWeight: "600" },
  playLink: { color: palette.accentDark, fontWeight: "800" },
  activeLink: { color: palette.accentDark, fontWeight: "800" },
  avatarPress: { justifyContent: "center", minHeight: 44, paddingHorizontal: 4 },
  avatar: {
    alignItems: "center",
    backgroundColor: palette.plum,
    borderRadius: radius.round,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  avatarText: { color: palette.paper, fontSize: 14, fontWeight: "800" },
  bottomBar: {
    backgroundColor: palette.paper,
    borderTopColor: palette.line,
    borderTopWidth: 1,
    flexDirection: "row",
    paddingTop: space.xs,
    width: "100%",
  },
  bottomItem: {
    alignItems: "center",
    borderRadius: radius.small,
    flex: 1,
    justifyContent: "center",
    minHeight: 52,
  },
  bottomItemHovered: { backgroundColor: palette.canvas },
  bottomText: { color: palette.muted, fontSize: 14, fontWeight: "700" },
});
