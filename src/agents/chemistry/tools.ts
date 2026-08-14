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
  { z: 1, symbol: "H", name: "Hydrogen", mass: 1.008, group: "1" },
  { z: 2, symbol: "He", name: "Helium", mass: 4.003, group: "18" },
  { z: 3, symbol: "Li", name: "Lithium", mass: 6.94, group: "1" },
  { z: 4, symbol: "Be", name: "Beryllium", mass: 9.012, group: "2" },
  { z: 5, symbol: "B", name: "Boron", mass: 10.81, group: "13" },
  { z: 6, symbol: "C", name: "Carbon", mass: 12.01, group: "14" },
  { z: 7, symbol: "N", name: "Nitrogen", mass: 14.01, group: "15" },
  { z: 8, symbol: "O", name: "Oxygen", mass: 16.0, group: "16" },
  { z: 9, symbol: "F", name: "Fluorine", mass: 19.0, group: "17" },
  { z: 10, symbol: "Ne", name: "Neon", mass: 20.18, group: "18" },
  { z: 11, symbol: "Na", name: "Sodium", mass: 22.99, group: "1" },
  { z: 12, symbol: "Mg", name: "Magnesium", mass: 24.31, group: "2" },
  { z: 13, symbol: "Al", name: "Aluminium", mass: 26.98, group: "13" },
  { z: 14, symbol: "Si", name: "Silicon", mass: 28.09, group: "14" },
  { z: 15, symbol: "P", name: "Phosphorus", mass: 30.97, group: "15" },
  { z: 16, symbol: "S", name: "Sulfur", mass: 32.06, group: "16" },
  { z: 17, symbol: "Cl", name: "Chlorine", mass: 35.45, group: "17" },
  { z: 18, symbol: "Ar", name: "Argon", mass: 39.95, group: "18" },
  { z: 19, symbol: "K", name: "Potassium", mass: 39.1, group: "1" },
  { z: 20, symbol: "Ca", name: "Calcium", mass: 40.08, group: "2" },
  { z: 24, symbol: "Cr", name: "Chromium", mass: 52.0, group: "transition" },
  { z: 25, symbol: "Mn", name: "Manganese", mass: 54.94, group: "transition" },
  { z: 26, symbol: "Fe", name: "Iron", mass: 55.85, group: "transition" },
  { z: 29, symbol: "Cu", name: "Copper", mass: 63.55, group: "transition" },
  { z: 30, symbol: "Zn", name: "Zinc", mass: 65.38, group: "transition" },
  { z: 35, symbol: "Br", name: "Bromine", mass: 79.9, group: "17" },
  { z: 47, symbol: "Ag", name: "Silver", mass: 107.87, group: "transition" },
  { z: 53, symbol: "I", name: "Iodine", mass: 126.9, group: "17" },
  { z: 56, symbol: "Ba", name: "Barium", mass: 137.33, group: "2" },
  { z: 82, symbol: "Pb", name: "Lead", mass: 207.2, group: "14" },
];

function parseFormula(formula: string) {
  const tokens = formula.match(/[A-Z][a-z]?|\d+|\(|\)/g);
  if (!tokens) return {};
  const stack: Array<Record<string, number>> = [{}];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token === "(") {
      stack.push({});
    } else if (token === ")") {
      const group = stack.pop() ?? {};
      const next = tokens[i + 1];
      const multiplier = next && /^\d+$/.test(next) ? Number(next) : 1;
      if (next && /^\d+$/.test(next)) i += 1;
      const parent = stack[stack.length - 1];
      for (const [el, n] of Object.entries(group)) {
        parent[el] = (parent[el] ?? 0) + n * multiplier;
      }
    } else if (/^[A-Z]/.test(token)) {
      const next = tokens[i + 1];
      const multiplier = next && /^\d+$/.test(next) ? Number(next) : 1;
      if (next && /^\d+$/.test(next)) i += 1;
      const current = stack[stack.length - 1];
      current[token] = (current[token] ?? 0) + multiplier;
    }
  }

  return stack[0];
}

function parseSide(side: string) {
  return side.split("+").map((part) => part.trim()).filter(Boolean);
}

function balanceEquation(equation: string) {
  const [lhsRaw, rhsRaw] = equation.split(/->|=>|=|→/).map((side) => side?.trim());
  if (!lhsRaw || !rhsRaw) {
    return { ok: false as const, error: "Use the form H2 + O2 -> H2O" };
  }

  const left = parseSide(lhsRaw);
  const right = parseSide(rhsRaw);
  const species = [...left, ...right];
  const parsed = species.map(parseFormula);
  const elements = Array.from(
    new Set(parsed.flatMap((row) => Object.keys(row))),
  );

  const coeffs = new Array(species.length).fill(1);
  const limit = species.length === 0 ? 0 : Math.pow(8, species.length);
  for (let n = 0; n < Math.min(limit, 30000); n += 1) {
    let x = n;
    for (let i = 0; i < species.length; i += 1) {
      coeffs[i] = (x % 8) + 1;
      x = Math.floor(x / 8);
    }

    const balanced = elements.every((el) => {
      const leftCount = left.reduce(
        (sum, _species, index) => sum + (parsed[index][el] ?? 0) * coeffs[index],
        0,
      );
      const rightCount = right.reduce(
        (sum, _species, index) =>
          sum + (parsed[left.length + index][el] ?? 0) * coeffs[left.length + index],
        0,
      );
      return leftCount === rightCount && leftCount > 0;
    });

    if (balanced) {
      const format = (items: string[], offset: number) =>
        items
          .map((item, index) => `${coeffs[offset + index] === 1 ? "" : coeffs[offset + index]}${item}`)
          .join(" + ");
      return {
        ok: true as const,
        balanced: `${format(left, 0)} -> ${format(right, left.length)}`,
        coefficients: coeffs,
      };
    }
  }

  return { ok: false as const, error: "Could not balance with small integer coefficients." };
}

export const periodicTableTool = tool({
  description: "Look up an element by symbol, name, or atomic number.",
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }: { query: string }) => {
    const needle = query.trim().toLowerCase();
    const hits = PERIODIC_TABLE.filter(
      (el) =>
        el.symbol.toLowerCase() === needle ||
        el.name.toLowerCase() === needle ||
        String(el.z) === needle,
    );
    return { hits };
  },
});

export const reactionBalancerTool = tool({
  description: "Balance a chemical equation written as reactants -> products.",
  inputSchema: z.object({
    equation: z.string().describe("Example: Fe + O2 -> Fe2O3"),
  }),
  execute: async ({ equation }: { equation: string }) => balanceEquation(equation),
});
