-- METS persistence: student sessions, short-term chat memory, eval catalog and runs.
-- Access is server-only via the service role. RLS is on with no anon/authenticated policies.

create table public.student_sessions (
  id text primary key,
  name text not null default 'Student',
  grade_level text not null check (grade_level in ('primary', 'secondary', 'jc')),
  diagnostic jsonb not null default '{}'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chat_memory (
  id bigint generated always as identity primary key,
  session_id text not null references public.student_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  text text not null,
  agent text,
  at timestamptz not null default now()
);

create index chat_memory_session_at_idx on public.chat_memory (session_id, at desc);

create table public.eval_runs (
  id text primary key,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  model text not null,
  suite_ids text[] not null default '{}',
  suites jsonb not null default '[]'::jsonb,
  totals jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index eval_runs_finished_at_idx on public.eval_runs (finished_at desc);

create table public.eval_catalog_edits (
  id text primary key default 'default',
  updates jsonb not null default '{}'::jsonb,
  extras jsonb not null default '[]'::jsonb,
  deleted text[] not null default '{}',
  updated_at timestamptz not null default now()
);

insert into public.eval_catalog_edits (id) values ('default');

alter table public.student_sessions enable row level security;
alter table public.chat_memory enable row level security;
alter table public.eval_runs enable row level security;
alter table public.eval_catalog_edits enable row level security;

revoke all on table public.student_sessions from anon, authenticated, public;
revoke all on table public.chat_memory from anon, authenticated, public;
revoke all on table public.eval_runs from anon, authenticated, public;
revoke all on table public.eval_catalog_edits from anon, authenticated, public;

grant select, insert, update, delete on table public.student_sessions to service_role;
grant select, insert, update, delete on table public.chat_memory to service_role;
grant select, insert, update, delete on table public.eval_runs to service_role;
grant select, insert, update, delete on table public.eval_catalog_edits to service_role;
grant usage, select on sequence public.chat_memory_id_seq to service_role;
