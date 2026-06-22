"use client";

import { Target } from "lucide-react";
import { buildGoNoGoRationale } from "@/lib/results-analysis/go-no-go-summary";
import type { AnalysisResultPayload, ScriptSummaryRow } from "@/lib/results-analysis/types";
import { cn } from "@/lib/utils";

export function GoNoGoRecommendationCard({
  result,
  scriptSummaries,
}: {
  result: AnalysisResultPayload;
  scriptSummaries: ScriptSummaryRow[];
}) {
  const { headline, bullets, guidance } = buildGoNoGoRationale(result, scriptSummaries);

  const goColor =
    result.goNoGo === "go"
      ? "bg-green-600"
      : result.goNoGo === "conditional_go"
        ? "bg-amber-500"
        : "bg-red-600";

  return (
    <>
      <div className={cn("mb-4 rounded-lg px-4 py-6 text-center text-xl font-bold text-white", goColor)}>
        {result.goNoGo.replace("_", " ").toUpperCase()}
      </div>
      <p className="text-sm font-medium text-slate-900">{headline}</p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">{guidance}</p>
    </>
  );
}

export function GoNoGoRecommendationCardHeader() {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Target className="h-4 w-4 text-slate-600" />
      <h3 className="font-semibold text-slate-900">Go / No-Go Recommendation</h3>
    </div>
  );
}
