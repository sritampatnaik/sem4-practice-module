import { clearAuthCookie, getAuthUser, parseEmailPassword, signInStudent, signUpStudent } from "@/lib/auth";
import { getStudentByUserId } from "@/lib/students";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return Response.json({
      configured: isSupabaseConfigured(),
      user: null,
      profile: null,
      sessionId: null,
    });
  }
  const profile = await getStudentByUserId(user.id);
  return Response.json({
    configured: isSupabaseConfigured(),
    user,
    profile,
    sessionId: user.id,
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { action?: unknown };
  const parsed = parseEmailPassword(body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const action = body.action === "signup" ? "signup" : "login";
  const result =
    action === "signup"
      ? await signUpStudent(parsed.email, parsed.password)
      : await signInStudent(parsed.email, parsed.password);
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  const user = result.user;
  const profile = await getStudentByUserId(user.id);
  return Response.json({
    configured: isSupabaseConfigured(),
    user,
    profile,
    sessionId: user.id,
  });
}

export async function DELETE() {
  await clearAuthCookie();
  return Response.json({ ok: true });
}
