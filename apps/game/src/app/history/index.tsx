import { router, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View, RefreshControl, FlatList, Pressable } from "react-native";
import { RequireAuth } from "../../require-auth";
import { getHistory, type HistoryMatch } from "../../history";
import { BookCover } from "../../cover-image";
import { reasonLabel } from "../../reason-label";
import {
  AppButton,
  Badge,
  Caption,
  EmptyState,
  Eyebrow,
  Screen,
  Title,
  palette,
  radius,
  space,
} from "../../ui";

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

export default function History() {
  return (
    <RequireAuth>
      <HistoryContent />
    </RequireAuth>
  );
}

function HistoryContent() {
  const [matches, setMatches] = useState<HistoryMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  const loadMatches = useCallback(async (pageNum: number, isRefresh = false) => {
    try {
      if (isRefresh) setError(null);
      const newMatches = await getHistory(PAGE_SIZE, pageNum * PAGE_SIZE);
      if (isRefresh) {
        setMatches(newMatches);
        setPage(0);
      } else {
        setMatches((prev) => [...prev, ...newMatches]);
        setPage(pageNum);
      }
      setHasMore(newMatches.length === PAGE_SIZE);
    } catch {
      setError("Could not load your match history. Pull to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMatches(0);
  }, [loadMatches]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMatches(0, true);
  };

  const onLoadMore = () => {
    if (!loading && !refreshing && hasMore) {
      loadMatches(page + 1);
    }
  };

  const renderMatch = ({ item }: { item: HistoryMatch }) => <HistoryMatchCard match={item} />;

  const keyExtractor = (item: HistoryMatch) => item.id;

  return (
    <Screen style={s.container}>
      <View style={s.header}>
        <Eyebrow>Your shelf</Eyebrow>
        <Title>Match History</Title>
        <Caption>Completed games, newest first.</Caption>
      </View>
      {error && !matches.length && (
        <EmptyState
          title="Could not load history"
          detail={error}
          action={<AppButton onPress={() => loadMatches(0, true)}>Retry</AppButton>}
        />
      )}
      {matches.length === 0 && !loading && !error && (
        <EmptyState
          title="No matches yet"
          detail="Complete a game to see it here."
          action={
            <AppButton onPress={() => router.push("/books" as Href)}>Choose a book</AppButton>
          }
        />
      )}
      <FlatList
        data={matches}
        renderItem={renderMatch}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[palette.accentDark]}
          />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasMore && !loading ? (
            <View style={s.loadMore}>
              <AppButton onPress={onLoadMore} tone="quiet">
                Load more
              </AppButton>
            </View>
          ) : null
        }
        contentContainerStyle={s.list}
      />
    </Screen>
  );
}

type HistoryMatchCardProps = {
  match: HistoryMatch;
};

function HistoryMatchCard({ match }: HistoryMatchCardProps) {
  const completedDate = new Date(match.completedAt);
  const dateStr = completedDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = completedDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const winnerText =
    match.winnerPlayer === null
      ? "Draw"
      : match.winnerPlayer === 0
        ? `${match.player1Name} wins`
        : `${match.player2Name} wins`;

  return (
    <Pressable
      testID={`history-match-${match.id}`}
      accessibilityLabel={`${match.player1Name} vs ${match.player2Name}, ${winnerText}, ${dateStr}`}
      accessibilityRole="button"
      onPress={() => router.push(`/history/${match.id}` as Href)}
      style={s.card}
    >
      <View style={s.cardTop}>
        <View style={s.bookInfo}>
          <BookCover
            book={
              {
                id: match.bookId,
                title: match.bookTitle,
                coverImage: "",
              } as any
            }
            style={s.cover}
          />
          <View style={s.bookMeta}>
            <Text style={s.bookTitle} numberOfLines={1}>
              {match.bookTitle}
            </Text>
            <Caption style={s.bookMetaText}>
              {match.player1Name} vs {match.player2Name} · {dateStr} at {timeStr}
            </Caption>
          </View>
        </View>
        <View style={s.resultBadge}>
          <Badge tone={match.winnerPlayer === null ? "moss" : "accent"}>{winnerText}</Badge>
          <Caption style={s.reasonText}>{reasonLabel(toWinReason(match.decidingMethod))}</Caption>
        </View>
      </View>
      <View style={s.scores}>
        <View style={s.playerScore}>
          <Text style={s.playerName}>{match.player1Name}</Text>
          <View style={s.scoreRow}>
            <Text style={s.peopleTotal}>{match.player1PeopleTotal}</Text>
            <Text style={s.peopleLabel}>people</Text>
          </View>
          <Caption style={s.roundWins}>{match.player1RoundWins} round wins</Caption>
        </View>
        <View style={s.divider} />
        <View style={s.playerScore}>
          <Text style={s.playerName}>{match.player2Name}</Text>
          <View style={s.scoreRow}>
            <Text style={s.peopleTotal}>{match.player2PeopleTotal}</Text>
            <Text style={s.peopleLabel}>people</Text>
          </View>
          <Caption style={s.roundWins}>{match.player2RoundWins} round wins</Caption>
        </View>
      </View>
      <Caption style={s.roundsInfo}>
        {match.roundsConfig} rounds configured ·{" "}
        {match.roundsConfig + (match.decidingMethod === "sudden_death" ? 1 : 0)} rounds played
      </Caption>
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { gap: space.xs, marginTop: space.lg, paddingHorizontal: space.md },
  list: { paddingHorizontal: space.md, paddingBottom: space.xl, gap: space.md },
  loadMore: { paddingVertical: space.md, alignItems: "center" },
  card: {
    backgroundColor: palette.paper,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radius.large,
    padding: space.md,
    gap: space.md,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: space.md },
  bookInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: space.sm, minWidth: 0 },
  cover: { width: 48, height: 48, borderRadius: radius.small, backgroundColor: palette.canvas },
  bookMeta: { flex: 1, gap: 2, minWidth: 0 },
  bookTitle: { color: palette.ink, fontFamily: "serif", fontSize: 17, fontWeight: "700" },
  bookMetaText: { color: palette.muted },
  resultBadge: { alignItems: "flex-end", gap: space.xxs },
  reasonText: { color: palette.muted, textAlign: "right" },
  scores: { flexDirection: "row", gap: space.md, paddingTop: space.xs },
  playerScore: { flex: 1, gap: space.xxs },
  divider: { width: 1, backgroundColor: palette.line, marginVertical: space.xs },
  playerName: { color: palette.ink, fontSize: 16, fontWeight: "700" },
  scoreRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  peopleTotal: { color: palette.plum, fontSize: 24, fontWeight: "800" },
  peopleLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  roundWins: { color: palette.moss, fontSize: 12, fontWeight: "700" },
  roundsInfo: { color: palette.muted, fontSize: 12, textAlign: "center" },
});
