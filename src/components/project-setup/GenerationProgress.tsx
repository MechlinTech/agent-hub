"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle, Loader2, Sparkles, Terminal } from "lucide-react";
import { cn, sanitizeTerminalLine } from "@/lib/utils";
import { pickWhimsicalStatus } from "@/lib/project-setup/whimsical-status";
import type { LogEvent } from "@/lib/execution-client";

const WHIMSICAL_INTERVAL_MS = 2800;

export function GenerationProgress({
  events,
  logLines,
  running,
}: {
  events: LogEvent[];
  logLines: string[];
  running: boolean;
}) {
  const logRef = useRef<HTMLDivElement>(null);
  const [whimsicalIndex, setWhimsicalIndex] = useState(0);
  const steps = events.filter(
    (e) => e.type === "step_start" || e.type === "step_done" || e.type === "step_error",
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

  const activeStep = Array.from(stepLabels.values()).find((s) => !s.done && !s.error);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setWhimsicalIndex((i) => i + 1);
    }, WHIMSICAL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logLines.length]);

  const whimsicalLine = pickWhimsicalStatus(whimsicalIndex);

  return (
    <div className="min-w-0 space-y-4">
      {running ? (
        <div className="rounded-xl border border-brand-100 bg-gradient-to-r from-brand-50/80 to-violet-50/60 px-4 py-3">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 animate-pulse text-brand-500" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-slate-800 transition-opacity duration-300">
                {whimsicalLine}
              </p>
              {activeStep ? (
                <p className="text-xs text-slate-500">
                  Current step: {activeStep.label}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {stepLabels.size > 0 ? (
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
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2">
          <Terminal className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">Terminal output</span>
          {running ? (
            <Loader2 className="ml-auto h-3 w-3 animate-spin text-brand-500" />
          ) : null}
        </div>
        <div
          ref={logRef}
          className="max-h-72 overflow-auto overscroll-contain bg-slate-50/40 p-4 font-mono text-[11px] leading-5 text-slate-700"
        >
          {logLines.length === 0 ? (
            <p className="text-slate-400">
              {running ? "Waiting for output…" : "No logs yet."}
            </p>
          ) : (
            logLines.map((line, i) => {
              const text = sanitizeTerminalLine(line);
              if (!text) return null;
              const isError =
                /\b(error|failed|ENOENT|could not be resolved)\b/i.test(text);
              return (
                <div
                  key={i}
                  className={cn(
                    "whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
                    isError && "text-red-600",
                  )}
                >
                  {text}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
