import type { AgentId } from "@/agents/_shared/types";

export const AGENT_COPY: Record<
  AgentId,
  { label: string; subject: string; tone: string }
> = {
  orchestration: {
    label: "Desk",
    subject: "Routing",
    tone: "var(--ink)",
  },
  math: {
    label: "Math",
    subject: "Mathematics",
    tone: "var(--math)",
  },
  physics: {
    label: "Physics",
    subject: "Physics",
    tone: "var(--physics)",
  },
  chemistry: {
    label: "Chemistry",
    subject: "Chemistry",
    tone: "var(--chem)",
  },
  testing: {
    label: "Testing",
    subject: "Assessment",
    tone: "var(--test)",
  },
};
