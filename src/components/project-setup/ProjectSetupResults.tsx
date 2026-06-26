"use client";

import type { ProjectSetupResult } from "@/lib/project-setup/types";

export function ProjectSetupResults({ result }: { result: ProjectSetupResult }) {
  return (
    <div className="card space-y-4 p-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">
          {result.success ? "Project created" : "Setup failed"}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {result.location} · {result.duration}
        </p>
      </div>
      <div>
        <h4 className="text-sm font-medium text-slate-800">Generated files</h4>
        <ul className="mt-2 max-h-32 overflow-y-auto font-mono text-xs text-slate-600">
          {result.generatedFiles.slice(0, 20).map((f, i) => (
            <li key={`${f}-${i}`}>{f}</li>
          ))}
          {result.generatedFiles.length > 20 ? (
            <li>…and {result.generatedFiles.length - 20} more</li>
          ) : null}
        </ul>
      </div>
      <div>
        <h4 className="text-sm font-medium text-slate-800">Commands run</h4>
        <ul className="mt-2 max-h-32 overflow-y-auto font-mono text-xs text-slate-600">
          {result.executedCommands.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
