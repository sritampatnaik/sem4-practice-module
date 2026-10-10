import { z } from "zod";
import { getAccessToken, getAuthUser } from "@/lib/auth";
import {
  listTestingAttemptSummaries,
  recordTestingAttempt,
  verifyConversationOwnership,
} from "@/lib/testing-progress";

const nonEmptyText = z.string().trim().min(1);

const recordAttemptSchema = z.object({
  conversationId: nonEmptyText,
  subject: z.enum(["math", "physics", "chemistry"]),
  mode: z.literal("mcq"),
  title: nonEmptyText,
  score: z.number().int().min(0),
  totalQuestions: z.number().int().min(1),
  topics: z.array(nonEmptyText).min(1).max(8),
}).superRefine((body, ctx) => {
  if (body.score > body.totalQuestions) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "score must not be greater than totalQuestions.",
      path: ["score"],
    });
  }
});

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }

  const accessToken = await getAccessToken();
  const url = new URL(req.url);
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit") ?? "6") || 6, 1),
    12,
  );

  const result = await listTestingAttemptSummaries(user.id, accessToken, limit);
  if (!result.ok) {
    const status = result.reason === "unconfigured" ? 503 : 500;
    return Response.json({ error: result.reason }, { status });
  }

  return Response.json({ summaries: result.summaries });
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }

  try {
    const rawBody = await req.json();
    const body = recordAttemptSchema.parse(rawBody);
    const accessToken = await getAccessToken();
    const ownsConversation = await verifyConversationOwnership(
      body.conversationId,
      user.id,
      accessToken,
    );

    if (!ownsConversation) {
      return Response.json(
        { error: "That conversation does not belong to the signed-in student." },
        { status: 403 },
      );
    }

    const result = await recordTestingAttempt(
      {
        userId: user.id,
        conversationId: body.conversationId,
        subject: body.subject,
        mode: body.mode,
        title: body.title,
        score: body.score,
        totalQuestions: body.totalQuestions,
        topics: body.topics,
      },
      accessToken,
    );

    if (!result.ok) {
      const status = result.reason === "unconfigured" ? 503 : 500;
      return Response.json({ error: result.reason }, { status });
    }

    return Response.json({ saved: true, attempt: result.attempt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not record the testing attempt.";
    return Response.json({ error: message }, { status: 400 });
  }
}
