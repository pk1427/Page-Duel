import { useCallback, useEffect, useRef, useState } from "react";
import type { GameState } from "@book-people/game-core";

export const LEFT_REVEAL_MS = 800;
export const RIGHT_REVEAL_MS = 800;
export const SCORE_MS = 600;
export type RevealStage = "idle" | "hidden" | "left" | "right" | "scored";

export function scheduleReveal(
  state: GameState,
  score: (state: GameState) => GameState,
  callbacks: { left: () => void; right: () => void; scored: (next: GameState) => void },
): () => void {
  const timers = [
    setTimeout(callbacks.left, LEFT_REVEAL_MS),
    setTimeout(callbacks.right, LEFT_REVEAL_MS + RIGHT_REVEAL_MS),
    setTimeout(() => callbacks.scored(score(state)), LEFT_REVEAL_MS + RIGHT_REVEAL_MS + SCORE_MS),
  ];
  return () => timers.forEach(clearTimeout);
}

export function useRevealSequence(score: (state: GameState) => GameState) {
  const [stage, setStage] = useState<RevealStage>("idle");
  const timers = useRef<Array<() => void>>([]);
  const clear = useCallback(() => {
    timers.current.forEach((stop) => stop());
    timers.current = [];
  }, []);
  useEffect(() => clear, [clear]);
  const start = useCallback(
    (state: GameState, onScored: (next: GameState) => void) => {
      clear();
      setStage("hidden");
      const stop = scheduleReveal(state, score, {
        left: () => setStage("left"),
        right: () => setStage("right"),
        scored: (next) => {
          onScored(next);
          setStage("scored");
          timers.current = [];
        },
      });
      timers.current = [stop];
    },
    [clear, score],
  );
  return {
    stage,
    busy: stage === "hidden" || stage === "left" || stage === "right",
    start,
    reset: () => {
      clear();
      setStage("idle");
    },
  };
}
