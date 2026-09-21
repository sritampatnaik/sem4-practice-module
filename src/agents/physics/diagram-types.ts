export type DiagramDirection = "up" | "down" | "left" | "right";

export type FreeBodyDiagramSpec = {
  kind: "free-body";
  title: string;
  description: string;
  objectLabel: string;
  showSurface: boolean;
  forces: Array<{
    direction: DiagramDirection;
    label: string;
    magnitude?: number;
  }>;
};

export type MotionGraphDiagramSpec = {
  kind: "motion-graph";
  title: string;
  description: string;
  xLabel: string;
  yLabel: string;
  seriesLabel?: string;
  points: Array<{ x: number; y: number }>;
};

export type ConvergingLensDiagramSpec = {
  kind: "converging-lens";
  title: string;
  description: string;
  focalLength: number;
  objectDistance: number;
  objectHeight: number;
};

export type PhysicsDiagramSpec =
  | FreeBodyDiagramSpec
  | MotionGraphDiagramSpec
  | ConvergingLensDiagramSpec;

export type PhysicsDiagramOutput = {
  renderer: "jsxgraph";
  spec: PhysicsDiagramSpec;
  derived?: {
    imageDistance: number;
    imageHeight: number;
    magnification: number;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function asPhysicsDiagramOutput(value: unknown): PhysicsDiagramOutput | null {
  if (!isRecord(value) || value.renderer !== "jsxgraph" || !isRecord(value.spec)) {
    return null;
  }
  if (
    value.spec.kind !== "free-body" &&
    value.spec.kind !== "motion-graph" &&
    value.spec.kind !== "converging-lens"
  ) {
    return null;
  }
  return value as PhysicsDiagramOutput;
}
