import { describe, expect, it } from "vitest";
import { eligibleSpreads, startGame, validateBook } from "../../../packages/game-core/src";

describe("book-prep final compatibility", () => {
  it("accepts an integer-only final-book fixture for ten rounds", () => {
    const book = { id: "final", title: "Final", author: "A", coverImage: "https://cdn.example/cover.webp", spreads: Array.from({ length: 20 }, (_, i) => ({ id: `s${i}`, left: { page: i * 2 + 1, image: `https://cdn.example/p${i}l.webp`, people: i % 4 }, right: { page: i * 2 + 2, image: `https://cdn.example/p${i}r.webp`, people: (i + 1) % 4 }, flags: i === 0 ? ["excluded"] : [] })) };
    expect(validateBook(book).ok).toBe(true);
    expect(eligibleSpreads(book)).toHaveLength(19);
    // Add a final eligible spread to satisfy the 20-spread startup requirement.
    book.spreads.push({ id: "s20", left: { page: 43, image: "https://cdn.example/a.webp", people: 2 }, right: { page: 44, image: "https://cdn.example/b.webp", people: 1 }, flags: [] });
    expect(() => startGame({ players: ["A", "B"], book, rounds: 10, seed: 1 })).not.toThrow();
  });
});
