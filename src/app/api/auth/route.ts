import {
  clearAuthCookie,
  getAccessToken,
  getAuthUser,
  parseEmailPassword,
  signInStudent,
  signUpStudent,
} from "@/lib/auth";
import { createConversation, listConversations } from "@/lib/conversations";
import { getStudentByUserId } from "@/lib/students";
import { isSupabaseConfigured } from "@/lib/supabase";

async function payloadForUser(user: { id: string; email: string }) {
  const accessToken = await getAccessToken();
  const profile = await getStudentByUserId(user.id, accessToken);
  let conversations = await listConversations(user.id, accessToken);
  if (!conversations.length) {
    conversations = [await createConversation(user.id, { accessToken })];
  }
  return {
    configured: isSupabaseConfigured(),
    user,
    profile,
    sessionId: conversations[0]?.id ?? null,
    conversations,
  };
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return Response.json({
      configured: isSupabaseConfigured(),
      user: null,
      profile: null,
      sessionId: null,
      conversations: [],
    });
  }
  return Response.json(await payloadForUser(user));
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
  return Response.json(await payloadForUser(result.user));
}

export async function DELETE() {
  await clearAuthCookie();
  return Response.json({ ok: true });
}
