import { router, usePathname, type Href } from "expo-router";
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Path, Svg } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { playTarget } from "./auth-routing";
import { useSession } from "./session-store";
import { palette, radius, space } from "./ui";
import { copy } from "./copy";

type IconName = "home" | "guide" | "play" | "history" | "profile";
type NavItem = { id: IconName; label: string; action: () => void; active: boolean };

function initialsFor(displayName: string | null, email: string | null): string {
  const source = (displayName || email || "R").trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "R") + (parts[1]?.[0] ?? "")).toUpperCase() || "R";
}

function NavIcon({ name, active, size = 20 }: { name: IconName; active: boolean; size?: number }) {
  const color = active ? palette.forest : palette.muted;
  const stroke = { fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const icons: Record<IconName, ReactNode> = {
    home: <><Path {...stroke} d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-9Z" /><Path {...stroke} d="M9 21v-6h6v6" /></>,
    guide: <><Path {...stroke} d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" /><Path {...stroke} d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5A2.5 2.5 0 0 1 20 21V5.5Z" /></>,
    play: <Path d="m9 7 7 5-7 5V7Z" fill={active ? palette.white : palette.accent} stroke={active ? palette.white : palette.accent} strokeWidth={1.5} strokeLinejoin="round" />,
    history: <><Path {...stroke} d="M3 12a9 9 0 1 0 3-6.7" /><Path {...stroke} d="M3 4v5h5" /><Path {...stroke} d="M12 7v5l3 2" /></>,
    profile: <><Path {...stroke} d="M20 21a8 8 0 0 0-16 0" /><Path {...stroke} d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /></>,
  };
  return <Svg width={size} height={size} viewBox="0 0 24 24">{icons[name]}</Svg>;
}

function BrandMark() { return <View style={styles.brandMark}><View style={styles.brandPageLeft} /><View style={styles.brandSpine} /><View style={styles.brandPageRight} /></View>; }

function HoverablePressable({ accessibilityLabel, children, hoverStyle, onPress, style, selected }: { accessibilityLabel: string; children: ReactNode; hoverStyle: StyleProp<ViewStyle>; onPress: () => void; style: StyleProp<ViewStyle>; selected?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" accessibilityState={{ selected }} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} onPress={onPress} style={({ pressed }) => [style, (hovered || pressed) && hoverStyle]}>{children}</Pressable>;
}

function useNavigationItems(): readonly NavItem[] {
  const pathname = usePathname();
  const { status } = useSession();
  const isActive = (route: string) => route === "/" ? pathname === "/" : pathname === route || pathname.startsWith(`${route}/`);
  const protectedRoute = (route: "/history" | "/profile") => status === "signed-in" ? route : "/sign-in";
  return [
    { id: "home", label: copy.nav.home, action: () => router.push("/" as Href), active: isActive("/") },
    { id: "guide", label: copy.nav.guide, action: () => router.push("/how-to-play" as Href), active: isActive("/how-to-play") },
    { id: "play", label: copy.nav.play, action: () => router.push(playTarget(status) as Href), active: isActive("/books") || isActive("/setup") },
    { id: "history", label: copy.nav.history, action: () => router.push(protectedRoute("/history") as Href), active: isActive("/history") },
    { id: "profile", label: copy.nav.profile, action: () => router.push(protectedRoute("/profile") as Href), active: isActive("/profile") },
  ];
}

export function TopNav() {
  const insets = useSafeAreaInsets();
  const { status, displayName, userEmail } = useSession();
  const items = useNavigationItems();
  const play = items.find((item) => item.id === "play")!;
  const links = status === "signed-in" ? items.filter((item) => item.id !== "play" && item.id !== "profile") : items.filter((item) => item.id === "guide");
  return <View style={[styles.topBar, { paddingTop: Math.max(insets.top, space[100]) }]}>
    <Pressable accessibilityLabel={copy.nav.homeLabel} accessibilityRole="button" onPress={() => router.push("/" as Href)} style={styles.brandPress}><BrandMark /><Text style={styles.brand}>{copy.brand}</Text></Pressable>
    <View style={styles.topLinks}>
      {links.map((item) => <HoverablePressable key={item.id} accessibilityLabel={item.label} selected={item.active} onPress={item.action} style={[styles.navLink, item.active && styles.navLinkActive]} hoverStyle={styles.navLinkHovered}><Text style={[styles.navLinkText, item.active && styles.navLinkTextActive]}>{item.id === "guide" ? copy.nav.howToPlay : item.label}</Text></HoverablePressable>)}
      {status === "signed-in" ? <HoverablePressable accessibilityLabel={copy.nav.profile} selected={items.find((item) => item.id === "profile")?.active} onPress={() => router.push("/profile" as Href)} style={styles.avatarPress} hoverStyle={styles.navLinkHovered}><View style={styles.avatar}><Text style={styles.avatarText}>{initialsFor(displayName, userEmail)}</Text></View></HoverablePressable> : <HoverablePressable accessibilityLabel={copy.nav.signIn} onPress={() => router.push("/sign-in" as Href)} style={styles.navLink} hoverStyle={styles.navLinkHovered}><Text style={styles.navLinkText}>{copy.nav.signIn}</Text></HoverablePressable>}
      <HoverablePressable accessibilityLabel={copy.nav.play} selected={play.active} onPress={play.action} style={styles.navPrimary} hoverStyle={styles.navPrimaryHovered}><Text style={styles.navPrimaryText}>{copy.nav.play}</Text></HoverablePressable>
    </View>
  </View>;
}

export function BottomNav() {
  const insets = useSafeAreaInsets();
  const items = useNavigationItems();
  return <View style={[styles.bottomShell, { paddingBottom: Math.max(insets.bottom, space[75]) }]}><View style={styles.bottomDock}>{items.map((item) => {
    const isPlay = item.id === "play";
    return <HoverablePressable key={item.id} accessibilityLabel={item.id === "guide" ? copy.nav.howToPlay : item.label} selected={item.active} onPress={item.action} style={[styles.bottomItem, isPlay && styles.bottomPlayItem]} hoverStyle={isPlay ? styles.bottomPlayHovered : styles.bottomItemHovered}><View style={[styles.iconWrap, isPlay && styles.playIconWrap, isPlay && item.active && styles.playIconActive]}><NavIcon name={item.id} active={item.active} size={isPlay ? 23 : 20} /></View><Text numberOfLines={1} style={[styles.bottomText, item.active && styles.bottomTextActive, isPlay && styles.bottomPlayText]}>{item.label}</Text></HoverablePressable>;
  })}</View></View>;
}

const styles = StyleSheet.create({
  topBar: { alignItems: "center", backgroundColor: palette.paper, borderBottomColor: palette.line, borderBottomWidth: 1, flexDirection: "row", gap: space[300], justifyContent: "space-between", paddingBottom: space[100], paddingHorizontal: space[400], width: "100%" }, brandPress: { alignItems: "center", flexDirection: "row", gap: space[100], minHeight: 52 }, brandMark: { alignItems: "center", backgroundColor: palette.forestLight, borderRadius: radius.medium, flexDirection: "row", height: 32, justifyContent: "center", overflow: "hidden", width: 38 }, brandPageLeft: { backgroundColor: palette.paper, borderTopLeftRadius: 5, height: 20, width: 13 }, brandSpine: { backgroundColor: palette.leatherDeep, height: 22, width: 2 }, brandPageRight: { backgroundColor: palette.paper, borderTopRightRadius: 5, height: 20, width: 13 }, brand: { color: palette.ink, fontFamily: "serif", fontSize: 24, fontWeight: "700" },
  topLinks: { alignItems: "center", flexDirection: "row", gap: space[100] }, navLink: { alignItems: "center", borderRadius: radius.round, justifyContent: "center", minHeight: 44, paddingHorizontal: space[200] }, navLinkActive: { backgroundColor: palette.forestLight }, navLinkHovered: { backgroundColor: palette.canvas }, navLinkText: { color: palette.ink, fontSize: 15, fontWeight: "600" }, navLinkTextActive: { color: palette.forest, fontWeight: "700" }, navPrimary: { alignItems: "center", backgroundColor: palette.accent, borderRadius: radius.round, justifyContent: "center", minHeight: 46, paddingHorizontal: space[300] }, navPrimaryHovered: { backgroundColor: palette.accentDark, transform: [{ scale: 1.02 }] }, navPrimaryText: { color: palette.white, fontSize: 16, fontWeight: "700" }, avatarPress: { borderRadius: radius.round, minHeight: 44, padding: 4 }, avatar: { alignItems: "center", backgroundColor: palette.plum, borderRadius: radius.round, height: 34, justifyContent: "center", width: 34 }, avatarText: { color: palette.paper, fontSize: 13, fontWeight: "700" },
  bottomShell: { backgroundColor: palette.canvas, paddingHorizontal: space[100], paddingTop: space[75], width: "100%" }, bottomDock: { alignItems: "center", backgroundColor: palette.paper, borderColor: palette.line, borderRadius: radius.xlarge, borderWidth: 1, flexDirection: "row", minHeight: 66, paddingHorizontal: space[50], shadowColor: palette.ink, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 8 }, bottomItem: { alignItems: "center", borderRadius: radius.medium, flex: 1, gap: 2, justifyContent: "center", minHeight: 58, minWidth: 0, paddingHorizontal: 2 }, bottomPlayItem: { transform: [{ translateY: -2 }] }, bottomItemHovered: { backgroundColor: palette.forestLight }, iconWrap: { alignItems: "center", height: 24, justifyContent: "center", width: 28 }, playIconWrap: { backgroundColor: palette.accentLight, borderRadius: radius.round, height: 34, marginTop: -8, width: 34 }, playIconActive: { backgroundColor: palette.accent }, bottomText: { color: palette.muted, fontSize: 11, fontWeight: "600", lineHeight: 14, maxWidth: "100%" }, bottomTextActive: { color: palette.forest, fontWeight: "700" }, bottomPlayText: { color: palette.accentDark, fontWeight: "700" }, bottomPlayHovered: { opacity: 0.82 },
});
