import type { AgentId, AgentRuntimeContext } from "./_shared/types";
import { createChemistryAgent } from "./chemistry";
import { createMathAgent } from "./math";
import { createOrchestrationAgent } from "./orchestration";
import { createPhysicsAgent } from "./physics";
import { createTestingAgent } from "./testing";

export function createAgent(agentId: AgentId, ctx: AgentRuntimeContext) {
  switch (agentId) {
    case "math":
      return createMathAgent(ctx);
    case "physics":
      return createPhysicsAgent(ctx);
    case "chemistry":
      return createChemistryAgent(ctx);
    case "testing":
      return createTestingAgent(ctx);
    default:
      return createOrchestrationAgent(ctx);
  }
}

export { createOrchestrationAgent } from "./orchestration";
export { createMathAgent } from "./math";
export { createPhysicsAgent } from "./physics";
export { createChemistryAgent } from "./chemistry";
export { createTestingAgent } from "./testing";
