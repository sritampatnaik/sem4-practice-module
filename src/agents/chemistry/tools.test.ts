import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  balanceEquation,
  findPeriodicTableElements,
  PERIODIC_TABLE,
} from "./tools";

describe("Periodic Table Tool", () => {
  it("contains all 118 elements with unique symbols", () => {
    assert.equal(PERIODIC_TABLE.length, 118);

    assert.equal(
      new Set(PERIODIC_TABLE.map((element) => element.symbol)).size,
      118,
    );
  });

  it("has atomic numbers from 1 to 118", () => {
    assert.deepEqual(
      PERIODIC_TABLE.map((element) => element.z),
      Array.from({ length: 118 }, (_, index) => index + 1),
    );
  });

  it("can look up all elements by symbol", () => {
    for (const element of PERIODIC_TABLE) {
      assert.equal(
        findPeriodicTableElements(element.symbol)[0]?.z,
        element.z,
      );
    }
  });

  it("handles case-insensitive searches and whitespace", () => {
    const result = findPeriodicTableElements("  cArBoN  ");

    assert.equal(result.length, 1);
    assert.equal(result[0]?.symbol, "C");
  });

  it("supports lookup by atomic number", () => {
    assert.equal(
      findPeriodicTableElements("6")[0]?.name,
      "Carbon",
    );
  });

  it("can retrieve the last element", () => {
    assert.equal(findPeriodicTableElements("Og")[0]?.z, 118);
  });

  it("returns an empty array for unknown elements", () => {
    assert.deepEqual(findPeriodicTableElements("Xx"), []);
  });
});

describe("Reaction Balancer Tool", () => {
  it("balances a simple chemical equation", () => {
    assert.deepEqual(balanceEquation("Fe + O2 -> Fe2O3"), {
      ok: true,
      balanced: "4Fe + 3O2 -> 2Fe2O3",
      coefficients: [4, 3, 2],
    });
  });

  it("preserves an already balanced equation", () => {
    assert.deepEqual(balanceEquation("2H2 + O2 -> 2H2O"), {
      ok: true,
      balanced: "2H2 + O2 -> 2H2O",
      coefficients: [2, 1, 2],
    });
  });

  it("balances equations with multiple coefficients", () => {
    assert.deepEqual(balanceEquation("Al + HCl -> AlCl3 + H2"), {
      ok: true,
      balanced: "2Al + 6HCl -> 2AlCl3 + 3H2",
      coefficients: [2, 6, 2, 3],
    });
  });

  it("preserves state symbols", () => {
    assert.deepEqual(balanceEquation("H2(g) + O2(g) -> H2O(l)"), {
      ok: true,
      balanced: "2H2(g) + O2(g) -> 2H2O(l)",
      coefficients: [2, 1, 2],
    });
  });

  it("handles chemical formulas with brackets", () => {
    assert.deepEqual(
      balanceEquation("Ca(OH)2 + HCl -> CaCl2 + H2O"),
      {
        ok: true,
        balanced: "Ca(OH)2 + 2HCl -> CaCl2 + 2H2O",
        coefficients: [1, 2, 1, 2],
      },
    );
  });

  it("accepts multi-digit atom subscripts", () => {
    assert.deepEqual(balanceEquation("H2 + O2 -> H22O"), {
      ok: true,
      balanced: "22H2 + O2 -> 2H22O",
      coefficients: [22, 1, 2],
    });
  });

  it("returns a helpful error for empty input", () => {
    const result = balanceEquation("");

    assert.equal(result.ok, false);

    if (!result.ok) {
      assert.equal(
        result.error,
        "Enter a chemical equation to balance.",
      );
    }
  });

  it("rejects invalid or unsupported equations", () => {
    const invalidEquations = [
      "H2O -> H2O)",
      "H2O -> H2O!",
      "Xx + O2 -> XxO2",
      "+ -> +",
      "H2 + O2 ->",
      "H2 -> H2 -> H2",
      "H2 + O2 -> CO2",
      "H2 + O2 -> H0O",
      "Na+ + Cl- -> NaCl",
      "CuSO4.5H2O -> CuSO4 + H2O",
      "H2 + O2 + N2 -> H2O + N2 + NO + NH3",
      `${"H".repeat(257)} -> H2`,
    ];

    for (const equation of invalidEquations) {
      const result = balanceEquation(equation);

      assert.equal(
        result.ok,
        false,
        `Expected invalid or unsupported input to fail: ${equation}`,
      );

      if (!result.ok) {
        assert.ok(result.error.length > 0);
      }
    }
  });
});