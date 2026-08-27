import type { EvalSuite, EvalSuiteId } from "../types";
import { chemistryItems } from "./chemistry";
import { conciergeItems } from "./concierge";
import { mathItems } from "./math";
import { physicsItems } from "./physics";
import { routingItems } from "./routing";
import { testingItems } from "./testing";

export const EVAL_SUITES: EvalSuite[] = [
  {
    id: "routing",
    name: "Router",
    description: "Gold labels for routeStudentTurn. Kinematics is physics; quizzes go to Testing.",
    kind: "routing",
    items: routingItems,
  },
  {
    id: "concierge",
    name: "Concierge",
    description: "Greet or clarify. Do not teach a lesson or emit a quiz widget.",
    kind: "concierge",
    items: conciergeItems,
  },
  {
    id: "math",
    name: "Math",
    description: "Working, equationSolver, syllabus search, stay in-band.",
    kind: "teaching",
    items: mathItems,
  },
  {
    id: "physics",
    name: "Physics",
    description: "Principle → formula → SI units. formulaLookup / unitConverter.",
    kind: "teaching",
    items: physicsItems,
  },
  {
    id: "chemistry",
    name: "Chemistry",
    description: "periodicTable and reactionBalancer before quoting data.",
    kind: "teaching",
    items: chemistryItems,
  },
  {
    id: "testing",
    name: "Testing",
    description: "Exactly one widget tool, original items, refuse live papers.",
    kind: "testing",
    items: testingItems,
  },
];

export function listEvalSuites() {
  return EVAL_SUITES.map((suite) => ({
    id: suite.id,
    name: suite.name,
    description: suite.description,
    kind: suite.kind,
    itemCount: suite.items.length,
    items: suite.items.map((item) => ({
      id: item.id,
      title: item.title,
      prompt: item.prompt,
      goldReply: item.scaffold.goldReply,
      contract: item.scaffold.contract,
      requiredTools: item.scaffold.requiredTools ?? [],
      targetAgent: item.targetAgent,
    })),
  }));
}

export function getEvalSuite(id: EvalSuiteId) {
  const suite = EVAL_SUITES.find((entry) => entry.id === id);
  if (!suite) {
    throw new Error(`Unknown eval suite '${id}'.`);
  }
  return suite;
}

export function allEvalItems() {
  return EVAL_SUITES.flatMap((suite) => suite.items);
}
