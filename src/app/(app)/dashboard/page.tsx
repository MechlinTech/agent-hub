import Link from "next/link";
import {
  Bot,
  FileBarChart,
  FileSearch,
  Play,
  TrendingDown,
  TrendingUp,
  Upload,
} from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { AgentCard } from "@/components/agents/AgentCard";
import { createClient } from "@/lib/supabase/server";
import { AGENT_CATALOG, getActiveAgentCount, getTotalAgentCount } from "@/lib/agents/catalog";
import { getDashboardMetrics, getLatestCompletedReviewId, getRecentActivity } from "@/lib/analytics";
import { formatRelativeTime } from "@/lib/utils";

function TrendBadge({ delta, invert = false }: { delta: number; invert?: boolean }) {
  if (delta === 0) {
    return <span className="text-xs text-slate-400">No change vs last week</span>;
  }

  const positive = invert ? delta < 0 : delta > 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  const color = positive ? "text-green-600" : "text-red-600";

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(delta)} vs last week
    </span>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const metrics = await getDashboardMetrics(user.id);
  const activity = await getRecentActivity(user.id);
  const latestReviewId = await getLatestCompletedReviewId(user.id);

  const metricCards = [
    {
      label: "Active Agents",
      value: `${getActiveAgentCount()} / ${getTotalAgentCount()}`,
      sub: "Deployed in this workspace",
      delta: 0,
      invert: false,
    },
    {
      label: "Scripts Reviewed",
      value: String(metrics.scriptsReviewed),
      sub: "Completed reviews",
      delta: metrics.reviewsThisWeek - metrics.reviewsPrevWeek,
      invert: false,
    },
    {
      label: "Reviews This Week",
      value: String(metrics.reviewsThisWeek),
      sub: "Completed in last 7 days",
      delta: metrics.reviewsThisWeek - metrics.reviewsPrevWeek,
      invert: false,
    },
    {
      label: "Critical / High Findings",
      value: String(metrics.openCriticalFindings),
      sub: "Open findings",
      delta: metrics.criticalFindingsThisWeek - metrics.criticalFindingsPrevWeek,
      invert: true,
    },
  ];

  return (
    <div>
      <Breadcrumbs items={[{ label: "Home", href: "/dashboard" }, { label: "Dashboard" }]} />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">AI Performance Engineering Workspace</h1>
        <p className="mt-1 text-slate-500">
          Choose an agent to automate a specific part of the load testing lifecycle.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((m) => (
          <div key={m.label} className="card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{m.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{m.value}</p>
            <div className="mt-1 flex flex-col gap-0.5">
              <p className="text-xs text-slate-400">{m.sub}</p>
              {m.label !== "Active Agents" && (
                <TrendBadge delta={m.delta} invert={m.invert} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Agents</h2>
            <Link href="/agents" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {AGENT_CATALOG.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Recent Activity</h3>
              <Link
                href="/agents/script-review/history"
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                View all
              </Link>
            </div>
            <ul className="space-y-3">
              {activity.map((item) => (
                <li key={item.id} className="flex gap-3 text-sm">
                  <Bot className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800">{item.title}</p>
                    {item.subtitle && (
                      <p className="truncate text-slate-500">{item.subtitle}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      {formatRelativeTime(item.created_at)}
                    </p>
                  </div>
                </li>
              ))}
              {!activity.length && (
                <li className="text-sm text-slate-500">
                  No activity yet. Start your first script review.
                </li>
              )}
            </ul>
          </div>

          <div className="card p-4">
            <h3 className="mb-3 font-semibold text-slate-900">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/test-assets"
                className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
              >
                <Upload className="h-4 w-4 text-brand-600" />
                <div>
                  <p className="text-sm font-medium">Upload JMX</p>
                  <p className="text-xs text-slate-500">Upload and register JMeter script</p>
                </div>
              </Link>
              <Link
                href="/agents/script-review/new"
                className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
              >
                <FileSearch className="h-4 w-4 text-brand-600" />
                <div>
                  <p className="text-sm font-medium">Start Review</p>
                  <p className="text-xs text-slate-500">Review a JMX script with AI</p>
                </div>
              </Link>
              {latestReviewId ? (
                <Link
                  href={`/agents/script-review/${latestReviewId}/report`}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
                >
                  <FileBarChart className="h-4 w-4 text-brand-600" />
                  <div>
                    <p className="text-sm font-medium">View Latest Report</p>
                    <p className="text-xs text-slate-500">Most recent executive report</p>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 opacity-60">
                  <FileBarChart className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">View Latest Report</p>
                    <p className="text-xs text-slate-400">Complete a review first</p>
                  </div>
                </div>
              )}
              <Link
                href="/executions"
                className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
              >
                <Play className="h-4 w-4 text-brand-600" />
                <div>
                  <p className="text-sm font-medium">Start New Test Run</p>
                  <p className="text-xs text-slate-500">Run a test on BlazeMeter (coming soon)</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
