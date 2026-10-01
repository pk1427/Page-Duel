import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
export default function Home() {
  return (
    <View style={s.page}>
      <Text style={s.title}>Book People</Text>
      <Text style={s.copy}>Two players. One open book. Count the people and win the round.</Text>
      <Link href="/setup" asChild>
        <Pressable style={s.button}>
          <Text style={s.buttonText}>Play</Text>
        </Pressable>
      </Link>
      <Link href="/how-to-play" style={s.link}>
        How to Play
      </Link>
    </View>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, justifyContent: "center", gap: 22, padding: 28, backgroundColor: "#f8f2e6" },
  title: { fontSize: 42, fontWeight: "800", color: "#30251c" },
  copy: { fontSize: 19, lineHeight: 28, color: "#594a3d" },
  button: {
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e6a93c",
    borderRadius: 10,
  },
  buttonText: { fontSize: 19, fontWeight: "700" },
  link: { fontSize: 18, color: "#493a2f" },
});
