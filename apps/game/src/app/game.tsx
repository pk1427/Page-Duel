import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { flipSpread, scoreRound, type GameState } from "@book-people/game-core";
import { resolveContentAsset } from "../content-assets";
import { useGame } from "../game-store";
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

  if (!state)
    return (
      <View style={styles.screen}>
        <Text>No game in progress.</Text>
      </View>
    );

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
    <View style={styles.screen}>
      <Text>
        {players[0]} — wins {state.roundWins[0]}, people {state.peopleTotals[0]}
      </Text>
      <Text>
        {players[1]} — wins {state.roundWins[1]}, people {state.peopleTotals[1]}
      </Text>
      <Text>
        {round > state.config.rounds ? "Sudden death" : `Round ${round} of ${state.config.rounds}`}
      </Text>
      <View style={styles.book}>
        {sides?.map((page, index) => {
          const asset = selectedBook ? resolveContentAsset(selectedBook, page) : page.image;
          return (
            <View key={index} style={styles.page}>
              <Text>{players[index]}</Text>
              {asset.startsWith("placeholder:") ? (
                <Text style={styles.people}>{"👤".repeat(page.people)}</Text>
              ) : (
                <Image
                  accessibilityLabel={`${players[index]} page`}
                  source={{ uri: asset }}
                  style={styles.image}
                />
              )}
              <Text style={styles.count}>
                {((reveal.stage === "right" || reveal.stage === "scored") && index === 0) ||
                reveal.stage === "scored"
                  ? page.people
                  : "?"}
              </Text>
            </View>
          );
        })}
      </View>
      {banner && <Text style={styles.banner}>{banner}</Text>}
      <Pressable
        disabled={disabled}
        style={[styles.button, disabled && styles.disabled]}
        onPress={reveal.stage === "scored" ? continueGame : begin}
      >
        <Text>
          {reveal.stage === "scored"
            ? state.phase === "finished"
              ? "See result"
              : "Next round"
            : "Flip"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 18, gap: 12, backgroundColor: "#f8f2e6" },
  book: { flexDirection: "row", maxWidth: 800, alignSelf: "center", borderWidth: 2 },
  page: {
    flex: 1,
    minHeight: 300,
    padding: 12,
    alignItems: "center",
    borderRightWidth: 1,
    backgroundColor: "#fffaf0",
  },
  people: { fontSize: 28, textAlign: "center" },
  image: { width: "100%", aspectRatio: 0.7, resizeMode: "contain" },
  count: { fontSize: 28, fontWeight: "800" },
  banner: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  button: {
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e6a93c",
    borderRadius: 8,
  },
  disabled: { opacity: 0.5 },
});
