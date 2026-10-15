import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createSeed, startGame, type GameState, type RoundCount } from "@book-people/game-core";
import { bookCatalog, toPlayableBook, type BookContent } from "@book-people/book-data";
import { fetchCatalog, getPlayableBookContent, type CatalogBook } from "./catalog";

function fallbackCatalogAsCatalogBooks(): readonly CatalogBook[] {
  return bookCatalog.listPlayableBooks().map((book) => ({
    id: book.id,
    slug: book.id,
    title: book.title,
    author: book.author ?? null,
    description: book.description ?? null,
    coverAssetPath: book.coverImage ?? null,
    status: "ready" as const,
    versionId: `${book.id}:v1`,
    versionLabel: book.version,
    manifestSha256: null,
    content: book,
  }));
}

type GameStore = {
  state: GameState | null;
  error: string | null;
  catalogLoading: boolean;
  catalogError: string | null;
  selectedBookId: string | null;
  selectedBookVersionId: string | null;
  selectedBook: BookContent | undefined;
  playableBooks: readonly CatalogBook[];
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
  const [selectedBookVersionId, setSelectedBookVersionId] = useState<string | null>(null);
  const [catalogBooks, setCatalogBooks] = useState<readonly CatalogBook[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchCatalog()
      .then((books) => {
        if (!active) return;
        setCatalogBooks(books);
        setCatalogError(null);
      })
      .catch((err) => {
        if (!active) return;
        setCatalogError(err instanceof Error ? err.message : "Failed to load catalog");
        setCatalogBooks([]);
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const effectiveBooks = catalogLoading
    ? fallbackCatalogAsCatalogBooks()
    : catalogBooks.length > 0
      ? catalogBooks
      : fallbackCatalogAsCatalogBooks();

  const selectedBook = selectedBookId
    ? (effectiveBooks.find((b) => b.id === selectedBookId || b.slug === selectedBookId) ??
      undefined)
    : undefined;

  const selectedBookContent = selectedBook ? getPlayableBookContent(selectedBook) : undefined;

  useEffect(() => {
    if (selectedBook && !selectedBookVersionId) {
      setSelectedBookVersionId(selectedBook.versionId);
    }
  }, [selectedBook, selectedBookVersionId]);

  const store: GameStore = {
    state,
    error,
    catalogLoading,
    catalogError,
    selectedBookId,
    selectedBookVersionId,
    selectedBook: selectedBookContent,
    playableBooks: effectiveBooks,
    selectBook(bookId) {
      const book = effectiveBooks.find((b) => b.id === bookId || b.slug === bookId);
      if (!book || !getPlayableBookContent(book)) {
        setError("That book is not ready to play yet.");
        return;
      }
      setSelectedBookId(book.id);
      setSelectedBookVersionId(book.versionId);
      setError(null);
    },
    start(players, rounds) {
      try {
        const book = selectedBookId
          ? effectiveBooks.find((b) => b.id === selectedBookId || b.slug === selectedBookId)
          : undefined;
        const content = book ? getPlayableBookContent(book) : undefined;
        if (!content) throw new Error("Choose a ready book before starting a game.");
        const playableBook = toPlayableBook(content);
        setState(startGame({ players, book: playableBook, rounds, seed: createSeed() }));
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
