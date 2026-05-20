-- supabase/tests/rls_critical.sql
begin;
select plan(6);

-- setup
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'pm@test.com'),
  ('a0000000-0000-0000-0000-000000000002', 'pic@test.com');

insert into users (id, email, name, role_type) values
  ('a0000000-0000-0000-0000-000000000001', 'pm@test.com',  'PM User',  'project_manager'),
  ('a0000000-0000-0000-0000-000000000002', 'pic@test.com', 'PIC User', 'competition_pic_head');

insert into user_event_scopes (user_id, scope_type, scope_id) values
  ('a0000000-0000-0000-0000-000000000002', 'competition', 'basketball-id');

insert into tasks (id, title, scope_type, scope_id) values
  ('b0000000-0000-0000-0000-000000000001', 'PM task',    'global',      'global'),
  ('b0000000-0000-0000-0000-000000000002', 'PIC task',   'competition', 'basketball-id'),
  ('b0000000-0000-0000-0000-000000000003', 'Other task', 'competition', 'other-id');

-- PM sees all tasks
set local role authenticated;
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000001"}';
select is((select count(*)::int from tasks), 3, 'PM sees all tasks');

-- PIC sees only their scoped task
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000002"}';
select is((select count(*)::int from tasks), 1, 'PIC sees only their competition task');

-- PIC cannot see PM-only task
select is(
  (select count(*)::int from tasks where id = 'b0000000-0000-0000-0000-000000000001'),
  0,
  'PIC cannot see global PM task'
);

-- PM can insert tasks
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000001"}';
select lives_ok(
  $$insert into tasks (title, scope_type, scope_id) values ('New', 'global', 'global')$$,
  'PM can insert tasks'
);

-- PIC can insert task in their scope
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000002"}';
select lives_ok(
  $$insert into tasks (title, scope_type, scope_id) values ('PIC new', 'competition', 'basketball-id')$$,
  'PIC can insert task in their scope'
);

-- PIC cannot insert task in another scope
select throws_ok(
  $$insert into tasks (title, scope_type, scope_id) values ('Bad', 'competition', 'other-id')$$,
  '42501',
  'new row violates row-level security policy for table "tasks"',
  'PIC cannot insert task outside scope'
);

select * from finish();
rollback;
