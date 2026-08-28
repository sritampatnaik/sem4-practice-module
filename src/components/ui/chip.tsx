import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Chip({
  className,
  style,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("ui-chip", className)} style={style} {...props} />;
}
