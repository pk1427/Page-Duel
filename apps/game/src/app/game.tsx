import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { flipSpread, scoreRound, type GameState } from "@book-people/game-core";
import { useGame } from "../game-store";
import { ExitMatchDialog } from "../exit-dialog";
import { SpreadPageImage } from "../cover-image";
import { RequireAuth } from "../require-auth";
import {
  AppButton,
  Badge,
  Body,
  Card,
  EmptyState,
  PlayerTag,
  Screen,
  palette,
  radius,
  space,
} from "../ui";
import { useRevealSequence } from "../useRevealSequence";
import { copy, roundWins } from "../copy/en";

/** Only the narrowest handsets stack pages; typical phones retain an open-book view. */
const STACKED_BOOK_BREAKPOINT = 330;
const COMPACT_GAME_BREAKPOINT = 480;

export default function GameScreen() {
  return (
    <RequireAuth>
      <GameContent />
    </RequireAuth>
  );
}

function GameContent() {
  const { state, selectedBook, update } = useGame();
  const reveal = useRevealSequence(scoreRound);
  const scoredState = useRef<GameState | null>(null);
  const [resultRequested, setResultRequested] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  // Guards against double-taps firing duplicate navigation.
  const exiting = useRef(false);
  const { width } = useWindowDimensions();
  const stacked = width < STACKED_BOOK_BREAKPOINT;
  const compact = width < COMPACT_GAME_BREAKPOINT;

  useEffect(() => {
    if (resultRequested && state === scoredState.current && state?.phase === "finished") {
      reveal.reset();
      router.replace("/result");
    }
  }, [resultRequested, reveal, state]);

  if (!state) {
    return (
      <Screen>
        <EmptyState
          title={copy.empty.noBooks}
          detail=""
          action={
            <AppButton onPress={() => router.replace("/books")}>
              {copy.actions.chooseBook}
            </AppButton>
          }
        />
      </Screen>
    );
  }

  const spread = state.currentSpread;
  const sides = spread ? ([spread.left, spread.right] as const) : null;
  const players = state.config.players;
  const renderPage = (pageIndex: 0 | 1) => {
    const page = sides?.[pageIndex];
    if (!page) return null;
    const side = pageIndex === 0 ? ("left" as const) : ("right" as const);
    const isRevealed =
      (pageIndex === 0 && (reveal.stage === "right" || reveal.stage === "scored")) ||
      (pageIndex === 1 && reveal.stage === "scored");
    return (
      <View
        style={[
          styles.page,
          stacked ? styles.stackedPage : side === "left" ? styles.leftPage : styles.rightPage,
        ]}
      >
        <PlayerTag side={side} name={players[pageIndex] ?? ""} />
        {page.image.startsWith("placeholder:") ? (
          <View style={styles.placeholderPage}>
            <Text style={styles.placeholderTitle}>{copy.game.practiceSpread}</Text>
            <Text style={styles.people}>{"● ".repeat(Math.max(page.people, 1))}</Text>
          </View>
        ) : (
          selectedBook && (
            <SpreadPageImage
              book={selectedBook}
              image={page.image}
              label={copy.game.pageLabel(players[pageIndex] ?? "")}
              recyclingKey={spread?.id ?? "spread"}
              style={stacked ? styles.stackedImage : styles.image}
            />
          )
        )}
        <View style={styles.countBadge}>
          <Text style={styles.count}>{isRevealed ? page.people : "?"}</Text>
          <Text style={styles.countLabel}>{isRevealed ? copy.game.people : copy.game.hidden}</Text>
        </View>
      </View>
    );
  };
  const round = state.roundNumber || state.rounds.length + 1;
  const lastRound = state.rounds[state.rounds.length - 1];
  const banner =
    reveal.stage === "scored" && lastRound
      ? lastRound.winner === null
        ? copy.game.draw
        : copy.game.wonRound(players[lastRound.winner])
      : null;
  const begin = () => {
    const next = flipSpread(state);
    update(next);
    reveal.start(next, (scored) => {
      scoredState.current = scored;
      update(scored);
    });
  };
  const continueGame = () => {
    if (state.phase === "finished") {
      setResultRequested(true);
      return;
    }
    reveal.reset();
  };
  const disabled = reveal.busy;
  const confirmExit = () => {
    if (exiting.current) return;
    exiting.current = true;
    setExitOpen(false);
    router.replace("/books");
  };

  return (
    <Screen style={compact ? styles.compactScreen : undefined}>
      <View style={styles.topline}>
        <Badge tone={round > state.config.rounds ? "accent" : "moss"}>
          {round > state.config.rounds
            ? copy.game.suddenDeath
            : copy.game.round(round, state.config.rounds)}
        </Badge>
        <Text style={styles.bookName}>{selectedBook?.title ?? "Book People"}</Text>
      </View>
      <View style={styles.scoreboard}>
        {players.map((player, index) => (
          <Card
            accessibilityLabel={copy.game.scoreLabel(player)}
            key={player}
            style={[
              styles.scoreCard,
              compact && styles.compactScoreCard,
              index === 0 ? styles.leftCard : styles.rightCard,
            ]}
          >
            <PlayerTag side={index === 0 ? "left" : "right"} name={player} />
            <View style={styles.scoreLine}>
              <Text style={styles.peopleTotal}>{state.peopleTotals[index]}</Text>
              <Text style={styles.peopleLabel}>{copy.game.people}</Text>
            </View>
            <Text style={styles.roundWins}>{roundWins(state.roundWins[index])}</Text>
          </Card>
        ))}
      </View>
      <View
        accessibilityLabel={copy.game.openSpread}
        style={[styles.table, compact && styles.compactTable]}
      >
        <View style={stacked ? styles.stackedBook : styles.openBook}>
          {sides ? (
            stacked ? (
              <>
                {renderPage(0)}
                {renderPage(1)}
              </>
            ) : (
              <>
                {renderPage(0)}
                <View style={styles.spine} />
                {renderPage(1)}
              </>
            )
          ) : (
            <View style={[styles.awaitingSpread, compact && styles.compactAwaitingSpread]}>
              <Text style={styles.awaitingTitle}>{copy.game.awaitingTitle}</Text>
              <Text style={styles.awaitingCopy}>{copy.game.awaitingDetail}</Text>
            </View>
          )}
        </View>
      </View>
      {banner ? (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.banner, compact && styles.compactBanner]}
        >
          <Text style={styles.bannerTitle}>{banner}</Text>
          <Text style={styles.bannerCopy}>{copy.game.totalsUpdated}</Text>
        </View>
      ) : (
        <Body style={styles.prompt}>{copy.game.prompt}</Body>
      )}
      <View style={styles.actions}>
        <AppButton
          accessibilityLabel={
            reveal.stage === "scored" ? copy.actions.nextRound : copy.actions.flipPage
          }
          disabled={disabled}
          onPress={reveal.stage === "scored" ? continueGame : begin}
          style={styles.primaryAction}
        >
          {reveal.stage === "scored"
            ? state.phase === "finished"
              ? copy.actions.seeResult
              : copy.actions.nextRound
            : copy.actions.flipPage}
        </AppButton>
        <AppButton
          accessibilityLabel={copy.actions.exitMatch}
          onPress={() => {
            exiting.current = false;
            setExitOpen(true);
          }}
          style={styles.exitAction}
          tone="quiet"
        >
          {copy.actions.exitMatch}
        </AppButton>
      </View>
      <ExitMatchDialog visible={exitOpen} onStay={() => setExitOpen(false)} onExit={confirmExit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topline: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.xs,
    justifyContent: "space-between",
  },
  bookName: {
    color: palette.muted,
    flexShrink: 1,
    fontFamily: "serif",
    fontSize: 17,
    fontStyle: "italic",
  },
  compactScreen: { gap: space.xs, paddingBottom: space.sm, paddingTop: space.sm },
  scoreboard: { flexDirection: "row", gap: space.xs },
  scoreCard: { flexBasis: 0, flexGrow: 1, gap: 2, minWidth: 0, padding: space.xs },
  compactScoreCard: { paddingVertical: space.xxs },
  leftCard: { borderLeftColor: palette.leftPlayer, borderLeftWidth: 5 },
  rightCard: { borderLeftColor: palette.rightPlayer, borderLeftWidth: 5 },
  scoreLine: { alignItems: "baseline", flexDirection: "row", gap: 4 },
  peopleTotal: { color: palette.plum, fontSize: 27, fontWeight: "800" },
  peopleLabel: { color: palette.muted, fontSize: 13, fontWeight: "700" },
  roundWins: { color: palette.moss, fontSize: 13, fontWeight: "800" },
  table: {
    alignSelf: "center",
    backgroundColor: palette.felt,
    borderColor: palette.feltDeep,
    borderRadius: radius.large,
    borderWidth: 1,
    maxWidth: 900,
    padding: space.xs,
    width: "100%",
  },
  compactTable: { padding: space.xxs },
  openBook: { alignItems: "stretch", flexDirection: "row" },
  stackedBook: { flexDirection: "column", gap: space.xs },
  page: {
    alignItems: "center",
    backgroundColor: palette.paper,
    flex: 1,
    gap: space.xxs,
    padding: space.xs,
  },
  leftPage: {
    borderBottomLeftRadius: radius.medium,
    borderRightColor: "#D3C2A7",
    borderRightWidth: 1,
    borderTopLeftRadius: radius.medium,
    minHeight: 0,
  },
  rightPage: {
    borderBottomRightRadius: radius.medium,
    borderLeftColor: "#FFFDF8",
    borderLeftWidth: 1,
    borderTopRightRadius: radius.medium,
    minHeight: 0,
  },
  stackedPage: { borderRadius: radius.medium },
  spine: { backgroundColor: palette.leatherDeep, width: 10, zIndex: 2 },
  awaitingSpread: {
    alignItems: "center",
    backgroundColor: palette.paper,
    borderRadius: radius.medium,
    gap: 4,
    padding: space.lg,
    width: "100%",
  },
  compactAwaitingSpread: { minHeight: 170, padding: space.sm },
  awaitingTitle: { color: palette.ink, fontFamily: "serif", fontSize: 20, fontWeight: "800" },
  awaitingCopy: { color: palette.muted, fontSize: 15 },
  placeholderPage: { alignItems: "center", flex: 1, justifyContent: "center", minHeight: 180 },
  placeholderTitle: {
    color: palette.muted,
    fontFamily: "serif",
    fontSize: 16,
    fontStyle: "italic",
  },
  people: {
    color: palette.plum,
    fontSize: 25,
    lineHeight: 34,
    marginTop: space.sm,
    textAlign: "center",
  },
  image: { alignSelf: "stretch", aspectRatio: 0.69, width: "100%" },
  stackedImage: { alignSelf: "stretch", height: 300, width: "100%" },
  countBadge: {
    alignItems: "center",
    backgroundColor: "#F0E4D1",
    borderRadius: radius.round,
    minWidth: 58,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  count: { color: palette.plum, fontSize: 23, fontWeight: "800", lineHeight: 25 },
  countLabel: { color: palette.muted, fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  banner: {
    alignItems: "center",
    backgroundColor: "#D9E7DB",
    borderRadius: radius.medium,
    gap: 3,
    padding: space.xs,
  },
  compactBanner: { paddingVertical: space.xxs },
  bannerTitle: { color: palette.moss, fontSize: 18, fontWeight: "800", textAlign: "center" },
  bannerCopy: { color: palette.moss, fontSize: 14, textAlign: "center" },
  prompt: {
    alignSelf: "center",
    fontSize: 15,
    lineHeight: 20,
    fontStyle: "italic",
    textAlign: "center",
  },
  actions: { flexDirection: "row", gap: space.xs },
  primaryAction: { flex: 1 },
  exitAction: { minWidth: 104 },
});
