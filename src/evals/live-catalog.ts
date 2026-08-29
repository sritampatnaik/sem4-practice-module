import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { AGENT_IDS, GRADE_LEVELS, INTENTS, SUBJECTS } from "@/agents/_shared/types";
import type { AgentId, GradeLevel, Intent, Subject } from "@/agents/_shared/types";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Json } from "@/lib/database.types";
import { EVAL_SUITES } from "./catalog";
import { jcAlex, primaryAlex, secondaryAlex } from "./catalog/profiles";
import { datasetToDraft, looksLikeDatasetJson, parseDatasetJson, toDatasetItem } from "./dataset-item";
import { EVAL_SUITE_IDS } from "./types";
import type {
  CatalogItemDraft,
  EvalItem,
  EvalKind,
  EvalSuite,
  EvalSuiteId,
  GoldRouting,
} from "./types";

export type { CatalogItemDraft };

const LOG_DIR = path.join(process.cwd(), "logs");
const CATALOG_FILE = path.join(LOG_DIR, "eval-catalog.json");

type CatalogEdits = {
  updates: Record<string, CatalogItemDraft>;
  extras: EvalItem[];
  deleted: string[];
};

const emptyEdits = (): CatalogEdits => ({ updates: {}, extras: [], deleted: [] });

let edits = loadEdits();

function profileForGrade(gradeLevel: GradeLevel) {
  if (gradeLevel === "primary") return primaryAlex;
  if (gradeLevel === "jc") return jcAlex;
  return secondaryAlex;
}

function cloneItem(item: EvalItem): EvalItem {
  return structuredClone(item);
}

function toDraft(item: EvalItem): CatalogItemDraft {
  return {
    id: item.id,
    suiteId: item.suiteId,
    kind: item.kind,
    title: item.title,
    prompt: item.prompt,
    goldReply: item.scaffold.goldReply,
    contract: item.scaffold.contract,
    requiredTools: item.scaffold.requiredTools ?? [],
    mustInclude: item.scaffold.mustInclude ?? [],
    mustNotInclude: item.scaffold.mustNotInclude ?? [],
    targetAgent: item.targetAgent,
    gradeLevel: item.profile.gradeLevel,
    routing: item.scaffold.routing,
    profile: item.profile,
    source: item.scaffold.source,
    dataset: toDatasetItem(item),
  };
}

function applyDraft(base: EvalItem | null, draft: CatalogItemDraft): EvalItem {
  const routing =
    draft.kind === "routing" && draft.routing
      ? {
          agent: draft.routing.agent,
          intent: draft.routing.intent,
          subject: draft.routing.subject,
          gradeLevel: draft.routing.gradeLevel,
        }
      : base?.scaffold.routing;
  const goldReply =
    draft.kind === "routing" && routing ? JSON.stringify(routing) : draft.goldReply;
  return {
    id: draft.id,
    suiteId: draft.suiteId,
    kind: draft.kind,
    title: draft.title.trim() || "Untitled eval",
    prompt: draft.prompt,
    profile: draft.profile ?? profileForGrade(draft.gradeLevel),
    targetAgent: draft.targetAgent,
    scaffold: {
      contract: draft.contract,
      goldReply,
      routing,
      mustInclude: draft.mustInclude.map((value) => value.trim()).filter(Boolean),
      mustNotInclude: draft.mustNotInclude.map((value) => value.trim()).filter(Boolean),
      requiredTools: draft.requiredTools.map((value) => value.trim()).filter(Boolean),
      source: draft.source,
    },
  };
}

function loadEdits(): CatalogEdits {
  try {
    if (!existsSync(CATALOG_FILE)) return emptyEdits();
    const parsed = JSON.parse(readFileSync(CATALOG_FILE, "utf8")) as Partial<CatalogEdits>;
    return {
      updates: parsed.updates && typeof parsed.updates === "object" ? parsed.updates : {},
      extras: Array.isArray(parsed.extras) ? parsed.extras.filter(isEvalItem) : [],
      deleted: Array.isArray(parsed.deleted)
        ? parsed.deleted.filter((id): id is string => typeof id === "string")
        : [],
    };
  } catch {
    return emptyEdits();
  }
}

function persistEditsToFile() {
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    writeFileSync(CATALOG_FILE, JSON.stringify(edits, null, 2), "utf8");
  } catch {
    // Local logs are optional; the in-memory list still serves this process.
  }
}

async function persistEdits() {
  persistEditsToFile();
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase.from("eval_catalog_edits").upsert({
    id: "default",
    updates: edits.updates as unknown as Json,
    extras: edits.extras as unknown as Json,
    deleted: edits.deleted,
    updated_at: new Date().toISOString(),
  });
}

async function loadEditsFromSupabase(): Promise<CatalogEdits | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("eval_catalog_edits")
    .select("updates, extras, deleted")
    .eq("id", "default")
    .maybeSingle();
  if (error || !data) return null;
  return {
    updates:
      data.updates && typeof data.updates === "object" && !Array.isArray(data.updates)
        ? (data.updates as CatalogEdits["updates"])
        : {},
    extras: Array.isArray(data.extras) ? data.extras.filter(isEvalItem) : [],
    deleted: Array.isArray(data.deleted) ? data.deleted : [],
  };
}

function isEvalItem(value: unknown): value is EvalItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<EvalItem>;
  return Boolean(
    item.id &&
      item.suiteId &&
      item.kind &&
      item.title &&
      item.prompt &&
      item.scaffold &&
      item.targetAgent,
  );
}

export async function refreshEvalCatalog() {
  const remote = await loadEditsFromSupabase();
  edits = remote ?? loadEdits();
  return listEvalSuites();
}

export function getLiveSuites(): EvalSuite[] {
  const deleted = new Set(edits.deleted);
  return EVAL_SUITES.map((suite) => ({
    ...suite,
    items: [
      ...suite.items
        .filter((item) => !deleted.has(item.id))
        .map((item) => {
          const draft = edits.updates[item.id];
          return draft ? applyDraft(item, draft) : cloneItem(item);
        }),
      ...edits.extras
        .filter((item) => item.suiteId === suite.id && !deleted.has(item.id))
        .map(cloneItem),
    ],
  }));
}

export function listEvalSuites() {
  return getLiveSuites().map((suite) => ({
    id: suite.id,
    name: suite.name,
    description: suite.description,
    kind: suite.kind,
    itemCount: suite.items.length,
    items: suite.items.map(toDraft),
  }));
}

export function getEvalSuite(id: EvalSuiteId) {
  const suite = getLiveSuites().find((entry) => entry.id === id);
  if (!suite) {
    throw new Error(`Unknown eval suite '${id}'.`);
  }
  return suite;
}

export function allEvalItems() {
  return getLiveSuites().flatMap((suite) => suite.items);
}

export async function saveEvalItem(draft: CatalogItemDraft) {
  const suite = EVAL_SUITES.find((entry) => entry.id === draft.suiteId);
  if (!suite) throw new Error(`Unknown eval suite '${draft.suiteId}'.`);
  const existing =
    allEvalItems().find((item) => item.id === draft.id) ??
    EVAL_SUITES.flatMap((entry) => entry.items).find((item) => item.id === draft.id) ??
    null;
  const next = applyDraft(existing, { ...draft, kind: existing?.kind ?? suite.kind });
  const isSeed = EVAL_SUITES.some((entry) => entry.items.some((item) => item.id === next.id));
  const extraIndex = edits.extras.findIndex((item) => item.id === next.id);
  if (isSeed) {
    edits.updates[next.id] = toDraft(next);
  } else if (extraIndex >= 0) {
    edits.extras[extraIndex] = next;
  } else {
    edits.extras.push(next);
  }
  edits.deleted = edits.deleted.filter((id) => id !== next.id);
  await persistEdits();
  return toDraft(next);
}

export async function addEvalItem(suiteId: EvalSuiteId) {
  const suite = EVAL_SUITES.find((entry) => entry.id === suiteId);
  if (!suite) throw new Error(`Unknown eval suite '${suiteId}'.`);
  const id = `${suiteId}-${Date.now().toString(36)}`;
  const routing: GoldRouting | undefined =
    suite.kind === "routing"
      ? { agent: "orchestration", intent: "general", subject: "none", gradeLevel: "secondary" }
      : undefined;
  const item: EvalItem = {
    id,
    suiteId,
    kind: suite.kind,
    title: "New eval",
    prompt: "",
    profile: secondaryAlex,
    targetAgent:
      suite.id === "routing" || suite.id === "concierge"
        ? "orchestration"
        : (suite.id as AgentId),
    scaffold: {
      contract: suite.description,
      goldReply: routing ? JSON.stringify(routing) : "",
      routing,
      mustInclude: [],
      mustNotInclude: [],
      requiredTools: [],
      source: "custom",
    },
  };
  edits.extras.push(item);
  await persistEdits();
  return toDraft(item);
}

export async function removeEvalItem(itemId: string) {
  const existed = allEvalItems().some((item) => item.id === itemId);
  if (!existed) throw new Error(`Unknown eval '${itemId}'.`);
  delete edits.updates[itemId];
  edits.extras = edits.extras.filter((item) => item.id !== itemId);
  if (!edits.deleted.includes(itemId)) edits.deleted.push(itemId);
  await persistEdits();
}

export async function resetEvalCatalog() {
  edits = emptyEdits();
  await persistEdits();
  return listEvalSuites();
}

export function parseCatalogDraft(value: unknown): CatalogItemDraft {
  if (!value || typeof value !== "object") throw new Error("Eval item is required.");
  const raw = value as Record<string, unknown>;
  const datasetSource = looksLikeDatasetJson(raw.item) ? raw.item : raw;
  if (looksLikeDatasetJson(datasetSource)) {
    const dataset = parseDatasetJson(datasetSource);
    const suiteId = (
      typeof raw.suiteId === "string" ? raw.suiteId : dataset.metadata.suite
    ) as EvalSuiteId | undefined;
    if (!suiteId || !EVAL_SUITE_IDS.includes(suiteId)) {
      throw new Error("suiteId is not a known eval suite.");
    }
    const suite = EVAL_SUITES.find((entry) => entry.id === suiteId);
    const id =
      (typeof raw.id === "string" && raw.id.trim()) ||
      dataset.metadata.id ||
      `${suiteId}-${Date.now().toString(36)}`;
    return datasetToDraft(dataset, { id, suiteId, kind: suite?.kind ?? "teaching" });
  }
  if (!EVAL_SUITE_IDS.includes(raw.suiteId as EvalSuiteId)) {
    throw new Error("suiteId is not a known eval suite.");
  }
  if (typeof raw.id !== "string" || !raw.id.trim()) throw new Error("id is required.");
  if (typeof raw.title !== "string") throw new Error("title is required.");
  if (typeof raw.prompt !== "string") throw new Error("prompt is required.");
  if (typeof raw.goldReply !== "string") throw new Error("goldReply is required.");
  if (typeof raw.contract !== "string") throw new Error("contract is required.");
  if (!AGENT_IDS.includes(raw.targetAgent as AgentId)) {
    throw new Error("targetAgent is not a known agent.");
  }
  if (!GRADE_LEVELS.includes(raw.gradeLevel as GradeLevel)) {
    throw new Error("gradeLevel is not a known band.");
  }
  const suite = EVAL_SUITES.find((entry) => entry.id === raw.suiteId);
  const kind = suite?.kind ?? "teaching";
  const routing = parseRouting(raw.routing, kind);
  return {
    id: raw.id.trim(),
    suiteId: raw.suiteId as EvalSuiteId,
    kind,
    title: raw.title,
    prompt: raw.prompt,
    goldReply: raw.goldReply,
    contract: raw.contract,
    requiredTools: asStringList(raw.requiredTools),
    mustInclude: asStringList(raw.mustInclude),
    mustNotInclude: asStringList(raw.mustNotInclude),
    targetAgent: raw.targetAgent as AgentId,
    gradeLevel: raw.gradeLevel as GradeLevel,
    routing,
    source: typeof raw.source === "string" ? raw.source : undefined,
  };
}

function asStringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function parseRouting(value: unknown, kind: EvalKind): GoldRouting | undefined {
  if (kind !== "routing") return undefined;
  if (!value || typeof value !== "object") {
    return { agent: "orchestration", intent: "general", subject: "none", gradeLevel: "secondary" };
  }
  const raw = value as Record<string, unknown>;
  const subject =
    raw.subject === "none" || SUBJECTS.includes(raw.subject as Subject)
      ? (raw.subject as Subject | "none")
      : "none";
  return {
    agent: AGENT_IDS.includes(raw.agent as AgentId)
      ? (raw.agent as AgentId)
      : "orchestration",
    intent: INTENTS.includes(raw.intent as Intent) ? (raw.intent as Intent) : "general",
    subject,
    gradeLevel: GRADE_LEVELS.includes(raw.gradeLevel as GradeLevel)
      ? (raw.gradeLevel as GradeLevel)
      : "secondary",
  };
}
