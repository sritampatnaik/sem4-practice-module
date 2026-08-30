const ENV =
  /\\begin\{(align\*?|equation\*?|gather\*?|multline\*?|eqnarray\*?)\}[\s\S]*?\\end\{\1\}/g;

function wrapEnvironments(text: string) {
  return text.replace(ENV, (block, _name, offset: number, source: string) => {
    const before = source.slice(Math.max(0, offset - 2), offset);
    if (before === "$$") return block;
    return `\n$$\n${block}\n$$\n`;
  });
}

function normalizeChunk(text: string) {
  let next = text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_match, body: string) => `\n$$\n${body.trim()}\n$$\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_match, body: string) => `$${body.trim()}$`);
  next = wrapEnvironments(next);
  const displayCount = next.split("$$").length - 1;
  if (displayCount % 2 === 1) next += "\n$$";
  return next;
}

/** Turn LaTeX delimiters into `$` / `$$` so remark-math + KaTeX can typeset them. */
export function normalizeMathText(text: string) {
  return text
    .split(/(```[\s\S]*?```)/)
    .map((part, index) => (index % 2 === 1 ? part : normalizeChunk(part)))
    .join("");
}
