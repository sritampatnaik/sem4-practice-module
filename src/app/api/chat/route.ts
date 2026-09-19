import {
  createAgentUIStream,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { createAgent } from "@/agents";
import { monitorStudentTurn } from "@/agents/guardrail";
import { routeStudentTurn } from "@/agents/orchestration/router";
import { ROUTING_PROMPT_ID } from "@/agents/orchestration/prompts";
import {
  DEFAULT_PROFILE,
  type AgentId,
  type StudentProfile,
} from "@/agents/_shared/types";
import { getAccessToken, getAuthUser } from "@/lib/auth";
import { sanitizeStudentMessage } from "@/lib/guardrails";
import { retrieveChatContext } from "@/lib/embeddings";
import { logAgentTurn } from "@/lib/langflow";
import { getModelId } from "@/lib/llm";
import { getRecentChats, previewText, rememberTurn } from "@/lib/memory";
import { newLogId, recordRouting } from "@/lib/traces";
import type { MetsUIMessage } from "@/lib/ui-types";

export const maxDuration = 60;

function lastUserText(messages: MetsUIMessage[]) {
  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  if (!lastUser) return "";
  return lastUser.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

function assistantText(message: MetsUIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

const PROMPT_ID: Record<AgentId, string> = {
  orchestration: "orchestration.system",
  math: "math.system",
  physics: "physics.system",
  chemistry: "chemistry.system",
  testing: "testing.system",
};

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

  const body = (await req.json()) as {
    messages: MetsUIMessage[];
    profile?: StudentProfile;
    sessionId?: string;
  };

  const messages = body.messages ?? [];
  const profile = body.profile ?? DEFAULT_PROFILE;
  const user = await getAuthUser();
  const accessToken = await getAccessToken();
  const sessionId = body.sessionId ?? user?.id ?? "anon";
  const query = lastUserText(messages);
  const { text, flagged } = sanitizeStudentMessage(query);
  const retrievedContext = user
    ? await retrieveChatContext({
        userId: user.id,
        query: text,
        accessToken,
      })
    : [];

  const ctx = {
    sessionId,
    profile,
    recentChats: await getRecentChats(sessionId, accessToken),
    retrievedContext,
  };

  const routedAt = Date.now();
  const routing = await routeStudentTurn({ ctx, messages });
  recordRouting(sessionId, routing);

  await logAgentTurn({
    id: newLogId(),
    sessionId,
    agent: "orchestration",
    promptId: ROUTING_PROMPT_ID,
    promptVersion: routing.promptVersion,
    kind: "routing",
    input: text,
    output: JSON.stringify(routing),
    model: getModelId(),
    latencyMs: Date.now() - routedAt,
    routing,
    at: new Date().toISOString(),
  });

  await rememberTurn(
    sessionId,
    {
      role: "user",
      text: previewText(text, 8000),
      at: new Date().toISOString(),
    },
    profile,
    user?.id,
    accessToken,
  );

  const agent = createAgent(routing.agent, ctx);
  const started = Date.now();
  const monitor = monitorStudentTurn({
    sessionId,
    userId: user?.id,
    studentEmail: user?.email,
    studentName: profile.name,
    studentText: text,
    assistantText: "",
    recentStudentTurns: ctx.recentChats
      .filter((item) => item.role === "user")
      .map((item) => item.text),
  }).catch(() => {
    /* Never fail the student stream because the silent monitor broke. */
  });

  const stream = createUIMessageStream<MetsUIMessage>({
    originalMessages: messages,
    execute: async ({ writer }) => {
      writer.write({ type: "data-routing", data: routing });
      if (flagged) {
        writer.write({
          type: "data-routing",
          data: {
            ...routing,
            rationale: `${routing.rationale} Input was flagged by the prompt-injection guardrail.`,
          },
        });
      }

      const agentStream = await createAgentUIStream({
        // Heterogeneous specialist agents do not share a single tool map.
        agent: agent as never,
        uiMessages: messages,
      });
      writer.merge(agentStream as never);
    },
    onFinish: async ({ responseMessage }) => {
      const output = assistantText(responseMessage);
      await rememberTurn(
        sessionId,
        {
          role: "assistant",
          text: previewText(output || `${routing.agent} response`, 8000),
          agent: routing.agent,
          at: new Date().toISOString(),
        },
        profile,
        user?.id,
        accessToken,
      );
      await logAgentTurn({
        id: newLogId(),
        sessionId,
        agent: routing.agent,
        promptId: PROMPT_ID[routing.agent],
        promptVersion: routing.promptVersion,
        kind: "generation",
        input: text,
        output: previewText(output, 4000),
        model: getModelId(),
        latencyMs: Date.now() - started,
        routing,
        at: new Date().toISOString(),
      });
      try {
        await monitor;
      } catch {
        /* Never fail the student stream because the silent monitor broke. */
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
