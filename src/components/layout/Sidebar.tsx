"use client";

import Link from "next/link";
import { Fragment } from "react";
import { usePathname } from "next/navigation";
import { ArrowLeft, ChevronLeft, Cloud } from "lucide-react";
import {
  getActiveAgentFromPath,
  getResultsAnalysisIdFromPath,
  GLOBAL_NAV,
  isGlobalNavActive,
  isNavItemActive,
} from "@/lib/agents/navigation";
import { isSettingsNavActive, isSettingsPath } from "@/lib/settings/navigation";
import { useVisibleSettingsNav } from "@/components/settings/useVisibleSettingsNav";
import { usePermissions } from "@/lib/permissions-context";
import {
  filterGlobalNavByAccess,
  filterNavItemsByAccess,
} from "@/lib/navigation-access";
import { cn } from "@/lib/utils";
import {
  beginNewProjectSetup,
  PROJECT_SETUP_NEW_PATH,
} from "@/stores/project-setup-store";
import { AgentHubLogo } from "@/components/brand/AgentHubMark";

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const pathname = usePathname();
  const { canRead, canWrite } = usePermissions();
  const activeAgent = getActiveAgentFromPath(pathname);
  const inSettings = isSettingsPath(pathname);
  const resultsAnalysisId = getResultsAnalysisIdFromPath(pathname);
  const showLabels = !collapsed;

  const visibleGlobalNav = filterGlobalNavByAccess(canRead, canWrite);

  const visibleSettingsNav = useVisibleSettingsNav();
  const showSettingsSections = inSettings && visibleSettingsNav.length > 1;

  return (
    <aside
      className={cn(
        "hidden h-full shrink-0 flex-col border-r border-slate-200/60 bg-white/80 backdrop-blur-sm lg:hidden",
        collapsed ? "w-16" : "w-56",
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4">
        <AgentHubLogo size="sm" className="rounded-lg" />
        {showLabels && (
          <span className="text-sm font-semibold text-slate-800">
            Agent Hub
          </span>
        )}
      </div>

      <nav className="scrollbar-brand flex-1 space-y-1 overflow-y-auto p-3 pb-4">
        {visibleGlobalNav.map((item) => {
          const active = isGlobalNavActive(pathname, item.href);
          const Icon = item.icon;
          const isSettings = item.href === "/settings";
          return (
            <Fragment key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {showLabels && item.label}
              </Link>
              {isSettings && showSettingsSections && (
                <div className="ml-3 space-y-0.5 border-l-2 border-slate-100 pl-2">
                  {visibleSettingsNav.map((subItem) => {
                    const subActive = isSettingsNavActive(
                      pathname,
                      subItem.href,
                    );
                    const SubIcon = subItem.icon;
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        title={!showLabels ? subItem.label : undefined}
                        className={cn(
                          "flex min-h-[38px] items-center gap-2.5 rounded-lg py-2 pl-2 pr-3 text-sm font-medium transition-colors",
                          subActive
                            ? "bg-brand-50 text-brand-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                        )}
                      >
                        <SubIcon className="h-4 w-4 shrink-0" />
                        {showLabels && subItem.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </Fragment>
          );
        })}

        {activeAgent && (
          <div className="mt-4 space-y-1 border-t border-slate-100 pt-4">
            {showLabels && (
              <div className="mb-2 px-3">
                <Link
                  href="/agents"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-600"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  All agents
                </Link>
                <p className="mt-2 truncate text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {activeAgent.name}
                </p>
              </div>
            )}
            {!showLabels && (
              <div className="mb-2 flex justify-center">
                <Link
                  href="/agents"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-brand-600"
                  title="All agents"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            )}
            {filterNavItemsByAccess(activeAgent.items, canRead, canWrite).map(
              (item) => {
                const active = isNavItemActive(pathname, item);
                const Icon = item.icon;
                const isNewProjectSetup = item.href === PROJECT_SETUP_NEW_PATH;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={!showLabels ? item.label : undefined}
                    onClick={
                      isNewProjectSetup ? beginNewProjectSetup : undefined
                    }
                    className={cn(
                      "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {showLabels && item.label}
                  </Link>
                );
              },
            )}
            {activeAgent.id === "results-analysis" && resultsAnalysisId && (
              <Link
                href={`/agents/results-analysis/${resultsAnalysisId}/blazemeter`}
                title={!showLabels ? "BlazeMeter Results" : undefined}
                className={cn(
                  "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname.includes("/blazemeter")
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Cloud className="h-5 w-5 shrink-0" />
                {showLabels && "BlazeMeter Results"}
              </Link>
            )}
          </div>
        )}
      </nav>

      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 hover:text-slate-700"
      >
        <ChevronLeft className={cn("h-4 w-4", collapsed && "rotate-180")} />
        {!collapsed && "Collapse"}
      </button>
    </aside>
  );
}
