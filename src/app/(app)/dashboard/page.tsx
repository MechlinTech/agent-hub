import { ArrowUpRight, Bot, Clock, Layers, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { AgentExplorer } from "@/components/agents/AgentExplorer";
import { DashboardWelcome } from "@/components/dashboard/DashboardWelcome";
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
      sub: `${getActiveAgentCount()} deployed & ready`,
      trend: "Live in your workspace",
      icon: Bot,
      tone: "bg-brand-50 text-brand-600",
    },
    {
      label: "Total Agents",
      value: String(getTotalAgentCount()),
      sub: "Available in catalog",
      trend: "Full agent library",
      icon: Layers,
      tone: "bg-violet-50 text-violet-600",
    },
    {
      label: "Coming Soon",
      value: String(getComingSoonAgentCount()),
      sub: "In development",
      trend: "On the roadmap",
      icon: Clock,
      tone: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div>
      <Breadcrumbs
        items={[{ label: "Home", href: "/dashboard" }, { label: "Dashboard" }]}
      />

      <DashboardWelcome />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
        {metricCards.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="metric-card min-w-0">
              <div className="mb-4 flex items-start justify-between">
                <div className={cn("metric-card-icon", m.tone)}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500">{m.label}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                {m.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{m.sub}</p>
              <p className="mt-3 text-xs font-semibold text-brand-600">
                {m.trend}
              </p>
            </div>
          );
        })}
      </div>

      <div className="panel-card">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              <Sparkles className="h-3.5 w-3.5" />
              Agent catalog
            </div>
            <h2 className="section-title">Explore Agents</h2>
            <p className="section-subtitle mt-1">
              Search by name or filter by status. Open an agent to access its
              tools and workflows.
            </p>
          </div>
        </div>

        <AgentExplorer />
      </div>
    </div>
  );
}
