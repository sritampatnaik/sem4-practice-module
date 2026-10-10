module.exports = (output) => {
  let result;

  try {
    result = JSON.parse(output);
  } catch (error) {
    return {
      pass: false,
      score: 0,
      reason: `Could not parse METS eval result: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const checks = Array.isArray(result.checks) ? result.checks : [];
  const componentResults = checks.map((check) => ({
    pass: Boolean(check.passed),
    score: check.passed ? 1 : 0,
    reason: `${check.name}: ${check.detail}`,
  }));

  return {
    pass: Boolean(result.passed),
    score: typeof result.accuracy === "number" ? result.accuracy : 0,
    reason: result.error
      ? `Eval error: ${result.error}`
      : `${result.suiteId ?? "suite"} / ${result.title ?? "item"} => accuracy ${result.accuracy ?? 0}`,
    componentResults,
  };
};
