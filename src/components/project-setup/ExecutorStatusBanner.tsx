"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExecutorStatus } from "@/lib/execution-client";

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
          "mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800",
          className
        )}
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Local Executor connected
        {status.version ? ` (v${status.version})` : ""}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-2">
          {!status.connected && (
            <p>
              Local Executor is not running. Start it with{" "}
              <code className="rounded bg-amber-100 px-1">npm run executor</code>.
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
            className="inline-flex items-center gap-1 font-medium text-amber-950 underline"
          >
            <Terminal className="h-3.5 w-3.5" />
            Local Executor settings
          </Link>
        </div>
      </div>
    </div>
  );
}
