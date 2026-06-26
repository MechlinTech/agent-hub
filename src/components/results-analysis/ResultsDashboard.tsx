"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bug,
  Download,
  Eye,
  FileText,
  Loader2,
  Search,
  TrendingUp,
  Users,
  Clock,
  Gauge,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { ErrorTrendChart } from "@/components/charts/ErrorTrendChart";
import { KpiTimelineSection } from "@/components/charts/KpiTimelineSection";
import { BlazeMeterReimportButton } from "@/components/results-analysis/BlazeMeterReimportButton";
import {
  KpiDetailModal,
  type ExecutiveKpiKey,
} from "@/components/results-analysis/KpiDetailModal";
import { ScriptLevelExecutiveSummary } from "@/components/results-analysis/ScriptLevelExecutiveSummary";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { AiExecutiveSummaryCard } from "@/components/results-analysis/AiExecutiveSummaryCard";
import {
  GoNoGoRecommendationCard,
  GoNoGoRecommendationCardHeader,
} from "@/components/results-analysis/GoNoGoRecommendationCard";
import { TransactionMetricsTable } from "@/components/results-analysis/TransactionMetricsTable";
import { ComingSoonFeature, downloadJsonFile } from "@/components/ui/ComingSoonFeature";
import { defectsToJiraPayload } from "@/lib/results-analysis/defect-generator";
import {
  fmtBandwidth,
  fmtCount,
  fmtDurationSec,
  fmtPct,
  fmtRt,
  fmtRtMs,
  fmtThroughput,
} from "@/lib/results-analysis/display-metrics";
import {
  downloadResultsReportPdf,
  generateResultsReportHtml,
  viewResultsReportHtml,
  type ResultsReportType,
} from "@/lib/results-analysis/report-generator";
import { resolveScriptSummaries } from "@/lib/results-analysis/script-summary";
import type { AnalysisResultPayload, ResultsAnalysisRecord, SummaryMetrics } from "@/lib/results-analysis/types";
import { cn, formatDate, pillBadge, scoreColor } from "@/lib/utils";

const TABS = [
  { id: "executive", label: "Executive Dashboard" },
  { id: "technical", label: "Technical Findings" },
  { id: "errors", label: "Error Analysis" },
  { id: "timeline", label: "Timeline" },
  { id: "baseline", label: "Baseline" },
  { id: "rca", label: "Root Cause" },
  { id: "defects", label: "Defects" },
  { id: "actions", label: "Action Items" },
  { id: "reports", label: "Reports" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ResultsDashboard({ analysis }: { analysis: ResultsAnalysisRecord }) {
  const [tab, setTab] = useState<TabId>("executive");
  const result = analysis.resultPayload as AnalysisResultPayload | null;

  if (!result) {
    return (
      <div className="card p-8 text-center text-slate-500">
        Analysis results are not available yet.{" "}
        <Link href={`/agents/results-analysis/${analysis.id}/analyzing`} className="text-brand-600 underline">
          Run analysis
        </Link>
      </div>
    );
  }

  const ctx = analysis.testContext;
  const subtitle = `${ctx.projectName} Load Test | ${ctx.environment} | Build: ${ctx.buildVersion} | ${formatDate(analysis.completedAt ?? analysis.createdAt)}`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Executive Summary Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {analysis.masterId && (
          <BlazeMeterReimportButton analysisId={analysis.id} masterId={analysis.masterId} />
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "executive" && <ExecutiveTab result={result} analysis={analysis} onTabChange={setTab} />}
      {tab === "technical" && <TechnicalTab result={result} />}
      {tab === "errors" && <ErrorsTab result={result} analysis={analysis} />}
      {tab === "timeline" && <TimelineTab result={result} analysis={analysis} />}
      {tab === "baseline" && <BaselineTab result={result} />}
      {tab === "rca" && <RootCauseTab result={result} />}
      {tab === "defects" && <DefectsTab analysis={analysis} result={result} />}
      {tab === "actions" && <ActionsTab result={result} />}
      {tab === "reports" && <ReportsTab analysis={analysis} result={result} />}
    </div>
  );
}

function ExecutiveTab({
  result,
  analysis,
  onTabChange,
}: {
  result: AnalysisResultPayload;
  analysis: ResultsAnalysisRecord;
  onTabChange: (tab: TabId) => void;
}) {
  const m = result.summaryMetrics;
  const snap = analysis.blazemeterSnapshot;
  const [activeKpi, setActiveKpi] = useState<ExecutiveKpiKey | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const openKpi = (key: ExecutiveKpiKey) => () => setActiveKpi(key);

  useEffect(() => {
    async function loadAiSettings() {
      const [settingsRes, aiRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/ai/status"),
      ]);
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setAiEnabled(data.settings?.ai_recommendation_mode === "enabled");
      }
      if (aiRes.ok) {
        const ai = await aiRes.json();
        setAiConfigured(Boolean(ai.configured));
      }
    }
    loadAiSettings();
  }, []);
  const scriptSummaries = resolveScriptSummaries(result, analysis);
  const statusColor =
    result.overallStatus === "pass"
      ? "text-green-700 bg-green-50 border-green-200"
      : result.overallStatus === "warning"
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-red-700 bg-red-50 border-red-200";

  return (
    <div className="space-y-6">
      {analysis.masterId && (
        <BlazeMeterRunBanner analysis={analysis} metrics={m} />
      )}

      <CollapsibleSection
        title="Performance metrics"
        defaultOpen
        summary={`${result.overallStatus.toUpperCase()} · Score ${result.performanceScore}/100 · ${fmtRt(m.avgResponseTimeSec)} avg · ${fmtPct(m.errorRatePct)} errors`}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="Overall Status" value={result.overallStatus.toUpperCase()} className={statusColor} icon={AlertTriangle} onClick={openKpi("overall_status")} />
          <KpiCard title="Performance Score" value={`${result.performanceScore} / 100`} valueClass={scoreColor(result.performanceScore)} icon={Gauge} onClick={openKpi("performance_score")} />
          <KpiCard title="Max Users" value={String(m.maxUsers)} icon={Users} onClick={openKpi("max_users")} />
          <KpiCard
            title="Duration"
            value={
              m.activeDurationMinutes != null
                ? `${m.activeDurationMinutes} min active`
                : `${m.durationMinutes} min`
            }
            icon={Clock}
            onClick={openKpi("duration")}
          />
          <KpiCard title="Avg Response Time" value={fmtRt(m.avgResponseTimeSec)} icon={Clock} onClick={openKpi("avg_response_time")} />
          {m.p90ResponseTimeSec != null && (
            <KpiCard title="P90 Response Time" value={fmtRt(m.p90ResponseTimeSec)} icon={TrendingUp} onClick={openKpi("p90_response_time")} />
          )}
          <KpiCard title="P95 Response Time" value={fmtRt(m.p95ResponseTimeSec)} icon={TrendingUp} onClick={openKpi("p95_response_time")} />
          {m.p99ResponseTimeSec != null && (
            <KpiCard title="P99 Response Time" value={fmtRt(m.p99ResponseTimeSec)} icon={TrendingUp} onClick={openKpi("p99_response_time")} />
          )}
          {m.minResponseTimeSec != null && (
            <KpiCard title="Min Response Time" value={fmtRt(m.minResponseTimeSec)} icon={Clock} onClick={openKpi("min_response_time")} />
          )}
          {m.maxResponseTimeSec != null && (
            <KpiCard title="Max Response Time" value={fmtRt(m.maxResponseTimeSec)} icon={Clock} onClick={openKpi("max_response_time")} />
          )}
          {m.medianResponseTimeSec != null && (
            <KpiCard title="Median Response Time" value={fmtRt(m.medianResponseTimeSec)} icon={Clock} onClick={openKpi("median_response_time")} />
          )}
          {m.stDevSec != null && m.stDevSec > 0 && (
            <KpiCard title="Std Deviation" value={fmtRt(m.stDevSec)} icon={TrendingUp} onClick={openKpi("std_deviation")} />
          )}
          {m.avgLatencySec != null && m.avgLatencySec > 0 && (
            <KpiCard title="Avg Latency" value={fmtRt(m.avgLatencySec)} icon={Clock} onClick={openKpi("avg_latency")} />
          )}
          <KpiCard title="Error Rate" value={fmtPct(m.errorRatePct)} icon={XCircle} valueClass="text-red-600" onClick={openKpi("error_rate")} />
          {m.errorsCount != null && (
            <KpiCard title="Error Count" value={fmtCount(m.errorsCount)} icon={XCircle} valueClass="text-red-600" onClick={openKpi("error_count")} />
          )}
          <KpiCard title="Throughput" value={fmtThroughput(m.throughput)} icon={TrendingUp} onClick={openKpi("throughput")} />
          {m.avgBandwidthKiBps != null && (
            <KpiCard title="Avg Bandwidth" value={fmtBandwidth(m.avgBandwidthKiBps)} icon={TrendingUp} onClick={openKpi("avg_bandwidth")} />
          )}
          {m.totalSamples != null && (
            <KpiCard title="Total Samples" value={fmtCount(m.totalSamples)} icon={Gauge} onClick={openKpi("total_samples")} />
          )}
        </div>
      </CollapsibleSection>

      {activeKpi && (
        <KpiDetailModal
          kpiKey={activeKpi}
          result={result}
          analysis={analysis}
          onClose={() => setActiveKpi(null)}
          onNavigateTab={onTabChange}
        />
      )}

      {snap?.apiSummary && (
        <div className="card p-5">
          <h3 className="mb-3 font-semibold text-slate-900">BlazeMeter API summary</h3>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <MetricDl label="API avg response time" value={fmtRtMs(snap.apiSummary.avgResponseTimeMs)} />
            <MetricDl label="API 90th percentile" value={fmtRtMs(snap.apiSummary.tp90Ms)} />
            <MetricDl label="API hits / sec" value={fmtThroughput(snap.apiSummary.hitsPerSec)} />
            <MetricDl label="API failed count" value={fmtCount(snap.apiSummary.failedCount)} />
            <MetricDl label="API min / max RT" value={`${fmtRtMs(snap.apiSummary.minMs)} / ${fmtRtMs(snap.apiSummary.maxMs)}`} />
            <MetricDl label="API total bytes" value={fmtCount(snap.apiSummary.totalBytes)} />
            <MetricDl label="API concurrency" value={`${snap.apiSummary.concurrency} VU`} />
            <MetricDl label="API duration" value={fmtDurationSec(snap.apiSummary.durationSec)} />
          </dl>
        </div>
      )}

      <ScriptLevelExecutiveSummary rows={scriptSummaries} analysis={analysis} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-3 font-semibold text-slate-900">
            AI Executive Summary
            {result.aiEnhanced && (
              <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                AI enhanced
              </span>
            )}
          </h3>
          <AiExecutiveSummaryCard
            result={result}
            aiEnabled={aiEnabled}
            aiConfigured={aiConfigured}
            analysisId={analysis.id}
          />
        </div>
        <div className="card p-5">
          <GoNoGoRecommendationCardHeader />
          <GoNoGoRecommendationCard result={result} scriptSummaries={scriptSummaries} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-3 font-semibold text-slate-900">Top Risks</h3>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
            {result.topRisks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h3 className="mb-3 font-semibold text-slate-900">Quick Actions</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-3 text-left text-sm hover:bg-slate-50"
              onClick={() => onTabChange("technical")}
            >
              View Technical Findings
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-3 text-left text-sm hover:bg-slate-50"
              onClick={() => onTabChange("errors")}
            >
              View Failed Transactions
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-3 text-left text-sm text-slate-400"
              disabled
              title="Coming soon"
            >
              Generate Teams Summary
              <span className="mt-1 block text-xs">Coming soon</span>
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-3 text-left text-sm hover:bg-slate-50"
              onClick={() => onTabChange("reports")}
            >
              Export Executive Report (PDF)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TechnicalTab({ result }: { result: AnalysisResultPayload }) {
  const [selected, setSelected] = useState(result.findings[0]?.transaction ?? "");
  const finding = result.findings.find((f) => f.transaction === selected);

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-900">Transaction metrics</h3>
          <StyledSelect
            className="w-auto min-w-[12rem]"
            value={selected}
            onChange={setSelected}
            options={result.transactions.map((tx) => ({
              value: tx.name,
              label: tx.name,
            }))}
          />
        </div>
        <TransactionMetricsTable
          rows={result.transactions}
          showStatus
          statusFor={(name) => result.findings.find((x) => x.transaction === name)?.status ?? null}
        />
      </div>

      {finding && (
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Details for: {finding.transaction}</h3>
            <StatusPill status={finding.status} />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DetailBlock title="Finding" items={[finding.finding]} />
            <DetailBlock title="Evidence" items={finding.evidence} />
            <DetailBlock title="Possible Cause" items={finding.possibleCause} />
            <DetailBlock title="Recommendation" items={finding.recommendation} />
          </div>
        </div>
      )}
    </div>
  );
}

function ErrorsTab({
  result,
  analysis,
}: {
  result: AnalysisResultPayload;
  analysis: ResultsAnalysisRecord;
}) {
  const e = result.errorAnalysis;
  const snapErrors = analysis.blazemeterSnapshot?.errorRows ?? [];
  const rows = e.errorRows.length > 0 ? e.errorRows : snapErrors;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Overall Error Rate" value={fmtPct(e.overallErrorRatePct)} valueClass="text-red-600" icon={XCircle} />
        <KpiCard title="Total Errors" value={fmtCount(e.totalErrors)} icon={AlertTriangle} />
        <KpiCard title="App Errors (4xx)" value={fmtCount(e.appErrors4xx)} icon={XCircle} />
        <KpiCard title="Server Errors (5xx)" value={fmtCount(e.serverErrors5xx)} icon={AlertTriangle} />
      </div>

      {e.errorsByTransaction.length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3 font-semibold text-slate-900">
            Errors by transaction
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Transaction</th>
                  <th className="px-4 py-3">Count</th>
                  <th className="px-4 py-3">% of total</th>
                </tr>
              </thead>
              <tbody>
                {e.errorsByTransaction.map((row) => (
                  <tr key={row.name} className="border-t border-slate-100">
                    <td className="px-4 py-3">{row.name}</td>
                    <td className="px-4 py-3">{row.count.toLocaleString()}</td>
                    <td className="px-4 py-3">{row.pct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 font-semibold text-slate-900">
          Error breakdown ({rows.length} rows)
        </div>
        {rows.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No detailed error rows. Re-import from BlazeMeter to refresh.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Transaction</th>
                  <th className="px-4 py-3">Error Code</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Count</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Possible Cause</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={`${row.transaction}-${row.errorCode}-${i}`} className="border-t border-slate-100">
                    <td className="px-4 py-3">{row.transaction}</td>
                    <td className="px-4 py-3">
                      <span className={pillBadge("bg-red-100 text-red-800 border-red-200")}>{row.errorCode}</span>
                    </td>
                    <td className="px-4 py-3">{row.message}</td>
                    <td className="px-4 py-3">{row.count.toLocaleString()}</td>
                    <td className="px-4 py-3 capitalize">{row.severity}</td>
                    <td className="px-4 py-3 text-slate-600">{row.possibleCause}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 card p-5">
          <h3 className="mb-2 font-semibold text-slate-900">AI Error Interpretation</h3>
          <p className="text-sm text-slate-600">{e.aiInterpretation}</p>
        </div>
        <div className="card bg-blue-50 p-5">
          <h3 className="mb-2 font-semibold text-slate-900">Key Insight</h3>
          <p className="text-sm text-slate-700">{e.keyInsight}</p>
        </div>
      </div>
    </div>
  );
}

function TimelineTab({
  result,
  analysis,
}: {
  result: AnalysisResultPayload;
  analysis: ResultsAnalysisRecord;
}) {
  const trend = result.errorAnalysis.errorTrend;
  const snapTrend = analysis.blazemeterSnapshot?.timelinePoints ?? [];
  const chartTrend =
    trend.length > 0
      ? trend
      : snapTrend.map((p) => ({ time: p.time, errors: p.errors, errorRatePct: p.errorRatePct }));
  const kpiTimeline = analysis.blazemeterSnapshot?.kpiTimeline;

  return (
    <div className="space-y-4">
      {kpiTimeline && <KpiTimelineSection kpiTimeline={kpiTimeline} />}

      <div className="card p-5">
        <h3 className="mb-3 font-semibold text-slate-900">Error Trend Over Time</h3>
        {chartTrend.length === 0 ? (
          <ComingSoonFeature
            title="Timeline analysis"
            description="Upload a Timeline CSV or import from BlazeMeter API during analysis setup to enable error trend charts."
          />
        ) : (
          <>
            <ErrorTrendChart data={chartTrend} />
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Errors</th>
                    <th className="px-4 py-3">Error Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {chartTrend.map((point) => (
                    <tr key={point.time} className="border-t border-slate-100">
                      <td className="px-4 py-3">{point.time}</td>
                      <td className="px-4 py-3">{point.errors}</td>
                      <td className="px-4 py-3">{point.errorRatePct.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      {result.scriptSummaries.length > 0 && (
        <div className="card p-5">
          <h3 className="mb-3 font-semibold text-slate-900">Script Iteration Summary</h3>
          <p className="text-sm text-slate-600">
            Script-level pass/fail iteration data helps identify when failures started during the test
            window.
          </p>
        </div>
      )}
    </div>
  );
}

function BaselineTab({ result }: { result: AnalysisResultPayload }) {
  const rows = result.baselineComparison ?? [];
  return (
    <div className="card overflow-hidden">
      {rows.length === 0 ? (
        <ComingSoonFeature
          title="Baseline comparison"
          description="Upload a Baseline CSV during analysis setup to compare current results against a prior run."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Current Avg RT</th>
                <th className="px-4 py-3">Baseline Avg RT</th>
                <th className="px-4 py-3">Delta</th>
                <th className="px-4 py-3">Current Error %</th>
                <th className="px-4 py-3">Baseline Error %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.transaction} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{row.transaction}</td>
                  <td className="px-4 py-3">{row.currentAvgRtSec.toFixed(2)}s</td>
                  <td className="px-4 py-3">{row.baselineAvgRtSec.toFixed(2)}s</td>
                  <td className={cn("px-4 py-3 font-medium", row.deltaPct > 0 ? "text-red-600" : "text-green-600")}>
                    {row.deltaPct > 0 ? "+" : ""}
                    {row.deltaPct.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3">{row.currentErrorPct.toFixed(2)}%</td>
                  <td className="px-4 py-3">{row.baselineErrorPct.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RootCauseTab({ result }: { result: AnalysisResultPayload }) {
  const hypotheses = result.rootCauseAnalysis ?? [];
  if (hypotheses.length === 0) {
    return (
      <ComingSoonFeature
        title="Root cause analysis"
        description="Root cause hypotheses are generated during analysis. Re-run this analysis with the latest engine to populate this section."
      />
    );
  }

  const confidenceColor = {
    high: "bg-red-50 text-red-700 border-red-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <div className="space-y-4">
      {hypotheses.map((rca) => (
        <div key={rca.id} className="card p-5">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <Search className="mt-0.5 h-5 w-5 text-brand-600" />
              <div>
                <h3 className="font-semibold text-slate-900">{rca.title}</h3>
                <p className="mt-1 text-sm capitalize text-slate-500">{rca.category.replace("_", " ")}</p>
              </div>
            </div>
            <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", confidenceColor[rca.confidence])}>
              {rca.confidence} confidence
            </span>
          </div>
          <p className="mb-4 text-sm text-slate-700">{rca.summary}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Evidence</h4>
              <ul className="list-disc space-y-1 pl-4 text-sm text-slate-600">
                {rca.evidence.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Recommended actions
              </h4>
              <ul className="list-disc space-y-1 pl-4 text-sm text-slate-600">
                {rca.recommendedActions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
          {rca.affectedTransactions.length > 0 && (
            <p className="mt-4 text-xs text-slate-500">
              Affected: {rca.affectedTransactions.join(", ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function DefectsTab({
  analysis,
  result,
}: {
  analysis: ResultsAnalysisRecord;
  result: AnalysisResultPayload;
}) {
  const defects = result.defects ?? [];

  function downloadDefects(format: "json" | "jira") {
    if (defects.length === 0) return;

    if (format === "jira") {
      downloadJsonFile(`${analysis.runName}-jira-defects.json`, {
        analysisId: analysis.id,
        runName: analysis.runName,
        generatedAt: new Date().toISOString(),
        issues: defectsToJiraPayload(defects),
      });
      return;
    }

    downloadJsonFile(`${analysis.runName}-defects.json`, {
      analysisId: analysis.id,
      runName: analysis.runName,
      generatedAt: new Date().toISOString(),
      defects,
    });
  }

  if (defects.length === 0) {
    return (
      <ComingSoonFeature
        title="Performance defects"
        description="Defect drafts are generated from SLA failures and error patterns during analysis. Re-run this analysis to populate exportable defects."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={() => downloadDefects("json")}>
          <Bug className="h-4 w-4" />
          Export defects (JSON)
        </button>
        <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={() => downloadDefects("jira")}>
          Export for Jira (JSON)
        </button>
        <button
          type="button"
          className="btn-secondary inline-flex items-center gap-2 opacity-60"
          disabled
          title="Jira push integration coming soon"
        >
          Push to Jira (Coming soon)
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Transaction</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Assignee</th>
            </tr>
          </thead>
          <tbody>
            {defects.map((defect) => (
              <tr key={defect.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{defect.title}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-slate-500">{defect.description.split("\n")[0]}</div>
                </td>
                <td className="px-4 py-3">{defect.transaction}</td>
                <td className="px-4 py-3 capitalize">{defect.type.replace("_", " ")}</td>
                <td className="px-4 py-3 capitalize">{defect.severity}</td>
                <td className="px-4 py-3">{defect.suggestedAssignee}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionsTab({ result }: { result: AnalysisResultPayload }) {
  if (result.actionItems.length === 0) {
    return (
      <ComingSoonFeature
        title="Action items"
        description="No action items were generated for this run. Upload error stats or re-run analysis to create trackable items."
      />
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Owner Team</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {result.actionItems.map((item) => (
            <tr key={item.id} className="border-t border-slate-100">
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{item.title}</div>
                <div className="text-slate-500">{item.description}</div>
              </td>
              <td className="px-4 py-3">{item.ownerTeam}</td>
              <td className="px-4 py-3 capitalize">{item.priority}</td>
              <td className="px-4 py-3 capitalize">{item.status.replace("_", " ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportsTab({
  analysis,
  result,
}: {
  analysis: ResultsAnalysisRecord;
  result: AnalysisResultPayload;
}) {
  const [loading, setLoading] = useState<{ type: ResultsReportType; action: "view" | "download" } | null>(
    null
  );

  function openReport(type: ResultsReportType, action: "view" | "download") {
    setLoading({ type, action });
    try {
      const scriptSummaries = resolveScriptSummaries(result, analysis);
      const html = generateResultsReportHtml(type, { analysis, result, scriptSummaries });
      if (action === "view") {
        viewResultsReportHtml(html);
      } else {
        downloadResultsReportPdf(html);
      }
    } finally {
      setTimeout(() => setLoading(null), 800);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Reports include script-level pass/fail, BlazeMeter # Samples, error codes, and failed transaction
        details. Use <strong>Export to Library</strong> to add Bug ID and comments per script.{" "}
        <strong>View Report</strong> opens a preview; <strong>Download Report</strong> opens print → Save as PDF.
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(
          [
            {
              type: "executive" as const,
              title: "Executive Report",
              desc: "Go/No-Go, KPIs, top risks, and script-level summary for leadership",
            },
            {
              type: "technical" as const,
              title: "Technical Report",
              desc: "SLA findings, transaction metrics, and per-script Request Stats + failures",
            },
            {
              type: "script-summary" as const,
              title: "Script Executive Summary",
              desc: "Full script-level report with Request Stats and failed transaction details",
            },
            {
              type: "action-items" as const,
              title: "Action Items Report",
              desc: "Failed scripts, action items, and suggested defects for all teams",
            },
          ] as const
        ).map((r) => {
          const isViewLoading = loading?.type === r.type && loading.action === "view";
          const isDownloadLoading = loading?.type === r.type && loading.action === "download";
          const isBusy = loading !== null;

          return (
            <div key={r.type} className="card p-5">
              <FileText className="mb-3 h-8 w-8 text-brand-600" />
              <h3 className="font-semibold text-slate-900">{r.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{r.desc}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary inline-flex items-center gap-2"
                  disabled={isBusy}
                  onClick={() => openReport(r.type, "view")}
                >
                  {isViewLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {isViewLoading ? "Opening…" : "View Report"}
                </button>
                <button
                  type="button"
                  className="btn-primary inline-flex items-center gap-2"
                  disabled={isBusy}
                  onClick={() => openReport(r.type, "download")}
                >
                  {isDownloadLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isDownloadLoading ? "Preparing…" : "Download Report"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlazeMeterRunBanner({
  analysis,
  metrics,
}: {
  analysis: ResultsAnalysisRecord;
  metrics: SummaryMetrics;
}) {
  const snap = analysis.blazemeterSnapshot;
  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">BlazeMeter import</h3>
          <p className="mt-1 text-sm text-slate-500">
            Master ID {analysis.masterId}
            {snap?.master.testId ? ` · Test ID ${snap.master.testId}` : ""}
            {snap ? ` · Fetched ${formatDate(snap.fetchedAt)}` : ""}
          </p>
          {snap && (
            <p className="mt-1 text-xs text-slate-500">
              Started {formatDate(snap.master.createdAtIso)}
              {snap.master.endedAtIso ? ` · Ended ${formatDate(snap.master.endedAtIso)}` : ""}
              {" · "}
              {snap.master.activeDurationMinutes != null
                ? `Wall-clock ${metrics.durationMinutes} min · Active ${snap.master.activeDurationMinutes} min`
                : `Duration ${metrics.durationMinutes} min`}
            </p>
          )}
        </div>
        <Link
          href={`/agents/results-analysis/${analysis.id}/blazemeter`}
          className="btn-secondary text-sm"
        >
          View BlazeMeter Results
        </Link>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  defaultOpen = true,
  summary,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  summary?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          {!open && summary ? (
            <p className="mt-1 truncate text-sm text-slate-500">{summary}</p>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-slate-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? <div className="border-t border-slate-100 p-5">{children}</div> : null}
    </div>
  );
}

function MetricDl({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  className,
  valueClass,
  onClick,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  valueClass?: string;
  onClick?: () => void;
}) {
  const clickable = Boolean(onClick);
  const Tag = clickable ? "button" : "div";

  return (
    <Tag
      type={clickable ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "card p-4 text-left transition-colors",
        clickable && "cursor-pointer hover:border-brand-300 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase text-slate-500">{title}</span>
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div className={cn("text-xl font-bold text-slate-900", valueClass)}>{value}</div>
    </Tag>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pass: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    fail: "bg-red-100 text-red-800 border-red-200",
  };
  return <span className={pillBadge(map[status] ?? map.pass)}>{status}</span>;
}

function DetailBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">{title}</h4>
      <ul className="space-y-1 text-sm text-slate-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
