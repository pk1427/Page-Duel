import { createContext, useContext, useState, type ReactNode } from "react";
import { createSeed, startGame, type GameState, type RoundCount } from "@book-people/game-core";
import { bookCatalog, type BookContent } from "@book-people/book-data";

type GameStore = {
  state: GameState | null;
  error: string | null;
  selectedBookId: string | null;
  selectedBook: BookContent | undefined;
  playableBooks: readonly BookContent[];
  selectBook: (bookId: string) => void;
  start: (players: [string, string], rounds: RoundCount) => void;
  update: (state: GameState) => void;
};
const GameContext = createContext<GameStore | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(
    bookCatalog.listPlayableBooks()[0]?.id ?? null,
  );
  const playableBooks = bookCatalog.listPlayableBooks();
  const selectedBook = selectedBookId ? bookCatalog.getBook(selectedBookId) : undefined;
  const store: GameStore = {
    state,
    error,
    selectedBookId,
    selectedBook,
    playableBooks,
    selectBook(bookId) {
      if (!bookCatalog.getPlayableBook(bookId)) {
        setError("That book is not ready to play yet.");
        return;
      }
      setSelectedBookId(bookId);
      setError(null);
    },
    start(players, rounds) {
      try {
        const book = selectedBookId ? bookCatalog.getPlayableBook(selectedBookId) : undefined;
        if (!book) throw new Error("Choose a ready book before starting a game.");
        setState(startGame({ players, book, rounds, seed: createSeed() }));
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
