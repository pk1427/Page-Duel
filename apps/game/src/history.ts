import { getSupabase } from "./supabase";
import { getResult } from "@book-people/game-core";
import type { GameState, WinReason } from "@book-people/game-core";
import type { BookContent } from "@book-people/book-data";

export interface HistoryMatch {
  id: string;
  bookId: string;
  bookTitle: string;
  bookVersion: string | null;
  bookVersionId: string | null;
  bookAuthor: string | null;
  player1Name: string;
  player2Name: string;
  roundsConfig: 5 | 10 | 15;
  player1PeopleTotal: number;
  player2PeopleTotal: number;
  player1RoundWins: number;
  player2RoundWins: number;
  winnerPlayer: 0 | 1 | null;
  decidingMethod: "people_total" | "round_wins" | "sudden_death" | "draw";
  gameSeed: number | null;
  startedAt: string | null;
  completedAt: string;
  createdAt: string;
}

export interface HistoryRound {
  id: number;
  sessionId: string;
  roundNumber: number;
  roundType: "normal" | "sudden_death";
  spreadId: string;
  leftPageLabel: string | null;
  rightPageLabel: string | null;
  player1Count: number;
  player2Count: number;
  winnerPlayer: 0 | 1 | null;
  createdAt: string;
}

export interface HistoryMatchDetail extends HistoryMatch {
  rounds: HistoryRound[];
}

export interface SaveMatchResult {
  ok: boolean;
  alreadySaved?: boolean;
  matchId?: string;
  error?: string;
}

function toDbDecidingMethod(
  reason: WinReason,
): "people_total" | "round_wins" | "sudden_death" | "draw" {
  switch (reason) {
    case "peopleTotal":
      return "people_total";
    case "roundWins":
      return "round_wins";
    case "suddenDeath":
      return "sudden_death";
    case "draw":
      return "draw";
  }
}

/**
 * Save a completed match and its rounds to Supabase.
 * Uses a new UUID for the match (idempotency via PK constraint on retry).
 * Returns { ok: true, alreadySaved: false, matchId } on success,
 * { ok: true, alreadySaved: true } if the match was already saved,
 * or { ok: false, error: string } on failure.
 */
export async function saveMatch(
  state: GameState,
  bookContent: BookContent,
  bookVersionId?: string | null,
): Promise<SaveMatchResult> {
  const client = getSupabase();
  if (!client) {
    return { ok: false, error: "Supabase is not configured" };
  }

  const result = getResult(state);
  const { config, rounds } = state;

  const matchId = crypto.randomUUID();
  const now = new Date().toISOString();

  const sessionData = {
    id: matchId,
    user_id: (await client.auth.getUser()).data.user?.id,
    book_id: config.book.id,
    book_title: config.book.title,
    book_version_id: bookVersionId ?? null,
    book_version: bookContent.version || null,
    book_author: bookContent.author || null,
    player1_name: config.players[0],
    player2_name: config.players[1],
    rounds_config: config.rounds,
    player1_people_total: result.peopleTotals[0],
    player2_people_total: result.peopleTotals[1],
    player1_round_wins: result.roundWins[0],
    player2_round_wins: result.roundWins[1],
    winner_player: result.winner,
    deciding_method: toDbDecidingMethod(result.reason),
    game_seed: config.seed,
    started_at: null,
    completed_at: now,
    created_at: now,
  };

  const { error: sessionError } = await client.from("game_sessions").insert(sessionData);

  if (sessionError) {
    if (sessionError.code === "23505") {
      return { ok: true, alreadySaved: true };
    }
    return { ok: false, error: sessionError.message };
  }

  const roundsData = rounds.map((round) => ({
    session_id: matchId,
    round_number: round.roundNumber,
    round_type: round.suddenDeath ? "sudden_death" : "normal",
    spread_id: round.spreadId,
    left_page_label: null,
    right_page_label: null,
    player1_count: round.counts[0],
    player2_count: round.counts[1],
    winner_player: round.winner,
  }));

  const { error: roundsError } = await client.from("game_rounds").insert(roundsData);

  if (roundsError) {
    await client.from("game_sessions").delete().eq("id", matchId);
    return { ok: false, error: roundsError.message };
  }

  return { ok: true, alreadySaved: false, matchId };
}

/**
 * Get the authenticated user's match history, newest first.
 */
export async function getHistory(limit = 20, offset = 0): Promise<HistoryMatch[]> {
  const client = getSupabase();
  if (!client) return [];

  const { data, error } = await client
    .from("game_sessions")
    .select(
      "id, book_id, book_title, book_version_id, book_version, book_author, player1_name, player2_name, rounds_config, player1_people_total, player2_people_total, player1_round_wins, player2_round_wins, winner_player, deciding_method, game_seed, started_at, completed_at, created_at",
    )
    .order("completed_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    bookId: row.book_id,
    bookTitle: row.book_title,
    bookVersionId: row.book_version_id,
    bookVersion: row.book_version,
    bookAuthor: row.book_author,
    player1Name: row.player1_name,
    player2Name: row.player2_name,
    roundsConfig: row.rounds_config,
    player1PeopleTotal: row.player1_people_total,
    player2PeopleTotal: row.player2_people_total,
    player1RoundWins: row.player1_round_wins,
    player2RoundWins: row.player2_round_wins,
    winnerPlayer: row.winner_player,
    decidingMethod: row.deciding_method,
    gameSeed: row.game_seed,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  }));
}

/**
 * Get a single match with its rounds by ID.
 * Only returns the match if it belongs to the authenticated user (enforced by RLS).
 */
export async function getMatchDetail(matchId: string): Promise<HistoryMatchDetail | null> {
  const client = getSupabase();
  if (!client) return null;

  const { data: sessionData, error: sessionError } = await client
    .from("game_sessions")
    .select(
      "id, book_id, book_title, book_version_id, book_version, book_author, player1_name, player2_name, rounds_config, player1_people_total, player2_people_total, player1_round_wins, player2_round_wins, winner_player, deciding_method, game_seed, started_at, completed_at, created_at",
    )
    .eq("id", matchId)
    .single();

  if (sessionError || !sessionData) return null;

  const { data: roundsData, error: roundsError } = await client
    .from("game_rounds")
    .select(
      "id, session_id, round_number, round_type, spread_id, left_page_label, right_page_label, player1_count, player2_count, winner_player, created_at",
    )
    .eq("session_id", matchId)
    .order("round_number", { ascending: true });

  if (roundsError) throw roundsError;

  return {
    id: sessionData.id,
    bookId: sessionData.book_id,
    bookTitle: sessionData.book_title,
    bookVersionId: sessionData.book_version_id,
    bookVersion: sessionData.book_version,
    bookAuthor: sessionData.book_author,
    player1Name: sessionData.player1_name,
    player2Name: sessionData.player2_name,
    roundsConfig: sessionData.rounds_config,
    player1PeopleTotal: sessionData.player1_people_total,
    player2PeopleTotal: sessionData.player2_people_total,
    player1RoundWins: sessionData.player1_round_wins,
    player2RoundWins: sessionData.player2_round_wins,
    winnerPlayer: sessionData.winner_player,
    decidingMethod: sessionData.deciding_method,
    gameSeed: sessionData.game_seed,
    startedAt: sessionData.started_at,
    completedAt: sessionData.completed_at,
    createdAt: sessionData.created_at,
    rounds: (roundsData || []).map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      roundNumber: row.round_number,
      roundType: row.round_type,
      spreadId: row.spread_id,
      leftPageLabel: row.left_page_label,
      rightPageLabel: row.right_page_label,
      player1Count: row.player1_count,
      player2Count: row.player2_count,
      winnerPlayer: row.winner_player,
      createdAt: row.created_at,
    })),
  };
}
