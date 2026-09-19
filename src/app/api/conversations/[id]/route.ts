import { getAccessToken, getAuthUser } from "@/lib/auth";
import { listConversationMessages } from "@/lib/conversations";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }
  const { id } = await context.params;
  const accessToken = await getAccessToken();
  const messages = await listConversationMessages(id, user.id, accessToken);
  return Response.json({ messages });
}
