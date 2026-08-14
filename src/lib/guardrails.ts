const BLOCKED = [
  /ignore (all|any|previous) instructions/i,
  /reveal (your )?(system|hidden) prompt/i,
];

export function sanitizeStudentMessage(text: string) {
  const clipped = text.trim().slice(0, 8000);
  const flagged = BLOCKED.some((pattern) => pattern.test(clipped));
  return { text: clipped, flagged };
}
