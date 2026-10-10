export type GraphPoint = { x: number; y: number };

export type GraphMark = {
  kind: "root" | "turning-point" | "y-intercept";
  x: number;
  y: number;
  label: string;
};

/**
 * A sampled curve. The server does the evaluation and sends points, so the
 * client never has to evaluate a student-supplied expression.
 *
 * `segments` holds one polyline per continuous piece: a break marks an
 * asymptote or a gap in the domain, so the curve is not drawn straight
 * across it.
 */
export type FunctionGraphSpec = {
  kind: "function-graph";
  title: string;
  expression: string;
  variable: string;
  xLabel: string;
  yLabel: string;
  segments: GraphPoint[][];
  marks: GraphMark[];
  bounds: { xMin: number; xMax: number; yMin: number; yMax: number };
  clamped?: boolean;
};

export type MathGraphSpec = FunctionGraphSpec;

export type MathGraphOutput = {
  renderer: "jsxgraph";
  spec: MathGraphSpec;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Client-safe guard: never trust the shape of a tool payload. */
export function asMathGraphOutput(value: unknown): MathGraphOutput | null {
  if (!isRecord(value) || value.renderer !== "jsxgraph" || !isRecord(value.spec)) return null;
  const spec = value.spec;
  if (spec.kind !== "function-graph") return null;
  if (!Array.isArray(spec.segments) || !Array.isArray(spec.marks) || !isRecord(spec.bounds)) return null;
  return value as MathGraphOutput;
}
