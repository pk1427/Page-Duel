export type PlayerIndex = 0 | 1;
export type RoundCount = 5 | 10 | 15;

export interface Page {
  page: number;
  image: string;
  /** Number of people on this page (integer >= 0), per GDD rule 4.2. */
  people: number;
}

export type SpreadFlag = "ambiguous" | "excluded";

export interface Spread {
  id: string;
  left: Page;
  right: Page;
  flags?: SpreadFlag[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  illustrator?: string;
  license?: string;
  source?: string;
  coverImage: string;
  spreads: Spread[];
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
  roundNumber: number;
  spreadId: string;
  suddenDeath: boolean;
  /** People count per player for this round (already mapped through side ownership). */
  counts: [number, number];
  /** Round winner, or null for a draw. */
  winner: PlayerIndex | null;
}

export interface GameState {
  config: GameConfig;
  phase: Phase;
  /** Internal RNG state, kept in state so every function stays pure. */
  rngState: number;
  usedSpreadIds: string[];
  currentSpread: Spread | null;
  /** 1-based number of the round currently being played (or last one played). */
  roundNumber: number;
  rounds: RoundResult[];
  roundWins: [number, number];
  peopleTotals: [number, number];
}

export type WinReason = "roundWins" | "peopleTotal" | "suddenDeath" | "draw";

export interface GameResult {
  winner: PlayerIndex | null;
  reason: WinReason;
  roundWins: [number, number];
  peopleTotals: [number, number];
  roundsPlayed: number;
}
