"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Terminal } from "lucide-react";
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
      const t = await fetchPairingToken({ version: status?.version });
      setToken(t);
      setSessionToken(t);
      setMessage(
        "Token generated. Pair the executor before closing this page.",
      );
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
    <div className="w-full space-y-5">
      {status ? <ExecutorStatusBanner status={status} /> : null}

      <div className="card space-y-4 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-slate-600" />
          <h2 className="section-card-title border-0 pb-0">Local Executor</h2>
        </div>
        {/* <p className="text-sm text-slate-600">
          Run AgentHub Desktop on the same machine as your browser. Projects are
          created locally - not on the AgentHub server.
        </p> */}
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
          <li>Start AgentHub Desktop application.</li>
          <li>
            Click the <strong>Open AgentHub to connect</strong> button in the
            desktop app to open the browser.
          </li>
        </ol>

        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-sm font-medium text-slate-800">AgentHub Desktop</p>
          {status === null ? (
            <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Checking for available builds…
            </p>
          ) : status.downloadAvailable ? (
            <>
              <p className="mt-1 text-sm text-slate-600">
                {status.latestVersion
                  ? `Latest build available: v${status.latestVersion}`
                  : "A desktop build is available for download."}
                {status.connected &&
                status.version &&
                status.updateAvailable
                  ? ` (you have v${status.version})`
                  : null}
              </p>
              <a
                href="/api/executor/download"
                className="btn-primary mt-3 inline-flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download AgentHub Desktop
              </a>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-500">
              No desktop build is available yet.
            </p>
          )}
        </div>
        {/* <p className="text-sm pl-10 text-slate-600">OR</p>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
          <li>Generate a pairing token below</li>
          <li>Click Pair executor</li>
          <li>Use Project Setup Agent from the wizard</li>
        </ol> */}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
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
        <div className="card p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Token (session only)
          </p>
          <p className="mt-2 break-all font-mono text-sm text-slate-800">
            {token}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Not stored in localStorage. Regenerating invalidates the previous
            token.
          </p>
        </div>
      ) : null}
    </div>
  );
}
