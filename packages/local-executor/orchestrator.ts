import fs from "fs/promises";
import { randomUUID } from "crypto";
import type { ProjectSetupConfig, ProjectSetupResult } from "@/lib/project-setup/types";
import { projectSetupConfigSchema } from "@/lib/project-setup/schemas";
import { buildPlan } from "@/lib/project-setup/planner";
import { writeProjectFiles } from "@/lib/project-setup/generator";
import { validateConfigPaths } from "@/lib/execution/sanitize";
import { runCommandPlan, type ExecutionLogEvent } from "@/lib/execution/execution-service";

export interface OrchestratorCallbacks {
  onEvent: (event: ExecutionLogEvent) => void;
}

export async function runProjectGeneration(
  config: ProjectSetupConfig,
  callbacks: OrchestratorCallbacks
): Promise<ProjectSetupResult> {
  const start = Date.now();
  const parsed = projectSetupConfigSchema.parse(config);
  const projectRoot = validateConfigPaths(parsed);

  try {
    await fs.mkdir(projectRoot, { recursive: true });
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code !== "EEXIST") throw e;
  }

  const plan = buildPlan(parsed);

  const preCommands = plan.commands.filter((c) => c.phase === "pre");
  const postCommands = plan.commands.filter((c) => c.phase !== "pre");

  let executedCommands: string[] = [];
  let logs: string[] = [];

  if (preCommands.length > 0) {
    const pre = await runCommandPlan(preCommands, projectRoot, {
      onEvent: callbacks.onEvent,
    });
    executedCommands = pre.executedCommands;
    logs = pre.logs;
  }

  const preFiles = plan.files.filter((f) => f.writePhase !== "post");
  const postFiles = plan.files.filter((f) => f.writePhase === "post");

  let generatedFiles = await writeProjectFiles(parsed, preFiles);

  if (postCommands.length > 0) {
    const post = await runCommandPlan(postCommands, projectRoot, {
      onEvent: callbacks.onEvent,
    });
    executedCommands = [...executedCommands, ...post.executedCommands];
    logs = [...logs, ...post.logs];
  }

  if (postFiles.length > 0) {
    const postWritten = await writeProjectFiles(parsed, postFiles);
    generatedFiles = [...generatedFiles, ...postWritten];
  }

  const durationMs = Date.now() - start;
  const duration = formatDuration(durationMs);

  return {
    success: true,
    projectName: parsed.projectName,
    location: projectRoot,
    generatedFiles,
    executedCommands,
    logs,
    duration,
  };
}

export function previewPlan(config: ProjectSetupConfig) {
  const parsed = projectSetupConfigSchema.parse(config);
  validateConfigPaths(parsed);
  return buildPlan(parsed);
}

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return min > 0 ? `${min}m ${rem}s` : `${sec}s`;
}

export function createExecutionId(): string {
  return randomUUID();
}
