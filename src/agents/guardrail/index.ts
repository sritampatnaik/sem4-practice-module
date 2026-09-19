import { classifyStudentTurn } from "./classify";
import { notifyAdults } from "./notify";
import {
  lookupParentEmail,
  markAlertNotified,
  storeGuardrailAlert,
} from "./store";
import { GUARDRAIL_PROMPT_VERSION } from "./prompts";
import type { GuardrailAlert, MonitorStudentTurnInput } from "./types";

export { GUARDRAIL_PROMPT_ID, GUARDRAIL_PROMPT_VERSION } from "./prompts";
export { heuristicClassify, classifyStudentTurn } from "./classify";
export {
  listGuardrailAlerts,
  acknowledgeGuardrailAlert,
  storeGuardrailAlert,
  resetGuardrailMemoryForTests,
} from "./store";
export { getAdminAccess, isAdminUser } from "./access";
export type { GuardrailAlert, GuardrailCategory, GuardrailClassification } from "./types";

export const guardrailMeta = {
  id: "guardrail" as const,
  studentFacing: false,
  promptVersion: GUARDRAIL_PROMPT_VERSION,
};

export async function monitorStudentTurn(
  input: MonitorStudentTurnInput,
): Promise<{ hit: boolean; alert?: GuardrailAlert }> {
  const studentText = input.studentText.trim();
  if (!studentText) return { hit: false };

  const classification = await classifyStudentTurn({
    studentName: input.studentName,
    studentText,
    assistantText: input.assistantText,
    recentStudentTurns: input.recentStudentTurns,
  });

  if (!classification.hit) return { hit: false };

  const alert = await storeGuardrailAlert({
    sessionId: input.sessionId,
    userId: input.userId ?? null,
    studentName: input.studentName || "Student",
    studentEmail: input.studentEmail ?? null,
    snippet: classification.snippet || studentText,
    reason: classification.reason,
    categories: classification.categories,
    severity: classification.severity,
    promptVersion: classification.promptVersion,
  });

  const parentEmail = await lookupParentEmail({
    userId: input.userId,
    sessionId: input.sessionId,
  });
  const { emailed } = await notifyAdults({ alert, parentEmail });
  if (emailed.length) {
    await markAlertNotified(alert.id, emailed.join(", "));
    alert.notifiedEmail = emailed.join(", ");
    alert.notifiedAt = new Date().toISOString();
  }

  return { hit: true, alert };
}
