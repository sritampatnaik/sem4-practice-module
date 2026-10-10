-- Persistent Testing MCQ attempt history for signed-in students.
-- Students can read and write only their own attempts through authenticated JWTs.

create table if not exists public.testing_attempts (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id text not null references public.conversations (id) on delete cascade,
  subject text not null check (subject in ('math', 'physics', 'chemistry')),
  mode text not null check (mode in ('mcq', 'flashcards')),
  topic_key text not null,
  topic_label text not null,
  title text not null,
  score int not null check (score >= 0),
  total_questions int not null check (total_questions > 0),
  topics jsonb not null default '[]'::jsonb,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (score <= total_questions)
);

create index if not exists testing_attempts_user_completed_idx
  on public.testing_attempts (user_id, completed_at desc);

create index if not exists testing_attempts_grouping_idx
  on public.testing_attempts (user_id, subject, mode, topic_key, completed_at desc);

alter table public.testing_attempts enable row level security;

revoke all on table public.testing_attempts from anon, public;
grant select, insert, update, delete on table public.testing_attempts to service_role;
grant select, insert, update, delete on table public.testing_attempts to authenticated;

create policy testing_attempts_own on public.testing_attempts
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
