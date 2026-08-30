import { cn } from "@/lib/cn";

export function FollowUps({
  label = "Try",
  items,
  onPick,
}: {
  label?: string;
  items: string[];
  onPick: (item: string) => void;
}) {
  if (!items.length) return null;
  return (
    <div className="grid gap-2">
      <p className="ui-label">{label}</p>
      <ul className="grid gap-2">
        {items.map((item) => (
          <li key={item}>
            <button
              type="button"
              onClick={() => onPick(item)}
              className={cn(
                "ui-inset w-full px-3 py-2 text-left text-sm text-[var(--bui-ink-2)]",
                "transition-colors hover:bg-[var(--bui-hover)] hover:text-[var(--bui-ink)]",
              )}
            >
              {item}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
