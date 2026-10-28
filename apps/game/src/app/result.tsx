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
import { copy, personLabel, roundWins } from "../copy/en";

export default function Result() {
  const { state, start, selectedBook, selectedBookVersionId } = useGame();
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
      const result = await saveMatch(state, selectedBook, selectedBookVersionId);
      if (!active) return;
      if (result.ok) {
        setSaveStatus("saved");
      } else {
        setSaveStatus("failed");
        setSaveError(result.error ?? copy.result.saveFailed);
      }
    }
    doSave();
    return () => {
      active = false;
    };
  }, [state, selectedBook, selectedBookVersionId]);

  const retrySave = async () => {
    if (!state || state.phase !== "finished" || !selectedBook) return;
    setSaveStatus("saving");
    setSaveError(null);
    const result = await saveMatch(state, selectedBook, selectedBookVersionId);
    if (result.ok) {
      setSaveStatus("saved");
    } else {
      setSaveStatus("failed");
      setSaveError(result.error ?? copy.result.saveFailed);
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
          title={copy.result.noFinishedTitle}
          detail={copy.result.noFinishedDetail}
          action={
            <AppButton onPress={() => router.replace("/books" as Href)}>{copy.actions.chooseBook}</AppButton>
          }
        />
      </Screen>
    );
  }

  const r = getResult(state);
  const names = state.config.players;
  const winner = r.winner === null ? copy.result.drawTitle : copy.result.winnerTitle(names[r.winner]);

  return (
    <Screen>
      <View style={s.hero}>
        <Eyebrow>{copy.result.eyebrow}</Eyebrow>
        <Title style={s.winner}>{winner}</Title>
        <Badge tone="moss">
          {r.reason === "draw" ? reasonLabel(r.reason) : copy.result.decidedBy(reasonLabel(r.reason))}
        </Badge>
        <Body style={s.reason}>
          {copy.result.tieOrder}
        </Body>
        {saveStatus === "saving" && <Body style={s.saving}>{copy.result.saving}</Body>}
        {saveStatus === "saved" && <Body style={s.saved}>{copy.result.saved}</Body>}
        {saveStatus === "failed" && (
          <View style={s.saveError}>
            <Body style={s.errorText}>{saveError ?? copy.result.saveFailed}</Body>
            <AppButton onPress={retrySave} tone="secondary" style={s.retryButton}>
              {copy.actions.retry}
            </AppButton>
          </View>
        )}
      </View>
      <View style={s.scores}>
        {names.map((name: string, index: number) => (
          <Card key={name} style={[s.playerCard, r.winner === index && s.winnerCard]}>
            {r.winner === index && <Badge tone="accent">{copy.history.winner}</Badge>}
            <Text style={s.playerName}>{name}</Text>
            <View style={s.primaryScore}>
              <Text style={s.people}>{r.peopleTotals[index]}</Text>
              <Text style={s.peopleLabel}>{personLabel(r.peopleTotals[index])}</Text>
            </View>
            <Text style={s.roundWins}>{roundWins(r.roundWins[index])}</Text>
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
          {copy.actions.playAgain}
        </AppButton>
        <AppButton onPress={() => router.replace("/books" as Href)} tone="secondary">
          {copy.actions.chooseAnotherBook}
        </AppButton>
        <AppButton onPress={() => router.replace("/" as Href)} tone="quiet">
          {copy.actions.backHome}
        </AppButton>
        <AppButton onPress={() => router.replace("/history" as Href)} tone="quiet">
          {copy.actions.viewHistory}
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
