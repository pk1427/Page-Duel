export type PlayerIndex = 0 | 1;
export type RoundCount = 5 | 10 | 15;

export interface Page {
  readonly page: number;
  readonly image: string;
  /** Number of people on this page (integer >= 0), per GDD rule 4.2. */
  readonly people: number;
}

export type SpreadFlag = "ambiguous" | "excluded";

export interface Spread {
  readonly id: string;
  readonly left: Page;
  readonly right: Page;
  readonly flags?: readonly SpreadFlag[];
}

export interface Book {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly illustrator?: string;
  readonly license?: string;
  readonly source?: string;
  readonly coverImage: string;
  readonly spreads: readonly Spread[];
}

export interface GameConfig {
  players: [string, string];
  book: Book;
  rounds: RoundCount;
  /** Seed for a reproducible game. Create one with createSeed() when needed. */
  seed: number;
  /** If true, page ownership swaps after the halfway point (GDD 4.1). Default false. */
  swapSides?: boolean;
}

export type Phase =
  | "awaitingFlip" // ready to flip the next spread
  | "spreadShown" // spread displayed, counts not yet scored/revealed
  | "roundScored" // round result recorded, more rounds to play
  | "finished";

export interface RoundResult {
  /** 1-based. Sudden-death rounds continue the numbering past config.rounds. */
  readonly roundNumber: number;
  readonly spreadId: string;
  readonly suddenDeath: boolean;
  /** People count per player for this round (already mapped through side ownership). */
  readonly counts: readonly [number, number];
  /** Round winner, or null for a draw. */
  readonly winner: PlayerIndex | null;
}

export interface GameState {
  readonly config: GameConfig;
  readonly phase: Phase;
  /** Internal RNG state, kept in state so every function stays pure. */
  readonly rngState: number;
  readonly usedSpreadIds: readonly string[];
  readonly currentSpread: Spread | null;
  /** 1-based number of the round currently being played (or last one played). */
  readonly roundNumber: number;
  readonly rounds: readonly RoundResult[];
  readonly roundWins: readonly [number, number];
  readonly peopleTotals: readonly [number, number];
}

export type WinReason = "roundWins" | "peopleTotal" | "suddenDeath" | "draw";

export interface GameResult {
  readonly winner: PlayerIndex | null;
  readonly reason: WinReason;
  readonly roundWins: readonly [number, number];
  readonly peopleTotals: readonly [number, number];
  readonly roundsPlayed: number;
}
