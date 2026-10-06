import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { flipSpread, scoreRound, type GameState } from "@book-people/game-core";
import { resolveContentAsset } from "../content-assets";
import { useGame } from "../game-store";
import { AppButton, Badge, Body, Card, EmptyState, Screen, palette, radius, space } from "../ui";
import { useRevealSequence } from "../useRevealSequence";

export default function GameScreen() {
  const { state, selectedBook, update } = useGame();
  const reveal = useRevealSequence(scoreRound);
  const scoredState = useRef<GameState | null>(null);
  const [resultRequested, setResultRequested] = useState(false);

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
          <Card key={player} style={styles.scoreCard}>
            <Text numberOfLines={1} style={styles.playerName}>
              {player}
            </Text>
            <View style={styles.scoreLine}>
              <Text style={styles.peopleTotal}>{state.peopleTotals[index]}</Text>
              <Text style={styles.peopleLabel}>people</Text>
            </View>
            <Text style={styles.roundWins}>{state.roundWins[index]} round wins</Text>
          </Card>
        ))}
      </View>
      <View style={styles.bookFrame}>
        <View style={styles.book}>
          {sides?.map((page, index) => {
            const asset = selectedBook ? resolveContentAsset(selectedBook, page) : page.image;
            const isRevealed =
              (index === 0 && (reveal.stage === "right" || reveal.stage === "scored")) ||
              (index === 1 && reveal.stage === "scored");
            return (
              <View
                key={index}
                style={[styles.page, index === 0 ? styles.leftPage : styles.rightPage]}
              >
                <Text numberOfLines={1} style={styles.pageOwner}>
                  {players[index]}
                </Text>
                {asset.startsWith("placeholder:") ? (
                  <View style={styles.placeholderPage}>
                    <Text style={styles.placeholderTitle}>A practice spread</Text>
                    <Text style={styles.people}>{"● ".repeat(Math.max(page.people, 1))}</Text>
                  </View>
                ) : (
                  <Image
                    accessibilityLabel={`${players[index]} page`}
                    source={{ uri: asset }}
                    style={styles.image}
                  />
                )}
                <View style={styles.countBadge}>
                  <Text style={styles.count}>{isRevealed ? page.people : "?"}</Text>
                  <Text style={styles.countLabel}>{isRevealed ? "people" : "hidden"}</Text>
                </View>
              </View>
            );
          })}
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
  playerName: { color: palette.ink, fontSize: 17, fontWeight: "800" },
  scoreLine: { alignItems: "baseline", flexDirection: "row", gap: 4 },
  peopleTotal: { color: palette.plum, fontSize: 27, fontWeight: "800" },
  peopleLabel: { color: palette.muted, fontSize: 13, fontWeight: "700" },
  roundWins: { color: palette.moss, fontSize: 13, fontWeight: "800" },
  bookFrame: {
    alignSelf: "center",
    backgroundColor: "#B39A78",
    borderColor: "#927958",
    borderRadius: radius.large,
    borderWidth: 1,
    maxWidth: 900,
    overflow: "hidden",
    padding: 7,
    width: "100%",
  },
  book: { alignSelf: "center", flexDirection: "row", width: "100%" },
  page: {
    alignItems: "center",
    backgroundColor: palette.paper,
    flex: 1,
    gap: space.xs,
    minHeight: 310,
    padding: space.xs,
  },
  leftPage: { borderRightColor: "#D3C2A7", borderRightWidth: 1 },
  rightPage: { borderLeftColor: "#FFFDF8", borderLeftWidth: 1 },
  pageOwner: { color: palette.ink, fontSize: 15, fontWeight: "800", textAlign: "center" },
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
  image: { aspectRatio: 0.69, flexGrow: 1, resizeMode: "contain", width: "100%" },
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
