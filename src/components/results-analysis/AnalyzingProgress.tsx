"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PermissionLink } from "@/components/permissions/PermissionLink";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ANALYSIS_STEPS } from "@/lib/results-analysis/defaults";
import type { ResultsAnalysisRecord } from "@/lib/results-analysis/types";
import { cn } from "@/lib/utils";

export function AnalyzingProgress() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const analysisId = params.id as string;
  const autoStart = searchParams.get("auto") !== "0";

  const [analysis, setAnalysis] = useState<ResultsAnalysisRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(autoStart);

  useEffect(() => {
    const poll = setInterval(async () => {
      const res = await fetch(`/api/results-analysis/${analysisId}`);
      const data = await res.json();
      if (data.analysis) setAnalysis(data.analysis);
    }, 1200);
    return () => clearInterval(poll);
  }, [analysisId]);

  useEffect(() => {
    if (!running) return;
    async function run() {
      try {
        const res = await fetch(`/api/results-analysis/${analysisId}/analyze`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Analysis failed");
        router.replace(`/agents/results-analysis/${analysisId}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Analysis failed");
        setRunning(false);
      }
    }
    run();
  }, [analysisId, router, running]);

  useEffect(() => {
    if (analysis?.status === "completed") {
      router.replace(`/agents/results-analysis/${analysisId}`);
    }
  }, [analysis, analysisId, router]);

  const progress = analysis?.progressPercent ?? 0;
  const currentStep = analysis?.currentStep ?? ANALYSIS_STEPS[0];
  const stepIndex = ANALYSIS_STEPS.findIndex((s) => s === currentStep);

  const earlyFinding = analysis?.resultPayload?.findings?.find((f) => f.status !== "pass");

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents", href: "/agents" },
          { label: "BlazeMeter Results Analysis", href: "/agents/results-analysis" },
          { label: "Analyzing" },
        ]}
      />

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analyzing BlazeMeter Result</h1>
          {analysis && (
            <p className="mt-1 text-sm text-slate-500">
              Run: {analysis.runName} | Environment: {analysis.testContext.environment} | Users:{" "}
              {analysis.testContext.targetUsers} | Duration: {analysis.testContext.durationMinutes} min
            </p>
          )}
        </div>
        <PermissionLink
          href="/agents/results-analysis/new"
          resource="results_analysis"
          requireWrite
          className="btn-secondary text-red-600"
        >
          Cancel Analysis
        </PermissionLink>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 card p-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{progress}% Complete</span>
            <span className="text-slate-500">Current step: {currentStep}</span>
          </div>
          <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="space-y-3">
            {ANALYSIS_STEPS.map((step, i) => {
              const done = i < stepIndex || analysis?.status === "completed";
              const active = i === stepIndex && analysis?.status === "analyzing";
              return (
                <div key={step} className="flex items-center gap-3 text-sm">
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : active ? (
                    <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-300" />
                  )}
                  <span className={cn(done ? "text-slate-700" : active ? "font-medium text-brand-700" : "text-slate-400")}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-xs text-slate-500">
            This may take a few minutes depending on the size of the result and data complexity.
          </p>
        </div>

        <div className="card p-6">
          <div className="mb-3 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-amber-600" />
            <h3 className="font-semibold text-slate-900">Early Finding</h3>
          </div>
          {earlyFinding ? (
            <>
              <p className="text-sm text-slate-700">{earlyFinding.finding}</p>
              <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-2xl font-bold text-red-600">
                P95 {earlyFinding.evidence.find((e) => e.startsWith("P95"))?.replace("P95 ", "")}
              </div>
              <p className="mt-3 text-sm text-slate-600">{earlyFinding.recommendation[0]}</p>
            </>
          ) : (
            <p className="text-sm text-slate-500">Analyzing metrics… early findings will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
}
