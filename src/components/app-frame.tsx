"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Monogram } from "@/components/atoms/EntityChip";
import { Icon, type MetsIconName } from "@/components/icons";
import { cn } from "@/lib/cn";

export function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 no-underline">
      <Monogram color="#111827" className="size-7 text-[0.65rem]">
        M
      </Monogram>
      <span className="text-[0.95rem] font-semibold tracking-tight text-ink">
        METS
      </span>
    </Link>
  );
}

export function NavLink({
  href,
  active,
  children,
  icon,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
  icon?: MetsIconName;
}) {
  const pathname = usePathname();
  const matched =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
  const isActive = active ?? matched;
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm no-underline transition-colors",
        isActive
          ? "bg-field font-medium text-ink shadow-[var(--bui-shadow-hairline)]"
          : "text-ink-2 hover:bg-hover hover:text-ink",
      )}
    >
      {icon ? <Icon icon={icon} size={14} /> : null}
      {children}
    </Link>
  );
}

export function AppFrame({
  nav,
  actions,
  sidebar,
  rail,
  children,
}: {
  nav?: ReactNode;
  actions?: ReactNode;
  sidebar?: ReactNode;
  rail?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {sidebar ? (
        <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col overflow-hidden border-r border-line bg-surface px-4 py-5 lg:flex">
          {sidebar}
        </aside>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-line bg-surface px-5 py-3 sm:px-6">
          <div className="flex items-center gap-5">
            <BrandMark />
            <nav className="flex items-center gap-1">{nav}</nav>
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
        <div className="flex min-h-0 min-w-0 flex-1">
          <main className="min-w-0 flex-1">{children}</main>
          {rail ? (
            <aside className="sticky top-0 hidden h-[calc(100vh-3.4rem)] w-80 shrink-0 flex-col overflow-y-auto border-l border-line bg-surface px-5 py-5 xl:flex">
              {rail}
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
