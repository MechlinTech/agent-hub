"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getActiveAgentFromPath,
  getResultsAnalysisIdFromPath,
  isNavItemActive,
} from "@/lib/agents/navigation";
import { filterNavItemsByAccess } from "@/lib/navigation-access";
import { usePermissions } from "@/lib/permissions-context";
import {
  beginNewProjectSetup,
  PROJECT_SETUP_NEW_PATH,
} from "@/stores/project-setup-store";
import { AnimatedTabNav } from "./AnimatedTabNav";

export function MobileAgentNav() {
  const pathname = usePathname();
  const { canRead, canWrite } = usePermissions();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const activeAgent = getActiveAgentFromPath(pathname);
  const resultsAnalysisId = mounted
    ? getResultsAnalysisIdFromPath(pathname)
    : null;

  if (!activeAgent || pathname === "/agents") return null;

  const visibleItems = filterNavItemsByAccess(
    activeAgent.items,
    canRead,
    canWrite,
  );

  const tabs = [
    ...visibleItems.map((item) => ({
      href: item.href,
      label: item.label,
      active: isNavItemActive(pathname, item),
      onClick:
        item.href === PROJECT_SETUP_NEW_PATH ? beginNewProjectSetup : undefined,
    })),
    ...(activeAgent.id === "results-analysis" && resultsAnalysisId
      ? [
          {
            href: `/agents/results-analysis/${resultsAnalysisId}/blazemeter`,
            label: "BlazeMeter",
            active: pathname.includes("/blazemeter"),
          },
        ]
      : []),
  ];

  return (
    <div className="shrink-0 border-b border-slate-200/70 bg-white lg:hidden">
      <AnimatedTabNav
        variant="underline"
        ariaLabel="Agent navigation"
        className="px-2"
        listClassName="min-w-max"
        tabs={tabs}
      />
    </div>
  );
}
