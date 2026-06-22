import { Bot, Clock, Layers } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { AgentExplorer } from "@/components/agents/AgentExplorer";
import {
  getActiveAgentCount,
  getComingSoonAgentCount,
  getTotalAgentCount,
} from "@/lib/agents/catalog";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const metricCards = [
    {
      label: "Active Agents",
      value: String(getActiveAgentCount()),
      sub: `${getActiveAgentCount()} deployed`,
      icon: Bot,
      tone: "from-blue-500/10 to-blue-600/5 text-blue-600",
    },
    {
      label: "Total Agents",
      value: String(getTotalAgentCount()),
      sub: "In catalog",
      icon: Layers,
      tone: "from-violet-500/10 to-violet-600/5 text-violet-600",
    },
    {
      label: "Coming Soon",
      value: String(getComingSoonAgentCount()),
      sub: "In development",
      icon: Clock,
      tone: "from-amber-500/10 to-amber-600/5 text-amber-600",
    },
  ];

  return (
    <div>
      <Breadcrumbs items={[{ label: "Home", href: "/dashboard" }, { label: "Dashboard" }]} />

      <div className="page-header hidden lg:block">
        <h1 className="page-title">AI Performance Engineering Workspace</h1>
        <p className="page-subtitle">
          Browse and open agents to automate parts of the load testing lifecycle.
        </p>
      </div>

      <div className="mb-6 lg:hidden">
        <p className="text-sm font-medium text-slate-500">Welcome back</p>
        <h2 className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">
          Your workspace overview
        </h2>
      </div>

      <div className="mobile-stat-scroll mb-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0">
        {metricCards.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="mobile-stat-card lg:card lg:min-w-0 lg:snap-none">
              <div className={cn("mb-3 inline-flex rounded-xl bg-gradient-to-br p-2.5", m.tone)}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {m.label}
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{m.value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{m.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="mb-4">
        <h2 className="section-title">Explore Agents</h2>
        <p className="section-subtitle hidden sm:block">
          Search by name or filter by status. Open an agent to access its tools and workflows.
        </p>
      </div>

      <AgentExplorer />
    </div>
  );
}
