import type {
  ActionItem,
  AnalysisResultPayload,
  GoNoGo,
  OverallStatus,
  ParsedErrorRow,
  ParsedTransaction,
  ScriptSummaryRow,
  SlaProfile,
  TechnicalFinding,
  TestContext,
  TransactionStatus,
} from "./types";
import { evaluateTransactionSla } from "./sla-engine";
import { aggregateSummaryMetrics, computePerformanceScore } from "./score-engine";
import { resolveTotalErrors, supplementErrorRows } from "./error-supplement";
import {
  deriveScriptSummaries,
  findTotalRow,
  isPlaceholderScriptSummaries,
  transactionRows,
} from "./script-summary";
import { buildRootCauseAnalysis } from "./rca-engine";
import { generatePerformanceDefects } from "./defect-generator";

function buildTechnicalFinding(
  tx: ParsedTransaction,
  status: TransactionStatus,
  breached: string[],
  profile: SlaProfile
): TechnicalFinding {
  const rule = profile.transactions.find(
    (t) => t.transactionName.toLowerCase() === tx.name.toLowerCase()
  );
  return {
    id: `finding-${tx.name.replace(/\s+/g, "-").toLowerCase()}`,
    transaction: tx.name,
    status,
    finding:
      status === "pass"
        ? `${tx.name} met SLA thresholds.`
        : `${tx.name} shows ${status === "fail" ? "SLA failures" : "SLA warnings"}: ${breached.join("; ")}.`,
    evidence: [
      `${tx.samples.toLocaleString()} samples`,
      `Avg RT ${tx.avgRtSec.toFixed(2)} sec`,
      tx.p90Sec > 0 ? `P90 ${tx.p90Sec.toFixed(2)} sec` : null,
      `P95 ${tx.p95Sec.toFixed(2)} sec`,
      tx.p99Sec > 0 ? `P99 ${tx.p99Sec.toFixed(2)} sec` : null,
      tx.minRtSec != null ? `Min ${tx.minRtSec.toFixed(2)} sec` : null,
      tx.maxRtSec != null ? `Max ${tx.maxRtSec.toFixed(2)} sec` : null,
      tx.medianRtSec != null ? `Median ${tx.medianRtSec.toFixed(2)} sec` : null,
      tx.stDevSec != null ? `Std dev ${tx.stDevSec.toFixed(2)} sec` : null,
      tx.avgBytes != null ? `Bandwidth ${tx.avgBytes.toFixed(2)} KiB/s` : null,
      tx.errorsCount != null ? `${tx.errorsCount.toLocaleString()} errors` : null,
      `Error rate ${tx.errorRatePct.toFixed(2)}%`,
      `Throughput ${tx.throughput.toFixed(1)}/sec`,
      tx.concurrency != null ? `${tx.concurrency} VU` : null,
      tx.passedThresholds === true
        ? "Passed BlazeMeter thresholds"
        : tx.passedThresholds === false
          ? "Failed BlazeMeter thresholds"
          : null,
    ].filter((x): x is string => Boolean(x)),
    possibleCause:
      status === "pass"
        ? ["No significant bottleneck detected."]
        : tx.errorRatePct > profile.maxErrorRatePct
          ? ["Downstream service latency", "Database query performance", "Connection pool exhaustion"]
          : ["Increased load on dependent services", "Slow backend processing", "Network latency"],
    recommendation:
      status === "pass"
        ? ["Monitor during peak load windows."]
        : [
            "Investigate backend dependency latency",
            "Review database query plans",
            "Re-run test after optimization",
          ],
    ownerTeam: rule?.criticalFlow ? "Claims Services Team" : "Platform Team",
    ownerName: rule?.criticalFlow ? "Performance Lead" : "Dev Lead",
    priority: status === "fail" ? "high" : status === "warning" ? "medium" : "low",
  };
}

function buildActionItems(findings: TechnicalFinding[]): ActionItem[] {
  return findings
    .filter((f) => f.status !== "pass")
    .map((f, i) => ({
      id: `action-${i + 1}`,
      title: `Investigate ${f.transaction} performance`,
      description: f.finding,
      ownerTeam: f.ownerTeam ?? "Performance Team",
      priority: f.priority ?? "medium",
      status: "open" as const,
    }));
}

function deriveGoNoGo(
  score: number,
  overallStatus: OverallStatus,
  scriptSummaries: ScriptSummaryRow[]
): GoNoGo {
  const hasFailedScripts = scriptSummaries.some((s) => s.failedIterations > 0);
  if (overallStatus === "fail" || score < 50) return "no_go";
  if (overallStatus === "warning" || score < 75 || hasFailedScripts) return "conditional_go";
  return "go";
}

function deriveOverallStatus(
  score: number,
  failCount: number,
  warningCount: number
): OverallStatus {
  if (failCount > 0 || score < 50) return "fail";
  if (warningCount > 0 || score < 75) return "warning";
  return "pass";
}

import { buildExecutiveSummaryText } from "./executive-summary-text";

function buildTopRisks(
  findings: TechnicalFinding[],
  scriptSummaries: ScriptSummaryRow[],
  errorRows: ParsedErrorRow[]
): string[] {
  const risks: string[] = [];
  for (const script of scriptSummaries) {
    if (script.failedTransactions.length > 0) {
      risks.push(
        `${script.scriptName}: ${script.failedTransactions.length} failed transaction(s).`
      );
    }
    if (script.failedIterations > 0) {
      risks.push(`${script.scriptName} has ${script.failedIterations} failed iteration(s).`);
    }
  }
  for (const f of findings.filter((x) => x.status !== "pass").slice(0, 3)) {
    risks.push(`${f.transaction}: ${f.finding}`);
  }
  const topError = errorRows.sort((a, b) => b.count - a.count)[0];
  if (topError) {
    risks.push(`Dominant error ${topError.errorCode} on ${topError.transaction}.`);
  }
  if (risks.length === 0) {
    risks.push("No critical risks identified. Continue monitoring in production-like load.");
  }
  return risks.slice(0, 5);
}

export function buildAnalysisResult(input: {
  runName: string;
  context: TestContext;
  slaProfile: SlaProfile;
  transactions: ParsedTransaction[];
  totalRow?: ParsedTransaction | null;
  errorRows: ParsedErrorRow[];
  scriptSummaries: ScriptSummaryRow[];
  scenarioScriptSummaries?: ScriptSummaryRow[];
  errorTrend: { time: string; errors: number; errorRatePct: number }[];
  baselineTransactions?: ParsedTransaction[];
}): AnalysisResultPayload {
  const summary = aggregateSummaryMetrics(input.transactions, input.totalRow);
  const enrichedErrorRows = supplementErrorRows(input.errorRows, input.transactions, input.totalRow);
  const slaCompliance = input.transactions.length
    ? Math.round(
        (input.transactions.filter(
          (tx) => evaluateTransactionSla(tx, input.slaProfile).status === "pass"
        ).length /
          input.transactions.length) *
          100
      )
    : 0;

  let baselineDeltaPct = 0;
  if (input.baselineTransactions?.length) {
    const baseline = aggregateSummaryMetrics(input.baselineTransactions);
    if (baseline.avgResponseTimeSec > 0) {
      baselineDeltaPct =
        ((summary.avgResponseTimeSec - baseline.avgResponseTimeSec) /
          baseline.avgResponseTimeSec) *
        100;
    }
  }

  const { score, breakdown } = computePerformanceScore({
    slaCompliancePct: slaCompliance,
    errorRatePct: summary.errorRatePct,
    maxErrorRatePct: input.slaProfile.maxErrorRatePct,
    throughput: summary.throughput,
    minThroughput: input.slaProfile.minThroughput,
    avgResponseTimeSec: summary.avgResponseTimeSec,
    avgResponseTimeMaxSec: input.slaProfile.avgResponseTimeMaxSec,
    baselineDeltaPct,
  });

  const findings = input.transactions.map((tx) => {
    const evalResult = evaluateTransactionSla(tx, input.slaProfile);
    return buildTechnicalFinding(tx, evalResult.status, evalResult.breachedMetrics, input.slaProfile);
  });

  const failCount = findings.filter((f) => f.status === "fail").length;
  const warningCount = findings.filter((f) => f.status === "warning").length;
  const overallStatus = deriveOverallStatus(score, failCount, warningCount);

  const maxUsers =
    input.totalRow?.concurrency ??
    findTotalRow(input.transactions)?.concurrency ??
    input.context.targetUsers;

  const scriptSummaries = !isPlaceholderScriptSummaries(
    input.scenarioScriptSummaries && input.scenarioScriptSummaries.length > 0
      ? input.scenarioScriptSummaries
      : input.scriptSummaries,
    overallStatus,
    maxUsers
  )
    ? input.scenarioScriptSummaries && input.scenarioScriptSummaries.length > 0
      ? input.scenarioScriptSummaries
      : input.scriptSummaries
    : deriveScriptSummaries({
        runName: input.runName,
        context: input.context,
        transactions: transactionRows(input.transactions),
        totalRow: input.totalRow ?? findTotalRow(input.transactions),
        overallStatus,
        masterMaxUsers: maxUsers,
        errorRows: enrichedErrorRows,
      });

  const goNoGo = deriveGoNoGo(score, overallStatus, scriptSummaries);

  const totalErrors = resolveTotalErrors(
    enrichedErrorRows,
    input.totalRow,
    summary.errorRatePct,
    summary.totalSamples
  );
  const appErrors4xx = enrichedErrorRows
    .filter((r) => r.errorCode.startsWith("4"))
    .reduce((s, r) => s + r.count, 0);
  const serverErrors5xx = enrichedErrorRows
    .filter((r) => r.errorCode.startsWith("5"))
    .reduce((s, r) => s + r.count, 0);

  const errorsByTransactionMap = new Map<string, number>();
  for (const row of enrichedErrorRows) {
    errorsByTransactionMap.set(
      row.transaction,
      (errorsByTransactionMap.get(row.transaction) ?? 0) + row.count
    );
  }
  const errorsByTransaction = Array.from(errorsByTransactionMap.entries())
    .map(([name, count]) => ({
      name,
      count,
      pct: totalErrors > 0 ? (count / totalErrors) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const actionItems = buildActionItems(findings);

  const baselineComparison = input.baselineTransactions?.length
    ? input.transactions.slice(0, 20).map((tx) => {
        const baselineTx = input.baselineTransactions!.find(
          (b) => b.name.toLowerCase() === tx.name.toLowerCase()
        );
        if (!baselineTx) {
          return {
            transaction: tx.name,
            currentAvgRtSec: tx.avgRtSec,
            baselineAvgRtSec: 0,
            deltaPct: 0,
            currentErrorPct: tx.errorRatePct,
            baselineErrorPct: 0,
          };
        }
        const deltaPct =
          baselineTx.avgRtSec > 0
            ? ((tx.avgRtSec - baselineTx.avgRtSec) / baselineTx.avgRtSec) * 100
            : 0;
        return {
          transaction: tx.name,
          currentAvgRtSec: tx.avgRtSec,
          baselineAvgRtSec: baselineTx.avgRtSec,
          deltaPct,
          currentErrorPct: tx.errorRatePct,
          baselineErrorPct: baselineTx.errorRatePct,
        };
      })
    : undefined;

  const rootCauseAnalysis = buildRootCauseAnalysis({
    transactions: input.transactions,
    errorRows: enrichedErrorRows,
    findings,
    errorTrend: input.errorTrend,
    baselineComparison,
    scriptSummaries,
  });

  const defects = generatePerformanceDefects({
    findings,
    errorRows: enrichedErrorRows,
    rootCauseAnalysis,
    context: input.context,
    runName: input.runName,
  });

  return {
    overallStatus,
    performanceScore: score,
    goNoGo,
    executiveSummary: buildExecutiveSummaryText({
      runName: input.runName,
      context: input.context,
      score,
      goNoGo,
      scriptSummaries,
    }),
    topRisks: buildTopRisks(findings, scriptSummaries, enrichedErrorRows),
    summaryMetrics: {
      maxUsers,
      durationMinutes: input.context.durationMinutes,
      activeDurationMinutes: summary.activeDurationMinutes,
      avgResponseTimeSec: summary.avgResponseTimeSec,
      p90ResponseTimeSec: summary.p90ResponseTimeSec,
      p95ResponseTimeSec: summary.p95ResponseTimeSec,
      p99ResponseTimeSec: summary.p99ResponseTimeSec,
      minResponseTimeSec: summary.minResponseTimeSec,
      maxResponseTimeSec: summary.maxResponseTimeSec,
      medianResponseTimeSec: summary.medianResponseTimeSec,
      stDevSec: summary.stDevSec,
      avgLatencySec: summary.avgLatencySec,
      errorRatePct: summary.errorRatePct,
      errorsCount: summary.errorsCount ?? totalErrors,
      throughput: summary.throughput,
      totalSamples: summary.totalSamples,
      avgBandwidthKiBps: summary.avgBandwidthKiBps,
      durationSec: summary.durationSec,
    },
    scriptSummaries,
    transactions: input.transactions,
    findings,
    actionItems,
    errorAnalysis: {
      overallErrorRatePct: summary.errorRatePct,
      totalErrors,
      appErrors4xx,
      serverErrors5xx,
      errorsByTransaction,
      errorTrend: input.errorTrend,
      errorRows: enrichedErrorRows,
      aiInterpretation:
        serverErrors5xx > appErrors4xx
          ? "Majority of errors are server-side (5xx), likely caused by backend or gateway latency under peak load."
          : "Errors are distributed across client and server responses. Validate test data and authentication flows.",
      keyInsight:
        serverErrors5xx > 0
          ? "Dominant 502/504-style errors indicate likely backend or gateway latency under load."
          : "Error rate remains within acceptable bounds for most transactions.",
    },
    scoreBreakdown: breakdown,
    baselineComparison,
    rootCauseAnalysis,
    defects,
  };
}
