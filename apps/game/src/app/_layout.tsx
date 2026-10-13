import { Stack, usePathname } from "expo-router";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { GameProvider } from "../game-store";
import { BottomNav, TopNav } from "../navbar";
import { SessionProvider } from "../session-store";

/** Desktop-width breakpoint: top bar on wide screens, bottom bar on handsets. */
const WIDE_NAV_BREAKPOINT = 760;

function Shell() {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const inMatch = pathname === "/game";
  const wide = width >= WIDE_NAV_BREAKPOINT;
  return (
    <View style={styles.shell}>
      {wide && !inMatch && <TopNav />}
      <View style={styles.stackWrap}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
      {!wide && !inMatch && <BottomNav />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <GameProvider>
        <Shell />
      </GameProvider>
    </SessionProvider>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  stackWrap: { flex: 1 },
});
