import { cn } from "@/lib/cn";

export function ToolChip({
  name,
  state = "done",
}: {
  name: string;
  state?: "running" | "done" | "error";
}) {
  const label =
    state === "running" ? "Using" : state === "error" ? "Failed" : "Used";
  return (
    <span
      className={cn(
        "ui-chip mt-2",
        state === "running" && "bg-[var(--bui-accent-tint)] text-[var(--bui-accent-ink)]",
        state === "error" && "bg-[var(--bui-red-tint)] text-[var(--bui-red)]",
        state === "done" && "bg-[var(--bui-green-tint)] text-[var(--bui-green)]",
      )}
    >
      <span className="bui-task-dot" data-status={state === "running" ? "running" : state} />
      {label} {name}
    </span>
  );
}
