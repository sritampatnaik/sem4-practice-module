import type { AgentId } from "@/agents/_shared/types";

export const AGENT_COPY: Record<
  AgentId,
  { label: string; subject: string; tone: string; tint: string; swatch: string }
> = {
  orchestration: {
    label: "Desk",
    subject: "Routing",
    tone: "var(--bui-ink-2)",
    tint: "var(--bui-field)",
    swatch: "#64748b",
  },
  math: {
    label: "Math",
    subject: "Mathematics",
    tone: "var(--math)",
    tint: "var(--bui-orange-tint)",
    swatch: "#e08a3c",
  },
  physics: {
    label: "Physics",
    subject: "Physics",
    tone: "var(--physics)",
    tint: "var(--bui-accent-tint)",
    swatch: "#2f6fec",
  },
  chemistry: {
    label: "Chemistry",
    subject: "Chemistry",
    tone: "var(--chem)",
    tint: "var(--bui-green-tint)",
    swatch: "#1f7a5f",
  },
  testing: {
    label: "Testing",
    subject: "Assessment",
    tone: "var(--test)",
    tint: "var(--bui-orange-tint)",
    swatch: "#c2782e",
  },
};
