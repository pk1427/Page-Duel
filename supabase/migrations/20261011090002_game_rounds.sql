-- Per-round breakdown of a completed game session.
--
-- Mapping from the game engine (packages/game-core, frozen in this phase);
-- one row per RoundResult in GameState.rounds:
--   RoundResult.roundNumber      -> round_number
--   RoundResult.suddenDeath      -> round_type ('sudden_death' | 'normal')
--   RoundResult.spreadId         -> spread_id (stable within its book)
--   RoundResult.counts[0] / [1]  -> player1_count / player2_count
--                                    (authoritative per-player counts; storing
--                                    player-oriented counts keeps history correct
--                                    even if side ownership ever changes)
--   RoundResult.winner           -> winner_player (0 | 1, NULL = tied round)
-- Printed page labels are display snapshots resolved from the content catalog
-- by a later phase (ContentSpread.printedPage); game-core carries no labels.
--
-- Reconstructing a historical result needs only these rows plus the parent
-- session: no recalculation from current book content, no image storage.

create table public.game_rounds (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  round_number smallint not null check (round_number > 0),
  round_type text not null check (round_type in ('normal', 'sudden_death')),
  spread_id text not null,
  left_page_label text,
  right_page_label text,
  player1_count integer not null check (player1_count >= 0),
  player2_count integer not null check (player2_count >= 0),
  winner_player smallint check (winner_player in (0, 1)),
  created_at timestamptz not null default now(),
  unique (session_id, round_number)
);

-- A session's rounds, in playing order. The unique constraint provides this
-- btree; named here so the access path is explicit and protected from drift.
create index game_rounds_session_order_idx
  on public.game_rounds using btree (session_id, round_number);

alter table public.game_rounds enable row level security;

revoke all on table public.game_rounds from anon, authenticated;

grant select, insert on table public.game_rounds to authenticated;

-- Ownership is inherited from the parent session; no user_id is stored here,
-- so a round row can never disagree with its session about who owns it.
create policy "Users read rounds of their own sessions."
  on public.game_rounds for select
  to authenticated
  using (
    exists (
      select 1 from public.game_sessions s
      where s.id = game_rounds.session_id
        and s.user_id = (select auth.uid())
    )
  );

create policy "Users save rounds into their own sessions."
  on public.game_rounds for insert
  to authenticated
  with check (
    exists (
      select 1 from public.game_sessions s
      where s.id = game_rounds.session_id
        and s.user_id = (select auth.uid())
    )
  );
