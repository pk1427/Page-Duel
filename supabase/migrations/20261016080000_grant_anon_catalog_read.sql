-- Phase 11.6: Grant anon read access to published catalog content.
--
-- The player frontend loads the book catalog on the home page before sign-in,
-- using the anon key (anon role). Previously, anon held no SELECT grant on
-- public.books / public.book_versions, so every catalog request returned 42501
-- "permission denied for table books" with no CORS headers on the error response,
-- which the browser surfaced as "TypeError: Failed to fetch".
--
-- This is NOT a weakening of RLS:
--   * RLS remains enabled on both tables.
--   * The anon SELECT policies restrict rows to status='published' books and
--     their published versions only — identical to the authenticated policy.
--   * anon holds no INSERT/UPDATE/DELETE grants and no admin privileges.
--   * Draft/ready books and unpublished versions remain invisible to anon.
--
-- DO NOT apply to production. Apply to staging only after explicit approval.

grant select on table public.books, public.book_versions to anon;

create policy "Anon readers read published books."
  on public.books for select
  to anon
  using (status = 'published');

create policy "Anon readers read published book versions."
  on public.book_versions for select
  to anon
  using (
    EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_versions.book_id
        AND b.status = 'published'
    )
    AND book_versions.publication_status = 'published'
  );
