import type { AgentId } from "@/agents/_shared/types";

export const AGENT_COPY: Record<
  AgentId,
  { label: string; subject: string; tone: string; tint: string }
> = {
  orchestration: {
    label: "Desk",
    subject: "Routing",
    tone: "var(--bui-ink-2)",
    tint: "var(--bui-field)",
  },
  math: {
    label: "Math",
    subject: "Mathematics",
    tone: "var(--math)",
    tint: "var(--bui-orange-tint)",
  },
  physics: {
    label: "Physics",
    subject: "Physics",
    tone: "var(--physics)",
    tint: "var(--bui-accent-tint)",
  },
  chemistry: {
    label: "Chemistry",
    subject: "Chemistry",
    tone: "var(--chem)",
    tint: "var(--bui-green-tint)",
  },
  testing: {
    label: "Testing",
    subject: "Assessment",
    tone: "var(--test)",
    tint: "var(--bui-orange-tint)",
  },
};
