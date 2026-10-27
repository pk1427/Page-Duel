-- Phase 11.5: admin_audit_log RLS + grant tests. Run: supabase test db
--
-- Verifies the least-privilege model introduced by
-- 20261016070000_grant_admin_audit_log_select.sql:
--   * authenticated role gains table-level SELECT (no longer 42501).
--   * RLS remains enabled; the "Admins read audit log" policy restricts rows
--     to admin JWT claims (public.is_admin()).
--   * anon holds no grants: rejected before any policy runs.
begin;
select plan(6);

-- Test identities
insert into auth.users (id, email)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'audit-admin@example.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'audit-player@example.com');

-- Seed audit log entries as the transaction owner (bypasses RLS).
insert into public.admin_audit_log (admin_user_id, action, resource_type, resource_id, metadata)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'publish', 'book_version', '11111111-1111-1111-1111-111111111111', '{"book_id":"22222222-2222-2222-2222-222222222222"}'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'unpublish', 'book_version', '33333333-3333-3333-3333-333333333333', '{"book_id":"22222222-2222-2222-2222-222222222222"});

-- Anon holds no grant: denied before any policy runs.
set local role anon;
select throws_ok(
  $$select * from public.admin_audit_log$$,
  '42501',
  null,
  'anon cannot read admin_audit_log'
);

-- Authenticated non-admin player: has the SELECT grant (no 42501), but RLS
-- filters every row because the admin-only policy does not match.
set local role authenticated;
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
select results_eq(
  $$select count(*)::integer from public.admin_audit_log$$,
  $$values (0)$$,
  'non-admin authenticated player sees no audit log rows (RLS)'
);

-- Authenticated admin: has the SELECT grant and passes the admin policy,
-- so audit log rows are readable.
set local request.jwt.claim = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","admin":"true"}';
select results_eq(
  $$select count(*)::integer from public.admin_audit_log$$,
  $$values (2)$$,
  'admin can read audit log entries'
);
select is(
  (select count(*)::integer from public.admin_audit_log where action = 'publish'),
  1,
  'admin sees the publish audit entry'
);

select * from finish();
rollback;
