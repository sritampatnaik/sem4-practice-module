"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Thinking({
  summary,
  children,
  defaultOpen = false,
}: {
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ui-inset">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
      >
        <span className="text-sm text-[var(--bui-ink-2)]">{summary}</span>
        <span className={cn("text-xs text-[var(--bui-ink-3)]", open && "rotate-180")}>
          ▾
        </span>
      </button>
      {open ? (
        <div className="border-t border-[var(--bui-line)] px-3 py-2 text-sm">{children}</div>
      ) : null}
    </div>
  );
}
