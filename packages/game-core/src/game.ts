import { nextRandom } from "./rng";
import { eligibleSpreads, validateBook } from "./spreads";
import type {
  GameConfig,
  GameResult,
  GameState,
  PlayerIndex,
  RoundResult,
  Spread,
} from "./types";

const VALID_ROUND_COUNTS = new Set<number>([5, 10, 15]);

/** Which player owns the left / right page in a given round (GDD 4.1). */
export function pageOwners(
  config: Pick<GameConfig, "rounds" | "swapSides">,
  roundNumber: number,
): [PlayerIndex, PlayerIndex] {
  const swapped = !!config.swapSides && roundNumber > config.rounds / 2;
  return swapped ? [1, 0] : [0, 1];
}

/** Create a new game. Throws if the config or book data is unusable. */
export function startGame(config: GameConfig): GameState {
  // RoundCount is erased at runtime, so validate it at the public boundary.
  if (!VALID_ROUND_COUNTS.has(config.rounds)) {
    throw new Error("rounds must be one of 5, 10, or 15");
  }
  if (!Number.isFinite(config.seed)) {
    throw new Error("seed must be a finite number");
  }
  const check = validateBook(config.book);
  if (!check.ok) {
    throw new Error(`Invalid book data:\n${check.errors.join("\n")}`);
  }
  // GDD 4.4: need at least 2x the round count of eligible spreads.
  const eligible = eligibleSpreads(config.book).length;
  if (eligible < config.rounds * 2) {
    throw new Error(
      `Book has ${eligible} eligible spreads; ${config.rounds * 2} needed for ${config.rounds} rounds.`,
    );
  }
  const names: [string, string] = [
    config.players[0].trim() || "Player 1",
    config.players[1].trim() || "Player 2",
  ];
  return {
    config: { ...config, players: names },
    phase: "awaitingFlip",
    rngState: config.seed >>> 0,
    usedSpreadIds: [],
    currentSpread: null,
    roundNumber: 0,
    rounds: [],
    roundWins: [0, 0],
    peopleTotals: [0, 0],
  };
}

function remainingSpreads(state: GameState): Spread[] {
  const used = new Set(state.usedSpreadIds);
  return eligibleSpreads(state.config.book).filter((s) => !used.has(s.id));
}

/** Pick a random unused spread and show it. Counts are not scored yet. */
export function flipSpread(state: GameState): GameState {
  if (state.phase !== "awaitingFlip" && state.phase !== "roundScored") {
    throw new Error(`Cannot flip in phase "${state.phase}"`);
  }
  const pool = remainingSpreads(state);
  if (pool.length === 0) throw new Error("No unused spreads left in this book");
  const [r, rngState] = nextRandom(state.rngState);
  const spread = pool[Math.floor(r * pool.length)]!;
  return {
    ...state,
    phase: "spreadShown",
    rngState,
    currentSpread: spread,
    usedSpreadIds: [...state.usedSpreadIds, spread.id],
    roundNumber: state.rounds.length + 1,
  };
}

/** Score the spread currently shown and decide what happens next. */
export function scoreRound(state: GameState): GameState {
  if (state.phase !== "spreadShown" || !state.currentSpread) {
    throw new Error(`Cannot score in phase "${state.phase}"`);
  }
  const { config, currentSpread: spread, roundNumber } = state;
  const suddenDeath = roundNumber > config.rounds;
  const [leftOwner, rightOwner] = pageOwners(config, roundNumber);

  const counts: [number, number] = [0, 0];
  counts[leftOwner] = spread.left.people;
  counts[rightOwner] = spread.right.people;

  const winner: PlayerIndex | null =
    counts[0] > counts[1] ? 0 : counts[1] > counts[0] ? 1 : null;

  const round: RoundResult = {
    roundNumber,
    spreadId: spread.id,
    suddenDeath,
    counts,
    winner,
  };

  // Sudden-death rounds do not change the regular totals (keeps the result readable).
  const roundWins: [number, number] = [...state.roundWins];
  const peopleTotals: [number, number] = [...state.peopleTotals];
  if (!suddenDeath) {
    if (winner !== null) roundWins[winner] += 1;
    peopleTotals[0] += counts[0];
    peopleTotals[1] += counts[1];
  }

  const next: GameState = {
    ...state,
    rounds: [...state.rounds, round],
    roundWins,
    peopleTotals,
    phase: "roundScored",
  };

  return { ...next, phase: isFinished(next, round) ? "finished" : "roundScored" };
}

function isFinished(state: GameState, lastRound: RoundResult): boolean {
  const { config, roundWins, peopleTotals } = state;
  const played = state.rounds.length;
  if (played < config.rounds) return false;

  if (lastRound.suddenDeath) {
    if (lastRound.winner !== null) return true;
  } else {
    if (roundWins[0] !== roundWins[1]) return true;
    if (peopleTotals[0] !== peopleTotals[1]) return true;
  }
  // Still tied: keep going while spreads remain, otherwise call it a draw.
  return remainingSpreads(state).length === 0;
}

export function isGameOver(state: GameState): boolean {
  return state.phase === "finished";
}

/** Final result. Only valid once the game is finished. */
export function getResult(state: GameState): GameResult {
  if (state.phase !== "finished") {
    throw new Error("Game is not finished");
  }
  const { roundWins, peopleTotals, rounds } = state;
  const base = {
    roundWins: [...roundWins] as [number, number],
    peopleTotals: [...peopleTotals] as [number, number],
    roundsPlayed: rounds.length,
  };

  if (roundWins[0] !== roundWins[1]) {
    return { ...base, winner: roundWins[0] > roundWins[1] ? 0 : 1, reason: "roundWins" };
  }
  if (peopleTotals[0] !== peopleTotals[1]) {
    return {
      ...base,
      winner: peopleTotals[0] > peopleTotals[1] ? 0 : 1,
      reason: "peopleTotal",
    };
  }
  const decider = rounds.filter((r) => r.suddenDeath && r.winner !== null).at(-1);
  if (decider && decider.winner !== null) {
    return { ...base, winner: decider.winner, reason: "suddenDeath" };
  }
  return { ...base, winner: null, reason: "draw" };
}
