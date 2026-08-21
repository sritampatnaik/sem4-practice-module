import { z } from "zod";
import {
  listTestingHarnessFixtures,
  runTestingHarness,
} from "@/agents/testing/harness";

const profileSchema = z.object({
  name: z.string(),
  gradeLevel: z.enum(["primary", "secondary", "jc"]),
  diagnostic: z
    .object({
      math: z.enum(["emerging", "developing", "secure"]).optional(),
      physics: z.enum(["emerging", "developing", "secure"]).optional(),
      chemistry: z.enum(["emerging", "developing", "secure"]).optional(),
    })
    .default({}),
  notes: z.array(z.string()).default([]),
});

const recentChatSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string(),
  agent: z.enum(["orchestration", "math", "physics", "chemistry", "testing"]).optional(),
  at: z.string(),
});

const harnessRequestSchema = z.object({
  prompt: z.string().optional(),
  scenarioId: z.string().optional(),
  profileId: z.enum(["primaryStarter", "secondaryOLevel", "jcH2"]).optional(),
  profile: profileSchema.optional(),
  recentChats: z.array(recentChatSchema).optional(),
  sessionId: z.string().optional(),
  subject: z.enum(["math", "physics", "chemistry"]).optional(),
});

export async function GET() {
  return Response.json(listTestingHarnessFixtures());
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      {
        error:
          "OPENAI_API_KEY is not set. Add it to .env.local and restart the dev server.",
      },
      { status: 500 },
    );
  }

  try {
    const rawBody = await req.json();
    const body = harnessRequestSchema.parse(rawBody);
    const result = await runTestingHarness(body);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown testing harness error.";
    return Response.json({ error: message }, { status: 400 });
  }
}
