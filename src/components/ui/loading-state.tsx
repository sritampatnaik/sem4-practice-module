"use client";

import BeautifulLoadingState from "@/components/primitives/LoadingState";
import { cn } from "@/lib/cn";

export function LoadingState({
  label,
  className,
  variant = "Drive",
}: {
  label: string;
  className?: string;
  variant?: "Drive" | "Dots" | "Orbit";
}) {
  return (
    <div className={cn(className)}>
      <BeautifulLoadingState label={label} variant={variant} />
    </div>
  );
}
