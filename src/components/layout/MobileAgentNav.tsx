"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getActiveAgentFromPath,
  getResultsAnalysisIdFromPath,
  isNavItemActive,
} from "@/lib/agents/navigation";
import { filterNavItemsByAccess } from "@/lib/navigation-access";
import { usePermissions } from "@/lib/permissions-context";
import { cn } from "@/lib/utils";

export function MobileAgentNav() {
  const pathname = usePathname();
  const { canRead, canWrite } = usePermissions();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const activeAgent = getActiveAgentFromPath(pathname);
  const resultsAnalysisId = mounted ? getResultsAnalysisIdFromPath(pathname) : null;

  if (!activeAgent || pathname === "/agents") return null;

  const visibleItems = filterNavItemsByAccess(activeAgent.items, canRead, canWrite);

  const tabs = [
    ...visibleItems.map((item) => ({
      href: item.href,
      label: item.label,
      active: isNavItemActive(pathname, item),
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
      <div className="scrollbar-none flex overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative shrink-0 px-4 py-3.5 text-sm font-semibold transition-colors duration-200",
              tab.active ? "text-brand-600" : "text-slate-500 active:text-slate-700"
            )}
          >
            {tab.label}
            {tab.active && (
              <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand-600" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
