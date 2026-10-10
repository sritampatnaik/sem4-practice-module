const BLOCKED = [
  /ignore (all|any|previous) instructions/i,
  /reveal (your )?(system|hidden) prompt/i,
];

const PRIVATE_DATA_REQUESTS = [
  /\b(?:another|other|someone else(?:'s)?|their)\s+student'?s?\s+(?:nric|name|full name|email|phone|address|parent details?)\b/i,
  /\b(?:show|tell|give|reveal|share)\b[\s\S]{0,80}\b(?:another|other|someone else(?:'s)?|their)\s+(?:student'?s?\s+)?(?:nric|name|full name|email|phone|address|parent details?)\b/i,
  /\b(?:show|tell|give|reveal|share)\b[\s\S]{0,80}\b(?:another|other|someone else(?:'s)?|their)\s+(?:student'?s?\s+)?(?:mcq|quiz|flashcard|testing)?\s*(?:score|scores|results|progress|history|records?)\b/i,
  /\b(?:another|other|someone else(?:'s)?|their)\s+(?:mcq|quiz|flashcard|testing)?\s*(?:score|scores|results|progress|history|records?)\b/i,
];

export function sanitizeStudentMessage(text: string) {
  const clipped = text.trim().slice(0, 8000);
  const flagged = BLOCKED.some((pattern) => pattern.test(clipped));
  const privacyFlagged = PRIVATE_DATA_REQUESTS.some((pattern) => pattern.test(clipped));
  return {
    text: clipped,
    flagged,
    privacyFlagged,
    privacyReason: privacyFlagged ? "student-data-request" : undefined,
  };
}
