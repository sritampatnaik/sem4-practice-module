import assert from "node:assert/strict";
import {
  gradeFromHeading,
  resetSyllabusCache,
  searchSyllabus,
} from "./syllabus";

async function main() {
resetSyllabusCache();

assert.equal(
  gradeFromHeading("Primary Mathematics — Fractions (MOE Primary Mathematics Syllabus 2021, updated Oct 2025)"),
  "primary",
);
assert.equal(gradeFromHeading("O-Level Mathematics 4052 — Number and algebra (SEAB 2026)"), "secondary");
assert.equal(
  gradeFromHeading("A-Level H2 Mathematics 9758 — Calculus including Maclaurin series (SEAB 2026)"),
  "jc",
);

const primaryFractions = await searchSyllabus({
  subject: "math",
  query: "fractions equivalent",
  gradeLevel: "primary",
});
assert.ok(primaryFractions.length, "expected Primary fraction hits");
assert.equal(primaryFractions[0]?.gradeLevel, "primary");
assert.match(primaryFractions[0]?.title ?? "", /fraction/i);
assert.match(
  `${primaryFractions[0]?.title} ${primaryFractions[0]?.excerpt}`.toLowerCase(),
  /part of a whole|equivalent fraction/,
);

const maclaurinAtOLevel = await searchSyllabus({
  subject: "math",
  query: "Maclaurin series",
  gradeLevel: "secondary",
});
assert.equal(maclaurinAtOLevel[0]?.gradeLevel, "jc");
assert.match(maclaurinAtOLevel[0]?.title ?? "", /maclaurin/i);
assert.match(maclaurinAtOLevel[0]?.excerpt ?? "", /standard expansions|Maclaurin/i);

const differentiationAtOLevel = await searchSyllabus({
  subject: "math",
  query: "differentiation chain rule",
  gradeLevel: "secondary",
});
assert.equal(differentiationAtOLevel[0]?.gradeLevel, "secondary");
assert.match(
  `${differentiationAtOLevel[0]?.title} ${differentiationAtOLevel[0]?.excerpt}`.toLowerCase(),
  /differentiat|calculus/,
);

const primaryMagnets = await searchSyllabus({
  subject: "physics",
  query: "magnets poles",
  gradeLevel: "primary",
});
assert.equal(primaryMagnets[0]?.gradeLevel, "primary");
assert.match(`${primaryMagnets[0]?.title} ${primaryMagnets[0]?.excerpt}`.toLowerCase(), /magnet/);
assert.match(`${primaryMagnets[0]?.excerpt}`.toLowerCase(), /unlike poles attract|like poles repel/);

const secondaryElectrolysis = await searchSyllabus({
  subject: "chemistry",
  query: "electrolysis molten sodium chloride",
  gradeLevel: "secondary",
});
assert.equal(secondaryElectrolysis[0]?.gradeLevel, "secondary");
assert.match(
  `${secondaryElectrolysis[0]?.title} ${secondaryElectrolysis[0]?.excerpt}`.toLowerCase(),
  /electrolysis/,
);

const quantumAtOLevel = await searchSyllabus({
  subject: "physics",
  query: "quantum physics",
  gradeLevel: "secondary",
});
assert.equal(quantumAtOLevel[0]?.gradeLevel, "jc");
assert.match(quantumAtOLevel[0]?.title ?? "", /quantum/i);

const combinedChem = await searchSyllabus({
  subject: "chemistry",
  query: "Combined Science 5086 organic",
  gradeLevel: "secondary",
});
assert.ok(combinedChem.some((hit) => /5086/.test(hit.title)));

console.log("syllabus retrieval tests passed");
}

void main();
