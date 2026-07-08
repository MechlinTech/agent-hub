import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ScriptReviewNewLink } from "@/components/agents/ScriptReviewOverviewActions";
import { createClient } from "@/lib/supabase/server";
import { getFailurePatterns, getLatestCompletedReviewId } from "@/lib/analytics";
import { CompareReviews } from "@/components/charts/CompareReviews";
import { ScoreTrendChart } from "@/components/charts/ScoreTrendChart";
import { formatDate, readinessLabel, scoreColor, severityColor, pillBadge } from "@/lib/utils";

export default async function ReviewHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: reviews } = await supabase
    .from("script_reviews")
    .select("id, script_name, score, readiness, created_at, status, external_review_id")
    .eq("user_id", user!.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const completed = reviews ?? [];
  const avgScore =
    completed.length > 0
      ? (completed.reduce((s, r) => s + (r.score ?? 0), 0) / completed.length).toFixed(1)
      : "-";
  const readyCount = completed.filter(
    (r) => r.readiness === "ready" || r.readiness === "ready_minor"
  ).length;
  const readyRate = completed.length
    ? ((readyCount / completed.length) * 100).toFixed(1)
    : "0";

  const failurePatterns = user ? await getFailurePatterns(user.id) : [];
  const latestReviewId = user ? await getLatestCompletedReviewId(user.id) : null;

  let criticalHighCount = 0;
  if (completed.length) {
    const { count } = await supabase
      .from("review_findings")
      .select("*", { count: "exact", head: true })
      .in("script_review_id", completed.map((r) => r.id))
      .in("severity", ["critical", "high"]);
    criticalHighCount = count ?? 0;
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Script Review Agent", href: "/agents/script-review" },
          { label: "History & Analytics" },
        ]}
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Review History & Trends</h1>
          <p className="text-slate-500">
            Analyze script review outcomes from your completed reviews.
          </p>
        </div>
        <div className="flex gap-2">
          {latestReviewId ? (
            <Link
              href={`/agents/script-review/${latestReviewId}/results`}
              className="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
            >
              Open Latest Review →
            </Link>
          ) : (
            <ScriptReviewNewLink className="btn-primary rounded-lg px-4 py-2 text-sm font-medium">
              Start First Review →
            </ScriptReviewNewLink>
          )}
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Reviews", value: String(completed.length) },
          { label: "Avg Score", value: `${avgScore} / 100` },
          { label: "Ready Rate", value: `${readyRate}%` },
          { label: "Critical + High (all time)", value: String(criticalHighCount) },
        ].map((c) => (
          <div key={c.label} className="card p-4">
            <p className="text-xs uppercase text-slate-500">{c.label}</p>
            <p className="mt-1 text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 card p-4">
        <h3 className="mb-2 font-semibold">Average Score Trend</h3>
        <ScoreTrendChart
          data={completed.map((r) => ({
            date: r.created_at,
            score: r.score ?? 0,
            script_name: r.script_name,
          }))}
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-3 sm:px-4">Script Name</th>
              <th className="hidden px-3 py-3 md:table-cell sm:px-4">Review ID</th>
              <th className="hidden px-3 py-3 lg:table-cell sm:px-4">Review Date</th>
              <th className="whitespace-nowrap px-3 py-3 sm:px-4">Score</th>
              <th className="whitespace-nowrap px-3 py-3 sm:px-4">Status</th>
              <th className="whitespace-nowrap px-3 py-3 sm:px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {completed.map((r) => (
              <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50">
                <td className="max-w-[8rem] truncate px-3 py-3 font-medium sm:max-w-none sm:px-4">
                  {r.script_name}
                </td>
                <td className="hidden px-3 py-3 font-mono text-xs text-slate-500 md:table-cell sm:px-4">
                  {r.external_review_id ?? r.id.slice(0, 8)}
                </td>
                <td className="hidden px-3 py-3 text-slate-500 lg:table-cell sm:px-4">
                  {formatDate(r.created_at)}
                </td>
                <td className={`whitespace-nowrap px-3 py-3 font-bold sm:px-4 ${scoreColor(r.score ?? 0)}`}>
                  {r.score ?? "-"}
                </td>
                <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                  {r.readiness && (
                    <span
                      className={pillBadge(
                        severityColor(r.readiness === "ready" ? "low" : "critical")
                      )}
                    >
                      {readinessLabel(r.readiness)}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                  <Link
                    href={`/agents/script-review/${r.id}/results`}
                    className="text-brand-600 hover:underline"
                  >
                    View
                  </Link>
                  <span className="hidden sm:inline"> · </span>
                  <Link
                    href={`/agents/script-review/${r.id}/report`}
                    className="text-brand-600 hover:underline"
                  >
                    Report
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!completed.length && (
          <p className="p-8 text-center text-slate-500">No completed reviews yet.</p>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <CompareReviews
          reviews={completed.map((r) => ({
            id: r.id,
            script_name: r.script_name,
            score: r.score,
            readiness: r.readiness,
          }))}
        />
        <div className="card p-4">
          <h3 className="font-semibold">Common Failure Patterns</h3>
          <p className="mt-1 text-xs text-slate-500">From your review findings</p>
          {failurePatterns.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {failurePatterns.map((p) => (
                <li key={p.label} className="flex justify-between gap-4">
                  <span className="min-w-0 truncate">{p.label}</span>
                  <span className="shrink-0 text-slate-500">
                    {p.count} ({p.percent}%)
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              No findings data yet. Complete a script review to see patterns.
            </p>
          )}
        </div>
        <div className="card p-4">
          <h3 className="font-semibold">AI Recommendation</h3>
          <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            AI Recommendation Mode is <strong>Disabled</strong>. Findings use built-in rule
            templates only.
          </p>
        </div>
      </div>
    </div>
  );
}
