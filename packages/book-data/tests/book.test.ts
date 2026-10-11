import { describe, expect, it } from "vitest";
import {
  eligibleSpreads,
  flipSpread,
  scoreRound,
  startGame,
  validateBook,
} from "@book-people/game-core";
import {
  aliceContentPack,
  bookCatalog,
  createBookCatalog,
  placeholderBook,
  placeholderContentPack,
  resolvePageAsset,
  toPlayableBook,
  validateContentPack,
  type BookContent,
} from "../src";
describe("placeholderBook", () => {
  it("is deterministic, valid, varied and playable", () => {
    expect(validateBook(placeholderBook).ok).toBe(true);
    const eligible = eligibleSpreads(placeholderBook);
    expect(eligible.length).toBeGreaterThanOrEqual(30);
    expect(
      eligible.filter((s) => s.left.people === s.right.people).length / eligible.length,
    ).toBeLessThan(0.35);
    for (const rounds of [5, 10, 15] as const)
      expect(() =>
        startGame({ players: ["A", "B"], book: placeholderBook, rounds, seed: 1 }),
      ).not.toThrow();
  });
});

describe("book catalog and content validation", () => {
  it("keeps Practice Book and final Alice together as playable catalog content", () => {
    expect(bookCatalog.listBooks().map((book) => book.id)).toEqual([
      "placeholder-book",
      "alice-loc-1885",
      "tales-of-punjab-1894",
    ]);
    expect(bookCatalog.getBook("alice-loc-1885")).toBe(aliceContentPack);
    expect(bookCatalog.listPlayableBooks().map((book) => book.id)).toEqual([
      "placeholder-book",
      "alice-loc-1885",
      "tales-of-punjab-1894",
    ]);
    const alice = bookCatalog.getPlayableBook("alice-loc-1885")!;
    expect(alice.spreads).toHaveLength(95);
    expect(validateBook(alice).ok).toBe(true);
    expect(eligibleSpreads(alice)).toHaveLength(34);
    for (const rounds of [5, 10, 15] as const) {
      expect(() => startGame({ players: ["A", "B"], book: alice, rounds, seed: 1 })).not.toThrow();
    }
  });

  it("rejects incomplete Alice content from gameplay", () => {
    const incompleteAlice: BookContent = {
      ...aliceContentPack,
      status: "draft",
      spreads: aliceContentPack.spreads.map((spread) => ({
        ...spread,
        left: { ...spread.left, people: null },
      })),
    };
    const validation = validateContentPack(incompleteAlice);
    expect(validation.playable).toBe(false);
    expect(() => toPlayableBook(incompleteAlice)).toThrow(/draft content/);
  });

  it("allows a fully counted Alice-shaped pack only after it is marked ready", () => {
    const draftAlice: BookContent = {
      ...aliceContentPack,
      status: "draft",
      spreads: aliceContentPack.spreads.map((spread) => ({
        ...spread,
        id: `alice-${spread.id}`,
        left: { ...spread.left, people: null },
        right: { ...spread.right, people: null },
      })),
    };
    expect(validateContentPack(draftAlice)).toMatchObject({ ok: true, playable: false });
    expect(() => toPlayableBook(draftAlice)).toThrow(/draft content/);

    const readyAlice: BookContent = {
      ...draftAlice,
      status: "ready",
      spreads: aliceContentPack.spreads.map((spread) => ({
        ...spread,
        id: `alice-${spread.id}`,
      })),
    };
    expect(validateContentPack(readyAlice)).toMatchObject({ ok: true, playable: true });
    expect(toPlayableBook(readyAlice).spreads).toHaveLength(95);
  });

  it("validates duplicate book and spread/page identifiers plus missing ready counts", () => {
    const invalid: BookContent = {
      ...placeholderContentPack,
      id: "invalid",
      spreads: [
        {
          ...placeholderContentPack.spreads[0]!,
          left: { ...placeholderContentPack.spreads[0]!.left, people: null },
        },
        { ...placeholderContentPack.spreads[0]! },
      ],
    };
    expect(validateContentPack(invalid)).toMatchObject({ playable: false });
    expect(() =>
      createBookCatalog([placeholderContentPack, { ...placeholderContentPack }]),
    ).toThrow(/Duplicate book id/);
  });

  it("isolates selected books and preserves a deterministic sequence within each book", () => {
    const catalog = createBookCatalog([placeholderContentPack, aliceContentPack]);
    const firstBook = catalog.getPlayableBook("placeholder-book")!;
    const aliceBook = catalog.getPlayableBook("alice-loc-1885")!;
    const sequence = (book: typeof firstBook) => {
      let state = startGame({ players: ["A", "B"], book, rounds: 5, seed: 33 });
      for (let round = 0; round < 5; round += 1) {
        state = flipSpread(state);
        state = scoreRound(state);
      }
      return state.usedSpreadIds;
    };
    expect(sequence(firstBook)).toEqual(sequence(firstBook));
    expect(sequence(firstBook).every((id) => id.startsWith("placeholder-"))).toBe(true);
    expect(sequence(aliceBook).every((id) => id.startsWith("s"))).toBe(true);
    expect(new Set([...sequence(firstBook), ...sequence(aliceBook)]).size).toBe(10);
  });

  it("keeps canonical paths relative and accepts a runtime asset base without game-core awareness", () => {
    expect(resolvePageAsset(aliceContentPack, aliceContentPack.spreads[0]!.left)).toBe(
      "pages/p002.webp",
    );
    expect(
      resolvePageAsset(
        aliceContentPack,
        aliceContentPack.spreads[0]!.left,
        "http://localhost:8000/",
      ),
    ).toBe("http://localhost:8000/pages/p002.webp");
    expect(
      resolvePageAsset(aliceContentPack, { image: "https://example.test/p003.webp" }, "http://x"),
    ).toBe("https://example.test/p003.webp");
    expect(resolvePageAsset(aliceContentPack, { image: "https://example.test/p003.webp" })).toBe(
      "https://example.test/p003.webp",
    );
  });
});
