"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ChevronLeft, Cloud } from "lucide-react";
import {
  getActiveAgentFromPath,
  getResultsAnalysisIdFromPath,
  GLOBAL_NAV,
  isGlobalNavActive,
  isNavItemActive,
} from "@/lib/agents/navigation";
import { cn } from "@/lib/utils";

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const pathname = usePathname();
  const activeAgent = getActiveAgentFromPath(pathname);
  const resultsAnalysisId = getResultsAnalysisIdFromPath(pathname);
  const showLabels = !collapsed;

  return (
    <aside
      className={cn(
        "hidden h-full shrink-0 flex-col border-r border-slate-200 bg-white lg:flex",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          AH
        </div>
        {showLabels && (
          <span className="text-sm font-semibold text-slate-800">Agent Hub</span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {GLOBAL_NAV.map((item) => {
          const active = isGlobalNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {showLabels && item.label}
            </Link>
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
            {activeAgent.items.map((item) => {
              const active = isNavItemActive(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!showLabels ? item.label : undefined}
                  className={cn(
                    "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {showLabels && item.label}
                </Link>
              );
            })}
            {activeAgent.id === "results-analysis" && resultsAnalysisId && (
              <Link
                href={`/agents/results-analysis/${resultsAnalysisId}/blazemeter`}
                title={!showLabels ? "BlazeMeter Results" : undefined}
                className={cn(
                  "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname.includes("/blazemeter")
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
