import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import type { PromptLogEntry } from "@/agents/_shared/types";
import { recordPromptLog } from "./traces";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "prompts.jsonl");

export function isLangflowConfigured() {
  return Boolean(
    process.env.LANGFLOW_URL?.trim() && process.env.LANGFLOW_API_KEY?.trim(),
  );
}

export async function logAgentTurn(entry: PromptLogEntry) {
  recordPromptLog(entry);
  await Promise.allSettled([writeLocalLog(entry), forwardToLangflow(entry)]);
}

async function writeLocalLog(entry: PromptLogEntry) {
  await mkdir(LOG_DIR, { recursive: true });
  await appendFile(LOG_FILE, `${JSON.stringify(entry)}\n`, "utf8");
}

async function forwardToLangflow(entry: PromptLogEntry) {
  const base = process.env.LANGFLOW_URL?.replace(/\/$/, "");
  const apiKey = process.env.LANGFLOW_API_KEY;
  const flowId = process.env.LANGFLOW_LOGGER_FLOW_ID;

  if (!base || !apiKey || !flowId) return;

  const response = await fetch(`${base}/api/v1/run/${flowId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      input_value: JSON.stringify(entry, null, 2),
      input_type: "chat",
      output_type: "chat",
      session_id: entry.sessionId,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Langflow log failed (${response.status}): ${detail}`);
  }
}

export async function langflowHealth() {
  const base = process.env.LANGFLOW_URL?.replace(/\/$/, "");
  if (!base) {
    return { configured: false, reachable: false };
  }

  try {
    const response = await fetch(`${base}/health`, { method: "GET" });
    return { configured: isLangflowConfigured(), reachable: response.ok };
  } catch {
    return { configured: isLangflowConfigured(), reachable: false };
  }
}
