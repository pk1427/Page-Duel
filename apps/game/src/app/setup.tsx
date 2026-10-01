import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { RoundCount } from "@book-people/game-core";
import { useGame } from "../game-store";
export default function Setup() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [rounds, setRounds] = useState<RoundCount>(10);
  const { start, error } = useGame();
  const begin = () => {
    start([a, b], rounds);
    router.push("/game");
  };
  return (
    <View style={s.page}>
      <Text style={s.title}>Set up a game</Text>
      <TextInput
        accessibilityLabel="Player 1 name"
        placeholder="Player 1"
        value={a}
        onChangeText={setA}
        style={s.input}
      />
      <TextInput
        accessibilityLabel="Player 2 name"
        placeholder="Player 2"
        value={b}
        onChangeText={setB}
        style={s.input}
      />
      <Text style={s.label}>Rounds</Text>
      <View style={s.row}>
        {([5, 10, 15] as const).map((n) => (
          <Pressable
            key={n}
            onPress={() => setRounds(n)}
            style={[s.choice, rounds === n && s.active]}
          >
            <Text>{n}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.label}>Book</Text>
      <View style={s.book}>
        <Text>The Book People Practice Book</Text>
      </View>
      {error && <Text style={s.error}>{error}</Text>}
      <Pressable onPress={begin} style={s.button}>
        <Text style={s.buttonText}>Start</Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, gap: 14, padding: 24, backgroundColor: "#f8f2e6" },
  title: { fontSize: 32, fontWeight: "800" },
  label: { fontWeight: "700", fontSize: 17 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#8b7765",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "white",
  },
  row: { flexDirection: "row", gap: 10 },
  choice: {
    minWidth: 54,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
  },
  active: { backgroundColor: "#e6a93c" },
  book: { padding: 14, borderWidth: 1, borderRadius: 8, backgroundColor: "white" },
  button: {
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#e6a93c",
  },
  buttonText: { fontWeight: "700", fontSize: 18 },
  error: { color: "#a22" },
});
