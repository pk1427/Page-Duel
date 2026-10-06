import { router, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { getResult } from "@book-people/game-core";
import { useGame } from "../game-store";
import { reasonLabel } from "../reason-label";
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

export default function Result() {
  const { state, start } = useGame();
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
        <Title>{winner}</Title>
        <Body style={s.reason}>
          {r.reason === "draw" ? reasonLabel(r.reason) : `Decided by ${reasonLabel(r.reason)}`}
        </Body>
      </View>
      <View style={s.scores}>
        {names.map((name, index) => (
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
          Play this book again
        </AppButton>
        <AppButton onPress={() => router.replace("/books" as Href)} tone="secondary">
          Choose another book
        </AppButton>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { alignItems: "center", gap: space.xs, marginTop: space.lg, textAlign: "center" },
  reason: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  scores: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, justifyContent: "center" },
  playerCard: {
    flexBasis: 250,
    flexGrow: 1,
    gap: space.xxs,
    maxWidth: 470,
    minHeight: 190,
    padding: space.md,
  },
  winnerCard: { backgroundColor: "#FFF4E9", borderColor: "#D7946F", borderWidth: 2 },
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
