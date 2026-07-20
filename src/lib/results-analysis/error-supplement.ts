import type { ParsedErrorRow, ParsedTransaction } from "./types";

export function supplementErrorRows(
  errorRows: ParsedErrorRow[],
  transactions: ParsedTransaction[],
  totalRow?: ParsedTransaction | null
): ParsedErrorRow[] {
  if (errorRows.length > 0) return errorRows;

  const rows: ParsedErrorRow[] = [];
  for (const tx of transactions) {
    const count =
      tx.errorsCount ?? (tx.errorRatePct > 0 ? Math.round((tx.samples * tx.errorRatePct) / 100) : 0);
    if (count <= 0 && tx.errorRatePct <= 0) continue;
    rows.push({
      transaction: tx.name,
      errorCode: "-",
      message: `Transaction error rate ${tx.errorRatePct.toFixed(2)}% (${count.toLocaleString()} errors)`,
      count: count || 1,
      pctOfTotal: 0,
      severity: tx.errorRatePct >= 5 ? "high" : tx.errorRatePct >= 1 ? "medium" : "low",
      possibleCause: "Import error-stats report or check BlazeMeter for response code breakdown.",
    });
  }

  if (rows.length === 0 && totalRow && (totalRow.errorsCount ?? 0) > 0) {
    rows.push({
      transaction: totalRow.name === "TOTAL" ? "ALL" : totalRow.name,
      errorCode: "-",
      message: "Aggregate errors from BlazeMeter report",
      count: totalRow.errorsCount!,
      pctOfTotal: 100,
      severity: (totalRow.errorRatePct ?? 0) >= 5 ? "high" : "medium",
      possibleCause: "Detailed response codes not available in error-stats export.",
    });
    return rows;
  }

  const total = rows.reduce((s, r) => s + r.count, 0);
  return rows.map((r) => ({
    ...r,
    pctOfTotal: total > 0 ? (r.count / total) * 100 : 0,
  }));
}

export function resolveTotalErrors(
  errorRows: ParsedErrorRow[],
  totalRow?: ParsedTransaction | null,
  errorRatePct = 0,
  totalSamples = 0
): number {
  const fromRows = errorRows.reduce((s, r) => s + r.count, 0);
  if (fromRows > 0) return fromRows;
  if (totalRow?.errorsCount != null && totalRow.errorsCount > 0) return totalRow.errorsCount;
  if (errorRatePct > 0 && totalSamples > 0) return Math.round((totalSamples * errorRatePct) / 100);
  return 0;
}
