import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
export default function How() {
  return (
    <View style={s.p}>
      <Text style={s.h}>How to Play</Text>
      <Text style={s.t}>1. Flip a new spread.</Text>
      <Text style={s.t}>2. Count the people on your page.</Text>
      <Text style={s.t}>3. More people wins the round. Win the most rounds to win.</Text>
      <Link href="/" style={s.l}>
        Back home
      </Link>
    </View>
  );
}
const s = StyleSheet.create({
  p: { flex: 1, padding: 24, gap: 18, backgroundColor: "#f8f2e6" },
  h: { fontSize: 32, fontWeight: "800" },
  t: { fontSize: 19 },
  l: { fontSize: 18 },
});
