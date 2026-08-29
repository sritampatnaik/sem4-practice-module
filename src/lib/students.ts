import type { GradeLevel, StudentProfile } from "@/agents/_shared/types";
import { GRADE_LEVELS } from "@/agents/_shared/types";
import { getSupabaseAdmin } from "./supabase";
import type { Json } from "./database.types";

function asProfile(row: {
  name: string;
  grade_level: string;
  diagnostic: Json;
  notes: Json;
}): StudentProfile | null {
  if (!GRADE_LEVELS.includes(row.grade_level as GradeLevel)) return null;
  return {
    name: row.name,
    gradeLevel: row.grade_level as GradeLevel,
    diagnostic:
      row.diagnostic && typeof row.diagnostic === "object" && !Array.isArray(row.diagnostic)
        ? (row.diagnostic as StudentProfile["diagnostic"])
        : {},
    notes: Array.isArray(row.notes)
      ? row.notes.filter((note): note is string => typeof note === "string")
      : [],
  };
}

export async function upsertStudentSession(sessionId: string, profile: StudentProfile) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false as const, reason: "unconfigured" };
  const { error } = await supabase.from("student_sessions").upsert(
    {
      id: sessionId,
      name: profile.name,
      grade_level: profile.gradeLevel,
      diagnostic: profile.diagnostic as Json,
      notes: profile.notes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) return { ok: false as const, reason: error.message };
  return { ok: true as const };
}

export async function getStudentSession(sessionId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("student_sessions")
    .select("name, grade_level, diagnostic, notes")
    .eq("id", sessionId)
    .maybeSingle();
  if (error || !data) return null;
  return asProfile(data);
}

export async function deleteStudentSession(sessionId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase.from("student_sessions").delete().eq("id", sessionId);
}
