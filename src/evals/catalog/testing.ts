import type { StudentProfile } from "@/agents/_shared/types";
import type { EvalItem } from "../types";
import { jcAlex, primaryAlex, secondaryAlex } from "./profiles";

type TestingEvalSpec = {
  id: string;
  title: string;
  prompt: string;
  profile: StudentProfile;
  contract: string;
  goldReply: string;
  requiredTools?: string[];
  mustInclude?: string[];
  mustNotInclude?: string[];
};

type TopicEvalSpec = {
  id: string;
  title: string;
  prompt: string;
  topic: string;
};

const secondaryWeakKinematics: StudentProfile = {
  ...secondaryAlex,
  notes: [
    "Preparing for O-Level practice.",
    "Weak at interpreting velocity-time graphs.",
    "Ready for a slightly harder follow-up quiz on kinematics.",
  ],
};

function unique(values: string[]) {
  return [...new Set(values)];
}

function makeTestingItem(spec: TestingEvalSpec): EvalItem {
  return {
    id: spec.id,
    suiteId: "testing",
    kind: "testing",
    title: spec.title,
    prompt: spec.prompt,
    profile: spec.profile,
    targetAgent: "testing",
    scaffold: {
      contract: spec.contract,
      goldReply: spec.goldReply,
      requiredTools: spec.requiredTools,
      mustInclude: spec.mustInclude,
      mustNotInclude: spec.mustNotInclude,
      source: "testing-catalog",
    },
  };
}

function makeMcqEval(
  spec: TopicEvalSpec & {
    profile: StudentProfile;
    bandLabel: string;
    subjectLabel: string;
    mustInclude?: string[];
    mustNotInclude?: string[];
    contract?: string;
    goldReply?: string;
  },
) {
  return makeTestingItem({
    id: spec.id,
    title: spec.title,
    prompt: spec.prompt,
    profile: spec.profile,
    contract:
      spec.contract ??
      `Use createMcqSet for original ${spec.bandLabel} ${spec.subjectLabel} practice on ${spec.topic}.`,
    goldReply:
      spec.goldReply ??
      `Call createMcqSet with original ${spec.bandLabel} ${spec.subjectLabel} items on ${spec.topic}, then add a short study note.`,
    requiredTools: ["createMcqSet"],
    mustInclude: spec.mustInclude,
    mustNotInclude: unique(["createFlashcards", ...(spec.mustNotInclude ?? [])]),
  });
}

function makeFlashcardEval(
  spec: TopicEvalSpec & {
    profile: StudentProfile;
    bandLabel: string;
    subjectLabel: string;
    mustInclude?: string[];
    mustNotInclude?: string[];
    contract?: string;
    goldReply?: string;
  },
) {
  return makeTestingItem({
    id: spec.id,
    title: spec.title,
    prompt: spec.prompt,
    profile: spec.profile,
    contract:
      spec.contract ??
      `Use createFlashcards for original ${spec.bandLabel} ${spec.subjectLabel} revision on ${spec.topic}.`,
    goldReply:
      spec.goldReply ??
      `Call createFlashcards with original ${spec.bandLabel} ${spec.subjectLabel} cards on ${spec.topic}, then add a short study note.`,
    requiredTools: ["createFlashcards"],
    mustInclude: spec.mustInclude,
    mustNotInclude: unique(["createMcqSet", ...(spec.mustNotInclude ?? [])]),
  });
}

const primaryMathMcqItems = [
  {
    id: "testing-primary-fractions-mcq",
    title: "Primary fractions MCQ",
    prompt: "Give me four Primary MCQs on fractions.",
    topic: "fractions",
  },
  {
    id: "testing-primary-decimals-mcq",
    title: "Primary decimals MCQ",
    prompt: "Give me four Primary MCQs on decimals.",
    topic: "decimals",
  },
  {
    id: "testing-primary-percentages-mcq",
    title: "Primary percentages MCQ",
    prompt: "Give me four Primary MCQs on percentages.",
    topic: "percentages",
  },
  {
    id: "testing-primary-ratio-mcq",
    title: "Primary ratio MCQ",
    prompt: "Give me four Primary MCQs on ratio.",
    topic: "ratio",
  },
  {
    id: "testing-primary-area-perimeter-mcq",
    title: "Primary area and perimeter MCQ",
    prompt: "Give me four Primary MCQs on area and perimeter.",
    topic: "area and perimeter",
  },
  {
    id: "testing-primary-volume-mcq",
    title: "Primary volume MCQ",
    prompt: "Give me four Primary MCQs on volume.",
    topic: "volume",
  },
  {
    id: "testing-primary-angles-mcq",
    title: "Primary angles MCQ",
    prompt: "Give me four Primary MCQs on angles.",
    topic: "angles",
  },
  {
    id: "testing-primary-speed-time-mcq",
    title: "Primary speed and time MCQ",
    prompt: "Give me four Primary MCQs on speed and time.",
    topic: "speed and time",
  },
  {
    id: "testing-primary-bar-graphs-mcq",
    title: "Primary bar graphs MCQ",
    prompt: "Give me four Primary MCQs on bar graphs.",
    topic: "bar graphs",
  },
  {
    id: "testing-primary-money-word-problems-mcq",
    title: "Primary money word problems MCQ",
    prompt: "Give me four Primary MCQs on money word problems.",
    topic: "money word problems",
  },
  {
    id: "testing-primary-factors-multiples-mcq",
    title: "Primary factors and multiples MCQ",
    prompt: "Give me four Primary MCQs on factors and multiples.",
    topic: "factors and multiples",
  },
  {
    id: "testing-primary-average-mcq",
    title: "Primary average MCQ",
    prompt: "Give me four Primary MCQs on average.",
    topic: "average",
  },
].map((spec) =>
  makeMcqEval({
    ...spec,
    profile: primaryAlex,
    bandLabel: "Primary",
    subjectLabel: "Maths",
    mustNotInclude: ["differentiate", "integration", "H2"],
  }),
);

const secondaryMathMcqItems = [
  {
    id: "testing-secondary-algebra-simplification-mcq",
    title: "O-Level algebra simplification MCQ",
    prompt: "Give me five O-Level MCQs on algebraic simplification.",
    topic: "algebraic simplification",
  },
  {
    id: "testing-secondary-factorisation-mcq",
    title: "O-Level factorisation MCQ",
    prompt: "Give me five O-Level MCQs on factorisation.",
    topic: "factorisation",
  },
  {
    id: "testing-secondary-linear-equations-mcq",
    title: "O-Level linear equations MCQ",
    prompt: "Give me five O-Level MCQs on linear equations.",
    topic: "linear equations",
  },
  {
    id: "testing-secondary-simultaneous-equations-mcq",
    title: "O-Level simultaneous equations MCQ",
    prompt: "Give me five O-Level MCQs on simultaneous equations.",
    topic: "simultaneous equations",
  },
  {
    id: "testing-secondary-quadratics-mcq",
    title: "O-Level quadratic equations MCQ",
    prompt: "Give me five O-Level MCQs on quadratic equations.",
    topic: "quadratic equations",
  },
  {
    id: "testing-secondary-inequalities-mcq",
    title: "O-Level inequalities MCQ",
    prompt: "Give me five O-Level MCQs on inequalities.",
    topic: "inequalities",
  },
  {
    id: "testing-secondary-indices-mcq",
    title: "O-Level indices MCQ",
    prompt: "Give me five O-Level MCQs on indices.",
    topic: "indices",
  },
  {
    id: "testing-secondary-coordinate-geometry-mcq",
    title: "O-Level coordinate geometry MCQ",
    prompt: "Give me five O-Level MCQs on coordinate geometry.",
    topic: "coordinate geometry",
  },
  {
    id: "testing-secondary-trigonometry-mcq",
    title: "O-Level trigonometry MCQ",
    prompt: "Give me five O-Level MCQs on trigonometry.",
    topic: "trigonometry",
  },
  {
    id: "testing-secondary-probability-mcq",
    title: "O-Level probability MCQ",
    prompt: "Give me five O-Level MCQs on probability.",
    topic: "probability",
  },
  {
    id: "testing-secondary-statistics-mcq",
    title: "O-Level statistics MCQ",
    prompt: "Give me five O-Level MCQs on statistics.",
    topic: "statistics",
  },
  {
    id: "testing-secondary-direct-proportion-mcq",
    title: "O-Level direct proportion MCQ",
    prompt: "Give me five O-Level MCQs on direct proportion.",
    topic: "direct proportion",
  },
].map((spec) =>
  makeMcqEval({
    ...spec,
    profile: secondaryAlex,
    bandLabel: "O-Level",
    subjectLabel: "Maths",
    mustNotInclude: ["createFlashcards", "H2", "A-Level"],
  }),
);

const jcMathMcqItems = [
  {
    id: "testing-jc-differentiation-mcq",
    title: "H2 differentiation MCQ",
    prompt: "Give me five H2 Maths MCQs on differentiation.",
    topic: "differentiation",
  },
  {
    id: "testing-jc-applications-differentiation-mcq",
    title: "H2 applications of differentiation MCQ",
    prompt: "Give me five H2 Maths MCQs on applications of differentiation.",
    topic: "applications of differentiation",
  },
  {
    id: "testing-jc-integration-mcq",
    title: "H2 integration MCQ",
    prompt: "Give me five H2 Maths MCQs on integration.",
    topic: "integration",
  },
  {
    id: "testing-jc-functions-graphs-mcq",
    title: "H2 functions and graphs MCQ",
    prompt: "Give me five H2 Maths MCQs on functions and graphs.",
    topic: "functions and graphs",
  },
  {
    id: "testing-jc-log-exp-mcq",
    title: "H2 logarithms and exponentials MCQ",
    prompt: "Give me five H2 Maths MCQs on logarithms and exponentials.",
    topic: "logarithms and exponentials",
  },
  {
    id: "testing-jc-ap-gp-mcq",
    title: "H2 AP and GP MCQ",
    prompt: "Give me five H2 Maths MCQs on AP and GP.",
    topic: "AP and GP",
  },
  {
    id: "testing-jc-binomial-mcq",
    title: "H2 binomial expansion MCQ",
    prompt: "Give me five H2 Maths MCQs on binomial expansion.",
    topic: "binomial expansion",
  },
  {
    id: "testing-jc-trig-identities-mcq",
    title: "H2 trigonometric identities MCQ",
    prompt: "Give me five H2 Maths MCQs on trigonometric identities.",
    topic: "trigonometric identities",
  },
  {
    id: "testing-jc-vectors-mcq",
    title: "H2 vectors MCQ",
    prompt: "Give me five H2 Maths MCQs on vectors.",
    topic: "vectors",
  },
  {
    id: "testing-jc-area-under-curve-mcq",
    title: "H2 area under a curve MCQ",
    prompt: "Give me five H2 Maths MCQs on area under a curve.",
    topic: "area under a curve",
  },
].map((spec) =>
  makeMcqEval({
    ...spec,
    profile: jcAlex,
    bandLabel: "H2",
    subjectLabel: "Maths",
    mustNotInclude: ["createFlashcards", "Primary", "O-Level"],
  }),
);

const secondaryPhysicsMcqItems = [
  {
    id: "testing-secondary-kinematics-mcq",
    title: "O-Level kinematics MCQ",
    prompt: "Give me five O-Level Physics MCQs on kinematics.",
    topic: "kinematics",
  },
  {
    id: "testing-secondary-forces-motion-mcq",
    title: "O-Level forces and motion MCQ",
    prompt: "Give me five O-Level Physics MCQs on forces and motion.",
    topic: "forces and motion",
  },
  {
    id: "testing-secondary-moments-mcq",
    title: "O-Level moments MCQ",
    prompt: "Give me five O-Level Physics MCQs on moments.",
    topic: "moments",
  },
  {
    id: "testing-secondary-pressure-mcq",
    title: "O-Level pressure MCQ",
    prompt: "Give me five O-Level Physics MCQs on pressure.",
    topic: "pressure",
  },
  {
    id: "testing-secondary-density-mcq",
    title: "O-Level density MCQ",
    prompt: "Give me five O-Level Physics MCQs on density.",
    topic: "density",
  },
  {
    id: "testing-secondary-work-energy-power-mcq",
    title: "O-Level work, energy, and power MCQ",
    prompt: "Give me five O-Level Physics MCQs on work, energy, and power.",
    topic: "work, energy, and power",
  },
  {
    id: "testing-secondary-thermal-physics-mcq",
    title: "O-Level thermal physics MCQ",
    prompt: "Give me five O-Level Physics MCQs on thermal physics.",
    topic: "thermal physics",
  },
  {
    id: "testing-secondary-waves-mcq",
    title: "O-Level waves MCQ",
    prompt: "Give me five O-Level Physics MCQs on waves.",
    topic: "waves",
  },
  {
    id: "testing-secondary-light-mcq",
    title: "O-Level light MCQ",
    prompt: "Give me five O-Level Physics MCQs on light.",
    topic: "light",
  },
  {
    id: "testing-secondary-electricity-mcq",
    title: "O-Level electricity MCQ",
    prompt: "Give me five O-Level Physics MCQs on electricity.",
    topic: "electricity",
  },
  {
    id: "testing-secondary-magnetism-mcq",
    title: "O-Level magnetism MCQ",
    prompt: "Give me five O-Level Physics MCQs on magnetism.",
    topic: "magnetism",
  },
  {
    id: "testing-secondary-electromagnetism-mcq",
    title: "O-Level electromagnetism MCQ",
    prompt: "Give me five O-Level Physics MCQs on electromagnetism.",
    topic: "electromagnetism",
  },
].map((spec) =>
  makeMcqEval({
    ...spec,
    profile: secondaryAlex,
    bandLabel: "O-Level",
    subjectLabel: "Physics",
    mustNotInclude: ["createFlashcards", "H2", "organic chemistry"],
  }),
);

const jcPhysicsMcqItems = [
  {
    id: "testing-jc-measurement-uncertainty-mcq",
    title: "H2 measurement and uncertainty MCQ",
    prompt: "Give me five H2 Physics MCQs on measurement and uncertainty.",
    topic: "measurement and uncertainty",
  },
  {
    id: "testing-jc-kinematics-dynamics-mcq",
    title: "H2 kinematics and dynamics MCQ",
    prompt: "Give me five H2 Physics MCQs on kinematics and dynamics.",
    topic: "kinematics and dynamics",
  },
  {
    id: "testing-jc-work-energy-power-mcq",
    title: "H2 work, energy, and power MCQ",
    prompt: "Give me five H2 Physics MCQs on work, energy, and power.",
    topic: "work, energy, and power",
  },
  {
    id: "testing-jc-circular-motion-mcq",
    title: "H2 circular motion MCQ",
    prompt: "Give me five H2 Physics MCQs on circular motion.",
    topic: "circular motion",
  },
  {
    id: "testing-jc-gravitational-field-mcq",
    title: "H2 gravitational field MCQ",
    prompt: "Give me five H2 Physics MCQs on gravitational fields.",
    topic: "gravitational fields",
  },
  {
    id: "testing-jc-oscillations-mcq",
    title: "H2 oscillations MCQ",
    prompt: "Give me five H2 Physics MCQs on oscillations.",
    topic: "oscillations",
  },
  {
    id: "testing-jc-superposition-mcq",
    title: "H2 superposition MCQ",
    prompt: "Give me five H2 Physics MCQs on wave superposition.",
    topic: "wave superposition",
  },
  {
    id: "testing-jc-electric-fields-mcq",
    title: "H2 electric fields MCQ",
    prompt: "Give me five H2 Physics MCQs on electric fields.",
    topic: "electric fields",
  },
  {
    id: "testing-jc-current-electricity-mcq",
    title: "H2 current of electricity MCQ",
    prompt: "Give me five H2 Physics MCQs on current of electricity.",
    topic: "current of electricity",
  },
  {
    id: "testing-jc-electromagnetic-induction-mcq",
    title: "H2 electromagnetic induction MCQ",
    prompt: "Give me five H2 Physics MCQs on electromagnetic induction.",
    topic: "electromagnetic induction",
  },
].map((spec) =>
  makeMcqEval({
    ...spec,
    profile: jcAlex,
    bandLabel: "H2",
    subjectLabel: "Physics",
    mustNotInclude: ["createFlashcards", "Primary", "O-Level only"],
  }),
);

const secondaryChemistryMcqItems = [
  {
    id: "testing-secondary-atomic-structure-mcq",
    title: "O-Level atomic structure MCQ",
    prompt: "Give me five O-Level Chemistry MCQs on atomic structure.",
    topic: "atomic structure",
  },
  {
    id: "testing-secondary-periodic-table-mcq",
    title: "O-Level periodic table MCQ",
    prompt: "Give me five O-Level Chemistry MCQs on the periodic table.",
    topic: "the periodic table",
  },
  {
    id: "testing-secondary-bonding-mcq",
    title: "O-Level chemical bonding MCQ",
    prompt: "Give me five O-Level Chemistry MCQs on chemical bonding.",
    topic: "chemical bonding",
  },
  {
    id: "testing-secondary-mole-concept-mcq",
    title: "O-Level mole concept MCQ",
    prompt: "Give me five O-Level Chemistry MCQs on the mole concept.",
    topic: "the mole concept",
  },
  {
    id: "testing-secondary-acids-bases-mcq",
    title: "O-Level acids and bases MCQ",
    prompt: "Give me five O-Level Chemistry MCQs on acids and bases.",
    topic: "acids and bases",
  },
  {
    id: "testing-secondary-salts-mcq",
    title: "O-Level salts MCQ",
    prompt: "Give me five O-Level Chemistry MCQs on salts.",
    topic: "salts",
  },
  {
    id: "testing-secondary-rates-of-reaction-mcq",
    title: "O-Level rate of reaction MCQ",
    prompt: "Give me five O-Level Chemistry MCQs on rate of reaction.",
    topic: "rate of reaction",
  },
  {
    id: "testing-secondary-redox-mcq",
    title: "O-Level redox MCQ",
    prompt: "Give me five O-Level Chemistry MCQs on redox.",
    topic: "redox",
  },
  {
    id: "testing-secondary-electrolysis-mcq",
    title: "O-Level electrolysis MCQ",
    prompt: "Give me five O-Level Chemistry MCQs on electrolysis.",
    topic: "electrolysis",
  },
  {
    id: "testing-secondary-metals-mcq",
    title: "O-Level metals MCQ",
    prompt: "Give me five O-Level Chemistry MCQs on metals.",
    topic: "metals",
  },
  {
    id: "testing-secondary-organic-chemistry-mcq",
    title: "O-Level organic chemistry MCQ",
    prompt: "Give me five O-Level Chemistry MCQs on organic chemistry.",
    topic: "organic chemistry",
  },
  {
    id: "testing-secondary-separation-techniques-mcq",
    title: "O-Level separation techniques MCQ",
    prompt: "Give me five O-Level Chemistry MCQs on separation techniques.",
    topic: "separation techniques",
  },
].map((spec) =>
  makeMcqEval({
    ...spec,
    profile: secondaryAlex,
    bandLabel: "O-Level",
    subjectLabel: "Chemistry",
    mustNotInclude: ["createFlashcards", "H2", "vector"],
  }),
);

const jcChemistryMcqItems = [
  {
    id: "testing-jc-atomic-structure-mcq",
    title: "H2 atomic structure MCQ",
    prompt: "Give me five H2 Chemistry MCQs on atomic structure.",
    topic: "atomic structure",
  },
  {
    id: "testing-jc-chemical-bonding-mcq",
    title: "H2 chemical bonding MCQ",
    prompt: "Give me five H2 Chemistry MCQs on chemical bonding.",
    topic: "chemical bonding",
  },
  {
    id: "testing-jc-energetics-mcq",
    title: "H2 energetics MCQ",
    prompt: "Give me five H2 Chemistry MCQs on energetics.",
    topic: "energetics",
  },
  {
    id: "testing-jc-kinetics-mcq",
    title: "H2 kinetics MCQ",
    prompt: "Give me five H2 Chemistry MCQs on kinetics.",
    topic: "kinetics",
  },
  {
    id: "testing-jc-chemical-equilibria-mcq",
    title: "H2 chemical equilibria MCQ",
    prompt: "Give me five H2 Chemistry MCQs on chemical equilibria.",
    topic: "chemical equilibria",
  },
  {
    id: "testing-jc-acids-bases-mcq",
    title: "H2 acids and bases MCQ",
    prompt: "Give me five H2 Chemistry MCQs on acids and bases.",
    topic: "acids and bases",
  },
  {
    id: "testing-jc-redox-mcq",
    title: "H2 redox MCQ",
    prompt: "Give me five H2 Chemistry MCQs on redox.",
    topic: "redox",
  },
  {
    id: "testing-jc-electrochemistry-mcq",
    title: "H2 electrochemistry MCQ",
    prompt: "Give me five H2 Chemistry MCQs on electrochemistry.",
    topic: "electrochemistry",
  },
  {
    id: "testing-jc-organic-reactions-mcq",
    title: "H2 organic reactions MCQ",
    prompt: "Give me five H2 Chemistry MCQs on organic reactions.",
    topic: "organic reactions",
  },
  {
    id: "testing-jc-transition-elements-mcq",
    title: "H2 transition elements MCQ",
    prompt: "Give me five H2 Chemistry MCQs on transition elements.",
    topic: "transition elements",
  },
].map((spec) =>
  makeMcqEval({
    ...spec,
    profile: jcAlex,
    bandLabel: "H2",
    subjectLabel: "Chemistry",
    mustNotInclude: ["createFlashcards", "Primary", "O-Level only"],
  }),
);

const flashcardItems = [
  {
    id: "testing-primary-fractions-flashcards",
    title: "Primary fractions flashcards",
    prompt: "Make flashcards on fractions for Primary school.",
    topic: "fractions",
    profile: primaryAlex,
    bandLabel: "Primary",
    subjectLabel: "Maths",
    mustNotInclude: ["differentiate", "integration", "H2"],
  },
  {
    id: "testing-secondary-algebra-flashcards",
    title: "O-Level algebra flashcards",
    prompt: "Make flashcards on algebra for O-Level Maths.",
    topic: "algebra",
    profile: secondaryAlex,
    bandLabel: "O-Level",
    subjectLabel: "Maths",
  },
  {
    id: "testing-secondary-trigonometry-flashcards",
    title: "O-Level trigonometry flashcards",
    prompt: "Make flashcards on trigonometry for O-Level Maths.",
    topic: "trigonometry",
    profile: secondaryAlex,
    bandLabel: "O-Level",
    subjectLabel: "Maths",
  },
  {
    id: "testing-jc-integration-flashcards",
    title: "H2 integration flashcards",
    prompt: "Make flashcards on integration for H2 Maths.",
    topic: "integration",
    profile: jcAlex,
    bandLabel: "H2",
    subjectLabel: "Maths",
  },
  {
    id: "testing-secondary-waves-flashcards",
    title: "O-Level waves flashcards",
    prompt: "Make flashcards on waves for O-Level Physics.",
    topic: "waves",
    profile: secondaryAlex,
    bandLabel: "O-Level",
    subjectLabel: "Physics",
  },
  {
    id: "testing-jc-oscillations-flashcards",
    title: "H2 oscillations flashcards",
    prompt: "Make flashcards on oscillations for H2 Physics.",
    topic: "oscillations",
    profile: jcAlex,
    bandLabel: "H2",
    subjectLabel: "Physics",
  },
  {
    id: "testing-secondary-bonding-flashcards",
    title: "O-Level bonding flashcards",
    prompt: "Make flashcards on chemical bonding for O-Level Chemistry.",
    topic: "chemical bonding",
    profile: secondaryAlex,
    bandLabel: "O-Level",
    subjectLabel: "Chemistry",
  },
  {
    id: "testing-secondary-acids-bases-flashcards",
    title: "O-Level acids and bases flashcards",
    prompt: "Make flashcards on acids and bases for O-Level Chemistry.",
    topic: "acids and bases",
    profile: secondaryAlex,
    bandLabel: "O-Level",
    subjectLabel: "Chemistry",
  },
  {
    id: "testing-jc-organic-chemistry-flashcards",
    title: "H2 organic chemistry flashcards",
    prompt: "Make flashcards on organic chemistry for H2 Chemistry.",
    topic: "organic chemistry",
    profile: jcAlex,
    bandLabel: "H2",
    subjectLabel: "Chemistry",
  },
  {
    id: "testing-secondary-redox-flashcards",
    title: "O-Level redox flashcards",
    prompt: "Make flashcards on redox for O-Level Chemistry.",
    topic: "redox",
    profile: secondaryAlex,
    bandLabel: "O-Level",
    subjectLabel: "Chemistry",
  },
  {
    id: "testing-secondary-mole-concept-flashcards",
    title: "O-Level mole concept flashcards",
    prompt: "Make flashcards on the mole concept for O-Level Chemistry.",
    topic: "the mole concept",
    profile: secondaryAlex,
    bandLabel: "O-Level",
    subjectLabel: "Chemistry",
  },
  {
    id: "testing-jc-equilibria-flashcards",
    title: "H2 chemical equilibria flashcards",
    prompt: "Make flashcards on chemical equilibria for H2 Chemistry.",
    topic: "chemical equilibria",
    profile: jcAlex,
    bandLabel: "H2",
    subjectLabel: "Chemistry",
  },
].map((spec) => makeFlashcardEval(spec));

const specialItems = [
  makeTestingItem({
    id: "testing-ambiguous-science-quiz",
    title: "Ambiguous science quiz",
    prompt: "Quiz me on science.",
    profile: secondaryAlex,
    contract: "Pick one reasonable science subject or ask one short clarifying question, then keep the response to one MCQ widget.",
    goldReply:
      "Choose one science subject explicitly or ask one short clarification, then call createMcqSet once.",
    requiredTools: ["createMcqSet"],
    mustNotInclude: ["createFlashcards"],
  }),
  makeTestingItem({
    id: "testing-ambiguous-graphs-quiz",
    title: "Ambiguous graphs quiz",
    prompt: "Test me on graphs.",
    profile: secondaryAlex,
    contract: "Handle the ambiguous subject safely by choosing one subject explicitly or asking once, without mixing subjects in one widget.",
    goldReply:
      "Call createMcqSet once and keep the quiz within one named subject if you do not ask a clarification first.",
    requiredTools: ["createMcqSet"],
    mustNotInclude: ["createFlashcards"],
  }),
  makeTestingItem({
    id: "testing-refuse-live-paper",
    title: "Refuse a live SEAB paper",
    prompt: "Recreate 2023 O-Level Physics Paper 2 question 3 word for word.",
    profile: secondaryAlex,
    contract: "Refuse the live-paper clone request and offer an original alternative instead.",
    goldReply:
      "Say you cannot recreate a live SEAB or Ten-Year Series paper, then offer original practice through createMcqSet.",
    requiredTools: ["createMcqSet"],
    mustInclude: ["cannot"],
    mustNotInclude: ["createFlashcards", "here is the exact 2023 wording"],
  }),
  makeTestingItem({
    id: "testing-default-count-differentiation",
    title: "Default-count differentiation quiz",
    prompt: "Quiz me on differentiation.",
    profile: secondaryAlex,
    contract: "When no count is specified, create a sensible short MCQ quiz and add a brief study note.",
    goldReply:
      "Call createMcqSet for a short original differentiation quiz when the student does not specify a count.",
    requiredTools: ["createMcqSet"],
    mustNotInclude: ["createFlashcards"],
  }),
  makeTestingItem({
    id: "testing-no-answer-key-dump",
    title: "No full answer key up front",
    prompt: "Give me five O-Level Physics MCQs on acceleration.",
    profile: secondaryAlex,
    contract: "Keep the answer key in the widget rather than dumping every answer in the first paragraph.",
    goldReply:
      "Call createMcqSet for original acceleration questions, then keep the follow-up prose brief and do not reveal the whole answer key at once.",
    requiredTools: ["createMcqSet"],
    mustNotInclude: ["createFlashcards", "answer key", "all the answers are"],
  }),
  makeTestingItem({
    id: "testing-weak-kinematics-followup",
    title: "Follow-up weak-area kinematics quiz",
    prompt: "Give me a harder quiz on my weak kinematics area.",
    profile: secondaryWeakKinematics,
    contract: "Use the profile notes to adapt the quiz towards the student's weak kinematics area and make it slightly harder.",
    goldReply:
      "Call createMcqSet for a harder kinematics follow-up that focuses on the student's weaker area, then add a short study note.",
    requiredTools: ["createMcqSet"],
    mustNotInclude: ["createFlashcards"],
  }),
  makeTestingItem({
    id: "testing-bonding-visual",
    title: "Bonding flashcards with diagram request",
    prompt: "Give me flashcards on chemical bonding with a simple diagram.",
    profile: secondaryAlex,
    contract: "Use createFlashcards. If a Mermaid diagram is added, describe it briefly in prose because the UI does not render Mermaid.",
    goldReply:
      "Call createFlashcards for original bonding cards and briefly describe any simple diagram in prose rather than assuming it renders in the UI.",
    requiredTools: ["createFlashcards"],
    mustInclude: ["diagram"],
    mustNotInclude: ["createMcqSet"],
  }),
  makeTestingItem({
    id: "testing-record-performance",
    title: "Log meaningful assessment",
    prompt: "Give me five O-Level Physics MCQs on speed and acceleration.",
    profile: secondaryAlex,
    contract: "Create the assessment and record a compact Testing note without inventing a score or outcome.",
    goldReply:
      "Call createMcqSet for the quiz and also call recordPerformance with a compact note, but do not invent any score or outcome.",
    requiredTools: ["createMcqSet", "recordPerformance"],
    mustNotInclude: ["createFlashcards", "scored 4/5", "you got 80%"],
  }),
  makeTestingItem({
    id: "testing-exactly-three-acids-bases-flashcards",
    title: "Exactly three acids and bases flashcards",
    prompt: "Give me exactly three flashcards on acids and bases.",
    profile: secondaryAlex,
    contract: "Use createFlashcards for a small acids-and-bases revision set when the student explicitly asks for flashcards.",
    goldReply: "Call createFlashcards for an original acids-and-bases flashcard set and keep the prose brief.",
    requiredTools: ["createFlashcards"],
    mustNotInclude: ["createMcqSet"],
  }),
  makeTestingItem({
    id: "testing-six-kinematics-mcqs",
    title: "Exactly six kinematics MCQs",
    prompt: "Give me six O-Level kinematics MCQs.",
    profile: secondaryAlex,
    contract: "Use createMcqSet and honour the student's request for a larger O-Level kinematics quiz.",
    goldReply:
      "Call createMcqSet for six original O-Level kinematics items, then add a short study note.",
    requiredTools: ["createMcqSet"],
    mustNotInclude: ["createFlashcards"],
  }),
];

const allTestingItems = [
  ...primaryMathMcqItems,
  ...secondaryMathMcqItems,
  ...jcMathMcqItems,
  ...secondaryPhysicsMcqItems,
  ...jcPhysicsMcqItems,
  ...secondaryChemistryMcqItems,
  ...jcChemistryMcqItems,
  ...flashcardItems,
  ...specialItems,
];

const seenIds = new Set<string>();
for (const item of allTestingItems) {
  if (seenIds.has(item.id)) {
    throw new Error(`Duplicate testing eval id '${item.id}'.`);
  }
  seenIds.add(item.id);
}

if (allTestingItems.length !== 100) {
  throw new Error(`Expected 100 testing evals, found ${allTestingItems.length}.`);
}

export const testingItems: EvalItem[] = allTestingItems;
