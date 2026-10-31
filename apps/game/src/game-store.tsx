import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createSeed, startGame, type GameState, type RoundCount } from "@book-people/game-core";
import { bookCatalog, toPlayableBook, type BookContent } from "@book-people/book-data";
import { fetchCatalog, filterCatalogByLanguage, getPlayableBookContent, type CatalogBook } from "./catalog";
import { isSupabaseConfigured } from "./supabase";
import { copy, useLanguage, type BookshelfLanguage } from "./copy";

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
    language: "en",
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
  bookshelfLanguage: BookshelfLanguage;
  setBookshelfLanguage: (language: BookshelfLanguage) => void;
  selectBook: (bookId: string) => void;
  start: (players: [string, string], rounds: RoundCount) => void;
  update: (state: GameState) => void;
};
const GameContext = createContext<GameStore | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(
    bookCatalog.listPlayableBooks()[0]?.id ?? null,
  );
  const [selectedBookVersionId, setSelectedBookVersionId] = useState<string | null>(null);
  const [catalogBooks, setCatalogBooks] = useState<readonly CatalogBook[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [bookshelfLanguage, setBookshelfLanguage] = useState<BookshelfLanguage>(language);

  // An interface-language change intentionally resets the default shelf. It
  // does not touch the selected book or an in-progress match.
  useEffect(() => {
    setBookshelfLanguage(language);
  }, [language]);

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
        setCatalogError(copy.errors.catalogUnavailable);
        setCatalogBooks([]);
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // A configured backend is authoritative. Falling back to packaged books
  // after a production catalog failure makes unavailable content look playable.
  const effectiveBooks = isSupabaseConfigured
    ? catalogLoading
      ? []
      : catalogBooks
    : fallbackCatalogAsCatalogBooks();

  const playableBooks = filterCatalogByLanguage(effectiveBooks, bookshelfLanguage);

  const selectedBook = selectedBookId
    ? (effectiveBooks.find((b) => b.id === selectedBookId || b.slug === selectedBookId) ??
      undefined)
    : undefined;

  const selectedBookContent = selectedBook ? getPlayableBookContent(selectedBook) : undefined;

  const effectiveSelectedBookVersionId = selectedBookVersionId ?? selectedBook?.versionId ?? null;

  const store: GameStore = {
    state,
    error,
    catalogLoading,
    catalogError,
    selectedBookId,
    selectedBookVersionId: effectiveSelectedBookVersionId,
    selectedBook: selectedBookContent,
    playableBooks,
    bookshelfLanguage,
    setBookshelfLanguage,
    selectBook(bookId) {
      const book = effectiveBooks.find((b) => b.id === bookId || b.slug === bookId);
      if (!book || !getPlayableBookContent(book)) {
        setError(copy.errors.bookNotReady);
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
        if (!content) throw new Error(copy.errors.startGame);
        const playableBook = toPlayableBook(content);
        setState(startGame({ players, book: playableBook, rounds, seed: createSeed() }));
        setError(null);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : copy.errors.startGame);
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
