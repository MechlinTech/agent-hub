import type {
  AnalysisResultPayload,
  ParsedErrorRow,
  ParsedTransaction,
  RootCauseHypothesis,
  ScriptSummaryRow,
  TechnicalFinding,
} from "./types";

interface RcaInput {
  transactions: ParsedTransaction[];
  errorRows: ParsedErrorRow[];
  findings: TechnicalFinding[];
  errorTrend: { time: string; errors: number; errorRatePct: number }[];
  baselineComparison?: AnalysisResultPayload["baselineComparison"];
  scriptSummaries: ScriptSummaryRow[];
}

function detectErrorSpike(
  errorTrend: RcaInput["errorTrend"]
): { detected: boolean; ratio: number; peakTime?: string } {
  if (errorTrend.length < 4) return { detected: false, ratio: 0 };
  const mid = Math.floor(errorTrend.length / 2);
  const firstHalf = errorTrend.slice(0, mid);
  const secondHalf = errorTrend.slice(mid);
  const avgFirst =
    firstHalf.reduce((s, p) => s + p.errors, 0) / Math.max(firstHalf.length, 1);
  const avgSecond =
    secondHalf.reduce((s, p) => s + p.errors, 0) / Math.max(secondHalf.length, 1);
  const ratio = avgFirst > 0 ? avgSecond / avgFirst : avgSecond > 0 ? 2 : 0;
  const peak = [...errorTrend].sort((a, b) => b.errors - a.errors)[0];
  return {
    detected: ratio >= 1.5 && avgSecond >= 1,
    ratio,
    peakTime: peak?.time,
  };
}

export function buildRootCauseAnalysis(input: RcaInput): RootCauseHypothesis[] {
  const hypotheses: RootCauseHypothesis[] = [];
  const failedFindings = input.findings.filter((f) => f.status !== "pass");
  const serverErrors = input.errorRows.filter((r) => r.errorCode.startsWith("5"));
  const latencyFindings = failedFindings.filter((f) =>
    f.evidence.some((e) => e.includes("P95"))
  );
  const errorSpike = detectErrorSpike(input.errorTrend);

  if (serverErrors.length > 0) {
    const top = [...serverErrors].sort((a, b) => b.count - a.count)[0];
    const affected = Array.from(new Set(serverErrors.map((r) => r.transaction))).slice(0, 5);
    hypotheses.push({
      id: "rca-server-errors",
      title: "Backend or gateway failure under load",
      confidence: top.count > 50 ? "high" : "medium",
      category: "errors",
      summary: `Server-side errors (${top.errorCode}) dominate failures, suggesting downstream services or gateways are failing as load increases.`,
      evidence: [
        `${serverErrors.reduce((s, r) => s + r.count, 0)} total 5xx errors`,
        `Top error: ${top.errorCode} on ${top.transaction} (${top.count} occurrences)`,
        top.message ? `Message: ${top.message}` : "Multiple 5xx response codes observed",
      ],
      affectedTransactions: affected,
      recommendedActions: [
        "Review application and gateway logs during peak load window",
        "Check connection pool, thread pool, and dependency timeouts",
        "Validate auto-scaling and circuit breaker configuration",
      ],
    });
  }

  if (latencyFindings.length > 0 && serverErrors.length === 0) {
    const affected = latencyFindings.map((f) => f.transaction).slice(0, 5);
    hypotheses.push({
      id: "rca-latency",
      title: "Response time degradation without elevated errors",
      confidence: latencyFindings.some((f) => f.status === "fail") ? "high" : "medium",
      category: "latency",
      summary:
        "Transactions exceed SLA response-time thresholds while error rates remain controlled, indicating slow processing rather than hard failures.",
      evidence: latencyFindings.slice(0, 3).flatMap((f) => f.evidence.slice(0, 2)),
      affectedTransactions: affected,
      recommendedActions: [
        "Profile slow transactions and database query plans",
        "Inspect cache hit rates and external API latency",
        "Compare resource utilization (CPU, memory, I/O) during the test window",
      ],
    });
  }

  if (errorSpike.detected) {
    hypotheses.push({
      id: "rca-error-spike",
      title: "Error rate increased during test ramp-up",
      confidence: errorSpike.ratio >= 2 ? "high" : "medium",
      category: "stability",
      summary: `Errors accelerated in the second half of the test (${errorSpike.ratio.toFixed(1)}x vs first half), indicating saturation or resource exhaustion.`,
      evidence: [
        `Error spike ratio: ${errorSpike.ratio.toFixed(1)}x`,
        errorSpike.peakTime ? `Peak error window: ${errorSpike.peakTime}` : "Errors trend upward over time",
      ],
      affectedTransactions: input.errorRows.slice(0, 3).map((r) => r.transaction),
      recommendedActions: [
        "Correlate error spike with user ramp-up and infrastructure metrics",
        "Review queue depths, thread pools, and database connection limits",
        "Re-run with staged ramp-up to identify breaking point",
      ],
    });
  }

  const regressions =
    input.baselineComparison?.filter((b) => b.deltaPct > 15 && b.baselineAvgRtSec > 0) ?? [];
  if (regressions.length > 0) {
    const top = [...regressions].sort((a, b) => b.deltaPct - a.deltaPct)[0];
    hypotheses.push({
      id: "rca-baseline-regression",
      title: "Performance regression vs baseline",
      confidence: top.deltaPct > 30 ? "high" : "medium",
      category: "regression",
      summary: `${regressions.length} transaction(s) regressed more than 15% vs baseline. Worst: ${top.transaction} (+${top.deltaPct.toFixed(1)}% avg RT).`,
      evidence: regressions.slice(0, 3).map(
        (r) =>
          `${r.transaction}: ${r.currentAvgRtSec.toFixed(2)}s vs baseline ${r.baselineAvgRtSec.toFixed(2)}s (+${r.deltaPct.toFixed(1)}%)`
      ),
      affectedTransactions: regressions.map((r) => r.transaction).slice(0, 5),
      recommendedActions: [
        "Compare build/deployment changes between baseline and current run",
        "Review recent code changes affecting regressed transactions",
        "Establish rollback criteria if regression persists in next run",
      ],
    });
  }

  const lowThroughput = input.transactions.filter(
    (tx) => tx.throughput < 1 && tx.samples > 100
  );
  if (lowThroughput.length > 0) {
    hypotheses.push({
      id: "rca-throughput",
      title: "Throughput bottleneck detected",
      confidence: "medium",
      category: "throughput",
      summary: `${lowThroughput.length} transaction(s) show very low throughput despite high sample counts, suggesting a processing bottleneck.`,
      evidence: lowThroughput.slice(0, 3).map(
        (tx) => `${tx.name}: ${tx.throughput.toFixed(2)}/sec with ${tx.samples} samples`
      ),
      affectedTransactions: lowThroughput.map((tx) => tx.name).slice(0, 5),
      recommendedActions: [
        "Check for synchronous blocking calls in hot paths",
        "Review JMeter thread group and pacing configuration",
        "Validate target environment capacity matches load profile",
      ],
    });
  }

  for (const script of input.scriptSummaries.filter((s) => s.failedIterations > 0)) {
    hypotheses.push({
      id: `rca-script-${script.scriptName.replace(/\s+/g, "-").toLowerCase()}`,
      title: `Script instability: ${script.scriptName}`,
      confidence: script.failedIterations > script.passIterations ? "high" : "medium",
      category: "stability",
      summary: `${script.scriptName} had ${script.failedIterations} failed iteration(s) out of ${script.totalIterations}.`,
      evidence: [
        `${script.failedIterations} failed / ${script.totalIterations} total iterations`,
        script.failedTransactions.length
          ? `Failed transactions: ${script.failedTransactions.join(", ")}`
          : "Iteration failures without mapped transactions",
      ],
      affectedTransactions: script.failedTransactions.slice(0, 5),
      recommendedActions: [
        "Review script correlation, think times, and data dependencies",
        "Validate test data uniqueness and cleanup between iterations",
        "Check for race conditions in multi-threaded script logic",
      ],
    });
  }

  if (hypotheses.length === 0) {
    hypotheses.push({
      id: "rca-no-critical",
      title: "No dominant root cause identified",
      confidence: "low",
      category: "stability",
      summary:
        "Performance metrics are within expected bounds. Continue monitoring during peak production windows.",
      evidence: ["SLA thresholds met for evaluated transactions", "No significant error clusters detected"],
      affectedTransactions: [],
      recommendedActions: ["Schedule periodic baseline comparison runs", "Monitor production SLAs"],
    });
  }

  return hypotheses.slice(0, 8);
}
