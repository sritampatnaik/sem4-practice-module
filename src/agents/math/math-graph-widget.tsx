"use client";

import "client-only";
import { useEffect, useId, useRef, useState } from "react";
import type JXG from "jsxgraph";
import { asMathGraphOutput, type FunctionGraphSpec } from "./graph-types";
import styles from "./math-graph-widget.module.css";

const COLOURS = {
  ink: "#26323b",
  muted: "#687782",
  curve: "#246b8e",
  root: "#b43f3f",
  turning: "#34785a",
  intercept: "#8a6d1f",
};

const FIXED = { fixed: true, highlight: false } as const;

function markColour(kind: FunctionGraphSpec["marks"][number]["kind"]) {
  if (kind === "root") return COLOURS.root;
  if (kind === "turning-point") return COLOURS.turning;
  return COLOURS.intercept;
}

function drawFunctionGraph(board: JXG.Board, spec: FunctionGraphSpec) {
  for (const segment of spec.segments) {
    if (segment.length < 2) continue;
    board.create(
      "curve",
      [segment.map((point) => point.x), segment.map((point) => point.y)],
      { ...FIXED, strokeColor: COLOURS.curve, strokeWidth: 2.5 },
    );
  }

  for (const mark of spec.marks) {
    const colour = markColour(mark.kind);
    board.create("point", [mark.x, mark.y], {
      ...FIXED,
      name: "",
      size: 3,
      strokeColor: colour,
      fillColor: colour,
    });
    board.create("text", [mark.x, mark.y, mark.label], {
      ...FIXED,
      anchorX: "middle",
      anchorY: "bottom",
      color: colour,
      fontSize: 12,
      offset: [0, 10],
      parse: false,
    });
  }
}

export function MathGraphWidget({ output }: { output: unknown }) {
  const parsed = asMathGraphOutput(output);
  const boardId = `math-graph-${useId().replaceAll(":", "")}`;
  const boardRef = useRef<JXG.Board | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!parsed) return;
    let cancelled = false;
    let runtime: typeof JXG | null = null;
    const { bounds, xLabel, yLabel } = parsed.spec;

    void import("jsxgraph")
      .then((module) => {
        if (cancelled) return;
        runtime = module.default;
        const board = runtime.JSXGraph.initBoard(boardId, {
          boundingbox: [bounds.xMin, bounds.yMax, bounds.xMax, bounds.yMin],
          axis: true,
          showCopyright: false,
          showNavigation: false,
          pan: { enabled: false },
          zoom: { wheel: false },
          defaultAxes: {
            x: {
              name: xLabel,
              withLabel: true,
              label: { position: "rt", offset: [-30, 16], display: "internal", parse: false },
            },
            y: {
              name: yLabel,
              withLabel: true,
              label: { position: "rt", offset: [12, -18], display: "internal", parse: false },
            },
          },
        });
        boardRef.current = board;

        try {
          drawFunctionGraph(board, parsed.spec);
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

  if (error) {
    return (
      <figure className={styles.card}>
        <figcaption className={styles.caption}>{parsed.spec.title}</figcaption>
        <p className={styles.fallback}>The graph could not be drawn here. The working above still stands.</p>
      </figure>
    );
  }

  return (
    <figure className={styles.card}>
      <figcaption className={styles.caption}>{parsed.spec.title}</figcaption>
      <div id={boardId} className={styles.board} role="img" aria-label={`Graph of ${parsed.spec.title}`} />
      {parsed.spec.clamped ? (
        <p className={styles.note}>The view is trimmed vertically so the shape stays readable.</p>
      ) : null}
    </figure>
  );
}
