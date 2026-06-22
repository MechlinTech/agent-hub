import type { ParsedTransaction } from "./types";

export interface ExtendedSummaryMetrics {
  avgResponseTimeSec: number;
  p90ResponseTimeSec?: number;
  p95ResponseTimeSec: number;
  p99ResponseTimeSec?: number;
  minResponseTimeSec?: number;
  maxResponseTimeSec?: number;
  medianResponseTimeSec?: number;
  stDevSec?: number;
  avgLatencySec?: number;
  errorRatePct: number;
  errorsCount?: number;
  throughput: number;
  totalSamples: number;
  durationSec?: number;
  activeDurationMinutes?: number;
  avgBandwidthKiBps?: number;
}

export interface ScoreBreakdown {
  slaScore: number;
  errorScore: number;
  throughputScore: number;
  stabilityScore: number;
  baselineScore: number;
}

const WEIGHTS = {
  sla: 0.4,
  error: 0.25,
  throughput: 0.15,
  stability: 0.1,
  baseline: 0.1,
};

export function computePerformanceScore(input: {
  slaCompliancePct: number;
  errorRatePct: number;
  maxErrorRatePct: number;
  throughput: number;
  minThroughput: number;
  avgResponseTimeSec: number;
  avgResponseTimeMaxSec: number;
  baselineDeltaPct?: number;
}): { score: number; breakdown: ScoreBreakdown } {
  const slaScore = clamp(input.slaCompliancePct);

  const errorRatio =
    input.maxErrorRatePct > 0 ? input.errorRatePct / input.maxErrorRatePct : input.errorRatePct;
  const errorScore = clamp(100 - errorRatio * 100);

  const throughputRatio =
    input.minThroughput > 0 ? input.throughput / input.minThroughput : 1;
  const throughputScore = clamp(Math.min(throughputRatio, 1.2) * 100);

  const stabilityRatio =
    input.avgResponseTimeMaxSec > 0
      ? input.avgResponseTimeSec / input.avgResponseTimeMaxSec
      : 0;
  const stabilityScore = clamp(100 - stabilityRatio * 50);

  const baselineDelta = input.baselineDeltaPct ?? 0;
  const baselineScore = clamp(100 - Math.max(baselineDelta, 0) * 2);

  const score = Math.round(
    slaScore * WEIGHTS.sla +
      errorScore * WEIGHTS.error +
      throughputScore * WEIGHTS.throughput +
      stabilityScore * WEIGHTS.stability +
      baselineScore * WEIGHTS.baseline
  );

  return {
    score: clamp(score),
    breakdown: {
      slaScore: Math.round(slaScore),
      errorScore: Math.round(errorScore),
      throughputScore: Math.round(throughputScore),
      stabilityScore: Math.round(stabilityScore),
      baselineScore: Math.round(baselineScore),
    },
  };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function fromTotalRow(total: ParsedTransaction): ExtendedSummaryMetrics {
  return {
    avgResponseTimeSec: total.avgRtSec,
    p90ResponseTimeSec: total.p90Sec,
    p95ResponseTimeSec: total.p95Sec,
    p99ResponseTimeSec: total.p99Sec,
    minResponseTimeSec: total.minRtSec,
    maxResponseTimeSec: total.maxRtSec,
    medianResponseTimeSec: total.medianRtSec,
    stDevSec: total.stDevSec,
    avgLatencySec: total.avgLatencySec,
    errorRatePct: total.errorRatePct,
    errorsCount: total.errorsCount,
    throughput: total.throughput,
    totalSamples: total.samples,
    durationSec: total.durationSec,
    activeDurationMinutes:
      total.durationSec && total.durationSec > 0
        ? Math.max(1, Math.round(total.durationSec / 60))
        : undefined,
    avgBandwidthKiBps: total.avgBytes,
  };
}

export function aggregateSummaryMetrics(
  transactions: ParsedTransaction[],
  totalRow?: ParsedTransaction | null
): ExtendedSummaryMetrics {
  if (totalRow) return fromTotalRow(totalRow);

  if (transactions.length === 0) {
    return {
      avgResponseTimeSec: 0,
      p95ResponseTimeSec: 0,
      errorRatePct: 0,
      throughput: 0,
      totalSamples: 0,
    };
  }

  const totalSamples = transactions.reduce((s, t) => s + t.samples, 0);
  const weighted = (pick: (t: ParsedTransaction) => number) =>
    totalSamples > 0
      ? transactions.reduce((s, t) => s + pick(t) * t.samples, 0) / totalSamples
      : transactions.reduce((s, t) => s + pick(t), 0) / transactions.length;

  return {
    avgResponseTimeSec: weighted((t) => t.avgRtSec),
    p90ResponseTimeSec: Math.max(...transactions.map((t) => t.p90Sec)),
    p95ResponseTimeSec: Math.max(...transactions.map((t) => t.p95Sec)),
    p99ResponseTimeSec: Math.max(...transactions.map((t) => t.p99Sec)),
    minResponseTimeSec: Math.min(...transactions.map((t) => t.minRtSec ?? t.avgRtSec)),
    maxResponseTimeSec: Math.max(...transactions.map((t) => t.maxRtSec ?? t.avgRtSec)),
    medianResponseTimeSec: weighted((t) => t.medianRtSec ?? t.avgRtSec),
    stDevSec: weighted((t) => t.stDevSec ?? 0),
    avgLatencySec: weighted((t) => t.avgLatencySec ?? 0),
    errorRatePct: weighted((t) => t.errorRatePct),
    errorsCount: transactions.reduce((s, t) => s + (t.errorsCount ?? 0), 0) || undefined,
    throughput: transactions.reduce((s, t) => s + t.throughput, 0),
    totalSamples,
    avgBandwidthKiBps: weighted((t) => t.avgBytes ?? 0) || undefined,
  };
}
