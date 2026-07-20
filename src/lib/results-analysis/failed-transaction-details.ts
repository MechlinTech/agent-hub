import type {
  FailedTransactionDetail,
  FailedTransactionErrorEntry,
  ParsedErrorRow,
} from "./types";

export interface AggregateReportRowLike {
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
  p90?: number;
  p95?: number;
  p99?: number;
  avgBytes?: number;
  stDev?: number;
}

export interface ScenarioExecutionLike {
  iterations?: number;
  concurrency?: number;
  scenario?: string;
}

export interface BlazeMeterErrorReportLabelLike {
  labelId?: string;
  name: string;
  errors?: Array<{
    rc?: string;
    m?: string;
    count?: number;
    body?: string;
    responseBody?: string;
  }>;
  assertions?: Array<{
    name?: string;
    failureMessage?: string;
    failures?: number;
  }>;
  failedEmbeddedResources?: Array<{
    rc?: string;
    rm?: string;
    count?: number;
  }>;
  urls?: Array<{ url?: string; count?: number }>;
}

function isAggregateLabel(name: string): boolean {
  const upper = name.toUpperCase();
  return upper === "ALL" || upper === "TOTAL";
}

function isTransactionSampleMessage(message: string): boolean {
  return /number of samples in transaction/i.test(message);
}

function pickPrimaryUrl(label: BlazeMeterErrorReportLabelLike): string | undefined {
  const urls = [...(label.urls ?? [])].sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  return urls[0]?.url?.trim() || undefined;
}

function resolveResponseBody(error: {
  m?: string;
  body?: string;
  responseBody?: string;
}): string | undefined {
  const direct = error.body?.trim() || error.responseBody?.trim();
  if (direct) {
    if (direct.startsWith("http://") || direct.startsWith("https://")) {
      return undefined;
    }
    return direct;
  }
  const message = error.m?.trim();
  if (!message || isTransactionSampleMessage(message)) return undefined;
  return message;
}

function buildErrorEntries(label: BlazeMeterErrorReportLabelLike): FailedTransactionErrorEntry[] {
  const entries: FailedTransactionErrorEntry[] = [];

  for (const error of label.errors ?? []) {
    const code = error.rc?.trim();
    const message = error.m?.trim() ?? "";
    const count = error.count ?? 0;
    if (count <= 0) continue;

    if (!code) {
      if (isTransactionSampleMessage(message)) {
        entries.push({
          errorCode: "-",
          description: message,
          errorCount: count,
          labelId: label.labelId,
        });
      }
      continue;
    }

    entries.push({
      errorCode: code,
      description: isTransactionSampleMessage(message)
        ? message
        : message || `HTTP ${code}`,
      errorCount: count,
      responseBody: resolveResponseBody(error),
      labelId: label.labelId,
    });
  }

  for (const assertion of label.assertions ?? []) {
    const count = assertion.failures ?? 0;
    if (count <= 0) continue;
    entries.push({
      errorCode: "Assertion",
      description: assertion.failureMessage?.trim() || assertion.name?.trim() || "Assertion failed",
      errorCount: count,
      labelId: label.labelId,
    });
  }

  for (const embedded of label.failedEmbeddedResources ?? []) {
    const count = embedded.count ?? 0;
    if (count <= 0) continue;
    entries.push({
      errorCode: embedded.rc?.trim() || "Embedded",
      description: embedded.rm?.trim() || "Embedded resource failed",
      errorCount: count,
      labelId: label.labelId,
    });
  }

  return entries.sort((a, b) => b.errorCount - a.errorCount);
}

export function buildFailedTransactionDetailsFromErrorReport(
  errorLabels: BlazeMeterErrorReportLabelLike[],
  aggregateRows: AggregateReportRowLike[] = []
): FailedTransactionDetail[] {
  const aggregateByName = new Map(
    aggregateRows.map((row) => [row.labelName.trim().toLowerCase(), row])
  );

  const details: FailedTransactionDetail[] = [];

  for (const label of errorLabels) {
    const name = label.name?.trim();
    if (!name || isAggregateLabel(name)) continue;

    const entries = buildErrorEntries(label);
    const aggregateRow = aggregateByName.get(name.toLowerCase());
    const hasAggregateErrors =
      (aggregateRow?.errorsCount ?? 0) > 0 || (aggregateRow?.errorsRate ?? 0) > 0;

    if (entries.length === 0 && !hasAggregateErrors) continue;

    details.push({
      name,
      apiUrl: pickPrimaryUrl(label),
      samples: aggregateRow?.samples,
      errorRatePct: aggregateRow?.errorsRate,
      errors:
        entries.length > 0
          ? entries
          : [
              {
                errorCode: "-",
                description: "Transaction reported errors in aggregate report",
                errorCount: aggregateRow?.errorsCount ?? 1,
                labelId: label.labelId,
              },
            ],
    });
  }

  return details.sort((a, b) => {
    const aCount = a.errors.reduce((sum, e) => sum + e.errorCount, 0);
    const bCount = b.errors.reduce((sum, e) => sum + e.errorCount, 0);
    return bCount - aCount;
  });
}

export function buildFailedTransactionDetailsFromErrorRows(
  errorRows: ParsedErrorRow[],
  failedTransactionNames: string[]
): FailedTransactionDetail[] {
  const names = new Set(failedTransactionNames.map((n) => n.trim().toLowerCase()));
  const byTransaction = new Map<string, FailedTransactionErrorEntry[]>();

  for (const row of errorRows) {
    const key = row.transaction.trim().toLowerCase();
    if (!names.has(key)) continue;
    const existing = byTransaction.get(row.transaction) ?? [];
    existing.push({
      errorCode: row.errorCode,
      description: row.message,
      errorCount: row.count,
    });
    byTransaction.set(row.transaction, existing);
  }

  return failedTransactionNames.map((name) => ({
    name,
    errors: byTransaction.get(name) ??
      byTransaction.get(name.trim().toLowerCase()) ?? [
        {
          errorCode: "-",
          description: "Failed in request statistics",
          errorCount: 1,
        },
      ],
  }));
}

export function resolveFailedTransactionDetails(
  row: Pick<ScriptSummaryRowLike, "failedTransactions" | "failedTransactionDetails">,
  errorRows: ParsedErrorRow[] = []
): FailedTransactionDetail[] {
  if (row.failedTransactionDetails && row.failedTransactionDetails.length > 0) {
    return row.failedTransactionDetails;
  }
  if (row.failedTransactions.length === 0) return [];
  return buildFailedTransactionDetailsFromErrorRows(errorRows, row.failedTransactions);
}

/** Unique error codes for a script (404 listed once even if repeated across transactions). */
export function collectUniqueScriptErrorCodes(
  row: Pick<ScriptSummaryRowLike, "failedTransactions" | "failedTransactionDetails">
): string[] {
  const details = resolveFailedTransactionDetails(row);
  const seen = new Set<string>();
  const codes: string[] = [];
  for (const detail of details) {
    for (const entry of detail.errors) {
      const code = entry.errorCode?.trim();
      if (!code || code === "-") continue;
      if (seen.has(code)) continue;
      seen.add(code);
      codes.push(code);
    }
  }
  return codes;
}

interface ScriptSummaryRowLike {
  failedTransactions: string[];
  failedTransactionDetails?: FailedTransactionDetail[];
}

export function computeIterationStats(input: {
  aggregateRows: AggregateReportRowLike[];
  execution?: ScenarioExecutionLike | null;
}): {
  totalIterations: number;
  passIterations: number;
  failedIterations: number;
} {
  const allRow =
    input.aggregateRows.find((r) => isAggregateLabel(r.labelName)) ?? null;
  const failedTxRows = input.aggregateRows.filter(
    (r) =>
      !isAggregateLabel(r.labelName) &&
      ((r.errorsCount ?? 0) > 0 || (r.errorsRate ?? 0) > 0)
  );

  let totalIterations = input.execution?.iterations ?? 0;
  if (totalIterations <= 0 && allRow?.samples && allRow.concurrency) {
    const concurrency = Math.max(1, allRow.concurrency);
    totalIterations = Math.max(1, Math.round(allRow.samples / concurrency));
  }
  if (totalIterations <= 0) totalIterations = 1;

  let failedIterations = 0;
  if (failedTxRows.length > 0 || (allRow?.errorsCount ?? 0) > 0) {
    const counts = failedTxRows
      .map((r) => r.errorsCount ?? 0)
      .filter((count) => count > 0);
    failedIterations = counts.length > 0 ? Math.max(...counts) : 1;
    failedIterations = Math.min(totalIterations, failedIterations);
  }

  const passIterations = Math.max(0, totalIterations - failedIterations);
  return { totalIterations, passIterations, failedIterations };
}

export function computeSampleStats(input: {
  aggregateRows: AggregateReportRowLike[];
}): {
  totalSamples: number;
  errorSamples: number;
} {
  const allRow =
    input.aggregateRows.find((r) => isAggregateLabel(r.labelName)) ?? null;
  return {
    totalSamples: allRow?.samples ?? 0,
    errorSamples: allRow?.errorsCount ?? 0,
  };
}
