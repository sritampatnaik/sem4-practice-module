"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import {
  findEvalModel,
  modelsByProvider,
  resolveEvalModel,
  type EvalModelOption,
  type ModelProvider,
} from "@/lib/models";

function OpenAiLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#10A37F"
        d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2595 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1253a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9723V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3066 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
      />
    </svg>
  );
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function ProviderLogo({
  provider,
  className,
}: {
  provider: ModelProvider;
  className?: string;
}) {
  return (
    <span className={cn("grid h-6 w-6 shrink-0 place-items-center", className)}>
      {provider === "google" ? (
        <GoogleLogo className="h-4 w-4" />
      ) : (
        <OpenAiLogo className="h-4 w-4" />
      )}
    </span>
  );
}

export function EvalModelPicker({
  value,
  onChange,
  disabled,
  compact,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  compact?: boolean;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selected = findEvalModel(value) ?? resolveEvalModel(value);
  const groups = modelsByProvider();

  const placeMenu = () => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const width = Math.max(compact ? 240 : 288, rect.width);
    const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);
    const estimatedHeight = 320;
    const openUp = rect.bottom + estimatedHeight > window.innerHeight && rect.top > estimatedHeight;
    setMenuPos({
      top: openUp ? Math.max(8, rect.top - estimatedHeight) : rect.bottom + 4,
      left,
      width,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    placeMenu();
  }, [open, compact]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onReposition = () => placeMenu();
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, compact]);

  const choose = (model: EvalModelOption) => {
    onChange(model.id);
    setOpen(false);
  };

  const menu = open && menuPos ? (
    <ul
      ref={menuRef}
      id={listId}
      role="listbox"
      aria-label={ariaLabel ?? "Eval models"}
      className="fixed z-50 max-h-80 overflow-auto rounded-xl bg-[var(--bui-surface)] py-1 shadow-[var(--bui-shadow-card)]"
      style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
    >
      {groups.map((group) => (
        <li key={group.provider} className="py-1">
          <p className="ui-label flex items-center gap-2 px-3 py-1.5">
            <ProviderLogo provider={group.provider} className="h-4 w-4" />
            {group.label}
          </p>
          <ul>
            {group.models.map((model) => {
              const active = model.id === selected.id;
              return (
                <li key={model.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => choose(model)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left",
                      active ? "bg-[var(--bui-accent-tint)]" : "hover:bg-[var(--bui-hover)]",
                    )}
                  >
                    <ProviderLogo provider={model.provider} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{model.label}</span>
                      <span className="block font-mono text-[0.6875rem] text-[var(--bui-ink-3)]">
                        {model.id}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <div ref={rootRef} className="relative">
      {compact ? null : <p className="ui-label mb-1">Model</p>}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel ?? "Model"}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "ui-field flex items-center gap-2 text-left",
          compact ? "min-w-44 py-1.5" : "min-w-64 py-2",
        )}
      >
        <ProviderLogo provider={selected.provider} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{selected.label}</span>
          {compact ? null : (
            <span className="block font-mono text-[0.6875rem] text-[var(--bui-ink-3)]">
              {selected.provider === "google" ? "Google" : "OpenAI"} · {selected.id}
            </span>
          )}
        </span>
      </button>
      {menu && typeof document !== "undefined" ? createPortal(menu, document.body) : null}
    </div>
  );
}
