-- Phase 10: Admin authorization, RLS, and storage policies
--
-- This migration adds:
-- 1. Admin JWT claim-based authorization for catalog mutations
-- 2. Admin audit log table
-- 3. Storage policies for admin upload to book-assets bucket
-- 4. RLS policies for admin access to books and book_versions

-- Admin audit log table
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  resource_type text not null,
  resource_id uuid not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_log_admin_user_id_idx on public.admin_audit_log (admin_user_id);
create index admin_audit_log_resource_idx on public.admin_audit_log (resource_type, resource_id);
create index admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;
revoke all on table public.admin_audit_log from anon, authenticated;

-- Only admins can read audit log
create policy "Admins read audit log"
  on public.admin_audit_log for select
  to authenticated
  using (
    (select auth.jwt() ->> 'admin') = 'true'
    OR (select auth.jwt() ->> 'https://book-people/admin') = 'true'
  );

-- Admins can insert audit log entries (via RPC or direct with service role)
grant insert on table public.admin_audit_log to authenticated;

create policy "Admins insert audit log"
  on public.admin_audit_log for insert
  to authenticated
  with check (
    (select auth.jwt() ->> 'admin') = 'true'
    OR (select auth.jwt() ->> 'https://book-people/admin') = 'true'
  );

-- Helper function to check admin claim
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select
    (select auth.jwt() ->> 'admin') = 'true'
    OR (select auth.jwt() ->> 'https://book-people/admin') = 'true'
$$;

revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- Extend books RLS for admin write access
-- Admins can SELECT all books (including draft/ready)
create policy "Admins read all books"
  on public.books for select
  to authenticated
  using (public.is_admin());

-- Admins can INSERT books
grant insert on table public.books to authenticated;

create policy "Admins insert books"
  on public.books for insert
  to authenticated
  with check (public.is_admin());

-- Admins can UPDATE books
grant update on table public.books to authenticated;

create policy "Admins update books"
  on public.books for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Admins can DELETE books (archive semantics preferred, but allow for completeness)
grant delete on table public.books to authenticated;

create policy "Admins delete books"
  on public.books for delete
  to authenticated
  using (public.is_admin());

-- Extend book_versions RLS for admin write access
-- Admins can SELECT all versions (including unpublished)
create policy "Admins read all book versions"
  on public.book_versions for select
  to authenticated
  using (public.is_admin());

-- Admins can INSERT book versions
grant insert on table public.book_versions to authenticated;

create policy "Admins insert book versions"
  on public.book_versions for insert
  to authenticated
  with check (public.is_admin());

-- Admins can UPDATE book versions
grant update on table public.book_versions to authenticated;

create policy "Admins update book versions"
  on public.book_versions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Admins can DELETE book versions (archive semantics preferred)
grant delete on table public.book_versions to authenticated;

create policy "Admins delete book versions"
  on public.book_versions for delete
  to authenticated
  using (public.is_admin());

-- Storage policies for admin upload to book-assets bucket
-- Admins can INSERT objects in book-assets bucket
create policy "Admins upload book-assets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'book-assets'
    AND public.is_admin()
  );

-- Admins can UPDATE objects in book-assets bucket
create policy "Admins update book-assets"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'book-assets'
    AND public.is_admin()
  )
  with check (
    bucket_id = 'book-assets'
    AND public.is_admin()
  );

-- Admins can DELETE objects in book-assets bucket
create policy "Admins delete book-assets"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'book-assets'
    AND public.is_admin()
  );

-- Ensure the bucket allows admin operations (idempotent)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'book-assets',
  'book-assets',
  true,
  10485760,
  array['image/webp', 'image/jpeg', 'image/png', 'application/json']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png', 'application/json'];