import type { ParsedTransaction, SlaProfile, TransactionStatus } from "./types";

export interface SlaEvaluation {
  status: TransactionStatus;
  breachedMetrics: string[];
  thresholds: Record<string, number>;
}

function getTransactionRule(profile: SlaProfile, name: string) {
  const exact = profile.transactions.find(
    (t) => t.transactionName.toLowerCase() === name.toLowerCase()
  );
  if (exact) return exact;
  if (!profile.useDefaultWhenMissing) return null;
  return {
    id: "default",
    transactionName: name,
    p95MaxSec: profile.p95MaxSec,
    errorRateMaxPct: profile.maxErrorRatePct,
    criticalFlow: false,
  };
}

export function evaluateTransactionSla(
  tx: ParsedTransaction,
  profile: SlaProfile
): SlaEvaluation {
  const rule = getTransactionRule(profile, tx.name);
  const breachedMetrics: string[] = [];
  const thresholds: Record<string, number> = {};

  if (tx.avgRtSec > profile.avgResponseTimeMaxSec) {
    breachedMetrics.push(`Avg RT ${tx.avgRtSec.toFixed(2)}s > ${profile.avgResponseTimeMaxSec}s`);
  }
  if (tx.p90Sec > profile.p90MaxSec) {
    breachedMetrics.push(`P90 ${tx.p90Sec.toFixed(2)}s > ${profile.p90MaxSec}s`);
  }

  const p95Max = rule?.p95MaxSec ?? profile.p95MaxSec;
  thresholds.p95MaxSec = p95Max;
  if (tx.p95Sec > p95Max) {
    breachedMetrics.push(`P95 ${tx.p95Sec.toFixed(2)}s > ${p95Max}s`);
  }

  if (tx.p99Sec > profile.p99MaxSec) {
    breachedMetrics.push(`P99 ${tx.p99Sec.toFixed(2)}s > ${profile.p99MaxSec}s`);
  }

  const errorMax = rule?.errorRateMaxPct ?? profile.maxErrorRatePct;
  thresholds.errorRateMaxPct = errorMax;
  if (tx.errorRatePct > errorMax) {
    breachedMetrics.push(`Error ${tx.errorRatePct.toFixed(2)}% > ${errorMax}%`);
  }

  if (tx.throughput < profile.minThroughput && tx.samples > 0) {
    breachedMetrics.push(
      `Throughput ${tx.throughput.toFixed(1)}/sec < ${profile.minThroughput}/sec`
    );
  }

  let status: TransactionStatus = "pass";
  if (breachedMetrics.some((m) => m.startsWith("Error") || m.startsWith("P95"))) {
    status = rule?.criticalFlow && tx.errorRatePct > errorMax ? "fail" : "warning";
  }
  if (tx.errorRatePct > errorMax * 2 || (rule?.criticalFlow && tx.p95Sec > p95Max * 1.5)) {
    status = "fail";
  }

  return { status, breachedMetrics, thresholds };
}

export function computeSlaComplianceScore(
  transactions: ParsedTransaction[],
  profile: SlaProfile
): number {
  if (transactions.length === 0) return 0;
  const passCount = transactions.filter(
    (tx) => evaluateTransactionSla(tx, profile).status === "pass"
  ).length;
  return Math.round((passCount / transactions.length) * 100);
}
