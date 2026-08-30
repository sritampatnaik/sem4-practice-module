import { cn } from "@/lib/cn";

export type TaskRowStatus = "pending" | "running" | "done" | "error";

export function TaskRow({
  title,
  detail,
  status,
}: {
  title: string;
  detail?: string;
  status: TaskRowStatus;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="bui-task-dot"
          data-status={status === "pending" ? undefined : status}
        />
        <span className="truncate text-sm">{title}</span>
      </div>
      <span
        className={cn(
          "shrink-0 text-xs text-[var(--bui-ink-3)]",
          status === "running" && "text-[var(--bui-accent-ink)]",
          status === "done" && "text-[var(--bui-green)]",
          status === "error" && "text-[var(--bui-red)]",
        )}
      >
        {detail ?? status}
      </span>
    </div>
  );
}
