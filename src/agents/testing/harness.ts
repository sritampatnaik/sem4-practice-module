import { sanitizeStudentMessage } from "@/lib/guardrails";
import type {
  AgentRuntimeContext,
  ChatMemoryItem,
  StudentProfile,
  Subject,
} from "../_shared/types";
import { createTestingAgent } from "./index";
import {
  findTestingFixtureScenario,
  TESTING_FIXTURE_SCENARIOS,
  type TestingFixtureScenario,
} from "./fixtures/scenarios";
import {
  TESTING_FIXTURE_PROFILES,
  type TestingFixtureProfileId,
} from "./fixtures/profiles";

export type TestingHarnessRequest = {
  prompt?: string;
  scenarioId?: string;
  profileId?: TestingFixtureProfileId;
  profile?: StudentProfile;
  recentChats?: ChatMemoryItem[];
  sessionId?: string;
  subject?: Subject;
};

export type TestingHarnessResult = {
  scenarioId?: string;
  sessionId: string;
  prompt: string;
  sanitizedPrompt: string;
  flagged: boolean;
  profile: StudentProfile;
  recentChats: ChatMemoryItem[];
  subject?: Subject;
  text: string;
  finishReason: string;
  toolCalls: Array<{
    toolName: string;
    input: unknown;
  }>;
  toolResults: Array<{
    toolName: string;
    output: unknown;
  }>;
  steps: Array<{
    stepNumber: number;
    text: string;
    toolCalls: string[];
  }>;
};

function defaultSessionId() {
  return `testing-harness-${Date.now().toString(36)}`;
}

function resolveScenario(request: TestingHarnessRequest): TestingFixtureScenario | undefined {
  if (!request.scenarioId) return undefined;
  return findTestingFixtureScenario(request.scenarioId);
}

function buildContext(request: TestingHarnessRequest, scenario?: TestingFixtureScenario): AgentRuntimeContext {
  const profile =
    request.profile ??
    TESTING_FIXTURE_PROFILES[request.profileId ?? scenario?.profileId ?? "secondaryOLevel"];

  return {
    sessionId: request.sessionId ?? defaultSessionId(),
    profile,
    recentChats: request.recentChats ?? scenario?.recentChats ?? [],
  };
}

export function listTestingHarnessFixtures() {
  return {
    profiles: TESTING_FIXTURE_PROFILES,
    scenarios: TESTING_FIXTURE_SCENARIOS,
  };
}

export async function runTestingHarness(request: TestingHarnessRequest): Promise<TestingHarnessResult> {
  const scenario = resolveScenario(request);
  if (request.scenarioId && !scenario) {
    throw new Error(`Unknown testing scenario '${request.scenarioId}'.`);
  }

  const prompt = request.prompt ?? scenario?.prompt;
  if (!prompt) {
    throw new Error("A prompt or scenarioId is required.");
  }

  const ctx = buildContext(request, scenario);
  const { text: sanitizedPrompt, flagged } = sanitizeStudentMessage(prompt);
  const agent = createTestingAgent(ctx);
  const result = await agent.generate({ prompt: sanitizedPrompt });

  return {
    scenarioId: scenario?.id,
    sessionId: ctx.sessionId,
    prompt,
    sanitizedPrompt,
    flagged,
    profile: ctx.profile,
    recentChats: ctx.recentChats,
    subject: request.subject ?? scenario?.subject,
    text: result.text,
    finishReason: String(result.finishReason),
    toolCalls: result.toolCalls.map((toolCall) => ({
      toolName: toolCall.toolName,
      input: toolCall.input,
    })),
    toolResults: result.toolResults.map((toolResult) => ({
      toolName: toolResult.toolName,
      output: toolResult.output,
    })),
    steps: result.steps.map((step, index) => ({
      stepNumber: index,
      text: step.text,
      toolCalls: step.toolCalls.map((toolCall) => toolCall.toolName),
    })),
  };
}
