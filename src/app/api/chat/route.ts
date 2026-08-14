import {
  createAgentUIStream,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { createAgent } from "@/agents";
import { routeStudentTurn } from "@/agents/orchestration/router";
import { ROUTING_PROMPT_ID } from "@/agents/orchestration/prompts";
import {
  DEFAULT_PROFILE,
  type AgentId,
  type StudentProfile,
} from "@/agents/_shared/types";
import { sanitizeStudentMessage } from "@/lib/guardrails";
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
  const sessionId = body.sessionId ?? "anon";
  const query = lastUserText(messages);
  const { text, flagged } = sanitizeStudentMessage(query);

  const ctx = {
    sessionId,
    profile,
    recentChats: getRecentChats(sessionId),
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

  rememberTurn(sessionId, {
    role: "user",
    text: previewText(text),
    at: new Date().toISOString(),
  });

  const agent = createAgent(routing.agent, ctx);
  const started = Date.now();

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
      rememberTurn(sessionId, {
        role: "assistant",
        text: previewText(output || `${routing.agent} response`),
        agent: routing.agent,
        at: new Date().toISOString(),
      });
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
    },
  });

  return createUIMessageStreamResponse({ stream });
}
