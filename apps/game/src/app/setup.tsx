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

import { RequireAuth } from "../require-auth";
import { copy } from "../copy";

export default function Setup() {
  return (
    <RequireAuth>
      <SetupContent />
    </RequireAuth>
  );
}

function SetupContent() {
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
          title={copy.setup.chooseBookFirstTitle}
          detail={copy.setup.chooseBookFirstDetail}
          action={<AppButton onPress={() => router.replace("/books")}>{copy.actions.browseBooks}</AppButton>}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={s.heading}>
        <Eyebrow>{copy.setup.eyebrow}</Eyebrow>
        <Title>{copy.setup.title}</Title>
        <Body>{copy.setup.detail}</Body>
      </View>
      <Card accessibilityLabel={copy.setup.selectedBook} style={s.book}>
        <View style={s.spineEdge} />
        <BookCover book={selectedBook} style={s.bookCover} />
        <View style={s.bookCopy}>
          <Badge tone="moss">{copy.setup.selectedBook}</Badge>
          <Text numberOfLines={2} style={s.bookTitle}>
            {selectedBook.title}
          </Text>
          {(selectedBook.author || selectedBook.year) && (
            <Text style={s.author}>
              {[selectedBook.author, selectedBook.year].filter(Boolean).join(" · ")}
            </Text>
          )}
        </View>
        <AppButton
          accessibilityLabel={copy.actions.changeBook}
          onPress={() => router.replace("/books")}
          style={s.changeAction}
          tone="quiet"
        >
          {copy.actions.changeBook}
        </AppButton>
      </Card>
      <View style={s.section}>
        <Text style={s.label}>{copy.setup.readers}</Text>
        <View style={s.players}>
          <View style={s.playerField}>
            <Text style={s.playerTagLeft}>{copy.setup.playerOne}</Text>
            <TextInput
              accessibilityLabel={copy.setup.playerOneName}
              placeholder={copy.setup.playerOnePlaceholder}
              placeholderTextColor="#8B7D70"
              value={a}
              onChangeText={setA}
              style={s.input}
            />
          </View>
          <View style={s.playerField}>
            <Text style={s.playerTagRight}>{copy.setup.playerTwo}</Text>
            <TextInput
              accessibilityLabel={copy.setup.playerTwoName}
              placeholder={copy.setup.playerTwoPlaceholder}
              placeholderTextColor="#8B7D70"
              value={b}
              onChangeText={setB}
              style={s.input}
            />
          </View>
        </View>
      </View>
      <View style={s.section}>
        <Text style={s.label}>{copy.setup.gameLength}</Text>
        <View accessibilityRole="radiogroup" style={s.roundChoices}>
          {([5, 10, 15] as const).map((n) => (
            <Pressable
              key={n}
              accessibilityLabel={copy.setup.rounds(n)}
              accessibilityRole="radio"
              accessibilityState={{ selected: rounds === n }}
              onPress={() => setRounds(n)}
              style={[s.choice, rounds === n && s.active]}
            >
              <Text style={[s.choiceNumber, rounds === n && s.choiceNumberActive]}>{n}</Text>
              <Text style={[s.choiceCopy, rounds === n && s.choiceCopyActive]}>{copy.setup.roundsLabel}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      <AppButton accessibilityLabel={copy.actions.startGame} onPress={begin}>
        {copy.actions.startGame}
      </AppButton>
    </Screen>
  );
}

const s = StyleSheet.create({
  heading: { gap: space.xs, maxWidth: 620 },
  section: { backgroundColor: palette.paper, borderColor: palette.line, borderRadius: radius.large, borderWidth: 1, gap: space[200], padding: space[300] },
  label: { color: palette.ink, fontFamily: "serif", fontSize: 20, fontWeight: "700" },
  players: { flexDirection: "row", flexWrap: "wrap", gap: space[200] },
  playerField: { backgroundColor: palette.white, borderColor: palette.line, borderRadius: radius.medium, borderWidth: 1, flexBasis: 260, flexGrow: 1, gap: space.xxs, padding: space[200] },
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
    backgroundColor: palette.canvas,
    borderColor: palette.line,
    borderRadius: radius.medium,
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
    borderRadius: radius.large,
    borderWidth: 2,
    minHeight: 78,
    minWidth: 94,
    justifyContent: "center",
  },
  active: { backgroundColor: palette.forest, borderColor: palette.forestDark },
  choiceNumber: { color: palette.ink, fontSize: 25, fontWeight: "800" },
  choiceNumberActive: { color: palette.white },
  choiceCopy: { color: palette.muted, fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  choiceCopyActive: { color: palette.mintLight },
  book: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.xs,
    overflow: "hidden",
    padding: space.xs,
  },
  spineEdge: {
    alignSelf: "stretch",
    backgroundColor: palette.leather,
    borderRadius: radius.small,
    minHeight: 76,
    width: 8,
  },
  bookCover: { height: 78, width: 52 },
  bookCopy: { flex: 1, flexBasis: 150, gap: 2, minWidth: 0 },
  bookTitle: {
    color: palette.ink,
    fontFamily: "serif",
    fontSize: 20,
    lineHeight: 23,
    fontWeight: "800",
  },
  author: { color: palette.muted, fontSize: 14, fontStyle: "italic" },
  changeAction: { flexShrink: 0, minWidth: 66, paddingHorizontal: space.xs },
  error: { color: palette.danger, fontSize: 15, fontWeight: "700" },
});
