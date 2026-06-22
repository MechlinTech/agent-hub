import type {
  AnalysisResultPayload,
  OverallStatus,
  ParsedErrorRow,
  ParsedTransaction,
  ResultsAnalysisRecord,
  ScriptLabelStat,
  ScriptSummaryRow,
  TestContext,
} from "./types";
import {
  buildFailedTransactionDetailsFromErrorReport,
  buildFailedTransactionDetailsFromErrorRows,
  computeIterationStats,
  computeSampleStats,
  type AggregateReportRowLike,
  type BlazeMeterErrorReportLabelLike,
  type ScenarioExecutionLike,
} from "./failed-transaction-details";

function isAggregateRow(name: string): boolean {
  const upper = name.toUpperCase();
  return upper === "ALL" || upper === "TOTAL";
}

function transactionRows(transactions: ParsedTransaction[]): ParsedTransaction[] {
  return transactions.filter((tx) => !isAggregateRow(tx.name));
}

function findTotalRow(transactions: ParsedTransaction[]): ParsedTransaction | null {
  return transactions.find((tx) => isAggregateRow(tx.name)) ?? null;
}

function mapAggregateRowToLabelStat(row: AggregateReportRowLike): ScriptLabelStat {
  return {
    name: row.labelName.trim(),
    labelId: row.labelId,
    samples: row.samples ?? 0,
    avgResponseTimeMs: row.avgResponseTime,
    avgHitsPerSec: row.avgThroughput,
    p90Ms: row.p90,
    p95Ms: row.p95,
    p99Ms: row.p99,
    minResponseTimeMs: row.minResponseTime,
    maxResponseTimeMs: row.maxResponseTime,
    avgBandwidthKibps: row.avgBytes,
    errorRatePct: row.errorsRate,
    errorsCount: row.errorsCount,
    isTotal: isAggregateRow(row.labelName),
  };
}

export function buildLabelStatsFromAggregateRows(
  aggregateRows: AggregateReportRowLike[]
): ScriptLabelStat[] {
  return aggregateRows
    .filter((row) => row.labelName?.trim())
    .map(mapAggregateRowToLabelStat)
    .sort((a, b) => {
      if (a.isTotal && !b.isTotal) return -1;
      if (!a.isTotal && b.isTotal) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
}

export function mapBlazeMeterAggregateRow(row: {
  labelName: string;
  labelId?: string;
  samples?: number;
  errorsCount?: number;
  errorsRate?: number;
  concurrency?: number;
  avgResponseTime?: number;
  avgThroughput?: number;
  minResponseTime?: number;
  maxResponseTime?: number;
  medianResponseTime?: number;
  "90line"?: number;
  "95line"?: number;
  "99line"?: number;
  avgBytes?: number;
  stDev?: number;
}): AggregateReportRowLike {
  return {
    labelName: row.labelName,
    labelId: row.labelId,
    samples: row.samples,
    errorsCount: row.errorsCount,
    errorsRate: row.errorsRate,
    concurrency: row.concurrency,
    avgResponseTime: row.avgResponseTime,
    avgThroughput: row.avgThroughput,
    minResponseTime: row.minResponseTime,
    maxResponseTime: row.maxResponseTime,
    medianResponseTime: row.medianResponseTime,
    p90: row["90line"],
    p95: row["95line"],
    p99: row["99line"],
    avgBytes: row.avgBytes,
    stDev: row.stDev,
  };
}

function mapParsedTransactionToAggregateRow(tx: ParsedTransaction): AggregateReportRowLike {
  return {
    labelName: tx.name,
    labelId: tx.labelId,
    samples: tx.samples,
    errorsCount: tx.errorsCount,
    errorsRate: tx.errorRatePct,
    concurrency: tx.concurrency,
    avgResponseTime: tx.avgRtSec != null ? tx.avgRtSec * 1000 : undefined,
    avgThroughput: tx.throughput,
    minResponseTime: tx.minRtSec != null ? tx.minRtSec * 1000 : undefined,
    maxResponseTime: tx.maxRtSec != null ? tx.maxRtSec * 1000 : undefined,
    medianResponseTime: tx.medianRtSec != null ? tx.medianRtSec * 1000 : undefined,
    p90: tx.p90Sec != null ? tx.p90Sec * 1000 : undefined,
    p95: tx.p95Sec != null ? tx.p95Sec * 1000 : undefined,
    p99: tx.p99Sec != null ? tx.p99Sec * 1000 : undefined,
    avgBytes: tx.avgBytes,
    stDev: tx.stDevSec != null ? tx.stDevSec * 1000 : undefined,
  };
}

export function buildScriptSummaryFromScenarioData(input: {
  scriptName: string;
  aggregateRows: AggregateReportRowLike[];
  errorLabels?: BlazeMeterErrorReportLabelLike[];
  execution?: ScenarioExecutionLike | null;
}): ScriptSummaryRow {
  const failedTransactionDetails = buildFailedTransactionDetailsFromErrorReport(
    input.errorLabels ?? [],
    input.aggregateRows
  );
  const failedTransactions =
    failedTransactionDetails.length > 0
      ? failedTransactionDetails.map((detail) => detail.name)
      : input.aggregateRows
          .filter(
            (r) =>
              !isAggregateRow(r.labelName) &&
              ((r.errorsCount ?? 0) > 0 || (r.errorsRate ?? 0) > 0)
          )
          .map((r) => r.labelName.trim())
          .filter(Boolean);

  const allRow =
    input.aggregateRows.find((r) => isAggregateRow(r.labelName)) ?? null;
  const failed =
    failedTransactions.length > 0 ||
    (allRow?.errorsCount ?? 0) > 0 ||
    (allRow?.errorsRate ?? 0) > 0;

  const iterationStats = computeIterationStats({
    aggregateRows: input.aggregateRows,
    execution: input.execution,
  });
  const sampleStats = computeSampleStats({ aggregateRows: input.aggregateRows });
  const labelStats = buildLabelStatsFromAggregateRows(input.aggregateRows);

  return {
    scriptName: input.scriptName,
    result: failed ? "fail" : "pass",
    userLoad: input.execution?.concurrency ?? allRow?.concurrency ?? 0,
    ...sampleStats,
    labelStats: labelStats.length > 0 ? labelStats : undefined,
    ...iterationStats,
    failedTransactions,
    failedTransactionDetails:
      failedTransactionDetails.length > 0 ? failedTransactionDetails : undefined,
  };
}

/** @deprecated Use buildScriptSummaryFromScenarioData */
export function buildScriptSummaryFromAggregateRows(
  scriptName: string,
  rows: AggregateReportRowLike[]
): ScriptSummaryRow {
  return buildScriptSummaryFromScenarioData({ scriptName, aggregateRows: rows });
}

export function isPlaceholderScriptSummaries(
  rows: ScriptSummaryRow[],
  overallStatus?: OverallStatus,
  maxUsers?: number
): boolean {
  if (rows.length === 0) return true;
  if (rows.length > 1) return false;

  const row = rows[0];
  const badName =
    !row.scriptName.trim() ||
    row.scriptName.toLowerCase() === "unknown" ||
    row.scriptName.toLowerCase() === "script 1";
  const badLoad = row.userLoad === 0 && (maxUsers ?? 0) > 0;
  const badResult =
    overallStatus != null && row.result === "pass" && overallStatus !== "pass";
  const tooManyFailedTx = row.failedTransactions.length > 5;

  return badName || badLoad || badResult || tooManyFailedTx;
}

export function deriveScriptSummaries(input: {
  runName: string;
  context: TestContext;
  transactions: ParsedTransaction[];
  totalRow?: ParsedTransaction | null;
  overallStatus: OverallStatus;
  masterMaxUsers?: number | null;
  errorRows?: ParsedErrorRow[];
}): ScriptSummaryRow[] {
  const failedTransactions = input.transactions
    .filter((tx) => tx.errorRatePct > 0 || (tx.errorsCount ?? 0) > 0)
    .map((tx) => tx.name);

  const userLoad =
    input.masterMaxUsers ??
    input.totalRow?.concurrency ??
    input.context.targetUsers ??
    0;

  const failed =
    failedTransactions.length > 0 || input.overallStatus !== "pass";

  const scriptName =
    input.runName?.trim() ||
    input.context.projectName?.trim() ||
    "Test Script";

  const aggregateRows: AggregateReportRowLike[] = input.transactions.map(mapParsedTransactionToAggregateRow);
  if (input.totalRow) {
    aggregateRows.push(mapParsedTransactionToAggregateRow(input.totalRow));
  }

  const iterationStats = computeIterationStats({ aggregateRows });
  const sampleStats = computeSampleStats({ aggregateRows });
  const labelStats = buildLabelStatsFromAggregateRows(aggregateRows);
  const failedTransactionDetails =
    failedTransactions.length > 0
      ? buildFailedTransactionDetailsFromErrorRows(
          input.errorRows ?? [],
          failedTransactions
        )
      : undefined;

  return [
    {
      scriptName,
      result: failed ? "fail" : "pass",
      userLoad,
      ...sampleStats,
      labelStats: labelStats.length > 0 ? labelStats : undefined,
      ...iterationStats,
      failedTransactions,
      failedTransactionDetails,
    },
  ];
}

function remapScriptSummaryNames(
  rows: ScriptSummaryRow[],
  mapping: NonNullable<ResultsAnalysisRecord["blazemeterSnapshot"]>["scenariosMapping"]
): ScriptSummaryRow[] {
  if (!mapping || mapping.length === 0) return rows;

  const displayByInternal = new Map<string, string>();
  const displayById = new Map<string, string>();
  for (const entry of mapping) {
    displayById.set(entry.id, entry.name);
    if (entry.internalName) {
      displayByInternal.set(entry.internalName, entry.name);
    }
    if (entry.test) {
      displayByInternal.set(entry.test, entry.name);
    }
  }

  function resolveDisplayName(scriptName: string): string {
    if (displayByInternal.has(scriptName)) {
      return displayByInternal.get(scriptName)!;
    }
    const defaultMatch = /^default-scenario-(\d+)$/i.exec(scriptName);
    if (defaultMatch) {
      const byInternal = displayByInternal.get(scriptName);
      if (byInternal) return byInternal;
      const byId = displayById.get(defaultMatch[1]);
      if (byId) return byId;
    }
    const byScenarioId = displayById.get(scriptName);
    if (byScenarioId) return byScenarioId;
    return scriptName;
  }

  return rows.map((row) => {
    const scriptName = resolveDisplayName(row.scriptName);
    if (scriptName === row.scriptName) return row;
    return { ...row, scriptName };
  });
}

export function resolveScriptSummaries(
  result: AnalysisResultPayload,
  analysis: ResultsAnalysisRecord
): ScriptSummaryRow[] {
  const mapping = analysis.blazemeterSnapshot?.scenariosMapping;
  const scenarioRows = analysis.blazemeterSnapshot?.scenarioScriptSummaries;
  if (scenarioRows && scenarioRows.length > 0) {
    return remapScriptSummaryNames(scenarioRows, mapping);
  }

  const rows = result.scriptSummaries;
  const allRow = findTotalRow(result.transactions);
  const maxUsers =
    analysis.blazemeterSnapshot?.master.maxUsers ??
    allRow?.concurrency ??
    result.summaryMetrics.maxUsers;

  if (!isPlaceholderScriptSummaries(rows, result.overallStatus, maxUsers)) {
    return remapScriptSummaryNames(rows, mapping);
  }

  return deriveScriptSummaries({
    runName: analysis.runName,
    context: analysis.testContext,
    transactions: transactionRows(result.transactions),
    totalRow: allRow,
    overallStatus: result.overallStatus,
    masterMaxUsers: maxUsers,
    errorRows: result.errorAnalysis.errorRows,
  });
}

export { findTotalRow, isAggregateRow, transactionRows };
