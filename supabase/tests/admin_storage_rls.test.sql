-- Phase 10: Admin storage policy tests for book-assets bucket
-- Run: supabase test db

begin;
select plan(8);

-- Test identities
insert into auth.users (id, email)
values
  ('aaaaaaaa-1111-1111-1111-111111111111', 'admin@example.com'),
  ('bbbbbbbb-2222-2222-2222-222222222222', 'player@example.com');

-- Insert test objects into the book-assets bucket
insert into storage.objects (id, bucket_id, name, version, created_at)
values
  (gen_random_uuid(), 'book-assets', 'books/test-book/versions/1/cover.webp', 1, now()),
  (gen_random_uuid(), 'book-assets', 'books/test-book/versions/1/pages/p002.webp', 1, now()),
  (gen_random_uuid(), 'book-assets', 'private-area/secret.txt', 1, now());

-- Authenticated non-admin player: read-only books/ prefix, no write
set local role authenticated;
set local request.jwt.claim.sub = 'bbbbbbbb-2222-2222-2222-222222222222';
set local request.jwt.claim.admin = 'false';

select results_eq(
  $$select name from storage.objects where bucket_id = 'book-assets' and (storage.foldername(name))[1] = 'books' order by name$$,
  array[
    'books/test-book/versions/1/cover.webp',
    'books/test-book/versions/1/pages/p002.webp'
  ],
  'player can read book-assets books/ objects'
);

select results_eq(
  $$select count(*)::int from storage.objects where bucket_id = 'book-assets' and (storage.foldername(name))[1] != 'books'$$,
  array[0],
  'player cannot read non-books objects in book-assets bucket'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name, version, created_at) values ('book-assets', 'books/hack/versions/1/hack.webp', 1, now())$$,
  '42501',
  null,
  'player cannot insert storage objects'
);

select results_eq(
  $$select public.test_update_storage_objects_non_admin()$$,
  array[0],
  'player cannot update storage objects (0 rows affected)'
);

select results_eq(
  $$select public.test_delete_storage_objects_non_admin()$$,
  array[-1],
  'player cannot delete storage objects directly (exception expected)'
);

-- Authenticated admin: full write access to book-assets
select set_config('request.jwt.claim', '{"sub": "aaaaaaaa-1111-1111-1111-111111111111", "admin": "true"}', true);

select results_eq(
  $$select public.test_insert_storage_admin()$$,
  array[1],
  'admin can insert storage objects (1 row affected)'
);

select results_eq(
  $$select public.test_update_storage_admin()$$,
  array[1],
  'admin can update storage objects (1 row affected)'
);

select results_eq(
  $$select public.test_delete_storage_admin()$$,
  array[-1],
  'admin cannot delete storage objects directly (exception expected)'
);

select * from finish();
rollback;