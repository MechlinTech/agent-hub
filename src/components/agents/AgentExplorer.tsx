"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AgentCard } from "@/components/agents/AgentCard";
import { AGENT_CATALOG, type AgentStatus } from "@/lib/agents/catalog";
import { AGENT_RESOURCE_MAP } from "@/lib/permissions";
import { usePermissions } from "@/lib/permissions-context";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | AgentStatus;

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "coming_soon", label: "Coming soon" },
];

export function AgentExplorer({
  gridClassName = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3",
}: {
  gridClassName?: string;
}) {
  const { canRead } = usePermissions();
  const agents = AGENT_CATALOG.filter((agent) => {
    const resource = AGENT_RESOURCE_MAP[agent.id];
    if (!resource) return true;
    return canRead(resource);
  });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return agents.filter((agent) => {
      const matchesStatus = statusFilter === "all" || agent.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        agent.name.toLowerCase().includes(q) ||
        agent.description.toLowerCase().includes(q) ||
        agent.id.replace(/-/g, " ").includes(q)
      );
    });
  }, [agents, query, statusFilter]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={2}
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agents..."
            className="input w-full py-2.5 pl-10 pr-4"
            aria-label="Search agents"
          />
        </div>

        <div className="flex flex-wrap gap-2 sm:shrink-0">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
                statusFilter === option.value
                  ? "brand-gradient text-white shadow-sm shadow-brand-600/25"
                  : "bg-slate-50 text-slate-600 ring-1 ring-slate-200/80 hover:bg-white"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-slate-400">
        {filtered.length} of {agents.length} agent{agents.length !== 1 ? "s" : ""}
        {query.trim() ? ` · “${query.trim()}”` : ""}
      </p>

      {filtered.length > 0 ? (
        <div className={gridClassName}>
          {filtered.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <div className="mobile-card p-10 text-center lg:card">
          <p className="font-semibold text-slate-800">No agents match your search</p>
          <p className="mt-1 text-sm text-slate-500">
            Try a different keyword or clear the status filter.
          </p>
        </div>
      )}
    </div>
  );
}
