import { AppFrame, NavLink } from "@/components/app-frame";
import { EvalsChrome } from "@/components/evals-tabs";
import type { ReactNode } from "react";

export default function EvalsLayout({ children }: { children: ReactNode }) {
  return (
    <AppFrame
      nav={
        <>
          <NavLink href="/">Tutor</NavLink>
          <NavLink href="/evals">Evals</NavLink>
        </>
      }
    >
      <EvalsChrome>{children}</EvalsChrome>
    </AppFrame>
  );
}
