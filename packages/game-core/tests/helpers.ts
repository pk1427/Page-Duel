import type { Book, GameState, RoundCount, Spread } from "../src";
import { flipSpread, isGameOver, scoreRound, startGame } from "../src";

export function makeSpread(id: string, left: number, right: number, flags: Spread["flags"] = []): Spread {
  return {
    id,
    left: { page: 1, image: `${id}-l.webp`, people: left },
    right: { page: 2, image: `${id}-r.webp`, people: right },
    flags,
  };
}

export function makeBook(spreads: Spread[]): Book {
  return { id: "test", title: "Test", author: "Tester", coverImage: "c.webp", spreads };
}

/** n spreads with varied counts (all eligible). */
export function varietyBook(n = 40): Book {
  return makeBook(
    Array.from({ length: n }, (_, i) => makeSpread(`s${i}`, (i * 3) % 5 + 1, (i * 7) % 4 + 1)),
  );
}

/** A book where every spread has identical counts on both sides (always a draw). */
export function drawBook(n = 40, count = 2): Book {
  return makeBook(Array.from({ length: n }, (_, i) => makeSpread(`d${i}`, count, count)));
}

export function playRound(state: GameState): GameState {
  return scoreRound(flipSpread(state));
}

export function playToEnd(state: GameState, maxRounds = 100): GameState {
  let s = state;
  let guard = 0;
  while (!isGameOver(s)) {
    s = playRound(s);
    if (++guard > maxRounds) throw new Error("Game did not terminate");
  }
  return s;
}

export function newGame(book: Book, rounds: RoundCount = 10, extra: object = {}): GameState {
  return startGame({ players: ["A", "B"], book, rounds, seed: 42, ...extra });
}
