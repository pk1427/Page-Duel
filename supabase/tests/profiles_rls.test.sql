-- Profiles RLS tests. Run: supabase test db
-- (Manual psql runs need: create extension if not exists pgtap;)
--
-- Identity mechanics: each simulated user is `set local role authenticated`
-- plus `set local request.jwt.claim.sub`, and tests 5/9 assert auth.uid()
-- returns exactly that subject, so allow/deny results below are proven to run
-- as the claimed identity rather than a privileged role.
begin;
select plan(17);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.com');

-- Anonymous clients hold no grant: denied before any policy runs.
set local role anon;
select throws_ok(
  $$select * from public.profiles$$,
  '42501',
  null,
  'anon cannot read profiles'
);
select throws_ok(
  $$insert into public.profiles (user_id) values ('11111111-1111-1111-1111-111111111111')$$,
  '42501',
  null,
  'anon cannot create a profile'
);
select throws_ok(
  $$update public.profiles set display_name = 'anon'$$,
  '42501',
  null,
  'anon cannot update profiles'
);
select throws_ok(
  $$delete from public.profiles$$,
  '42501',
  null,
  'anon cannot delete profiles'
);

-- Identity A: prove who auth.uid() reports, then what that identity can do.
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select results_eq(
  $$select (select auth.uid())::text$$,
  array['11111111-1111-1111-1111-111111111111'],
  'harness reports identity A via auth.uid()'
);
select results_eq(
  $$select user_id::text from public.profiles where user_id = '11111111-1111-1111-1111-111111111111'$$,
  array['11111111-1111-1111-1111-111111111111'],
  'trigger creates a profile for a new auth user'
);
select results_eq(
  $$select user_id::text from public.profiles order by user_id$$,
  array['11111111-1111-1111-1111-111111111111'],
  'identity A reads exactly their own profile'
);
select results_eq(
  $$update public.profiles set display_name = 'Owner'
    where user_id = '11111111-1111-1111-1111-111111111111'
    returning display_name$$,
  array['Owner'],
  'owner updates their own display name'
);

-- Identity B: prove the switch, then prove isolation in both directions.
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select results_eq(
  $$select (select auth.uid())::text$$,
  array['22222222-2222-2222-2222-222222222222'],
  'harness reports identity B via auth.uid()'
);
select results_eq(
  $$select user_id::text from public.profiles order by user_id$$,
  array['22222222-2222-2222-2222-222222222222'],
  'identity B reads exactly their own profile'
);
select throws_ok(
  $$insert into public.profiles (user_id, display_name) values ('11111111-1111-1111-1111-111111111111', 'forged')$$,
  '42501',
  null,
  'a user cannot insert a profile for someone else'
);
select is_empty(
  $$update public.profiles set display_name = 'stolen'
    where user_id = '11111111-1111-1111-1111-111111111111'
    returning display_name$$,
  'another user updates no rows of a foreign profile'
);
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select results_eq(
  $$select display_name from public.profiles where user_id = '11111111-1111-1111-1111-111111111111'$$,
  array['Owner'],
  'the denied update left the owner row intact'
);

-- Owner IDs and timestamps are outside the client column grant.
select throws_ok(
  $$update public.profiles set user_id = '22222222-2222-2222-2222-222222222222'$$,
  '42501',
  null,
  'profile updates cannot change the owner id'
);
select throws_ok(
  $$update public.profiles set created_at = now()$$,
  '42501',
  null,
  'profile updates cannot touch timestamps'
);
select throws_ok(
  $$delete from public.profiles$$,
  '42501',
  null,
  'users cannot delete profiles through client permissions'
);

-- The trigger fired for the second user as well (scoped: RLS filters counts).
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select results_eq(
  $$select user_id::text from public.profiles where user_id = '22222222-2222-2222-2222-222222222222'$$,
  array['22222222-2222-2222-2222-222222222222'],
  'trigger creates exactly one profile per new auth user'
);

select * from finish();
rollback;
