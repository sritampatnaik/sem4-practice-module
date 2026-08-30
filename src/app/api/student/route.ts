import {
  GRADE_LEVELS,
  bandForGrade,
  isSchoolGrade,
  type StudentProfile,
} from "@/agents/_shared/types";
import { getAuthUser } from "@/lib/auth";
import { getStudentByUserId, upsertStudentSession } from "@/lib/students";
import { isSupabaseConfigured } from "@/lib/supabase";

function asProfile(value: unknown): StudentProfile | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.name !== "string") return null;
  const grade = isSchoolGrade(raw.grade) ? raw.grade : undefined;
  const gradeLevel = grade
    ? bandForGrade(grade)
    : (raw.gradeLevel as StudentProfile["gradeLevel"]);
  if (!GRADE_LEVELS.includes(gradeLevel)) return null;
  return {
    name: raw.name,
    gradeLevel,
    grade,
    diagnostic:
      raw.diagnostic && typeof raw.diagnostic === "object" && !Array.isArray(raw.diagnostic)
        ? (raw.diagnostic as StudentProfile["diagnostic"])
        : {},
    notes: Array.isArray(raw.notes)
      ? raw.notes.filter((note): note is string => typeof note === "string")
      : [],
  };
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }
  const profile = await getStudentByUserId(user.id);
  return Response.json({
    configured: isSupabaseConfigured(),
    user,
    profile,
    sessionId: user.id,
  });
}

export async function PUT(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { profile?: unknown };
  const profile = asProfile(body.profile);
  if (!profile) {
    return Response.json({ error: "A valid student profile is required." }, { status: 400 });
  }
  const result = await upsertStudentSession(user.id, profile, user.id);
  if (!result.ok && result.reason !== "unconfigured") {
    return Response.json({ error: result.reason }, { status: 500 });
  }
  return Response.json({
    configured: isSupabaseConfigured(),
    user,
    profile,
    sessionId: user.id,
  });
}
