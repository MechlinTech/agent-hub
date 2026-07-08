"use client";

import { EXECUTOR_BASE_URL } from "@/lib/project-setup/defaults";
import type { PlanResult, ProjectSetupConfig, ProjectSetupResult } from "@/lib/project-setup/types";

export interface ExecutorStatus {
  ok: boolean;
  connected: boolean;
  paired: boolean;
  version: string | null;
  latestVersion: string | null;
  updateAvailable: boolean;
  downloadAvailable: boolean;
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

export async function fetchLatestExecutorRelease(): Promise<{
  version: string | null;
  hasDownload: boolean;
  name: string | null;
}> {
  try {
    const res = await fetch("/api/executor/version", { method: "GET" });
    if (!res.ok) {
      return { version: null, hasDownload: false, name: null };
    }
    const data = (await res.json()) as {
      version?: string;
      hasDownload?: boolean;
      name?: string | null;
    };
    return {
      version: data.version?.trim() || null,
      hasDownload: Boolean(data.hasDownload),
      name: data.name ?? null,
    };
  } catch {
    return { version: null, hasDownload: false, name: null };
  }
}

export async function checkExecutorHealth(): Promise<ExecutorStatus> {
  const release = await fetchLatestExecutorRelease();

  const disconnected: ExecutorStatus = {
    ok: false,
    connected: false,
    paired: false,
    version: null,
    latestVersion: release.version,
    updateAvailable: false,
    downloadAvailable: release.hasDownload,
  };

  try {
    const res = await fetch(`${EXECUTOR_BASE_URL}/health`, { method: "GET" });
    if (!res.ok) return disconnected;

    const data = (await res.json()) as {
      ok: boolean;
      version?: string;
      paired?: boolean;
    };
    const version = data.version?.trim() || null;
    const latestVersion = release.version;
    const updateAvailable = Boolean(
      isKnownExecutorVersion(version) &&
        isKnownExecutorVersion(latestVersion) &&
        normalizeVersion(version) !== normalizeVersion(latestVersion),
    );

    return {
      ok: data.ok,
      connected: true,
      paired: Boolean(data.paired),
      version,
      latestVersion,
      updateAvailable,
      downloadAvailable: release.hasDownload,
    };
  } catch {
    return disconnected;
  }
}

async function resolveExecutorVersion(version?: string | null): Promise<string | null> {
  const normalized = version?.trim().replace(/^v/i, "") || null;
  if (isKnownExecutorVersion(normalized)) return normalized;

  try {
    const res = await fetch(`${EXECUTOR_BASE_URL}/health`, { method: "GET" });
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string };
    const healthVersion = data.version?.trim().replace(/^v/i, "") || null;
    return isKnownExecutorVersion(healthVersion) ? healthVersion : null;
  } catch {
    return null;
  }
}

export async function fetchPairingToken(options?: {
  version?: string | null;
}): Promise<string> {
  const version = await resolveExecutorVersion(options?.version);
  const res = await fetch("/api/settings/executor-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ version }),
  });
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

export async function pickProjectFolder(
  token: string,
  windowTitle?: string
): Promise<string | null> {
  const res = await fetch(`${EXECUTOR_BASE_URL}/pick-folder`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      windowTitle: windowTitle ?? (typeof document !== "undefined" ? document.title : undefined),
    }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Failed to pick folder");
  }
  const data = (await res.json()) as { path?: string; cancelled?: boolean };
  if (data.cancelled || !data.path) return null;
  return data.path;
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

function normalizeVersion(version: string): string {
  return version.trim().replace(/^v/i, "");
}

function isKnownExecutorVersion(version: string | null | undefined): version is string {
  return Boolean(version && version !== "unknown");
}
