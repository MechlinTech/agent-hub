"use client";

import Link from "next/link";
import { Sparkles, Settings } from "lucide-react";
import type { AnalysisResultPayload } from "@/lib/results-analysis/types";

export function AiExecutiveSummaryCard({
  result,
  aiEnabled,
  aiConfigured,
  analysisId,
}: {
  result: AnalysisResultPayload;
  aiEnabled: boolean;
  aiConfigured: boolean;
  analysisId?: string;
}) {
  if (!aiEnabled) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Sparkles className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-slate-900">AI insights are turned off</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Enable AI recommendations in Settings to generate an executive summary, error
          interpretation, and actionable insight for this run.
        </p>
        <Link
          href="/settings"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Settings className="h-4 w-4" />
          Enable AI in Settings
        </Link>
      </div>
    );
  }

  if (!aiConfigured) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-900">
        <p className="font-medium">AI is enabled but no provider is configured</p>
        <p className="mt-1 text-amber-800">
          Add an API key in <code className="rounded bg-amber-100 px-1">.env.local</code> and restart
          the server, then re-run this analysis.
        </p>
        <Link href="/settings" className="mt-3 inline-block font-medium text-brand-700 hover:underline">
          Open Settings
        </Link>
      </div>
    );
  }

  if (!result.aiEnhanced) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
        <p className="font-medium text-slate-900">No AI summary for this analysis</p>
        <p className="mt-1">
          This run was analyzed before AI was enabled. Re-run the analysis to generate AI insights.
        </p>
        <Link
          href={
            analysisId
              ? `/agents/results-analysis/${analysisId}/analyzing`
              : "/agents/results-analysis"
          }
          className="mt-3 inline-block font-medium text-brand-600 hover:underline"
        >
          Re-run analysis for AI insights
        </Link>
      </div>
    );
  }

  const { errorAnalysis } = result;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-brand-100 bg-brand-50/40 px-4 py-3">
        <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
          Executive summary
        </h4>
        <p className="text-sm leading-relaxed text-slate-700">{result.executiveSummary}</p>
      </div>

      {errorAnalysis.aiInterpretation ? (
        <div>
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Error patterns
          </h4>
          <p className="text-sm leading-relaxed text-slate-600">{errorAnalysis.aiInterpretation}</p>
        </div>
      ) : null}

      {errorAnalysis.keyInsight ? (
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Key insight
          </h4>
          <p className="text-sm font-medium leading-relaxed text-slate-800">
            {errorAnalysis.keyInsight}
          </p>
        </div>
      ) : null}
    </div>
  );
}
