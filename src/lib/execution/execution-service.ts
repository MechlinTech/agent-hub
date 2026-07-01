import { spawn, type ChildProcess } from "child_process";
import type { CommandStep } from "@/lib/project-setup/types";

const WIN_CMD_WRAPPERS = new Set(["npm", "npx", "yarn", "pnpm", "corepack"]);

function isWindowsCmdWrapper(exe: string): boolean {
  if (process.platform !== "win32") return false;
  const base = exe.replace(/\.(cmd|exe|bat)$/i, "").toLowerCase();
  return WIN_CMD_WRAPPERS.has(base);
}

/** Quote a single argument for cmd.exe when using shell: true. */
function quoteForCmd(arg: string): string {
  if (!/[\s"&|<>^()%!]/.test(arg)) return arg;
  return `"${arg.replace(/"/g, '""')}"`;
}

function formatShellCommand(exe: string, args: string[]): string {
  return [exe, ...args.map(quoteForCmd)].join(" ");
}

function spawnStepProcess(step: CommandStep, cwd: string): ChildProcess {
  const options = {
    cwd,
    windowsHide: true,
    env: step.env ? { ...process.env, ...step.env } : process.env,
  };
  const useShell = Boolean(step.allowShell);
  const winPackageManager = isWindowsCmdWrapper(step.exe);

  // Windows .cmd shims (npm/npx) need shell:true — direct spawn yields ENOENT or EINVAL.
  if (winPackageManager || (useShell && process.platform === "win32")) {
    return spawn(formatShellCommand(step.exe, step.args), [], {
      ...options,
      shell: true,
    });
  }

  return spawn(step.exe, step.args, { ...options, shell: false });
}

export interface ExecutionLogEvent {
  type: "log" | "step_start" | "step_done" | "step_error" | "done" | "error";
  stepId?: string;
  label?: string;
  message?: string;
  stream?: "stdout" | "stderr";
  success?: boolean;
  exitCode?: number | null;
}

export interface RunCommandPlanOptions {
  onEvent: (event: ExecutionLogEvent) => void;
  signal?: AbortSignal;
}

export async function runCommandPlan(
  steps: CommandStep[],
  projectRoot: string,
  options: RunCommandPlanOptions
): Promise<{ executedCommands: string[]; logs: string[] }> {
  const executedCommands: string[] = [];
  const logs: string[] = [];

  for (const step of steps) {
    if (options.signal?.aborted) {
      throw new Error("Execution aborted");
    }

    options.onEvent({ type: "step_start", stepId: step.id, label: step.label });
    const cmdLabel = `${step.exe} ${step.args.join(" ")}`.trim();
    executedCommands.push(cmdLabel);
    logs.push(`> ${step.label}: ${cmdLabel}`);

    const exitCode = await new Promise<number | null>((resolve, reject) => {
      const cwd = step.cwd ?? projectRoot;
      const timeoutMs = step.timeoutMs ?? 600_000;

      const child = spawnStepProcess(step, cwd);
      const timer = setTimeout(() => {
        child.kill("SIGTERM");
        reject(new Error(`Timed out: ${step.label}`));
      }, timeoutMs);

      const onAbort = () => {
        child.kill("SIGTERM");
        reject(new Error("Aborted"));
      };
      options.signal?.addEventListener("abort", onAbort);

      child.stdout?.on("data", (buf: Buffer) => {
        for (const line of buf.toString("utf8").split(/\r?\n/)) {
          if (!line.trim()) continue;
          logs.push(line);
          options.onEvent({
            type: "log",
            stepId: step.id,
            message: line,
            stream: "stdout",
          });
        }
      });

      child.stderr?.on("data", (buf: Buffer) => {
        for (const line of buf.toString("utf8").split(/\r?\n/)) {
          if (!line.trim()) continue;
          logs.push(line);
          options.onEvent({
            type: "log",
            stepId: step.id,
            message: line,
            stream: "stderr",
          });
        }
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        options.signal?.removeEventListener("abort", onAbort);
        reject(err);
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        options.signal?.removeEventListener("abort", onAbort);
        resolve(code);
      });
    });

    if (exitCode !== 0) {
      options.onEvent({
        type: "step_error",
        stepId: step.id,
        label: step.label,
        exitCode,
        message: `Exit code ${exitCode}`,
      });
      throw new Error(`Step failed (${step.label}): exit code ${exitCode}`);
    }

    options.onEvent({ type: "step_done", stepId: step.id, label: step.label });
  }

  options.onEvent({ type: "done", success: true });
  return { executedCommands, logs };
}
