-- Book catalog foundation: books and book_versions tables.
--
-- Phase 7: adds a read-capable catalog for published book content without
-- touching existing game-session or profile schema semantics.
-- Existing book_id/book_title/book_version/book_author snapshot columns in
-- game_sessions remain for backward compatibility; book_version_id is added
-- as a nullable FK so existing rows are untouched.
--
-- Books are identified by a stable `slug` (e.g. 'alice-loc-1885') that
-- matches the BookContent.id used by the book-data package and stored in
-- game_sessions.book_id today. book_versions carry an immutable snapshot
-- of the validated content manifest with a SHA-256 checksum.

create table public.books (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  author text,
  description text,
  language text check (language ~ '^[a-z]{2}(-[A-Z][a-z]{3})?$'),
  cover_asset_path text,
  status text not null default 'draft'
    check (status in ('draft', 'ready', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index books_slug_idx on public.books (slug);
create index books_status_idx on public.books (status);

create table public.book_versions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  version_label text not null,
  manifest_sha256 text not null,
  content_json jsonb not null,
  validation_status text not null default 'unvalidated'
    check (validation_status in ('unvalidated', 'validating', 'validated')),
  publication_status text not null default 'unpublished'
    check (publication_status in ('unpublished', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (book_id, version_label),
  check ((publication_status = 'published') = (published_at is not null))
);

create index book_versions_book_id_idx on public.book_versions (book_id);
create index book_versions_publication_idx
  on public.book_versions (publication_status, published_at desc);

-- Only a published book_version can be linked from a new game session save.
-- The FK is nullable so existing game_sessions rows (saved before this
-- migration) keep their snapshot columns and remain readable.
alter table public.game_sessions
  add column if not exists book_version_id uuid
    references public.book_versions (id) on delete set null;

-- RLS conventions follow the existing pattern: anon gets zero grants,
-- authenticated gets select only (no INSERT/UPDATE/DELETE at this phase).
-- Write policies for admins will be added when the admin dashboard ships;
-- until then catalog records are read-only to all players.
alter table public.books enable row level security;
alter table public.book_versions enable row level security;

revoke all on table public.books, public.book_versions from anon, authenticated;

-- Readers (players) get select on published content only.
grant select on table public.books, public.book_versions to authenticated;

-- Readers (players) can see only published books.
create policy "Players read published books."
  on public.books for select
  to authenticated
  using (status = 'published');

-- Readers see only published versions whose parent book is also published.
create policy "Players read published book versions."
  on public.book_versions for select
  to authenticated
  using (
    EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_versions.book_id
        AND b.status = 'published'
    )
    AND book_versions.publication_status = 'published'
  );

-- No INSERT/UPDATE/DELETE grants or policies exist for authenticated users:
-- catalog records are read-only to players at this phase. Admin write access
-- will be gated by JWT claims when the admin dashboard is implemented.
