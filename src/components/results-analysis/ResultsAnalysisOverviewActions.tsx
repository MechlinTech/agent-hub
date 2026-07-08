"use client";

import Link from "next/link";
import { History, Plus, SlidersHorizontal } from "lucide-react";
import { PermissionLink } from "@/components/permissions/PermissionLink";

export function ResultsAnalysisOverviewActions({
  blazemeterConfigured,
}: {
  blazemeterConfigured: boolean;
}) {
  const analyzeHref = blazemeterConfigured
    ? "/agents/results-analysis/select-run"
    : "/agents/results-analysis/new";

  return (
    <div className="mb-8 grid gap-4 md:grid-cols-3">
      <PermissionLink
        href={analyzeHref}
        resource="results_analysis"
        requireWrite
        className="card block p-5 transition-shadow hover:shadow-md"
      >
        <Plus className="mb-3 h-6 w-6 text-brand-600" />
        <h3 className="font-semibold text-slate-900">Analyze New Result</h3>
        <p className="mt-1 text-sm text-slate-500">
          {blazemeterConfigured
            ? "Connect to BlazeMeter and import a test run, or upload CSV exports."
            : "Upload BlazeMeter CSV exports to generate analysis."}
        </p>
      </PermissionLink>
      <Link
        href="/agents/results-analysis/history"
        className="card block p-5 transition-shadow hover:shadow-md"
      >
        <History className="mb-3 h-6 w-6 text-brand-600" />
        <h3 className="font-semibold text-slate-900">View Previous Analysis</h3>
        <p className="mt-1 text-sm text-slate-500">
          Browse and compare previously generated analyses.
        </p>
      </Link>
      <PermissionLink
        href="/agents/results-analysis/sla"
        resource="results_analysis"
        requireWrite
        className="card block p-5 transition-shadow hover:shadow-md"
      >
        <SlidersHorizontal className="mb-3 h-6 w-6 text-brand-600" />
        <h3 className="font-semibold text-slate-900">Configure SLA</h3>
        <p className="mt-1 text-sm text-slate-500">
          Define performance thresholds and SLA criteria for analysis.
        </p>
      </PermissionLink>
    </div>
  );
}

export function ResultsAnalysisNewLink({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <PermissionLink
      href="/agents/results-analysis/new"
      resource="results_analysis"
      requireWrite
      className={className}
    >
      {children}
    </PermissionLink>
  );
}
