import { spawnSync } from "node:child_process";
import { loadPromptfooEnv } from "./load-env";

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (typeof result.status === "number") {
    return result.status;
  }

  if (result.error) {
    console.error(result.error.message);
  }
  return 1;
}

const mode = process.argv[2];
const forwardedArgs = process.argv.slice(3);

loadPromptfooEnv();

if (mode !== "eval" && mode !== "validate") {
  console.error("Usage: tsx promptfoo/run-cli.ts <eval|validate> [...args]");
  process.exit(1);
}

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";

const prepareStatus = run(npmCmd, ["run", "promptfoo:prepare"]);
if (prepareStatus !== 0) {
  process.exit(prepareStatus);
}

const promptfooStatus = run(npxCmd, [
  "promptfoo",
  mode,
  "-c",
  "promptfooconfig.yaml",
  ...forwardedArgs,
]);

process.exit(promptfooStatus);
