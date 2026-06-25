"use client";

import { useEffect, useState } from "react";
import { Loader2, Terminal } from "lucide-react";
import { SettingsShell } from "@/components/settings/SettingsShell";
import {
  checkExecutorHealth,
  fetchPairingToken,
  pairExecutor,
  type ExecutorStatus,
} from "@/lib/execution-client";
import { useExecutorSessionStore } from "@/stores/executor-session-store";
import { ExecutorStatusBanner } from "@/components/project-setup/ExecutorStatusBanner";

export default function LocalExecutorSettingsPage() {
  const [status, setStatus] = useState<ExecutorStatus | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const setSessionToken = useExecutorSessionStore((s) => s.setToken);

  async function refresh() {
    setStatus(await checkExecutorHealth());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function generateToken() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const t = await fetchPairingToken();
      setToken(t);
      setSessionToken(t);
      setMessage("Token generated. Pair the executor before closing this page.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handlePair() {
    if (!token) {
      setError("Generate a token first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await pairExecutor(token);
      setMessage("Executor paired successfully.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pairing failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SettingsShell>
      <div className="max-w-2xl space-y-6">
        {status ? <ExecutorStatusBanner status={status} /> : null}

        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">Local Executor</h2>
          </div>
          <p className="text-sm text-slate-600">
            Run <code className="rounded bg-slate-100 px-1">npm run executor</code> on the same
            machine as your browser. Projects are created locally — not on the AgentHub server.
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
            <li>Start the executor: <code>npm run executor</code></li>
            <li>Generate a pairing token below</li>
            <li>Click Pair executor</li>
            <li>Use Project Setup Agent from the wizard</li>
          </ol>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            disabled={loading}
            onClick={generateToken}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Generate pairing token
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={loading || !token}
            onClick={handlePair}
          >
            Pair executor
          </button>
        </div>

        {token ? (
          <div className="card p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Token (session only)</p>
            <p className="mt-2 break-all font-mono text-sm text-slate-800">{token}</p>
            <p className="mt-2 text-xs text-slate-500">
              Not stored in localStorage. Regenerating invalidates the previous token.
            </p>
          </div>
        ) : null}
      </div>
    </SettingsShell>
  );
}
