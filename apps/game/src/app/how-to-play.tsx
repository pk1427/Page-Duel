import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import {
  AppButton,
  Body,
  Caption,
  Card,
  Eyebrow,
  Screen,
  Title,
  palette,
  radius,
  space,
} from "../ui";

const steps = [
  ["1", "Choose a book", "Every round of the match comes from that one book."],
  ["2", "Take a side", "Player 1 owns the left page. Player 2 owns the right page."],
  ["3", "Flip the spread", "A fresh pair of scanned pages opens. Counts reveal on their own."],
  ["4", "Compare counts", "More people on your page wins the round. Equal counts are a draw."],
  ["5", "Finish the rounds", "Play through all 5, 10, or 15 rounds."],
  [
    "6",
    "Totals decide",
    "Most people across the match wins. Ties break on round wins, then sudden death.",
  ],
  ["7", "Go again", "Rematch with the same book or pick another off the shelf."],
] as const;

export default function How() {
  return (
    <Screen>
      <View style={s.heading}>
        <Eyebrow>Before you begin</Eyebrow>
        <Title>How to play</Title>
        <Body>Two players, one open book. The book does the talking.</Body>
      </View>
      <Card style={s.example}>
        <View style={s.examplePages}>
          <View style={[s.examplePage, s.exampleLeft]}>
            <Text style={s.exampleDots}>{"● ".repeat(3)}</Text>
            <Text style={s.exampleCount}>? people</Text>
          </View>
          <View style={s.exampleSpine} />
          <View style={[s.examplePage, s.exampleRight]}>
            <Text style={s.exampleDots}>{"● ".repeat(5)}</Text>
            <Text style={s.exampleCount}>? people</Text>
          </View>
        </View>
        <Caption style={s.exampleCaption}>
          Example illustration — left page against right page. Your book&apos;s real scanned pages
          appear here during a match.
        </Caption>
      </Card>
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
  example: { alignItems: "center", gap: space.xs },
  examplePages: { flexDirection: "row", maxWidth: 460, width: "100%" },
  examplePage: {
    alignItems: "center",
    backgroundColor: palette.paper,
    borderColor: palette.line,
    borderWidth: 1,
    flex: 1,
    gap: space.xxs,
    padding: space.sm,
  },
  exampleLeft: { borderBottomLeftRadius: radius.small, borderTopLeftRadius: radius.small },
  exampleRight: { borderBottomRightRadius: radius.small, borderTopRightRadius: radius.small },
  exampleSpine: { backgroundColor: palette.leather, width: 6 },
  exampleDots: { color: palette.plum, fontSize: 18, textAlign: "center" },
  exampleCount: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  exampleCaption: { maxWidth: 460, textAlign: "center" },
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
