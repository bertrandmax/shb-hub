-- supabase/migrations/002_rls_policies.sql
-- Row-Level Security policies for all tables.
-- Roles: project_manager has full access everywhere.
--        Scoped roles (coordinators, PIC, division heads, etc.) see/modify
--        only rows matching their user_event_scopes entries.
--        Public/authenticated users get read access to published data.
-- NOTE: central_support_head/vice do not exist in role_type enum;
--       division_head / division_vice_head cover central-support scenarios.

-- ── Helper functions ─────────────────────────────────────────────────────────

-- Returns the role_type of the currently-authenticated user.
create or replace function current_user_role()
returns role_type language sql security definer stable as $$
  select role_type from users where id = auth.uid()
$$;

-- Returns true if the current user has a scope entry matching p_scope_type/p_scope_id.
create or replace function user_has_scope(p_scope_type scope_type, p_scope_id text)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from user_event_scopes
    where user_id    = auth.uid()
      and scope_type = p_scope_type
      and scope_id   = p_scope_id
  )
$$;

-- ── users ────────────────────────────────────────────────────────────────────
alter table users enable row level security;

create policy "users_select" on users
  for select to authenticated
  using (true);

create policy "users_insert" on users
  for insert to authenticated
  with check (id = auth.uid());

create policy "users_update" on users
  for update to authenticated
  using  (id = auth.uid() or current_user_role() = 'project_manager')
  with check (id = auth.uid() or current_user_role() = 'project_manager');

-- ── user_event_scopes ────────────────────────────────────────────────────────
alter table user_event_scopes enable row level security;

create policy "scopes_select" on user_event_scopes
  for select to authenticated
  using (true);

create policy "scopes_all_pm" on user_event_scopes
  for all to authenticated
  using      (current_user_role() = 'project_manager')
  with check (current_user_role() = 'project_manager');

-- ── invite_tokens ────────────────────────────────────────────────────────────
alter table invite_tokens enable row level security;

-- Only project_manager can manage tokens.
create policy "tokens_pm_only" on invite_tokens
  for all to authenticated
  using      (current_user_role() = 'project_manager')
  with check (current_user_role() = 'project_manager');

-- Unauthenticated users may read a valid (unused, non-expired) token
-- so the invite acceptance page can validate it without logging in first.
create policy "tokens_anon_read" on invite_tokens
  for select to anon
  using (used_at is null and expires_at > now());

-- ── events ───────────────────────────────────────────────────────────────────
alter table events enable row level security;

create policy "events_select" on events
  for select to authenticated
  using (true);

create policy "events_all_pm" on events
  for all to authenticated
  using      (current_user_role() = 'project_manager')
  with check (current_user_role() = 'project_manager');

-- ── competitions ─────────────────────────────────────────────────────────────
alter table competitions enable row level security;

create policy "competitions_select" on competitions
  for select to authenticated
  using (true);

create policy "competitions_all_pm" on competitions
  for all to authenticated
  using      (current_user_role() = 'project_manager')
  with check (current_user_role() = 'project_manager');

-- ── divisions ────────────────────────────────────────────────────────────────
alter table divisions enable row level security;

create policy "divisions_select" on divisions
  for select to authenticated
  using (true);

create policy "divisions_all_pm" on divisions
  for all to authenticated
  using      (current_user_role() = 'project_manager')
  with check (current_user_role() = 'project_manager');

-- ── tasks ────────────────────────────────────────────────────────────────────
alter table tasks enable row level security;

create policy "tasks_select" on tasks
  for select to authenticated
  using (
    current_user_role() = 'project_manager'
    or scope_type = 'global'
    or user_has_scope(scope_type, scope_id)
  );

create policy "tasks_insert" on tasks
  for insert to authenticated
  with check (
    current_user_role() = 'project_manager'
    or (scope_type = 'event'       and user_has_scope('event'::scope_type,       scope_id))
    or (scope_type = 'competition' and user_has_scope('competition'::scope_type, scope_id))
    or (scope_type = 'division'    and user_has_scope('division'::scope_type,    scope_id))
  );

create policy "tasks_update" on tasks
  for update to authenticated
  using (
    current_user_role() = 'project_manager'
    or assigned_to = auth.uid()
    or user_has_scope(scope_type, scope_id)
  )
  with check (
    current_user_role() = 'project_manager'
    or assigned_to = auth.uid()
    or user_has_scope(scope_type, scope_id)
  );

create policy "tasks_delete_pm" on tasks
  for delete to authenticated
  using (current_user_role() = 'project_manager');

-- ── event_milestones ─────────────────────────────────────────────────────────
alter table event_milestones enable row level security;

create policy "milestones_select" on event_milestones
  for select to authenticated
  using (true);

create policy "milestones_insert" on event_milestones
  for insert to authenticated
  with check (
    current_user_role() in (
      'project_manager',
      'shb_cup_pm', 'shb_cup_vice_pm',
      '5k_run_pm', '5k_run_vice_pm'
    )
  );

create policy "milestones_update" on event_milestones
  for update to authenticated
  using (
    current_user_role() in (
      'project_manager',
      'shb_cup_pm', 'shb_cup_vice_pm',
      '5k_run_pm', '5k_run_vice_pm'
    )
  )
  with check (
    current_user_role() in (
      'project_manager',
      'shb_cup_pm', 'shb_cup_vice_pm',
      '5k_run_pm', '5k_run_vice_pm'
    )
  );

create policy "milestones_delete_pm" on event_milestones
  for delete to authenticated
  using (current_user_role() = 'project_manager');

-- ── sponsors ─────────────────────────────────────────────────────────────────
alter table sponsors enable row level security;

create policy "sponsors_select" on sponsors
  for select to authenticated
  using (true);

create policy "sponsors_insert_pm_mktg" on sponsors
  for insert to authenticated
  with check (current_user_role() in ('project_manager', 'marketing_head'));

create policy "sponsors_update_pm_mktg" on sponsors
  for update to authenticated
  using      (current_user_role() in ('project_manager', 'marketing_head'))
  with check (current_user_role() in ('project_manager', 'marketing_head'));

create policy "sponsors_delete_pm" on sponsors
  for delete to authenticated
  using (current_user_role() = 'project_manager');

-- ── sponsor_interactions ─────────────────────────────────────────────────────
alter table sponsor_interactions enable row level security;

create policy "interactions_select" on sponsor_interactions
  for select to authenticated
  using (true);

create policy "interactions_insert" on sponsor_interactions
  for insert to authenticated
  with check (
    current_user_role() in (
      'project_manager', 'marketing_head',
      'shb_cup_pm', 'shb_cup_vice_pm',
      '5k_run_pm', '5k_run_vice_pm'
    )
  );

create policy "interactions_update" on sponsor_interactions
  for update to authenticated
  using (
    current_user_role() in (
      'project_manager', 'marketing_head',
      'shb_cup_pm', 'shb_cup_vice_pm',
      '5k_run_pm', '5k_run_vice_pm'
    )
    or logged_by = auth.uid()
  )
  with check (
    current_user_role() in (
      'project_manager', 'marketing_head',
      'shb_cup_pm', 'shb_cup_vice_pm',
      '5k_run_pm', '5k_run_vice_pm'
    )
    or logged_by = auth.uid()
  );

create policy "interactions_delete_pm" on sponsor_interactions
  for delete to authenticated
  using (current_user_role() = 'project_manager');

-- ── sponsor_deliverables ─────────────────────────────────────────────────────
alter table sponsor_deliverables enable row level security;

create policy "deliverables_select" on sponsor_deliverables
  for select to authenticated
  using (true);

create policy "deliverables_insert_pm_mktg" on sponsor_deliverables
  for insert to authenticated
  with check (current_user_role() in ('project_manager', 'marketing_head'));

create policy "deliverables_update_pm_mktg" on sponsor_deliverables
  for update to authenticated
  using      (current_user_role() in ('project_manager', 'marketing_head'))
  with check (current_user_role() in ('project_manager', 'marketing_head'));

create policy "deliverables_delete_pm" on sponsor_deliverables
  for delete to authenticated
  using (current_user_role() = 'project_manager');

-- ── funds ────────────────────────────────────────────────────────────────────
alter table funds enable row level security;

create policy "funds_select" on funds
  for select to authenticated
  using (true);

create policy "funds_all_pm_mktg" on funds
  for all to authenticated
  using      (current_user_role() in ('project_manager', 'marketing_head'))
  with check (current_user_role() in ('project_manager', 'marketing_head'));

-- ── budget_requests ──────────────────────────────────────────────────────────
alter table budget_requests enable row level security;

-- Any scoped member can see budget requests in their scope; PM sees all.
create policy "budget_requests_select" on budget_requests
  for select to authenticated
  using (
    current_user_role() = 'project_manager'
    or scope_type = 'global'
    or user_has_scope(scope_type, scope_id)
    or requested_by = auth.uid()
  );

-- Any authenticated user can submit a budget request for their own scope.
create policy "budget_requests_insert" on budget_requests
  for insert to authenticated
  with check (
    current_user_role() = 'project_manager'
    or (scope_type = 'event'       and user_has_scope('event'::scope_type,       scope_id))
    or (scope_type = 'competition' and user_has_scope('competition'::scope_type, scope_id))
    or (scope_type = 'division'    and user_has_scope('division'::scope_type,    scope_id))
    or (scope_type = 'global'      and current_user_role() = 'project_manager')
  );

-- Only PM can approve/reject (update status); requester can update their own pending request.
create policy "budget_requests_update" on budget_requests
  for update to authenticated
  using (
    current_user_role() = 'project_manager'
    or (requested_by = auth.uid() and status = 'pending')
  )
  with check (
    current_user_role() = 'project_manager'
    or (requested_by = auth.uid() and status = 'pending')
  );

create policy "budget_requests_delete_pm" on budget_requests
  for delete to authenticated
  using (current_user_role() = 'project_manager');

-- ── notifications ────────────────────────────────────────────────────────────
alter table notifications enable row level security;

-- Users can only see and manage their own notifications.
create policy "notifications_own" on notifications
  for all to authenticated
  using      (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── notification_errors ──────────────────────────────────────────────────────
alter table notification_errors enable row level security;

-- Only PM can inspect notification delivery errors.
create policy "notification_errors_pm_only" on notification_errors
  for all to authenticated
  using      (current_user_role() = 'project_manager')
  with check (current_user_role() = 'project_manager');

-- ── announcements ────────────────────────────────────────────────────────────
alter table announcements enable row level security;

create policy "announcements_select" on announcements
  for select to authenticated
  using (
    scope_type is null
    or current_user_role() = 'project_manager'
    or user_has_scope(scope_type, scope_id)
  );

-- Only PM can create announcements (scoped ones are created on behalf of a scope).
create policy "announcements_insert_pm" on announcements
  for insert to authenticated
  with check (current_user_role() = 'project_manager');

create policy "announcements_update_pm" on announcements
  for update to authenticated
  using      (current_user_role() = 'project_manager')
  with check (current_user_role() = 'project_manager');

create policy "announcements_delete_pm" on announcements
  for delete to authenticated
  using (current_user_role() = 'project_manager');

-- ── blockers ─────────────────────────────────────────────────────────────────
alter table blockers enable row level security;

-- Division heads (covers central-support oversight too) and PM see all;
-- scoped users see blockers in their scope.
create policy "blockers_select" on blockers
  for select to authenticated
  using (
    current_user_role() in ('project_manager', 'division_head', 'division_vice_head')
    or user_has_scope(scope_type, scope_id)
  );

-- Any authenticated member can raise a blocker.
create policy "blockers_insert" on blockers
  for insert to authenticated
  with check (true);

-- PM or the person who flagged it can update a blocker.
create policy "blockers_update" on blockers
  for update to authenticated
  using (
    current_user_role() = 'project_manager'
    or flagged_by = auth.uid()
  )
  with check (
    current_user_role() = 'project_manager'
    or flagged_by = auth.uid()
  );

create policy "blockers_delete_pm" on blockers
  for delete to authenticated
  using (current_user_role() = 'project_manager');

-- ── resource_requests ────────────────────────────────────────────────────────
alter table resource_requests enable row level security;

create policy "resource_requests_select" on resource_requests
  for select to authenticated
  using (
    current_user_role() = 'project_manager'
    or user_has_scope(scope_type, scope_id)
    or requested_by = auth.uid()
  );

create policy "resource_requests_insert" on resource_requests
  for insert to authenticated
  with check (
    current_user_role() = 'project_manager'
    or (scope_type = 'event'       and user_has_scope('event'::scope_type,       scope_id))
    or (scope_type = 'competition' and user_has_scope('competition'::scope_type, scope_id))
    or (scope_type = 'division'    and user_has_scope('division'::scope_type,    scope_id))
  );

create policy "resource_requests_update" on resource_requests
  for update to authenticated
  using (
    current_user_role() = 'project_manager'
    or (requested_by = auth.uid() and status = 'pending')
  )
  with check (
    current_user_role() = 'project_manager'
    or (requested_by = auth.uid() and status = 'pending')
  );

create policy "resource_requests_delete_pm" on resource_requests
  for delete to authenticated
  using (current_user_role() = 'project_manager');

-- ── documents ────────────────────────────────────────────────────────────────
alter table documents enable row level security;

create policy "documents_select" on documents
  for select to authenticated
  using (
    current_user_role() = 'project_manager'
    or user_has_scope(scope_type, scope_id)
  );

create policy "documents_insert" on documents
  for insert to authenticated
  with check (
    current_user_role() = 'project_manager'
    or user_has_scope(scope_type, scope_id)
  );

create policy "documents_update" on documents
  for update to authenticated
  using (
    current_user_role() = 'project_manager'
    or uploaded_by = auth.uid()
  )
  with check (
    current_user_role() = 'project_manager'
    or uploaded_by = auth.uid()
  );

create policy "documents_delete" on documents
  for delete to authenticated
  using (
    current_user_role() = 'project_manager'
    or uploaded_by = auth.uid()
  );

-- ── competition_matches ──────────────────────────────────────────────────────
alter table competition_matches enable row level security;

-- Public read: schedules are visible to everyone.
create policy "matches_public_read" on competition_matches
  for select
  using (true);

create policy "matches_insert_coord" on competition_matches
  for insert to authenticated
  with check (
    current_user_role() in (
      'project_manager',
      'shb_cup_pm', 'shb_cup_vice_pm',
      'competition_coordinator', 'competition_vice_coordinator'
    )
  );

create policy "matches_update_coord" on competition_matches
  for update to authenticated
  using (
    current_user_role() in (
      'project_manager',
      'shb_cup_pm', 'shb_cup_vice_pm',
      'competition_coordinator', 'competition_vice_coordinator'
    )
  )
  with check (
    current_user_role() in (
      'project_manager',
      'shb_cup_pm', 'shb_cup_vice_pm',
      'competition_coordinator', 'competition_vice_coordinator'
    )
  );

create policy "matches_delete_pm" on competition_matches
  for delete to authenticated
  using (current_user_role() = 'project_manager');

-- ── match_results ────────────────────────────────────────────────────────────
alter table match_results enable row level security;

-- Public read: results are visible to everyone.
create policy "results_public_read" on match_results
  for select
  using (true);

create policy "results_insert_authorized" on match_results
  for insert to authenticated
  with check (
    current_user_role() in (
      'project_manager',
      'shb_cup_pm', 'shb_cup_vice_pm',
      'competition_coordinator', 'competition_vice_coordinator',
      'competition_pic_head', 'competition_pic_vice'
    )
  );

create policy "results_update_authorized" on match_results
  for update to authenticated
  using (
    current_user_role() in (
      'project_manager',
      'shb_cup_pm', 'shb_cup_vice_pm',
      'competition_coordinator', 'competition_vice_coordinator',
      'competition_pic_head', 'competition_pic_vice'
    )
    or recorded_by = auth.uid()
  )
  with check (
    current_user_role() in (
      'project_manager',
      'shb_cup_pm', 'shb_cup_vice_pm',
      'competition_coordinator', 'competition_vice_coordinator',
      'competition_pic_head', 'competition_pic_vice'
    )
    or recorded_by = auth.uid()
  );

create policy "results_delete_pm" on match_results
  for delete to authenticated
  using (current_user_role() = 'project_manager');

-- ── team_registrations ───────────────────────────────────────────────────────
alter table team_registrations enable row level security;

-- Any authenticated user can view registrations (needed for brackets, etc.).
create policy "registrations_select" on team_registrations
  for select to authenticated
  using (true);

create policy "registrations_insert" on team_registrations
  for insert to authenticated
  with check (
    current_user_role() in (
      'project_manager',
      'shb_cup_pm', 'shb_cup_vice_pm',
      'competition_coordinator', 'competition_vice_coordinator',
      'competition_pic_head', 'competition_pic_vice'
    )
  );

create policy "registrations_update" on team_registrations
  for update to authenticated
  using (
    current_user_role() in (
      'project_manager',
      'shb_cup_pm', 'shb_cup_vice_pm',
      'competition_coordinator', 'competition_vice_coordinator',
      'competition_pic_head', 'competition_pic_vice'
    )
  )
  with check (
    current_user_role() in (
      'project_manager',
      'shb_cup_pm', 'shb_cup_vice_pm',
      'competition_coordinator', 'competition_vice_coordinator',
      'competition_pic_head', 'competition_pic_vice'
    )
  );

create policy "registrations_delete_pm" on team_registrations
  for delete to authenticated
  using (current_user_role() = 'project_manager');

-- ── day_of_checklists ────────────────────────────────────────────────────────
alter table day_of_checklists enable row level security;

create policy "checklists_select" on day_of_checklists
  for select to authenticated
  using (
    current_user_role() = 'project_manager'
    or user_has_scope(scope_type, scope_id)
  );

create policy "checklists_insert" on day_of_checklists
  for insert to authenticated
  with check (
    current_user_role() = 'project_manager'
    or user_has_scope(scope_type, scope_id)
  );

create policy "checklists_update" on day_of_checklists
  for update to authenticated
  using (
    current_user_role() = 'project_manager'
    or user_has_scope(scope_type, scope_id)
  )
  with check (
    current_user_role() = 'project_manager'
    or user_has_scope(scope_type, scope_id)
  );

create policy "checklists_delete_pm" on day_of_checklists
  for delete to authenticated
  using (current_user_role() = 'project_manager');

-- ── volunteers ───────────────────────────────────────────────────────────────
alter table volunteers enable row level security;

create policy "volunteers_select" on volunteers
  for select to authenticated
  using (
    current_user_role() in (
      'project_manager',
      'division_head', 'division_vice_head'
    )
    or user_has_scope(assigned_to_scope_type, assigned_to_scope_id)
  );

create policy "volunteers_insert" on volunteers
  for insert to authenticated
  with check (
    current_user_role() = 'project_manager'
    or (
      assigned_to_scope_type = 'event'       and user_has_scope('event'::scope_type,       assigned_to_scope_id)
    )
    or (
      assigned_to_scope_type = 'competition' and user_has_scope('competition'::scope_type, assigned_to_scope_id)
    )
    or (
      assigned_to_scope_type = 'division'    and user_has_scope('division'::scope_type,    assigned_to_scope_id)
    )
  );

create policy "volunteers_update" on volunteers
  for update to authenticated
  using (
    current_user_role() in (
      'project_manager',
      'division_head', 'division_vice_head'
    )
    or user_has_scope(assigned_to_scope_type, assigned_to_scope_id)
  )
  with check (
    current_user_role() in (
      'project_manager',
      'division_head', 'division_vice_head'
    )
    or user_has_scope(assigned_to_scope_type, assigned_to_scope_id)
  );

create policy "volunteers_delete_pm" on volunteers
  for delete to authenticated
  using (current_user_role() = 'project_manager');

-- ── meeting_notes ────────────────────────────────────────────────────────────
alter table meeting_notes enable row level security;

create policy "meeting_notes_select" on meeting_notes
  for select to authenticated
  using (
    current_user_role() = 'project_manager'
    or user_has_scope(scope_type, scope_id)
  );

create policy "meeting_notes_insert" on meeting_notes
  for insert to authenticated
  with check (
    current_user_role() = 'project_manager'
    or user_has_scope(scope_type, scope_id)
  );

create policy "meeting_notes_update" on meeting_notes
  for update to authenticated
  using (
    current_user_role() = 'project_manager'
    or created_by = auth.uid()
  )
  with check (
    current_user_role() = 'project_manager'
    or created_by = auth.uid()
  );

create policy "meeting_notes_delete" on meeting_notes
  for delete to authenticated
  using (
    current_user_role() = 'project_manager'
    or created_by = auth.uid()
  );

-- ── content_calendar_posts ───────────────────────────────────────────────────
alter table content_calendar_posts enable row level security;

-- Marketing head and PM manage the content calendar.
create policy "posts_select" on content_calendar_posts
  for select to authenticated
  using (
    current_user_role() in ('project_manager', 'marketing_head')
  );

create policy "posts_insert" on content_calendar_posts
  for insert to authenticated
  with check (
    current_user_role() in ('project_manager', 'marketing_head')
  );

create policy "posts_update" on content_calendar_posts
  for update to authenticated
  using (
    current_user_role() in ('project_manager', 'marketing_head')
    or created_by = auth.uid()
  )
  with check (
    current_user_role() in ('project_manager', 'marketing_head')
    or created_by = auth.uid()
  );

create policy "posts_delete" on content_calendar_posts
  for delete to authenticated
  using (
    current_user_role() in ('project_manager', 'marketing_head')
  );

-- ── merch_items ──────────────────────────────────────────────────────────────
alter table merch_items enable row level security;

-- Readable by all authenticated users; managed by PM and marketing_head.
create policy "merch_select" on merch_items
  for select to authenticated
  using (true);

create policy "merch_insert_pm_mktg" on merch_items
  for insert to authenticated
  with check (current_user_role() in ('project_manager', 'marketing_head'));

create policy "merch_update_pm_mktg" on merch_items
  for update to authenticated
  using      (current_user_role() in ('project_manager', 'marketing_head'))
  with check (current_user_role() in ('project_manager', 'marketing_head'));

create policy "merch_delete_pm" on merch_items
  for delete to authenticated
  using (current_user_role() = 'project_manager');

-- ── ticket_sales ─────────────────────────────────────────────────────────────
alter table ticket_sales enable row level security;

-- Ticket numbers are visible to authenticated users; updated by PM/marketing.
create policy "tickets_select" on ticket_sales
  for select to authenticated
  using (true);

create policy "tickets_insert_pm_mktg" on ticket_sales
  for insert to authenticated
  with check (current_user_role() in ('project_manager', 'marketing_head'));

create policy "tickets_update_pm_mktg" on ticket_sales
  for update to authenticated
  using      (current_user_role() in ('project_manager', 'marketing_head'))
  with check (current_user_role() in ('project_manager', 'marketing_head'));

create policy "tickets_delete_pm" on ticket_sales
  for delete to authenticated
  using (current_user_role() = 'project_manager');

-- ── activity_log ─────────────────────────────────────────────────────────────
alter table activity_log enable row level security;

-- PM sees full log; users see entries in their own scope or authored by them.
create policy "activity_log_select" on activity_log
  for select to authenticated
  using (
    current_user_role() = 'project_manager'
    or user_id = auth.uid()
    or (scope_type is not null and user_has_scope(scope_type, scope_id))
  );

-- Any authenticated action can append to the log (insert only).
create policy "activity_log_insert" on activity_log
  for insert to authenticated
  with check (true);

-- Log entries are immutable: no update or delete except by PM.
create policy "activity_log_delete_pm" on activity_log
  for delete to authenticated
  using (current_user_role() = 'project_manager');
