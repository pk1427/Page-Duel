-- Helper function to test UPDATE/DELETE row counts under RLS
-- Using SECURITY INVOKER so RLS policies are enforced
create or replace function public.test_update_books_non_admin() returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  row_count integer;
begin
  update public.books set title = 'hacked' where slug = 'published-book';
  get diagnostics row_count = row_count;
  return row_count;
end;
$$;

create or replace function public.test_delete_books_non_admin() returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  row_count integer;
begin
  delete from public.books;
  get diagnostics row_count = row_count;
  return row_count;
end;
$$;

create or replace function public.test_update_book_versions_non_admin() returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  row_count integer;
begin
  update public.book_versions set content_json = '{}' where id = '11111111-1111-1111-1111-111111111111';
  get diagnostics row_count = row_count;
  return row_count;
end;
$$;

create or replace function public.test_delete_book_versions_non_admin() returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  row_count integer;
begin
  delete from public.book_versions;
  get diagnostics row_count = row_count;
  return row_count;
end;
$$;

create or replace function public.test_update_storage_objects_non_admin() returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  row_count integer;
begin
  update storage.objects set name = 'books/hack/versions/1/hack.webp' where name = 'books/test-book/versions/1/cover.webp';
  get diagnostics row_count = row_count;
  return row_count;
end;
$$;

create or replace function public.test_delete_storage_objects_non_admin() returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  row_count integer;
begin
  -- Storage DELETE is not allowed directly, use Storage API instead
  -- This will raise an exception
  delete from storage.objects where name = 'books/test-book/versions/1/cover.webp';
  get diagnostics row_count = row_count;
  return row_count;
exception when others then
  return -1; -- Indicate error
end;
$$;

-- Admin test functions (SECURITY INVOKER so RLS applies)
create or replace function public.test_insert_book_admin() returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  row_count integer;
  book_id uuid;
begin
  insert into public.books (slug, title, status) values ('admin-new', 'Admin New', 'draft') returning id into book_id;
  get diagnostics row_count = row_count;
  return row_count;
end;
$$;

create or replace function public.test_update_book_admin() returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  row_count integer;
begin
  update public.books set title = 'Updated' where slug = 'admin-new';
  get diagnostics row_count = row_count;
  return row_count;
end;
$$;

create or replace function public.test_delete_book_admin() returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  row_count integer;
begin
  delete from public.books where slug = 'admin-new';
  get diagnostics row_count = row_count;
  return row_count;
end;
$$;

create or replace function public.test_insert_book_version_admin() returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  row_count integer;
  book_id uuid;
begin
  -- First ensure the book exists
  select id into book_id from public.books where slug = 'admin-new';
  if book_id is not null then
    insert into public.book_versions (book_id, version_label, manifest_sha256, content_json, validation_status, publication_status)
     values (book_id, '2', 'newsha', '{}', 'unvalidated', 'unpublished');
    get diagnostics row_count = row_count;
  else
    row_count := 0;
  end if;
  return row_count;
end;
$$;

create or replace function public.test_insert_storage_admin() returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  row_count integer;
begin
  insert into storage.objects (bucket_id, name, version, created_at) values ('book-assets', 'books/admin-test/versions/1/cover.webp', 1, now());
  get diagnostics row_count = row_count;
  return row_count;
end;
$$;

create or replace function public.test_update_storage_admin() returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  row_count integer;
begin
  update storage.objects set name = 'books/admin-test/versions/1/cover-updated.webp' where name = 'books/admin-test/versions/1/cover.webp';
  get diagnostics row_count = row_count;
  return row_count;
end;
$$;

create or replace function public.test_delete_storage_admin() returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  row_count integer;
begin
  -- Storage DELETE is not allowed directly
  delete from storage.objects where name = 'books/admin-test/versions/1/cover-updated.webp';
  get diagnostics row_count = row_count;
  return row_count;
exception when others then
  return -1;
end;
$$;

grant execute on function public.test_update_books_non_admin() to authenticated;
grant execute on function public.test_delete_books_non_admin() to authenticated;
grant execute on function public.test_update_book_versions_non_admin() to authenticated;
grant execute on function public.test_delete_book_versions_non_admin() to authenticated;
grant execute on function public.test_update_storage_objects_non_admin() to authenticated;
grant execute on function public.test_delete_storage_objects_non_admin() to authenticated;

grant execute on function public.test_insert_book_admin() to authenticated;
grant execute on function public.test_update_book_admin() to authenticated;
grant execute on function public.test_delete_book_admin() to authenticated;
grant execute on function public.test_insert_book_version_admin() to authenticated;
grant execute on function public.test_insert_storage_admin() to authenticated;
grant execute on function public.test_update_storage_admin() to authenticated;
grant execute on function public.test_delete_storage_admin() to authenticated;