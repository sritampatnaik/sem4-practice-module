"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/evals/datasets", label: "Datasets" },
  { href: "/evals/evaluators", label: "Evaluators" },
  { href: "/evals/scores", label: "Scores" },
] as const;

export function EvalsTabs() {
  const pathname = usePathname();
  return (
    <nav
      className="flex gap-1 border-b border-[var(--bui-line)]"
      aria-label="Eval sections"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm no-underline transition-colors",
              active
                ? "border-[var(--bui-ink)] font-medium text-[var(--bui-ink)]"
                : "border-transparent text-[var(--bui-ink-2)] hover:text-[var(--bui-ink)]",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function EvalsChrome({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-6 sm:px-8">
      <header>
        <p className="ui-label">Evaluation desk</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Evals</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--bui-ink-2)]">
          Datasets hold the gold JSON. Evaluators score the live reply. Scores keep
          every previous run.
        </p>
      </header>
      <EvalsTabs />
      {children}
    </div>
  );
}
