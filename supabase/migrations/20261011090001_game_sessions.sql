-- Completed game sessions: one row per finished game, owned by one account.
--
-- Mapping from the game engine (packages/game-core, frozen in this phase):
--   GameState.config.players        -> player1_name / player2_name
--   GameState.config.rounds (5|10|15) -> rounds_config
--   GameState.config.seed           -> game_seed (nullable; reproducibility aid only)
--   GameState.config.book.id/title -> book_id / book_title (stable snapshot)
--   BookContent.version/author      -> book_version / book_author (snapshots;
--                                      game-core Book carries no version, so a later
--                                      phase must pass these from the catalog)
--   getResult(state).peopleTotals   -> player1/2_people_total
--   getResult(state).roundWins      -> player1/2_round_wins
--   getResult(state).winner         -> winner_player (0 = player 1, 1 = player 2,
--                                      NULL = draw, exactly matching game-core null)
--   getResult(state).reason         -> deciding_method, 1:1 with WinReason:
--                                      peopleTotal | roundWins | suddenDeath | draw
--
-- History is append-only through client permissions: no update/delete grants.
-- The client-generated UUID primary key is the idempotency key for save retries.

create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade
    default auth.uid(),
  book_id text not null,
  book_title text not null,
  book_version text,
  book_author text,
  player1_name text not null check (char_length(player1_name) between 1 and 60),
  player2_name text not null check (char_length(player2_name) between 1 and 60),
  rounds_config smallint not null check (rounds_config in (5, 10, 15)),
  player1_people_total integer not null check (player1_people_total >= 0),
  player2_people_total integer not null check (player2_people_total >= 0),
  player1_round_wins integer not null check (player1_round_wins >= 0),
  player2_round_wins integer not null check (player2_round_wins >= 0),
  winner_player smallint check (winner_player in (0, 1)),
  deciding_method text not null
    check (deciding_method in ('people_total', 'round_wins', 'sudden_death', 'draw')),
  game_seed bigint check (game_seed is null or game_seed >= 0),
  started_at timestamptz,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  -- game-core decides draw exactly when winner is null; enforce the same here.
  check ((winner_player is null) = (deciding_method = 'draw')),
  check (started_at is null or completed_at >= started_at)
);

-- The authenticated user's own history, newest first.
create index game_sessions_owner_history_idx
  on public.game_sessions using btree (user_id, completed_at desc);

alter table public.game_sessions enable row level security;

revoke all on table public.game_sessions from anon, authenticated;

grant select, insert on table public.game_sessions to authenticated;

create policy "Users read their own game sessions."
  on public.game_sessions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users save game sessions as themselves."
  on public.game_sessions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
