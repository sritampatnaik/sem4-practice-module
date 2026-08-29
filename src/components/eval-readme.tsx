import Link from "next/link";
import { EVAL_SUITE_LABELS } from "@/evals/evaluator-types";
import type { EvalSuiteId } from "@/evals/types";

const OWNERS: Array<{
  id: EvalSuiteId | "routing+concierge";
  href: string;
  person: string;
  suite: string;
  folder: string;
  passWhen: string;
}> = [
  {
    id: "routing+concierge",
    href: "#orchestration",
    person: "Sritam Patnaik",
    suite: "Router + Concierge",
    folder: "src/agents/orchestration/",
    passWhen: "Route labels match gold. Concierge greets or clarifies only.",
  },
  {
    id: "math",
    href: "#math",
    person: "Gu Haixiang",
    suite: EVAL_SUITE_LABELS.math,
    folder: "src/agents/math/",
    passWhen: "In-band working. equationSolver / documentSearch when required.",
  },
  {
    id: "physics",
    href: "#physics",
    person: "Chua Hieng Weih",
    suite: EVAL_SUITE_LABELS.physics,
    folder: "src/agents/physics/",
    passWhen: "Principle → formula → SI units. formulaLookup / unitConverter.",
  },
  {
    id: "chemistry",
    href: "#chemistry",
    person: "Lizabeth Annabel Tukiman",
    suite: EVAL_SUITE_LABELS.chemistry,
    folder: "src/agents/chemistry/",
    passWhen: "periodicTable / reactionBalancer before quoting data.",
  },
  {
    id: "testing",
    href: "#testing",
    person: "Muhammad Harun Bin Abdul Rashid",
    suite: EVAL_SUITE_LABELS.testing,
    folder: "src/agents/testing/",
    passWhen: "Exactly one quiz or flashcard widget. Refuse live papers.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Edit only your gold items",
    href: "/evals/datasets",
    tab: "Datasets",
    body: "Filter to your agent. Open an item, edit the JSON, save. Add a new item if you need a case the current ten miss. Do not rewrite another person's suite.",
  },
  {
    n: "2",
    title: "Keep your judge on",
    href: "/evals/evaluators",
    tab: "Evaluators",
    body: "Code scaffold runs on every suite. Each agent also has its own LLM judge. Leave yours enabled. Do not turn off someone else's judge to make your score look better.",
  },
  {
    n: "3",
    title: "Run your row only",
    href: "/evals/scores",
    tab: "Scores",
    body: "Pick a model on your row, then Run. Run all fires every agent and costs more. Filter history to your agent to compare latest vs previous and to see the best model for you.",
  },
];

const FIELDS = [
  {
    path: "input.message",
    meaning: "The student prompt the live agent will receive.",
  },
  {
    path: "input.profile",
    meaning: "Name, gradeLevel (primary / secondary / jc), diagnostic, notes.",
  },
  {
    path: "output.must",
    meaning:
      "Required tool names and phrases that must appear. Tool names such as equationSolver are checked as tool calls.",
  },
  {
    path: "output.mustNot",
    meaning: "Phrases that fail the item if they appear (university dump, wrong widget, etc.).",
  },
  {
    path: "output.agent / intent / subject / gradeLevel",
    meaning: "Gold routing labels. Router items score these. Teaching items should still match the band.",
  },
  {
    path: "metadata.title / contract / goldReply",
    meaning: "Human title, the pass contract, and the sample reply the judge compares against.",
  },
];

const AGENTS: Array<{
  id: string;
  name: string;
  owner: string;
  suites: string;
  tools: string;
  do: string;
  dont: string;
}> = [
  {
    id: "orchestration",
    name: "Orchestration",
    owner: "Sritam Patnaik",
    suites: "Router, Concierge",
    tools: "No specialist tools. Router only classifies.",
    do: "Kinematics is Physics. Quizzes and flashcards go to Testing. Greetings stay on Concierge.",
    dont: "Do not teach the lesson on a Router or Concierge item.",
  },
  {
    id: "math",
    name: "Math",
    owner: "Gu Haixiang",
    suites: "Math",
    tools: "equationSolver, documentSearch",
    do: "Show working. Stay in the named band. Verify numbers before the final answer.",
    dont: "Do not teach Maclaurin or other university methods on O-Level or Primary items. Do not emit a quiz.",
  },
  {
    id: "physics",
    name: "Physics",
    owner: "Chua Hieng Weih",
    suites: "Physics",
    tools: "formulaLookup, unitConverter, documentSearch",
    do: "Principle, then formula, then SI units. Look up formulae before quoting them.",
    dont: "Do not skip units. Do not jump to JC content on an O-Level item.",
  },
  {
    id: "chemistry",
    name: "Chemistry",
    owner: "Lizabeth Annabel Tukiman",
    suites: "Chemistry",
    tools: "periodicTable, reactionBalancer, documentSearch",
    do: "Call the table or balancer before quoting data. Keep facts syllabus-safe.",
    dont: "Do not invent atomic numbers. Do not write a quiz widget here.",
  },
  {
    id: "testing",
    name: "Testing",
    owner: "Muhammad Harun Bin Abdul Rashid",
    suites: "Testing",
    tools: "createMcqSet or createFlashcards — never both",
    do: "Exactly one widget. Original items. Short study note after the tool.",
    dont: "Do not reprint live SEAB papers. Do not teach the full lesson.",
  },
];

export function EvalReadme() {
  return (
    <div className="grid gap-6">
      <section className="ui-card overflow-hidden">
        <div className="px-4 py-3">
          <p className="ui-label">For agent owners</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            How to eval your agent
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--bui-ink-2)]">
            Each of you owns one specialist. The desk runs that agent against gold
            items, then scores accuracy, latency, and cost. Stay in your folder.
            Stay on your suite.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 border-t border-[var(--bui-line)] px-4 py-3">
          {OWNERS.map((owner) => (
            <a
              key={owner.href}
              href={owner.href}
              className="ui-chip no-underline hover:bg-[var(--bui-hover)] hover:text-[var(--bui-ink)]"
            >
              {owner.suite}
            </a>
          ))}
        </div>
      </section>

      <section className="ui-card overflow-hidden">
        <div className="px-4 py-3">
          <p className="ui-label">Who runs which eval</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Your suite</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[0.6875rem] font-medium tracking-wide text-[var(--bui-ink-3)] uppercase">
              <tr className="border-t border-[var(--bui-line)]">
                <th className="px-4 py-2.5">Person</th>
                <th className="px-4 py-2.5">Eval</th>
                <th className="px-4 py-2.5">Folder</th>
                <th className="px-4 py-2.5">A turn passes when</th>
              </tr>
            </thead>
            <tbody>
              {OWNERS.map((owner) => (
                <tr key={owner.person} className="border-t border-[var(--bui-line)]">
                  <td className="px-4 py-3">{owner.person}</td>
                  <td className="px-4 py-3">
                    <a href={owner.href} className="text-[var(--bui-ink)] no-underline hover:underline">
                      {owner.suite}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <code className="font-mono text-xs text-[var(--bui-ink-2)]">{owner.folder}</code>
                  </td>
                  <td className="px-4 py-3 text-[var(--bui-ink-2)]">{owner.passWhen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((step) => (
          <article key={step.n} className="ui-card px-4 py-4">
            <p className="ui-label">Step {step.n}</p>
            <h3 className="mt-1 text-base font-semibold tracking-tight">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--bui-ink-2)]">{step.body}</p>
            <Link
              href={step.href}
              className="mt-3 inline-flex text-sm font-medium text-[var(--bui-ink)] no-underline hover:underline"
            >
              Open {step.tab}
            </Link>
          </article>
        ))}
      </section>

      <section className="ui-card overflow-hidden">
        <div className="px-4 py-3">
          <p className="ui-label">Gold JSON</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">What each field does</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--bui-ink-2)]">
            Datasets is a JSON editor. The live model never sees{" "}
            <code className="font-mono text-xs">goldReply</code> — that is only for
            the judge. Tight <code className="font-mono text-xs">must</code> /
            <code className="font-mono text-xs"> mustNot</code> lists fail less
            from wording luck.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[0.6875rem] font-medium tracking-wide text-[var(--bui-ink-3)] uppercase">
              <tr className="border-t border-[var(--bui-line)]">
                <th className="px-4 py-2.5">Field</th>
                <th className="px-4 py-2.5">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {FIELDS.map((field) => (
                <tr key={field.path} className="border-t border-[var(--bui-line)]">
                  <td className="px-4 py-3 align-top">
                    <code className="font-mono text-xs">{field.path}</code>
                  </td>
                  <td className="px-4 py-3 text-[var(--bui-ink-2)]">{field.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3">
        {AGENTS.map((agent) => (
          <article
            key={agent.id}
            id={agent.id}
            className="ui-card scroll-mt-6 overflow-hidden"
          >
            <div className="px-4 py-3">
              <p className="ui-label">{agent.owner}</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">{agent.name}</h2>
              <p className="mt-1 text-sm text-[var(--bui-ink-2)]">
                Suite: {agent.suites}. Tools: {agent.tools}
              </p>
            </div>
            <div className="grid gap-px bg-[var(--bui-line)] sm:grid-cols-2">
              <div className="bg-[var(--bui-surface)] px-4 py-3">
                <p className="ui-label">Do</p>
                <p className="mt-1 text-sm leading-6">{agent.do}</p>
              </div>
              <div className="bg-[var(--bui-surface)] px-4 py-3">
                <p className="ui-label">Do not</p>
                <p className="mt-1 text-sm leading-6">{agent.dont}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="ui-card overflow-hidden">
        <div className="px-4 py-3">
          <p className="ui-label">Scores</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">How a run is judged</h2>
        </div>
        <ul className="grid gap-0 border-t border-[var(--bui-line)] text-sm leading-6 text-[var(--bui-ink-2)]">
          <li className="border-b border-[var(--bui-line)] px-4 py-3">
            An item passes only if every enabled evaluator for that suite passes.
            Default threshold is 0.7.
          </li>
          <li className="border-b border-[var(--bui-line)] px-4 py-3">
            Code scaffold is deterministic: routing labels, required tools, must /
            must-not phrases.
          </li>
          <li className="border-b border-[var(--bui-line)] px-4 py-3">
            Your LLM judge reads the gold contract and the live reply. Edit the
            judge prompt on Evaluators if it is too strict or too loose — only for
            your agent.
          </li>
          <li className="border-b border-[var(--bui-line)] px-4 py-3">
            Each row on Scores remembers its own model. Compare, best-model, and
            previous runs stay scoped to the agent filter.
          </li>
          <li className="px-4 py-3">
            OpenAI models need <code className="font-mono text-xs">OPENAI_API_KEY</code>.
            Gemini models need{" "}
            <code className="font-mono text-xs">GOOGLE_GENERATIVE_AI_API_KEY</code>{" "}
            (or <code className="font-mono text-xs">GEMINI_API_KEY</code>).
          </li>
        </ul>
      </section>

      <section className="ui-card overflow-hidden">
        <div className="px-4 py-3">
          <p className="ui-label">House rules</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Do not cross the fence</h2>
        </div>
        <ul className="grid gap-0 border-t border-[var(--bui-line)] text-sm leading-6 text-[var(--bui-ink-2)]">
          <li className="border-b border-[var(--bui-line)] px-4 py-3">
            Stay inside your agent folder. Specialists must not import each other.
          </li>
          <li className="border-b border-[var(--bui-line)] px-4 py-3">
            If you edit a system prompt, bump that agent&apos;s{" "}
            <code className="font-mono text-xs">*_PROMPT_VERSION</code> and copy
            the gist into <code className="font-mono text-xs">langflow/prompts/</code>.
          </li>
          <li className="border-b border-[var(--bui-line)] px-4 py-3">
            Dataset edits and scores persist in{" "}
            <code className="font-mono text-xs">logs/</code> and in Supabase when
            it is configured. Prefer sharing a run id over pasting screenshots.
          </li>
          <li className="px-4 py-3">
            CLI if you prefer the terminal:{" "}
            <code className="font-mono text-xs">npm run evals -- --suite=math</code>{" "}
            (swap the suite for yours:{" "}
            <code className="font-mono text-xs">routing</code>,{" "}
            <code className="font-mono text-xs">concierge</code>,{" "}
            <code className="font-mono text-xs">physics</code>,{" "}
            <code className="font-mono text-xs">chemistry</code>,{" "}
            <code className="font-mono text-xs">testing</code>).
          </li>
        </ul>
      </section>
    </div>
  );
}
