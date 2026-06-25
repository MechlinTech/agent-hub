"use client";

import {
  EXECUTOR_BASE_URL,
  EXECUTOR_LATEST_VERSION,
} from "@/lib/project-setup/defaults";
import type { PlanResult, ProjectSetupConfig, ProjectSetupResult } from "@/lib/project-setup/types";

export interface ExecutorStatus {
  ok: boolean;
  connected: boolean;
  paired: boolean;
  version: string | null;
  updateAvailable: boolean;
}

export interface LogEvent {
  type: string;
  stepId?: string;
  label?: string;
  message?: string;
  stream?: string;
  success?: boolean;
  result?: ProjectSetupResult;
  error?: string | null;
}

export async function checkExecutorHealth(): Promise<ExecutorStatus> {
  try {
    const res = await fetch(`${EXECUTOR_BASE_URL}/health`, { method: "GET" });
    if (!res.ok) {
      return {
        ok: false,
        connected: false,
        paired: false,
        version: null,
        updateAvailable: false,
      };
    }
    const data = (await res.json()) as {
      ok: boolean;
      version?: string;
      paired?: boolean;
    };
    const version = data.version ?? null;
    const updateAvailable = version
      ? compareSemver(version, EXECUTOR_LATEST_VERSION) < 0
      : false;
    return {
      ok: data.ok,
      connected: true,
      paired: Boolean(data.paired),
      version,
      updateAvailable,
    };
  } catch {
    return {
      ok: false,
      connected: false,
      paired: false,
      version: null,
      updateAvailable: false,
    };
  }
}

export async function fetchPairingToken(): Promise<string> {
  const res = await fetch("/api/settings/executor-token", { method: "POST" });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Failed to fetch pairing token");
  }
  const data = (await res.json()) as { token: string };
  return data.token;
}

export async function pairExecutor(token: string): Promise<void> {
  const res = await fetch(`${EXECUTOR_BASE_URL}/pair`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Pairing failed");
  }
}

export async function fetchPreview(
  config: ProjectSetupConfig,
  token: string
): Promise<PlanResult> {
  const res = await fetch(`${EXECUTOR_BASE_URL}/preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ config }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Preview failed");
  }
  const data = (await res.json()) as { plan: PlanResult };
  return data.plan;
}

export async function startGeneration(
  jobId: string,
  config: ProjectSetupConfig,
  token: string
): Promise<{ executionId: string }> {
  const res = await fetch(`${EXECUTOR_BASE_URL}/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ jobId, config }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Failed to start generation");
  }
  return (await res.json()) as { executionId: string };
}

export async function* streamExecution(
  executionId: string,
  token: string
): AsyncGenerator<LogEvent> {
  const res = await fetch(`${EXECUTOR_BASE_URL}/execute/${executionId}/stream`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok || !res.body) {
    throw new Error("Failed to connect to execution stream");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data: ")) continue;
      try {
        yield JSON.parse(line.slice(6)) as LogEvent;
      } catch {
        /* skip malformed */
      }
    }
  }
}

export async function syncResult(
  jobId: string,
  input: {
    status: "completed" | "failed" | "generating";
    progressPercent?: number;
    currentStep?: string | null;
    logs?: { message: string; level: "info" | "warn" | "error"; timestamp: string }[];
    result?: ProjectSetupResult | null;
    errorMessage?: string | null;
  }
): Promise<void> {
  const res = await fetch(`/api/project-setup/${jobId}/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Sync failed");
  }
}

function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
