import { router, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getMatchDetail, type HistoryMatchDetail } from "../../history";
import { RequireAuth } from "../../require-auth";
import { reasonLabel } from "../../reason-label";
import {
  AppButton,
  Badge,
  Body,
  Caption,
  Card,
  EmptyState,
  Eyebrow,
  Screen,
  Title,
  palette,
  space,
} from "../../ui";
import { copy, people, personLabel, roundWins } from "../../copy/en";

export default function HistoryDetail() {
  return (
    <RequireAuth>
      <HistoryDetailContent />
    </RequireAuth>
  );
}

function toWinReason(
  method: "people_total" | "round_wins" | "sudden_death" | "draw",
): "peopleTotal" | "roundWins" | "suddenDeath" | "draw" {
  switch (method) {
    case "people_total":
      return "peopleTotal";
    case "round_wins":
      return "roundWins";
    case "sudden_death":
      return "suddenDeath";
    case "draw":
      return "draw";
  }
}

function HistoryDetailContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [match, setMatch] = useState<HistoryMatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMatch = useCallback(
    async (isRefresh = false) => {
      if (!id) return;
      try {
        if (isRefresh) setError(null);
        const data = await getMatchDetail(id);
        if (data) {
          setMatch(data);
        } else {
          setError(copy.errors.matchUnavailable);
        }
      } catch {
        setError(copy.history.loadFailed);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMatch();
  }, [loadMatch]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMatch(true);
  };

  if (loading) {
    return (
      <Screen style={s.loading}>
        <EmptyState title={copy.history.loading} detail="" />
      </Screen>
    );
  }

  if (error || !match) {
    return (
      <Screen>
        <EmptyState
          title={error || copy.history.loadFailedTitle}
          detail={match ? "" : copy.history.missingDetail}
          action={<AppButton onPress={onRefresh}>{copy.actions.retry}</AppButton>}
        />
      </Screen>
    );
  }

  const winnerText =
    match.winnerPlayer === null
      ? copy.history.draw
      : match.winnerPlayer === 0
        ? copy.history.wins(match.player1Name)
        : copy.history.wins(match.player2Name);

  const completedDate = new Date(match.completedAt);
  const dateStr = completedDate.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = completedDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const playerTotals = [match.player1PeopleTotal, match.player2PeopleTotal];
  const playerRoundWins = [match.player1RoundWins, match.player2RoundWins];
  const playerNames = [match.player1Name, match.player2Name];

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[palette.accentDark]}
        />
      }
      contentContainerStyle={s.container}
    >
      <View style={s.header}>
        <Eyebrow>{copy.result.eyebrow}</Eyebrow>
        <Title style={s.title}>{match.bookTitle}</Title>
        <Caption style={s.meta}>
          {copy.history.dateTime(dateStr, timeStr)}
        </Caption>
      </View>

      <Card style={s.resultCard}>
        <View style={s.resultHeader}>
          <Badge tone={match.winnerPlayer === null ? "moss" : "accent"}>{winnerText}</Badge>
          <Caption style={s.reason}>
            {copy.result.decidedBy(reasonLabel(toWinReason(match.decidingMethod)))}
          </Caption>
        </View>
        <Body style={s.reasonBody}>
          {copy.result.tieOrder}
        </Body>
      </Card>

      <View style={s.scores}>
        {playerNames.map((name, index) => (
          <Card key={name} style={[s.playerCard, match.winnerPlayer === index && s.winnerCard]}>
            {match.winnerPlayer === index && <Badge tone="accent">{copy.history.winner}</Badge>}
            <Text style={s.playerName}>{name}</Text>
            <View style={s.primaryScore}>
              <Text style={s.people}>{playerTotals[index]}</Text>
              <Text style={s.peopleLabel}>{personLabel(playerTotals[index])}</Text>
            </View>
            <Text style={s.roundWins}>{roundWins(playerRoundWins[index])}</Text>
          </Card>
        ))}
      </View>

      <View style={s.section}>
        <Eyebrow>{copy.history.roundByRound}</Eyebrow>
        {match.rounds.length === 0 ? (
          <Body style={s.emptyRounds}>{copy.history.noRoundData}</Body>
        ) : (
          <View style={s.roundsList}>
            {match.rounds.map((round) => (
              <HistoryRoundCard
                key={round.id}
                round={round}
                player1Name={match.player1Name}
                player2Name={match.player2Name}
              />
            ))}
          </View>
        )}
      </View>

      <AppButton
        onPress={() => router.replace("/history" as Href)}
        tone="quiet"
        style={s.backButton}
      >
        {copy.actions.backToHistory}
      </AppButton>
    </ScrollView>
  );
}

function HistoryRoundCard({
  round,
  player1Name,
  player2Name,
}: {
  round: HistoryMatchDetail["rounds"][0];
  player1Name: string;
  player2Name: string;
}) {
  const winnerText =
    round.winnerPlayer === null
      ? copy.history.draw
      : round.winnerPlayer === 0
        ? copy.history.wins(player1Name)
        : copy.history.wins(player2Name);

  return (
    <Card style={s.roundCard}>
      <View style={s.roundHeader}>
        <Text style={s.roundNumber}>{copy.history.roundNumber(round.roundNumber)}</Text>
        <Badge tone={round.roundType === "sudden_death" ? "accent" : "moss"}>
          {round.roundType === "sudden_death" ? copy.game.suddenDeath : copy.history.normalRound}
        </Badge>
      </View>
      <View style={s.spreadInfo}>
        <Text style={s.spreadId}>{copy.history.spread(round.spreadId)}</Text>
      </View>
      <View style={s.roundScores}>
        <View style={s.playerRoundScore}>
          <Text style={s.playerName}>{player1Name}</Text>
          <Text style={s.count}>{people(round.player1Count)}</Text>
        </View>
        <View style={s.divider} />
        <View style={s.playerRoundScore}>
          <Text style={s.playerName}>{player2Name}</Text>
          <Text style={s.count}>{people(round.player2Count)}</Text>
        </View>
      </View>
      <Badge tone={round.winnerPlayer === null ? "moss" : "accent"}>{winnerText}</Badge>
    </Card>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flexGrow: 1, paddingHorizontal: space.md, paddingBottom: space.xl, gap: space.lg },
  header: { gap: space.xs, marginTop: space.lg, textAlign: "center" },
  title: { fontFamily: "serif", fontSize: 28 },
  meta: { color: palette.muted },
  resultCard: { gap: space.sm },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: space.sm, flexWrap: "wrap" },
  reason: { color: palette.muted },
  reasonBody: { textAlign: "center" },
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
  section: { gap: space.sm },
  emptyRounds: { textAlign: "center", color: palette.muted },
  roundsList: { gap: space.sm },
  roundCard: { gap: space.sm },
  roundHeader: { flexDirection: "row", alignItems: "center", gap: space.sm, flexWrap: "wrap" },
  roundNumber: { color: palette.ink, fontSize: 17, fontWeight: "800" },
  spreadInfo: { flex: 1, textAlign: "right" },
  spreadId: { color: palette.muted, fontSize: 13, fontFamily: "monospace" },
  roundScores: { flexDirection: "row", gap: space.sm, marginTop: space.xs },
  playerRoundScore: { flex: 1, gap: space.xxs },
  divider: { width: 1, backgroundColor: palette.line },
  count: { color: palette.plum, fontSize: 20, fontWeight: "800" },
  winnerBadge: { alignSelf: "center", marginTop: space.xs },
  backButton: { alignSelf: "center", marginTop: space.lg },
});
