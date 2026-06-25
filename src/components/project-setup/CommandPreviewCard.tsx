"use client";

import type { PlanResult } from "@/lib/project-setup/types";

export function CommandPreviewCard({ plan }: { plan: PlanResult | null }) {
  if (!plan) return null;

  return (
    <div className="card h-fit p-5">
      <h3 className="font-semibold text-slate-900">Command preview</h3>
      <ol className="mt-3 max-h-40 overflow-y-auto space-y-2 text-xs text-slate-600">
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
