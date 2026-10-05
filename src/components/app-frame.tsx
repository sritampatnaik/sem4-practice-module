"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Monogram } from "@/components/atoms/EntityChip";
import { Icon, type MetsIconName } from "@/components/icons";
import { cn } from "@/lib/cn";

export function BrandMark() {
  return (
    <Link href="/" className="group flex items-center gap-2.5 no-underline transition-transform hover:scale-[1.02]">
      <Monogram color="#111827" className="size-8 text-[0.65rem] shadow-sm transition-shadow group-hover:shadow-md">
        M
      </Monogram>
      <div className="flex flex-col">
        <span className="text-[1rem] font-bold tracking-tight text-ink">
          METS
        </span>
        <span className="text-[0.625rem] font-medium uppercase tracking-wider text-ink-3">
          Learning Hub
        </span>
      </div>
    </Link>
  );
}

export function DeskNav() {
  return (
    <>
      <NavLink href="/" icon="tutor">
        Tutor
      </NavLink>
      <NavLink href="/diagnostics" icon="question">
        Diagnostics
      </NavLink>
      <NavLink href="/evals" icon="evals">
        Evals
      </NavLink>
    </>
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
        "group relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium no-underline transition-all",
        isActive
          ? "bg-accent/10 text-accent shadow-[0_0_0_1px_var(--accent-tint)]"
          : "text-ink-2 hover:bg-hover/80 hover:text-ink hover:shadow-hairline",
      )}
    >
      {icon ? (
        <Icon 
          icon={icon} 
          size={15} 
          className={cn(
            "transition-transform",
            isActive ? "text-accent" : "text-ink-3 group-hover:text-ink-2"
          )}
        /> 
      ) : null}
      {children}
      {isActive && (
        <div className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-accent" />
      )}
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
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (desktop.matches) setSidebarOpen(false);
    };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {sidebar ? (
        <>
          {sidebarOpen ? (
            <button
              type="button"
              className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px] lg:hidden"
              aria-label="Close student menu"
              onClick={() => setSidebarOpen(false)}
            />
          ) : null}
          <aside
            id="student-sidebar"
            className={cn(
              "flex-col overflow-y-auto border-r border-line/60 bg-surface/95 px-5 py-6 backdrop-blur-sm",
              "lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0",
              sidebarOpen ? "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw]" : "hidden",
            )}
          >
            {sidebar}
          </aside>
        </>
      ) : null}
      {sidebar ? (
        <button
          type="button"
          className="fixed top-3.5 left-4 z-[60] inline-flex size-9 items-center justify-center rounded-lg bg-surface/95 text-ink-2 shadow-hairline backdrop-blur-sm transition-colors hover:bg-hover hover:text-ink lg:hidden"
          aria-label={sidebarOpen ? "Close student menu" : "Open student menu"}
          aria-expanded={sidebarOpen}
          aria-controls="student-sidebar"
          onClick={() => setSidebarOpen((open) => !open)}
        >
          <Icon icon={sidebarOpen ? "cancel" : "menu"} size={18} />
        </button>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cn(
            "sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-line/60 bg-surface/95 py-3.5 backdrop-blur-sm",
            sidebar ? "pl-14 pr-6 sm:pl-16 sm:pr-8 lg:px-8" : "px-6 sm:px-8",
          )}
        >
          <div className="flex items-center gap-3 sm:gap-6">
            <BrandMark />
            <nav className="flex items-center gap-2">{nav}</nav>
          </div>
          {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </header>
        <div className="flex min-h-0 min-w-0 flex-1">
          <main className="min-w-0 flex-1">{children}</main>
          {rail ? (
            <aside className="sticky top-0 hidden h-[calc(100vh-3.5rem)] w-80 shrink-0 flex-col overflow-y-auto border-l border-line/60 bg-surface/95 px-6 py-6 backdrop-blur-sm xl:flex">
              {rail}
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
