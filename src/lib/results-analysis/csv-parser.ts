import type { ParsedErrorRow, ParsedTransaction, ScriptSummaryRow } from "./types";

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[%\s./_-]+/g, "");
}

function headerIndex(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const c of candidates) {
    const idx = normalized.indexOf(normalizeHeader(c));
    if (idx >= 0) return idx;
  }
  return -1;
}

function resolveLabelIndex(headers: string[]): number {
  const labelNameIdx = headerIndex(headers, ["labelname", "label", "transaction", "name"]);
  if (labelNameIdx >= 0) return labelNameIdx;
  const labelIdIdx = headerIndex(headers, ["labelid"]);
  if (labelIdIdx >= 0) return labelIdIdx;
  return headerIndex(headers, ["label", "transaction", "name"]);
}

function isAggregateLabel(name: string): boolean {
  const n = name.trim().toLowerCase();
  return n === "total" || n === "all";
}

function parseNumber(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace(/,/g, "").replace(/%/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

function parseCsv(content: string): { headers: string[]; rows: string[][] } {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map(splitCsvLine);
  return { headers, rows };
}

function msToSec(value: number, header: string): number {
  const raw = header.trim().toLowerCase();
  const h = normalizeHeader(header);
  if (h.includes("sec") && !raw.includes("(ms)") && !raw.includes("ms)")) return value;
  if (raw.includes("(ms)") || raw.includes("ms)")) return value / 1000;
  if (h.includes("line") || h === "average" || h === "avg" || h === "mean" || h.includes("percentile")) {
    return value / 1000;
  }
  if (h.includes("responsetime") || h.includes("responsetimems")) return value / 1000;
  if (value > 1000) return value / 1000;
  return value;
}

function parseRequestStatsRow(
  row: string[],
  headers: string[],
  labelIdx: number
): ParsedTransaction | null {
  const name = labelIdx >= 0 ? row[labelIdx]?.trim() : row[0]?.trim();
  if (!name) return null;

  const samplesIdx = headerIndex(headers, ["#samples", "samples", "count"]);
  const avgIdx = headerIndex(headers, [
    "avgresponsetime",
    "avgresponsetimems",
    "average",
    "avg",
    "mean",
  ]);
  const p90Idx = headerIndex(headers, ["90line", "90%line", "p90", "percentile90"]);
  const p95Idx = headerIndex(headers, ["95line", "95%line", "p95", "percentile95"]);
  const p99Idx = headerIndex(headers, ["99line", "99%line", "p99", "percentile99"]);
  const errorIdx = headerIndex(headers, ["errorsrate", "errorrate", "error%", "errors"]);
  const throughputIdx = headerIndex(headers, [
    "avgthroughput",
    "throughput",
    "hits/sec",
    "hitspersec",
  ]);
  const minIdx = headerIndex(headers, ["minresponsetime", "min"]);
  const maxIdx = headerIndex(headers, ["maxresponsetime", "max"]);
  const medianIdx = headerIndex(headers, ["medianresponsetime", "median"]);
  const stDevIdx = headerIndex(headers, ["stdev", "stddev"]);
  const durationIdx = headerIndex(headers, ["duration"]);
  const avgBytesIdx = headerIndex(headers, ["avgbytes", "bytes"]);
  const errorsCountIdx = headerIndex(headers, ["errorscount"]);
  const avgLatencyIdx = headerIndex(headers, ["avglatency", "latency"]);
  const concurrencyIdx = headerIndex(headers, ["concurrency", "vus"]);
  const labelIdIdx = headerIndex(headers, ["labelid"]);
  const passedIdx = headerIndex(headers, ["haslabelpassedthresholds", "passedthresholds"]);

  const avgHeader = avgIdx >= 0 ? headers[avgIdx] : "average";
  const p90Header = p90Idx >= 0 ? headers[p90Idx] : "90% line";
  const p95Header = p95Idx >= 0 ? headers[p95Idx] : "95% line";
  const p99Header = p99Idx >= 0 ? headers[p99Idx] : "99% line";
  const medianHeader = medianIdx >= 0 ? headers[medianIdx] : "median";

  const passedRaw = passedIdx >= 0 ? row[passedIdx]?.trim().toLowerCase() : "";
  const passedThresholds =
    passedRaw === "true" ? true : passedRaw === "false" ? false : passedRaw ? null : undefined;

  return {
    name,
    samples: parseNumber(samplesIdx >= 0 ? row[samplesIdx] : row[1]),
    avgRtSec: msToSec(parseNumber(avgIdx >= 0 ? row[avgIdx] : undefined), avgHeader),
    p90Sec: msToSec(parseNumber(p90Idx >= 0 ? row[p90Idx] : undefined), p90Header),
    p95Sec: msToSec(parseNumber(p95Idx >= 0 ? row[p95Idx] : undefined), p95Header),
    p99Sec: msToSec(parseNumber(p99Idx >= 0 ? row[p99Idx] : undefined), p99Header),
    errorRatePct: parseNumber(errorIdx >= 0 ? row[errorIdx] : undefined),
    throughput: parseNumber(throughputIdx >= 0 ? row[throughputIdx] : undefined),
    minRtSec: minIdx >= 0 ? msToSec(parseNumber(row[minIdx]), headers[minIdx]) : undefined,
    maxRtSec: maxIdx >= 0 ? msToSec(parseNumber(row[maxIdx]), headers[maxIdx]) : undefined,
    labelId: labelIdIdx >= 0 ? row[labelIdIdx]?.trim() || undefined : undefined,
    medianRtSec:
      medianIdx >= 0 ? msToSec(parseNumber(row[medianIdx]), medianHeader) : undefined,
    stDevSec: stDevIdx >= 0 ? msToSec(parseNumber(row[stDevIdx]), headers[stDevIdx]) : undefined,
    durationSec: durationIdx >= 0 ? parseNumber(row[durationIdx]) : undefined,
    avgBytes: avgBytesIdx >= 0 ? parseNumber(row[avgBytesIdx]) : undefined,
    errorsCount: errorsCountIdx >= 0 ? parseNumber(row[errorsCountIdx]) : undefined,
    avgLatencySec:
      avgLatencyIdx >= 0 ? msToSec(parseNumber(row[avgLatencyIdx]), headers[avgLatencyIdx]) : undefined,
    concurrency: concurrencyIdx >= 0 ? parseNumber(row[concurrencyIdx]) : undefined,
    passedThresholds,
  };
}

export interface ParsedRequestStatsBundle {
  transactions: ParsedTransaction[];
  totalRow: ParsedTransaction | null;
}

export function parseRequestStatsBundle(content: string): ParsedRequestStatsBundle {
  const { headers, rows } = parseCsv(content);
  if (!headers.length) return { transactions: [], totalRow: null };

  const labelIdx = resolveLabelIndex(headers);
  const transactions: ParsedTransaction[] = [];
  let totalRow: ParsedTransaction | null = null;

  for (const row of rows) {
    const name = labelIdx >= 0 ? row[labelIdx]?.trim() : row[0]?.trim();
    if (!name) continue;
    const parsed = parseRequestStatsRow(row, headers, labelIdx);
    if (!parsed) continue;
    if (isAggregateLabel(name)) {
      totalRow = { ...parsed, name: "TOTAL" };
    } else {
      transactions.push(parsed);
    }
  }

  return { transactions, totalRow };
}

export function parseRequestStatsCsv(content: string): ParsedTransaction[] {
  return parseRequestStatsBundle(content).transactions;
}

export function parseErrorStatsCsv(content: string): ParsedErrorRow[] {
  const { headers, rows } = parseCsv(content);
  if (!headers.length) return [];

  const labelIdx = headerIndex(headers, ["label", "transaction", "name"]);
  const codeIdx = headerIndex(headers, ["responsecode", "code", "statuscode"]);
  const msgIdx = headerIndex(headers, ["responsemessage", "message", "errormessage"]);
  const countIdx = headerIndex(headers, ["#samples", "samples", "count", "errors"]);

  const parsed = rows
    .map((row): ParsedErrorRow | null => {
      const transaction = labelIdx >= 0 ? row[labelIdx]?.trim() : row[0]?.trim();
      const errorCode = codeIdx >= 0 ? row[codeIdx]?.trim() : row[1]?.trim();
      if (!transaction || !errorCode) return null;
      const count = parseNumber(countIdx >= 0 ? row[countIdx] : row[2]);
      const codeNum = parseInt(errorCode, 10);
      const severity: ParsedErrorRow["severity"] =
        codeNum >= 500 ? "high" : codeNum >= 400 ? "medium" : "low";
      return {
        transaction,
        errorCode,
        message: msgIdx >= 0 ? row[msgIdx]?.trim() || "Error" : "Error",
        count,
        pctOfTotal: 0,
        severity,
        possibleCause: inferErrorCause(errorCode),
      };
    })
    .filter((r): r is ParsedErrorRow => r !== null);

  const total = parsed.reduce((s, r) => s + r.count, 0);
  return parsed.map((r) => ({
    ...r,
    pctOfTotal: total > 0 ? (r.count / total) * 100 : 0,
  }));
}

function inferErrorCause(code: string): string {
  const n = parseInt(code, 10);
  if (n === 502) return "Upstream service unavailable or bad gateway";
  if (n === 504) return "Gateway timeout under load";
  if (n === 500) return "Internal server error";
  if (n === 401) return "Authentication failure or expired session";
  if (n === 400) return "Invalid request payload or validation failure";
  if (n >= 500) return "Server-side failure under load";
  if (n >= 400) return "Client or authorization issue";
  return "Application or network error";
}

export function parseTimelineCsv(content: string): {
  scriptSummaries: ScriptSummaryRow[];
  errorTrend: { time: string; errors: number; errorRatePct: number }[];
} {
  const { headers, rows } = parseCsv(content);
  if (!headers.length) return { scriptSummaries: [], errorTrend: [] };

  const scriptIdx = headerIndex(headers, ["script", "label", "transaction", "threadgroup"]);
  const timeIdx = headerIndex(headers, ["time", "timestamp", "elapsed", "minute"]);
  const statusIdx = headerIndex(headers, ["status", "result", "success"]);
  const failedTxIdx = headerIndex(headers, ["failedtransaction", "failedlabel", "errorlabel"]);
  const userLoadIdx = headerIndex(headers, ["users", "threads", "vus"]);

  const scriptMap = new Map<string, ScriptSummaryRow>();
  const errorTrend: { time: string; errors: number; errorRatePct: number }[] = [];
  const trendMap = new Map<string, { errors: number; total: number }>();

  for (const row of rows) {
    const scriptName =
      scriptIdx >= 0 ? row[scriptIdx]?.trim() : row[0]?.trim() || "Script 1";
    const statusRaw = statusIdx >= 0 ? row[statusIdx]?.trim().toLowerCase() : "";
    const isPass = !statusRaw || statusRaw === "true" || statusRaw === "pass" || statusRaw === "ok";
    const failedTx =
      failedTxIdx >= 0 && row[failedTxIdx]?.trim() ? row[failedTxIdx].trim() : "";

    const existing =
      scriptMap.get(scriptName) ??
      ({
        scriptName,
        result: "pass",
        userLoad: userLoadIdx >= 0 ? parseNumber(row[userLoadIdx]) : 0,
        totalIterations: 0,
        passIterations: 0,
        failedIterations: 0,
        failedTransactions: [],
      } satisfies ScriptSummaryRow);

    existing.totalIterations += 1;
    if (isPass) existing.passIterations += 1;
    else {
      existing.failedIterations += 1;
      if (failedTx && !existing.failedTransactions.includes(failedTx)) {
        existing.failedTransactions.push(failedTx);
      }
    }
    if (existing.failedIterations > 0) existing.result = "fail";
    scriptMap.set(scriptName, existing);

    if (timeIdx >= 0) {
      const time = row[timeIdx]?.trim() || "unknown";
      const bucket = trendMap.get(time) ?? { errors: 0, total: 0 };
      bucket.total += 1;
      if (!isPass) bucket.errors += 1;
      trendMap.set(time, bucket);
    }
  }

  Array.from(trendMap.entries()).forEach(([time, bucket]) => {
    errorTrend.push({
      time,
      errors: bucket.errors,
      errorRatePct: bucket.total > 0 ? (bucket.errors / bucket.total) * 100 : 0,
    });
  });

  return { scriptSummaries: Array.from(scriptMap.values()), errorTrend };
}

export function validateRequestStatsCsv(content: string): boolean {
  return parseRequestStatsCsv(content).length > 0;
}

export function validateErrorStatsCsv(content: string): boolean {
  const { headers } = parseCsv(content);
  return headers.length > 0;
}

export function validateTimelineCsv(content: string): boolean {
  const { headers, rows } = parseCsv(content);
  return headers.length > 0 && rows.length > 0;
}
