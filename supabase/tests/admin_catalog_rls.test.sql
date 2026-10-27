-- Phase 10: Admin RLS and storage policy tests
-- Run: supabase test db

begin;
select plan(28);

-- Test identities
insert into auth.users (id, email)
values
  ('aaaaaaaa-1111-1111-1111-111111111111', 'admin@example.com'),
  ('bbbbbbbb-2222-2222-2222-222222222222', 'player@example.com'),
  ('cccccccc-3333-3333-3333-333333333333', 'other-admin@example.com');

-- Seed test data
insert into public.books (id, slug, title, author, description, status)
values
  ('dddddddd-1111-1111-1111-111111111111', 'published-book', 'Published Book', 'Author', 'Desc', 'published'),
  ('eeeeeeee-2222-2222-2222-222222222222', 'draft-book', 'Draft Book', 'Author', 'Desc', 'draft'),
  ('ffffffff-3333-3333-3333-333333333333', 'ready-book', 'Ready Book', 'Author', 'Desc', 'ready');

insert into public.book_versions (id, book_id, version_label, manifest_sha256, content_json, validation_status, publication_status, published_at)
values
  ('11111111-1111-1111-1111-111111111111', 'dddddddd-1111-1111-1111-111111111111', '1', 'abc123', '{"spreads":[]}', 'validated', 'published', now()),
  ('22222222-2222-2222-2222-222222222222', 'eeeeeeee-2222-2222-2222-222222222222', '1', 'def456', '{"spreads":[]}', 'unvalidated', 'unpublished', NULL),
  ('33333333-3333-3333-3333-333333333333', 'ffffffff-3333-3333-3333-333333333333', '1', 'ghi789', '{"spreads":[]}', 'validated', 'unpublished', NULL);

-- Anonymous: no access to catalog mutations
set local role anon;
select throws_ok(
  $$select * from public.books$$,
  '42501',
  null,
  'anon cannot read books'
);
select throws_ok(
  $$insert into public.books (slug, title, status) values ('x', 'X', 'draft')$$,
  '42501',
  null,
  'anon cannot insert books'
);

-- Authenticated non-admin player: read-only published
set local role authenticated;
set local request.jwt.claim.sub = 'bbbbbbbb-2222-2222-2222-222222222222';
set local request.jwt.claim.admin = 'false';

select results_eq(
  $$select slug from public.books where id = 'dddddddd-1111-1111-1111-111111111111'$$,
  array['published-book'],
  'player sees published book'
);
select results_eq(
  $$select slug from public.books where id = 'eeeeeeee-2222-2222-2222-222222222222'$$,
  array[]::text[],
  'player cannot see draft book'
);
select results_eq(
  $$select version_label from public.book_versions where book_id = 'dddddddd-1111-1111-1111-111111111111'$$,
  array['1'],
  'player sees published version'
);
select results_eq(
  $$select version_label from public.book_versions where book_id = 'eeeeeeee-2222-2222-2222-222222222222'$$,
  array[]::text[],
  'player cannot see draft book versions'
);
select results_eq(
  $$select version_label from public.book_versions where book_id = 'ffffffff-3333-3333-3333-333333333333'$$,
  array[]::text[],
  'player cannot see ready but unpublished version'
);

select throws_ok(
  $$insert into public.books (slug, title, status) values ('new', 'New', 'draft')$$,
  '42501',
  null,
  'player cannot insert books'
);
select results_eq(
  $$select public.test_update_books_non_admin()$$,
  array[0],
  'player cannot update books (0 rows affected)'
);
select results_eq(
  $$select public.test_delete_books_non_admin()$$,
  array[0],
  'player cannot delete books (0 rows affected)'
);
select throws_ok(
  $$insert into public.book_versions (book_id, version_label, manifest_sha256, content_json, validation_status, publication_status)
   values ('dddddddd-1111-1111-1111-111111111111', '2', 'xxx', '{}', 'unvalidated', 'unpublished')$$,
  '42501',
  null,
  'player cannot insert book versions'
);
select results_eq(
  $$select public.test_update_book_versions_non_admin()$$,
  array[0],
  'player cannot update book versions (0 rows affected)'
);
select results_eq(
  $$select public.test_delete_book_versions_non_admin()$$,
  array[0],
  'player cannot delete book versions (0 rows affected)'
);

-- Authenticated admin: full catalog access
set local role authenticated;
set local request.jwt.claim = '{"sub": "aaaaaaaa-1111-1111-1111-111111111111", "admin": "true"}';

select results_eq(
  $$select slug from public.books where id = 'dddddddd-1111-1111-1111-111111111111'$$,
  array['published-book'],
  'admin sees published book'
);
select results_eq(
  $$select slug from public.books where id = 'eeeeeeee-2222-2222-2222-222222222222'$$,
  array['draft-book'],
  'admin sees draft book'
);
select results_eq(
  $$select slug from public.books where id = 'ffffffff-3333-3333-3333-333333333333'$$,
  array['ready-book'],
  'admin sees ready book'
);
select results_eq(
  $$select version_label from public.book_versions where book_id = 'dddddddd-1111-1111-1111-111111111111'$$,
  array['1'],
  'admin sees published version'
);
select results_eq(
  $$select version_label from public.book_versions where book_id = 'eeeeeeee-2222-2222-2222-222222222222'$$,
  array['1'],
  'admin sees draft book version'
);
select results_eq(
  $$select version_label from public.book_versions where book_id = 'ffffffff-3333-3333-3333-333333333333'$$,
  array['1'],
  'admin sees ready but unpublished version'
);

-- Admin mutations succeed
select results_eq(
  $$select public.test_insert_book_admin()$$,
  array[1],
  'admin can insert books (1 row affected)'
);
select results_eq(
  $$select public.test_insert_book_version_admin()$$,
  array[1],
  'admin can insert book versions (1 row affected)'
);
select results_eq(
  $$select public.test_update_book_admin()$$,
  array[1],
  'admin can update books (1 row affected)'
);
select results_eq(
  $$select public.test_delete_book_admin()$$,
  array[1],
  'admin can delete books (1 row affected)'
);

-- Admin metadata is editable, but lifecycle and manifest state are owned by
-- secure publishing, even if an admin tries to call PostgREST directly.
select throws_ok(
  $$update public.books set status = 'published' where id = 'eeeeeeee-2222-2222-2222-222222222222'$$,
  'P0001',
  'book publication status requires secure publishing',
  'admin cannot directly publish a book'
);
select throws_ok(
  $$update public.book_versions set validation_status = 'validated' where id = '22222222-2222-2222-2222-222222222222'$$,
  'P0001',
  'book version lifecycle and manifest changes require secure publishing',
  'admin cannot directly mark a version validated'
);
select throws_ok(
  $$update public.book_versions set content_json = '{"forged":true}' where id = '22222222-2222-2222-2222-222222222222'$$,
  'P0001',
  'book version lifecycle and manifest changes require secure publishing',
  'admin cannot directly replace a version manifest'
);
select throws_ok(
  $$insert into public.book_versions (book_id, version_label, manifest_sha256, content_json, validation_status, publication_status)
    values ('eeeeeeee-2222-2222-2222-222222222222', 'forged', 'bad', '{}', 'validated', 'unpublished')$$,
  'P0001',
  'book version lifecycle transitions require secure publishing',
  'admin cannot create a pre-validated version'
);

-- Another admin sees same data
set local request.jwt.claim = '{"sub": "cccccccc-3333-3333-3333-333333333333", "admin": "true"}';
select results_eq(
  $$select count(*)::int from public.books where id = 'dddddddd-1111-1111-1111-111111111111'$$,
  array[1],
  'another admin sees the same published book'
);

select * from finish();
rollback;
