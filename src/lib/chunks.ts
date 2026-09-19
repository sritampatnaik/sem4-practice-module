export function chunkText(text: string, size = 500, overlap = 80): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= size) return [clean];
  const step = Math.max(size - overlap, 1);
  const chunks: string[] = [];
  for (let start = 0; start < clean.length; start += step) {
    const piece = clean.slice(start, start + size).trim();
    if (piece) chunks.push(piece);
    if (start + size >= clean.length) break;
  }
  return chunks;
}

export function titleFromText(text: string, max = 48) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return "New chat";
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max - 1).trim()}…`;
}
