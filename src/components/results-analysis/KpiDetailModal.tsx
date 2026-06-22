"use client";

import { X } from "lucide-react";
import type {
  AnalysisResultPayload,
  ParsedTransaction,
  ResultsAnalysisRecord,
  ScriptSummaryRow,
  TechnicalFinding,
} from "@/lib/results-analysis/types";
import { resolveScriptSummaries } from "@/lib/results-analysis/script-summary";
import {
  fmtBandwidth,
  fmtCount,
  fmtDurationSec,
  fmtPct,
  fmtRt,
  fmtThroughput,
} from "@/lib/results-analysis/display-metrics";
import { cn, formatDate, pillBadge, scoreColor } from "@/lib/utils";
import { ScriptLevelExecutiveSummary } from "@/components/results-analysis/ScriptLevelExecutiveSummary";
import { buildGoNoGoRationale } from "@/lib/results-analysis/go-no-go-summary";

export type ExecutiveKpiKey =
  | "overall_status"
  | "performance_score"
  | "max_users"
  | "duration"
  | "avg_response_time"
  | "p90_response_time"
  | "p95_response_time"
  | "p99_response_time"
  | "min_response_time"
  | "max_response_time"
  | "median_response_time"
  | "std_deviation"
  | "avg_latency"
  | "error_rate"
  | "error_count"
  | "throughput"
  | "avg_bandwidth"
  | "total_samples";

const KPI_TITLES: Record<ExecutiveKpiKey, string> = {
  overall_status: "Overall Status",
  performance_score: "Performance Score",
  max_users: "Max Users",
  duration: "Duration",
  avg_response_time: "Avg Response Time",
  p90_response_time: "P90 Response Time",
  p95_response_time: "P95 Response Time",
  p99_response_time: "P99 Response Time",
  min_response_time: "Min Response Time",
  max_response_time: "Max Response Time",
  median_response_time: "Median Response Time",
  std_deviation: "Std Deviation",
  avg_latency: "Avg Latency",
  error_rate: "Error Rate",
  error_count: "Error Count",
  throughput: "Throughput",
  avg_bandwidth: "Avg Bandwidth",
  total_samples: "Total Samples",
};

type TabId = "executive" | "technical" | "errors" | "timeline" | "baseline" | "rca" | "defects" | "reports";

const KPI_MODAL_MAX_WIDTH: Partial<Record<ExecutiveKpiKey, string>> = {
  overall_status: "max-w-6xl",
  error_rate: "max-w-5xl",
  error_count: "max-w-5xl",
};

export function KpiDetailModal({
  kpiKey,
  result,
  analysis,
  onClose,
  onNavigateTab,
}: {
  kpiKey: ExecutiveKpiKey;
  result: AnalysisResultPayload;
  analysis: ResultsAnalysisRecord;
  onClose: () => void;
  onNavigateTab?: (tab: TabId) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kpi-detail-title"
        className={cn(
          "relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl bg-white shadow-xl",
          KPI_MODAL_MAX_WIDTH[kpiKey] ?? "max-w-3xl"
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="kpi-detail-title" className="text-lg font-semibold text-slate-900">
              {KPI_TITLES[kpiKey]}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">Detailed breakdown for this metric</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          <KpiDetailBody
            kpiKey={kpiKey}
            result={result}
            analysis={analysis}
            onNavigateTab={onNavigateTab}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}

function KpiDetailBody({
  kpiKey,
  result,
  analysis,
  onNavigateTab,
  onClose,
}: {
  kpiKey: ExecutiveKpiKey;
  result: AnalysisResultPayload;
  analysis: ResultsAnalysisRecord;
  onNavigateTab?: (tab: TabId) => void;
  onClose: () => void;
}) {
  const m = result.summaryMetrics;
  const snap = analysis.blazemeterSnapshot;
  const ctx = analysis.testContext;

  switch (kpiKey) {
    case "overall_status": {
      const scriptSummaries = resolveScriptSummaries(result, analysis);

      return (
        <div className="space-y-4">
          <DetailSection title="Assessment">
            <p className="text-sm text-slate-600">
              Overall status is <strong className="capitalize">{result.overallStatus}</strong> with a{" "}
              <strong>{result.goNoGo.replace("_", " ")}</strong> recommendation.
            </p>
          </DetailSection>
          <ScriptLevelExecutiveSummary rows={scriptSummaries} embedded analysis={analysis} />

          <DetailSection title="Release recommendation">
            {(() => {
              const { headline, bullets, guidance } = buildGoNoGoRationale(result, scriptSummaries);
              return (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-900">{headline}</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                  <p className="text-sm text-slate-600">{guidance}</p>
                </div>
              );
            })()}
          </DetailSection>

          {result.topRisks.length > 0 && (
            <DetailSection title="Top risks">
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                {result.topRisks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </DetailSection>
          )}
          <NavLink label="View technical findings" tab="technical" onNavigateTab={onNavigateTab} onClose={onClose} />
        </div>
      );
    }

    case "performance_score":
      return (
        <div className="space-y-4">
          <DetailSection title="Score">
            <p className={cn("text-2xl font-bold", scoreColor(result.performanceScore))}>
              {result.performanceScore} / 100
            </p>
          </DetailSection>
          <DetailSection title="Score breakdown">
            <dl className="grid gap-3 sm:grid-cols-2">
              <ScoreRow label="SLA compliance" value={result.scoreBreakdown.slaScore} />
              <ScoreRow label="Error impact" value={result.scoreBreakdown.errorScore} />
              <ScoreRow label="Throughput" value={result.scoreBreakdown.throughputScore} />
              <ScoreRow label="Stability" value={result.scoreBreakdown.stabilityScore} />
              <ScoreRow label="Baseline" value={result.scoreBreakdown.baselineScore} />
            </dl>
          </DetailSection>
          {result.findings.filter((f) => f.status === "fail").length > 0 && (
            <DetailSection title="Primary score drivers">
              <ul className="space-y-2 text-sm text-slate-600">
                {result.findings
                  .filter((f) => f.status === "fail")
                  .slice(0, 5)
                  .map((f) => (
                    <li key={f.id}>
                      <span className="font-medium">{f.transaction}:</span> {f.finding}
                    </li>
                  ))}
              </ul>
            </DetailSection>
          )}
        </div>
      );

    case "max_users":
      return (
        <div className="space-y-4">
          <DetailSection title="Load configuration">
            <MetricGrid
              rows={[
                ["Peak users (report)", String(m.maxUsers)],
                ["Target users (test context)", String(ctx.targetUsers)],
                ...(snap?.apiSummary
                  ? [["Concurrency (API summary)", `${snap.apiSummary.concurrency} VU`]]
                  : []),
                ...(snap?.master.maxUsers != null
                  ? [["BlazeMeter master max users", String(snap.master.maxUsers)]]
                  : []),
              ]}
            />
          </DetailSection>
          {snap?.kpiTimeline?.activeThreads.length ? (
            <DetailSection title="Active threads over time">
              <TimelineSnippet
                points={snap.kpiTimeline.activeThreads.slice(0, 8)}
                formatValue={(v) => `${Math.round(v)} VU`}
              />
            </DetailSection>
          ) : null}
          <NavLink label="View timeline charts" tab="timeline" onNavigateTab={onNavigateTab} onClose={onClose} />
        </div>
      );

    case "duration":
      return (
        <div className="space-y-4">
          <DetailSection title="Test window">
            <MetricGrid
              rows={[
                ...(snap?.master.createdAtIso
                  ? [["Started", formatDate(snap.master.createdAtIso)]]
                  : []),
                ...(snap?.master.endedAtIso
                  ? [["Ended", formatDate(snap.master.endedAtIso)]]
                  : []),
                ["Wall-clock duration", `${m.durationMinutes} min`],
                ...(m.activeDurationMinutes != null
                  ? [["Active duration (report)", `${m.activeDurationMinutes} min`]]
                  : []),
                ...(m.durationSec != null
                  ? [["Report duration (sec)", fmtDurationSec(m.durationSec)]]
                  : []),
                ...(snap?.apiSummary
                  ? [["API summary duration", fmtDurationSec(snap.apiSummary.durationSec)]]
                  : []),
              ]}
            />
          </DetailSection>
          <NavLink label="View timeline" tab="timeline" onNavigateTab={onNavigateTab} onClose={onClose} />
        </div>
      );

    case "error_rate":
    case "error_count":
      return <ErrorDetailContent result={result} analysis={analysis} onNavigateTab={onNavigateTab} onClose={onClose} />;

    case "throughput":
      return (
        <div className="space-y-4">
          <DetailSection title="Throughput summary">
            <p className="text-sm text-slate-600">
              Aggregate throughput is <strong>{fmtThroughput(m.throughput)}</strong> across{" "}
              {fmtCount(m.totalSamples ?? 0)} samples.
            </p>
          </DetailSection>
          <TransactionMetricTable
            transactions={sortedTransactions(result.transactions, (tx) => tx.throughput, "desc")}
            columns={[
              { header: "Transaction", cell: (tx) => tx.name },
              { header: "Throughput", cell: (tx) => fmtThroughput(tx.throughput) },
              { header: "Samples", cell: (tx) => fmtCount(tx.samples) },
            ]}
          />
          <NavLink label="View full transaction metrics" tab="technical" onNavigateTab={onNavigateTab} onClose={onClose} />
        </div>
      );

    case "avg_bandwidth":
      return (
        <div className="space-y-4">
          <DetailSection title="Bandwidth summary">
            <p className="text-sm text-slate-600">
              Average bandwidth is <strong>{fmtBandwidth(m.avgBandwidthKiBps ?? 0)}</strong>.
            </p>
          </DetailSection>
          <TransactionMetricTable
            transactions={sortedTransactions(
              result.transactions.filter((tx) => tx.avgBytes != null && tx.avgBytes > 0),
              (tx) => tx.avgBytes ?? 0,
              "desc"
            )}
            columns={[
              { header: "Transaction", cell: (tx) => tx.name },
              { header: "Avg bandwidth", cell: (tx) => fmtBandwidth(tx.avgBytes ?? 0) },
              { header: "Samples", cell: (tx) => fmtCount(tx.samples) },
            ]}
            emptyMessage="No per-transaction bandwidth in the report."
          />
          {snap?.kpiTimeline?.bandwidthKiBps.length ? (
            <DetailSection title="Bandwidth over time">
              <TimelineSnippet
                points={snap.kpiTimeline.bandwidthKiBps.slice(0, 8)}
                formatValue={(v) => fmtBandwidth(v)}
              />
            </DetailSection>
          ) : null}
        </div>
      );

    case "total_samples":
      return (
        <div className="space-y-4">
          <DetailSection title="Sample count">
            <p className="text-sm text-slate-600">
              Total samples recorded: <strong>{fmtCount(m.totalSamples ?? 0)}</strong>
            </p>
          </DetailSection>
          <TransactionMetricTable
            transactions={sortedTransactions(result.transactions, (tx) => tx.samples, "desc")}
            columns={[
              { header: "Transaction", cell: (tx) => tx.name },
              { header: "Samples", cell: (tx) => fmtCount(tx.samples) },
              { header: "Error rate", cell: (tx) => fmtPct(tx.errorRatePct) },
            ]}
          />
        </div>
      );

    default:
      return (
        <ResponseTimeDetailContent
          kpiKey={kpiKey}
          result={result}
          onNavigateTab={onNavigateTab}
          onClose={onClose}
        />
      );
  }
}

function ErrorDetailContent({
  result,
  analysis,
  onNavigateTab,
  onClose,
}: {
  result: AnalysisResultPayload;
  analysis: ResultsAnalysisRecord;
  onNavigateTab?: (tab: TabId) => void;
  onClose: () => void;
}) {
  const e = result.errorAnalysis;
  const snapErrors = analysis.blazemeterSnapshot?.errorRows ?? [];
  const rows = e.errorRows.length > 0 ? e.errorRows : snapErrors;

  return (
    <div className="space-y-4">
      <DetailSection title="Error summary">
        <MetricGrid
          rows={[
            ["Total errors", fmtCount(e.totalErrors)],
            ["Error rate", fmtPct(e.overallErrorRatePct)],
            ["App errors (4xx)", fmtCount(e.appErrors4xx)],
            ["Server errors (5xx)", fmtCount(e.serverErrors5xx)],
          ]}
        />
      </DetailSection>

      {e.errorsByTransaction.length > 0 && (
        <DetailSection title="Errors by transaction">
          <SimpleTable
            headers={["Transaction", "Count", "% of total"]}
            rows={e.errorsByTransaction.map((row) => [
              row.name,
              row.count.toLocaleString(),
              `${row.pct.toFixed(1)}%`,
            ])}
          />
        </DetailSection>
      )}

      <DetailSection title={`Error breakdown (${rows.length} rows)`}>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No detailed error rows available. Re-import from BlazeMeter to refresh.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Transaction</th>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Message</th>
                  <th className="px-3 py-2">Count</th>
                  <th className="px-3 py-2">Cause</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={`${row.transaction}-${row.errorCode}-${i}`} className="border-t border-slate-100">
                    <td className="px-3 py-2">{row.transaction}</td>
                    <td className="px-3 py-2">
                      <span className={pillBadge("bg-red-100 text-red-800 border-red-200")}>{row.errorCode}</span>
                    </td>
                    <td className="px-3 py-2">{row.message}</td>
                    <td className="px-3 py-2">{row.count.toLocaleString()}</td>
                    <td className="px-3 py-2 text-slate-600">{row.possibleCause}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DetailSection>

      {(e.keyInsight || e.aiInterpretation) && (
        <DetailSection title="Insights">
          {e.keyInsight ? <p className="mb-2 text-sm font-medium text-slate-800">{e.keyInsight}</p> : null}
          <p className="text-sm text-slate-600">{e.aiInterpretation}</p>
        </DetailSection>
      )}

      <NavLink label="Open full Error Analysis tab" tab="errors" onNavigateTab={onNavigateTab} onClose={onClose} />
    </div>
  );
}

function ResponseTimeDetailContent({
  kpiKey,
  result,
  onNavigateTab,
  onClose,
}: {
  kpiKey: ExecutiveKpiKey;
  result: AnalysisResultPayload;
  onNavigateTab?: (tab: TabId) => void;
  onClose: () => void;
}) {
  const metric = getResponseMetricAccessor(kpiKey);
  if (!metric) {
    return <p className="text-sm text-slate-500">No detail available for this metric.</p>;
  }

  const sorted = sortedTransactions(
    result.transactions.filter((tx) => metric.getValue(tx) != null),
    (tx) => metric.getValue(tx) ?? 0,
    metric.sort
  );

  const latencyFindings = result.findings.filter(
    (f) => f.status !== "pass" && f.finding.toLowerCase().includes("response")
  );

  return (
    <div className="space-y-4">
      <DetailSection title={KPI_TITLES[kpiKey]}>
        <p className="text-sm text-slate-600">
          Aggregate value: <strong>{fmtRt(metric.aggregate(result.summaryMetrics))}</strong>
        </p>
      </DetailSection>

      <TransactionMetricTable
        transactions={sorted}
        columns={[
          { header: "Transaction", cell: (tx) => tx.name },
          { header: metric.columnLabel, cell: (tx) => fmtRt(metric.getValue(tx) ?? 0) },
          { header: "Samples", cell: (tx) => fmtCount(tx.samples) },
          { header: "Status", cell: (tx) => {
            const status = result.findings.find((f) => f.transaction === tx.name)?.status;
            return status ? <span className="capitalize">{status}</span> : "—";
          }},
        ]}
      />

      {result.baselineComparison && result.baselineComparison.length > 0 && (
        <DetailSection title="Baseline comparison">
          <SimpleTable
            headers={["Transaction", "Current", "Baseline", "Delta"]}
            rows={result.baselineComparison.map((row) => [
              row.transaction,
              fmtRt(row.currentAvgRtSec),
              fmtRt(row.baselineAvgRtSec),
              `${row.deltaPct >= 0 ? "+" : ""}${row.deltaPct.toFixed(1)}%`,
            ])}
          />
        </DetailSection>
      )}

      {latencyFindings.length > 0 && (
        <DetailSection title="Related findings">
          <ul className="space-y-2 text-sm text-slate-600">
            {latencyFindings.slice(0, 5).map((f) => (
              <li key={f.id}>
                <span className="font-medium">{f.transaction}:</span> {f.finding}
              </li>
            ))}
          </ul>
        </DetailSection>
      )}

      <NavLink label="View technical analysis" tab="technical" onNavigateTab={onNavigateTab} onClose={onClose} />
    </div>
  );
}

function getResponseMetricAccessor(kpiKey: ExecutiveKpiKey) {
  const map: Partial<
    Record<
      ExecutiveKpiKey,
      {
        columnLabel: string;
        sort: "asc" | "desc";
        getValue: (tx: ParsedTransaction) => number | undefined;
        aggregate: (m: AnalysisResultPayload["summaryMetrics"]) => number;
      }
    >
  > = {
    avg_response_time: {
      columnLabel: "Avg RT",
      sort: "desc",
      getValue: (tx) => tx.avgRtSec,
      aggregate: (m) => m.avgResponseTimeSec,
    },
    p90_response_time: {
      columnLabel: "P90",
      sort: "desc",
      getValue: (tx) => tx.p90Sec,
      aggregate: (m) => m.p90ResponseTimeSec ?? 0,
    },
    p95_response_time: {
      columnLabel: "P95",
      sort: "desc",
      getValue: (tx) => tx.p95Sec,
      aggregate: (m) => m.p95ResponseTimeSec,
    },
    p99_response_time: {
      columnLabel: "P99",
      sort: "desc",
      getValue: (tx) => tx.p99Sec,
      aggregate: (m) => m.p99ResponseTimeSec ?? 0,
    },
    min_response_time: {
      columnLabel: "Min RT",
      sort: "asc",
      getValue: (tx) => tx.minRtSec,
      aggregate: (m) => m.minResponseTimeSec ?? 0,
    },
    max_response_time: {
      columnLabel: "Max RT",
      sort: "desc",
      getValue: (tx) => tx.maxRtSec,
      aggregate: (m) => m.maxResponseTimeSec ?? 0,
    },
    median_response_time: {
      columnLabel: "Median",
      sort: "desc",
      getValue: (tx) => tx.medianRtSec,
      aggregate: (m) => m.medianResponseTimeSec ?? 0,
    },
    std_deviation: {
      columnLabel: "Std dev",
      sort: "desc",
      getValue: (tx) => tx.stDevSec,
      aggregate: (m) => m.stDevSec ?? 0,
    },
    avg_latency: {
      columnLabel: "Latency",
      sort: "desc",
      getValue: (tx) => tx.avgLatencySec,
      aggregate: (m) => m.avgLatencySec ?? 0,
    },
  };
  return map[kpiKey];
}

function sortedTransactions(
  transactions: ParsedTransaction[],
  getValue: (tx: ParsedTransaction) => number,
  order: "asc" | "desc"
) {
  return [...transactions].sort((a, b) => {
    const diff = getValue(a) - getValue(b);
    return order === "desc" ? -diff : diff;
  });
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

function MetricGrid({ rows }: { rows: string[][] }) {
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <dt className="text-xs text-slate-500">{label}</dt>
          <dd className="text-sm font-medium text-slate-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-100 px-3 py-2">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={cn("text-lg font-bold", scoreColor(value))}>{value}</dd>
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-100">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-slate-100">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TransactionMetricTable({
  transactions,
  columns,
  emptyMessage = "No transaction data available.",
}: {
  transactions: ParsedTransaction[];
  columns: { header: string; cell: (tx: ParsedTransaction) => React.ReactNode }[];
  emptyMessage?: string;
}) {
  if (transactions.length === 0) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-100">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            {columns.map((col) => (
              <th key={col.header} className="px-3 py-2">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transactions.slice(0, 15).map((tx) => (
            <tr key={tx.name} className="border-t border-slate-100">
              {columns.map((col) => (
                <td key={col.header} className="px-3 py-2">
                  {col.cell(tx)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {transactions.length > 15 ? (
        <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
          Showing top 15 of {transactions.length} transactions
        </p>
      ) : null}
    </div>
  );
}

function ScriptGroupedTransactionStatus({
  scriptSummaries,
  findings,
}: {
  scriptSummaries: ScriptSummaryRow[];
  findings: TechnicalFinding[];
}) {
  const findingByTx = new Map<string, TechnicalFinding>();
  for (const f of findings) {
    findingByTx.set(f.transaction, f);
  }

  const groups = scriptSummaries.map((s) => {
    const txNames = s.failedTransactions ?? [];
    const scriptFindings = txNames
      .map((tx) => findingByTx.get(tx))
      .filter((x): x is TechnicalFinding => Boolean(x));

    return {
      scriptName: s.scriptName,
      result: s.result,
      findings: scriptFindings,
    };
  });

  const assignedTx = new Set<string>();
  for (const g of groups) {
    for (const f of g.findings) assignedTx.add(f.transaction);
  }
  const unassigned = findings.filter((f) => !assignedTx.has(f.transaction));

  const firstOpenIndex = groups.findIndex((g) => g.findings.length > 0);
  const firstScriptOpen = firstOpenIndex === -1 ? 0 : firstOpenIndex;

  return (
    <div className="space-y-3">
      {groups.map((g, idx) => {
        const badge =
          g.result === "pass"
            ? "bg-green-100 text-green-800 border-green-200"
            : "bg-red-100 text-red-800 border-red-200";

        return (
          <details
            key={g.scriptName}
            open={idx === firstScriptOpen}
            className="rounded-lg border border-slate-100 bg-white px-3 py-2"
          >
            <summary className="cursor-pointer select-none">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={pillBadge(badge)}>{g.result === "pass" ? "Pass" : "Fail"}</span>
                  <span className="truncate font-medium text-slate-900">{g.scriptName}</span>
                </div>
                <span className="text-xs text-slate-500">{g.findings.length} txn(s)</span>
              </div>
            </summary>

            <div className="mt-3 max-h-72 overflow-auto">
              {g.findings.length === 0 ? (
                <p className="text-sm text-slate-500">No failed/warning transactions for this script.</p>
              ) : (
                <TransactionStatusTable findings={g.findings} />
              )}
            </div>
          </details>
        );
      })}

      {unassigned.length > 0 && (
        <details open className="rounded-lg border border-slate-100 bg-white px-3 py-2">
          <summary className="cursor-pointer select-none">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className={pillBadge("bg-amber-100 text-amber-800 border-amber-200")}>Other</span>
                <span className="truncate font-medium text-slate-900">Unassigned transactions</span>
              </div>
              <span className="text-xs text-slate-500">{unassigned.length} txn(s)</span>
            </div>
          </summary>
          <div className="mt-3 max-h-72 overflow-auto">
            <TransactionStatusTable findings={unassigned} />
          </div>
        </details>
      )}
    </div>
  );
}

function statusBadgeClass(status: string): string {
  if (status === "fail") return "bg-red-100 text-red-800 border-red-200";
  if (status === "warning") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-green-100 text-green-800 border-green-200";
}

function TransactionStatusTable({ findings }: { findings: TechnicalFinding[] }) {
  const sorted = [...findings].sort((a, b) => {
    const rank = (s: string) => (s === "fail" ? 2 : s === "warning" ? 1 : 0);
    return rank(b.status) - rank(a.status) || a.transaction.localeCompare(b.transaction);
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-100">
      <table className="min-w-[680px] text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Transaction</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Finding</th>
            <th className="px-3 py-2">Evidence</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((f) => (
            <tr key={f.id} className="border-t border-slate-100 align-top">
              <td className="px-3 py-2 break-words">{f.transaction}</td>
              <td className="px-3 py-2">
                <span className={pillBadge(statusBadgeClass(f.status))}>{f.status}</span>
              </td>
              <td className="px-3 py-2 whitespace-pre-wrap break-words text-slate-600">{f.finding}</td>
              <td className="px-3 py-2 text-xs text-slate-600">
                {f.evidence.slice(0, 3).join(" • ")}
                {f.evidence.length > 3 ? (
                  <span className="text-slate-500"> +{f.evidence.length - 3} more</span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TimelineSnippet({
  points,
  formatValue,
}: {
  points: { time: string; value: number }[];
  formatValue: (value: number) => string;
}) {
  return (
    <SimpleTable
      headers={["Time", "Value"]}
      rows={points.map((p) => [p.time, formatValue(p.value)])}
    />
  );
}

function NavLink({
  label,
  tab,
  onNavigateTab,
  onClose,
}: {
  label: string;
  tab: TabId;
  onNavigateTab?: (tab: TabId) => void;
  onClose: () => void;
}) {
  if (!onNavigateTab) return null;
  return (
    <button
      type="button"
      className="text-sm font-medium text-brand-600 hover:underline"
      onClick={() => {
        onNavigateTab(tab);
        onClose();
      }}
    >
      {label} →
    </button>
  );
}
