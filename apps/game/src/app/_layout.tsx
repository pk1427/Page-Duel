import { Stack } from "expo-router";
import { GameProvider } from "../game-store";

export default function RootLayout() {
  return (
    <GameProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </GameProvider>
  );
}
