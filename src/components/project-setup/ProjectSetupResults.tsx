"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Copy,
  FileCode2,
  FolderOpen,
  Terminal,
  XCircle,
} from "lucide-react";
import type { ProjectSetupConfig, ProjectSetupResult } from "@/lib/project-setup/types";
import { frontendStackLabel } from "@/lib/project-setup/templates/shared";
import {
  beginNewProjectSetup,
  PROJECT_SETUP_NEW_PATH,
} from "@/stores/project-setup-store";
import { cn } from "@/lib/utils";

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="text-sm font-medium text-slate-800 sm:text-right">{value}</dd>
    </div>
  );
}

export function ProjectSetupResults({
  result,
  config,
}: {
  result: ProjectSetupResult;
  config: ProjectSetupConfig;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLocation() {
    try {
      await navigator.clipboard.writeText(result.location);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  const backendLabel =
    config.backendFramework === "express"
      ? "Express.js"
      : config.backendFramework === "nestjs"
        ? "NestJS"
        : config.backendFramework;

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "overflow-hidden rounded-2xl border shadow-sm",
          result.success
            ? "border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-white"
            : "border-red-200/80 bg-gradient-to-br from-red-50/90 via-white to-white",
        )}
      >
        <div className="flex flex-wrap items-start gap-4 p-6 sm:p-7">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
              result.success ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600",
            )}
          >
            {result.success ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <XCircle className="h-6 w-6" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold text-slate-900">
              {result.success ? "Project created" : "Setup failed"}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {result.success
                ? `${result.projectName} is ready on your machine.`
                : "Review the logs below and try again."}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/80 bg-white/70 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" />
                  Duration
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-900">{result.duration}</p>
              </div>
              <div className="rounded-xl border border-white/80 bg-white/70 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <FileCode2 className="h-3.5 w-3.5" />
                  Files
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {result.generatedFiles.length}
                </p>
              </div>
              <div className="rounded-xl border border-white/80 bg-white/70 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <Terminal className="h-3.5 w-3.5" />
                  Commands
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {result.executedCommands.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100/80 bg-white/50 px-6 py-4 sm:px-7">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5">
              <FolderOpen className="h-4 w-4 shrink-0 text-slate-400" />
              <code className="min-w-0 truncate text-xs text-slate-700">{result.location}</code>
            </div>
            <button
              type="button"
              onClick={copyLocation}
              className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-xs"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied" : "Copy path"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card overflow-hidden p-0">
          <div className="border-b border-slate-100 px-5 py-4">
            <h4 className="font-semibold text-slate-900">Generated files</h4>
            <p className="mt-0.5 text-xs text-slate-500">
              {result.generatedFiles.length} paths written during setup
            </p>
          </div>
          <ul className="max-h-64 overflow-y-auto px-5 py-3 font-mono text-xs leading-6 text-slate-600">
            {result.generatedFiles.slice(0, 40).map((file, index) => (
              <li key={`${file}-${index}`} className="truncate">
                {file}
              </li>
            ))}
            {result.generatedFiles.length > 40 ? (
              <li className="pt-2 text-slate-400">
                …and {result.generatedFiles.length - 40} more
              </li>
            ) : null}
          </ul>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="border-b border-slate-100 px-5 py-4">
            <h4 className="font-semibold text-slate-900">Commands run</h4>
            <p className="mt-0.5 text-xs text-slate-500">
              Install and scaffold steps executed locally
            </p>
          </div>
          <ul className="max-h-64 overflow-y-auto px-5 py-3 font-mono text-xs leading-6 text-slate-600">
            {result.executedCommands.length === 0 ? (
              <li className="text-slate-400">No shell commands were required.</li>
            ) : (
              result.executedCommands.map((command) => (
                <li key={command} className="break-all">
                  {command}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <h4 className="font-semibold text-slate-900">Stack summary</h4>
        <dl className="mt-4 space-y-3">
          <SummaryRow
            label="Scope"
            value={config.projectScope.replace(/_/g, " ")}
          />
          {config.projectScope !== "frontend_only" ? (
            <SummaryRow label="Backend" value={`${backendLabel} + ${config.database}`} />
          ) : null}
          {config.projectScope !== "backend_only" ? (
            <SummaryRow
              label="Frontend"
              value={frontendStackLabel(config)}
            />
          ) : null}
          {config.swagger ? <SummaryRow label="API docs" value="Swagger at /api-docs" /> : null}
        </dl>

        {result.success ? (
          <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-slate-700">
            <p className="font-medium text-slate-900">Next steps</p>
            <p className="mt-1">
              Open the project folder, copy <code className="text-xs">.env.example</code> to{" "}
              <code className="text-xs">.env</code>, then run{" "}
              {config.frontendFramework === "flutter" ? (
                <>
                  <code className="text-xs">flutter pub get</code> and{" "}
                  <code className="text-xs">flutter run</code>
                </>
              ) : (
                <>
                  <code className="text-xs">npm install</code> and{" "}
                  <code className="text-xs">npm run dev</code>
                </>
              )}{" "}
              (or your stack&apos;s start script).
            </p>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={PROJECT_SETUP_NEW_PATH}
            onClick={beginNewProjectSetup}
            className="btn-primary px-4 py-2 text-sm"
          >
            Start another setup
          </Link>
          <Link href="/agents/project-setup" className="btn-secondary px-4 py-2 text-sm">
            Back to overview
          </Link>
        </div>
      </div>
    </div>
  );
}
