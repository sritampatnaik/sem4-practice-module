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
    stepNumber?: number;
    toolCallId?: string;
    toolName: string;
    input: unknown;
    dynamic?: boolean;
  }>;
  toolResults: Array<{
    stepNumber?: number;
    toolCallId?: string;
    toolName: string;
    output: unknown;
    dynamic?: boolean;
  }>;
  steps: Array<{
    stepNumber: number;
    text: string;
    toolCalls: Array<{
      toolCallId?: string;
      toolName: string;
      input: unknown;
      dynamic?: boolean;
    }>;
    toolResults: Array<{
      toolCallId?: string;
      toolName: string;
      output: unknown;
      dynamic?: boolean;
    }>;
  }>;
};

type ToolCallPart = {
  toolCallId?: string;
  toolName: string;
  input: unknown;
  dynamic?: boolean;
};

type ToolResultPart = {
  toolCallId?: string;
  toolName: string;
  output: unknown;
  dynamic?: boolean;
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

function asToolCallPart(value: unknown): ToolCallPart | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.toolName !== "string") return null;

  return {
    toolCallId: typeof raw.toolCallId === "string" ? raw.toolCallId : undefined,
    toolName: raw.toolName,
    input: raw.input,
    dynamic: raw.dynamic === true ? true : undefined,
  };
}

function asToolResultPart(value: unknown): ToolResultPart | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.toolName !== "string") return null;

  return {
    toolCallId: typeof raw.toolCallId === "string" ? raw.toolCallId : undefined,
    toolName: raw.toolName,
    output: raw.output,
    dynamic: raw.dynamic === true ? true : undefined,
  };
}

function dedupeByKey<T>(values: T[], keyOf: (value: T) => string) {
  const seen = new Set<string>();
  const results: T[] = [];

  for (const value of values) {
    const key = keyOf(value);
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(value);
  }

  return results;
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
  const steps = result.steps.map((step, index) => ({
    stepNumber: index,
    text: step.text,
    toolCalls: step.toolCalls
      .map((toolCall) => asToolCallPart(toolCall))
      .filter((toolCall): toolCall is ToolCallPart => toolCall !== null),
    toolResults: step.toolResults
      .map((toolResult) => asToolResultPart(toolResult))
      .filter((toolResult): toolResult is ToolResultPart => toolResult !== null),
  }));
  const toolCallsFromSteps = steps.flatMap((step) =>
    step.toolCalls.map((toolCall) => ({
      stepNumber: step.stepNumber,
      ...toolCall,
    })),
  );
  const toolResultsFromSteps = steps.flatMap((step) =>
    step.toolResults.map((toolResult) => ({
      stepNumber: step.stepNumber,
      ...toolResult,
    })),
  );
  const topLevelToolCalls = result.toolCalls
    .map((toolCall) => asToolCallPart(toolCall))
    .filter((toolCall): toolCall is ToolCallPart => toolCall !== null)
    .map((toolCall) => ({
      stepNumber: undefined,
      ...toolCall,
    }));
  const topLevelToolResults = result.toolResults
    .map((toolResult) => asToolResultPart(toolResult))
    .filter((toolResult): toolResult is ToolResultPart => toolResult !== null)
    .map((toolResult) => ({
      stepNumber: undefined,
      ...toolResult,
    }));

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
    toolCalls: dedupeByKey(
      [...toolCallsFromSteps, ...topLevelToolCalls],
      (toolCall) =>
        `${toolCall.toolCallId ?? ""}:${toolCall.stepNumber ?? ""}:${toolCall.toolName}:${JSON.stringify(toolCall.input)}`,
    ),
    toolResults: dedupeByKey(
      [...toolResultsFromSteps, ...topLevelToolResults],
      (toolResult) =>
        `${toolResult.toolCallId ?? ""}:${toolResult.stepNumber ?? ""}:${toolResult.toolName}:${JSON.stringify(toolResult.output)}`,
    ),
    steps,
  };
}
