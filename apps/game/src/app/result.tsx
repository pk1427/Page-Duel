import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getResult } from "@book-people/game-core";
import { useGame } from "../game-store";
import { reasonLabel } from "../reason-label";
export default function Result() {
  const { state, start } = useGame();
  if (!state) return null;
  const r = getResult(state),
    names = state.config.players;
  const winner = r.winner === null ? "It's a draw" : `${names[r.winner]} wins`;
  return (
    <View style={s.p}>
      <Text style={s.h}>{winner}</Text>
      <Text>Decided by {reasonLabel(r.reason)}</Text>
      <Text>
        {names[0]}: {r.roundWins[0]} rounds, {r.peopleTotals[0]} people
      </Text>
      <Text>
        {names[1]}: {r.roundWins[1]} rounds, {r.peopleTotals[1]} people
      </Text>
      <Pressable
        style={s.b}
        onPress={() => {
          start(names, state.config.rounds);
          router.replace("/game");
        }}
      >
        <Text>Play again</Text>
      </Pressable>
      <Pressable style={s.b} onPress={() => router.replace("/setup")}>
        <Text>Choose another book</Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  p: { flex: 1, padding: 24, gap: 16, backgroundColor: "#f8f2e6" },
  h: { fontSize: 32, fontWeight: "800" },
  b: {
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e6a93c",
    borderRadius: 8,
  },
});
