"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function LoadingState({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => setElapsedMs(Date.now() - started), 100);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="bui-pixel" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => (
          <i key={index} style={{ animationDelay: `${(index % 4) * 80}ms` }} />
        ))}
      </span>
      <span className="text-sm text-[var(--bui-ink-2)]">{label}</span>
      <span className="font-mono text-xs tabular-nums text-[var(--bui-ink-3)]">
        {(elapsedMs / 1000).toFixed(1)}s
      </span>
    </div>
  );
}
