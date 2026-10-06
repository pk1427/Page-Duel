import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AppButton, Body, Card, Eyebrow, Screen, Title, palette, space } from "../ui";

const steps = [
  ["1", "Choose a book", "Pick a ready book. Every round comes from that book only."],
  ["2", "Share the spread", "One reader owns the left page, the other owns the right."],
  ["3", "Reveal together", "Flip the spread and watch each page’s people count appear."],
  ["4", "Score the round", "The higher count takes the round. A tie is a draw."],
  [
    "5",
    "Read the final score",
    "Most people wins. If people tie, round wins decide. A final tie goes to sudden death.",
  ],
] as const;

export default function How() {
  return (
    <Screen>
      <View style={s.heading}>
        <Eyebrow>Before you begin</Eyebrow>
        <Title>How to play</Title>
        <Body>Book People keeps the rules short, so the book can do the talking.</Body>
      </View>
      <View style={s.steps}>
        {steps.map(([number, heading, copy]) => (
          <Card key={number} style={s.step}>
            <Text style={s.number}>{number}</Text>
            <View style={s.stepCopy}>
              <Text style={s.stepHeading}>{heading}</Text>
              <Text style={s.stepText}>{copy}</Text>
            </View>
          </Card>
        ))}
      </View>
      <AppButton onPress={() => router.replace("/books")}>Choose a book</AppButton>
    </Screen>
  );
}

const s = StyleSheet.create({
  heading: { gap: space.xs, maxWidth: 640 },
  steps: { gap: space.xs },
  step: { alignItems: "flex-start", flexDirection: "row", gap: space.sm },
  number: {
    color: palette.accentDark,
    fontFamily: "serif",
    fontSize: 31,
    fontWeight: "800",
    lineHeight: 35,
    minWidth: 28,
  },
  stepCopy: { flex: 1, gap: 3 },
  stepHeading: { color: palette.ink, fontSize: 18, fontWeight: "800" },
  stepText: { color: palette.muted, fontSize: 16, lineHeight: 23 },
});
