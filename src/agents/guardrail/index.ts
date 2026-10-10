import { classifyStudentTurn, heuristicClassify } from "./classify";
import { notifyAdults } from "./notify";
import {
  lookupParentEmail,
  markAlertNotified,
  storeGuardrailAlert,
} from "./store";
import { GUARDRAIL_PROMPT_VERSION } from "./prompts";
import type {
  GuardrailAlert,
  GuardrailClassification,
  MonitorStudentTurnInput,
} from "./types";

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

async function persistAlert(
  input: MonitorStudentTurnInput,
  classification: GuardrailClassification & { promptVersion?: string },
  studentText: string,
) {
  const alert = await storeGuardrailAlert({
    sessionId: input.sessionId,
    userId: input.userId ?? null,
    studentName: input.studentName || "Student",
    studentEmail: input.studentEmail ?? null,
    snippet: classification.snippet || studentText,
    reason: classification.reason,
    categories: classification.categories,
    severity: classification.severity,
    promptVersion: classification.promptVersion ?? GUARDRAIL_PROMPT_VERSION,
  });

  if (!alert.notifiedEmail) {
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
  }

  return alert;
}

export async function monitorStudentTurn(
  input: MonitorStudentTurnInput,
): Promise<{ hit: boolean; alert?: GuardrailAlert }> {
  const studentText = input.studentText.trim();
  if (!studentText) return { hit: false };

  const heuristic = heuristicClassify(studentText);
  let alert: GuardrailAlert | undefined;
  if (heuristic.hit) {
    alert = await persistAlert(
      input,
      { ...heuristic, promptVersion: GUARDRAIL_PROMPT_VERSION },
      studentText,
    );
  }

  const classification = await classifyStudentTurn({
    studentName: input.studentName,
    studentText,
    assistantText: input.assistantText,
    recentStudentTurns: input.recentStudentTurns,
  });

  if (classification.hit) {
    alert = await persistAlert(input, classification, studentText);
  }

  return { hit: Boolean(alert), alert };
}
