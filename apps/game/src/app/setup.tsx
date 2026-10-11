import { router } from "expo-router";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { RoundCount } from "@book-people/game-core";
import { resolveContentAsset } from "../content-assets";
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
        {selectedBook.coverImage && !selectedBook.coverImage.startsWith("placeholder:") ? (
          <Image
            accessibilityLabel={`${selectedBook.title} cover`}
            source={{ uri: resolveContentAsset(selectedBook, { image: selectedBook.coverImage }) }}
            style={s.bookCover}
          />
        ) : (
          <View style={s.bookFallback}>
            <Text style={s.bookInitial}>{selectedBook.title.slice(0, 1)}</Text>
          </View>
        )}
        <View style={s.bookCopy}>
          <Badge tone="moss">Selected book</Badge>
          <Text style={s.bookTitle}>{selectedBook.title}</Text>
          {selectedBook.author && (
            <Text style={s.author}>
              {selectedBook.author}
              {selectedBook.year ? ` · ${selectedBook.year}` : ""}
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
            <Text style={s.playerTag}>Left page</Text>
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
            <Text style={s.playerTag}>Right page</Text>
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
      <AppButton accessibilityLabel="Start game" onPress={begin}>
        Start reading
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
  playerTag: {
    color: palette.muted,
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
    borderWidth: 1,
    minHeight: 78,
    minWidth: 94,
    justifyContent: "center",
  },
  active: { backgroundColor: palette.plum, borderColor: palette.plum },
  choiceNumber: { color: palette.ink, fontSize: 25, fontWeight: "800" },
  choiceNumberActive: { color: palette.white },
  choiceCopy: { color: palette.muted, fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  choiceCopyActive: { color: "#EFD8D3" },
  book: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  bookCover: { borderRadius: radius.small, height: 84, width: 56 },
  bookFallback: {
    alignItems: "center",
    backgroundColor: palette.plum,
    borderRadius: radius.small,
    height: 84,
    justifyContent: "center",
    width: 56,
  },
  bookInitial: { color: palette.paper, fontFamily: "serif", fontSize: 28, fontWeight: "800" },
  bookCopy: { flexGrow: 1, gap: 3, minWidth: 160 },
  bookTitle: { color: palette.ink, fontFamily: "serif", fontSize: 22, fontWeight: "800" },
  author: { color: palette.muted, fontSize: 14, fontStyle: "italic" },
  error: { color: palette.danger, fontSize: 15, fontWeight: "700" },
});
