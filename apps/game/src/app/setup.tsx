import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { RoundCount } from "@book-people/game-core";
import { BookCover } from "../cover-image";
import { useGame } from "../game-store";
import {
  AppButton,
  Badge,
  Body,
  Card,
  EmptyState,
  Eyebrow,
  Screen,
  Title,
  palette,
  radius,
  space,
} from "../ui";

export default function Setup() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [rounds, setRounds] = useState<RoundCount>(10);
  const { start, error, selectedBook } = useGame();
  const begin = () => {
    start([a, b], rounds);
    router.push("/game");
  };

  if (!selectedBook) {
    return (
      <Screen>
        <EmptyState
          title="Choose a book first"
          detail="A game needs a ready book before its spreads can be dealt."
          action={<AppButton onPress={() => router.replace("/books")}>Browse books</AppButton>}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={s.heading}>
        <Eyebrow>New game</Eyebrow>
        <Title>Set the table</Title>
        <Body>Name the readers and choose how long the book stays open.</Body>
      </View>
      <Card style={s.book}>
        <View style={s.spineEdge} />
        <BookCover book={selectedBook} style={s.bookCover} />
        <View style={s.bookCopy}>
          <Badge tone="moss">Selected book</Badge>
          <Text style={s.bookTitle}>{selectedBook.title}</Text>
          {(selectedBook.author || selectedBook.year) && (
            <Text style={s.author}>
              {[selectedBook.author, selectedBook.year].filter(Boolean).join(" · ")}
            </Text>
          )}
        </View>
        <AppButton onPress={() => router.replace("/books")} tone="quiet">
          Change
        </AppButton>
      </Card>
      <View style={s.section}>
        <Text style={s.label}>The readers</Text>
        <View style={s.players}>
          <View style={s.playerField}>
            <Text style={s.playerTagLeft}>Left page · Player 1</Text>
            <TextInput
              accessibilityLabel="Player 1 name"
              placeholder="Player 1"
              placeholderTextColor="#8B7D70"
              value={a}
              onChangeText={setA}
              style={s.input}
            />
          </View>
          <View style={s.playerField}>
            <Text style={s.playerTagRight}>Right page · Player 2</Text>
            <TextInput
              accessibilityLabel="Player 2 name"
              placeholder="Player 2"
              placeholderTextColor="#8B7D70"
              value={b}
              onChangeText={setB}
              style={s.input}
            />
          </View>
        </View>
      </View>
      <View style={s.section}>
        <Text style={s.label}>How many rounds?</Text>
        <View accessibilityRole="radiogroup" style={s.roundChoices}>
          {([5, 10, 15] as const).map((n) => (
            <Pressable
              key={n}
              accessibilityLabel={`${n} rounds`}
              accessibilityRole="radio"
              accessibilityState={{ selected: rounds === n }}
              onPress={() => setRounds(n)}
              style={[s.choice, rounds === n && s.active]}
            >
              <Text style={[s.choiceNumber, rounds === n && s.choiceNumberActive]}>{n}</Text>
              <Text style={[s.choiceCopy, rounds === n && s.choiceCopyActive]}>rounds</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      <AppButton accessibilityLabel="Start Game" onPress={begin}>
        Start Game
      </AppButton>
    </Screen>
  );
}

const s = StyleSheet.create({
  heading: { gap: space.xs, maxWidth: 620 },
  section: { gap: space.xs },
  label: { color: palette.ink, fontSize: 18, fontWeight: "800" },
  players: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  playerField: { flexBasis: 260, flexGrow: 1, gap: space.xxs },
  playerTagLeft: {
    color: palette.leftPlayer,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  playerTagRight: {
    color: palette.rightPlayer,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderRadius: radius.small,
    borderWidth: 1,
    color: palette.ink,
    fontSize: 18,
    minHeight: 54,
    paddingHorizontal: space.sm,
  },
  roundChoices: { flexDirection: "row", flexWrap: "wrap", gap: space.xs },
  choice: {
    alignItems: "center",
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderRadius: radius.medium,
    borderWidth: 2,
    minHeight: 78,
    minWidth: 94,
    justifyContent: "center",
  },
  active: { backgroundColor: palette.plum, borderColor: palette.gold },
  choiceNumber: { color: palette.ink, fontSize: 25, fontWeight: "800" },
  choiceNumberActive: { color: palette.white },
  choiceCopy: { color: palette.muted, fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  choiceCopyActive: { color: "#EFD8D3" },
  book: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    overflow: "hidden",
    paddingLeft: space.xs,
  },
  spineEdge: {
    alignSelf: "stretch",
    backgroundColor: palette.leather,
    borderRadius: radius.small,
    minHeight: 84,
    width: 8,
  },
  bookCover: { height: 96, width: 64 },
  bookCopy: { flexGrow: 1, gap: 3, minWidth: 160 },
  bookTitle: { color: palette.ink, fontFamily: "serif", fontSize: 22, fontWeight: "800" },
  author: { color: palette.muted, fontSize: 14, fontStyle: "italic" },
  error: { color: palette.danger, fontSize: 15, fontWeight: "700" },
});
