"use client";

import Link from "next/link";
import { Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExecutorStatus } from "@/lib/execution-client";

function StatusPulseDot({ tone }: { tone: "success" | "error" | "warning" }) {
  const toneClass = {
    success: "bg-emerald-500",
    error: "bg-red-500",
    warning: "bg-amber-500",
  }[tone];

  return (
    <span
      className="relative flex h-2.5 w-2.5 shrink-0"
      aria-hidden
    >
      <span
        className={cn(
          "absolute inline-flex h-full w-full animate-ping rounded-full opacity-70",
          toneClass,
        )}
      />
      <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", toneClass)} />
    </span>
  );
}

export function ExecutorStatusBanner({
  status,
  className,
}: {
  status: ExecutorStatus;
  className?: string;
}) {
  if (status.connected && status.paired && !status.updateAvailable) {
    return (
      <div
        className={cn(
          "mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-2.5 text-sm text-emerald-800",
          className,
        )}
        role="status"
      >
        <StatusPulseDot tone="success" />
        <span>
          Local Executor connected
          {status.version ? ` (v${status.version})` : ""}
        </span>
      </div>
    );
  }

  const failed = !status.connected;
  const tone = failed ? "error" : "warning";

  return (
    <div
      className={cn(
        "mb-4 rounded-xl border px-4 py-3 text-sm",
        failed
          ? "border-red-200/80 bg-red-50/90 text-red-800"
          : "border-amber-200/80 bg-amber-50/90 text-amber-900",
        className,
      )}
      role="status"
    >
      <div className="flex items-start gap-2.5">
        <StatusPulseDot tone={tone} />
        <div className="min-w-0 space-y-2">
          {failed && (
            <p>
              Local Executor is not running. Start it with{" "}
              <code
                className={cn(
                  "rounded px-1",
                  failed ? "bg-red-100/80" : "bg-amber-100",
                )}
              >
                npm run executor
              </code>
              .
            </p>
          )}
          {status.connected && !status.paired && (
            <p>Executor is running but not paired. Generate a token and pair in Settings.</p>
          )}
          {status.updateAvailable && (
            <p>Executor update available — restart after pulling latest code.</p>
          )}
          <Link
            href="/settings/local-executor"
            className={cn(
              "inline-flex items-center gap-1 font-medium underline",
              failed ? "text-red-950" : "text-amber-950",
            )}
          >
            <Terminal className="h-3.5 w-3.5" />
            Local Executor settings
          </Link>
        </div>
      </div>
    </div>
  );
}
