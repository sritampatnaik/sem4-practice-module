import { searchSyllabus } from "@/lib/syllabus";
import type { GradeLevel, Subject } from "../_shared/types";
import { extractAssessmentTopics } from "./assessment-planner";

type SubjectSourceInput = {
  request: string;
  gradeLevel: GradeLevel;
  topics?: string[];
  requestedCount?: number;
};

type SourceChunk = {
  id: string;
  title: string;
  gradeLevel: GradeLevel;
  excerpt: string;
  score: number;
};

type AssessmentSourceBase = {
  gradeLevel: GradeLevel;
  request: string;
  sourceQuery: string;
  topics: string[];
  requestedCount?: number;
  supported: boolean;
  supportReason: string;
  sourceChunks: SourceChunk[];
  learningOutcomes: string[];
  keyConcepts: string[];
  formulaHints: string[];
  misconceptionSeeds: string[];
  questionAngles: string[];
  suggestedVisual?: string;
};

export type PhysicsAssessmentSource = AssessmentSourceBase & {
  subject: "physics";
};

export type MathAssessmentSource = AssessmentSourceBase & {
  subject: "math";
};

export type ChemistryAssessmentSource = AssessmentSourceBase & {
  subject: "chemistry";
};

export type AssessmentSourceToolName =
  | "getPhysicsAssessmentSource"
  | "getMathAssessmentSource"
  | "getChemistryAssessmentSource";

const sentenceSplitPattern = /(?<=[.!?])\s+/;

function uniqueNonEmpty(values: string[], limit: number) {
  const seen = new Set<string>();
  const results: string[] = [];

  for (const value of values) {
    const cleaned = value.replace(/\s+/g, " ").trim();
    const normalised = cleaned.toLowerCase();
    if (!cleaned || seen.has(normalised)) continue;
    seen.add(normalised);
    results.push(cleaned);
    if (results.length >= limit) break;
  }

  return results;
}

function truncateAtBoundary(value: string, limit: number) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit).replace(/[ ,;:-]+$/g, "")}...`;
}

function resolveTopics(request: string, explicitTopics?: string[]) {
  return uniqueNonEmpty(
    [...(explicitTopics ?? []), ...extractAssessmentTopics(request)],
    4,
  );
}

function buildSourceQuery(request: string, topics: string[]) {
  if (topics.length) return topics.join(", ");
  return request.replace(/\s+/g, " ").trim();
}

function excerptSentences(excerpt: string) {
  return excerpt
    .split(sentenceSplitPattern)
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function excerptLines(excerpt: string) {
  return excerpt
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function topicTerms(query: string, topics: string[]) {
  return uniqueNonEmpty(
    [...topics, ...query.split(/[^a-zA-Z0-9+]+/)]
      .map((term) => term.toLowerCase())
      .filter((term) => term.length > 2),
    16,
  );
}

function lineMatchesTerms(line: string, terms: string[]) {
  const lower = line.toLowerCase();
  return terms.some((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(lower);
  });
}

function sameGradeChunks(chunks: SourceChunk[], gradeLevel: GradeLevel) {
  const matched = chunks.filter((chunk) => chunk.gradeLevel === gradeLevel);
  return matched.length ? matched : chunks;
}

function extractKeyConcepts(chunks: SourceChunk[]) {
  const candidates = chunks.flatMap((chunk) => {
    const sentences = excerptSentences(chunk.excerpt).slice(0, 3);
    if (sentences.length) return sentences;

    return excerptLines(chunk.excerpt).slice(0, 3);
  });

  return uniqueNonEmpty(
    candidates.map((line) => truncateAtBoundary(line, 160)),
    6,
  );
}

function extractTopicKeyConcepts(
  chunks: SourceChunk[],
  query: string,
  topics: string[],
  gradeLevel: GradeLevel,
) {
  const terms = topicTerms(query, topics);
  const lines = sameGradeChunks(chunks, gradeLevel).flatMap((chunk) =>
    excerptLines(chunk.excerpt),
  );
  const matching = lines.filter((line) => lineMatchesTerms(line, terms));
  const selected = matching.length ? matching : lines;

  return uniqueNonEmpty(
    selected.map((line) => truncateAtBoundary(line, 160)),
    6,
  );
}

function extractLearningOutcomes(
  chunks: SourceChunk[],
  query: string,
  topics: string[],
  supported: boolean,
  gradeLevel: GradeLevel,
) {
  if (!supported) return [];

  const terms = topicTerms(query, topics);
  const bullets = sameGradeChunks(chunks, gradeLevel).flatMap((chunk) =>
    excerptLines(chunk.excerpt),
  );
  const matching = bullets.filter((line) => lineMatchesTerms(line, terms));
  const selected = matching.length ? matching : bullets;

  return uniqueNonEmpty(
    selected.map((line) => truncateAtBoundary(line, 180)),
    6,
  );
}

function extractMatchingHints(
  chunks: SourceChunk[],
  pattern: RegExp,
  supported: boolean,
  terms: string[] = [],
) {
  if (!supported) return [];

  const candidates = chunks.flatMap((chunk) =>
    excerptLines(chunk.excerpt).filter((line) => pattern.test(line)),
  );
  const matching = terms.length
    ? candidates.filter((line) => lineMatchesTerms(line, terms))
    : candidates;
  const selected = matching.length ? matching : candidates;

  return uniqueNonEmpty(
    selected.map((line) => truncateAtBoundary(line, 120)),
    4,
  );
}

async function loadSubjectSource(subject: Subject, input: SubjectSourceInput) {
  const topics = resolveTopics(input.request, input.topics);
  const sourceQuery = buildSourceQuery(input.request, topics);
  const sourceChunks = await searchSyllabus({
    subject,
    query: sourceQuery,
    gradeLevel: input.gradeLevel,
  });
  const supported = hasSupportedMatch(sourceChunks, sourceQuery, input.gradeLevel);

  return { topics, sourceQuery, sourceChunks, supported };
}

function hasSupportedMatch(
  chunks: SourceChunk[],
  query: string,
  gradeLevel: GradeLevel,
) {
  const supportStopwords = new Set([
    "the",
    "and",
    "for",
    "with",
    "from",
    "this",
    "that",
    "are",
    "was",
    "not",
    "use",
    "than",
    "then",
    "also",
    "level",
    "school",
    "quiz",
    "test",
    "give",
    "make",
    "about",
    "math",
    "maths",
    "mathematics",
    "physics",
    "chemistry",
  ]);
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((term) => term.length > 2 && !supportStopwords.has(term));
  if (!terms.length) return false;

  return chunks.some((chunk) => {
    if (chunk.gradeLevel !== gradeLevel) return false;
    const haystack = `${chunk.title} ${chunk.excerpt}`.toLowerCase();
    const matches = terms.filter((term) => haystack.includes(term)).length;
    const minimumMatches = Math.min(terms.length, terms.length > 1 ? 2 : 1);
    return matches >= minimumMatches;
  });
}

function extractPhysicsFormulaHints(chunks: SourceChunk[]) {
  const candidates = chunks.flatMap((chunk) =>
    chunk.excerpt
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) =>
          /=|\/s\^?2|m\/s|newton|joule|watt|pascal|ohm|suvat|acceleration|velocity/i.test(
            line,
          ),
      ),
  );

  return uniqueNonEmpty(
    candidates.map((line) => truncateAtBoundary(line, 120)),
    4,
  );
}

function inferPhysicsMisconceptionSeeds(query: string, concepts: string[]) {
  const haystack = `${query} ${concepts.join(" ")}`.toLowerCase();
  const seeds = [
    "mixing up variables when substituting into a formula",
    "dropping or misreading units in the final answer",
  ];

  if (/\bvelocity-time\b|\bdistance-time\b|\bgraph\b/.test(haystack)) {
    seeds.push("confusing graph gradient with area under the graph");
  }
  if (/\bforce\b|\bacceleration\b|\bvelocity\b|\bmotion\b/.test(haystack)) {
    seeds.push("ignoring direction when the quantity is a vector");
  }
  if (/\bcurrent\b|\bvoltage\b|\bresistance\b|\bcircuit\b|\belectric/.test(haystack)) {
    seeds.push("mixing up series and parallel relationships");
  }
  if (/\bwave\b|\blight\b|\blens\b|\breflection\b|\brefraction\b/.test(haystack)) {
    seeds.push("mixing up wavelength, frequency, and wave speed");
  }
  if (/\benergy\b|\bpower\b|\bpressure\b|\bdensity\b/.test(haystack)) {
    seeds.push("choosing a related but wrong formula for the physical quantity asked");
  }

  return uniqueNonEmpty(seeds, 5);
}

function inferPhysicsQuestionAngles(query: string, concepts: string[]) {
  const haystack = `${query} ${concepts.join(" ")}`.toLowerCase();
  const angles = [
    "definition or concept check",
    "single-step application of a principle or formula",
    "common-misconception distractor check",
  ];

  if (/\bgraph\b|\bvelocity-time\b|\bdistance-time\b/.test(haystack)) {
    angles.push("graph interpretation");
  }
  if (/\bcalculate\b|\bfind\b|\bdetermine\b|\bforce\b|\bspeed\b|\benergy\b/.test(haystack)) {
    angles.push("numerical calculation with units");
  }
  if (/\bcompare\b|\bdifference\b|\bexplain\b/.test(haystack)) {
    angles.push("qualitative comparison or explanation");
  }

  return uniqueNonEmpty(angles, 5);
}

function inferPhysicsSuggestedVisual(query: string, concepts: string[]) {
  const haystack = `${query} ${concepts.join(" ")}`.toLowerCase();

  if (/\bvelocity-time\b|\bdistance-time\b|\bgraph\b/.test(haystack)) {
    return "A simple labelled motion graph highlighting gradient or area may help.";
  }
  if (/\bcircuit\b|\bcurrent\b|\bvoltage\b|\bresistance\b/.test(haystack)) {
    return "A simple labelled circuit sketch may help.";
  }
  if (/\blens\b|\breflection\b|\brefraction\b|\blight\b/.test(haystack)) {
    return "A simple labelled ray diagram may help.";
  }
  if (/\bforce\b|\bmoment\b|\bpressure\b/.test(haystack)) {
    return "A simple labelled force diagram may help.";
  }

  return undefined;
}

function inferMathMisconceptionSeeds(query: string, concepts: string[]) {
  const haystack = `${query} ${concepts.join(" ")}`.toLowerCase();
  const seeds = [
    "slipping a sign or combining unlike terms",
    "using a related but wrong method for the quantity asked",
  ];

  if (/\bfraction\b|\bdecimal\b|\bpercent|\bratio\b/.test(haystack)) {
    seeds.push("confusing fraction, decimal, percentage, or ratio forms");
  }
  if (/\balgebra\b|\bequation\b|\bquadratic\b|\bsimultaneous\b|\binequal/.test(haystack)) {
    seeds.push("performing an operation on only one side of an equation");
  }
  if (/\bdifferentiat|\bintegrat|\bcalculus\b/.test(haystack)) {
    seeds.push("mixing up differentiation and integration");
  }
  if (/\btrigonometr|\bsine\b|\bcosine\b|\btangent\b|\bpythagoras\b/.test(haystack)) {
    seeds.push("choosing the wrong trigonometric ratio or triangle side");
  }
  if (/\bprobability\b|\bstatistic|\bmean\b|\bmedian\b|\bmode\b/.test(haystack)) {
    seeds.push("confusing mean, median, and mode, or adding probabilities incorrectly");
  }
  if (/\bvector\b/.test(haystack)) {
    seeds.push("treating a vector quantity as a scalar");
  }

  return uniqueNonEmpty(seeds, 5);
}

function inferMathQuestionAngles(query: string, concepts: string[]) {
  const haystack = `${query} ${concepts.join(" ")}`.toLowerCase();
  const angles = [
    "definition or concept check",
    "single-step procedure or formula application",
    "common-misconception distractor check",
  ];

  if (/\bgraph\b|\bsketch\b|\bcoordinate\b/.test(haystack)) {
    angles.push("graph or diagram interpretation");
  }
  if (/\bcalculate\b|\bfind\b|\bsolve\b|\bword problem\b|\bheuristic/.test(haystack)) {
    angles.push("multi-step calculation or word problem");
  }
  if (/\bcompare\b|\bexplain\b|\bwhich\b/.test(haystack)) {
    angles.push("qualitative comparison or explanation");
  }

  return uniqueNonEmpty(angles, 5);
}

function inferMathSuggestedVisual(query: string, concepts: string[]) {
  const haystack = `${query} ${concepts.join(" ")}`.toLowerCase();

  if (/\bgraph\b|\bfunction\b|\bcoordinate\b|\bsketch\b/.test(haystack)) {
    return "A simple labelled graph may help.";
  }
  if (/\bangle\b|\btriangle\b|\bcircle\b|\bgeometry\b|\bnet\b/.test(haystack)) {
    return "A simple labelled geometric diagram may help.";
  }
  if (/\bfraction\b|\bratio\b|\bmodel\b|\bbar\b/.test(haystack)) {
    return "A simple bar model or number-line sketch may help.";
  }
  if (/\bvector\b/.test(haystack)) {
    return "A simple labelled vector diagram may help.";
  }

  return undefined;
}

function inferMathFormulaHints(query: string, concepts: string[], fromChunks: string[]) {
  const haystack = `${query} ${concepts.join(" ")}`.toLowerCase();
  const hints = [...fromChunks];

  if (/\bdifferentiat|\bcalculus\b/.test(haystack)) {
    hints.push("Use the power, product, quotient, or chain rule as the question requires.");
  }
  if (/\bintegrat|\barea under\b/.test(haystack)) {
    hints.push("Integration reverses differentiation; include +C only for indefinite integrals.");
  }
  if (/\bquadratic\b/.test(haystack)) {
    hints.push("A quadratic may be solved by factorisation, completing the square, or the quadratic formula.");
  }
  if (/\bpythagoras\b|\btrigonometr/.test(haystack)) {
    hints.push("Match SOH CAH TOA or Pythagoras to the triangle information given.");
  }
  if (/\bindex|\bsurd\b|\blogarithm|\bexponential/.test(haystack)) {
    hints.push("Apply the matching index, surd, or logarithm law before substituting values.");
  }

  return uniqueNonEmpty(hints, 4);
}

function inferChemistryMisconceptionSeeds(query: string, concepts: string[]) {
  const haystack = `${query} ${concepts.join(" ")}`.toLowerCase();
  const seeds = [
    "mixing up closely related Chemistry terms",
    "ignoring state symbols, conditions, or limiting reagents",
  ];

  if (/\bbond|\bionic\b|\bcovalent\b|\bmetallic\b|\bmolecule\b/.test(haystack)) {
    seeds.push("confusing ionic, covalent, and metallic bonding");
  }
  if (/\bmole\b|\bstoichiometr|\bformula\b|\btitration\b/.test(haystack)) {
    seeds.push("mixing up moles, mass, and molar mass");
  }
  if (/\bacid\b|\bbase\b|\bsalt\b|\bpH\b/.test(haystack)) {
    seeds.push("confusing strong/weak with concentrated/dilute");
  }
  if (/\bredox\b|\boxidation\b|\breduction\b/.test(haystack)) {
    seeds.push("mixing up oxidation and reduction");
  }
  if (/\belectrolysis\b|\belectrochem|\belectrode\b/.test(haystack)) {
    seeds.push("mixing up cathode and anode reactions");
  }
  if (/\borganic\b|\balkane\b|\balkene\b|\bpolymer\b/.test(haystack)) {
    seeds.push("confusing homologous series or functional groups");
  }
  if (/\bequilibri|\bKc\b|\bKp\b/.test(haystack)) {
    seeds.push("including solids or incorrect species in an equilibrium expression");
  }

  return uniqueNonEmpty(seeds, 5);
}

function inferChemistryQuestionAngles(query: string, concepts: string[]) {
  const haystack = `${query} ${concepts.join(" ")}`.toLowerCase();
  const angles = [
    "definition or concept check",
    "equation or formula application",
    "common-misconception distractor check",
  ];

  if (/\bexperiment\b|\bapparatus\b|\bseparat|\bqualitative/.test(haystack)) {
    angles.push("experimental observation or method choice");
  }
  if (/\bmole\b|\bmass\b|\bcalculate\b|\btitration\b|\bstoichiometr/.test(haystack)) {
    angles.push("numerical calculation with units");
  }
  if (/\bcompare\b|\bexplain\b|\bpredict\b/.test(haystack)) {
    angles.push("qualitative comparison or explanation");
  }

  return uniqueNonEmpty(angles, 5);
}

function inferChemistrySuggestedVisual(query: string, concepts: string[]) {
  const haystack = `${query} ${concepts.join(" ")}`.toLowerCase();

  if (/\bbond|\bmolecule\b|\bstructure\b|\bionic\b|\bcovalent\b/.test(haystack)) {
    return "A simple labelled bonding or dot-and-cross diagram may help.";
  }
  if (/\belectrolysis\b|\belectrode\b|\bcell\b/.test(haystack)) {
    return "A simple labelled electrolytic or electrochemical cell may help.";
  }
  if (/\borganic\b|\bmechanism\b|\breaction scheme\b/.test(haystack)) {
    return "A simple labelled reaction scheme may help.";
  }
  if (/\bapparatus\b|\bseparat|\bexperiment\b/.test(haystack)) {
    return "A simple labelled apparatus setup may help.";
  }
  if (/\bsolid\b|\bliquid\b|\bgas\b|\bparticle\b/.test(haystack)) {
    return "A simple particle diagram may help.";
  }

  return undefined;
}

function inferChemistryFormulaHints(query: string, concepts: string[], fromChunks: string[]) {
  const haystack = `${query} ${concepts.join(" ")}`.toLowerCase();
  const hints = [...fromChunks];

  if (/\bmole\b|\bstoichiometr|\bformula\b/.test(haystack)) {
    hints.push("n = m/M and balanced equations link moles of reactants and products.");
  }
  if (/\bbond|\bionic\b|\bcovalent\b/.test(haystack)) {
    hints.push("Ionic bonding transfers electrons; covalent bonding shares them.");
  }
  if (/\bacid\b|\bbase\b|\bpH\b/.test(haystack)) {
    hints.push("Acids produce H+ in water; bases produce OH- or accept H+.");
  }
  if (/\bequilibri|\bKc\b|\bKp\b/.test(haystack)) {
    hints.push("Write Kc or Kp from the balanced equation using the correct states.");
  }
  if (/\bredox\b|\belectrolysis\b/.test(haystack)) {
    hints.push("Oxidation is loss of electrons; reduction is gain of electrons.");
  }

  return uniqueNonEmpty(hints, 4);
}

function unsupportedPack(options: {
  subjectLabel: string;
  sourceChunks: SourceChunk[];
}) {
  return {
    learningOutcomes: [] as string[],
    keyConcepts: [] as string[],
    formulaHints: [] as string[],
    misconceptionSeeds: [] as string[],
    questionAngles: [] as string[],
    suggestedVisual: undefined,
    supportReason: `No strong ${options.subjectLabel} syllabus match was found. Narrow the topic or ask the student to clarify before inventing content.`,
    sourceChunks: options.sourceChunks,
  };
}

export async function buildPhysicsAssessmentSource(
  input: SubjectSourceInput,
): Promise<PhysicsAssessmentSource> {
  const loaded = await loadSubjectSource("physics", input);

  if (!loaded.supported) {
    return {
      subject: "physics",
      gradeLevel: input.gradeLevel,
      request: input.request,
      sourceQuery: loaded.sourceQuery,
      topics: loaded.topics,
      requestedCount: input.requestedCount,
      supported: false,
      ...unsupportedPack({
        subjectLabel: "Physics",
        sourceChunks: loaded.sourceChunks,
      }),
    };
  }

  const keyConcepts = extractKeyConcepts(loaded.sourceChunks);
  const learningOutcomes = extractLearningOutcomes(
    loaded.sourceChunks,
    loaded.sourceQuery,
    loaded.topics,
    true,
    input.gradeLevel,
  );
  const formulaHints = extractPhysicsFormulaHints(loaded.sourceChunks);
  const misconceptionSeeds = inferPhysicsMisconceptionSeeds(loaded.sourceQuery, keyConcepts);
  const questionAngles = inferPhysicsQuestionAngles(loaded.sourceQuery, keyConcepts);
  const suggestedVisual = inferPhysicsSuggestedVisual(loaded.sourceQuery, keyConcepts);

  return {
    subject: "physics",
    gradeLevel: input.gradeLevel,
    request: input.request,
    sourceQuery: loaded.sourceQuery,
    topics: loaded.topics,
    requestedCount: input.requestedCount,
    supported: true,
    supportReason: "Physics syllabus matches were found for this request.",
    sourceChunks: loaded.sourceChunks,
    learningOutcomes,
    keyConcepts,
    formulaHints,
    misconceptionSeeds,
    questionAngles,
    suggestedVisual,
  };
}

export async function buildMathAssessmentSource(
  input: SubjectSourceInput,
): Promise<MathAssessmentSource> {
  const loaded = await loadSubjectSource("math", input);

  if (!loaded.supported) {
    return {
      subject: "math",
      gradeLevel: input.gradeLevel,
      request: input.request,
      sourceQuery: loaded.sourceQuery,
      topics: loaded.topics,
      requestedCount: input.requestedCount,
      supported: false,
      ...unsupportedPack({
        subjectLabel: "Maths",
        sourceChunks: loaded.sourceChunks,
      }),
    };
  }

  const keyConcepts = extractTopicKeyConcepts(
    loaded.sourceChunks,
    loaded.sourceQuery,
    loaded.topics,
    input.gradeLevel,
  );
  const learningOutcomes = extractLearningOutcomes(
    loaded.sourceChunks,
    loaded.sourceQuery,
    loaded.topics,
    true,
    input.gradeLevel,
  );
  const chunkHints = extractMatchingHints(
    loaded.sourceChunks,
    /=|differenti|integrat|pythagoras|trigonometr|quadratic|binomial|logarithm|\bindex|\bsurd\b|\bvector\b|gradient|formula|identity|theorem|\balgebra\b/i,
    true,
    topicTerms(loaded.sourceQuery, loaded.topics),
  );

  return {
    subject: "math",
    gradeLevel: input.gradeLevel,
    request: input.request,
    sourceQuery: loaded.sourceQuery,
    topics: loaded.topics,
    requestedCount: input.requestedCount,
    supported: true,
    supportReason: "Maths syllabus matches were found for this request.",
    sourceChunks: loaded.sourceChunks,
    learningOutcomes,
    keyConcepts,
    formulaHints: inferMathFormulaHints(loaded.sourceQuery, keyConcepts, chunkHints),
    misconceptionSeeds: inferMathMisconceptionSeeds(loaded.sourceQuery, keyConcepts),
    questionAngles: inferMathQuestionAngles(loaded.sourceQuery, keyConcepts),
    suggestedVisual: inferMathSuggestedVisual(loaded.sourceQuery, keyConcepts),
  };
}

export async function buildChemistryAssessmentSource(
  input: SubjectSourceInput,
): Promise<ChemistryAssessmentSource> {
  const loaded = await loadSubjectSource("chemistry", input);

  if (!loaded.supported) {
    return {
      subject: "chemistry",
      gradeLevel: input.gradeLevel,
      request: input.request,
      sourceQuery: loaded.sourceQuery,
      topics: loaded.topics,
      requestedCount: input.requestedCount,
      supported: false,
      ...unsupportedPack({
        subjectLabel: "Chemistry",
        sourceChunks: loaded.sourceChunks,
      }),
    };
  }

  const keyConcepts = extractTopicKeyConcepts(
    loaded.sourceChunks,
    loaded.sourceQuery,
    loaded.topics,
    input.gradeLevel,
  );
  const learningOutcomes = extractLearningOutcomes(
    loaded.sourceChunks,
    loaded.sourceQuery,
    loaded.topics,
    true,
    input.gradeLevel,
  );
  const chunkHints = extractMatchingHints(
    loaded.sourceChunks,
    /=|\bmole\b|\bformula|\bequation|\bbond|\bions?\b|\bacid|\bbase|\bredox|\belectrolysis|\bequilibri|\bpH\b|\benthalp|\bstoichiometr|\balkane|\balkene|\bpolymer/i,
    true,
    topicTerms(loaded.sourceQuery, loaded.topics),
  );

  return {
    subject: "chemistry",
    gradeLevel: input.gradeLevel,
    request: input.request,
    sourceQuery: loaded.sourceQuery,
    topics: loaded.topics,
    requestedCount: input.requestedCount,
    supported: true,
    supportReason: "Chemistry syllabus matches were found for this request.",
    sourceChunks: loaded.sourceChunks,
    learningOutcomes,
    keyConcepts,
    formulaHints: inferChemistryFormulaHints(loaded.sourceQuery, keyConcepts, chunkHints),
    misconceptionSeeds: inferChemistryMisconceptionSeeds(loaded.sourceQuery, keyConcepts),
    questionAngles: inferChemistryQuestionAngles(loaded.sourceQuery, keyConcepts),
    suggestedVisual: inferChemistrySuggestedVisual(loaded.sourceQuery, keyConcepts),
  };
}

const physicsTopicPattern =
  /\b(kinematics|acceleration|velocity|speed|force|motion|moment|pressure|density|wave|light|lens|circuit|current|voltage|resistance|magnetism|electromagnetism)\b/i;
const chemistryTopicPattern =
  /\b(chemical|bonding|mole|stoichiometr\w*|acids?|bases?|salt|electrolysis|redox|organic|alkanes?|alkenes?|periodic table|covalent|ionic|equilibri\w*|titration|polymers?|enthalpy|energetics|atomic structure)\b/i;
const mathTopicPattern =
  /\b(maths?|mathematics|fractions?|decimals?|percentages?|ratio|algebra|differentiat(?:e|ion|ing)|integrat(?:e|ion|ing)|trigonometr\w*|quadratics?|simultaneous|inequalit(?:y|ies)|vectors?|surds?|binomial|logarithms?|calculus|geometry|pythagoras|probability|statistics?|polynomials?|factoris(?:e|ation)|indices|average|perimeter|coordinate)\b/i;

export function selectAssessmentSourceTool(text: string): AssessmentSourceToolName | undefined {
  if (/\bphysics\b/i.test(text)) return "getPhysicsAssessmentSource";
  if (/\bchemistr/i.test(text)) return "getChemistryAssessmentSource";
  if (/\bmaths?\b|\bmathematics\b/i.test(text)) return "getMathAssessmentSource";
  if (physicsTopicPattern.test(text)) return "getPhysicsAssessmentSource";
  if (chemistryTopicPattern.test(text)) return "getChemistryAssessmentSource";
  if (mathTopicPattern.test(text)) return "getMathAssessmentSource";
  return undefined;
}
