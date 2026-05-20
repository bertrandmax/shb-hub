-- supabase/migrations/003_seed_divisions.sql

-- Seed events
insert into events (id, name, status) values
  ('e0000000-0000-0000-0000-000000000001', 'shb_cup', 'upcoming'),
  ('e0000000-0000-0000-0000-000000000002', '5k_run',  'upcoming');

-- Cross-assigned divisions (shared between both events)
insert into divisions (name, type, parent_event_id) values
  ('Registration',   'shared', null),
  ('Security',       'shared', null),
  ('Medic',          'shared', null),
  ('Equipment',      'shared', null),
  ('Documentation',  'shared', null);

-- 5K Run-only divisions
insert into divisions (name, type, parent_event_id) values
  ('Track Pacer',    'run', 'e0000000-0000-0000-0000-000000000002'),
  ('Water Station',  'run', 'e0000000-0000-0000-0000-000000000002');

-- Central Support divisions
insert into divisions (name, type, parent_event_id) values
  ('Medic (Central)',       'central_support', null),
  ('Catering/Consumption',  'central_support', null);

-- Marketing divisions
insert into divisions (name, type, parent_event_id) values
  ('Content Creation', 'marketing', null),
  ('Merch & Ticketing','marketing', null),
  ('Design',           'marketing', null);
