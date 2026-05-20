-- supabase/migrations/001_initial_schema.sql

-- Enable extensions
create extension if not exists "uuid-ossp";

-- ── Enums ───────────────────────────────────────────────────
create type role_type as enum (
  'project_manager',
  'shb_cup_pm', 'shb_cup_vice_pm',
  '5k_run_pm',  '5k_run_vice_pm',
  'competition_coordinator', 'competition_vice_coordinator',
  'competition_pic_head',    'competition_pic_vice',
  'division_head',           'division_vice_head',
  'marketing_head'
);

create type scope_type as enum ('global', 'event', 'competition', 'division');
create type task_status as enum ('todo', 'in_progress', 'done');
create type event_name as enum ('shb_cup', '5k_run');
create type event_status as enum ('upcoming', 'active', 'completed');
create type milestone_status as enum ('upcoming', 'completed', 'delayed');
create type sponsor_status as enum ('prospect', 'contacted', 'committed', 'declined');
create type interaction_type as enum ('call', 'email', 'meeting');
create type deliverable_type as enum ('logo_placement', 'booth', 'shoutout', 'other');
create type deliverable_status as enum ('pending', 'fulfilled');
create type notification_type as enum (
  'task_overdue', 'followup_due', 'fund_gap_alert',
  'blocker_flagged', 'announcement'
);
create type blocker_status as enum ('open', 'in_progress', 'resolved');
create type blocker_priority as enum ('low', 'medium', 'high');
create type request_status as enum ('pending', 'approved', 'rejected', 'fulfilled');
create type match_status as enum ('scheduled', 'completed', 'cancelled');
create type payment_status as enum ('unpaid', 'paid');
create type post_platform as enum ('instagram', 'tiktok', 'facebook', 'twitter', 'other');
create type post_status as enum ('draft', 'scheduled', 'published');
create type division_type as enum ('marketing', 'central_support', 'run', 'shared');

-- ── Core tables ──────────────────────────────────────────────
create table users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  name       text not null,
  role_type  role_type not null,
  created_at timestamptz default now()
);

create table user_event_scopes (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references users(id) on delete cascade,
  scope_type scope_type not null,
  scope_id   text not null,
  unique(user_id, scope_type, scope_id)
);

create table invite_tokens (
  id          uuid primary key default uuid_generate_v4(),
  email       text not null,
  role_type   role_type not null,
  scope_type  scope_type not null,
  scope_id    text not null,
  token       uuid not null default uuid_generate_v4() unique,
  expires_at  timestamptz not null default now() + interval '48 hours',
  used_at     timestamptz,
  invited_by  uuid references users(id)
);

create table events (
  id         uuid primary key default uuid_generate_v4(),
  name       event_name not null unique,
  status     event_status not null default 'upcoming',
  created_at timestamptz default now()
);

create table competitions (
  id          uuid primary key default uuid_generate_v4(),
  event_id    uuid not null references events(id) on delete cascade,
  name        text not null,
  status      event_status not null default 'upcoming',
  is_active   boolean not null default true,
  order_index int not null default 0,
  created_at  timestamptz default now(),
  unique(event_id, name)
);

create table divisions (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  type            division_type not null,
  parent_event_id uuid references events(id)
);

create table tasks (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  status      task_status not null default 'todo',
  due_date    date,
  assigned_to uuid references users(id),
  scope_type  scope_type not null,
  scope_id    text not null,
  created_at  timestamptz default now()
);

create table event_milestones (
  id          uuid primary key default uuid_generate_v4(),
  event_id    uuid not null references events(id) on delete cascade,
  title       text not null,
  description text,
  date        date not null,
  status      milestone_status not null default 'upcoming',
  order_index int not null default 0,
  created_by  uuid references users(id),
  updated_at  timestamptz default now()
);

create table sponsors (
  id                 uuid primary key default uuid_generate_v4(),
  company_name       text not null,
  contact_name       text,
  contact_email      text,
  status             sponsor_status not null default 'prospect',
  amount_pledged     numeric(12,2) default 0,
  amount_received    numeric(12,2) default 0,
  next_followup_date date,
  notes              text,
  created_at         timestamptz default now()
);

create table sponsor_interactions (
  id               uuid primary key default uuid_generate_v4(),
  sponsor_id       uuid not null references sponsors(id) on delete cascade,
  logged_by        uuid references users(id),
  interaction_type interaction_type not null,
  notes            text,
  date             date not null default current_date
);

create table sponsor_deliverables (
  id           uuid primary key default uuid_generate_v4(),
  sponsor_id   uuid not null references sponsors(id) on delete cascade,
  description  text not null,
  type         deliverable_type not null,
  status       deliverable_status not null default 'pending',
  due_date     date,
  fulfilled_at timestamptz
);

create table funds (
  id               uuid primary key default uuid_generate_v4(),
  scope_type       scope_type not null,
  scope_id         text not null,
  category         text not null,
  amount_budgeted  numeric(12,2) not null default 0,
  amount_received  numeric(12,2) not null default 0,
  updated_at       timestamptz default now()
);

create table budget_requests (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  amount       numeric(12,2) not null,
  reason       text,
  requested_by uuid references users(id),
  scope_type   scope_type not null,
  scope_id     text not null,
  status       request_status not null default 'pending',
  approved_by  uuid references users(id),
  created_at   timestamptz default now()
);

create table notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references users(id) on delete cascade,
  message    text not null,
  read       boolean not null default false,
  type       notification_type not null,
  created_at timestamptz default now()
);

create table notification_errors (
  id              uuid primary key default uuid_generate_v4(),
  notification_id uuid references notifications(id),
  error_message   text,
  retry_count     int default 0,
  created_at      timestamptz default now()
);

create table announcements (
  id         uuid primary key default uuid_generate_v4(),
  title      text not null,
  body       text not null,
  created_by uuid references users(id),
  scope_type scope_type,
  scope_id   text,
  pinned     boolean not null default false,
  created_at timestamptz default now()
);

create table blockers (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  flagged_by  uuid references users(id),
  status      blocker_status not null default 'open',
  priority    blocker_priority not null default 'medium',
  scope_type  scope_type not null,
  scope_id    text not null,
  resolved_by uuid references users(id),
  created_at  timestamptz default now()
);

create table resource_requests (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  description  text,
  requested_by uuid references users(id),
  scope_type   scope_type not null,
  scope_id     text not null,
  status       request_status not null default 'pending',
  approved_by  uuid references users(id),
  created_at   timestamptz default now()
);

create table documents (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  file_url    text not null,
  uploaded_by uuid references users(id),
  scope_type  scope_type not null,
  scope_id    text not null,
  created_at  timestamptz default now()
);

create table competition_matches (
  id             uuid primary key default uuid_generate_v4(),
  competition_id uuid not null references competitions(id) on delete cascade,
  team_a         text not null,
  team_b         text not null,
  venue          text,
  scheduled_at   timestamptz,
  status         match_status not null default 'scheduled'
);

create table match_results (
  id           uuid primary key default uuid_generate_v4(),
  match_id     uuid not null references competition_matches(id) on delete cascade unique,
  winner_team  text not null,
  score_a      int not null default 0,
  score_b      int not null default 0,
  recorded_by  uuid references users(id),
  recorded_at  timestamptz default now()
);

create table team_registrations (
  id             uuid primary key default uuid_generate_v4(),
  competition_id uuid not null references competitions(id) on delete cascade,
  school_name    text not null,
  team_name      text not null,
  payment_status payment_status not null default 'unpaid',
  confirmed      boolean not null default false,
  registered_by  uuid references users(id),
  created_at     timestamptz default now()
);

create table day_of_checklists (
  id         uuid primary key default uuid_generate_v4(),
  scope_type scope_type not null,
  scope_id   text not null,
  title      text not null,
  items      jsonb not null default '[]',
  updated_by uuid references users(id),
  updated_at timestamptz default now()
);

create table volunteers (
  id                       uuid primary key default uuid_generate_v4(),
  name                     text not null,
  assigned_to_scope_type   scope_type not null,
  assigned_to_scope_id     text not null,
  role_description         text,
  confirmed                boolean not null default false,
  created_at               timestamptz default now()
);

create table meeting_notes (
  id         uuid primary key default uuid_generate_v4(),
  title      text not null,
  body       text not null,
  scope_type scope_type not null,
  scope_id   text not null,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

create table content_calendar_posts (
  id           uuid primary key default uuid_generate_v4(),
  platform     post_platform not null,
  title        text not null,
  caption      text,
  scheduled_at timestamptz,
  status       post_status not null default 'draft',
  created_by   uuid references users(id),
  created_at   timestamptz default now()
);

create table merch_items (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  price       numeric(10,2) not null,
  stock_total int not null default 0,
  stock_sold  int not null default 0,
  updated_at  timestamptz default now()
);

create table ticket_sales (
  id            uuid primary key default uuid_generate_v4(),
  event_id      uuid not null references events(id) on delete cascade,
  ticket_type   text not null,
  price         numeric(10,2) not null,
  quantity_sold int not null default 0,
  revenue       numeric(12,2) generated always as (price * quantity_sold) stored,
  updated_at    timestamptz default now()
);

create table activity_log (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references users(id),
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  scope_type  scope_type,
  scope_id    text,
  created_at  timestamptz default now()
);
