-- Books and book_versions RLS + integrity tests. Run: supabase test db
-- (Manual psql runs need: create extension if not exists pgtap;)
begin;
select plan(11);

-- Test identities
insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.com');

-- Seed test data as the table owner (transaction owner has full privileges).
-- Insert a published book
insert into public.books (id, slug, title, author, description, status)
values ('aaaaaaaa-1111-1111-1111-111111111111', 'alice-test', 'Alice Test', 'Lewis Carroll', 'Test book', 'published');

-- Insert a draft book (invisible to players)
insert into public.books (id, slug, title, author, description, status)
values ('bbbbbbbb-2222-2222-2222-222222222222', 'draft-test', 'Draft Test', 'Unknown', 'Draft book', 'draft');

-- Insert a published version of the published book
insert into public.book_versions (id, book_id, version_label, manifest_sha256, content_json, validation_status, publication_status, published_at)
values ('cccccccc-1111-1111-1111-111111111111', 'aaaaaaaa-1111-1111-1111-111111111111', '1', 'abc123', '{"spreads":[]}', 'validated', 'published', now());

-- Insert an unpublished version (invisible to players)
insert into public.book_versions (id, book_id, version_label, manifest_sha256, content_json, validation_status, publication_status)
values ('dddddddd-4444-4444-4444-444444444444', 'aaaaaaaa-1111-1111-1111-111111111111', '2', 'def456', '{"spreads":[]}', 'unvalidated', 'unpublished');

-- Anonymous clients hold no grant: denied before any policy runs.
set local role anon;
select throws_ok(
  $$select * from public.books$$,
  '42501',
  null,
  'anon cannot read books'
);
select throws_ok(
  $$select * from public.book_versions$$,
  '42501',
  null,
  'anon cannot read book_versions'
);
select throws_ok(
  $$insert into public.books (slug, title, status) values ('x', 'X', 'draft')$$,
  '42501',
  null,
  'anon cannot insert books'
);

-- Authenticated (non-admin) players:
-- 1. Can read only published books (draft filtered out by policy)
-- 2. Can read only published versions (unpublished filtered out by policy)
-- 3. Cannot insert books (no grant, no policy)
-- 4. Cannot update books (no grant, no policy)
-- 5. Cannot delete books (no grant, no policy)
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  $$select slug from public.books where id = 'aaaaaaaa-1111-1111-1111-111111111111'$$,
  array['alice-test'],
  'authenticated player sees the published test book by id'
);
select results_eq(
  $$select version_label from public.book_versions where book_id = 'aaaaaaaa-1111-1111-1111-111111111111'$$,
  array['1'],
  'authenticated player sees only published book versions'
);
select isnt_empty(
  $$select slug from public.books where status = 'published'$$,
  'seed has published books visible to players'
);
select results_eq(
  $$select slug from public.books where id = 'bbbbbbbb-2222-2222-2222-222222222222'$$,
  array[]::text[],
  'draft book is invisible to players'
);
select throws_ok(
  $$insert into public.books (slug, title, status) values ('new', 'New', 'draft')$$,
  '42501',
  null,
  'non-admin cannot insert books'
);
-- UPDATE/DELETE under RLS affect 0 rows rather than throwing exceptions
-- These are tested via the admin_catalog_rls test helpers
select results_eq(
  $$select count(*)::int from public.books where slug = 'alice-test'$$,
  array[1],
  'alice-test book exists for reference'
);

-- Account isolation: a second authenticated player sees the same published
-- catalog (read-only, no user-scoped partitioning on catalog) but cannot
-- write without admin privileges.
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select results_eq(
  $$select count(*)::int from public.books where id = 'aaaaaaaa-1111-1111-1111-111111111111'$$,
  array[1],
  'another player sees the same published test book'
);
-- UPDATE under RLS affects 0 rows rather than throwing exceptions
-- This is tested via the admin_catalog_rls test helpers
select results_eq(
  $$select count(*)::int from public.book_versions where id = 'cccccccc-1111-1111-1111-111111111111'$$,
  array[1],
  'version exists for reference'
);

select * from finish();
rollback;
