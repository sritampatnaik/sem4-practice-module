import { evaluate, simplify } from "mathjs";
import { tool } from "ai";
import { z } from "zod";

export const equationSolverTool = tool({
  description:
    "Evaluate or simplify a mathematical expression. Use this to verify arithmetic, algebra, and numeric substitution. Provide mathjs-compatible syntax.",
  inputSchema: z.object({
    expression: z
      .string()
      .describe("Expression such as '2x + 3x', 'sin(pi/2)', or 'derivative(x^2, x)'"),
    mode: z.enum(["evaluate", "simplify"]).default("evaluate"),
  }),
  execute: async ({
    expression,
    mode,
  }: {
    expression: string;
    mode: "evaluate" | "simplify";
  }) => {
    try {
      if (mode === "simplify") {
        return {
          ok: true,
          mode,
          expression,
          result: simplify(expression).toString(),
        };
      }

      const result = evaluate(expression);
      return {
        ok: true,
        mode,
        expression,
        result: typeof result === "number" ? Number(result.toPrecision(8)) : String(result),
      };
    } catch (error) {
      return {
        ok: false,
        mode,
        expression,
        error: error instanceof Error ? error.message : "Could not evaluate expression",
        hint: "Rewrite using mathjs syntax, e.g. x^2, sqrt(x), sin(pi/6), or (a+b)^2.",
      };
    }
  },
});
