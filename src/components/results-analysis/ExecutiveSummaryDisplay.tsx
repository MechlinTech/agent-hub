"use client";

import { X } from "lucide-react";
import type {
  AnalysisResultPayload,
  ResultsAnalysisRecord,
  ScriptSummaryRow,
  TechnicalFinding,
} from "@/lib/results-analysis/types";
import {
  buildExecutiveIntro,
  buildExecutiveRecommendation,
  stripExecutiveTransactionWall,
} from "@/lib/results-analysis/executive-summary-text";
import { cn, pillBadge } from "@/lib/utils";

function groupAttentionByScript(
  scriptSummaries: ScriptSummaryRow[],
  findings: TechnicalFinding[]
) {
  const nonPass = findings.filter((f) => f.status !== "pass");
  const groups = scriptSummaries
    .filter((s) => s.result === "fail" || s.failedTransactions.length > 0)
    .map((s) => ({
      scriptName: s.scriptName,
      result: s.result,
      transactions: s.failedTransactions,
    }));

  const assigned = new Set(groups.flatMap((g) => g.transactions));
  const other = nonPass.filter((f) => !assigned.has(f.transaction));

  return { groups, other };
}

function ScriptGroupedAttentionList({
  scriptSummaries,
  findings,
  expanded = false,
}: {
  scriptSummaries: ScriptSummaryRow[];
  findings: TechnicalFinding[];
  expanded?: boolean;
}) {
  const { groups, other } = groupAttentionByScript(scriptSummaries, findings);

  if (groups.length === 0 && other.length === 0) return null;

  return (
    <div className={expanded ? "mt-4" : "mt-3"}>
      <h4
        className={cn(
          "font-semibold text-slate-900",
          expanded ? "mb-3 text-base" : "mb-2 text-sm"
        )}
      >
        Key transactions requiring attention
      </h4>
      <div
        className={cn(
          "space-y-2 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/80 p-3",
          expanded ? "max-h-[55vh]" : "max-h-56"
        )}
      >
        {groups.map((group) => (
          <div
            key={group.scriptName}
            className="rounded-lg border border-slate-100 bg-white px-3 py-2"
          >
            <div className="mb-1.5 flex min-w-0 items-center gap-2">
              <span
                className={pillBadge(
                  group.result === "pass"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-red-100 text-red-800 border-red-200"
                )}
              >
                {group.result === "pass" ? "Pass" : "Fail"}
              </span>
              <span
                className={cn(
                  "truncate font-semibold text-slate-800",
                  expanded ? "text-sm" : "text-xs"
                )}
                title={group.scriptName}
              >
                {group.scriptName}
              </span>
              <span className="ml-auto shrink-0 text-xs text-slate-500">
                {group.transactions.length > 0
                  ? `${group.transactions.length} txn${group.transactions.length === 1 ? "" : "s"}`
                  : "Failed iteration"}
              </span>
            </div>
            {group.transactions.length > 0 ? (
              <ul
                className={cn(
                  "list-disc space-y-1 pl-4 leading-relaxed text-slate-600",
                  expanded ? "text-sm" : "text-xs"
                )}
              >
                {group.transactions.map((tx, index) => (
                  <li key={`${tx}-${index}`} className="break-all">
                    {tx}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">
                Failed iteration with no transaction detail available.
              </p>
            )}
          </div>
        ))}

        {other.length > 0 && (
          <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
            <div className="mb-1.5 flex items-center gap-2">
              <span className={pillBadge("bg-amber-100 text-amber-800 border-amber-200")}>
                Other
              </span>
              <span
                className={cn("font-semibold text-slate-800", expanded ? "text-sm" : "text-xs")}
              >
                Unassigned transactions
              </span>
              <span className="ml-auto text-xs text-slate-500">
                {other.length} txn{other.length === 1 ? "" : "s"}
              </span>
            </div>
            <ul
              className={cn(
                "list-disc space-y-1 pl-4 leading-relaxed text-slate-600",
                expanded ? "text-sm" : "text-xs"
              )}
            >
              {other.map((finding) => (
                <li key={finding.transaction} className="break-all">
                  <span className="font-medium text-slate-700">{finding.transaction}</span>
                  <span className="capitalize text-slate-400"> ({finding.status})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function resolveIntroText(
  result: AnalysisResultPayload,
  analysis: ResultsAnalysisRecord,
  scriptSummaries: ScriptSummaryRow[],
  summaryText?: string | null
): string {
  const text = summaryText ?? result.executiveSummary;
  const structuredIntro = buildExecutiveIntro({
    runName: analysis.runName,
    context: analysis.testContext,
    score: result.performanceScore,
    scriptSummaries,
  });

  if (result.aiEnhanced && !text.includes("completed with a performance score of")) {
    return stripExecutiveTransactionWall(text).intro;
  }

  if (text.includes(" Key transactions requiring attention:")) {
    return stripExecutiveTransactionWall(text).intro;
  }

  return structuredIntro;
}

function useExecutiveSummaryContent(
  result: AnalysisResultPayload,
  analysis: ResultsAnalysisRecord,
  scriptSummaries: ScriptSummaryRow[],
  summaryText?: string | null
) {
  const intro = resolveIntroText(result, analysis, scriptSummaries, summaryText);
  const stored = summaryText ?? result.executiveSummary;
  const stripped = stripExecutiveTransactionWall(stored);
  const recommendation =
    stripped.recommendation || buildExecutiveRecommendation(result.goNoGo);
  return { intro, recommendation };
}

export function ExecutiveSummaryDisplay({
  result,
  analysis,
  scriptSummaries,
  summaryText,
  showRecommendation = true,
  variant = "detailed",
  onViewDetails,
}: {
  result: AnalysisResultPayload;
  analysis: ResultsAnalysisRecord;
  scriptSummaries: ScriptSummaryRow[];
  summaryText?: string | null;
  showRecommendation?: boolean;
  variant?: "compact" | "detailed";
  onViewDetails?: () => void;
}) {
  const { intro, recommendation } = useExecutiveSummaryContent(
    result,
    analysis,
    scriptSummaries,
    summaryText
  );

  if (variant === "compact") {
    return (
      <div>
        <p className="text-sm leading-relaxed text-slate-600">{intro}</p>
        {showRecommendation && (
          <p className="mt-2 text-sm text-slate-600">{recommendation}</p>
        )}
        {onViewDetails && (
          <button
            type="button"
            onClick={onViewDetails}
            className="mt-3 text-sm font-medium text-brand-600 hover:underline"
          >
            View details
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm leading-relaxed text-slate-600">{intro}</p>
      <ScriptGroupedAttentionList
        scriptSummaries={scriptSummaries}
        findings={result.findings}
      />
      {showRecommendation && (
        <p className="mt-3 text-sm text-slate-600">{recommendation}</p>
      )}
    </div>
  );
}

export function ExecutiveSummaryDetailModal({
  open,
  onClose,
  result,
  analysis,
  scriptSummaries,
  summaryText,
}: {
  open: boolean;
  onClose: () => void;
  result: AnalysisResultPayload;
  analysis: ResultsAnalysisRecord;
  scriptSummaries: ScriptSummaryRow[];
  summaryText?: string | null;
}) {
  const { intro, recommendation } = useExecutiveSummaryContent(
    result,
    analysis,
    scriptSummaries,
    summaryText
  );

  if (!open) return null;

  const goColor =
    result.goNoGo === "go"
      ? "bg-green-100 text-green-800 border-green-200"
      : result.goNoGo === "conditional_go"
        ? "bg-amber-100 text-amber-800 border-amber-200"
        : "bg-red-100 text-red-800 border-red-200";

  const failCount = scriptSummaries.filter((s) => s.result === "fail").length;
  const passCount = scriptSummaries.length - failCount;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="executive-detail-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="executive-detail-title" className="text-lg font-semibold text-slate-900">
              Executive Summary Details
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Full assessment, script failures, and release recommendation
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className={pillBadge(goColor)}>
              {result.goNoGo.replace("_", " ").toUpperCase()}
            </span>
            <span className="text-sm text-slate-600">
              Score {result.performanceScore}/100 · {result.overallStatus.toUpperCase()}
            </span>
            {scriptSummaries.length > 0 && (
              <span className="text-sm text-slate-500">
                {scriptSummaries.length} scripts · {passCount} pass · {failCount} fail
              </span>
            )}
          </div>

          <section className="mb-5">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Assessment</h3>
            <p className="text-sm leading-relaxed text-slate-600">{intro}</p>
            <p className="mt-3 text-sm text-slate-600">{recommendation}</p>
          </section>

          <ScriptGroupedAttentionList
            scriptSummaries={scriptSummaries}
            findings={result.findings}
            expanded
          />

          {result.topRisks.length > 0 && (
            <section className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Top risks</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
                {result.topRisks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
