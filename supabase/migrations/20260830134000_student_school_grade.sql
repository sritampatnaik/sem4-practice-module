-- Store the specific school year (P1–P6, Sec 1–5, JC 1–2).
-- grade_level stays the routing band: primary / secondary / jc.

alter table public.student_sessions
  add column if not exists grade text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'student_sessions_grade_check'
  ) then
    alter table public.student_sessions
      add constraint student_sessions_grade_check
      check (
        grade is null or grade = any (
          array[
            'p1','p2','p3','p4','p5','p6',
            'sec1','sec2','sec3','sec4','sec5',
            'jc1','jc2'
          ]::text[]
        )
      );
  end if;
end $$;
