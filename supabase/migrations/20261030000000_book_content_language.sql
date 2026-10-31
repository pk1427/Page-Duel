-- Interface language and book content language are deliberately separate.
-- Current published catalog records are backed by English source manifests,
-- so their explicit backfill does not infer language from their titles.

update public.books
set language = 'en'
where language is null;

alter table public.books
  alter column language set default 'en',
  alter column language set not null;

alter table public.books
  drop constraint if exists books_language_check;

alter table public.books
  add constraint books_language_check
  check (language in ('en', 'hi', 'mr'));

create index if not exists books_language_status_idx
  on public.books (language, status);
