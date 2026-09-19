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
