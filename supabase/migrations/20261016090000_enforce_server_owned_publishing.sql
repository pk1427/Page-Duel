-- Production hardening: the browser may create draft records and edit book
-- metadata, but it must never forge validation, manifest, or publication state.
-- The book-publish Edge Function writes these fields with the service_role.

create or replace function public.prevent_client_version_lifecycle_mutation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.validation_status <> 'unvalidated'
       or new.publication_status <> 'unpublished'
       or new.published_at is not null then
      raise exception 'book version lifecycle transitions require secure publishing';
    end if;
    return new;
  end if;

  if new.publication_status is distinct from old.publication_status
     or new.published_at is distinct from old.published_at
     or new.validation_status is distinct from old.validation_status
     or new.manifest_sha256 is distinct from old.manifest_sha256
     or new.content_json is distinct from old.content_json then
    raise exception 'book version lifecycle and manifest changes require secure publishing';
  end if;
  return new;
end $$;

drop trigger if exists book_versions_secure_lifecycle on public.book_versions;
create trigger book_versions_secure_lifecycle
before insert or update on public.book_versions
for each row execute function public.prevent_client_version_lifecycle_mutation();

create or replace function public.prevent_client_book_publication_mutation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() <> 'service_role'
     and new.status is distinct from old.status then
    raise exception 'book publication status requires secure publishing';
  end if;
  return new;
end $$;

drop trigger if exists books_secure_publication on public.books;
create trigger books_secure_publication
before update on public.books
for each row execute function public.prevent_client_book_publication_mutation();
