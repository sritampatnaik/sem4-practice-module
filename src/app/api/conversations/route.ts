import { getAccessToken, getAuthUser } from "@/lib/auth";
import { createConversation, listConversations } from "@/lib/conversations";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }
  const accessToken = await getAccessToken();
  const conversations = await listConversations(user.id, accessToken);
  return Response.json({
    configured: isSupabaseConfigured(),
    conversations,
  });
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { title?: unknown };
  const title = typeof body.title === "string" ? body.title : undefined;
  const accessToken = await getAccessToken();
  const conversation = await createConversation(user.id, { title, accessToken });
  return Response.json({ conversation });
}
