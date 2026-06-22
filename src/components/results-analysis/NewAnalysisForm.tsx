"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Upload,
} from "lucide-react";
import { BlazeMeterIcon } from "@/components/integrations/BlazeMeterIcon";
import { DEFAULT_TEST_CONTEXT } from "@/lib/results-analysis/defaults";
import type { TestContext } from "@/lib/results-analysis/types";
import { cn, formatBytes } from "@/lib/utils";

type FileSlot = "requestStats" | "errorStats" | "timeline" | "baseline" | "jtl";

const FILE_SLOTS: { key: FileSlot; label: string; required?: boolean }[] = [
  { key: "requestStats", label: "Request Stats CSV", required: true },
  { key: "errorStats", label: "Error Stats CSV" },
  { key: "timeline", label: "Timeline CSV" },
  { key: "baseline", label: "Baseline CSV" },
  { key: "jtl", label: "JTL File" },
];

export function NewAnalysisForm({ blazemeterConfigured }: { blazemeterConfigured: boolean }) {
  const router = useRouter();
  const [runName, setRunName] = useState("");
  const [context, setContext] = useState<TestContext>(DEFAULT_TEST_CONTEXT);
  const [files, setFiles] = useState<Partial<Record<FileSlot, File>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setFile(key: FileSlot, file: File | null) {
    setFiles((prev) => {
      const next = { ...prev };
      if (file) next[key] = file;
      else delete next[key];
      return next;
    });
  }

  async function handleSubmit(startAnalysis: boolean) {
    setError(null);
    if (!runName.trim()) {
      setError("Run name is required.");
      return;
    }
    if (!files.requestStats) {
      setError("Request Stats CSV is required.");
      return;
    }
    setLoading(true);
    try {
      const createRes = await fetch("/api/results-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runName: runName.trim(), testContext: context, inputMethod: "csv" }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || "Failed to create analysis");

      const form = new FormData();
      for (const slot of FILE_SLOTS) {
        const file = files[slot.key];
        if (file) form.append(slot.key, file);
      }

      const uploadRes = await fetch(`/api/results-analysis/${createData.analysisId}/upload`, {
        method: "POST",
        body: form,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      if (startAnalysis) {
        router.push(`/agents/results-analysis/${createData.analysisId}/analyzing`);
      } else {
        router.push(`/agents/results-analysis/${createData.analysisId}/analyzing?auto=0`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {!blazemeterConfigured && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            BlazeMeter API is not configured. CSV upload can still be used to analyze your results.{" "}
            <Link href="/integrations" className="font-medium underline">
              Configure integration
            </Link>
          </div>
        </div>
      )}

      {blazemeterConfigured && (
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <Link
            href="/agents/results-analysis/select-run"
            className="card block p-5 transition-shadow hover:shadow-md"
          >
            <h3 className="font-semibold text-slate-900">Connect with BlazeMeter API</h3>
            <p className="mt-1 text-sm text-slate-500">
              Recommended: select a test run or import by Master ID.
            </p>
          </Link>
          <Link href="/agents/results-analysis/new" className="card block p-5 transition-shadow hover:shadow-md">
            <h3 className="font-semibold text-slate-900">Upload BlazeMeter CSV</h3>
            <p className="mt-1 text-sm text-slate-500">Manual file upload for offline analysis.</p>
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                <BlazeMeterIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Upload BlazeMeter Result Files</h2>
                <p className="text-sm text-slate-500">
                  Upload BlazeMeter export files to analyze performance results.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {FILE_SLOTS.map((slot) => {
                const file = files[slot.key];
                return (
                  <label
                    key={slot.key}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-slate-200 px-4 py-3 hover:border-brand-300 hover:bg-brand-50/30"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        {slot.label}
                        {slot.required && <span className="text-red-500"> *</span>}
                      </div>
                      {file ? (
                        <div className="text-xs text-slate-500">
                          {file.name} ({formatBytes(file.size)})
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">Drop file here or click to browse</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {file ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Upload className="h-4 w-4 text-slate-400" />
                      )}
                      <input
                        type="file"
                        accept={slot.key === "jtl" ? ".jtl,.csv" : ".csv"}
                        className="hidden"
                        onChange={(e) => setFile(slot.key, e.target.files?.[0] ?? null)}
                      />
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Accepted formats: CSV, JTL | Maximum file size: 200 MB per file
            </p>
          </div>
        </div>

        <div className="card h-fit p-5">
          <h3 className="mb-4 font-semibold text-slate-900">Test Context</h3>
          <div className="space-y-3">
            <Field label="Run Name">
              <input
                className="input w-full"
                value={runName}
                onChange={(e) => setRunName(e.target.value)}
                placeholder="US GMR Load Test 1"
              />
            </Field>
            <Field label="Project Name">
              <input
                className="input w-full"
                value={context.projectName}
                onChange={(e) => setContext({ ...context, projectName: e.target.value })}
              />
            </Field>
            <Field label="Environment">
              <input
                className="input w-full"
                value={context.environment}
                onChange={(e) => setContext({ ...context, environment: e.target.value })}
              />
            </Field>
            <Field label="Build Version">
              <input
                className="input w-full"
                value={context.buildVersion}
                onChange={(e) => setContext({ ...context, buildVersion: e.target.value })}
              />
            </Field>
            <Field label="Target Users">
              <input
                type="number"
                className="input w-full"
                value={context.targetUsers}
                onChange={(e) =>
                  setContext({ ...context, targetUsers: Number(e.target.value) || 0 })
                }
              />
            </Field>
            <Field label="Duration (minutes)">
              <input
                type="number"
                className="input w-full"
                value={context.durationMinutes}
                onChange={(e) =>
                  setContext({ ...context, durationMinutes: Number(e.target.value) || 0 })
                }
              />
            </Field>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleSubmit(false)}
          className="btn-secondary"
        >
          Validate Files
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleSubmit(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
          Start Analysis
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
