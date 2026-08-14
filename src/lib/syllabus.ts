import { readFile } from "node:fs/promises";
import path from "node:path";
import type { GradeLevel, Subject } from "@/agents/_shared/types";

type Chunk = {
  id: string;
  subject: Subject;
  gradeLevel: GradeLevel;
  title: string;
  content: string;
};

let cache: Chunk[] | null = null;

function scoreChunk(chunk: Chunk, query: string, gradeLevel: GradeLevel) {
  const haystack = `${chunk.title} ${chunk.content}`.toLowerCase();
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((term) => term.length > 2);

  let score = terms.reduce(
    (sum, term) => sum + (haystack.includes(term) ? 1 : 0),
    0,
  );

  if (chunk.gradeLevel === gradeLevel) score += 2;
  return score;
}

async function loadChunks(): Promise<Chunk[]> {
  if (cache) return cache;

  const dir = path.join(process.cwd(), "data/syllabus");
  const subjects: Subject[] = ["math", "physics", "chemistry"];
  const chunks: Chunk[] = [];

  for (const subject of subjects) {
    const raw = await readFile(path.join(dir, `${subject}.md`), "utf8");
    const sections = raw.split(/^## /m).slice(1);

    for (const section of sections) {
      const [heading, ...rest] = section.split("\n");
      const title = heading.trim();
      const gradeLevel: GradeLevel = title.toLowerCase().includes("primary")
        ? "primary"
        : title.toLowerCase().includes("jc") ||
            title.toLowerCase().includes("a-level")
          ? "jc"
          : "secondary";

      chunks.push({
        id: `${subject}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        subject,
        gradeLevel,
        title,
        content: rest.join("\n").trim(),
      });
    }
  }

  cache = chunks;
  return chunks;
}

export async function searchSyllabus(options: {
  subject: Subject;
  query: string;
  gradeLevel: GradeLevel;
  limit?: number;
}) {
  const chunks = await loadChunks();
  const ranked = chunks
    .filter((chunk) => chunk.subject === options.subject)
    .map((chunk) => ({
      chunk,
      score: scoreChunk(chunk, options.query, options.gradeLevel),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit ?? 4)
    .map((row) => ({
      id: row.chunk.id,
      title: row.chunk.title,
      gradeLevel: row.chunk.gradeLevel,
      excerpt: row.chunk.content.slice(0, 900),
      score: row.score,
    }));

  if (ranked.length) return ranked;

  return chunks
    .filter(
      (chunk) =>
        chunk.subject === options.subject &&
        chunk.gradeLevel === options.gradeLevel,
    )
    .slice(0, 2)
    .map((chunk) => ({
      id: chunk.id,
      title: chunk.title,
      gradeLevel: chunk.gradeLevel,
      excerpt: chunk.content.slice(0, 900),
      score: 0,
    }));
}

export async function searchWebStub(query: string) {
  const url = new URL("https://en.wikipedia.org/w/rest.php/v1/search/title");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "3");

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "METS-NUS-ISS/0.1 (educational prototype)" },
    });
    if (!response.ok) {
      return {
        source: "wikipedia",
        note: "Web search is a stub until a dedicated search API is added.",
        results: [],
      };
    }

    const payload = (await response.json()) as {
      pages?: Array<{ title: string; description?: string; excerpt?: string }>;
    };

    return {
      source: "wikipedia",
      note: "Supplementary public reference only. Prefer syllabus excerpts for MOE alignment.",
      results: (payload.pages ?? []).map((page) => ({
        title: page.title,
        description: page.description ?? page.excerpt ?? "",
      })),
    };
  } catch {
    return {
      source: "wikipedia",
      note: "Web search unavailable in this environment.",
      results: [],
    };
  }
}
