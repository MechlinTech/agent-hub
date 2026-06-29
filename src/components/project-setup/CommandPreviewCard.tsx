"use client";

import type { PlanResult } from "@/lib/project-setup/types";

export function CommandPreviewCard({
  plan,
  executorReady = false,
}: {
  plan: PlanResult | null;
  executorReady?: boolean;
}) {
  if (!plan) {
    return (
      <div className="card h-fit p-5">
        <h3 className="font-semibold text-slate-900">Command preview</h3>
        <p className="mt-2 text-sm text-slate-500">
          {executorReady
            ? "Adjust your stack options to see planned install and scaffold commands."
            : "Connect the Local Executor to preview commands."}
        </p>
      </div>
    );
  }

  if (plan.commands.length === 0) {
    return (
      <div className="card h-fit p-5">
        <h3 className="font-semibold text-slate-900">Command preview</h3>
        <p className="mt-2 text-sm text-slate-500">
          No shell commands for this configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="card h-fit p-5">
      <h3 className="font-semibold text-slate-900">Command preview</h3>
      <ol className="mt-3 max-h-40 space-y-2 overflow-y-auto text-xs text-slate-600">
        {plan.commands.map((cmd, i) => (
          <li key={cmd.id}>
            <span className="font-medium text-slate-800">
              {i + 1}. {cmd.label}
            </span>
            <div className="font-mono text-slate-500">
              {cmd.exe} {cmd.args.join(" ")}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
