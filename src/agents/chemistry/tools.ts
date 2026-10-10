import { tool } from "ai";
import { z } from "zod";

type Element = {
  z: number;
  symbol: string;
  name: string;
  mass: number;
  group: string;
};

export const PERIODIC_TABLE: Element[] = [
  // atomic mass ref: https://pubchem.ncbi.nlm.nih.gov/periodic-table/atomic-mass/
  { z: 1, symbol: "H", name: "Hydrogen", mass: 1.0080, group: "1" },
  { z: 2, symbol: "He", name: "Helium", mass: 4.00260, group: "18" },
  { z: 3, symbol: "Li", name: "Lithium", mass: 7.0, group: "1" },
  { z: 4, symbol: "Be", name: "Beryllium", mass: 9.012183, group: "2" },
  { z: 5, symbol: "B", name: "Boron", mass: 10.81, group: "13" },
  { z: 6, symbol: "C", name: "Carbon", mass: 12.011, group: "14" },
  { z: 7, symbol: "N", name: "Nitrogen", mass: 14.007, group: "15" },
  { z: 8, symbol: "O", name: "Oxygen", mass: 15.999, group: "16" },
  { z: 9, symbol: "F", name: "Fluorine", mass: 18.99840316, group: "17" },
  { z: 10, symbol: "Ne", name: "Neon", mass: 20.180, group: "18" },
  { z: 11, symbol: "Na", name: "Sodium", mass: 22.9897693, group: "1" },
  { z: 12, symbol: "Mg", name: "Magnesium", mass: 24.305, group: "2" },
  { z: 13, symbol: "Al", name: "Aluminium", mass: 26.981538, group: "13" },
  { z: 14, symbol: "Si", name: "Silicon", mass: 28.085, group: "14" },
  { z: 15, symbol: "P", name: "Phosphorus", mass: 30.97376200, group: "15" },
  { z: 16, symbol: "S", name: "Sulfur", mass: 32.07, group: "16" },
  { z: 17, symbol: "Cl", name: "Chlorine", mass: 35.45, group: "17" },
  { z: 18, symbol: "Ar", name: "Argon", mass: 39.9, group: "18" },
  { z: 19, symbol: "K", name: "Potassium", mass: 39.0983, group: "1" },
  { z: 20, symbol: "Ca", name: "Calcium", mass: 40.08, group: "2" },
  { z: 21, symbol: "Sc", name: "Scandium", mass: 44.95591, group: "3" },
  { z: 22, symbol: "Ti", name: "Titanium", mass: 47.867, group: "4" },
  { z: 23, symbol: "V", name: "Vanadium", mass: 50.9415, group: "5" },
  { z: 24, symbol: "Cr", name: "Chromium", mass: 51.996, group: "6" },
  { z: 25, symbol: "Mn", name: "Manganese", mass: 54.93804, group: "7" },
  { z: 26, symbol: "Fe", name: "Iron", mass: 55.84, group: "8" },
  { z: 27, symbol: "Co", name: "Cobalt", mass: 58.93319, group: "9" },
  { z: 28, symbol: "Ni", name: "Nickel", mass: 58.693, group: "10" },
  { z: 29, symbol: "Cu", name: "Copper", mass: 63.55, group: "11" },
  { z: 30, symbol: "Zn", name: "Zinc", mass: 65.4, group: "12" },
  { z: 31, symbol: "Ga", name: "Gallium", mass: 69.723, group: "13" },
  { z: 32, symbol: "Ge", name: "Germanium", mass: 72.63, group: "14" },
  { z: 33, symbol: "As", name: "Arsenic", mass: 74.92159, group: "15" },
  { z: 34, symbol: "Se", name: "Selenium", mass: 78.97, group: "16" },
  { z: 35, symbol: "Br", name: "Bromine", mass: 79.90, group: "17" },
  { z: 36, symbol: "Kr", name: "Krypton", mass: 83.80, group: "18" },
  { z: 37, symbol: "Rb", name: "Rubidium", mass: 85.468, group: "1" },
  { z: 38, symbol: "Sr", name: "Strontium", mass: 87.62, group: "2" },
  { z: 39, symbol: "Y", name: "Yttrium", mass: 88.90584, group: "3" },
  { z: 40, symbol: "Zr", name: "Zirconium", mass: 91.22, group: "4" },
  { z: 41, symbol: "Nb", name: "Niobium", mass: 92.90637, group: "5" },
  { z: 42, symbol: "Mo", name: "Molybdenum", mass: 95.95, group: "6" },
  { z: 43, symbol: "Tc", name: "Technetium", mass: 96.90636, group: "7" },
  { z: 44, symbol: "Ru", name: "Ruthenium", mass: 101.1, group: "8" },
  { z: 45, symbol: "Rh", name: "Rhodium", mass: 102.9055, group: "9" },
  { z: 46, symbol: "Pd", name: "Palladium", mass: 106.42, group: "10" },
  { z: 47, symbol: "Ag", name: "Silver", mass: 107.868, group: "11" },
  { z: 48, symbol: "Cd", name: "Cadmium", mass: 112.41, group: "12" },
  { z: 49, symbol: "In", name: "Indium", mass: 114.818, group: "13" },
  { z: 50, symbol: "Sn", name: "Tin", mass: 118.71, group: "14" },
  { z: 51, symbol: "Sb", name: "Antimony", mass: 121.760, group: "15" },
  { z: 52, symbol: "Te", name: "Tellurium", mass: 127.6, group: "16" },
  { z: 53, symbol: "I", name: "Iodine", mass: 126.9045, group: "17" },
  { z: 54, symbol: "Xe", name: "Xenon", mass: 131.29, group: "18" },
  { z: 55, symbol: "Cs", name: "Caesium", mass: 132.9054520, group: "1" },
  { z: 56, symbol: "Ba", name: "Barium", mass: 137.33, group: "2" },
  { z: 57, symbol: "La", name: "Lanthanum", mass: 138.9055, group: "lanthanide" },
  { z: 58, symbol: "Ce", name: "Cerium", mass: 140.116, group: "lanthanide" },
  { z: 59, symbol: "Pr", name: "Praseodymium", mass: 140.90766, group: "lanthanide" },
  { z: 60, symbol: "Nd", name: "Neodymium", mass: 144.24, group: "lanthanide" },
  { z: 61, symbol: "Pm", name: "Promethium", mass: 144.91276, group: "lanthanide" },
  { z: 62, symbol: "Sm", name: "Samarium", mass: 150.4, group: "lanthanide" },
  { z: 63, symbol: "Eu", name: "Europium", mass: 151.964, group: "lanthanide" },
  { z: 64, symbol: "Gd", name: "Gadolinium", mass: 157.25, group: "lanthanide" },
  { z: 65, symbol: "Tb", name: "Terbium", mass: 158.92535, group: "lanthanide" },
  { z: 66, symbol: "Dy", name: "Dysprosium", mass: 162.500, group: "lanthanide" },
  { z: 67, symbol: "Ho", name: "Holmium", mass: 164.93033, group: "lanthanide" },
  { z: 68, symbol: "Er", name: "Erbium", mass: 167.26, group: "lanthanide" },
  { z: 69, symbol: "Tm", name: "Thulium", mass: 168.93422, group: "lanthanide" },
  { z: 70, symbol: "Yb", name: "Ytterbium", mass: 173.05, group: "lanthanide" },
  { z: 71, symbol: "Lu", name: "Lutetium", mass: 174.9667, group: "3" },
  { z: 72, symbol: "Hf", name: "Hafnium", mass: 178.49, group: "4" },
  { z: 73, symbol: "Ta", name: "Tantalum", mass: 180.9479, group: "5" },
  { z: 74, symbol: "W", name: "Tungsten", mass: 183.84, group: "6" },
  { z: 75, symbol: "Re", name: "Rhenium", mass: 186.207, group: "7" },
  { z: 76, symbol: "Os", name: "Osmium", mass: 190.2, group: "8" },
  { z: 77, symbol: "Ir", name: "Iridium", mass: 192.22, group: "9" },
  { z: 78, symbol: "Pt", name: "Platinum", mass: 195.08, group: "10" },
  { z: 79, symbol: "Au", name: "Gold", mass: 196.96657, group: "11" },
  { z: 80, symbol: "Hg", name: "Mercury", mass: 200.59, group: "12" },
  { z: 81, symbol: "Tl", name: "Thallium", mass: 204.383, group: "13" },
  { z: 82, symbol: "Pb", name: "Lead", mass: 207, group: "14" },
  { z: 83, symbol: "Bi", name: "Bismuth", mass: 208.98040, group: "15" },
  { z: 84, symbol: "Po", name: "Polonium", mass: 208.98243, group: "16" },
  { z: 85, symbol: "At", name: "Astatine", mass: 209.98715, group: "17" },
  { z: 86, symbol: "Rn", name: "Radon", mass: 222.01758, group: "18" },
  { z: 87, symbol: "Fr", name: "Francium", mass: 223.01973, group: "1" },
  { z: 88, symbol: "Ra", name: "Radium", mass: 226.02541, group: "2" },
  { z: 89, symbol: "Ac", name: "Actinium", mass: 227.02775, group: "actinide" },
  { z: 90, symbol: "Th", name: "Thorium", mass: 232.038, group: "actinide" },
  { z: 91, symbol: "Pa", name: "Protactinium", mass: 231.03588, group: "actinide" },
  { z: 92, symbol: "U", name: "Uranium", mass: 238.0289, group: "actinide" },
  { z: 93, symbol: "Np", name: "Neptunium", mass: 237.048172, group: "actinide" },
  { z: 94, symbol: "Pu", name: "Plutonium", mass: 244.06420, group: "actinide" },
  { z: 95, symbol: "Am", name: "Americium", mass: 243.061380, group: "actinide" },
  { z: 96, symbol: "Cm", name: "Curium", mass: 247.07035, group: "actinide" },
  { z: 97, symbol: "Bk", name: "Berkelium", mass: 247.07031, group: "actinide" },
  { z: 98, symbol: "Cf", name: "Californium", mass: 251.07959, group: "actinide" },
  { z: 99, symbol: "Es", name: "Einsteinium", mass: 252.0830, group: "actinide" },
  { z: 100, symbol: "Fm", name: "Fermium", mass: 257.09511, group: "actinide" },
  { z: 101, symbol: "Md", name: "Mendelevium", mass: 258.09843, group: "actinide" },
  { z: 102, symbol: "No", name: "Nobelium", mass: 259.10100, group: "actinide" },
  { z: 103, symbol: "Lr", name: "Lawrencium", mass: 266.120, group: "3" },
  { z: 104, symbol: "Rf", name: "Rutherfordium", mass: 267.122, group: "4" },
  { z: 105, symbol: "Db", name: "Dubnium", mass: 268.126, group: "5" },
  { z: 106, symbol: "Sg", name: "Seaborgium", mass: 269.128, group: "6" },
  { z: 107, symbol: "Bh", name: "Bohrium", mass: 270.133, group: "7" },
  { z: 108, symbol: "Hs", name: "Hassium", mass: 269.1336, group: "8" },
  { z: 109, symbol: "Mt", name: "Meitnerium", mass: 277.154, group: "9" },
  { z: 110, symbol: "Ds", name: "Darmstadtium", mass: 282.166, group: "10" },
  { z: 111, symbol: "Rg", name: "Roentgenium", mass: 282.169, group: "11" },
  { z: 112, symbol: "Cn", name: "Copernicium", mass: 286.179, group: "12" },
  { z: 113, symbol: "Nh", name: "Nihonium", mass: 286.182, group: "13" },
  { z: 114, symbol: "Fl", name: "Flerovium", mass: 290.192, group: "14" },
  { z: 115, symbol: "Mc", name: "Moscovium", mass: 290.196, group: "15" },
  { z: 116, symbol: "Lv", name: "Livermorium", mass: 293.205, group: "16" },
  { z: 117, symbol: "Ts", name: "Tennessine", mass: 294.211, group: "17" },
  { z: 118, symbol: "Og", name: "Oganesson", mass: 295.216, group: "18" },
];

const ELEMENT_SYMBOLS = new Set(PERIODIC_TABLE.map((element) => element.symbol));
const MAX_EQUATION_LENGTH = 256;
const MAX_FORMULA_LENGTH = 80;
const MAX_ATOM_COUNT = 10_000;
const MAX_SPECIES = 5;
const MAX_NESTING_DEPTH = 8;
const MAX_OUTPUT_COEFFICIENT = 1_000_000;

type AtomCounts = Record<string, number>;
type ParsedSpecies = { atoms: AtomCounts; display: string };
type BalanceErrorCode =
  | "EMPTY_INPUT"
  | "INPUT_TOO_LONG"
  | "INVALID_SYNTAX"
  | "UNSUPPORTED_NOTATION"
  | "UNKNOWN_ELEMENT"
  | "TOO_MANY_SPECIES"
  | "ELEMENT_MISMATCH"
  | "NO_POSITIVE_SOLUTION"
  | "COEFFICIENT_LIMIT";

type BalanceResult =
  | { ok: true; balanced: string; coefficients: number[] }
  | { ok: false; error: string; code: BalanceErrorCode };

const failure = (code: BalanceErrorCode, error: string): BalanceResult => ({
  ok: false, code, error,
});

function parseFormula(formula: string): AtomCounts | undefined {
  if (!formula || formula.length > MAX_FORMULA_LENGTH) return undefined;
  let position = 0;
  function multiplier(): number | undefined {
    const start = position;
    while (position < formula.length && /[0-9]/.test(formula[position])) position++;
    if (position === start) return 1;
    const n = Number(formula.slice(start, position));
    return Number.isSafeInteger(n) && n >= 1 && n <= MAX_ATOM_COUNT ? n : undefined;
  }
  function group(depth: number): AtomCounts | undefined {
    if (depth > MAX_NESTING_DEPTH) return undefined;
    const counts: AtomCounts = Object.create(null);
    let content = false;
    while (position < formula.length) {
      if (formula[position] === ")") {
        if (depth === 0 || !content) return undefined;
        position++;
        return counts;
      }
      let atoms: AtomCounts;
      if (formula[position] === "(") {
        position++;
        const nested = group(depth + 1);
        if (!nested) return undefined;
        atoms = nested;
      } else {
        const match = /^[A-Z][a-z]?/.exec(formula.slice(position));
        if (!match || !ELEMENT_SYMBOLS.has(match[0])) return undefined;
        position += match[0].length;
        atoms = { [match[0]]: 1 };
      }
      const factor = multiplier();
      if (factor === undefined) return undefined;
      for (const [symbol, count] of Object.entries(atoms)) {
        const total = (counts[symbol] ?? 0) + count * factor;
        if (!Number.isSafeInteger(total) || total > MAX_ATOM_COUNT) return undefined;
        counts[symbol] = total;
      }
      content = true;
    }
    return depth === 0 && content ? counts : undefined;
  }
  const atoms = group(0);
  return atoms && position === formula.length ? atoms : undefined;
}

function parseSpecies(text: string): ParsedSpecies | undefined {
  const trimmed = text.trim();
  const phaseMatch = /\s*\((s|l|g|aq)\)$/i.exec(trimmed);
  const body = phaseMatch ? trimmed.slice(0, phaseMatch.index).trim() : trimmed;
  const coefficientMatch = /^(\d+)\s*(.+)$/.exec(body);
  const coefficient = coefficientMatch ? Number(coefficientMatch[1]) : 1;
  if (!Number.isSafeInteger(coefficient) || coefficient < 1 || coefficient > MAX_ATOM_COUNT) return undefined;
  const formula = coefficientMatch ? coefficientMatch[2] : body;
  const atoms = parseFormula(formula);
  if (!atoms) return undefined;
  const phase = phaseMatch ? `(${phaseMatch[1].toLowerCase()})` : "";
  // Incoming coefficients are deliberately ignored: return the simplest balance.
  return { atoms, display: `${formula}${phase}` };
}

// Exact rational arithmetic avoids floating-point rounding during elimination.
type Fraction = { n: bigint; d: bigint };
function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}
function fraction(n: bigint, d = 1n): Fraction {
  if (d === 0n) throw new Error("Zero denominator");
  if (d < 0n) { n = -n; d = -d; }
  const divisor = gcd(n, d);
  return { n: n / divisor, d: d / divisor };
}
const add = (a: Fraction, b: Fraction) => fraction(a.n * b.d + b.n * a.d, a.d * b.d);
const neg = (a: Fraction) => fraction(-a.n, a.d);
const mul = (a: Fraction, b: Fraction) => fraction(a.n * b.n, a.d * b.d);
const div = (a: Fraction, b: Fraction) => fraction(a.n * b.d, a.d * b.n);

/** Reduced row-echelon form; columns not containing pivots are free variables. */
function rref(matrix: Fraction[][], columns: number): number[] {
  const pivots: number[] = [];
  let row = 0;
  for (let col = 0; col < columns && row < matrix.length; col++) {
    const pivot = matrix.findIndex((r, i) => i >= row && r[col].n !== 0n);
    if (pivot < 0) continue;
    [matrix[row], matrix[pivot]] = [matrix[pivot], matrix[row]];
    const scale = matrix[row][col];
    matrix[row] = matrix[row].map((v) => div(v, scale));
    for (let i = 0; i < matrix.length; i++) {
      if (i === row || matrix[i][col].n === 0n) continue;
      const factor = matrix[i][col];
      matrix[i] = matrix[i].map((v, j) => add(v, neg(mul(factor, matrix[row][j]))));
    }
    pivots.push(col);
    row++;
  }
  return pivots;
}

function integerCoefficients(values: Fraction[]): bigint[] | undefined {
  let denominator = 1n;
  for (const value of values) denominator = denominator / gcd(denominator, value.d) * value.d;
  let ints = values.map((value) => value.n * (denominator / value.d));
  if (ints.some((v) => v <= 0n)) return undefined;
  const divisor = ints.reduce((acc, v) => gcd(acc, v));
  ints = ints.map((v) => v / divisor);
  return ints;
}

export function balanceEquation(equation: string): BalanceResult {
  const input = equation.trim();
  if (!input) return failure("EMPTY_INPUT", "Enter a chemical equation to balance.");
  if (input.length > MAX_EQUATION_LENGTH)
    return failure("INPUT_TOO_LONG", `Keep the equation within ${MAX_EQUATION_LENGTH} characters.`);
  const sides = input.split(/->|=>|=|→/);
  if (sides.length !== 2 || sides.some((side) => !side.trim()))
    return failure("INVALID_SYNTAX", "Use the form H2 + O2 -> H2O.");
  // Ionic charges and hydrates are valid chemistry, but unsupported by this parser.
  if (/[·.]/.test(input) || /(?:[A-Za-z0-9\)])(?:\^?\d*[+-])(?=\s|\+|->|=>|=|→|$)/.test(input))
    return failure("UNSUPPORTED_NOTATION", "Charged species and hydrate notation are not supported by this balancer.");
  const parseSide = (side: string) => side.split("+").map((part) => part.trim());
  const leftParts = parseSide(sides[0]);
  const rightParts = parseSide(sides[1]);
  if ([...leftParts, ...rightParts].some((part) => !part))
    return failure("INVALID_SYNTAX", "Every reactant and product must have a chemical formula.");
  const raw = [...leftParts, ...rightParts];
  if (raw.length > MAX_SPECIES)
    return failure("TOO_MANY_SPECIES", `Balance at most ${MAX_SPECIES} species at a time.`);
  const species = raw.map(parseSpecies);
  if (species.some((item) => !item)) {
    const symbols = raw.flatMap((part) => part.match(/[A-Z][a-z]?/g) ?? []);
    const unknown = symbols.find((symbol) => !ELEMENT_SYMBOLS.has(symbol));
    if (unknown) return failure("UNKNOWN_ELEMENT", `Unknown element symbol: ${unknown}.`);
    return failure("INVALID_SYNTAX", "Invalid or unsupported chemical formula; check brackets, symbols and subscripts.");
  }
  const parsed = species as ParsedSpecies[];
  const left = parsed.slice(0, leftParts.length);
  const right = parsed.slice(leftParts.length);
  const elements = [...new Set(parsed.flatMap((item) => Object.keys(item.atoms)))];
  if (elements.some((element) => !left.some((s) => s.atoms[element]) || !right.some((s) => s.atoms[element])))
    return failure("ELEMENT_MISMATCH", "The equation does not conserve its elements.");

  const matrix = elements.map((element) => parsed.map((item, i) =>
    fraction(BigInt((item.atoms[element] ?? 0) * (i < left.length ? 1 : -1)))));
  const pivots = rref(matrix, parsed.length);
  const free = Array.from({ length: parsed.length }, (_, i) => i).filter((i) => !pivots.includes(i));
  if (!free.length) return failure("NO_POSITIVE_SOLUTION", "No positive balancing coefficients exist.");

  // Ordinary reactions have one free variable. For underdetermined reactions,
  // try small positive free-variable assignments and choose the smallest solution.
  // This search is bounded, deterministic, and never claims general completeness.
  const selection: { best?: bigint[] } = {};
  const maxAssignments = 10_000;
  let attempts = 0;
  const assigned = Array<Fraction>(parsed.length).fill(fraction(0n));
  function explore(index: number): void {
    if (attempts >= maxAssignments) return;
    if (index < free.length) {
      for (let value = 1; value <= (free.length === 1 ? 1 : 8); value++) {
        assigned[free[index]] = fraction(BigInt(value));
        explore(index + 1);
      }
      return;
    }
    attempts++;
    for (let row = 0; row < pivots.length; row++) {
      let sum = fraction(0n);
      for (const col of free) sum = add(sum, mul(matrix[row][col], assigned[col]));
      assigned[pivots[row]] = neg(sum);
    }
    const candidate = integerCoefficients(assigned);
    if (!candidate) return;
    const sum = (arr: bigint[]) => arr.reduce((a, b) => a + b, 0n);
    const previous = selection.best;
    if (!previous || sum(candidate) < sum(previous) ||
      (sum(candidate) === sum(previous) && candidate.join(",") < previous.join(","))) selection.best = candidate;
  }
  explore(0);
  const best = selection.best;
  if (!best) return failure("NO_POSITIVE_SOLUTION", "No positive solution was found within the supported search limits.");
  if (best.some((value) => value > BigInt(MAX_OUTPUT_COEFFICIENT)))
    return failure("COEFFICIENT_LIMIT", `A balancing coefficient exceeds ${MAX_OUTPUT_COEFFICIENT}.`);
  const coefficients = best.map(Number);
  const format = (items: ParsedSpecies[], offset: number) => items.map((item, i) =>
    `${coefficients[offset + i] === 1 ? "" : coefficients[offset + i]}${item.display}`).join(" + ");
  return { ok: true, balanced: `${format(left, 0)} -> ${format(right, left.length)}`, coefficients };
}

/** Exact match by element symbol, name, or atomic number (case-insensitive). */
export function findPeriodicTableElements(query: string): Element[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return PERIODIC_TABLE.filter((element) =>
    element.symbol.toLowerCase() === needle ||
    element.name.toLowerCase() === needle ||
    String(element.z) === needle);
}

export const periodicTableTool = tool({
  description: "Look up an element by exact symbol, name or atomic number. Returns approximate mass and group, not electron configuration.",
  inputSchema: z.object({ query: z.string().trim().min(1).max(80) }),
  execute: async ({ query }: { query: string }) => ({ hits: findPeriodicTableElements(query) }),
});

export const reactionBalancerTool = tool({
  description: "Balance neutral chemical equations, including brackets and state symbols. Existing coefficients are recalculated. Charged species and hydrates are unsupported. Returns balanced coefficients or an error.",
  inputSchema: z.object({
    equation: z.string().trim().min(1).max(MAX_EQUATION_LENGTH)
      .describe("Example: Fe + O2 -> Fe2O3"),
  }),
  execute: async ({ equation }: { equation: string }) => balanceEquation(equation),
});
