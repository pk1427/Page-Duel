import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { flipSpread, scoreRound, type GameState } from "@book-people/game-core";
import { useGame } from "../game-store";
import { SpreadPageImage } from "../cover-image";
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

/** Below this window width the two pages stack so scanned details stay readable. */
const WIDE_BOOK_BREAKPOINT = 640;

export default function GameScreen() {
  const { state, selectedBook, update } = useGame();
  const reveal = useRevealSequence(scoreRound);
  const scoredState = useRef<GameState | null>(null);
  const [resultRequested, setResultRequested] = useState(false);
  const { width } = useWindowDimensions();
  const stacked = width < WIDE_BOOK_BREAKPOINT;

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
          title="Your book is waiting"
          detail="Choose a book and set up a match before revealing a spread."
          action={<AppButton onPress={() => router.replace("/books")}>Choose a book</AppButton>}
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
            <Text style={styles.placeholderTitle}>A practice spread</Text>
            <Text style={styles.people}>{"● ".repeat(Math.max(page.people, 1))}</Text>
          </View>
        ) : (
          selectedBook && (
            <SpreadPageImage
              book={selectedBook}
              image={page.image}
              label={`${players[pageIndex]} page`}
              recyclingKey={spread?.id ?? "spread"}
              style={stacked ? styles.stackedImage : styles.image}
            />
          )
        )}
        <View style={styles.countBadge}>
          <Text style={styles.count}>{isRevealed ? page.people : "?"}</Text>
          <Text style={styles.countLabel}>{isRevealed ? "people" : "hidden"}</Text>
        </View>
      </View>
    );
  };
  const round = state.roundNumber || state.rounds.length + 1;
  const lastRound = state.rounds[state.rounds.length - 1];
  const banner =
    reveal.stage === "scored" && lastRound
      ? lastRound.winner === null
        ? "Draw"
        : `${players[lastRound.winner]} wins the round`
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

  return (
    <Screen>
      <View style={styles.topline}>
        <Badge tone={round > state.config.rounds ? "accent" : "moss"}>
          {round > state.config.rounds
            ? "Sudden death"
            : `Round ${round} of ${state.config.rounds}`}
        </Badge>
        <Text style={styles.bookName}>{selectedBook?.title ?? "Book People"}</Text>
      </View>
      <View style={styles.scoreboard}>
        {players.map((player, index) => (
          <Card
            key={player}
            style={[styles.scoreCard, index === 0 ? styles.leftCard : styles.rightCard]}
          >
            <PlayerTag side={index === 0 ? "left" : "right"} name={player} />
            <View style={styles.scoreLine}>
              <Text style={styles.peopleTotal}>{state.peopleTotals[index]}</Text>
              <Text style={styles.peopleLabel}>people</Text>
            </View>
            <Text style={styles.roundWins}>{state.roundWins[index]} round wins</Text>
          </Card>
        ))}
      </View>
      <View style={styles.table}>
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
            <View style={styles.awaitingSpread}>
              <Text style={styles.awaitingTitle}>A fresh spread awaits</Text>
              <Text style={styles.awaitingCopy}>Flip the spread to open the book.</Text>
            </View>
          )}
        </View>
      </View>
      {banner ? (
        <View accessibilityLiveRegion="polite" style={styles.banner}>
          <Text style={styles.bannerTitle}>{banner}</Text>
          <Text style={styles.bannerCopy}>The totals above now include this spread.</Text>
        </View>
      ) : (
        <Body style={styles.prompt}>Turn the page to reveal this round’s counts.</Body>
      )}
      <AppButton
        accessibilityLabel={reveal.stage === "scored" ? "Continue game" : "Flip spread"}
        disabled={disabled}
        onPress={reveal.stage === "scored" ? continueGame : begin}
      >
        {reveal.stage === "scored"
          ? state.phase === "finished"
            ? "See result"
            : "Next round"
          : "Flip spread"}
      </AppButton>
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
  scoreboard: { flexDirection: "row", flexWrap: "wrap", gap: space.xs },
  scoreCard: { flexBasis: 220, flexGrow: 1, gap: 2, padding: space.xs },
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
  openBook: { alignItems: "stretch", flexDirection: "row" },
  stackedBook: { flexDirection: "column", gap: space.xs },
  page: {
    alignItems: "center",
    backgroundColor: palette.paper,
    flex: 1,
    gap: space.xs,
    padding: space.xs,
  },
  leftPage: {
    borderBottomLeftRadius: radius.medium,
    borderRightColor: "#D3C2A7",
    borderRightWidth: 1,
    borderTopLeftRadius: radius.medium,
    minHeight: 320,
  },
  rightPage: {
    borderBottomRightRadius: radius.medium,
    borderLeftColor: "#FFFDF8",
    borderLeftWidth: 1,
    borderTopRightRadius: radius.medium,
    minHeight: 320,
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
  image: { alignSelf: "stretch", aspectRatio: 0.69, flexGrow: 1, width: "100%" },
  stackedImage: { alignSelf: "stretch", height: 300, width: "100%" },
  countBadge: {
    alignItems: "center",
    backgroundColor: "#F0E4D1",
    borderRadius: radius.round,
    minWidth: 70,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  count: { color: palette.plum, fontSize: 27, fontWeight: "800", lineHeight: 28 },
  countLabel: { color: palette.muted, fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  banner: {
    alignItems: "center",
    backgroundColor: "#D9E7DB",
    borderRadius: radius.medium,
    gap: 3,
    padding: space.sm,
  },
  bannerTitle: { color: palette.moss, fontSize: 20, fontWeight: "800", textAlign: "center" },
  bannerCopy: { color: palette.moss, fontSize: 14, textAlign: "center" },
  prompt: { alignSelf: "center", fontStyle: "italic", textAlign: "center" },
});
