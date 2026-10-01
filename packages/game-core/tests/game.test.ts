import { describe, expect, it } from "vitest";
import {
  eligibleSpreads,
  flipSpread,
  getResult,
  isGameOver,
  pageOwners,
  scoreRound,
  startGame,
  validateBook,
} from "../src";
import { drawBook, makeBook, makeSpread, newGame, playRound, playToEnd, varietyBook } from "./helpers";

describe("eligibility and validation", () => {
  it("excludes both-zero spreads and excluded-flag spreads, keeps one-zero spreads", () => {
    const book = makeBook([
      makeSpread("a", 0, 0),
      makeSpread("b", 0, 3),
      makeSpread("c", 2, 2, ["excluded"]),
      makeSpread("d", 1, 1, ["ambiguous"]),
    ]);
    expect(eligibleSpreads(book).map((s) => s.id)).toEqual(["b", "d"]);
  });

  it("validateBook catches duplicate ids, negative and fractional counts", () => {
    const book = makeBook([makeSpread("a", 1, 1), makeSpread("a", -1, 1.5)]);
    const { ok, errors } = validateBook(book);
    expect(ok).toBe(false);
    expect(errors.length).toBe(3);
  });

  it("startGame rejects books with too few eligible spreads (needs 2x rounds)", () => {
    const small = varietyBook(19);
    expect(() => newGame(small, 10)).toThrow(/20 needed/);
    expect(() => newGame(varietyBook(20), 10)).not.toThrow();
  });

  it("startGame rejects unsupported runtime round counts", () => {
    for (const rounds of [0, 7, Number.NaN]) {
      expect(() =>
        startGame({ players: ["A", "B"], book: varietyBook(), rounds: rounds as never, seed: 1 }),
      ).toThrow(/rounds must be one of 5, 10, or 15/);
    }
  });

  it("startGame falls back to default names for blank input", () => {
    const s = startGame({ players: ["  ", ""], book: varietyBook(), rounds: 5, seed: 1 });
    expect(s.config.players).toEqual(["Player 1", "Player 2"]);
  });
});

describe("state machine", () => {
  it("only allows valid transitions", () => {
    const s0 = newGame(varietyBook());
    expect(() => scoreRound(s0)).toThrow();
    const s1 = flipSpread(s0);
    expect(s1.phase).toBe("spreadShown");
    expect(() => flipSpread(s1)).toThrow();
    const s2 = scoreRound(s1);
    expect(s2.phase).toBe("roundScored");
    expect(() => scoreRound(s2)).toThrow();
    expect(() => getResult(s2)).toThrow(/not finished/);
  });

  it("is immutable: functions never mutate the previous state", () => {
    const s0 = newGame(varietyBook());
    const snapshot = JSON.stringify(s0);
    const s1 = flipSpread(s0);
    scoreRound(s1);
    expect(JSON.stringify(s0)).toBe(snapshot);
  });

  it("copies the input book so later caller mutations cannot affect eligibility or scoring", () => {
    const book = makeBook(Array.from({ length: 20 }, (_, i) => makeSpread(`s${i}`, 4, 1)));
    const state = newGame(book);
    expect(state.config.book).not.toBe(book);

    const mutableBook = book as unknown as {
      spreads: Array<{ left: { people: number }; right: { people: number } }>;
    };
    for (const spread of mutableBook.spreads) {
      spread.left.people = 0;
      spread.right.people = 0;
    }

    expect(eligibleSpreads(book)).toHaveLength(0);
    expect(eligibleSpreads(state.config.book)).toHaveLength(20);
    expect(playRound(state).rounds[0]!.counts).toEqual([4, 1]);
  });
});

describe("scoring", () => {
  it("left page scores for player 1, right page for player 2", () => {
    const book = makeBook(Array.from({ length: 20 }, (_, i) => makeSpread(`s${i}`, 4, 1)));
    const s = playRound(newGame(book));
    expect(s.rounds[0]!.counts).toEqual([4, 1]);
    expect(s.rounds[0]!.winner).toBe(0);
    expect(s.roundWins).toEqual([1, 0]);
    expect(s.peopleTotals).toEqual([4, 1]);
  });

  it("a draw round gives no round win but still adds people", () => {
    const s = playRound(newGame(drawBook(20, 3)));
    expect(s.rounds[0]!.winner).toBeNull();
    expect(s.roundWins).toEqual([0, 0]);
    expect(s.peopleTotals).toEqual([3, 3]);
  });

  it("a zero-people page scores 0", () => {
    const book = makeBook(Array.from({ length: 20 }, (_, i) => makeSpread(`s${i}`, 0, 2)));
    const s = playRound(newGame(book));
    expect(s.rounds[0]!.counts).toEqual([0, 2]);
    expect(s.rounds[0]!.winner).toBe(1);
  });
});

describe("randomness", () => {
  it("never repeats a spread within a game", () => {
    const end = playToEnd(newGame(varietyBook(20), 10));
    const ids = end.rounds.map((r) => r.spreadId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("same seed gives the same game; different seeds differ", () => {
    const seq = (seed: number) =>
      playToEnd(newGame(varietyBook(), 10, { seed })).rounds.map((r) => r.spreadId).join(",");
    expect(seq(7)).toBe(seq(7));
    expect(seq(7)).not.toBe(seq(8));
  });

  it("normalizes unusual finite numeric seeds reproducibly", () => {
    const config = { players: ["A", "B"] as [string, string], book: varietyBook(), rounds: 5 as const };
    for (const seed of [0, -123.75, Number.MAX_VALUE]) {
      const left = startGame({ ...config, seed });
      const right = startGame({ ...config, seed });
      expect(playToEnd(left)).toEqual(playToEnd(right));
    }
    expect(() => startGame({ ...config, seed: Number.NaN })).toThrow(/seed must be a finite number/);
  });

  it("different seeds produce different games", () => {
    const config = { players: ["A", "B"] as [string, string], book: varietyBook(), rounds: 10 as const };
    expect(playToEnd(startGame({ ...config, seed: 7 })).rounds).not.toEqual(
      playToEnd(startGame({ ...config, seed: 8 })).rounds,
    );
  });

  it("requires a seed at runtime", () => {
    expect(() =>
      startGame({ players: ["A", "B"], book: varietyBook(), rounds: 5 } as unknown as Parameters<typeof startGame>[0]),
    ).toThrow(/seed must be a finite number/);
  });

  it("continues identically after a JSON round-trip mid-game", () => {
    let original = newGame(varietyBook(40), 10, { seed: 1234 });
    original = playRound(playRound(original));
    let restored = JSON.parse(JSON.stringify(original)) as typeof original;
    while (!isGameOver(original)) {
      original = playRound(original);
      restored = playRound(restored);
      expect(restored).toEqual(original);
    }
  });

  it("terminates without repeated spreads and returns a consistent result across seeds", () => {
    const expectedResult = (state: ReturnType<typeof playToEnd>) => {
      const result = getResult(state);
      if (state.roundWins[0] !== state.roundWins[1]) {
        expect(result).toMatchObject({
          winner: state.roundWins[0] > state.roundWins[1] ? 0 : 1,
          reason: "roundWins",
        });
      } else if (state.peopleTotals[0] !== state.peopleTotals[1]) {
        expect(result).toMatchObject({
          winner: state.peopleTotals[0] > state.peopleTotals[1] ? 0 : 1,
          reason: "peopleTotal",
        });
      } else {
        const decider = state.rounds.filter((round) => round.suddenDeath && round.winner !== null).pop();
        expect(result).toMatchObject(
          decider ? { winner: decider.winner, reason: "suddenDeath" } : { winner: null, reason: "draw" },
        );
      }
    };

    for (const rounds of [5, 10, 15] as const) {
      for (let seed = 0; seed < 200; seed++) {
        const end = playToEnd(newGame(varietyBook(40), rounds, { seed }), 40);
        expect(end.rounds.length).toBeLessThanOrEqual(40);
        expect(new Set(end.rounds.map((round) => round.spreadId)).size).toBe(end.rounds.length);
        expectedResult(end);
      }
    }
  });
});

describe("game end and results", () => {
  it("returns result totals without sharing mutable tuples with game state", () => {
    const book = makeBook(Array.from({ length: 20 }, (_, i) => makeSpread(`s${i}`, 5, 1)));
    const end = playToEnd(newGame(book, 5));
    const snapshot = JSON.stringify(end);
    const result = getResult(end);
    (result.roundWins as [number, number])[0] = 999;
    (result.peopleTotals as [number, number])[0] = 999;
    expect(JSON.stringify(end)).toBe(snapshot);
  });

  it("ends after the configured rounds when someone leads on round wins", () => {
    const book = makeBook(Array.from({ length: 40 }, (_, i) => makeSpread(`s${i}`, 5, 1)));
    for (const rounds of [5, 10, 15] as const) {
      const end = playToEnd(newGame(book, rounds));
      expect(end.rounds.length).toBe(rounds);
      const r = getResult(end);
      expect(r.winner).toBe(0);
      expect(r.reason).toBe("roundWins");
    }
  });

  it("tied round wins are decided by people total", () => {
    // 5 rounds: alternate who wins, but player 1's wins are bigger. Build 2 spread types.
    const spreads = [
      ...Array.from({ length: 10 }, (_, i) => makeSpread(`a${i}`, 9, 1)), // P1 wins big
      ...Array.from({ length: 10 }, (_, i) => makeSpread(`b${i}`, 1, 2)), // P2 wins small
    ];
    // Search seeds for a 10-round game (even count, so wins can tie) where totals differ.
    let found = false;
    for (let seed = 1; seed < 500 && !found; seed++) {
      const end = playToEnd(newGame(makeBook(spreads), 10, { seed }));
      const r = getResult(end);
      if (r.reason === "peopleTotal") {
        found = true;
        expect(r.roundWins[0]).toBe(r.roundWins[1]);
        expect(r.peopleTotals[0]).not.toBe(r.peopleTotals[1]);
        expect(r.winner).toBe(r.peopleTotals[0] > r.peopleTotals[1] ? 0 : 1);
      }
    }
    expect(found).toBe(true);
  });

  it("fully tied games go to sudden death and stop once a round has a winner", () => {
    // 2 round-draw spreads per game cannot tie wins+totals unless all draws; then a decisive spread ends it.
    const spreads = [
      ...Array.from({ length: 10 }, (_, i) => makeSpread(`d${i}`, 2, 2)),
      ...Array.from({ length: 10 }, (_, i) => makeSpread(`w${i}`, 3, 1)),
    ];
    let foundSudden = false;
    for (let seed = 1; seed < 2000 && !foundSudden; seed++) {
      const end = playToEnd(newGame(makeBook(spreads), 5, { seed }));
      const r = getResult(end);
      if (r.reason === "suddenDeath") {
        foundSudden = true;
        expect(r.roundsPlayed).toBeGreaterThan(5);
        const last = end.rounds[end.rounds.length - 1]!;
        expect(last.suddenDeath).toBe(true);
        expect(last.winner).not.toBeNull();
        // Sudden death does not alter the regular totals.
        expect(r.roundWins[0]).toBe(r.roundWins[1]);
        expect(r.peopleTotals[0]).toBe(r.peopleTotals[1]);
      }
    }
    expect(foundSudden).toBe(true);
  });

  it("sudden death never changes the regular round wins or people totals", () => {
    const book = makeBook([
      ...Array.from({ length: 10 }, (_, i) => makeSpread(`d${i}`, 2, 2)),
      ...Array.from({ length: 10 }, (_, i) => makeSpread(`w${i}`, 3, 1)),
    ]);
    let end;
    for (let seed = 1; seed < 2000; seed++) {
      const candidate = playToEnd(newGame(book, 5, { seed }));
      if (getResult(candidate).reason === "suddenDeath") {
        end = candidate;
        break;
      }
    }
    expect(end).toBeDefined();
    const finished = end!;
    const regular = finished.rounds.filter((round) => !round.suddenDeath);
    const expectedWins: [number, number] = [0, 0];
    const expectedTotals: [number, number] = [0, 0];
    for (const round of regular) {
      if (round.winner !== null) expectedWins[round.winner] += 1;
      expectedTotals[0] += round.counts[0];
      expectedTotals[1] += round.counts[1];
    }
    expect(finished.roundWins).toEqual(expectedWins);
    expect(finished.peopleTotals).toEqual(expectedTotals);
  });

  it("an all-draw book ends as a draw once spreads run out", () => {
    const end = playToEnd(newGame(drawBook(20, 2), 10));
    expect(isGameOver(end)).toBe(true);
    const r = getResult(end);
    expect(r.winner).toBeNull();
    expect(r.reason).toBe("draw");
    expect(r.roundsPlayed).toBe(20);
  });
});

describe("side swap", () => {
  it("swaps page ownership after the halfway point only when enabled", () => {
    expect(pageOwners({ rounds: 10, swapSides: false }, 9)).toEqual([0, 1]);
    expect(pageOwners({ rounds: 10, swapSides: true }, 5)).toEqual([0, 1]);
    expect(pageOwners({ rounds: 10, swapSides: true }, 6)).toEqual([1, 0]);
  });

  it("applies the swap when scoring", () => {
    const book = makeBook(Array.from({ length: 40 }, (_, i) => makeSpread(`s${i}`, 4, 1)));
    const end = playToEnd(newGame(book, 10, { swapSides: true }));
    expect(end.rounds[0]!.counts).toEqual([4, 1]);
    expect(end.rounds[9]!.counts).toEqual([1, 4]);
    // Swapping makes the results symmetric: 5 wins each and equal totals, so sudden death decides.
    const r = getResult(end);
    expect(r.roundWins).toEqual([5, 5]);
    expect(r.peopleTotals).toEqual([25, 25]);
    expect(r.reason).toBe("suddenDeath");
  });
});
