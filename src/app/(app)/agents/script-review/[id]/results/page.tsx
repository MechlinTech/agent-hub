import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { SeverityDonut } from "@/components/charts/SeverityDonut";
import { RerunReviewButton } from "@/components/reviews/RerunReviewButton";
import { createClient } from "@/lib/supabase/server";
import { formatDate, readinessLabel, scoreColor, severityColor, pillBadge } from "@/lib/utils";

export default async function ReviewResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: review } = await supabase
    .from("script_reviews")
    .select("*")
    .eq("id", id)
    .single();

  if (!review) notFound();

  const { data: findings } = await supabase
    .from("review_findings")
    .select("*")
    .eq("script_review_id", id)
    .order("severity");

  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  findings?.forEach((f) => {
    const s = f.severity as keyof typeof counts;
    if (counts[s] !== undefined) counts[s]++;
  });

  const inventory = review.inventory as Record<string, number> | null;
  const topRisks = (review.top_risks as string[]) ?? [];
  const fixOrder = (review.fix_order as string[]) ?? [];

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Script Review Agent", href: "/agents/script-review" },
          { label: "Review Results" },
        ]}
      />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Review Results</h1>
          <p className="text-slate-500">{review.script_name}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <ExportButtons reviewId={id} scriptName={review.script_name} />
          <div className="flex flex-wrap gap-2">
          <RerunReviewButton reviewId={id} />
          <Link
            href={`/agents/script-review/${id}/report`}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Full Report
          </Link>
          <Link
            href={`/agents/script-review/${id}/findings/${findings?.[0]?.id ?? ""}`}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Open Detailed Findings
          </Link>
          </div>
        </div>
      </div>

      <div className="card mb-6 grid gap-6 p-6 lg:grid-cols-3">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
            {review.score ?? 0}
          </div>
          <div>
            <p className="text-sm text-slate-500">Script Quality Score</p>
            <p className={`text-3xl font-bold ${scoreColor(review.score ?? 0)}`}>
              {review.score ?? 0}/100
            </p>
            <span
              className={pillBadge(
                severityColor(review.readiness === "ready" ? "low" : "critical")
              )}
            >
              {review.readiness ? readinessLabel(review.readiness) : "-"}
            </span>
          </div>
        </div>
        <div className="lg:col-span-2">
          <p className="text-sm text-slate-600">{review.executive_summary}</p>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-slate-400">Review ID</dt>
              <dd className="font-medium">{review.external_review_id ?? id.slice(0, 8)}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Date</dt>
              <dd>{formatDate(review.created_at)}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Reviewer</dt>
              <dd>Script Review Agent (Rule-based)</dd>
            </div>
            <div>
              <dt className="text-slate-400">AI Mode</dt>
              <dd className={review.ai_mode === "enabled" ? "text-purple-700" : "text-amber-700"}>
                {review.ai_mode === "enabled" ? "Enabled (AI)" : "Disabled (templates)"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {(["critical", "high", "medium"] as const).map((sev) => (
          <div key={sev} className={`card p-4 border-l-4 ${sev === "critical" ? "border-l-red-500" : sev === "high" ? "border-l-orange-500" : "border-l-yellow-500"}`}>
            <p className="text-xs uppercase text-slate-500">{sev} Findings</p>
            <p className="text-2xl font-bold">{counts[sev]}</p>
          </div>
        ))}
        <div className="card p-4">
          <p className="text-xs uppercase text-slate-500">Readiness</p>
          <p className="font-semibold">{review.readiness ? readinessLabel(review.readiness) : "-"}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-1">
          <h3 className="mb-2 font-semibold text-sm">Severity Distribution</h3>
          <SeverityDonut counts={counts} />
        </div>
        <div className="card overflow-x-auto lg:col-span-2">
          <div className="border-b px-4 py-3 font-semibold">Findings</div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2">Severity</th>
                <th className="px-4 py-2">Rule</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Issue</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(findings ?? []).map((f) => (
                <tr key={f.id} className="border-t border-slate-50">
                  <td className="px-4 py-2">
                    <span className={pillBadge(severityColor(f.severity))}>
                      {f.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{f.rule_id}</td>
                  <td className="px-4 py-2">{f.category}</td>
                  <td className="px-4 py-2 max-w-xs truncate">{f.issue}</td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/agents/script-review/${id}/findings/${f.id}`}
                      className="text-brand-600 hover:underline"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="mb-2 font-semibold text-sm uppercase text-slate-500">Top Risks</h3>
            <ol className="list-decimal space-y-2 pl-4 text-sm">
              {topRisks.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
          </div>
          <div className="card p-4">
            <h3 className="mb-2 font-semibold text-sm uppercase text-slate-500">Recommended Fix Order</h3>
            <ol className="list-decimal space-y-2 pl-4 text-sm">
              {fixOrder.slice(0, 5).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
          </div>
          {inventory && (
            <div className="card p-4">
              <h3 className="mb-2 font-semibold text-sm">Inventory</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>Thread Groups: {inventory.threadGroups}</div>
                <div>HTTP Samplers: {inventory.httpSamplers}</div>
                <div>Assertions: {inventory.assertions}</div>
                <div>Timers: {inventory.timers}</div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
