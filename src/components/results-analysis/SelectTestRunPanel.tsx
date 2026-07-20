"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Search, Zap } from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  fmtBandwidth,
  fmtCount,
  fmtPct,
  fmtRt,
  fmtThroughput,
} from "@/lib/results-analysis/display-metrics";

interface TestRunRow {
  id: number;
  name: string;
  created: number;
  ended: number | null;
  maxUsers: number | null;
  passed: boolean | null;
}

interface RunPreview {
  masterId: string;
  runName: string;
  durationMinutes: number;
  activeDurationMinutes?: number;
  maxUsers: number;
  avgResponseTimeSec: number;
  p90ResponseTimeSec?: number;
  p95ResponseTimeSec?: number;
  errorRatePct: number;
  errorsCount?: number;
  throughput: number;
  avgBandwidthKiBps?: number;
  totalSamples?: number;
  passed: boolean | null;
  createdAt: string;
  endedAt: string | null;
}

export function SelectTestRunPanel({
  configured = true,
}: {
  configured?: boolean;
}) {
  const router = useRouter();
  const [runs, setRuns] = useState<TestRunRow[]>([]);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<RunPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [masterIdInput, setMasterIdInput] = useState("");

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      setRuns([]);
      setError(null);
      return;
    }

    fetch("/api/results-analysis/blazemeter/runs")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setRuns(data.runs ?? []);
        if (data.runs?.[0]) setSelectedId(String(data.runs[0].id));
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load runs"),
      )
      .finally(() => setLoading(false));
  }, [configured]);

  useEffect(() => {
    if (!selectedId) {
      setPreview(null);
      return;
    }
    setPreviewLoading(true);
    fetch(`/api/results-analysis/blazemeter/runs/${selectedId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPreview(data.preview);
      })
      .catch(() => setPreview(null))
      .finally(() => setPreviewLoading(false));
  }, [selectedId]);

  async function analyzeMasterId(masterId: string) {
    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/results-analysis/blazemeter/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      router.push(`/agents/results-analysis/${data.analysisId}/analyzing`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
      setImporting(false);
    }
  }

  if (!configured) {
    return (
      <div className="card space-y-4 p-8 text-center">
        <p className="text-sm text-slate-600">
          Connect BlazeMeter under Integrations to browse and import test runs
          from your workspace project.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/integrations" className="btn-primary px-4 py-2 text-sm">
            Configure BlazeMeter
          </Link>
          <Link
            href="/agents/results-analysis/new"
            className="btn-secondary px-4 py-2 text-sm"
          >
            Upload CSV instead
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error && runs.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <Link
          href="/integrations"
          className="mt-3 inline-block text-sm text-brand-600 underline"
        >
          Configure BlazeMeter integration
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h3 className="mb-2 font-semibold text-slate-900">
          Fetch by Master ID
        </h3>
        <p className="mb-3 text-sm text-slate-500">
          Enter the Master ID from your BlazeMeter report URL to import results
          directly.
        </p>
        <div className="flex flex-wrap gap-3">
          <input
            className="input min-w-[280px] flex-1"
            placeholder="Enter Master ID (e.g., 12345678)"
            value={masterIdInput}
            onChange={(e) => setMasterIdInput(e.target.value)}
          />
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            disabled={!masterIdInput.trim() || importing}
            onClick={() => analyzeMasterId(masterIdInput.trim())}
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Fetch Result
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3 font-semibold text-slate-900">
            Available Test Runs
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Select</th>
                  <th className="px-4 py-3">Run Name</th>
                  <th className="px-4 py-3">Master ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Users</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <input
                        type="radio"
                        name="run"
                        checked={selectedId === String(run.id)}
                        onChange={() => setSelectedId(String(run.id))}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{run.name}</td>
                    <td className="px-4 py-3 text-slate-500">{run.id}</td>
                    <td className="px-4 py-3">
                      {formatDate(new Date(run.created * 1000).toISOString())}
                    </td>
                    <td className="px-4 py-3">{run.maxUsers ?? "-"}</td>
                    <td className="px-4 py-3">
                      {run.passed === true
                        ? "Completed"
                        : run.passed === false
                          ? "Completed with Issues"
                          : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 font-semibold text-slate-900">Run Preview</h3>
          {previewLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          ) : preview ? (
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-slate-500">Run Name</div>
                <div className="font-medium">{preview.runName}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Master ID</div>
                <div>{preview.masterId}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Started" value={formatDate(preview.createdAt)} />
                <Metric
                  label="Ended"
                  value={preview.endedAt ? formatDate(preview.endedAt) : "-"}
                />
                <Metric
                  label="Duration"
                  value={`${preview.activeDurationMinutes ?? preview.durationMinutes} min`}
                />
                <Metric label="Users" value={String(preview.maxUsers)} />
                <Metric
                  label="Avg Response Time"
                  value={fmtRt(preview.avgResponseTimeSec)}
                />
                {preview.p90ResponseTimeSec != null && (
                  <Metric
                    label="P90 Response Time"
                    value={fmtRt(preview.p90ResponseTimeSec)}
                  />
                )}
                {preview.p95ResponseTimeSec != null && (
                  <Metric
                    label="P95 Response Time"
                    value={fmtRt(preview.p95ResponseTimeSec)}
                  />
                )}
                <Metric
                  label="Error Rate"
                  value={fmtPct(preview.errorRatePct)}
                />
                {preview.errorsCount != null && (
                  <Metric
                    label="Error Count"
                    value={fmtCount(preview.errorsCount)}
                  />
                )}
                <Metric
                  label="Throughput"
                  value={fmtThroughput(preview.throughput)}
                />
                {preview.avgBandwidthKiBps != null && (
                  <Metric
                    label="Bandwidth"
                    value={fmtBandwidth(preview.avgBandwidthKiBps)}
                  />
                )}
                {preview.totalSamples != null && (
                  <Metric
                    label="Samples"
                    value={fmtCount(preview.totalSamples)}
                  />
                )}
                <Metric
                  label="Status"
                  value={
                    preview.passed === true
                      ? "Passed"
                      : preview.passed === false
                        ? "Issues"
                        : "-"
                  }
                />
              </div>
              <button
                type="button"
                className="btn-primary mt-4 inline-flex w-full items-center justify-center gap-2"
                disabled={importing}
                onClick={() => analyzeMasterId(preview.masterId)}
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Analyze This Run
              </button>
              <p className="text-xs text-slate-500">
                This run will be used to generate insights, identifications, and
                recommendations.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Select a run to preview metrics.
            </p>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
