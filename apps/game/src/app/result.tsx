import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { getResult } from "@book-people/game-core";
import { useGame } from "../game-store";
import { reasonLabel } from "../reason-label";
import { saveMatch } from "../history";
import type { GameState } from "@book-people/game-core";
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
  space,
} from "../ui";

import { RequireAuth } from "../require-auth";

export default function Result() {
  const { state, start, selectedBook } = useGame();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Save the match once when the result screen mounts with a finished game.
  // This effect runs in the Result component which is always rendered (not conditionally
  // gated by RequireAuth), so hooks are called consistently on every render.
  useEffect(() => {
    let active = true;
    async function doSave() {
      if (!state || state.phase !== "finished" || !selectedBook) return;
      setSaveStatus("saving");
      setSaveError(null);
      const result = await saveMatch(state, selectedBook);
      if (!active) return;
      if (result.ok) {
        setSaveStatus("saved");
      } else {
        setSaveStatus("failed");
        setSaveError(result.error ?? "Could not save the match.");
      }
    }
    doSave();
    return () => {
      active = false;
    };
  }, [state, selectedBook]);

  const retrySave = async () => {
    if (!state || state.phase !== "finished" || !selectedBook) return;
    setSaveStatus("saving");
    setSaveError(null);
    const result = await saveMatch(state, selectedBook);
    if (result.ok) {
      setSaveStatus("saved");
    } else {
      setSaveStatus("failed");
      setSaveError(result.error ?? "Could not save the match.");
    }
  };

  return (
    <RequireAuth>
      <ResultContent
        state={state}
        start={start}
        saveStatus={saveStatus}
        saveError={saveError}
        retrySave={retrySave}
      />
    </RequireAuth>
  );
}

type SaveStatus = "idle" | "saving" | "saved" | "failed";

type ResultContentProps = {
  state: GameState | null;
  start: (players: [string, string], rounds: 5 | 10 | 15) => void;
  saveStatus: SaveStatus;
  saveError: string | null;
  retrySave: () => Promise<void>;
};

function ResultContent({ state, start, saveStatus, saveError, retrySave }: ResultContentProps) {
  if (!state || state.phase !== "finished") {
    return (
      <Screen>
        <EmptyState
          title="No finished game yet"
          detail="Complete a game to see its final totals and winner."
          action={
            <AppButton onPress={() => router.replace("/books" as Href)}>Choose a book</AppButton>
          }
        />
      </Screen>
    );
  }

  const r = getResult(state);
  const names = state.config.players;
  const winner = r.winner === null ? "It's a draw" : `${names[r.winner]} wins`;

  return (
    <Screen>
      <View style={s.hero}>
        <Eyebrow>Final page</Eyebrow>
        <Title style={s.winner}>{winner}</Title>
        <Badge tone="moss">
          {r.reason === "draw" ? reasonLabel(r.reason) : `Decided by ${reasonLabel(r.reason)}`}
        </Badge>
        <Body style={s.reason}>
          People totals decide first — then round wins, then sudden death.
        </Body>
        {saveStatus === "saving" && <Body style={s.saving}>Saving your match&hellip;</Body>}
        {saveStatus === "saved" && <Body style={s.saved}>Match saved to your history.</Body>}
        {saveStatus === "failed" && (
          <View style={s.saveError}>
            <Body style={s.errorText}>Could not save: {saveError}</Body>
            <AppButton onPress={retrySave} tone="secondary" style={s.retryButton}>
              Try again
            </AppButton>
          </View>
        )}
      </View>
      <View style={s.scores}>
        {names.map((name: string, index: number) => (
          <Card key={name} style={[s.playerCard, r.winner === index && s.winnerCard]}>
            {r.winner === index && <Badge tone="accent">Winner</Badge>}
            <Text style={s.playerName}>{name}</Text>
            <View style={s.primaryScore}>
              <Text style={s.people}>{r.peopleTotals[index]}</Text>
              <Text style={s.peopleLabel}>people</Text>
            </View>
            <Text style={s.roundWins}>{r.roundWins[index]} round wins</Text>
          </Card>
        ))}
      </View>
      <View style={s.actions}>
        <AppButton
          onPress={() => {
            start(names, state.config.rounds);
            router.replace("/game");
          }}
        >
          Play Again
        </AppButton>
        <AppButton onPress={() => router.replace("/books" as Href)} tone="secondary">
          Choose Another Book
        </AppButton>
        <AppButton onPress={() => router.replace("/" as Href)} tone="quiet">
          Return Home
        </AppButton>
        <AppButton onPress={() => router.replace("/history" as Href)} tone="quiet">
          View History
        </AppButton>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { alignItems: "center", gap: space.xs, marginTop: space.lg, textAlign: "center" },
  winner: { textAlign: "center" },
  reason: { fontSize: 16, textAlign: "center" },
  saving: { color: palette.muted, marginTop: space.xs },
  saved: { color: palette.moss, marginTop: space.xs, fontWeight: "700" },
  saveError: { gap: space.xs, marginTop: space.xs, alignItems: "center" },
  errorText: { color: palette.danger, textAlign: "center" },
  retryButton: { marginTop: space.xs },
  scores: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, justifyContent: "center" },
  playerCard: {
    alignItems: "center",
    flexBasis: 250,
    flexGrow: 1,
    gap: space.xxs,
    maxWidth: 470,
    minHeight: 190,
    padding: space.md,
  },
  winnerCard: {
    backgroundColor: "#FFF4E9",
    borderColor: palette.gold,
    borderWidth: 2,
  },
  playerName: { color: palette.ink, fontSize: 21, fontWeight: "800", marginTop: space.xs },
  primaryScore: { alignItems: "baseline", flexDirection: "row", gap: 6, marginTop: space.xxs },
  people: {
    color: palette.plum,
    fontSize: 52,
    fontWeight: "800",
    letterSpacing: -1.3,
    lineHeight: 58,
  },
  peopleLabel: { color: palette.muted, fontSize: 16, fontWeight: "800" },
  roundWins: { color: palette.moss, fontSize: 16, fontWeight: "800" },
  actions: { alignSelf: "center", gap: space.xs, maxWidth: 500, width: "100%" },
});
