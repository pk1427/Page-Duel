-- Phase 10b: Test for single published version constraint
-- Run: supabase test db

begin;
select plan(3);

-- Test identities
insert into auth.users (id, email)
values
  ('aaaaaaaa-1111-1111-1111-111111111111', 'admin@example.com');

-- Grant necessary permissions for test
grant insert, update, delete on table public.books to authenticated;
grant insert, update, delete on table public.book_versions to authenticated;

set local role authenticated;
set local request.jwt.claim = '{"sub": "aaaaaaaa-1111-1111-1111-111111111111", "admin": "true"}';

-- Insert a book
insert into public.books (id, slug, title, status)
values ('bbbbbbbb-1111-1111-1111-111111111111', 'test-book', 'Test Book', 'draft');

-- Insert first published version
insert into public.book_versions (id, book_id, version_label, manifest_sha256, content_json, validation_status, publication_status, published_at)
values ('cccccccc-1111-1111-1111-111111111111', 'bbbbbbbb-1111-1111-1111-111111111111', '1', 'abc123', '{"spreads":[]}', 'validated', 'published', now());

-- Attempt to insert second published version for same book - should fail due to unique constraint
select throws_ok(
  $$insert into public.book_versions (id, book_id, version_label, manifest_sha256, content_json, validation_status, publication_status, published_at)
   values ('dddddddd-2222-2222-2222-222222222222', 'bbbbbbbb-1111-1111-1111-111111111111', '2', 'def456', '{"spreads":[]}', 'validated', 'published', now())$$,
  '23505',
  null,
  'cannot insert second published version for same book'
);

-- Unpublished versions should still be allowed
select lives_ok(
  $$insert into public.book_versions (id, book_id, version_label, manifest_sha256, content_json, validation_status, publication_status)
   values ('eeeeeeee-3333-3333-3333-333333333333', 'bbbbbbbb-1111-1111-1111-111111111111', '3', 'ghi789', '{"spreads":[]}', 'unvalidated', 'unpublished')$$,
  'can insert unpublished version for same book'
);

-- Updating an unpublished version to published should fail when another is already published
select throws_ok(
  $$update public.book_versions set publication_status = 'published', published_at = now() where id = 'eeeeeeee-3333-3333-3333-333333333333'$$,
  '23505',
  null,
  'cannot update unpublished version to published when another is published'
);

select * from finish();
rollback;