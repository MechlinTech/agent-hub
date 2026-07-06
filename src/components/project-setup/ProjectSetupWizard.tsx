"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildDraftPreviewConfig,
  formatProjectSetupValidationError,
  projectSetupConfigSchema,
  projectSetupFieldErrors,
} from "@/lib/project-setup/schemas";
import { z } from "zod";
import {
  checkExecutorHealth,
  fetchPairingToken,
  fetchPreview,
  pairExecutor,
  pickProjectFolder,
  startGeneration,
  streamExecution,
  syncResult,
  type ExecutorStatus,
  type LogEvent,
} from "@/lib/execution-client";
import {
  showBackend,
  showFrontend,
  useProjectSetupStore,
} from "@/stores/project-setup-store";
import { useExecutorSessionStore } from "@/stores/executor-session-store";
import { ExecutorStatusBanner } from "@/components/project-setup/ExecutorStatusBanner";
import { ScopeSelector } from "@/components/project-setup/ScopeSelector";
import { ConfigSectionCards } from "@/components/project-setup/ConfigSectionCards";
import {
  ArchitecturePreviewCard,
  ProjectSummaryCard,
} from "@/components/project-setup/ArchitecturePreviewCard";
import { CommandPreviewCard } from "@/components/project-setup/CommandPreviewCard";
import { GenerationProgress } from "@/components/project-setup/GenerationProgress";
import { ProjectSetupResults } from "@/components/project-setup/ProjectSetupResults";
import type { ProjectSetupResult } from "@/lib/project-setup/types";

const STEPS = ["Configure", "Review", "Generate & Results"];

export function ProjectSetupWizard() {
  const {
    currentStep,
    config,
    plan,
    jobId,
    setConfig,
    setPlan,
    setJobId,
    nextStep,
    prevStep,
  } = useProjectSetupStore();

  const sessionToken = useExecutorSessionStore((s) => s.token);
  const setSessionToken = useExecutorSessionStore((s) => s.setToken);

  const [executorStatus, setExecutorStatus] = useState<ExecutorStatus | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [result, setResult] = useState<ProjectSetupResult | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const refreshHealth = useCallback(async () => {
    const status = await checkExecutorHealth();
    setExecutorStatus(status);
  }, []);

  useEffect(() => {
    refreshHealth();
    const t = setInterval(refreshHealth, 10000);
    return () => clearInterval(t);
  }, [refreshHealth]);

  const executorReady = Boolean(
    executorStatus?.connected && executorStatus?.paired,
  );

  useEffect(() => {
    if (currentStep !== 1 || !executorReady) return;

    const timer = window.setTimeout(async () => {
      try {
        const previewConfig = buildDraftPreviewConfig(config);
        let token = sessionToken;
        if (!token) {
          token = await fetchPairingToken({ version: executorStatus?.version });
          setSessionToken(token);
        }
        const preview = await fetchPreview(previewConfig, token);
        setPlan(preview);
      } catch {
        setPlan(null);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [
    config,
    currentStep,
    executorReady,
    sessionToken,
    setPlan,
    setSessionToken,
  ]);

  async function ensureToken(): Promise<string> {
    const token =
      sessionToken ??
      (await fetchPairingToken({ version: executorStatus?.version }));
    setSessionToken(token);
    await pairExecutor(token);
    await refreshHealth();
    return token;
  }

  async function pickLocationFolder(): Promise<string | null> {
    const token = await ensureToken();
    return pickProjectFolder(token, document.title);
  }

  async function loadPreview() {
    const parsed = projectSetupConfigSchema.safeParse(config);
    if (!parsed.success) {
      setFieldErrors(projectSetupFieldErrors(parsed.error));
      throw parsed.error;
    }
    setFieldErrors({});
    const token = await ensureToken();
    const preview = await fetchPreview(parsed.data, token);
    setPlan(preview);
  }

  async function handleNext() {
    setError(null);
    if (currentStep === 1) {
      setLoading(true);
      try {
        await loadPreview();
        nextStep();
      } catch (e) {
        setError(formatProjectSetupValidationError(e));
        if (e instanceof z.ZodError) {
          setFieldErrors(projectSetupFieldErrors(e));
        }
      } finally {
        setLoading(false);
      }
      return;
    }
    if (currentStep === 2) {
      nextStep();
    }
  }

  async function handleRunAgent() {
    setError(null);
    setRunning(true);
    setEvents([]);
    setLogLines([]);
    setResult(null);

    try {
      projectSetupConfigSchema.parse(config);
      const token = await ensureToken();

      let id = jobId;
      if (!id) {
        const createRes = await fetch("/api/project-setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config }),
        });
        const createData = await createRes.json();
        if (!createRes.ok)
          throw new Error(createData.error || "Failed to save setup");
        id = createData.id as string;
        setJobId(id);
      }

      await syncResult(id!, {
        status: "generating",
        progressPercent: 0,
        currentStep: "Starting",
      });

      const { executionId } = await startGeneration(id!, config, token);
      let finalResult: ProjectSetupResult | null = null;
      let failed = false;
      const collectedLogs: string[] = [];

      for await (const event of streamExecution(executionId, token)) {
        setEvents((prev) => [...prev, event]);
        if (event.message) {
          collectedLogs.push(event.message);
          setLogLines((prev) => [...prev, event.message!]);
        }
        if (event.type === "complete") {
          if (event.result) finalResult = event.result as ProjectSetupResult;
          if (event.error) {
            failed = true;
            setError(event.error);
          }
        }
      }

      if (finalResult) {
        setResult(finalResult);
        await syncResult(id!, {
          status: "completed",
          progressPercent: 100,
          currentStep: "Completed",
          result: finalResult,
          logs: collectedLogs.map((message) => ({
            message,
            level: "info" as const,
            timestamp: new Date().toISOString(),
          })),
        });
      } else if (failed) {
        await syncResult(id!, {
          status: "failed",
          errorMessage: error ?? "Generation failed",
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      setError(msg);
      if (jobId) {
        await syncResult(jobId, { status: "failed", errorMessage: msg }).catch(
          () => {},
        );
      }
    } finally {
      setRunning(false);
    }
  }

  const canRun =
    executorStatus?.connected &&
    executorStatus?.paired &&
    !running &&
    currentStep >= 2;

  return (
    <div className="pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">New project setup</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure, review, and generate on your machine.
        </p>
      </div>

      {executorStatus ? <ExecutorStatusBanner status={executorStatus} /> : null}

      <div className="mb-6 flex gap-2">
        {STEPS.map((label, i) => {
          const stepNum = (i + 1) as 1 | 2 | 3;
          const active = currentStep === stepNum;
          const done = currentStep > stepNum;
          return (
            <div
              key={label}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-center text-xs font-medium sm:text-sm",
                active && "border-brand-300 bg-brand-50 text-brand-800",
                done &&
                  !active &&
                  "border-slate-200 bg-slate-50 text-slate-600",
                !active && !done && "border-slate-100 text-slate-400",
              )}
            >
              {i + 1}. {label}
            </div>
          );
        })}
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {currentStep === 1 ? (
            <>
              <ScopeSelector
                value={config.projectScope}
                onChange={(projectScope) => setConfig({ projectScope })}
              />
              <ConfigSectionCards
                config={config}
                onChange={(partial) => {
                  setFieldErrors({});
                  setConfig(partial);
                }}
                showFrontend={showFrontend(config.projectScope)}
                showBackend={showBackend(config.projectScope)}
                fieldErrors={fieldErrors}
                onBrowseFolder={pickLocationFolder}
              />
            </>
          ) : null}

          {currentStep === 2 && plan ? (
            <div className="space-y-4">
              <ArchitecturePreviewCard plan={plan} />
              <CommandPreviewCard plan={plan} />
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-4">
              {result ? (
                <ProjectSetupResults result={result} />
              ) : (
                <GenerationProgress
                  events={events}
                  logLines={logLines}
                  running={running}
                />
              )}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <ProjectSummaryCard config={config} />
          <ArchitecturePreviewCard plan={plan} />
          <CommandPreviewCard plan={plan} executorReady={executorReady} />
        </div>
      </div>

      <div className="wizard-action-bar">
        <div className="wizard-action-bar-inner">
          <button
            type="button"
            className="btn-secondary px-5 py-2"
            disabled={currentStep === 1 || running}
            onClick={prevStep}
          >
            Back
          </button>
          <div className="flex gap-2">
            {currentStep < 3 ? (
              <button
                type="button"
                className="btn-primary inline-flex items-center gap-2 px-5 py-2"
                disabled={loading}
                onClick={handleNext}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Next
              </button>
            ) : null}
            {currentStep >= 2 && !result ? (
              <button
                type="button"
                className="btn-primary inline-flex items-center gap-2 px-5 py-2"
                disabled={!canRun}
                onClick={handleRunAgent}
              >
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Run Agent
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
