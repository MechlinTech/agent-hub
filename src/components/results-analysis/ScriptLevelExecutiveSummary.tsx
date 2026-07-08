"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, FileDown, Library, Loader2, X } from "lucide-react";
import type { FailedTransactionDetail, ResultsAnalysisRecord, ScriptSummaryRow } from "@/lib/results-analysis/types";
import {
  collectUniqueScriptErrorCodes,
  resolveFailedTransactionDetails,
} from "@/lib/results-analysis/failed-transaction-details";
import {
  buildScriptExecutiveSummaryPdfContext,
  exportScriptExecutiveSummaryPdf,
} from "@/lib/results-analysis/script-executive-summary-pdf";
import { fmtPct } from "@/lib/results-analysis/display-metrics";
import { pillBadge } from "@/lib/utils";

function fmtSamples(value?: number): string {
  if (value == null || value <= 0) return "—";
  return value.toLocaleString();
}

function fmtMs(value?: number): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value)}`;
}

function fmtHits(value?: number): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toFixed(2);
}

function fmtBandwidthKib(value?: number): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toFixed(2);
}

function ScriptRequestStatsModal({ row, onClose }: { row: ScriptSummaryRow; onClose: () => void }) {
  const labels = row.labelStats ?? [];
  const elementLabels = labels.filter((l) => !l.isTotal);
  const totalRow = labels.find((l) => l.isTotal);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[60] flex max-h-[90vh] w-full max-w-[95vw] flex-col overflow-hidden rounded-xl bg-white shadow-xl xl:max-w-7xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">Request Stats</h2>
            <p className="mt-0.5 truncate text-sm text-slate-500" title={row.scriptName}>
              {row.scriptName}
            </p>
            {labels.length > 0 && (
              <p className="mt-1 text-xs text-slate-500">
                Results: {elementLabels.length} label{elementLabels.length === 1 ? "" : "s"}
                {totalRow ? ` · ALL row: ${fmtSamples(totalRow.samples)} samples` : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close request stats"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-auto px-5 py-4">
          {labels.length === 0 ? (
            <p className="text-sm text-slate-600">
              Per-label Request Stats are not stored for this analysis. Re-import the BlazeMeter run to
              load all labels for each script.
            </p>
          ) : (
            <>
              <p className="mb-3 text-xs text-slate-500">
                <strong># Samples</strong> = BlazeMeter request executions per label (same as Request Stats
                tab). Script total uses the <strong>ALL</strong> row for this scenario, not the sum of
                labels.
              </p>
              <div className="overflow-x-auto rounded-lg border border-slate-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 whitespace-nowrap min-w-[12rem]">Element Label</th>
                      <th className="px-3 py-2 whitespace-nowrap"># Samples</th>
                      <th className="px-3 py-2 whitespace-nowrap">Avg. Response Time (ms)</th>
                      <th className="px-3 py-2 whitespace-nowrap">Avg. Hits/s</th>
                      <th className="px-3 py-2 whitespace-nowrap">90% Line (ms)</th>
                      <th className="px-3 py-2 whitespace-nowrap">95% Line (ms)</th>
                      <th className="px-3 py-2 whitespace-nowrap">99% Line (ms)</th>
                      <th className="px-3 py-2 whitespace-nowrap">Min RT (ms)</th>
                      <th className="px-3 py-2 whitespace-nowrap">Max RT (ms)</th>
                      <th className="px-3 py-2 whitespace-nowrap">Avg. Bandwidth (KiB/s)</th>
                      <th className="px-3 py-2 whitespace-nowrap">Error %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labels.map((label) => (
                      <tr
                        key={label.labelId ?? label.name}
                        className={`border-t border-slate-100 ${label.isTotal ? "bg-slate-50/80 font-medium" : ""}`}
                      >
                        <td className="max-w-[16rem] px-3 py-2.5 break-all text-slate-900">{label.name}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{fmtSamples(label.samples)}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{fmtMs(label.avgResponseTimeMs)}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{fmtHits(label.avgHitsPerSec)}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{fmtMs(label.p90Ms)}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{fmtMs(label.p95Ms)}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{fmtMs(label.p99Ms)}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{fmtMs(label.minResponseTimeMs)}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{fmtMs(label.maxResponseTimeMs)}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{fmtBandwidthKib(label.avgBandwidthKibps)}</td>
                        <td
                          className={`px-3 py-2.5 whitespace-nowrap ${
                            (label.errorRatePct ?? 0) > 0 ? "font-medium text-red-600" : "text-slate-700"
                          }`}
                        >
                          {fmtPct(label.errorRatePct)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FailedTransactionsCell({
  row,
  onShowDetails,
}: {
  row: ScriptSummaryRow;
  onShowDetails: () => void;
}) {
  const count = row.failedTransactions.length;
  if (count === 0) {
    return <span className="text-slate-400">-</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
        {count} failed transaction{count === 1 ? "" : "s"}
      </span>
      <button
        type="button"
        onClick={onShowDetails}
        className="text-xs font-medium text-brand-600 hover:underline"
      >
        Show details
      </button>
    </div>
  );
}

function ResponseBodyModal({
  transactionName,
  errorCode,
  description,
  responseBody,
  onClose,
}: {
  transactionName: string;
  errorCode: string;
  description: string;
  responseBody?: string;
  onClose: () => void;
}) {
  const bodyText =
    responseBody?.trim() ||
    "Response body was not captured for this error. Check BlazeMeter Errors report for full details.";

  async function copyBody() {
    try {
      await navigator.clipboard.writeText(bodyText);
    } catch {
      // ignore clipboard failures
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[80] flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-slate-900">Response</h3>
            <p className="mt-1 truncate text-sm text-slate-500" title={transactionName}>
              {transactionName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close response"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Code</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">{errorCode}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-slate-500">Description</dt>
              <dd className="mt-0.5 text-sm text-slate-700">{description}</dd>
            </div>
          </dl>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-900">Response Body</h4>
              <button
                type="button"
                onClick={copyBody}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy to clipboard
              </button>
            </div>
            <pre className="max-h-[40vh] overflow-auto rounded-lg border border-slate-100 bg-slate-50 p-4 text-xs leading-relaxed whitespace-pre-wrap text-slate-800">
              {bodyText}
            </pre>
          </div>
        </div>

        <div className="border-t border-slate-100 px-5 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function FailedTransactionCard({
  detail,
  onViewResponse,
}: {
  detail: FailedTransactionDetail;
  onViewResponse: (entry: FailedTransactionDetail["errors"][number]) => void;
}) {
  const totalErrors = detail.errors.reduce((sum, entry) => sum + entry.errorCount, 0);

  return (
    <article className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h4 className="break-all text-sm font-semibold text-slate-900">{detail.name}</h4>
          {detail.apiUrl && (
            <a
              href={detail.apiUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block break-all text-xs text-brand-600 hover:underline"
            >
              {detail.apiUrl}
            </a>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
          {detail.samples != null && detail.samples > 0 && (
            <span title="BlazeMeter Request Stats # Samples">
              {detail.samples.toLocaleString()} samples
              {detail.errorRatePct != null && detail.errorRatePct > 0
                ? ` · ${detail.errorRatePct.toFixed(2)}% errors`
                : ""}
            </span>
          )}
          <span className="rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-700">
            {totalErrors} error{totalErrors === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2 whitespace-nowrap">Code</th>
              <th className="px-4 py-2 min-w-[12rem]">Description</th>
              <th className="px-4 py-2 whitespace-nowrap">Response Body</th>
              <th className="px-4 py-2 whitespace-nowrap">Number of Errors</th>
            </tr>
          </thead>
          <tbody>
            {detail.errors.map((entry, index) => (
              <tr key={`${entry.errorCode}-${index}`} className="border-t border-slate-100 align-top">
                <td className="px-4 py-3 font-medium text-slate-900">{entry.errorCode}</td>
                <td className="px-4 py-3 text-slate-700">{entry.description}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onViewResponse(entry)}
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    Response
                  </button>
                </td>
                <td className="px-4 py-3 text-slate-900">{entry.errorCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function ScriptFailedTransactionsModal({
  row,
  onClose,
}: {
  row: ScriptSummaryRow;
  onClose: () => void;
}) {
  const [responseView, setResponseView] = useState<{
    transactionName: string;
    errorCode: string;
    description: string;
    responseBody?: string;
  } | null>(null);

  const failedDetails = useMemo(
    () => resolveFailedTransactionDetails(row),
    [row]
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
        <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="script-failed-tx-title"
          className="relative z-[60] flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="min-w-0">
              <h2 id="script-failed-tx-title" className="text-lg font-semibold text-slate-900">
                Failed transactions
              </h2>
              <p className="mt-0.5 truncate text-sm text-slate-500" title={row.scriptName}>
                {row.scriptName}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Close details"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-y-auto px-5 py-4">
            <dl className="mb-4 grid gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Result</dt>
                <dd className="mt-0.5">
                  <span
                    className={pillBadge(
                      row.result === "pass"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    )}
                  >
                    {row.result === "pass" ? "Pass" : "Fail"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">User load</dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-900">{row.userLoad}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500"># Samples</dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-900">
                  {fmtSamples(row.totalSamples)}
                  {row.errorSamples != null && row.errorSamples > 0 && (
                    <span className="ml-1 text-xs font-normal text-red-600">
                      ({row.errorSamples.toLocaleString()} errors)
                    </span>
                  )}
                </dd>
              </div>
            </dl>

            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              Failed transactions ({failedDetails.length})
            </h3>
            <div className="space-y-4">
              {failedDetails.map((detail) => (
                <FailedTransactionCard
                  key={detail.name}
                  detail={detail}
                  onViewResponse={(entry) =>
                    setResponseView({
                      transactionName: detail.name,
                      errorCode: entry.errorCode,
                      description: entry.description,
                      responseBody: entry.responseBody,
                    })
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {responseView && (
        <ResponseBodyModal
          transactionName={responseView.transactionName}
          errorCode={responseView.errorCode}
          description={responseView.description}
          responseBody={responseView.responseBody}
          onClose={() => setResponseView(null)}
        />
      )}
    </>
  );
}

function normalizeEditableRows(rows: ScriptSummaryRow[]): ScriptSummaryRow[] {
  return rows.map((row) => ({
    ...row,
    bugId: row.bugId ?? "",
    comments: row.comments ?? "",
  }));
}

export function ScriptLevelExecutiveSummary({
  rows,
  embedded = false,
  analysis,
  showHeaderActions = true,
  editableFields = false,
  libraryEntryId,
  onRowsChange,
}: {
  rows: ScriptSummaryRow[];
  embedded?: boolean;
  analysis?: Partial<Pick<ResultsAnalysisRecord, "id" | "runName" | "externalId" | "masterId" | "testContext">>;
  showHeaderActions?: boolean;
  editableFields?: boolean;
  libraryEntryId?: string;
  onRowsChange?: (rows: ScriptSummaryRow[]) => void;
}) {
  const router = useRouter();
  const [editableRows, setEditableRows] = useState(() => normalizeEditableRows(rows));
  const [detailRow, setDetailRow] = useState<ScriptSummaryRow | null>(null);
  const [statsRow, setStatsRow] = useState<ScriptSummaryRow | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportingLibrary, setExportingLibrary] = useState(false);
  const [libraryMessage, setLibraryMessage] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowsKey = useMemo(() => rows.map((row) => row.scriptName).join("\0"), [rows]);

  useEffect(() => {
    setEditableRows(normalizeEditableRows(rows));
  }, [rowsKey, rows]);

  useEffect(() => {
    onRowsChange?.(editableRows);
  }, [editableRows, onRowsChange]);

  const persistLibraryRows = useCallback(
    async (nextRows: ScriptSummaryRow[]) => {
      if (!libraryEntryId) return;
      setSaveState("saving");
      try {
        const res = await fetch(`/api/results-analysis/library/${libraryEntryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scriptSummaries: nextRows }),
        });
        if (!res.ok) throw new Error("Save failed");
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    },
    [libraryEntryId]
  );

  function updateScriptField(scriptName: string, field: "bugId" | "comments", value: string) {
    setEditableRows((prev) => {
      const next = prev.map((row) =>
        row.scriptName === scriptName ? { ...row, [field]: value } : row
      );
      if (libraryEntryId) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          void persistLibraryRows(next);
        }, 600);
      }
      return next;
    });
  }

  function handleExportPdf() {
    setExporting(true);
    try {
      exportScriptExecutiveSummaryPdf(
        displayRows,
        buildScriptExecutiveSummaryPdfContext(analysis)
      );
    } finally {
      setTimeout(() => setExporting(false), 800);
    }
  }

  async function handleExportToLibrary() {
    setExportingLibrary(true);
    setLibraryMessage(null);
    try {
      const res = await fetch("/api/results-analysis/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: analysis?.id ?? null,
          runName: analysis?.runName ?? "Script-Level Executive Summary",
          externalId: analysis?.externalId ?? null,
          masterId: analysis?.masterId ?? null,
          testContext: analysis?.testContext ?? null,
          scriptSummaries: rows,
        }),
      });
      const data = (await res.json()) as { entry?: { id: string }; error?: string };
      if (!res.ok) {
        setLibraryMessage(data.error ?? "Failed to export to library");
        return;
      }
      if (data.entry?.id) {
        router.push(`/agents/results-analysis/library/${data.entry.id}`);
      }
    } catch {
      setLibraryMessage("Failed to export to library");
    } finally {
      setExportingLibrary(false);
    }
  }
  if (rows.length === 0) return null;

  const displayRows = editableFields ? editableRows : rows;
  const failCount = displayRows.filter((r) => r.result === "fail").length;
  const passCount = displayRows.length - failCount;

  return (
    <>
      <div className={embedded ? "overflow-hidden rounded-lg border border-slate-100" : "card overflow-hidden"}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-900">Script-Level Executive Summary</h3>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-slate-500">
              {displayRows.length} script{displayRows.length === 1 ? "" : "s"} · {passCount} pass ·{" "}
              {failCount} fail
            </p>
            {libraryEntryId && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                {saveState === "saving" && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving…
                  </>
                )}
                {saveState === "saved" && "Saved"}
                {saveState === "error" && <span className="text-rose-600">Save failed</span>}
              </span>
            )}
            {showHeaderActions && (
              <>
                <button
                  type="button"
                  onClick={handleExportToLibrary}
                  disabled={exportingLibrary}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 shadow-sm hover:bg-brand-100 disabled:opacity-60"
                  title="Save this summary to the library — add Bug ID and comments per script there"
                >
                  <Library className="h-3.5 w-3.5" />
                  {exportingLibrary ? "Saving…" : "Export to Library"}
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={exporting}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                  title="Export summary and failed transaction details as PDF"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  {exporting ? "Exporting…" : "Export PDF"}
                </button>
              </>
            )}
            {libraryMessage && (
              <span className="text-xs text-rose-600">{libraryMessage}</span>
            )}
          </div>
        </div>
        <div className={embedded ? "max-h-[50vh] overflow-auto" : "max-h-[32rem] overflow-auto"}>
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Script</th>
                <th className="px-4 py-3 whitespace-nowrap">Result</th>
                <th className="px-4 py-3 whitespace-nowrap">User Load</th>
                <th className="px-4 py-3 whitespace-nowrap">Error Code</th>
                <th className="px-4 py-3 whitespace-nowrap"># Samples</th>
                <th className="px-4 py-3 whitespace-nowrap">Labels</th>
                <th className="px-4 py-3 min-w-[16rem] whitespace-nowrap">Failed Transactions</th>
                {editableFields && (
                  <>
                    <th className="px-4 py-3 min-w-[8rem] whitespace-nowrap">Bug ID</th>
                    <th className="px-4 py-3 min-w-[12rem] whitespace-nowrap">Comments</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => (
                <tr key={row.scriptName} className="border-t border-slate-100 align-top">
                  <td className="max-w-[14rem] px-4 py-3 font-medium text-slate-900">
                    <span className="break-all">{row.scriptName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={pillBadge(
                        row.result === "pass"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-red-100 text-red-800 border-red-200"
                      )}
                    >
                      {row.result === "pass" ? "Pass" : "Fail"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{row.userLoad}</td>
                  <td className="px-4 py-3">
                    {(() => {
                      const codes = collectUniqueScriptErrorCodes(row);
                      if (codes.length === 0) {
                        return <span className="text-slate-400">—</span>;
                      }
                      return (
                        <div className="flex flex-wrap gap-1">
                          {codes.map((code) => (
                            <span
                              key={code}
                              className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-medium text-slate-900">{fmtSamples(row.totalSamples)}</span>
                    {row.errorSamples != null && row.errorSamples > 0 && (
                      <span
                        className="mt-0.5 block text-xs text-red-600"
                        title="Samples with errors (ALL row)"
                      >
                        {row.errorSamples.toLocaleString()} errors
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {row.labelStats && row.labelStats.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setStatsRow(row)}
                        className="text-xs font-medium text-brand-600 hover:underline"
                        title="View all labels — BlazeMeter Request Stats"
                      >
                        {row.labelStats.filter((l) => !l.isTotal).length} labels
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <FailedTransactionsCell row={row} onShowDetails={() => setDetailRow(row)} />
                  </td>
                  {editableFields && (
                    <>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.bugId ?? ""}
                          onChange={(e) => updateScriptField(row.scriptName, "bugId", e.target.value)}
                          placeholder="BUG-1234"
                          className="w-full min-w-[7rem] rounded border border-slate-200 px-2 py-1.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          value={row.comments ?? ""}
                          onChange={(e) => updateScriptField(row.scriptName, "comments", e.target.value)}
                          rows={2}
                          placeholder="Notes…"
                          className="w-full min-w-[10rem] resize-y rounded border border-slate-200 px-2 py-1.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detailRow && (
        <ScriptFailedTransactionsModal row={detailRow} onClose={() => setDetailRow(null)} />
      )}

      {statsRow && (
        <ScriptRequestStatsModal row={statsRow} onClose={() => setStatsRow(null)} />
      )}
    </>
  );
}
