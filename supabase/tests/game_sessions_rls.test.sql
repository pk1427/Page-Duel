-- Game sessions RLS + integrity tests. Run: supabase test db
-- (Manual psql runs need: create extension if not exists pgtap;)
begin;
select plan(16);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.com');

-- Anonymous clients hold no grant: denied before any policy runs.
set local role anon;
select throws_ok(
  $$select * from public.game_sessions$$,
  '42501',
  null,
  'anon cannot read game sessions'
);
select throws_ok(
  $$insert into public.game_sessions (user_id, book_id, book_title, player1_name, player2_name, rounds_config, player1_people_total, player2_people_total, player1_round_wins, player2_round_wins, deciding_method)
    values ('11111111-1111-1111-1111-111111111111', 'alice-loc-1885', 'Alice', 'A', 'B', 5, 10, 8, 3, 2, 'people_total')$$,
  '42501',
  null,
  'anon cannot insert game sessions'
);
select throws_ok(
  $$update public.game_sessions set book_title = 'anon'$$,
  '42501',
  null,
  'anon cannot update game sessions'
);
select throws_ok(
  $$delete from public.game_sessions$$,
  '42501',
  null,
  'anon cannot delete game sessions'
);

-- The owner saves and reads their own completed game.
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select results_eq(
  $$insert into public.game_sessions (user_id, book_id, book_title, player1_name, player2_name, rounds_config, player1_people_total, player2_people_total, player1_round_wins, player2_round_wins, winner_player, deciding_method)
    values ('11111111-1111-1111-1111-111111111111', 'alice-loc-1885', 'Alice', 'Ava', 'Ben', 5, 21, 17, 3, 2, 0, 'people_total')
    returning book_title$$,
  array['Alice'],
  'owner saves their own completed game'
);
select results_eq(
  $$select player1_name from public.game_sessions where user_id = '11111111-1111-1111-1111-111111111111'$$,
  array['Ava'],
  'owner reads their own session'
);

-- A signed-in stranger reads nothing and cannot plant rows as the owner.
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select is_empty(
  $$select * from public.game_sessions$$,
  'another user reads no sessions'
);
select throws_ok(
  $$insert into public.game_sessions (user_id, book_id, book_title, player1_name, player2_name, rounds_config, player1_people_total, player2_people_total, player1_round_wins, player2_round_wins, deciding_method)
    values ('11111111-1111-1111-1111-111111111111', 'alice-loc-1885', 'Alice', 'A', 'B', 5, 10, 8, 3, 2, 'people_total')$$,
  '42501',
  null,
  'a user cannot create a session owned by someone else'
);

-- Completed history is append-only through client permissions.
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select throws_ok(
  $$update public.game_sessions set player1_people_total = 999$$,
  '42501',
  null,
  'users cannot rewrite completed sessions'
);
select throws_ok(
  $$delete from public.game_sessions$$,
  '42501',
  null,
  'users cannot delete completed sessions'
);

-- Integrity constraints reject bad game data.
select throws_ok(
  $$insert into public.game_sessions (id, user_id, book_id, book_title, player1_name, player2_name, rounds_config, player1_people_total, player2_people_total, player1_round_wins, player2_round_wins, deciding_method)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'alice-loc-1885', 'Alice', 'A', 'B', 7, 10, 8, 3, 2, 'people_total')$$,
  '23514',
  null,
  'round counts outside 5/10/15 are rejected'
);
select throws_ok(
  $$insert into public.game_sessions (id, user_id, book_id, book_title, player1_name, player2_name, rounds_config, player1_people_total, player2_people_total, player1_round_wins, player2_round_wins, deciding_method)
    values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'alice-loc-1885', 'Alice', 'A', 'B', 5, -1, 8, 3, 2, 'people_total')$$,
  '23514',
  null,
  'negative totals are rejected'
);
select throws_ok(
  $$insert into public.game_sessions (id, user_id, book_id, book_title, player1_name, player2_name, rounds_config, player1_people_total, player2_people_total, player1_round_wins, player2_round_wins, winner_player, deciding_method)
    values ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'alice-loc-1885', 'Alice', 'A', 'B', 5, 10, 8, 3, 2, 2, 'people_total')$$,
  '23514',
  null,
  'winner values outside player 1/2 are rejected'
);
select throws_ok(
  $$insert into public.game_sessions (id, user_id, book_id, book_title, player1_name, player2_name, rounds_config, player1_people_total, player2_people_total, player1_round_wins, player2_round_wins, deciding_method)
    values ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'alice-loc-1885', 'Alice', 'A', 'B', 5, 10, 8, 3, 2, 'people_total')$$,
  '23514',
  null,
  'a null winner must pair with the draw deciding method'
);
select throws_ok(
  $$insert into public.game_sessions (id, user_id, book_id, book_title, player1_name, player2_name, rounds_config, player1_people_total, player2_people_total, player1_round_wins, player2_round_wins, deciding_method)
    values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'alice-loc-1885', 'Alice', 'A', 'B', 5, 10, 8, 3, 2, 'coin_flip')$$,
  '23514',
  null,
  'unknown deciding methods are rejected'
);
-- Idempotency contract: retrying a save with the same session UUID must be
-- rejected by the primary key (23505), never stored twice. The id column is
-- listed explicitly so the retry really reuses the UUID; omitting it would
-- generate a fresh UUID and test nothing.
select throws_ok(
  $$insert into public.game_sessions (id, user_id, book_id, book_title, player1_name, player2_name, rounds_config, player1_people_total, player2_people_total, player1_round_wins, player2_round_wins, winner_player, deciding_method)
    select id, user_id, book_id, book_title, player1_name, player2_name, rounds_config, player1_people_total, player2_people_total, player1_round_wins, player2_round_wins, winner_player, deciding_method
    from public.game_sessions
    where user_id = '11111111-1111-1111-1111-111111111111'$$,
  '23505',
  null,
  'reusing a session UUID does not create a duplicate session'
);

select * from finish();
rollback;
