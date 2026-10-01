import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { eligibleSpreads, startGame, validateBook } from "../../../packages/game-core/src";
import { flipSpread, isGameOver, scoreRound } from "../../../packages/game-core/src";

describe("book-prep final compatibility", () => {
  it("accepts the generated final book and plays a full ten-round game", () => {
    const path = process.env.BOOK_PREP_FINAL;
    expect(path).toBeTruthy();
    const book = JSON.parse(readFileSync(path!, "utf8"));
    expect(validateBook(book).ok).toBe(true);
    expect(eligibleSpreads(book).length).toBeGreaterThanOrEqual(20);
    let state = startGame({ players: ["A", "B"], book, rounds: 10, seed: 1 });
    while (!isGameOver(state)) state = scoreRound(flipSpread(state));
    expect(state.rounds.length).toBeGreaterThanOrEqual(10);
  });
});
