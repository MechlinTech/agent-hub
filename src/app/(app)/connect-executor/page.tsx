"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Terminal } from "lucide-react";
import {
  checkExecutorHealth,
  fetchPairingToken,
  pairExecutor,
} from "@/lib/execution-client";
import { useExecutorSessionStore } from "@/stores/executor-session-store";

export default function ConnectExecutorPage() {
  const [status, setStatus] = useState<
    "checking" | "pairing" | "done" | "error" | "no-executor"
  >("checking");
  const [error, setError] = useState<string | null>(null);
  const setSessionToken = useExecutorSessionStore((s) => s.setToken);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      const health = await checkExecutorHealth();
      if (cancelled) return;

      if (!health.connected) {
        setStatus("no-executor");
        return;
      }

      setStatus("pairing");
      try {
        const token = await fetchPairingToken({ version: health.version });
        await pairExecutor(token);
        setSessionToken(token);
        if (!cancelled) setStatus("done");
      } catch (e) {
        if (!cancelled) {
          setStatus("error");
          setError(e instanceof Error ? e.message : "Connection failed");
        }
      }
    }

    connect();
    return () => {
      cancelled = true;
    };
  }, [setSessionToken]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
        <Terminal className="h-7 w-7 text-brand-600" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Connect this computer</h1>
      <p className="mt-2 text-sm text-slate-500">
        Pairing AgentHub Desktop with your browser session.
      </p>

      <div className="mt-8 w-full rounded-2xl border border-slate-200 bg-white p-6">
        {status === "checking" || status === "pairing" ? (
          <div className="flex flex-col items-center gap-3 text-slate-600">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            <p className="text-sm">
              {status === "checking"
                ? "Looking for Local Executor…"
                : "Pairing…"}
            </p>
          </div>
        ) : null}

        {status === "done" ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-emerald-700">
              Connected! Your computer is ready for Dev Scaffold.
            </p>
            <Link href="/agents/project-setup/new" className="btn-primary inline-block">
              Start new Dev Scaffold
            </Link>
          </div>
        ) : null}

        {status === "no-executor" ? (
          <div className="space-y-3 text-left text-sm text-slate-600">
            <p className="font-medium text-slate-900">Local Executor not detected</p>
            <p>
              Install and open <strong>AgentHub Desktop</strong>, or run the executor
              manually, then refresh this page.
            </p>
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="space-y-3 text-left text-sm">
            <p className="font-medium text-red-700">{error ?? "Something went wrong"}</p>
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
