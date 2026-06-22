import Link from "next/link";
import { FileSearch, Plus, History, Settings } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { createClient } from "@/lib/supabase/server";
import { getRulePacks } from "@/lib/analytics";
import { formatDate, readinessLabel, scoreColor, severityColor, pillBadge } from "@/lib/utils";

export default async function ScriptReviewAgentPage() {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("script_reviews")
    .select("id, script_name, score, readiness, created_at, status")
    .order("created_at", { ascending: false })
    .limit(5);

  const { count: completedCount } = await supabase
    .from("script_reviews")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  const { count: inProgressCount } = await supabase
    .from("script_reviews")
    .select("*", { count: "exact", head: true })
    .in("status", ["pending", "parsing", "scanning", "scoring"]);

  const { data: allCompleted } = await supabase
    .from("script_reviews")
    .select("score, readiness")
    .eq("status", "completed");

  const rulePacks = await getRulePacks();
  const completed = reviews?.filter((r) => r.status === "completed") ?? [];
  const completedAll = allCompleted ?? [];
  const avgScore =
    completedAll.length > 0
      ? Math.round(
          completedAll.reduce((s, r) => s + (r.score ?? 0), 0) / completedAll.length
        )
      : 0;
  const passRate =
    completedAll.length > 0
      ? Math.round(
          (completedAll.filter(
            (r) => r.readiness === "ready" || r.readiness === "ready_minor"
          ).length /
            completedAll.length) *
            100
        )
      : 0;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents", href: "/agents" },
          { label: "Script Review Agent" },
        ]}
      />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
              <FileSearch className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Script Review Agent</h1>
              <p className="text-slate-500">
                Review JMeter scripts for quality, correlation, assertions, timers, and BlazeMeter
                readiness.
              </p>
            </div>
          </div>
          <p className="mt-2 flex items-center gap-2 text-sm text-green-600">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Active · Rule-based Engine v1
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/agents/script-review/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> New Review
          </Link>
          <Link
            href="/agents/script-review/history"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <History className="h-4 w-4" /> View History
          </Link>
          <Link
            href="/agents/script-review/configure"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <Settings className="h-4 w-4" /> Configure Rules
          </Link>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Scripts Reviewed", value: String(completedCount ?? 0), sub: "Completed reviews" },
          { label: "Avg Score", value: avgScore ? `${avgScore}/100` : "-", sub: "Across all completed" },
          { label: "Readiness Pass Rate", value: completedAll.length ? `${passRate}%` : "-", sub: "Ready or minor fixes" },
          { label: "In Progress", value: String(inProgressCount ?? 0), sub: "Active reviews" },
        ].map((c) => (
          <div key={c.label} className="card p-4">
            <p className="text-xs font-medium uppercase text-slate-500">{c.label}</p>
            <p className="mt-1 text-2xl font-bold">{c.value}</p>
            <p className="text-xs text-slate-400">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="mb-4 font-semibold">Start a New Review</h3>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {["Upload JMX", "Attach CSV", "Select Rule Pack", "Run Review"].map((step, i) => (
                <div key={step} className="rounded-lg border border-slate-100 p-3">
                  <span className="mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    {i + 1}
                  </span>
                  <p className="font-medium text-slate-700">{step}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              <Link
                href="/agents/script-review/new"
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                Start now →
              </Link>
              <Link
                href="/agents/script-review/configure"
                className="text-sm font-medium text-slate-600 hover:underline"
              >
                Configure rules →
              </Link>
            </div>
          </div>

          <div className="card overflow-x-auto">
            <div className="border-b border-slate-100 px-4 py-3 font-semibold">Recent Reviews</div>
            <table className="w-full min-w-[28rem] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 sm:px-4">Script</th>
                  <th className="hidden px-3 py-2 sm:table-cell sm:px-4">Date</th>
                  <th className="whitespace-nowrap px-3 py-2 sm:px-4">Score</th>
                  <th className="whitespace-nowrap px-3 py-2 sm:px-4">Status</th>
                  <th className="px-3 py-2 sm:px-4"></th>
                </tr>
              </thead>
              <tbody>
                {(reviews ?? []).map((r) => (
                  <tr key={r.id} className="border-t border-slate-50">
                    <td className="max-w-[7rem] truncate px-3 py-3 font-medium sm:max-w-none sm:px-4">
                      {r.script_name}
                    </td>
                    <td className="hidden px-3 py-3 text-slate-500 sm:table-cell sm:px-4">
                      {formatDate(r.created_at)}
                    </td>
                    <td className={`whitespace-nowrap px-3 py-3 font-bold sm:px-4 ${scoreColor(r.score ?? 0)}`}>
                      {r.score ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                      {r.readiness ? (
                        <span
                          className={pillBadge(
                            severityColor(
                              r.readiness === "ready"
                                ? "low"
                                : r.readiness === "not_ready"
                                  ? "critical"
                                  : "medium"
                            )
                          )}
                        >
                          {readinessLabel(r.readiness)}
                        </span>
                      ) : (
                        r.status
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                      {r.status === "completed" && (
                        <Link
                          href={`/agents/script-review/${r.id}/results`}
                          className="text-brand-600 hover:underline"
                        >
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t px-4 py-2">
              <Link href="/agents/script-review/history" className="text-sm text-brand-600">
                View all reviews →
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="mb-3 font-semibold">Capabilities</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              {[
                "Script Structure",
                "Thread Groups",
                "Timers",
                "Assertions",
                "Correlation",
                "Parameterization",
                "Security",
                "BlazeMeter Readiness",
              ].map((c) => (
                <li key={c} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-4">
            <h3 className="mb-3 font-semibold">Rule Packs</h3>
            <ul className="space-y-2 text-sm">
              {rulePacks.map((pack) => (
                <li key={pack.id} className="flex justify-between gap-2">
                  <span>
                    {pack.name}
                    {pack.version ? ` ${pack.version}` : ""}
                    {pack.is_default && (
                      <span className="ml-1 text-xs text-brand-600">(default)</span>
                    )}
                  </span>
                  <span className="shrink-0 text-slate-400">{pack.rule_count} rules</span>
                </li>
              ))}
              {!rulePacks.length && (
                <li className="text-slate-500">No rule packs configured.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
