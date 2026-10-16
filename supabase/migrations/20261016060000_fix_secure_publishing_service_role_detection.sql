-- Hosted PostgREST stores claims in request.jwt.claims; auth.role() handles
-- both supported claim layouts. The prior request.jwt.claim.role lookup was
-- empty for Edge Function service-role requests and blocked server validation.
create or replace function public.publish_validated_book_version(p_book_id uuid, p_version_id uuid, p_manifest_sha256 text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and auth.role() <> 'service_role' then raise exception 'admin authorization required'; end if;
  if not exists (select 1 from book_versions where id=p_version_id and book_id=p_book_id and validation_status='validated' and manifest_sha256=p_manifest_sha256) then raise exception 'version is not server-validated'; end if;
  update book_versions set publication_status='published', published_at=now() where id=p_version_id and book_id=p_book_id;
  update books set status='published', updated_at=now() where id=p_book_id;
end $$;

create or replace function public.unpublish_book_version(p_book_id uuid, p_version_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and auth.role() <> 'service_role' then raise exception 'admin authorization required'; end if;
  update book_versions set publication_status='unpublished', published_at=null where id=p_version_id and book_id=p_book_id;
  if not exists (select 1 from book_versions where book_id=p_book_id and publication_status='published') then update books set status='ready', updated_at=now() where id=p_book_id; end if;
end $$;

create or replace function public.prevent_client_version_lifecycle_mutation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() <> 'service_role'
     and (new.publication_status is distinct from old.publication_status
       or new.published_at is distinct from old.published_at
       or new.validation_status is distinct from old.validation_status
       or new.manifest_sha256 is distinct from old.manifest_sha256) then
    raise exception 'book version lifecycle transitions require secure publishing';
  end if;
  return new;
end $$;
