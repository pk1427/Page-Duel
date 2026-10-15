-- Phase 9: Storage bucket for published book gameplay assets.
--
-- Assets live in Supabase Storage. The player app reads them via the
-- public REST endpoint (https://<project_ref>.supabase.co/storage/v1/object/
-- public/book-assets/...). Upload/admin write access is restricted to
-- admin roles (future phase); anonymous gets read-only grants.
--
-- NOTE: storage.objects RLS must be manageable by the migration role.
-- We apply explicit policies here rather than relying on Supabase defaults.

-- Create the bucket (only if it does not already exist).
-- `public = true`: objects ARE publicly readable via the /object/public/ URL.
-- This is the intended production architecture for Phase 9.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'book-assets',
  'book-assets',
  true,
  10485760,
  array['image/webp', 'image/jpeg', 'image/png', 'application/json']
)
on conflict (id) do update
  set public = true;

-- Revoke all default grants from anon and authenticated on storage.objects.
-- This ensures only explicitly defined policies apply.
revoke all on table storage.objects from anon, authenticated;

-- Anonymous users can SELECT objects in the book-assets bucket
-- under the "books/" prefix (versioned asset layout) for public reads.
-- This enables the /object/public/book-assets/... URL contract.
grant select on table storage.objects to anon;

create policy "anon can read book-assets books/ objects"
  on storage.objects for select
  to anon
  using (
    bucket_id = 'book-assets'
    AND (storage.foldername(name))[1] = 'books'
  );

-- Authenticated players can also read book-assets under books/ prefix.
grant select on table storage.objects to authenticated;

create policy "authenticated can read book-assets books/ objects"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'book-assets'
    AND (storage.foldername(name))[1] = 'books'
  );

-- No INSERT/UPDATE/DELETE policies on storage.objects for anon or authenticated users.
-- Admin upload access will be added when the admin dashboard ships.