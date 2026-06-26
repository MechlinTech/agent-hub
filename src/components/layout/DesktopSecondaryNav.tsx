"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getActiveAgentFromPath,
  getResultsAnalysisIdFromPath,
  isNavItemActive,
} from "@/lib/agents/navigation";
import { isSettingsPath, isSettingsNavActive } from "@/lib/settings/navigation";
import { useVisibleSettingsNav } from "@/components/settings/useVisibleSettingsNav";
import { filterNavItemsByAccess } from "@/lib/navigation-access";
import { usePermissions } from "@/lib/permissions-context";
import {
  beginNewProjectSetup,
  PROJECT_SETUP_NEW_PATH,
} from "@/stores/project-setup-store";
import { AnimatedTabNav, AnimatedTabNavRow } from "./AnimatedTabNav";

export function DesktopSecondaryNav() {
  const pathname = usePathname();
  const { canRead, canWrite } = usePermissions();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const activeAgent = getActiveAgentFromPath(pathname);
  const inSettings = isSettingsPath(pathname);
  const settingsNav = useVisibleSettingsNav();
  const resultsAnalysisId = mounted
    ? getResultsAnalysisIdFromPath(pathname)
    : null;

  if (inSettings && settingsNav.length > 1) {
    return (
      <div className="hidden px-6 pt-2 pb-2 lg:block">
        <AnimatedTabNavRow>
          <AnimatedTabNav
            variant="light"
            tabs={settingsNav.map((item) => ({
              href: item.href,
              label: item.label,
              active: isSettingsNavActive(pathname, item.href),
            }))}
          />
        </AnimatedTabNavRow>
      </div>
    );
  }

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
    <div className="hidden px-6 pb-2 pt-2 lg:block">
      <AnimatedTabNavRow>
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-card ring-1 ring-slate-200/80 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All agents
        </Link>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {activeAgent.name}
        </span>
        <AnimatedTabNav variant="light" tabs={tabs} />
      </AnimatedTabNavRow>
    </div>
  );
}
