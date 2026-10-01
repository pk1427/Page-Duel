import { createContext, useContext, useState, type ReactNode } from "react";
import { createSeed, startGame, type GameState, type RoundCount } from "@book-people/game-core";
import { placeholderBook } from "@book-people/book-data";

type GameStore = {
  state: GameState | null;
  error: string | null;
  start: (players: [string, string], rounds: RoundCount) => void;
  update: (state: GameState) => void;
};
const GameContext = createContext<GameStore | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const store: GameStore = {
    state,
    error,
    start(players, rounds) {
      try {
        setState(startGame({ players, book: placeholderBook, rounds, seed: createSeed() }));
        setError(null);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not start game");
      }
    },
    update: setState,
  };
  return <GameContext.Provider value={store}>{children}</GameContext.Provider>;
}
export function useGame(): GameStore {
  const store = useContext(GameContext);
  if (!store) throw new Error("Game provider is missing");
  return store;
}
