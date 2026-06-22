import { buildGoNoGoRationale } from "./go-no-go-summary";
import {
  buildScriptExecutiveSummaryPdfContext,
  generateScriptExecutiveSummaryPdfHtml,
  renderScriptExecutiveSummaryEmbed,
} from "./script-executive-summary-html";
import type {
  ActionItem,
  AnalysisResultPayload,
  ResultsAnalysisRecord,
  ScriptSummaryRow,
  TechnicalFinding,
} from "./types";

export type ResultsReportType = "executive" | "technical" | "action-items" | "script-summary";

interface ReportInput {
  analysis: ResultsAnalysisRecord;
  result: AnalysisResultPayload;
  scriptSummaries: ScriptSummaryRow[];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusBadge(status: string): string {
  const colors: Record<string, { bg: string; text: string }> = {
    pass: { bg: "#dcfce7", text: "#166534" },
    warning: { bg: "#fef3c7", text: "#92400e" },
    fail: { bg: "#fee2e2", text: "#991b1b" },
    go: { bg: "#16a34a", text: "#ffffff" },
    conditional_go: { bg: "#f59e0b", text: "#ffffff" },
    no_go: { bg: "#dc2626", text: "#ffffff" },
  };
  const c = colors[status] ?? { bg: "#f1f5f9", text: "#334155" };
  return `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${c.bg};color:${c.text};font-size:12px;font-weight:600;text-transform:uppercase;">${escapeHtml(status.replace("_", " "))}</span>`;
}

const REPORT_STYLES = `
  * { box-sizing: border-box; }
  html, body { width: 100%; max-width: 100%; overflow-x: hidden; }
  @page { size: A4 landscape; margin: 10mm 12mm; }
  body {
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    color: #0f172a;
    line-height: 1.5;
    margin: 0;
    padding: 0;
    background: #fff;
  }
  .page {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding: 28px 32px 36px;
  }
  .brand-bar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 12px 24px;
    border-bottom: 3px solid #2563eb;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }
  .brand { font-size: 13px; font-weight: 700; color: #2563eb; letter-spacing: 0.04em; text-transform: uppercase; }
  .report-title { font-size: 24px; font-weight: 700; margin: 8px 0 4px; color: #0f172a; line-height: 1.2; }
  .report-subtitle { font-size: 14px; color: #64748b; margin: 0; max-width: 42rem; }
  .generated { font-size: 12px; color: #94a3b8; text-align: right; white-space: nowrap; flex-shrink: 0; }
  .meta-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px 20px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 16px 18px;
    margin-bottom: 24px;
  }
  .meta-item { min-width: 0; }
  .meta-item label { display: block; font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
  .meta-item span {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #0f172a;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  h2 {
    font-size: 15px;
    font-weight: 700;
    color: #1e293b;
    margin: 24px 0 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #e2e8f0;
    page-break-after: avoid;
  }
  p, li { font-size: 13px; color: #334155; }
  ul { padding-left: 20px; margin: 8px 0; }
  .summary-box {
    background: #eff6ff;
    border-left: 4px solid #2563eb;
    padding: 14px 16px;
    border-radius: 0 8px 8px 0;
    margin: 12px 0;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  .callout-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 14px 16px;
    margin: 12px 0;
    word-break: break-word;
  }
  .kpi-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin: 16px 0;
  }
  .kpi {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    text-align: center;
    min-width: 0;
  }
  .kpi .label { font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; }
  .kpi .value { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 4px; }
  .table-wrap {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    margin: 10px 0 18px;
    -webkit-overflow-scrolling: touch;
  }
  .table-wrap table { margin: 0; }
  table {
    width: 100%;
    max-width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    font-size: 12px;
  }
  th {
    background: #f1f5f9;
    text-align: left;
    padding: 8px 10px;
    font-size: 10px;
    font-weight: 600;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border-bottom: 2px solid #e2e8f0;
    vertical-align: top;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  td {
    padding: 8px 10px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: top;
    color: #334155;
    word-break: break-word;
    overflow-wrap: anywhere;
    hyphens: auto;
  }
  td.col-status, th.col-status { width: 88px; white-space: nowrap; word-break: normal; }
  td.col-narrow, th.col-narrow { width: 72px; white-space: nowrap; word-break: normal; }
  tr { page-break-inside: avoid; break-inside: avoid; }
  tr:nth-child(even) td { background: #fafafa; }
  .footer {
    margin-top: 32px;
    padding-top: 14px;
    border-top: 1px solid #e2e8f0;
    font-size: 11px;
    color: #94a3b8;
    text-align: center;
  }
  @media print {
    html, body { overflow: visible; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 0; max-width: none; width: auto; }
    .table-wrap { overflow: visible; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
  }
`;

function reportShell(title: string, subtitle: string, body: string, input: ReportInput): string {
  const ctx = input.analysis.testContext;
  const generated = new Date().toLocaleString();
  const masterMeta = input.analysis.masterId
    ? `<div class="meta-item"><label>BlazeMeter Master ID</label><span>${escapeHtml(input.analysis.masterId)}</span></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(title)}: ${escapeHtml(input.analysis.runName)}</title>
  <style>${REPORT_STYLES}</style>
</head>
<body>
  <div class="page">
    <div class="brand-bar">
      <div>
        <div class="brand">Agent Hub</div>
        <h1 class="report-title">${escapeHtml(title)}</h1>
        <p class="report-subtitle">${escapeHtml(subtitle)}</p>
      </div>
      <div class="generated">Generated ${escapeHtml(generated)}</div>
    </div>

    <div class="meta-grid">
      <div class="meta-item"><label>Run Name</label><span>${escapeHtml(input.analysis.runName)}</span></div>
      <div class="meta-item"><label>Analysis ID</label><span>${escapeHtml(input.analysis.externalId)}</span></div>
      ${masterMeta}
      <div class="meta-item"><label>Project</label><span>${escapeHtml(ctx.projectName)}</span></div>
      <div class="meta-item"><label>Environment</label><span>${escapeHtml(ctx.environment)}</span></div>
      <div class="meta-item"><label>Build Version</label><span>${escapeHtml(ctx.buildVersion)}</span></div>
      <div class="meta-item"><label>Test Type</label><span>${escapeHtml(ctx.testType)}</span></div>
      <div class="meta-item"><label>Target Users</label><span>${ctx.targetUsers.toLocaleString()}</span></div>
      <div class="meta-item"><label>Duration</label><span>${ctx.durationMinutes} min</span></div>
    </div>

    ${body}

    <div class="footer">
      Agent Hub · BlazeMeter Results Analysis Agent · Confidential performance report
    </div>
  </div>
</body>
</html>`;
}

function wrapTable(tableHtml: string): string {
  return `<div class="table-wrap">${tableHtml}</div>`;
}

function renderFindingsTable(findings: TechnicalFinding[]): string {
  const rows = findings
    .map(
      (f) => `<tr>
        <td><strong>${escapeHtml(f.transaction)}</strong></td>
        <td class="col-status">${statusBadge(f.status)}</td>
        <td>${escapeHtml(f.finding)}</td>
        <td>${escapeHtml(f.ownerTeam ?? "—")}</td>
        <td class="col-narrow">${escapeHtml(f.priority ?? "—")}</td>
      </tr>`
    )
    .join("");

  return wrapTable(`<table class="findings-table">
    <colgroup>
      <col style="width:22%" />
      <col style="width:9%" />
      <col style="width:46%" />
      <col style="width:13%" />
      <col style="width:10%" />
    </colgroup>
    <thead><tr><th>Transaction</th><th class="col-status">Status</th><th>Finding</th><th>Owner</th><th class="col-narrow">Priority</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`);
}

function renderActionItemsTable(items: ActionItem[]): string {
  const rows = items
    .map(
      (item) => `<tr>
        <td><strong>${escapeHtml(item.title)}</strong><br/><span style="color:#64748b;font-size:11px;">${escapeHtml(item.description)}</span></td>
        <td>${escapeHtml(item.ownerTeam)}</td>
        <td class="col-narrow">${escapeHtml(item.priority)}</td>
        <td class="col-narrow">${escapeHtml(item.status.replace("_", " "))}</td>
      </tr>`
    )
    .join("");

  return wrapTable(`<table>
    <colgroup>
      <col style="width:48%" />
      <col style="width:22%" />
      <col style="width:15%" />
      <col style="width:15%" />
    </colgroup>
    <thead><tr><th>Action</th><th>Owner Team</th><th class="col-narrow">Priority</th><th class="col-narrow">Status</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`);
}

function renderGoNoGoSection(input: ReportInput): string {
  const rationale = buildGoNoGoRationale(input.result, input.scriptSummaries);
  const bullets = rationale.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("");

  return `
    <h2>Go / No-Go Recommendation</h2>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">
      <div>Overall: ${statusBadge(input.result.overallStatus)}</div>
      <div>Decision: ${statusBadge(input.result.goNoGo)}</div>
      <div>Score: <strong>${input.result.performanceScore}/100</strong></div>
    </div>
    <div class="summary-box">
      <p style="margin:0 0 8px;font-weight:600;">${escapeHtml(rationale.headline)}</p>
      <ul style="margin:0 0 8px;">${bullets}</ul>
      <p style="margin:0;">${escapeHtml(rationale.guidance)}</p>
    </div>`;
}

export function generateExecutiveReportHtml(input: ReportInput): string {
  const { result } = input;
  const m = result.summaryMetrics;
  const risks = result.topRisks.map((r) => `<li>${escapeHtml(r)}</li>`).join("");

  const body = `
    ${renderGoNoGoSection(input)}

    <div class="kpi-row">
      <div class="kpi"><div class="label">Avg Response</div><div class="value">${m.avgResponseTimeSec.toFixed(1)}s</div></div>
      <div class="kpi"><div class="label">P95 Response</div><div class="value">${m.p95ResponseTimeSec.toFixed(1)}s</div></div>
      <div class="kpi"><div class="label">Error Rate</div><div class="value">${m.errorRatePct.toFixed(1)}%</div></div>
      <div class="kpi"><div class="label">Throughput</div><div class="value">${m.throughput.toFixed(1)}/s</div></div>
    </div>

    <h2>Executive Summary</h2>
    <div class="summary-box"><p style="margin:0;">${escapeHtml(result.executiveSummary)}</p></div>

    <h2>Top Risks</h2>
    <ul>${risks}</ul>

    <h2>Script-Level Executive Summary</h2>
    <p style="font-size:13px;color:#64748b;margin-top:0;">Per-script pass/fail, BlazeMeter # Samples, error codes, and failed transaction counts. Export to Library to track Bug ID and comments.</p>
    ${renderScriptExecutiveSummaryEmbed(input.scriptSummaries, { includeDetails: false })}

    <h2>Score Breakdown</h2>
    ${wrapTable(`<table>
      <colgroup>
        <col style="width:70%" />
        <col style="width:30%" />
      </colgroup>
      <thead><tr><th>Dimension</th><th>Score</th></tr></thead>
      <tbody>
        <tr><td>SLA Compliance</td><td>${result.scoreBreakdown.slaScore}</td></tr>
        <tr><td>Error Rate</td><td>${result.scoreBreakdown.errorScore}</td></tr>
        <tr><td>Throughput</td><td>${result.scoreBreakdown.throughputScore}</td></tr>
        <tr><td>Stability</td><td>${result.scoreBreakdown.stabilityScore}</td></tr>
        <tr><td>Baseline</td><td>${result.scoreBreakdown.baselineScore}</td></tr>
      </tbody>
    </table>`)}
  `;

  return reportShell(
    "Executive Report",
    "Performance summary for leadership and product owners",
    body,
    input
  );
}

export function generateTechnicalReportHtml(input: ReportInput): string {
  const { result } = input;
  const failedFindings = result.findings.filter((f) => f.status !== "pass");
  const txRows = result.transactions
    .slice(0, 30)
    .map((tx) => {
      const f = result.findings.find((x) => x.transaction === tx.name);
      return `<tr>
        <td>${escapeHtml(tx.name)}</td>
        <td>${tx.samples.toLocaleString()}</td>
        <td>${tx.avgRtSec.toFixed(2)}s</td>
        <td>${tx.p95Sec.toFixed(2)}s</td>
        <td>${tx.errorRatePct.toFixed(2)}%</td>
        <td>${tx.throughput.toFixed(1)}/s</td>
        <td class="col-status">${statusBadge(f?.status ?? "pass")}</td>
      </tr>`;
    })
    .join("");

  const rca = (result.rootCauseAnalysis ?? [])
    .map(
      (h) => `<div style="margin-bottom:16px;padding:14px;border:1px solid #e2e8f0;border-radius:8px;">
        <strong>${escapeHtml(h.title)}</strong>
        <span style="margin-left:8px;font-size:11px;color:#64748b;">(${escapeHtml(h.confidence)} confidence)</span>
        <p style="margin:8px 0 0;">${escapeHtml(h.summary)}</p>
      </div>`
    )
    .join("");

  const body = `
    <h2>Technical Findings</h2>
    ${failedFindings.length ? renderFindingsTable(failedFindings) : "<p>All evaluated transactions met SLA thresholds.</p>"}

    <h2>Aggregate Transaction Metrics</h2>
    ${wrapTable(`<table>
      <colgroup>
        <col style="width:28%" />
        <col style="width:10%" />
        <col style="width:11%" />
        <col style="width:11%" />
        <col style="width:11%" />
        <col style="width:13%" />
        <col style="width:16%" />
      </colgroup>
      <thead><tr><th>Transaction</th><th>Samples</th><th>Avg RT</th><th>P95</th><th>Error %</th><th>Throughput</th><th class="col-status">Status</th></tr></thead>
      <tbody>${txRows}</tbody>
    </table>`)}

    <h2>Script-Level Analysis</h2>
    <p style="font-size:13px;color:#64748b;margin-top:0;">Request Stats per label and failed transaction details for each script (BlazeMeter-aligned).</p>
    ${renderScriptExecutiveSummaryEmbed(input.scriptSummaries, {
      includeDetails: true,
      onlyFailedDetails: input.scriptSummaries.some((r) => r.result === "fail"),
    })}

    <h2>Error Analysis</h2>
    <div class="summary-box">
      <p style="margin:0 0 8px;"><strong>Interpretation:</strong> ${escapeHtml(result.errorAnalysis.aiInterpretation)}</p>
      <p style="margin:0;"><strong>Key insight:</strong> ${escapeHtml(result.errorAnalysis.keyInsight)}</p>
    </div>

    ${rca ? `<h2>Root Cause Hypotheses</h2>${rca}` : ""}
  `;

  return reportShell(
    "Technical Report",
    "Detailed performance findings for engineers",
    body,
    input
  );
}

export function generateActionItemsReportHtml(input: ReportInput): string {
  const { result } = input;
  const defects = result.defects ?? [];
  const failedScripts = input.scriptSummaries.filter((s) => s.result === "fail");

  const defectRows = defects
    .slice(0, 15)
    .map(
      (d) => `<tr>
        <td>${escapeHtml(d.title)}</td>
        <td>${escapeHtml(d.transaction)}</td>
        <td>${escapeHtml(d.severity)}</td>
        <td>${escapeHtml(d.suggestedAssignee)}</td>
      </tr>`
    )
    .join("");

  const body = `
    ${failedScripts.length > 0 ? `
      <h2>Failed Scripts (${failedScripts.length})</h2>
      ${renderScriptExecutiveSummaryEmbed(failedScripts, { includeDetails: false })}
      <div class="callout-box">
        <p style="margin:0;font-size:13px;">Use <strong>Export to Library</strong> on the analysis dashboard to assign Bug ID and comments per script before sharing with defect teams.</p>
      </div>
    ` : ""}

    <h2>Action Items (${result.actionItems.length})</h2>
    ${result.actionItems.length ? renderActionItemsTable(result.actionItems) : "<p>No action items were generated for this run.</p>"}

    ${defects.length ? `
      <h2>Suggested Defects (${defects.length})</h2>
      ${wrapTable(`<table>
        <colgroup>
          <col style="width:34%" />
          <col style="width:28%" />
          <col style="width:14%" />
          <col style="width:24%" />
        </colgroup>
        <thead><tr><th>Title</th><th>Transaction</th><th class="col-narrow">Severity</th><th>Assignee</th></tr></thead>
        <tbody>${defectRows}</tbody>
      </table>`)}
    ` : ""}

    <h2>Next Steps</h2>
    <ul>
      <li>Export failed scripts to Library and record Bug ID / comments for each script.</li>
      <li>Assign action items to owner teams and track to completion.</li>
      <li>Re-run load test after fixes to validate improvements.</li>
      <li>Compare against baseline before release sign-off.</li>
    </ul>
  `;

  return reportShell(
    "Action Items Report",
    "Trackable items for all teams",
    body,
    input
  );
}

export function generateScriptSummaryReportHtml(input: ReportInput): string {
  const context = buildScriptExecutiveSummaryPdfContext({
    runName: input.analysis.runName,
    externalId: input.analysis.externalId,
    masterId: input.analysis.masterId,
    testContext: input.analysis.testContext,
  });
  return generateScriptExecutiveSummaryPdfHtml(input.scriptSummaries, context);
}

export function generateResultsReportHtml(
  type: ResultsReportType,
  input: ReportInput
): string {
  switch (type) {
    case "executive":
      return generateExecutiveReportHtml(input);
    case "technical":
      return generateTechnicalReportHtml(input);
    case "action-items":
      return generateActionItemsReportHtml(input);
    case "script-summary":
      return generateScriptSummaryReportHtml(input);
  }
}

export function openResultsReportHtml(html: string, options?: { autoPrint?: boolean }) {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow pop-ups to open the report.");
    return false;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  if (options?.autoPrint) {
    setTimeout(() => win.print(), 600);
  }
  return true;
}

export function viewResultsReportHtml(html: string) {
  return openResultsReportHtml(html);
}

export function downloadResultsReportPdf(html: string) {
  return openResultsReportHtml(html, { autoPrint: true });
}
