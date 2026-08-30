-- Tie a stored student profile to a Supabase Auth user.
-- Access stays server-only via the service role.

alter table public.student_sessions
  add column if not exists user_id uuid unique references auth.users (id) on delete cascade;

create index if not exists student_sessions_user_id_idx
  on public.student_sessions (user_id);
