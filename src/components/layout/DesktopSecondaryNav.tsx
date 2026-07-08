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
import { AnimatedTabNav, type AnimatedTabItem } from "./AnimatedTabNav";

function AgentsBackLink() {
  return (
    <Link
      href="/agents"
      className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Agents
    </Link>
  );
}

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

  const tabNavProps = {
    variant: "underline" as const,
    size: "compact" as const,
    listClassName: "flex-nowrap",
  };

  if (inSettings && settingsNav.length > 1) {
    return (
      <div className="hidden border-b border-slate-200/40 lg:block">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 [@media(min-width:1400px)]:pl-0">
          <AnimatedTabNav
            {...tabNavProps}
            ariaLabel="Settings navigation"
            tabs={settingsNav.map((item) => ({
              href: item.href,
              label: item.label,
              active: isSettingsNavActive(pathname, item.href),
            }))}
          />
        </div>
      </div>
    );
  }

  if (!activeAgent || pathname === "/agents") return null;

  const visibleItems = filterNavItemsByAccess(
    activeAgent.items,
    canRead,
    canWrite,
  );

  const tabs: AnimatedTabItem[] = [
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
    <div className="hidden border-b border-slate-200/40 lg:block">
      <div className="mx-auto flex max-w-[1400px] items-center gap-5 px-4 sm:px-6 lg:px-8 [@media(min-width:1400px)]:pl-0">
        <AgentsBackLink />
        <div className="min-w-0 flex-1 overflow-x-auto scrollbar-none">
          <AnimatedTabNav
            {...tabNavProps}
            ariaLabel={`${activeAgent.name} navigation`}
            tabs={tabs}
          />
        </div>
      </div>
    </div>
  );
}
