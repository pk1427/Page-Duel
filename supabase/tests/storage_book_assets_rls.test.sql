-- Storage bucket and RLS policy tests for book-assets.
-- Run: supabase test db
--
-- NOTE: These tests run in the same transaction as the migration owner
-- (postgres), so they bypass RLS for the owner. The actual RLS enforcement
-- is verified by the Supabase CLI's `supabase test db` framework, which
-- runs tests in a separate connection with proper role isolation.
-- The policy definitions themselves are verified by the migration applying
-- without errors, and the bucket/policy structure is verified here.

begin;
select plan(4);

-- Test identities
insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'player@example.com');

-- Insert test objects into the book-assets bucket
insert into storage.objects (id, bucket_id, name, version, created_at)
values
  (gen_random_uuid(), 'book-assets', 'books/test-book/versions/1/cover.webp', 1, now()),
  (gen_random_uuid(), 'book-assets', 'books/test-book/versions/1/pages/p002.webp', 1, now()),
  (gen_random_uuid(), 'book-assets', 'private-area/secret.txt', 1, now());

-- Authenticated: can read book-assets under books/ prefix
set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select results_eq(
  $$select name from storage.objects where bucket_id = 'book-assets' and (storage.foldername(name))[1] = 'books' order by name$$,
  array[
    'books/test-book/versions/1/cover.webp',
    'books/test-book/versions/1/pages/p002.webp'
  ],
  'authenticated can read book-assets books/ objects'
);

-- Authenticated: cannot see non-books objects in the bucket
select results_eq(
  $$select count(*)::int from storage.objects where bucket_id = 'book-assets' and (storage.foldername(name))[1] != 'books'$$,
  array[0],
  'authenticated cannot read non-books objects in book-assets bucket'
);

-- Authenticated: cannot insert to storage.objects
select throws_ok(
  $$insert into storage.objects (bucket_id, name, version, created_at) values ('book-assets', 'books/hack/versions/1/hack.webp', 1, now())$$,
  '42501',
  null,
  'authenticated cannot insert storage objects'
);

-- Authenticated: cannot delete storage.objects
select throws_ok(
  $$delete from storage.objects where name = 'books/test-book/versions/1/cover.webp'$$,
  '42501',
  null,
  'authenticated cannot delete storage objects'
);

select * from finish();
rollback;