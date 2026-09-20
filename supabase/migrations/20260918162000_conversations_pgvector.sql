-- Conversations, full chat history, and pgvector chunks in the same project.
-- Access stays server-only via service_role; authenticated policies cover user JWTs.

create extension if not exists vector with schema extensions;

create table public.conversations (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_user_updated_idx
  on public.conversations (user_id, updated_at desc);

alter table public.chat_memory drop constraint if exists chat_memory_session_id_fkey;

alter table public.chat_memory
  add constraint chat_memory_session_id_fkey
  foreign key (session_id) references public.conversations (id) on delete cascade;

create table public.chat_chunks (
  id bigint generated always as identity primary key,
  conversation_id text not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  chunk_index int not null default 0,
  content text not null,
  embedding extensions.vector(1536),
  created_at timestamptz not null default now()
);

create index chat_chunks_user_idx on public.chat_chunks (user_id, created_at desc);

create index chat_chunks_embedding_idx
  on public.chat_chunks
  using hnsw (embedding vector_cosine_ops);

create or replace function public.match_chat_chunks (
  query_embedding extensions.vector(1536),
  match_count int,
  filter_user_id uuid
)
returns table (
  id bigint,
  conversation_id text,
  content text,
  similarity float
)
language sql
stable
as $$
  select
    chat_chunks.id,
    chat_chunks.conversation_id,
    chat_chunks.content,
    1 - (chat_chunks.embedding <=> query_embedding) as similarity
  from public.chat_chunks
  where chat_chunks.user_id = filter_user_id
    and chat_chunks.embedding is not null
  order by chat_chunks.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

alter table public.conversations enable row level security;
alter table public.chat_chunks enable row level security;

revoke all on table public.conversations from anon, authenticated, public;
revoke all on table public.chat_chunks from anon, authenticated, public;

grant select, insert, update, delete on table public.conversations to service_role;
grant select, insert, update, delete on table public.chat_chunks to service_role;
grant usage, select on sequence public.chat_chunks_id_seq to service_role;

grant select, insert, update, delete on table public.conversations to authenticated;
grant select, insert, update, delete on table public.chat_chunks to authenticated;
grant select, insert, update, delete on table public.student_sessions to authenticated;
grant select, insert, update, delete on table public.chat_memory to authenticated;
grant usage, select on sequence public.chat_memory_id_seq to authenticated;
grant usage, select on sequence public.chat_chunks_id_seq to authenticated;
grant execute on function public.match_chat_chunks(extensions.vector, integer, uuid) to service_role, authenticated;

create policy conversations_own on public.conversations
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy chat_memory_own on public.chat_memory
  for all to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = chat_memory.session_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = chat_memory.session_id and c.user_id = auth.uid()
    )
  );

create policy chat_chunks_own on public.chat_chunks
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy student_sessions_own on public.student_sessions
  for all to authenticated
  using (user_id = auth.uid() or id = auth.uid()::text)
  with check (user_id = auth.uid() or id = auth.uid()::text);

-- Practice module has no SMTP. Confirm emails so password login works immediately.
create or replace function public.auto_confirm_auth_user()
returns trigger
language plpgsql
security definer
set search_path = auth
as $$
begin
  update auth.users
    set email_confirmed_at = coalesce(email_confirmed_at, now())
    where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_confirm on auth.users;
create trigger on_auth_user_created_confirm
  after insert on auth.users
  for each row execute function public.auto_confirm_auth_user();

revoke all on function public.auto_confirm_auth_user() from public, anon, authenticated;
