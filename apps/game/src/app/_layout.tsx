import { Stack, usePathname } from "expo-router";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { GameProvider } from "../game-store";
import { BottomNav, TopNav } from "../navbar";
import { SessionProvider } from "../session-store";
import { hasWrongStagingEnvironment } from "../supabase";

/** Desktop-width breakpoint: top bar on wide screens, bottom bar on handsets. */
const WIDE_NAV_BREAKPOINT = 760;

function Shell() {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const inMatch = pathname === "/game";
  const wide = width >= WIDE_NAV_BREAKPOINT;
  return (
    <View style={styles.shell}>
      {__DEV__ && hasWrongStagingEnvironment && (
        <View accessibilityRole="alert" style={styles.wrongEnvironment}>
          <Text style={styles.wrongEnvironmentText}>
            Wrong environment: staging mode is configured with a local Supabase host.
          </Text>
        </View>
      )}
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
  wrongEnvironment: { backgroundColor: "#B42318", padding: 10 },
  wrongEnvironmentText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800", textAlign: "center" },
});
