import { downloadResultsReportPdf } from "./report-generator";
import type { ScriptSummaryRow } from "./types";

export {
  buildLibraryExportContext,
  buildScriptExecutiveSummaryPdfContext,
  generateScriptExecutiveSummaryPdfHtml,
  renderScriptExecutiveSummaryEmbed,
  type ScriptExecutiveSummaryHtmlOptions,
  type ScriptExecutiveSummaryPdfContext,
} from "./script-executive-summary-html";

import {
  generateScriptExecutiveSummaryPdfHtml,
  type ScriptExecutiveSummaryPdfContext,
} from "./script-executive-summary-html";

export function exportScriptExecutiveSummaryPdf(
  rows: ScriptSummaryRow[],
  context: ScriptExecutiveSummaryPdfContext = {}
): boolean {
  const html = generateScriptExecutiveSummaryPdfHtml(rows, context);
  return downloadResultsReportPdf(html);
}
