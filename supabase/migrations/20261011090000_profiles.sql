-- Profiles: one minimal row per Supabase Auth user.
--
-- Creation is server-side only (trigger on auth.users below). Clients never
-- insert profiles and never touch owner IDs or timestamps.

create schema if not exists private;

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text
    check (
      display_name is null
      or (
        char_length(display_name) between 1 and 40
        and btrim(display_name) = display_name
      )
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Server-side profile creation. Runs as the creator (postgres, bypassrls);
-- pinned empty search_path with schema-qualified names per Supabase guidance.
-- Lives in the unexposed `private` schema so it is not callable over the API.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();

-- Reliably maintain updated_at without giving clients write access to it.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function private.set_updated_at();

-- Least-privilege access: RLS on, explicit grants only.
alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;

create policy "Users read their own profile."
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users update their own display name."
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
