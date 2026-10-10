"use client";

import "client-only";
import { useEffect, useId, useRef, useState } from "react";
import type JXG from "jsxgraph";
import {
  asPhysicsDiagramOutput,
  type ConvergingLensDiagramSpec,
  type FreeBodyDiagramSpec,
  type MotionGraphDiagramSpec,
  type PhysicsDiagramSpec,
} from "./diagram-types";
import styles from "./physics-diagram-widget.module.css";

const COLOURS = {
  ink: "#26323b",
  muted: "#687782",
  blue: "#246b8e",
  red: "#b43f3f",
  green: "#34785a",
  gold: "#a76c18",
  block: "#dcebf2",
};

const FIXED = { fixed: true, highlight: false } as const;
const TEXT = {
  ...FIXED,
  display: "internal" as const,
  fontSize: 14,
  color: COLOURS.ink,
};

function labelFor(kind: PhysicsDiagramSpec["kind"]) {
  if (kind === "free-body") return "Forces";
  if (kind === "motion-graph") return "Graph";
  return "Optics";
}

function accessibleSummary(spec: PhysicsDiagramSpec) {
  if (spec.kind === "free-body") {
    const forces = spec.forces
      .map((force) => `${force.label}, directed ${force.direction}`)
      .join("; ");
    return `${spec.description} Forces on ${spec.objectLabel}: ${forces}.`;
  }
  if (spec.kind === "motion-graph") {
    const points = spec.points.map((point) => `(${point.x}, ${point.y})`).join(", ");
    return `${spec.description} ${spec.yLabel} against ${spec.xLabel}. Plotted points: ${points}.`;
  }
  return `${spec.description} Focal length ${spec.focalLength}; object distance ${spec.objectDistance}; object height ${spec.objectHeight}.`;
}

function addFreeBodyDiagram(board: JXG.Board, spec: FreeBodyDiagramSpec) {
  if (spec.showSurface) {
    board.create("segment", [[-5, -1.25], [5, -1.25]], {
      ...FIXED,
      strokeColor: COLOURS.muted,
      strokeWidth: 2,
    });
  }
  board.create(
    "polygon",
    [[-1.55, -1.2], [1.55, -1.2], [1.55, 1.15], [-1.55, 1.15]],
    {
      ...FIXED,
      fillColor: COLOURS.block,
      fillOpacity: 1,
      borders: { strokeColor: COLOURS.blue, strokeWidth: 2 },
      vertices: { visible: false },
    },
  );
  board.create("text", [-1.15, -0.55, spec.objectLabel], {
    ...TEXT,
    fontSize: 15,
    cssStyle: "font-weight: 700",
  });

  const magnitudes = spec.forces.map((force) => force.magnitude ?? 1);
  const maximum = Math.max(...magnitudes, 1);
  const directionData = {
    up: { vector: [0, 1], colour: COLOURS.green, labelOffset: [0.18, 0.1] },
    down: { vector: [0, -1], colour: COLOURS.gold, labelOffset: [0.18, -0.4] },
    left: { vector: [-1, 0], colour: COLOURS.red, labelOffset: [-1.15, 0.3] },
    right: { vector: [1, 0], colour: COLOURS.blue, labelOffset: [0.18, 0.3] },
  } as const;

  for (const force of spec.forces) {
    const data = directionData[force.direction];
    const length = 2.25 + ((force.magnitude ?? 1) / maximum) * 1.35;
    const end: [number, number] = [data.vector[0] * length, data.vector[1] * length];
    board.create("arrow", [[0, 0], end], {
      ...FIXED,
      strokeColor: data.colour,
      strokeWidth: 4,
    });
    board.create(
      "text",
      [end[0] + data.labelOffset[0], end[1] + data.labelOffset[1], force.label],
      { ...TEXT, color: data.colour },
    );
  }
}

function graphBounds(points: MotionGraphDiagramSpec["points"]): [number, number, number, number] {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const xMin = Math.min(0, ...xs);
  const xMax = Math.max(0, ...xs);
  const yMin = Math.min(0, ...ys);
  const yMax = Math.max(0, ...ys);
  const xPad = Math.max((xMax - xMin) * 0.14, 1);
  const yPad = Math.max((yMax - yMin) * 0.2, 1);
  return [xMin - xPad, yMax + yPad, xMax + xPad, yMin - yPad];
}

function addMotionGraph(board: JXG.Board, spec: MotionGraphDiagramSpec) {
  const points = spec.points.map((point) =>
    board.create("point", [point.x, point.y], {
      ...FIXED,
      name: "",
      size: 2.5,
      strokeColor: COLOURS.blue,
      fillColor: COLOURS.blue,
    }),
  );
  for (let index = 1; index < points.length; index += 1) {
    board.create("segment", [points[index - 1], points[index]], {
      ...FIXED,
      strokeColor: COLOURS.blue,
      strokeWidth: 3,
    });
  }
  if (spec.seriesLabel) {
    const [left, top] = board.getBoundingBox();
    board.create("text", [left + 0.35, top - 0.55, spec.seriesLabel], {
      ...TEXT,
      color: COLOURS.blue,
      fontSize: 13,
    });
  }
}

function addOpticalMark(board: JXG.Board, x: number, text: string) {
  board.create("point", [x, 0], {
    ...FIXED,
    name: "",
    size: 2,
    strokeColor: COLOURS.ink,
    fillColor: COLOURS.ink,
  });
  board.create("text", [x - 0.15, -0.45, text], TEXT);
}

function addConvergingLensDiagram(board: JXG.Board, spec: ConvergingLensDiagramSpec) {
  const imageDistance = 1 / (1 / spec.focalLength - 1 / spec.objectDistance);
  const imageHeight = -(imageDistance / spec.objectDistance) * spec.objectHeight;
  const lensHalfHeight = Math.max(spec.objectHeight, Math.abs(imageHeight)) * 1.45;

  board.create("segment", [[-spec.objectDistance * 1.08, 0], [imageDistance * 1.2, 0]], {
    ...FIXED,
    strokeColor: COLOURS.muted,
    strokeWidth: 1.5,
  });
  board.create(
    "curve",
    [
      (t: number) => lensHalfHeight * 0.13 * Math.sin(t),
      (t: number) => lensHalfHeight * Math.cos(t),
      0,
      2 * Math.PI,
    ],
    {
      ...FIXED,
      strokeColor: COLOURS.blue,
      strokeWidth: 3,
      fillColor: COLOURS.block,
      fillOpacity: 0.55,
    },
  );

  addOpticalMark(board, -2 * spec.focalLength, "2F");
  addOpticalMark(board, -spec.focalLength, "F");
  addOpticalMark(board, spec.focalLength, "F");
  addOpticalMark(board, 2 * spec.focalLength, "2F");

  const objectTop: [number, number] = [-spec.objectDistance, spec.objectHeight];
  const imageTop: [number, number] = [imageDistance, imageHeight];
  board.create("arrow", [[-spec.objectDistance, 0], objectTop], {
    ...FIXED,
    strokeColor: COLOURS.ink,
    strokeWidth: 4,
  });
  board.create("text", [-spec.objectDistance, spec.objectHeight * 1.13, "object"], {
    ...TEXT,
    cssStyle: "font-weight: 700",
  });
  board.create("arrow", [[imageDistance, 0], imageTop], {
    ...FIXED,
    strokeColor: COLOURS.red,
    strokeWidth: 4,
  });
  board.create("text", [imageDistance * 1.02, imageHeight * 1.2, "real image"], {
    ...TEXT,
    color: COLOURS.red,
    cssStyle: "font-weight: 700",
  });

  board.create("segment", [objectTop, [0, spec.objectHeight]], {
    ...FIXED,
    strokeColor: COLOURS.gold,
    strokeWidth: 3,
  });
  board.create("arrow", [[0, spec.objectHeight], imageTop], {
    ...FIXED,
    strokeColor: COLOURS.gold,
    strokeWidth: 3,
  });
  board.create("arrow", [objectTop, imageTop], {
    ...FIXED,
    strokeColor: COLOURS.green,
    strokeWidth: 3,
  });
}

function boardOptions(spec: PhysicsDiagramSpec): Partial<JXG.BoardAttributes> {
  if (spec.kind === "motion-graph") {
    return {
      boundingbox: graphBounds(spec.points),
      axis: true,
      defaultAxes: {
        x: {
          name: spec.xLabel,
          withLabel: true,
          label: { position: "rt", offset: [-30, 16], display: "internal", parse: false },
        },
        y: {
          name: spec.yLabel,
          withLabel: true,
          label: { position: "rt", offset: [12, -18], display: "internal", parse: false },
        },
      },
    };
  }
  if (spec.kind === "converging-lens") {
    const imageDistance = 1 / (1 / spec.focalLength - 1 / spec.objectDistance);
    const imageHeight = -(imageDistance / spec.objectDistance) * spec.objectHeight;
    const horizontal = Math.max(spec.objectDistance, imageDistance, 2 * spec.focalLength) * 1.18;
    const vertical = Math.max(spec.objectHeight, Math.abs(imageHeight)) * 1.8;
    return { boundingbox: [-horizontal, vertical, horizontal, -vertical], keepaspectratio: true };
  }
  return { boundingbox: [-6, 5, 6, -5], keepaspectratio: true };
}

export function PhysicsDiagramWidget({ output }: { output: unknown }) {
  const parsed = asPhysicsDiagramOutput(output);
  const boardId = `physics-diagram-${useId().replaceAll(":", "")}`;
  const boardRef = useRef<JXG.Board | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!parsed) return;
    let cancelled = false;
    let runtime: typeof JXG | null = null;

    void import("jsxgraph")
      .then((module) => {
        if (cancelled) return;
        runtime = module.default;
        const board = runtime.JSXGraph.initBoard(boardId, {
          axis: false,
          showCopyright: false,
          showNavigation: false,
          pan: { enabled: false },
          zoom: { wheel: false },
          ...boardOptions(parsed.spec),
        });
        boardRef.current = board;

        try {
          if (parsed.spec.kind === "free-body") addFreeBodyDiagram(board, parsed.spec);
          else if (parsed.spec.kind === "motion-graph") addMotionGraph(board, parsed.spec);
          else addConvergingLensDiagram(board, parsed.spec);
        } catch (cause) {
          runtime.JSXGraph.freeBoard(board);
          boardRef.current = null;
          throw cause;
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      if (boardRef.current && runtime) {
        runtime.JSXGraph.freeBoard(boardRef.current);
        boardRef.current = null;
      }
    };
  }, [boardId, parsed]);

  if (!parsed) return null;

  return (
    <figure className={styles.card} aria-labelledby={`${boardId}-title`}>
      <figcaption className={styles.header}>
        <div>
          <div id={`${boardId}-title`} className={styles.title}>{parsed.spec.title}</div>
          <p className={styles.description}>{parsed.spec.description}</p>
        </div>
        <span className={styles.badge}>{labelFor(parsed.spec.kind)}</span>
      </figcaption>
      {error ? (
        <p className={styles.fallback}>The diagram could not be rendered. The written explanation is still available below.</p>
      ) : (
        <div id={boardId} className={styles.board} aria-hidden="true" />
      )}
      <p className={styles.srOnly}>{accessibleSummary(parsed.spec)}</p>
    </figure>
  );
}
