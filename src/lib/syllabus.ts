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

export function resetSyllabusCache() {
  cache = null;
}

export function gradeFromHeading(title: string): GradeLevel {
  const heading = title.toLowerCase();
  if (
    heading.includes("primary") ||
    /\bp[1-6]\b/.test(heading) ||
    heading.includes("p1-p6") ||
    heading.includes("p1–p6")
  ) {
    return "primary";
  }
  if (
    heading.includes("a-level") ||
    heading.includes("a level") ||
    /\bjc\b/.test(heading) ||
    heading.includes("junior college") ||
    /\bh[123]\b/.test(heading)
  ) {
    return "jc";
  }
  return "secondary";
}

const QUERY_STOPWORDS = new Set([
  "and",
  "chemistry",
  "for",
  "from",
  "gce",
  "into",
  "learning",
  "level",
  "math",
  "mathematics",
  "maths",
  "moe",
  "official",
  "outcome",
  "outcomes",
  "physics",
  "primary",
  "science",
  "seab",
  "secondary",
  "syllabus",
  "that",
  "the",
  "this",
  "topic",
  "topics",
  "with",
]);

function termsFromQuery(query: string) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((term) => term.length > 2 && !QUERY_STOPWORDS.has(term));
}

function termHits(haystack: string, term: string) {
  return haystack.includes(term) ? 1 : 0;
}

export function scoreChunk(chunk: Chunk, query: string, gradeLevel: GradeLevel) {
  const titleHay = chunk.title.toLowerCase();
  const contentHay = chunk.content.toLowerCase();
  const terms = termsFromQuery(query);

  let termScore = 0;
  for (const term of terms) {
    if (termHits(titleHay, term)) termScore += 3;
    else if (termHits(contentHay, term)) termScore += 1;
  }

  const gradeBonus = chunk.gradeLevel === gradeLevel ? 5 : 0;
  return { termScore, score: termScore + gradeBonus };
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
      const content = rest.join("\n").trim();
      const gradeLevel = gradeFromHeading(title);

      chunks.push({
        id: `${subject}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`.replace(
          /-+$/g,
          "",
        ),
        subject,
        gradeLevel,
        title,
        content,
      });
    }
  }

  cache = chunks;
  return chunks;
}

function toHit(chunk: Chunk, score: number) {
  return {
    id: chunk.id,
    title: chunk.title,
    gradeLevel: chunk.gradeLevel,
    excerpt: chunk.content.slice(0, 1400),
    score,
  };
}

export async function searchSyllabus(options: {
  subject: Subject;
  query: string;
  gradeLevel: GradeLevel;
  limit?: number;
}) {
  const chunks = await loadChunks();
  const limit = options.limit ?? 4;
  const subjectChunks = chunks.filter((chunk) => chunk.subject === options.subject);

  const ranked = subjectChunks
    .map((chunk) => {
      const { termScore, score } = scoreChunk(chunk, options.query, options.gradeLevel);
      const titleHay = chunk.title.toLowerCase();
      const titleHit = termsFromQuery(options.query).some((term) => titleHay.includes(term));
      return { chunk, termScore, score, titleHit };
    })
    .filter((row) => row.termScore > 0);

  const sameGradeTitle = ranked
    .filter((row) => row.chunk.gradeLevel === options.gradeLevel && row.titleHit)
    .sort((a, b) => b.score - a.score);
  const otherGrade = ranked
    .filter((row) => row.chunk.gradeLevel !== options.gradeLevel)
    .sort((a, b) => Number(b.titleHit) - Number(a.titleHit) || b.termScore - a.termScore);
  const sameGradeBody = ranked
    .filter((row) => row.chunk.gradeLevel === options.gradeLevel && !row.titleHit)
    .sort((a, b) => b.score - a.score);

  // In-band title hits first so gradeLevel lands on the right outcome family.
  // Other bands next so "is Maclaurin in O-Level?" still retrieves the A-Level home.
  const ordered = [...sameGradeTitle, ...otherGrade, ...sameGradeBody].slice(0, limit);

  if (ordered.length) {
    return ordered.map((row) => toHit(row.chunk, row.score));
  }

  return subjectChunks
    .filter((chunk) => chunk.gradeLevel === options.gradeLevel)
    .slice(0, 2)
    .map((chunk) => toHit(chunk, 0));
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
