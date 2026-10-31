import { router, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View, RefreshControl, FlatList, Pressable, useWindowDimensions } from "react-native";
import { RequireAuth } from "../../require-auth";
import { getHistory, type HistoryMatch } from "../../history";
import { BookCover } from "../../cover-image";
import { reasonLabel } from "../../reason-label";
import { copy, personLabel, roundWins } from "../../copy";
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
  const { width } = useWindowDimensions();
  const compact = width < 480;
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
      setError(copy.history.loadFailed);
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

  const renderMatch = ({ item }: { item: HistoryMatch }) => <HistoryMatchCard match={item} compact={compact} />;

  const keyExtractor = (item: HistoryMatch) => item.id;

  return (
    <Screen style={s.container}>
      <View style={s.header}>
        <Eyebrow>{copy.history.eyebrow}</Eyebrow>
        <Title>{copy.history.title}</Title>
        <Caption>{copy.history.detail}</Caption>
      </View>
      {error && !matches.length && (
        <EmptyState
          title={copy.history.loadFailedTitle}
          detail={error}
          action={<AppButton onPress={() => loadMatches(0, true)}>{copy.actions.retry}</AppButton>}
        />
      )}
      {matches.length === 0 && !loading && !error && (
        <EmptyState
          title={copy.empty.noHistoryTitle}
          detail={copy.empty.noHistoryDetail}
          action={
            <AppButton onPress={() => router.push("/books" as Href)}>{copy.actions.chooseBook}</AppButton>
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
                {copy.actions.loadMore}
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
  compact: boolean;
};

function HistoryMatchCard({ match, compact }: HistoryMatchCardProps) {
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
      ? copy.history.draw
      : match.winnerPlayer === 0
        ? copy.history.wins(match.player1Name)
        : copy.history.wins(match.player2Name);

  return (
    <Pressable
      testID={`history-match-${match.id}`}
      accessibilityLabel={copy.history.matchAccessibility(
        match.player1Name,
        match.player2Name,
        winnerText,
        dateStr,
      )}
      accessibilityRole="button"
      onPress={() => router.push(`/history/${match.id}` as Href)}
      style={[s.card, compact && s.cardCompact]}
    >
      <View style={[s.cardTop, compact && s.cardTopCompact]}>
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
              {copy.history.matchRowTitle(match.player1Name, match.player2Name)}
            </Text>
            <Caption style={s.bookMetaText}>
              {copy.history.matchRowDate(dateStr, timeStr)}
            </Caption>
          </View>
        </View>
        <View style={[s.resultBadge, compact && s.resultBadgeCompact]}>
          <Badge tone={match.winnerPlayer === null ? "moss" : "accent"}>{winnerText}</Badge>
          <Caption style={[s.reasonText, compact && s.reasonTextCompact]}>
            {reasonLabel(toWinReason(match.decidingMethod))}
          </Caption>
        </View>
      </View>
      <View style={[s.scores, compact && s.scoresCompact]}>
        <View style={s.playerScore}>
          <Text style={s.playerName}>{match.player1Name}</Text>
          <View style={s.scoreRow}>
            <Text style={s.peopleTotal}>{match.player1PeopleTotal}</Text>
            <Text style={s.peopleLabel}>{personLabel(match.player1PeopleTotal)}</Text>
          </View>
          <Caption style={s.roundWins}>{roundWins(match.player1RoundWins)}</Caption>
        </View>
        <View style={[s.divider, compact && s.dividerCompact]} />
        <View style={s.playerScore}>
          <Text style={s.playerName}>{match.player2Name}</Text>
          <View style={s.scoreRow}>
            <Text style={s.peopleTotal}>{match.player2PeopleTotal}</Text>
            <Text style={s.peopleLabel}>{personLabel(match.player2PeopleTotal)}</Text>
          </View>
          <Caption style={s.roundWins}>{roundWins(match.player2RoundWins)}</Caption>
        </View>
      </View>
      <Caption style={s.roundsInfo}>
        {copy.history.roundsSummary(
          match.roundsConfig,
          match.roundsConfig + (match.decidingMethod === "sudden_death" ? 1 : 0),
        )}
      </Caption>
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { backgroundColor: palette.forestLight, borderColor: palette.forest, borderRadius: radius.large, borderWidth: 1, gap: space.xs, marginTop: space.lg, padding: space[300] },
  list: { paddingHorizontal: space.md, paddingBottom: space.xl, gap: space.md },
  loadMore: { paddingVertical: space.md, alignItems: "center" },
  card: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radius.large,
    padding: space[300],
    gap: space[200],
  },
  cardCompact: { padding: space[200], gap: space[100] },
  cardTop: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: space.md, justifyContent: "space-between" },
  cardTopCompact: { flexDirection: "column", alignItems: "stretch", gap: space.sm },
  bookInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: space.sm, minWidth: 0 },
  cover: { width: 48, height: 48, borderRadius: radius.small, backgroundColor: palette.canvas },
  bookMeta: { flex: 1, gap: 2, minWidth: 0 },
  bookTitle: { color: palette.ink, fontFamily: "serif", fontSize: 17, fontWeight: "700" },
  bookMetaText: { color: palette.muted },
  resultBadge: { alignItems: "flex-end", flexGrow: 1, gap: space.xxs },
  resultBadgeCompact: { alignItems: "flex-start", width: "100%" },
  reasonText: { color: palette.muted, textAlign: "right" },
  reasonTextCompact: { textAlign: "left" },
  scores: { flexDirection: "row", gap: space.md, paddingTop: space.xs },
  scoresCompact: { flexDirection: "column", gap: space.sm },
  playerScore: { flex: 1, gap: space.xxs },
  divider: { width: 1, backgroundColor: palette.line, marginVertical: space.xs },
  dividerCompact: { width: "100%", height: 1, backgroundColor: palette.line, marginVertical: space.xs },
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
