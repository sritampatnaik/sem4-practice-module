import { AppFrame, DeskNav } from "@/components/app-frame";
import { EvalsChrome } from "@/components/evals-tabs";
import type { ReactNode } from "react";

export default function EvalsLayout({ children }: { children: ReactNode }) {
  return (
    <AppFrame nav={<DeskNav />}>
      <EvalsChrome>{children}</EvalsChrome>
    </AppFrame>
  );
}
