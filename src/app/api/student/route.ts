import { GRADE_LEVELS, type StudentProfile } from "@/agents/_shared/types";
import {
  deleteStudentSession,
  getStudentSession,
  upsertStudentSession,
} from "@/lib/students";
import { isSupabaseConfigured } from "@/lib/supabase";

function asProfile(value: unknown): StudentProfile | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.name !== "string") return null;
  if (!GRADE_LEVELS.includes(raw.gradeLevel as StudentProfile["gradeLevel"])) return null;
  return {
    name: raw.name,
    gradeLevel: raw.gradeLevel as StudentProfile["gradeLevel"],
    diagnostic:
      raw.diagnostic && typeof raw.diagnostic === "object" && !Array.isArray(raw.diagnostic)
        ? (raw.diagnostic as StudentProfile["diagnostic"])
        : {},
    notes: Array.isArray(raw.notes)
      ? raw.notes.filter((note): note is string => typeof note === "string")
      : [],
  };
}

export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("sessionId");
  if (!sessionId) {
    return Response.json({ error: "sessionId is required." }, { status: 400 });
  }
  const profile = await getStudentSession(sessionId);
  return Response.json({
    configured: isSupabaseConfigured(),
    profile,
  });
}

export async function PUT(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    sessionId?: unknown;
    profile?: unknown;
  };
  if (typeof body.sessionId !== "string" || !body.sessionId) {
    return Response.json({ error: "sessionId is required." }, { status: 400 });
  }
  const profile = asProfile(body.profile);
  if (!profile) {
    return Response.json({ error: "A valid student profile is required." }, { status: 400 });
  }
  const result = await upsertStudentSession(body.sessionId, profile);
  if (!result.ok && result.reason !== "unconfigured") {
    return Response.json({ error: result.reason }, { status: 500 });
  }
  return Response.json({ configured: isSupabaseConfigured(), profile });
}

export async function DELETE(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("sessionId");
  if (!sessionId) {
    return Response.json({ error: "sessionId is required." }, { status: 400 });
  }
  await deleteStudentSession(sessionId);
  return Response.json({ ok: true });
}
