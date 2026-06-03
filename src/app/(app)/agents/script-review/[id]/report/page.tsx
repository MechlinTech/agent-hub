import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { createClient } from "@/lib/supabase/server";
import { getReportExports } from "@/lib/analytics";
import { formatDate, readinessLabel, scoreColor } from "@/lib/utils";

export default async function ReviewReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: review } = await supabase.from("script_reviews").select("*").eq("id", id).single();
  if (!review) notFound();

  const { data: findings } = await supabase
    .from("review_findings")
    .select("*")
    .eq("script_review_id", id);

  const inventory = review.inventory as Record<string, number> | null;
  const bySeverity = {
    critical: findings?.filter((f) => f.severity === "critical") ?? [],
    high: findings?.filter((f) => f.severity === "high") ?? [],
    medium: findings?.filter((f) => f.severity === "medium") ?? [],
    low: findings?.filter((f) => f.severity === "low") ?? [],
  };

  const exports = await getReportExports(id);

  const sections = [
    { id: "summary", title: "Executive Summary" },
    { id: "inventory", title: "Inventory Snapshot" },
    { id: "critical", title: "Critical Findings" },
    { id: "high", title: "High Findings" },
    { id: "fixes", title: "Recommended Fix Order" },
    { id: "final", title: "Final Recommendation" },
  ];

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Script Review Agent", href: "/agents/script-review" },
          { label: "Final Report" },
        ]}
      />
      <div className="mb-6 flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Review Report</h1>
          <p className="text-slate-500">Comprehensive quality analysis (rule-based v1)</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ExportButtons reviewId={id} scriptName={review.script_name} />
          <Link
            href={`/agents/script-review/${id}/results`}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white"
          >
            View Results
          </Link>
        </div>
      </div>

      <div className="card mb-6 flex flex-wrap items-center gap-6 p-6">
        <div>
          <p className="text-sm text-slate-500">Script</p>
          <p className="font-semibold">{review.script_name}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Review Date</p>
          <p>{formatDate(review.created_at)}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Reviewer</p>
          <p className="flex items-center gap-1">
            Script Review Agent
            <span className="rounded bg-slate-100 px-1.5 text-xs">
              {review.ai_mode === "enabled" ? "AI + Rules" : "Rule-based Engine"}
            </span>
          </p>
        </div>
        <div className={`text-3xl font-bold ${scoreColor(review.score ?? 0)}`}>
          {review.score ?? 0}
          <span className="text-sm font-normal text-slate-500">/100</span>
        </div>
        <div>
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">
            {review.readiness ? readinessLabel(review.readiness) : "—"}
          </span>
          <p className="mt-1 text-xs text-slate-500">Confidence: High (rules)</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <nav className="space-y-1 text-sm">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="block rounded-lg px-3 py-2 hover:bg-slate-100">
              {s.title}
            </a>
          ))}
        </nav>

        <article className="card lg:col-span-2 p-8 prose prose-sm max-w-none">
          <section id="summary">
            <h2>1. Executive Summary</h2>
            <p>{review.executive_summary}</p>
            <div className="not-prose mt-4 grid grid-cols-4 gap-2">
              {[
                ["Quality Score", `${review.score}/100`],
                ["Total Issues", String(findings?.length ?? 0)],
                ["Critical", String(bySeverity.critical.length)],
                ["AI Mode", "Disabled (templates)"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-slate-500">{k}</p>
                  <p className="font-bold">{v}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="inventory" className="mt-8">
            <h2>2. Inventory Snapshot</h2>
            {inventory && (
              <ul>
                <li>Thread Groups: {inventory.threadGroups}</li>
                <li>HTTP Samplers: {inventory.httpSamplers}</li>
                <li>Assertions: {inventory.assertions}</li>
                <li>Timers: {inventory.timers}</li>
                <li>CSV Data Sets: {inventory.csvDataSets}</li>
                <li>Extractors: {inventory.extractors}</li>
                <li>Listeners: {inventory.listeners}</li>
                <li>Disabled Elements: {inventory.disabledElements}</li>
              </ul>
            )}
          </section>

          <section id="critical" className="mt-8">
            <h2>3. Critical Findings ({bySeverity.critical.length})</h2>
            <ol>
              {bySeverity.critical.map((f) => (
                <li key={f.id}>
                  <strong>{f.issue}</strong> — {f.recommendation}
                </li>
              ))}
            </ol>
          </section>

          <section id="high" className="mt-8">
            <h2>4. High Findings ({bySeverity.high.length})</h2>
            <ol>
              {bySeverity.high.map((f) => (
                <li key={f.id}>
                  <strong>{f.issue}</strong> — {f.recommendation}
                </li>
              ))}
            </ol>
          </section>

          <section id="fixes" className="mt-8">
            <h2>5. Recommended Fix Order</h2>
            <ol>
              {((review.fix_order as string[]) ?? []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </section>

          <section id="final" className="mt-8">
            <h2>6. Final Recommendation</h2>
            <p>
              {review.readiness === "ready" || review.readiness === "ready_minor"
                ? "Script may proceed to BlazeMeter with noted fixes."
                : "Do not execute for baseline load testing until Critical and High findings are fixed."}
            </p>
          </section>
        </article>

        <aside className="space-y-4">
          <div className="card p-4 text-sm">
            <h3 className="font-semibold">Export History</h3>
            {exports.length ? (
              <ul className="mt-2 space-y-2">
                {exports.map((ex, i) => (
                  <li key={`${ex.format}-${ex.created_at}-${i}`} className="flex justify-between gap-2">
                    <span className="uppercase">{ex.format}</span>
                    <span className="text-slate-500">{formatDate(ex.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-slate-500">No exports yet. Use the buttons above.</p>
            )}
          </div>
          <div className="card p-4 text-sm">
            <h3 className="font-semibold">Report Source</h3>
            <p className="mt-2 text-slate-600">
              Rule-based engine v1 · AI mode: {review.ai_mode ?? "disabled"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Review ID: {review.external_review_id ?? id.slice(0, 8)}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
