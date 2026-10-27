-- Phase 11.5: Grant SELECT on admin_audit_log to authenticated role.
--
-- The admin_audit_log table (created in 20261016000000_admin_auth_and_rls.sql)
-- has RLS enabled and an admin-only SELECT policy, but the authenticated role
-- was never granted the table-level SELECT privilege, so every SELECT failed
-- with 42501 permission denied before any policy could run.
--
-- This is a forward-only, least-privilege change:
--   * authenticated gains table-level SELECT on public.admin_audit_log.
--   * RLS remains enabled; the existing "Admins read audit log" policy still
--     restricts rows to admin JWT claims (is_admin()), so non-admin
--     authenticated users and anon see no rows.
--   * anon holds no grants (unchanged), so anon is rejected before any policy.
--
-- DO NOT apply to production. Apply to staging only after explicit approval.

grant select on table public.admin_audit_log to authenticated;
