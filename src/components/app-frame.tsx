import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 no-underline">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--bui-ink)] text-[0.65rem] font-semibold tracking-wide text-white">
        M
      </span>
      <span className="text-[0.95rem] font-semibold tracking-tight text-[var(--bui-ink)]">
        METS
      </span>
    </Link>
  );
}

export function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-2.5 py-1.5 text-sm no-underline transition-colors",
        active
          ? "bg-[var(--bui-field)] font-medium text-[var(--bui-ink)] shadow-[var(--bui-shadow-hairline)]"
          : "text-[var(--bui-ink-2)] hover:bg-[var(--bui-hover)] hover:text-[var(--bui-ink)]",
      )}
    >
      {children}
    </Link>
  );
}

export function AppFrame({
  nav,
  sidebar,
  rail,
  children,
}: {
  nav?: ReactNode;
  sidebar?: ReactNode;
  rail?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[var(--bui-canvas)] text-[var(--bui-ink)]">
      {sidebar ? (
        <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--bui-line)] bg-[var(--bui-surface)] px-5 py-5 lg:flex">
          {sidebar}
        </aside>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--bui-line)] bg-[var(--bui-surface)] px-5 py-3 sm:px-6">
          <div className="flex items-center gap-5">
            <BrandMark />
            <nav className="flex items-center gap-1">{nav}</nav>
          </div>
        </header>
        <div className="flex min-h-0 min-w-0 flex-1">
          <main className="min-w-0 flex-1">{children}</main>
          {rail ? (
            <aside className="hidden w-80 shrink-0 flex-col border-l border-[var(--bui-line)] bg-[var(--bui-surface)] px-5 py-5 xl:flex">
              {rail}
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
