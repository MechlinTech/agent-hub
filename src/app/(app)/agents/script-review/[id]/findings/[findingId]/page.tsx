import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { FindingActions } from "@/components/findings/FindingActions";
import { createClient } from "@/lib/supabase/server";
import { severityColor } from "@/lib/utils";

export default async function FindingDetailPage({
  params,
}: {
  params: Promise<{ id: string; findingId: string }>;
}) {
  const { id, findingId } = await params;
  const supabase = await createClient();

  const { data: finding } = await supabase
    .from("review_findings")
    .select("*")
    .eq("id", findingId)
    .eq("script_review_id", id)
    .single();

  const { data: allFindings } = await supabase
    .from("review_findings")
    .select("id, finding_code, severity, issue, rule_id")
    .eq("script_review_id", id)
    .order("severity");

  const { data: review } = await supabase
    .from("script_reviews")
    .select("script_name, ai_mode")
    .eq("id", id)
    .single();

  if (!finding) notFound();

  const flatFindings = allFindings ?? [];
  const currentIdx = flatFindings.findIndex((f) => f.id === findingId);
  const nextFindingId =
    currentIdx >= 0 && currentIdx < flatFindings.length - 1
      ? flatFindings[currentIdx + 1].id
      : null;

  const isAiEnhanced = (finding.tags as string[] | null)?.includes("ai-enhanced");

  const grouped = {
    critical: allFindings?.filter((f) => f.severity === "critical") ?? [],
    high: allFindings?.filter((f) => f.severity === "high") ?? [],
    medium: allFindings?.filter((f) => f.severity === "medium") ?? [],
    low: allFindings?.filter((f) => f.severity === "low") ?? [],
  };

  return (
    <div className="flex min-w-0 flex-col gap-6 xl:flex-row">
      <aside className="w-full shrink-0 xl:w-56">
        <h3 className="mb-3 font-semibold">Findings ({allFindings?.length ?? 0})</h3>
        {Object.entries(grouped).map(([sev, list]) =>
          list.length ? (
            <div key={sev} className="mb-4">
              <p className={`mb-1 text-xs font-semibold uppercase ${severityColor(sev)} px-1`}>
                {sev} ({list.length})
              </p>
              <ul className="space-y-1 text-sm">
                {list.map((f) => (
                  <li key={f.id}>
                    <Link
                      href={`/agents/script-review/${id}/findings/${f.id}`}
                      className={`block rounded px-2 py-1 hover:bg-slate-100 ${
                        f.id === findingId ? "bg-brand-50 font-medium text-brand-700" : ""
                      }`}
                    >
                      {f.finding_code ?? f.rule_id}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null
        )}
      </aside>

      <div className="min-w-0 flex-1">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/dashboard" },
            { label: "Script Review", href: `/agents/script-review/${id}/results` },
            { label: "Findings" },
            { label: finding.finding_code ?? finding.rule_id },
          ]}
        />
        <h1 className="text-xl font-bold">Finding Details</h1>

        <div className="card mt-4 min-w-0 overflow-hidden p-6">
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-xs capitalize ${severityColor(finding.severity)}`}>
              {finding.severity}
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">Rule: {finding.rule_id}</span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{finding.category}</span>
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
              {finding.status ?? "open"}
            </span>
          </div>
          <h2 className="mt-4 break-words text-lg font-semibold">
            {finding.finding_code} — {finding.issue}
          </h2>
          <p className="mt-1 text-sm text-slate-500">Impacted: {finding.element}</p>

          <section className="mt-6">
            <h3 className="font-semibold">Issue</h3>
            <p className="mt-1 text-sm text-slate-600">{finding.issue}</p>
          </section>
          <section className="mt-4">
            <h3 className="font-semibold">Why It Matters</h3>
            <p className="mt-1 text-sm text-slate-600">{finding.why_it_matters ?? finding.impact}</p>
          </section>
          {finding.location_path && (
            <section className="mt-4">
              <h3 className="font-semibold">Location</h3>
              <p className="mt-1 font-mono text-xs text-slate-600">{finding.location_path}</p>
            </section>
          )}
          {finding.code_snippet && (
            <pre className="mt-4 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-900 p-4 text-xs text-red-300">
              {finding.code_snippet}
            </pre>
          )}
          <section className="mt-4">
            <h3 className="font-semibold">Recommendation</h3>
            <p className="mt-1 text-sm text-slate-600">{finding.recommendation}</p>
            <p className="mt-2 text-xs text-brand-600">
              {isAiEnhanced || review?.ai_mode === "enabled"
                ? "Generated via AI Recommendation Layer + rule engine"
                : "Generated via built-in rule template"}
            </p>
          </section>
          {(finding.fix_pattern_current || finding.fix_pattern_recommended) && (
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="min-w-0 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-xs font-semibold text-red-800">Current (Risky)</p>
                <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap break-words text-xs text-red-900">
                  {finding.fix_pattern_current}
                </pre>
              </div>
              <div className="min-w-0 rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-xs font-semibold text-green-800">Recommended (Safe)</p>
                <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap break-words text-xs text-green-900">
                  {finding.fix_pattern_recommended}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href={`/agents/script-review/${id}/results`}
            className="text-sm text-brand-600 hover:underline"
          >
            ← Back to Results
          </Link>
        </div>
      </div>

      <aside className="w-full shrink-0 space-y-4 xl:w-64">
        <FindingActions
          findingId={findingId}
          reviewId={id}
          currentStatus={finding.status ?? "open"}
          nextFindingId={nextFindingId}
        />
        <div className="card p-4 text-sm">
          <h3 className="font-semibold">Metadata</h3>
          <dl className="mt-2 space-y-2">
            <div>
              <dt className="text-slate-400">Detected By</dt>
              <dd>
                Script Review Agent
                {review?.ai_mode === "enabled" && (
                  <span className="ml-1 rounded bg-purple-100 px-1 text-xs text-purple-800">AI</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Confidence</dt>
              <dd>{finding.confidence ?? "High"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Script</dt>
              <dd>{review?.script_name}</dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}
