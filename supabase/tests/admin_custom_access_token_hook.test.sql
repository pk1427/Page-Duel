-- Phase 11: Custom Access Token Hook and protected admin assignment table.
begin;
select plan(8);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'hook-admin@example.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'hook-player@example.com');
insert into public.admin_users (user_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

select is(
  (public.custom_access_token_hook('{"user_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","claims":{"role":"authenticated"}}'::jsonb) -> 'claims' ->> 'admin'),
  'true', 'assigned user receives top-level admin=true'
);
select is(
  (public.custom_access_token_hook('{"user_id":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","claims":{"role":"authenticated"}}'::jsonb) -> 'claims' ->> 'admin'),
  'false', 'ordinary user receives top-level admin=false'
);

set local role authenticated;
select set_config('request.jwt.claim', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","admin":"false"}', true);
select is(public.is_admin(), false, 'ordinary hook claim is not authorized');
select throws_ok($$insert into public.admin_users (user_id) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')$$, '42501', null, 'authenticated client cannot assign admin');
select throws_ok($$update public.admin_users set created_at = now() where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$, '42501', null, 'authenticated client cannot update admin assignment');
select throws_ok($$delete from public.admin_users where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$, '42501', null, 'authenticated client cannot revoke admin assignment');

set local request.jwt.claim = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","admin":"true"}';
select is(public.is_admin(), true, 'admin hook claim is authorized by existing function');
select is((select count(*)::integer from public.admin_users), 0, 'authenticated client cannot read admin assignments');

select * from finish();
rollback;
