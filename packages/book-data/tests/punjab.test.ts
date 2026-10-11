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
  placeholderContentPack,
  punjabContentPack,
  resolvePageAsset,
  toPlayableBook,
  validateContentPack,
} from "../src";

describe("tales of the punjab catalog integration", () => {
  it("appears in the playable catalog with player-facing details", () => {
    expect(punjabContentPack.id).toBe("tales-of-punjab-1894");
    expect(punjabContentPack.title).toBe("Tales of the Punjab");
    expect(punjabContentPack.author).toBe("Flora Annie Steel");
    expect(punjabContentPack.year).toBe(1894);
    expect(punjabContentPack.coverImage).toBe("cover.webp");
    expect(punjabContentPack.status).toBe("ready");
    expect(bookCatalog.listBooks().map((book) => book.id)).toEqual([
      "placeholder-book",
      "alice-loc-1885",
      "tales-of-punjab-1894",
    ]);
    expect(bookCatalog.getBook("tales-of-punjab-1894")).toBe(punjabContentPack);
    expect(bookCatalog.listPlayableBooks().map((book) => book.id)).toEqual([
      "placeholder-book",
      "alice-loc-1885",
      "tales-of-punjab-1894",
    ]);
  });

  it("converts to a valid generic game-core book with 149 spreads", () => {
    const punjab = bookCatalog.getPlayableBook("tales-of-punjab-1894")!;
    expect(punjab.spreads).toHaveLength(149);
    expect(validateBook(punjab).ok).toBe(true);
    expect(toPlayableBook(punjabContentPack).id).toBe("tales-of-punjab-1894");
  });

  it("has exactly 38 eligible spreads under the existing validator", () => {
    const punjab = bookCatalog.getPlayableBook("tales-of-punjab-1894")!;
    expect(eligibleSpreads(punjab)).toHaveLength(38);
    const validation = validateContentPack(punjabContentPack);
    expect(validation).toMatchObject({
      ok: true,
      playable: true,
      eligibleSpreadCount: 38,
      roundAvailability: { 5: true, 10: true, 15: true },
    });
  });

  it("starts 5, 10, and 15 round games", () => {
    const punjab = bookCatalog.getPlayableBook("tales-of-punjab-1894")!;
    for (const rounds of [5, 10, 15] as const) {
      expect(() => startGame({ players: ["A", "B"], book: punjab, rounds, seed: 1 })).not.toThrow();
    }
  });

  it("keeps spread IDs isolated per selected book", () => {
    const punjabIds = new Set(punjabContentPack.spreads.map((spread) => spread.id));
    const aliceIds = new Set(aliceContentPack.spreads.map((spread) => spread.id));
    const placeholderIds = new Set(placeholderContentPack.spreads.map((spread) => spread.id));
    // Spread IDs are unique within each book; cross-book overlap is fine because
    // a game session always uses spreads from a single selected book.
    expect(punjabIds.size).toBe(punjabContentPack.spreads.length);
    expect(aliceIds.size).toBe(aliceContentPack.spreads.length);
    expect(placeholderIds.size).toBe(placeholderContentPack.spreads.length);

    const punjab = bookCatalog.getPlayableBook("tales-of-punjab-1894")!;
    const alice = bookCatalog.getPlayableBook("alice-loc-1885")!;
    const practice = bookCatalog.getPlayableBook("placeholder-book")!;
    const playFive = (book: typeof punjab) => {
      let state = startGame({ players: ["A", "B"], book, rounds: 5, seed: 33 });
      for (let round = 0; round < 5; round += 1) {
        state = flipSpread(state);
        state = scoreRound(state);
      }
      return state;
    };
    const punjabState = playFive(punjab);
    const aliceState = playFive(alice);
    const practiceState = playFive(practice);
    // Each game session stays inside its selected book's data.
    expect(punjabState.config.book.id).toBe("tales-of-punjab-1894");
    expect(aliceState.config.book.id).toBe("alice-loc-1885");
    expect(practiceState.config.book.id).toBe("placeholder-book");
    const punjabSequence = punjabState.usedSpreadIds;
    const aliceSequence = aliceState.usedSpreadIds;
    const practiceSequence = practiceState.usedSpreadIds;
    expect(punjabSequence.every((id) => punjabIds.has(id))).toBe(true);
    expect(aliceSequence.every((id) => aliceIds.has(id))).toBe(true);
    expect(practiceSequence.every((id) => placeholderIds.has(id))).toBe(true);
    // Dealt spreads resolve to the owning book's own page records.
    for (const id of punjabSequence) {
      const dealt = punjabState.config.book.spreads.find((spread) => spread.id === id)!;
      const canonical = punjabContentPack.spreads.find((spread) => spread.id === id)!;
      expect(dealt.left.image).toBe(canonical.left.image);
      expect(dealt.right.image).toBe(canonical.right.image);
    }
  });

  it("resolves relative punjab asset paths against the configured base URL", () => {
    const spread = punjabContentPack.spreads[0]!;
    expect(resolvePageAsset(punjabContentPack, spread.left)).toBe("pages/p000.webp");
    expect(
      resolvePageAsset(punjabContentPack, spread.left, "https://cdn.example/books/punjab"),
    ).toBe("https://cdn.example/books/punjab/pages/p000.webp");
    expect(punjabContentPack.coverImage).toBe("cover.webp");
    expect(
      resolvePageAsset(
        punjabContentPack,
        { image: punjabContentPack.coverImage! },
        "https://cdn.example/books/punjab/",
      ),
    ).toBe("https://cdn.example/books/punjab/cover.webp");
    for (const candidate of punjabContentPack.spreads) {
      for (const page of [candidate.left, candidate.right] as const) {
        expect(page.image).not.toMatch(/localhost/i);
        expect(page.image.startsWith("/")).toBe(false);
      }
    }
  });

  it("rejects invalid or incomplete punjab-shaped content from gameplay", () => {
    const draftPunjab = {
      ...punjabContentPack,
      status: "draft" as const,
      spreads: punjabContentPack.spreads.map((spread) => ({
        ...spread,
        left: { ...spread.left, people: null },
      })),
    };
    expect(validateContentPack(draftPunjab).playable).toBe(false);
    expect(() => toPlayableBook(draftPunjab)).toThrow();
    expect(bookCatalog.getPlayableBook("no-such-book")).toBeUndefined();
  });
});
