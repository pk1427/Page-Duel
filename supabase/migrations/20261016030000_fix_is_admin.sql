-- Phase 10b: Fix is_admin() function to handle NULL properly
-- The issue was: false OR NULL = NULL in PostgreSQL
-- Fix by using COALESCE to treat missing claims as false

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select
    coalesce((select auth.jwt() ->> 'admin') = 'true', false)
    OR coalesce((select auth.jwt() ->> 'https://book-people/admin') = 'true', false)
$$;

revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;