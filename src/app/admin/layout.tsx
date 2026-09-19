import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getAdminAccess } from "@/agents/guardrail";
import { AppFrame } from "@/components/app-frame";

export const metadata = {
  title: "METS · Staff alerts",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const access = await getAdminAccess();
  if (!access.ok) notFound();

  return (
    <AppFrame
      actions={
        <p className="text-xs text-ink-3">
          {access.user?.email || (access.bypass ? "Local staff bypass" : "Staff")}
        </p>
      }
    >
      {children}
    </AppFrame>
  );
}
