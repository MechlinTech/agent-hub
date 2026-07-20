import { spawn } from "child_process";
import path from "path";
import { assertUnderAllowedRoots } from "../../src/lib/execution/sanitize";

// CJS bundle (desktop) and tsx (dev) both provide __filename.
const moduleDir = path.dirname(__filename);

function resolveWindowsPickerScript(): string {
  if (process.env.AGENTHUB_PICKER_SCRIPT?.trim()) {
    return process.env.AGENTHUB_PICKER_SCRIPT.trim();
  }
  return path.join(moduleDir, "pick-folder-windows.ps1");
}

function runCommand(
  exe: string,
  args: string[],
  options: { windowsHide?: boolean } = {}
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, {
      windowsHide: options.windowsHide ?? true,
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ stdout, stderr, code }));
  });
}

function parsePickerResult(
  stdout: string,
  code: number | null
): string | null | "failed" {
  const picked = stdout.trim();
  if (code === 0 && picked) return picked;
  if (code === 1 && !picked) return null;
  return "failed";
}

export type PickNativeFolderOptions = {
  /** Browser tab title - used to find the window that should own the picker. */
  windowTitle?: string;
};

async function pickWindowsFolder(
  options: PickNativeFolderOptions = {}
): Promise<string | null> {
  const titleArg = options.windowTitle?.trim() || "Agent Hub";
  const { stdout, code, stderr } = await runCommand(
    "powershell.exe",
    [
      "-NoProfile",
      "-STA",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      resolveWindowsPickerScript(),
      "-WindowTitle",
      titleArg,
    ],
    { windowsHide: true }
  );

  const result = parsePickerResult(stdout, code);
  if (result === "failed") {
    const detail = stderr.trim() || stdout.trim();
    throw new Error(
      detail ? `Folder picker failed: ${detail}` : "Folder picker failed"
    );
  }
  return result;
}

async function pickMacFolder(): Promise<string | null> {
  const { stdout, code } = await runCommand("osascript", [
    "-e",
    'POSIX path of (choose folder with prompt "Select project location")',
  ]);
  const picked = stdout.trim();
  if (code === 0 && picked) return picked.replace(/\/$/, "");
  if (code === 1) return null;
  throw new Error("Folder picker failed");
}

async function pickLinuxFolder(): Promise<string | null> {
  try {
    const { stdout, code } = await runCommand("zenity", [
      "--file-selection",
      "--directory",
      "--title=Select project location",
    ]);
    const picked = stdout.trim();
    if (code === 0 && picked) return picked;
    if (code === 1) return null;
  } catch {
    /* zenity missing */
  }
  throw new Error("Native folder picker is not available on this system");
}

export async function pickNativeFolder(
  options: PickNativeFolderOptions = {}
): Promise<string | null> {
  let picked: string | null = null;
  if (process.platform === "win32") {
    picked = await pickWindowsFolder(options);
  } else if (process.platform === "darwin") {
    picked = await pickMacFolder();
  } else {
    picked = await pickLinuxFolder();
  }

  if (!picked) return null;

  const resolved = path.resolve(picked.trim());
  assertUnderAllowedRoots(resolved);
  return resolved;
}
