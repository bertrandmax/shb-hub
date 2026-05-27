-- supabase/migrations/005_event_pm_rls.sql
-- Allow event-specific PMs to manage their event.
--
-- What already exists in 002_rls_policies.sql (no duplicates needed):
--   • event_milestones INSERT  — already includes shb_cup_pm/vice + 5k_run_pm/vice
--
-- What is missing and added here:
--   • events UPDATE  — scoped per event name for each PM pair
--   • competitions INSERT — add shb_cup_pm / vice_pm alongside project_manager
--   • divisions INSERT     — add 5k_run_pm / vice_pm alongside project_manager
--   • tasks INSERT         — add role-based fallback for event PMs who may lack scope entries

-- ── events: SHB Cup PMs can update shb_cup event ────────────────────────────
create policy "events_update_shb_cup_pm" on events
  for update to authenticated
  using (
    name = 'shb_cup'
    and current_user_role() in ('shb_cup_pm', 'shb_cup_vice_pm')
  )
  with check (
    name = 'shb_cup'
    and current_user_role() in ('shb_cup_pm', 'shb_cup_vice_pm')
  );

-- ── events: 5K Run PMs can update 5k_run event ──────────────────────────────
create policy "events_update_run_pm" on events
  for update to authenticated
  using (
    name = '5k_run'
    and current_user_role() in ('5k_run_pm', '5k_run_vice_pm')
  )
  with check (
    name = '5k_run'
    and current_user_role() in ('5k_run_pm', '5k_run_vice_pm')
  );

-- ── competitions: SHB Cup PMs can insert competitions ───────────────────────
create policy "competitions_insert_shb_cup_pm" on competitions
  for insert to authenticated
  with check (
    current_user_role() in ('project_manager', 'shb_cup_pm', 'shb_cup_vice_pm')
  );

-- ── divisions: Run PMs can insert divisions ──────────────────────────────────
create policy "divisions_insert_run_pm" on divisions
  for insert to authenticated
  with check (
    current_user_role() in ('project_manager', '5k_run_pm', '5k_run_vice_pm')
  );

-- ── tasks: event PMs can insert event-scoped tasks by role ──────────────────
-- The existing tasks_insert policy requires user_has_scope for non-PM roles.
-- Event PMs may not have scope entries, so add a role-based fallback.
-- Scoped to event-type tasks only; app layer enforces per-event access.
create policy "tasks_insert_event_pm" on tasks
  for insert to authenticated
  with check (
    (scope_type = 'event' and current_user_role() in (
      'project_manager',
      'shb_cup_pm', 'shb_cup_vice_pm',
      '5k_run_pm', '5k_run_vice_pm'
    ))
    or current_user_role() = 'project_manager'
  );
