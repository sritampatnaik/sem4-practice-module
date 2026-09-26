-- Guardrail alerts for parents/tutors. Students never have table grants.
-- Access stays server-only via service_role. Do not expose this to authenticated.

alter table public.student_sessions
  add column if not exists parent_email text;

create table if not exists public.guardrail_alerts (
  id text primary key,
  session_id text not null,
  user_id uuid,
  student_name text not null default 'Student',
  student_email text,
  snippet text not null,
  reason text not null,
  categories text[] not null default '{}',
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  prompt_version text not null,
  notified_email text,
  notified_at timestamptz,
  acknowledged_at timestamptz,
  acknowledged_by text,
  created_at timestamptz not null default now()
);

create index if not exists guardrail_alerts_created_at_idx
  on public.guardrail_alerts (created_at desc);

create index if not exists guardrail_alerts_session_idx
  on public.guardrail_alerts (session_id, created_at desc);

alter table public.guardrail_alerts enable row level security;

revoke all on table public.guardrail_alerts from anon, authenticated, public;
grant select, insert, update, delete on table public.guardrail_alerts to service_role;
