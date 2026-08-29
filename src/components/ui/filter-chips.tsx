import { cn } from "@/lib/cn";

export function FilterChips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ id: T; label: string; count?: number }>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={cn(
              "ui-chip cursor-pointer transition-colors",
              active
                ? "bg-[var(--bui-ink)] text-[var(--bui-surface)] shadow-none"
                : "hover:bg-[var(--bui-hover)] hover:text-[var(--bui-ink)]",
            )}
          >
            {option.label}
            {option.count != null ? (
              <span className={active ? "text-white/70" : "text-[var(--bui-ink-3)]"}>
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
