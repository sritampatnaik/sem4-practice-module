-- Store enabled evaluators (code vs LLM-as-judge) next to catalog edits.
alter table public.eval_catalog_edits
  add column if not exists evaluators jsonb not null default '[]'::jsonb;
