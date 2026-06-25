"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LogEvent } from "@/lib/execution-client";

export function GenerationProgress({
  events,
  logLines,
  running,
}: {
  events: LogEvent[];
  logLines: string[];
  running: boolean;
}) {
  const steps = events.filter(
    (e) => e.type === "step_start" || e.type === "step_done" || e.type === "step_error"
  );
  const stepLabels = new Map<string, { label: string; done: boolean; error: boolean }>();

  for (const e of steps) {
    if (e.stepId && e.label) {
      const cur = stepLabels.get(e.stepId) ?? {
        label: e.label,
        done: false,
        error: false,
      };
      if (e.type === "step_done") cur.done = true;
      if (e.type === "step_error") cur.error = true;
      stepLabels.set(e.stepId, cur);
    }
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {Array.from(stepLabels.entries()).map(([id, step]) => (
          <li key={id} className="flex items-center gap-2 text-sm">
            {step.error ? (
              <Circle className="h-4 w-4 text-red-500" />
            ) : step.done ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : running ? (
              <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
            ) : (
              <Circle className="h-4 w-4 text-slate-300" />
            )}
            <span className={cn(step.done && "text-slate-600")}>{step.label}</span>
          </li>
        ))}
      </ul>
      <div className="card max-h-64 overflow-y-auto p-4 font-mono text-xs text-slate-600">
        {logLines.length === 0 ? (
          <p className="text-slate-400">{running ? "Waiting for output…" : "No logs yet."}</p>
        ) : (
          logLines.map((line, i) => <div key={i}>{line}</div>)
        )}
      </div>
    </div>
  );
}
