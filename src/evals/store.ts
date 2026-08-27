import type { EvalRun } from "./types";

let lastRun: EvalRun | null = null;

export function saveEvalRun(run: EvalRun) {
  lastRun = run;
  return lastRun;
}

export function getLastEvalRun() {
  return lastRun;
}
