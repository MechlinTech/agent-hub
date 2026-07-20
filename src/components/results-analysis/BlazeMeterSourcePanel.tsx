import Link from "next/link";
import { AlertTriangle, Cloud, ExternalLink } from "lucide-react";
import { KpiTimelineSection } from "@/components/charts/KpiTimelineSection";
import { BlazeMeterReimportButton } from "@/components/results-analysis/BlazeMeterReimportButton";
import { TransactionMetricsTable } from "@/components/results-analysis/TransactionMetricsTable";
import { fmtRtMs } from "@/lib/results-analysis/display-metrics";
import { supplementErrorRows } from "@/lib/results-analysis/error-supplement";
import type { ResultsAnalysisRecord } from "@/lib/results-analysis/types";
import { formatDate, pillBadge } from "@/lib/utils";

function fmtSec(n: number) {
  return `${n.toFixed(2)} sec`;
}

function fmtPct(n: number) {
  return `${n.toFixed(2)}%`;
}

function fmtRt(sec: number | undefined) {
  if (sec === undefined) return "-";
  if (sec < 10) return `${(sec * 1000).toFixed(0)} ms`;
  return fmtSec(sec);
}

function fmtBandwidth(kib: number | undefined) {
  if (kib === undefined) return "-";
  return `${kib.toFixed(2)} KiB/s`;
}

function fmtDurationSec(sec: number | undefined) {
  if (!sec) return "-";
  const mins = Math.floor(sec / 60);
  const rem = Math.round(sec % 60);
  return mins > 0
    ? `${mins} min ${rem > 0 ? `${rem}s` : ""}`.trim()
    : `${Math.round(sec)}s`;
}

function blazeMeterMasterUrl(masterId: string) {
  return `https://a.blazemeter.com/app/#/masters/${masterId}/summary`;
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-slate-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function CompareRow({
  label,
  blazeValue,
  analysisValue,
}: {
  label: string;
  blazeValue: string;
  analysisValue: string | null;
}) {
  const mismatch = analysisValue !== null && blazeValue !== analysisValue;
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3 font-medium text-slate-700">{label}</td>
      <td className="px-4 py-3 text-slate-900">{blazeValue}</td>
      <td className="px-4 py-3 text-slate-900">{analysisValue ?? "-"}</td>
      <td className="px-4 py-3">
        {analysisValue === null ? (
          <span className="text-xs text-slate-400">Not analyzed yet</span>
        ) : mismatch ? (
          <span
            className={pillBadge(
              "bg-amber-100 text-amber-800 border-amber-200",
            )}
          >
            Differs
          </span>
        ) : (
          <span
            className={pillBadge(
              "bg-green-100 text-green-800 border-green-200",
            )}
          >
            Match
          </span>
        )}
      </td>
    </tr>
  );
}

export function BlazeMeterSourcePanel({
  analysis,
}: {
  analysis: ResultsAnalysisRecord;
}) {
  const snapshot = analysis.blazemeterSnapshot;
  const analyzed = analysis.resultPayload?.summaryMetrics;
  const blazeSummary = snapshot?.summary;

  if (!snapshot && !analysis.masterId) {
    return (
      <div className="card p-8 text-center">
        <Cloud className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <h2 className="text-lg font-semibold text-slate-900">
          No BlazeMeter source data
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          This analysis was created from CSV upload, not a BlazeMeter API
          import.
        </p>
        <Link
          href={`/agents/results-analysis/${analysis.id}`}
          className="mt-4 inline-block text-sm text-brand-600 underline"
        >
          Back to analysis overview
        </Link>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="card p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
        <h2 className="text-lg font-semibold text-slate-900">
          BlazeMeter snapshot not stored
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Master ID {analysis.masterId} was used, but source data was not saved
          (older import).
        </p>
        {analysis.masterId && (
          <div className="mt-4 flex justify-center">
            <BlazeMeterReimportButton
              analysisId={analysis.id}
              masterId={analysis.masterId}
            />
          </div>
        )}
        <Link
          href="/agents/results-analysis/select-run"
          className="mt-4 inline-block text-sm text-brand-600 underline"
        >
          Or import a different run
        </Link>
      </div>
    );
  }

  const m = snapshot.master;
  const total = snapshot.totalRow;
  const errorRows = supplementErrorRows(
    snapshot.errorRows,
    snapshot.transactions,
    snapshot.totalRow,
  );
  const summarySource =
    blazeSummary?.source === "total_row"
      ? "Aggregate ALL/TOTAL row from BlazeMeter report (matches BlazeMeter summary tab)"
      : "Computed from per-transaction rows";

  const summaryCards = [
    {
      label: "Max users",
      value: String(m.maxUsers ?? "-"),
      show: m.maxUsers != null,
    },
    {
      label: "Avg throughput",
      value: `${blazeSummary!.throughput.toFixed(2)} / sec`,
      show: true,
    },
    {
      label: "Error rate",
      value: fmtPct(blazeSummary!.errorRatePct),
      sub:
        blazeSummary!.errorsCount != null
          ? `${blazeSummary!.errorsCount.toLocaleString()} errors`
          : undefined,
      show: true,
    },
    {
      label: "Avg response time",
      value: fmtRt(blazeSummary!.avgResponseTimeSec),
      show: true,
    },
    {
      label: "90% response time",
      value: fmtRt(blazeSummary!.p90ResponseTimeSec),
      show: blazeSummary!.p90ResponseTimeSec != null,
    },
    {
      label: "95% response time",
      value: fmtRt(blazeSummary!.p95ResponseTimeSec),
      show: true,
    },
    {
      label: "99% response time",
      value: fmtRt(blazeSummary!.p99ResponseTimeSec),
      show: blazeSummary!.p99ResponseTimeSec != null,
    },
    {
      label: "Min response time",
      value: fmtRt(blazeSummary!.minResponseTimeSec),
      show: blazeSummary!.minResponseTimeSec != null,
    },
    {
      label: "Max response time",
      value: fmtRt(blazeSummary!.maxResponseTimeSec),
      show: blazeSummary!.maxResponseTimeSec != null,
    },
    {
      label: "Median response time",
      value: fmtRt(blazeSummary!.medianResponseTimeSec),
      show: blazeSummary!.medianResponseTimeSec != null,
    },
    {
      label: "Std deviation",
      value: fmtRt(blazeSummary!.stDevSec),
      show: blazeSummary!.stDevSec != null,
    },
    {
      label: "Avg latency",
      value: fmtRt(total?.avgLatencySec),
      show: total?.avgLatencySec != null && total.avgLatencySec > 0,
    },
    {
      label: "Avg bandwidth",
      value: fmtBandwidth(blazeSummary!.avgBandwidthKiBps),
      show: blazeSummary!.avgBandwidthKiBps != null,
    },
    {
      label: "Active duration",
      value:
        m.activeDurationMinutes != null
          ? `${m.activeDurationMinutes} min`
          : fmtDurationSec(blazeSummary!.durationSec),
      sub: blazeSummary!.durationSec
        ? `${Math.round(blazeSummary!.durationSec)}s in report`
        : undefined,
      show:
        m.activeDurationMinutes != null || blazeSummary!.durationSec != null,
    },
    {
      label: "Total samples",
      value: blazeSummary!.totalSamples.toLocaleString(),
      show: true,
    },
  ].filter((c) => c.show);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            BlazeMeter Results
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Raw data pulled from BlazeMeter API at import time. Compare with the
            analyzed overview.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {analysis.masterId && (
            <BlazeMeterReimportButton
              analysisId={analysis.id}
              masterId={analysis.masterId}
            />
          )}
          <a
            href={blazeMeterMasterUrl(snapshot.masterId)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary inline-flex items-center gap-1.5 text-sm"
          >
            <ExternalLink className="h-4 w-4" />
            Open in BlazeMeter
          </a>
          <Link
            href={`/agents/results-analysis/${analysis.id}`}
            className="btn-secondary text-sm"
          >
            View analysis overview
          </Link>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 font-semibold text-slate-900">
          Master run metadata
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div>
            <dt className="text-slate-500">Run name</dt>
            <dd className="font-medium">{m.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Master ID</dt>
            <dd className="font-mono">{snapshot.masterId}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Test ID</dt>
            <dd>{m.testId ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Max users (BlazeMeter)</dt>
            <dd className="font-medium">{m.maxUsers ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Active duration (report)</dt>
            <dd>
              {m.activeDurationMinutes != null
                ? `${m.activeDurationMinutes} min`
                : blazeSummary!.durationSec
                  ? fmtDurationSec(blazeSummary!.durationSec)
                  : "-"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Wall-clock duration</dt>
            <dd>{m.durationMinutes} min</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd>
              {m.passed === true
                ? "Passed"
                : m.passed === false
                  ? "Completed with issues"
                  : total?.passedThresholds === true
                    ? "Passed thresholds"
                    : total?.passedThresholds === false
                      ? "Failed thresholds"
                      : "-"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Started</dt>
            <dd>{formatDate(m.createdAtIso)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Ended</dt>
            <dd>{m.endedAtIso ? formatDate(m.endedAtIso) : "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Fetched at</dt>
            <dd>{formatDate(snapshot.fetchedAt)}</dd>
          </div>
          {total?.concurrency != null && (
            <div>
              <dt className="text-slate-500">Concurrency (report)</dt>
              <dd>{total.concurrency} VU</dd>
            </div>
          )}
        </dl>
        {m.note && (
          <p className="mt-4 text-sm text-slate-600">
            <span className="font-medium">Note:</span> {m.note}
          </p>
        )}
      </div>

      {snapshot.apiSummary && (
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900">
            BlazeMeter API summary statistics
          </h2>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div>
              <dt className="text-slate-500">Avg response time</dt>
              <dd className="font-medium">
                {fmtRtMs(snapshot.apiSummary.avgResponseTimeMs)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">90th percentile</dt>
              <dd className="font-medium">
                {fmtRtMs(snapshot.apiSummary.tp90Ms)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Min / max RT</dt>
              <dd className="font-medium">
                {fmtRtMs(snapshot.apiSummary.minMs)} /{" "}
                {fmtRtMs(snapshot.apiSummary.maxMs)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Hits / sec</dt>
              <dd className="font-medium">
                {snapshot.apiSummary.hitsPerSec.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Failed count</dt>
              <dd className="font-medium">
                {snapshot.apiSummary.failedCount.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Total bytes</dt>
              <dd className="font-medium">
                {snapshot.apiSummary.totalBytes.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Concurrency</dt>
              <dd className="font-medium">
                {snapshot.apiSummary.concurrency} VU
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Duration</dt>
              <dd className="font-medium">
                {fmtDurationSec(snapshot.apiSummary.durationSec)}
              </dd>
            </div>
          </dl>
        </div>
      )}

      <div>
        <h2 className="mb-3 font-semibold text-slate-900">
          Summary metrics (from BlazeMeter report)
        </h2>
        <p className="mb-4 text-xs text-slate-500">{summarySource}</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <MetricCard
              key={card.label}
              label={card.label}
              value={card.value}
              sub={card.sub}
            />
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="font-semibold text-slate-900">
            BlazeMeter vs analysis overview
          </h2>
          <p className="text-xs text-slate-500">
            Analysis overview shows a subset of metrics. Re-import after parser
            updates to refresh values.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Metric</th>
                <th className="px-4 py-3">BlazeMeter (raw)</th>
                <th className="px-4 py-3">Analysis overview</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <CompareRow
                label="Max users"
                blazeValue={String(m.maxUsers ?? "-")}
                analysisValue={analyzed ? String(analyzed.maxUsers) : null}
              />
              <CompareRow
                label="Active duration"
                blazeValue={
                  m.activeDurationMinutes != null
                    ? `${m.activeDurationMinutes} min`
                    : fmtDurationSec(blazeSummary!.durationSec)
                }
                analysisValue={
                  analyzed ? `${analyzed.durationMinutes} min` : null
                }
              />
              <CompareRow
                label="Avg response time"
                blazeValue={fmtRt(blazeSummary!.avgResponseTimeSec)}
                analysisValue={
                  analyzed ? fmtRt(analyzed.avgResponseTimeSec) : null
                }
              />
              <CompareRow
                label="90% response time"
                blazeValue={fmtRt(blazeSummary!.p90ResponseTimeSec)}
                analysisValue={null}
              />
              <CompareRow
                label="95% response time"
                blazeValue={fmtRt(blazeSummary!.p95ResponseTimeSec)}
                analysisValue={
                  analyzed ? fmtRt(analyzed.p95ResponseTimeSec) : null
                }
              />
              <CompareRow
                label="99% response time"
                blazeValue={fmtRt(blazeSummary!.p99ResponseTimeSec)}
                analysisValue={null}
              />
              <CompareRow
                label="Error rate"
                blazeValue={fmtPct(blazeSummary!.errorRatePct)}
                analysisValue={analyzed ? fmtPct(analyzed.errorRatePct) : null}
              />
              <CompareRow
                label="Error count"
                blazeValue={
                  blazeSummary!.errorsCount != null
                    ? blazeSummary!.errorsCount.toLocaleString()
                    : "-"
                }
                analysisValue={null}
              />
              <CompareRow
                label="Throughput"
                blazeValue={`${blazeSummary!.throughput.toFixed(2)} / sec`}
                analysisValue={
                  analyzed ? `${analyzed.throughput.toFixed(2)} / sec` : null
                }
              />
              <CompareRow
                label="Avg bandwidth"
                blazeValue={fmtBandwidth(blazeSummary!.avgBandwidthKiBps)}
                analysisValue={null}
              />
              <CompareRow
                label="Median response time"
                blazeValue={fmtRt(blazeSummary!.medianResponseTimeSec)}
                analysisValue={null}
              />
              <CompareRow
                label="Min / max response time"
                blazeValue={`${fmtRt(blazeSummary!.minResponseTimeSec)} / ${fmtRt(blazeSummary!.maxResponseTimeSec)}`}
                analysisValue={null}
              />
              <CompareRow
                label="Std deviation"
                blazeValue={fmtRt(blazeSummary!.stDevSec)}
                analysisValue={null}
              />
            </tbody>
          </table>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 font-semibold text-slate-900">
          Reports imported ({snapshot.reportStats.requestStatsLines} request /{" "}
          {snapshot.reportStats.errorStatsLines} error /{" "}
          {snapshot.reportStats.timelineLines} timeline lines)
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-3 text-sm">
          <FileStatus
            label="Request stats (aggregate)"
            ok={snapshot.filesImported.requestStats}
          />
          <FileStatus
            label="Error stats"
            ok={snapshot.filesImported.errorStats}
          />
          <FileStatus
            label="Timeline / KPI"
            ok={snapshot.filesImported.timeline}
          />
        </div>
      </div>

      {snapshot.totalRow && (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3 font-semibold text-slate-900">
            Aggregate row (ALL / TOTAL - BlazeMeter summary)
          </div>
          <div className="overflow-x-auto">
            <TransactionMetricsTable rows={[snapshot.totalRow]} />
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 font-semibold text-slate-900">
          All transactions ({snapshot.transactions.length})
        </div>
        <div className="overflow-x-auto">
          <TransactionMetricsTable rows={snapshot.transactions} />
        </div>
      </div>

      {errorRows.length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3 font-semibold text-slate-900">
            Error breakdown ({errorRows.length} rows)
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Transaction</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Count</th>
                  <th className="px-4 py-3">% of total</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Possible cause</th>
                </tr>
              </thead>
              <tbody>
                {errorRows.map((row, i) => (
                  <tr
                    key={`${row.transaction}-${row.errorCode}-${i}`}
                    className="border-t border-slate-100"
                  >
                    <td className="px-4 py-3">{row.transaction}</td>
                    <td className="px-4 py-3">{row.errorCode}</td>
                    <td className="px-4 py-3">{row.message}</td>
                    <td className="px-4 py-3">{row.count.toLocaleString()}</td>
                    <td className="px-4 py-3">{row.pctOfTotal.toFixed(1)}%</td>
                    <td className="px-4 py-3 capitalize">{row.severity}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.possibleCause}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {snapshot.kpiTimeline && (
        <KpiTimelineSection kpiTimeline={snapshot.kpiTimeline} />
      )}

      {snapshot.timelinePoints.length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3 font-semibold text-slate-900">
            Timeline / error KPI points ({snapshot.timelinePoints.length})
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Errors</th>
                  <th className="px-4 py-3">Error rate</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.timelinePoints.map((p) => (
                  <tr key={p.time} className="border-t border-slate-100">
                    <td className="px-4 py-3">{p.time}</td>
                    <td className="px-4 py-3">{p.errors}</td>
                    <td className="px-4 py-3">{p.errorRatePct.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <NotAvailableFromApi />
    </div>
  );
}

function NotAvailableFromApi() {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
      <p className="font-medium text-slate-800">
        Not available via current BlazeMeter API import
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
        <li>
          Test type (e.g. JMeter) and engine locations - visible in BlazeMeter
          UI only
        </li>
        <li>
          Response code chips (2xx / 4xx / 5xx) - requires full errors report or
          JTL when error-stats is empty
        </li>
        <li>Engine health metrics and test logs - not imported</li>
      </ul>
    </div>
  );
}

function FileStatus({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${ok ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"}`}
    >
      <div className="font-medium text-slate-800">{label}</div>
      <div className={`text-xs ${ok ? "text-green-700" : "text-slate-500"}`}>
        {ok ? "Imported" : "Not available"}
      </div>
    </div>
  );
}
