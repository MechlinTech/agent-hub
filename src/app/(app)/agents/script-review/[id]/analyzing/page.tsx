"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { createClient } from "@/lib/supabase/client";
import { runReviewAnalysis } from "@/lib/review-service";
import { ANALYSIS_STEPS } from "@/lib/jmx/review-runner";
import type { ReviewConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

function AnalyzingContent() {
  const router = useRouter();
  const params = useParams();
  const reviewId = params.id as string;
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>(ANALYSIS_STEPS[0].label);
  const [fileName, setFileName] = useState("script.jmx");
  const [aiMode, setAiMode] = useState("disabled");
  const [logs, setLogs] = useState<string[]>([]);
  const [liveFindings, setLiveFindings] = useState<
    { severity: string; issue: string; finding_code: string | null }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const supabase = createClient();
    const poll = setInterval(async () => {
      const { data: review } = await supabase
        .from("script_reviews")
        .select("progress_percent, current_step")
        .eq("id", reviewId)
        .single();
      if (review) {
        setProgress(review.progress_percent ?? 0);
        if (review.current_step) setCurrentStep(review.current_step);
      }

      const { data: logsData } = await supabase
        .from("review_activity_logs")
        .select("message")
        .eq("script_review_id", reviewId)
        .order("created_at", { ascending: true });
      if (logsData?.length) setLogs(logsData.map((l) => l.message));

      const { data: findingsData } = await supabase
        .from("review_findings")
        .select("severity, issue, finding_code")
        .eq("script_review_id", reviewId)
        .order("created_at", { ascending: true });
      if (findingsData?.length) setLiveFindings(findingsData);
    }, 1500);
    return () => clearInterval(poll);
  }, [reviewId, running]);

  useEffect(() => {
    async function run() {
      const supabase = createClient();
      const { data: review } = await supabase
        .from("script_reviews")
        .select("script_name, config, storage_path, status")
        .eq("id", reviewId)
        .single();

      if (!review) {
        setError("Review not found.");
        return;
      }

      setFileName(review.script_name);

      if (review.status === "completed") {
        router.replace(`/agents/script-review/${reviewId}/results`);
        return;
      }

      const config = review.config as ReviewConfig;
      setAiMode(config.aiRecommendationMode ?? "disabled");
      let xml = sessionStorage.getItem(`review-xml-${reviewId}`);

      if (!xml && review.storage_path) {
        const { data: blob, error: dlError } = await supabase.storage
          .from("script-assets")
          .download(review.storage_path);
        if (dlError || !blob) {
          setError("Could not load JMX from storage.");
          return;
        }
        xml = await blob.text();
      }

      if (!xml) {
        setError("JMX content unavailable. Start a new review.");
        return;
      }

      try {
        await runReviewAnalysis(reviewId, xml, review.script_name, config, (step, percent, log) => {
          setCurrentStep(step);
          setProgress(percent);
          if (log) setLogs((l) => [...l, log]);
        });
        sessionStorage.removeItem(`review-xml-${reviewId}`);
        router.replace(`/agents/script-review/${reviewId}/results`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Analysis failed");
      } finally {
        setRunning(false);
      }
    }
    run();
  }, [reviewId, router]);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Script Review Agent", href: "/agents/script-review" },
          { label: "Review In Progress" },
        ]}
      />
      <h1 className="text-2xl font-bold text-slate-900">Analyzing Script</h1>
      <p className="mt-1 text-slate-500">
        Evaluating JMX for best practices, risks, and reliability (rule engine v1).
      </p>

      {error ? (
        <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-800">
          {error}
          <Link href="/agents/script-review/new" className="ml-2 underline">
            Try again
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="card flex items-center gap-6 p-6 lg:col-span-2">
              <div className="relative flex h-28 w-28 items-center justify-center">
                <svg className="h-28 w-28 -rotate-90">
                  <circle cx="56" cy="56" r="50" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                  <circle
                    cx="56"
                    cy="56"
                    r="50"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="8"
                    strokeDasharray={`${progress * 3.14} 314`}
                  />
                </svg>
                <span className="absolute text-xl font-bold">{progress}%</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{fileName}</p>
                <p className="text-sm text-slate-500">Step: {currentStep}</p>
                <p className="mt-2 text-xs text-amber-700">
                  AI Explanation Layer:{" "}
                  {aiMode === "enabled" ? "Running (AI provider)" : "Skipped (disabled)"}
                </p>
              </div>
            </div>
            <div className="card p-4 text-sm">
              <p className="font-medium">Review ID</p>
              <p className="font-mono text-xs text-slate-500">{reviewId.slice(0, 8)}…</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {ANALYSIS_STEPS.map((step, i) => {
              const done = progress >= ((i + 1) / ANALYSIS_STEPS.length) * 100;
              const active = currentStep === step.label;
              const skipped = step.ai && aiMode === "disabled";
              return (
                <div
                  key={step.id}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-xs",
                    done && !skipped && "border-green-200 bg-green-50 text-green-800",
                    active && "border-brand-300 bg-brand-50 text-brand-800",
                    skipped && "border-slate-200 bg-slate-100 text-slate-400 line-through",
                    !done && !active && !skipped && "border-slate-200 text-slate-500"
                  )}
                >
                  {step.label}
                  {skipped && " (disabled)"}
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="card p-4">
              <h3 className="mb-3 font-semibold">Live Findings</h3>
              <ul className="space-y-2 text-sm">
                {liveFindings.map((f) => (
                  <li key={f.finding_code ?? f.issue} className="rounded border border-slate-100 px-3 py-2">
                    <span className="font-medium capitalize">{f.severity}:</span> {f.issue}
                  </li>
                ))}
                {!liveFindings.length && <li className="text-slate-400">Scanning rules...</li>}
              </ul>
            </div>
            <div className="card p-4">
              <h3 className="mb-3 font-semibold">Activity Log</h3>
              <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-slate-600">
                {logs.map((l, i) => (
                  <li key={i}>• {l}</li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AnalyzingPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Starting analysis...</p>}>
      <AnalyzingContent />
    </Suspense>
  );
}
