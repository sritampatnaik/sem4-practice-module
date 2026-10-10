import assert from "node:assert/strict";
import test from "node:test";
import type { AgentId, AgentRuntimeContext } from "./_shared/types";
import { createAgent } from "./index";

const context: AgentRuntimeContext = {
  sessionId: "agent-factory-test",
  profile: {
    name: "Alex",
    gradeLevel: "secondary",
    diagnostic: {},
    notes: [],
  },
  recentChats: [],
};

test("agent factory creates every student-facing specialist", () => {
  const previousKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key-not-used-for-network-calls";

  try {
    const ids: AgentId[] = [
      "orchestration",
      "math",
      "physics",
      "chemistry",
      "testing",
    ];

    for (const id of ids) {
      const agent = createAgent(id, context);
      assert.ok(agent, `${id} agent should be created`);
    }
  } finally {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});
