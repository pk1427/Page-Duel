-- Phase 11: issue the existing top-level admin JWT claim from a server-owned table.
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on table public.admin_users from anon, authenticated, public;

-- Auth invokes the hook using this role; it has read-only access to assignments.
grant select on table public.admin_users to supabase_auth_admin;
create policy "Auth hook reads admin assignments"
  on public.admin_users for select to supabase_auth_admin using (true);

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable set search_path = '' as $$
declare
  claims jsonb;
  is_assigned_admin boolean;
begin
  select exists (
    select 1 from public.admin_users
    where user_id = (event ->> 'user_id')::uuid
  ) into is_assigned_admin;
  claims := coalesce(event -> 'claims', '{}'::jsonb);
  claims := jsonb_set(claims, '{admin}', to_jsonb(is_assigned_admin), true);
  return jsonb_set(event, '{claims}', claims, true);
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from anon, authenticated, public;
