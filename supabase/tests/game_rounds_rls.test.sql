-- Game rounds RLS + integrity tests. Run: supabase test db
-- (Manual psql runs need: create extension if not exists pgtap;)
begin;
select plan(16);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.com');

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into public.game_sessions (id, user_id, book_id, book_title, player1_name, player2_name, rounds_config, player1_people_total, player2_people_total, player1_round_wins, player2_round_wins, winner_player, deciding_method)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'alice-loc-1885', 'Alice', 'Ava', 'Ben', 5, 21, 17, 3, 2, 0, 'people_total');

-- Anonymous clients hold no grant: denied before any policy runs.
set local role anon;
select throws_ok(
  $$select * from public.game_rounds$$,
  '42501',
  null,
  'anon cannot read game rounds'
);
select throws_ok(
  $$insert into public.game_rounds (session_id, round_number, round_type, spread_id, player1_count, player2_count)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'normal', 's001', 4, 2)$$,
  '42501',
  null,
  'anon cannot insert game rounds'
);
select throws_ok(
  $$update public.game_rounds set player1_count = 99$$,
  '42501',
  null,
  'anon cannot update game rounds'
);
select throws_ok(
  $$delete from public.game_rounds$$,
  '42501',
  null,
  'anon cannot delete game rounds'
);

-- The owner saves rounds into their own session and reads them back in order.
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select results_eq(
  $$insert into public.game_rounds (session_id, round_number, round_type, spread_id, player1_count, player2_count, winner_player)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'normal', 's001', 4, 2, 0)
    returning spread_id$$,
  array['s001'],
  'owner saves a round into their own session'
);
insert into public.game_rounds (session_id, round_number, round_type, spread_id, player1_count, player2_count, winner_player)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'normal', 's002', 1, 1, null);
select results_eq(
  $$select round_number::int from public.game_rounds where session_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' order by round_number$$,
  array[1, 2],
  'owner reads their session rounds in order'
);

-- A signed-in stranger sees nothing and writes nothing into another user's session.
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select is_empty(
  $$select * from public.game_rounds$$,
  'another user reads no round records'
);
select throws_ok(
  $$insert into public.game_rounds (session_id, round_number, round_type, spread_id, player1_count, player2_count)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 'normal', 's003', 5, 0)$$,
  '42501',
  null,
  'a user cannot add rounds to someone else''s session'
);
select throws_ok(
  $$update public.game_rounds set player1_count = 99$$,
  '42501',
  null,
  'another user cannot update round records'
);
select throws_ok(
  $$delete from public.game_rounds$$,
  '42501',
  null,
  'another user cannot delete round records'
);

-- Saved rounds are append-only for the owner too.
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select throws_ok(
  $$update public.game_rounds set player1_count = 99$$,
  '42501',
  null,
  'users cannot rewrite saved rounds'
);
select throws_ok(
  $$delete from public.game_rounds$$,
  '42501',
  null,
  'users cannot delete saved rounds'
);

-- Integrity constraints reject bad round data.
select throws_ok(
  $$insert into public.game_rounds (session_id, round_number, round_type, spread_id, player1_count, player2_count)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'normal', 's009', 3, 3)$$,
  '23505',
  null,
  'duplicate round numbers in one session are rejected'
);
select throws_ok(
  $$insert into public.game_rounds (session_id, round_number, round_type, spread_id, player1_count, player2_count)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 'normal', 's003', -1, 3)$$,
  '23514',
  null,
  'negative round counts are rejected'
);
select throws_ok(
  $$insert into public.game_rounds (session_id, round_number, round_type, spread_id, player1_count, player2_count)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 'bonus', 's003', 2, 3)$$,
  '23514',
  null,
  'round types outside normal/sudden_death are rejected'
);
select throws_ok(
  $$insert into public.game_rounds (session_id, round_number, round_type, spread_id, player1_count, player2_count, winner_player)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 'normal', 's003', 2, 3, 2)$$,
  '23514',
  null,
  'round winners outside player 1/2 are rejected'
);

select * from finish();
rollback;
