import { parseEmailList } from "./access";
import type { GuardrailAlert } from "./types";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function notifyRecipients(parentEmail?: string | null) {
  const emails = new Set<string>();
  if (parentEmail && isValidEmail(parentEmail)) {
    emails.add(parentEmail.trim().toLowerCase());
  }
  for (const email of parseEmailList(process.env.METS_PARENT_NOTIFY_EMAIL)) {
    emails.add(email);
  }
  for (const email of parseEmailList(process.env.METS_ADMIN_EMAILS)) {
    emails.add(email);
  }
  return [...emails];
}

function alertEmailBody(alert: GuardrailAlert) {
  const categories = alert.categories.join(", ");
  return [
    "METS recorded a safety alert on a student–tutor chat. The student cannot see this message.",
    "",
    `Student: ${alert.studentName}${alert.studentEmail ? ` <${alert.studentEmail}>` : ""}`,
    `When: ${alert.createdAt}`,
    `Categories: ${categories || "unspecified"}`,
    `Severity: ${alert.severity}`,
    `Why: ${alert.reason}`,
    `Snippet: ${alert.snippet}`,
    "",
    "Please check in with the student. If there is any risk of self-harm, stay with them and contact a trusted adult or emergency services.",
    "In Singapore, Samaritans of Singapore (SOS) is 1767, 24 hours.",
    "",
    "This monitor escalates. It does not give the student instructions.",
  ].join("\n");
}

export async function notifyAdults(options: {
  alert: GuardrailAlert;
  parentEmail?: string | null;
}): Promise<{ emailed: string[] }> {
  const recipients = notifyRecipients(options.parentEmail);
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  if (!recipients.length || !apiKey || !from) {
    return { emailed: [] };
  }

  const emailed: string[] = [];
  const subject = `METS alert (${options.alert.severity}): ${options.alert.studentName}`;
  const text = alertEmailBody(options.alert);

  for (const to of recipients) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          text,
        }),
      });
      if (response.ok) emailed.push(to);
    } catch {
      /* Keep storing the in-app alert even if mail fails. */
    }
  }

  return { emailed };
}
