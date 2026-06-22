import {
  collectUniqueScriptErrorCodes,
  resolveFailedTransactionDetails,
} from "./failed-transaction-details";
import type { ResultsAnalysisRecord, ScriptLabelStat, ScriptSummaryRow } from "./types";

export interface ScriptExecutiveSummaryPdfContext {
  runName?: string;
  externalId?: string;
  masterId?: string | null;
  projectName?: string;
  environment?: string;
  buildVersion?: string;
  bugId?: string;
  comments?: string;
}

export interface ScriptExecutiveSummaryHtmlOptions {
  includeBugFields?: boolean;
  includeDetails?: boolean;
  onlyFailedDetails?: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtSamples(value?: number): string {
  if (value == null || value <= 0) return "—";
  return value.toLocaleString();
}

function fmtPct(value?: number): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(2)}%`;
}

function fmtMs(value?: number): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value)}`;
}

function resultBadge(result: "pass" | "fail"): string {
  if (result === "pass") {
    return `<span class="badge badge-pass">Pass</span>`;
  }
  return `<span class="badge badge-fail">Fail</span>`;
}

function responseBodyBlock(body?: string): string {
  const text =
    body?.trim() ||
    "Response body was not captured for this error. Check BlazeMeter Errors report for full details.";
  return `<pre class="response-body">${escapeHtml(text)}</pre>`;
}

function renderLabelStatsTable(labels: ScriptLabelStat[]): string {
  if (labels.length === 0) return "";
  const rows = labels
    .map(
      (label) => `<tr class="${label.isTotal ? "row-total" : ""}">
        <td><strong>${escapeHtml(label.name)}</strong></td>
        <td>${fmtSamples(label.samples)}</td>
        <td>${fmtMs(label.avgResponseTimeMs)}</td>
        <td>${label.avgHitsPerSec != null ? label.avgHitsPerSec.toFixed(2) : "—"}</td>
        <td>${fmtMs(label.p90Ms)}</td>
        <td>${fmtMs(label.p95Ms)}</td>
        <td>${fmtMs(label.p99Ms)}</td>
        <td>${fmtMs(label.minResponseTimeMs)}</td>
        <td>${fmtMs(label.maxResponseTimeMs)}</td>
        <td>${label.avgBandwidthKibps != null ? label.avgBandwidthKibps.toFixed(2) : "—"}</td>
        <td>${fmtPct(label.errorRatePct)}</td>
      </tr>`
    )
    .join("");

  return `<div class="table-wrap"><table class="stats-table">
    <thead><tr>
      <th>Element Label</th><th># Samples</th><th>Avg RT (ms)</th><th>Hits/s</th>
      <th>90%</th><th>95%</th><th>99%</th><th>Min</th><th>Max</th><th>Bandwidth</th><th>Error %</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function renderFailedTransactionDetail(
  detail: ReturnType<typeof resolveFailedTransactionDetails>[number]
): string {
  const metaParts: string[] = [];
  if (detail.samples != null && detail.samples > 0) {
    metaParts.push(`${detail.samples.toLocaleString()} samples`);
  }
  if (detail.errorRatePct != null && detail.errorRatePct > 0) {
    metaParts.push(`${detail.errorRatePct.toFixed(2)}% errors`);
  }
  const meta = metaParts.length > 0 ? `<p class="tx-meta">${escapeHtml(metaParts.join(" · "))}</p>` : "";

  const errorRows = detail.errors
    .map(
      (entry) => `<tr>
        <td><strong>${escapeHtml(entry.errorCode)}</strong></td>
        <td>${escapeHtml(entry.description)}</td>
        <td>${entry.errorCount.toLocaleString()}</td>
      </tr>
      <tr class="response-row">
        <td colspan="3">
          <div class="response-label">Response Body</div>
          ${responseBodyBlock(entry.responseBody)}
        </td>
      </tr>`
    )
    .join("");

  const apiUrl = detail.apiUrl
    ? `<p class="tx-url">${escapeHtml(detail.apiUrl)}</p>`
    : "";

  return `<div class="failed-tx">
    <h4>${escapeHtml(detail.name)}</h4>
    ${apiUrl}
    ${meta}
    <table class="error-table">
      <thead><tr><th>Code</th><th>Description</th><th># Errors</th></tr></thead>
      <tbody>${errorRows}</tbody>
    </table>
  </div>`;
}

function renderScriptDetailSection(
  row: ScriptSummaryRow,
  includeBugFields: boolean
): string {
  const failedDetails = resolveFailedTransactionDetails(row);
  const codes = collectUniqueScriptErrorCodes(row);
  const labelCount = row.labelStats?.filter((l) => !l.isTotal).length ?? 0;

  let body = `<section class="script-detail">
    <div class="script-detail-header">
      <h3>${escapeHtml(row.scriptName)}</h3>
      ${resultBadge(row.result)}
    </div>
    <div class="script-meta-grid">
      <div><label>User Load</label><span>${row.userLoad}</span></div>
      <div><label># Samples (ALL)</label><span>${fmtSamples(row.totalSamples)}</span></div>
      <div><label>Error Samples</label><span>${row.errorSamples != null && row.errorSamples > 0 ? row.errorSamples.toLocaleString() : "—"}</span></div>
      <div><label>Error Codes</label><span>${codes.length ? escapeHtml(codes.join(", ")) : "—"}</span></div>
      <div><label>Labels</label><span>${labelCount > 0 ? labelCount : "—"}</span></div>
      <div><label>Failed Transactions</label><span>${failedDetails.length > 0 ? failedDetails.length : "—"}</span></div>
      ${
        includeBugFields
          ? `<div><label>Bug ID</label><span>${escapeHtml(row.bugId?.trim() || "—")}</span></div>
      <div><label>Comments</label><span>${escapeHtml(row.comments?.trim() || "—")}</span></div>`
          : ""
      }
    </div>`;

  if (row.labelStats && row.labelStats.length > 0) {
    body += `<h4 class="subheading">Request Stats — All Labels</h4>
      ${renderLabelStatsTable(row.labelStats)}`;
  }

  if (failedDetails.length > 0) {
    body += `<h4 class="subheading">Failed Transaction Details</h4>
      <div class="failed-tx-list">
        ${failedDetails.map((d) => renderFailedTransactionDetail(d)).join("")}
      </div>`;
  }

  body += `</section>`;
  return body;
}

function renderSummaryTable(rows: ScriptSummaryRow[], includeBugFields: boolean): string {
  const bugHeaders = includeBugFields ? "<th>Bug ID</th><th>Comments</th>" : "";
  const tableRows = rows
    .map((row) => {
      const codes = collectUniqueScriptErrorCodes(row);
      const labelCount = row.labelStats?.filter((l) => !l.isTotal).length ?? 0;
      const bugCells = includeBugFields
        ? `<td>${escapeHtml(row.bugId?.trim() || "—")}</td><td>${escapeHtml(row.comments?.trim() || "—")}</td>`
        : "";
      return `<tr>
        <td><strong>${escapeHtml(row.scriptName)}</strong></td>
        <td>${resultBadge(row.result)}</td>
        <td>${row.userLoad}</td>
        <td>${codes.length ? escapeHtml(codes.join(", ")) : "—"}</td>
        <td>${fmtSamples(row.totalSamples)}</td>
        <td>${labelCount > 0 ? labelCount : "—"}</td>
        <td>${row.failedTransactions.length > 0 ? `${row.failedTransactions.length} failed` : "—"}</td>
        ${bugCells}
      </tr>`;
    })
    .join("");

  return `<div class="table-wrap"><table class="summary-table">
    <colgroup>
      <col style="width:20%" />
      <col style="width:8%" />
      <col style="width:8%" />
      <col style="width:12%" />
      <col style="width:10%" />
      <col style="width:8%" />
      <col style="width:12%" />
      ${includeBugFields ? '<col style="width:10%" /><col style="width:12%" />' : ""}
    </colgroup>
    <thead><tr>
      <th>Script</th><th>Result</th><th>User Load</th><th>Error Code</th>
      <th># Samples</th><th>Labels</th><th>Failed Txns</th>${bugHeaders}
    </tr></thead>
    <tbody>${tableRows}</tbody>
  </table></div>`;
}

export const SCRIPT_EXECUTIVE_SUMMARY_STYLES = `
  .script-summary-embed {
    width: 100%;
    max-width: 100%;
    overflow: hidden;
  }
  .script-summary-embed .overview-row {
    display: flex;
    gap: 12px;
    margin: 16px 0;
    flex-wrap: wrap;
  }
  .script-summary-embed .overview-chip {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 16px;
    min-width: 100px;
    text-align: center;
  }
  .script-summary-embed .overview-chip .label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
  .script-summary-embed .overview-chip .value { font-size: 18px; font-weight: 700; margin-top: 2px; }
  .script-summary-embed .table-wrap {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    margin: 8px 0 14px;
  }
  .script-summary-embed .table-wrap table { margin: 0; }
  .script-summary-embed table {
    width: 100%;
    max-width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    font-size: 11px;
  }
  .script-summary-embed th {
    background: #f1f5f9;
    text-align: left;
    padding: 7px 8px;
    font-size: 9px;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border-bottom: 2px solid #e2e8f0;
    vertical-align: top;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  .script-summary-embed td {
    padding: 7px 8px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: top;
    color: #334155;
    word-break: break-word;
    overflow-wrap: anywhere;
    hyphens: auto;
  }
  .script-summary-embed .stats-table { font-size: 9px; }
  .script-summary-embed .stats-table th { font-size: 8px; padding: 5px 6px; }
  .script-summary-embed .stats-table td { font-size: 9px; padding: 5px 6px; }
  .script-summary-embed tr:nth-child(even) td { background: #fafafa; }
  .script-summary-embed tr.row-total td { background: #f1f5f9; font-weight: 600; }
  .script-summary-embed .badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
  }
  .script-summary-embed .badge-pass { background: #dcfce7; color: #166534; }
  .script-summary-embed .badge-fail { background: #fee2e2; color: #991b1b; }
  .script-summary-embed .script-detail {
    page-break-inside: auto;
    break-inside: auto;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 16px;
    background: #fff;
    max-width: 100%;
    overflow: hidden;
  }
  .script-summary-embed .script-detail-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e2e8f0;
  }
  .script-summary-embed .script-detail-header h3 {
    margin: 0;
    font-size: 14px;
    color: #0f172a;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  .script-summary-embed .script-meta-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px 14px;
    margin-bottom: 14px;
  }
  .script-summary-embed .script-meta-grid div label { display: block; font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; }
  .script-summary-embed .script-meta-grid div span {
    font-size: 12px;
    font-weight: 600;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  .script-summary-embed .subheading { font-size: 12px; font-weight: 700; color: #334155; margin: 14px 0 8px; }
  .script-summary-embed .failed-tx {
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 12px;
    background: #fffbfb;
  }
  .script-summary-embed .failed-tx h4 { margin: 0 0 6px; font-size: 12px; color: #991b1b; word-break: break-word; }
  .script-summary-embed .tx-url { margin: 0 0 6px; font-size: 10px; color: #2563eb; word-break: break-all; }
  .script-summary-embed .tx-meta { margin: 0 0 8px; font-size: 10px; color: #64748b; }
  .script-summary-embed .response-row td { background: #f8fafc !important; padding-top: 4px; }
  .script-summary-embed .response-label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
  .script-summary-embed .response-body {
    margin: 0;
    padding: 10px 12px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 10px;
    line-height: 1.45;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-wrap: anywhere;
    max-width: 100%;
    color: #1e293b;
  }
  @media print {
    .script-summary-embed .table-wrap { overflow: visible; }
    .script-summary-embed .script-detail { page-break-inside: auto; }
    .script-summary-embed .failed-tx { page-break-inside: avoid; break-inside: avoid; }
  }
`;

export function renderScriptExecutiveSummaryOverviewChips(rows: ScriptSummaryRow[]): string {
  const passCount = rows.filter((r) => r.result === "pass").length;
  const failCount = rows.length - passCount;
  return `<div class="overview-row">
    <div class="overview-chip"><div class="label">Scripts</div><div class="value">${rows.length}</div></div>
    <div class="overview-chip"><div class="label">Pass</div><div class="value" style="color:#166534">${passCount}</div></div>
    <div class="overview-chip"><div class="label">Fail</div><div class="value" style="color:#991b1b">${failCount}</div></div>
  </div>`;
}

export function renderScriptExecutiveSummaryEmbed(
  rows: ScriptSummaryRow[],
  options: ScriptExecutiveSummaryHtmlOptions = {}
): string {
  if (rows.length === 0) {
    return "<p>No script-level summary data is available for this run.</p>";
  }

  const includeBugFields = options.includeBugFields ?? false;
  const includeDetails = options.includeDetails ?? false;
  const onlyFailedDetails = options.onlyFailedDetails ?? false;

  let html = `<div class="script-summary-embed">
    <style>${SCRIPT_EXECUTIVE_SUMMARY_STYLES}</style>
    ${renderScriptExecutiveSummaryOverviewChips(rows)}
    ${renderSummaryTable(rows, includeBugFields)}`;

  if (includeDetails) {
    const detailRows = onlyFailedDetails ? rows.filter((r) => r.result === "fail") : rows;
    if (detailRows.length > 0) {
      html += `<h2 style="margin-top:24px;">Script Details — Request Stats &amp; Failed Transactions</h2>
        ${detailRows.map((row) => renderScriptDetailSection(row, includeBugFields)).join("")}`;
    }
  }

  html += `</div>`;
  return html;
}

const PDF_PAGE_STYLES = `
  * { box-sizing: border-box; }
  @page { size: A4 landscape; margin: 12mm; }
  body {
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    color: #0f172a;
    line-height: 1.5;
    margin: 0;
    padding: 0;
    background: #fff;
    font-size: 12px;
  }
  .page { padding: 8px 12px 24px; }
  .brand-bar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #2563eb;
    padding-bottom: 14px;
    margin-bottom: 20px;
  }
  .brand { font-size: 11px; font-weight: 700; color: #2563eb; letter-spacing: 0.06em; text-transform: uppercase; }
  .report-title { font-size: 22px; font-weight: 700; margin: 6px 0 2px; }
  .report-subtitle { font-size: 13px; color: #64748b; margin: 0; }
  .generated { font-size: 11px; color: #94a3b8; text-align: right; white-space: nowrap; }
  .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 20px;
  }
  .meta-grid div label { display: block; font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .meta-grid div span { font-size: 13px; font-weight: 600; color: #0f172a; }
  h2 {
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
    margin: 20px 0 10px;
    padding-bottom: 4px;
    border-bottom: 1px solid #e2e8f0;
  }
  .footer {
    margin-top: 24px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
    font-size: 10px;
    color: #94a3b8;
    text-align: center;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  ${SCRIPT_EXECUTIVE_SUMMARY_STYLES.replace(/\.script-summary-embed /g, "")}
`;

export function generateScriptExecutiveSummaryPdfHtml(
  rows: ScriptSummaryRow[],
  context: ScriptExecutiveSummaryPdfContext = {}
): string {
  const generated = new Date().toLocaleString();
  const runName = context.runName?.trim() || "Performance Test Run";
  const includeBugFields = rows.some((r) => r.bugId?.trim() || r.comments?.trim());
  const detailSections = rows.map((row) => renderScriptDetailSection(row, includeBugFields)).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Script-Level Executive Summary — ${escapeHtml(runName)}</title>
  <style>${PDF_PAGE_STYLES}</style>
</head>
<body>
  <div class="page">
    <div class="brand-bar">
      <div>
        <div class="brand">Agent Hub</div>
        <h1 class="report-title">Script-Level Executive Summary</h1>
        <p class="report-subtitle">${escapeHtml(runName)}</p>
      </div>
      <div class="generated">Generated ${escapeHtml(generated)}</div>
    </div>

    <div class="meta-grid">
      ${context.externalId ? `<div><label>Analysis ID</label><span>${escapeHtml(context.externalId)}</span></div>` : ""}
      ${context.masterId ? `<div><label>Master ID</label><span>${escapeHtml(context.masterId)}</span></div>` : ""}
      ${context.projectName ? `<div><label>Project</label><span>${escapeHtml(context.projectName)}</span></div>` : ""}
      ${context.environment ? `<div><label>Environment</label><span>${escapeHtml(context.environment)}</span></div>` : ""}
      ${context.buildVersion ? `<div><label>Build</label><span>${escapeHtml(context.buildVersion)}</span></div>` : ""}
    </div>

    <h2>Summary Overview</h2>
    ${renderScriptExecutiveSummaryOverviewChips(rows)}
    ${renderSummaryTable(rows, includeBugFields)}

    <h2>Script Details — Request Stats &amp; Failed Transactions</h2>
    ${detailSections}

    <div class="footer">
      Agent Hub · BlazeMeter Results Analysis · Script-Level Executive Summary Report · Confidential
    </div>
  </div>
</body>
</html>`;
}

export function buildScriptExecutiveSummaryPdfContext(
  analysis?: Partial<Pick<ResultsAnalysisRecord, "runName" | "externalId" | "masterId" | "testContext">>
): ScriptExecutiveSummaryPdfContext {
  if (!analysis) return {};
  return {
    runName: analysis.runName,
    externalId: analysis.externalId,
    masterId: analysis.masterId,
    projectName: analysis.testContext?.projectName,
    environment: analysis.testContext?.environment,
    buildVersion: analysis.testContext?.buildVersion,
  };
}

export function buildLibraryExportContext(entry: {
  runName: string;
  externalAnalysisId: string | null;
  masterId: string | null;
  projectName: string | null;
  environment: string | null;
  buildVersion: string | null;
}): ScriptExecutiveSummaryPdfContext {
  return {
    runName: entry.runName,
    externalId: entry.externalAnalysisId ?? undefined,
    masterId: entry.masterId,
    projectName: entry.projectName ?? undefined,
    environment: entry.environment ?? undefined,
    buildVersion: entry.buildVersion ?? undefined,
  };
}
