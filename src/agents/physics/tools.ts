import { tool } from "ai";
import { z } from "zod";

const FORMULAS: Array<{ id: string; name: string; expression: string; notes: string }> = [
  { id: "f-ma", name: "Newton's second law", expression: "F = ma", notes: "F in N, m in kg, a in m/s^2" },
  { id: "suvat-v", name: "SUVAT velocity", expression: "v = u + at", notes: "constant acceleration" },
  { id: "suvat-s", name: "SUVAT displacement", expression: "s = ut + 1/2 at^2", notes: "constant acceleration" },
  { id: "ke", name: "Kinetic energy", expression: "E_k = 1/2 mv^2", notes: "joules" },
  { id: "gpe", name: "Gravitational potential energy", expression: "E_p = mgh", notes: "near Earth, g ≈ 9.81 m/s^2" },
  { id: "ohm", name: "Ohm's law", expression: "V = IR", notes: "V in V, I in A, R in Ω" },
  { id: "power-elec", name: "Electrical power", expression: "P = IV = I^2 R = V^2 / R", notes: "watts" },
  { id: "wave", name: "Wave equation", expression: "v = f λ", notes: "f in Hz, λ in m" },
  { id: "density", name: "Density", expression: "ρ = m / V", notes: "kg/m^3" },
  { id: "pressure", name: "Pressure", expression: "p = F / A", notes: "pascals" },
  { id: "lens", name: "Thin lens", expression: "1/f = 1/u + 1/v", notes: "real-is-positive convention at O-Level" },
];

const TO_SI: Record<string, { si: string; factor: number }> = {
  mm: { si: "m", factor: 0.001 },
  cm: { si: "m", factor: 0.01 },
  m: { si: "m", factor: 1 },
  km: { si: "m", factor: 1000 },
  "m/s": { si: "m/s", factor: 1 },
  "km/h": { si: "m/s", factor: 1000 / 3600 },
  g: { si: "kg", factor: 0.001 },
  kg: { si: "kg", factor: 1 },
  N: { si: "N", factor: 1 },
  kN: { si: "N", factor: 1000 },
  J: { si: "J", factor: 1 },
  kJ: { si: "J", factor: 1000 },
  W: { si: "W", factor: 1 },
  kW: { si: "W", factor: 1000 },
  C: { si: "K", factor: 1 },
  K: { si: "K", factor: 1 },
  min: { si: "s", factor: 60 },
  h: { si: "s", factor: 3600 },
  s: { si: "s", factor: 1 },
};

function toSi(value: number, unit: string) {
  if (unit === "C") return { value: value + 273.15, unit: "K" };
  const mapped = TO_SI[unit];
  if (!mapped) return null;
  return { value: value * mapped.factor, unit: mapped.si };
}

function fromSi(value: number, siUnit: string, target: string) {
  if (target === "C" && siUnit === "K") return value - 273.15;
  const mapped = TO_SI[target];
  if (!mapped || mapped.si !== siUnit) return null;
  return value / mapped.factor;
}

export const formulaLookupTool = tool({
  description: "Look up a standard physics formula used in Singapore syllabuses.",
  inputSchema: z.object({
    topic: z.string().describe("Keyword such as 'kinetic energy' or 'ohm'"),
  }),
  execute: async ({ topic }: { topic: string }) => {
    const needle = topic.toLowerCase();
    const hits = FORMULAS.filter(
      (row) =>
        row.id.includes(needle) ||
        row.name.toLowerCase().includes(needle) ||
        row.expression.toLowerCase().includes(needle),
    );
    return { hits: hits.length ? hits : FORMULAS.slice(0, 4) };
  },
});

export const unitConverterTool = tool({
  description: "Convert a physical quantity between common school units via SI.",
  inputSchema: z.object({
    value: z.number(),
    from: z.string().describe("Unit such as km/h, cm, C, kJ"),
    to: z.string(),
  }),
  execute: async ({ value, from, to }: { value: number; from: string; to: string }) => {
    const si = toSi(value, from);
    if (!si) {
      return { ok: false, error: `Unsupported source unit ${from}` };
    }
    const converted = fromSi(si.value, si.unit, to);
    if (converted === null) {
      return { ok: false, error: `Cannot convert ${from} to ${to}` };
    }
    return {
      ok: true,
      input: { value, from },
      si,
      output: { value: Number(converted.toPrecision(8)), to },
    };
  },
});
